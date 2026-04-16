import React, { useEffect, useMemo, useState } from 'react';
import {
  clearAuthToken,
  fetchCurrentSession,
  fetchEmployeeHistory,
  fetchEmployees,
  getAuthToken,
  login,
  regenerateQrCode,
  submitScan
} from '../lib/api';
import { BadgeView } from '../modules/badge/BadgeView';
import { HistoryView } from '../modules/history/HistoryView';
import { TeamOverviewView } from '../modules/team/TeamOverviewView';
import { buildTeamEntries } from '../shared/employee/presentation';
import { formatClockTime } from '../shared/formatters/dateTime';
import '../shared/styles/ui.css';
import './app.css';

export function App({ initialEmployees }) {
  const [sessionUser, setSessionUser] = useState(null);
  const [employees, setEmployees] = useState(initialEmployees);
  const [feedback, setFeedback] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [regeneratingId, setRegeneratingId] = useState(null);
  const [activeTab, setActiveTab] = useState('badge');
  const [authStatus, setAuthStatus] = useState(initialEmployees.length > 0 ? 'authenticated' : 'idle');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [currentEmployeeId, setCurrentEmployeeId] = useState(initialEmployees[0]?.id ?? null);
  const [lastClockEvent, setLastClockEvent] = useState(null);
  const [historyData, setHistoryData] = useState({
    summary: { weekMinutes: 0, activeSessionMinutes: null },
    entries: []
  });

  const isRestrictedEmployeeView = Boolean(sessionUser) && sessionUser.role !== 'admin';
  const teamEntries = useMemo(() => buildTeamEntries(employees), [employees]);
  const visibleTeamEntries = useMemo(() => {
    if (!isRestrictedEmployeeView) {
      return teamEntries;
    }

    return teamEntries.filter((employee) => employee.id === sessionUser.employeeId);
  }, [isRestrictedEmployeeView, sessionUser, teamEntries]);
  const currentEmployee =
    visibleTeamEntries.find((employee) => employee.id === currentEmployeeId) ?? visibleTeamEntries[0] ?? null;
  const checkedInCount = teamEntries.filter((employee) => employee.status === 'checked_in').length;
  const checkedOutCount = teamEntries.length - checkedInCount;

  useEffect(() => {
    if (initialEmployees.length > 0) {
      return;
    }

    const token = getAuthToken();

    if (!token) {
      setAuthStatus('unauthenticated');
      return;
    }

    bootstrapAuthenticatedApp().catch((error) => {
      handleAuthError(error);
    });
    // initialEmployees is intentionally used as a one-time preload signal.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAuthError = (error) => {
    if (error?.status === 401) {
      clearAuthToken();
      setSessionUser(null);
      setEmployees([]);
      setCurrentEmployeeId(null);
      setHistoryData({
        summary: { weekMinutes: 0, activeSessionMinutes: null },
        entries: []
      });
      setLastClockEvent(null);
      setFeedback(null);
      setAuthStatus('unauthenticated');
      return;
    }

    setFeedback({
      kind: 'error',
      message: error.message
    });
  };

  const applyEmployeeVisibility = (nextEmployees, viewer = sessionUser) => {
    if (!viewer || viewer.role === 'admin') {
      return nextEmployees;
    }

    return nextEmployees.filter((employee) => employee.id === viewer.employeeId);
  };

  const refreshEmployees = async (preferredEmployeeId = currentEmployeeId, viewer = sessionUser) => {
    const nextEmployees = fetchEmployees ? await fetchEmployees() : [];
    const visibleEmployees = applyEmployeeVisibility(nextEmployees, viewer);
    setEmployees(visibleEmployees);
    const selectedEmployeeId = visibleEmployees.some((employee) => employee.id === preferredEmployeeId)
      ? preferredEmployeeId
      : (visibleEmployees[0]?.id ?? null);

    setCurrentEmployeeId(selectedEmployeeId);

    if (selectedEmployeeId) {
      await loadEmployeeHistory(selectedEmployeeId);
    }

    return { nextEmployees: visibleEmployees, selectedEmployeeId };
  };

  const loadEmployeeHistory = async (employeeId) => {
    const response = await fetchEmployeeHistory(employeeId);
    setHistoryData({
      summary: response.summary,
      entries: response.entries
    });

    return response;
  };

  const bootstrapAuthenticatedApp = async (preferredEmployeeId = null) => {
    setAuthStatus('loading');
    const session = await fetchCurrentSession();
    setSessionUser(session.user);
    await refreshEmployees(preferredEmployeeId ?? session.employee?.id ?? session.user.employeeId ?? null, session.user);
    setAuthStatus('authenticated');
  };

  const handleLoginSubmit = async ({ email, password }) => {
    setIsLoggingIn(true);
    setFeedback(null);

    try {
      const result = await login({ email, password });
      setSessionUser(result.user);
      await bootstrapAuthenticatedApp(result.user.employeeId);
      setFeedback({
        kind: 'success',
        message: `Ingelogd als ${result.user.name}.`
      });
    } catch (error) {
      clearAuthToken();
      setAuthStatus('unauthenticated');
      setFeedback({
        kind: 'error',
        message: error.message
      });
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    clearAuthToken();
    setSessionUser(null);
    setEmployees([]);
    setCurrentEmployeeId(null);
    setLastClockEvent(null);
    setFeedback(null);
    setHistoryData({
      summary: { weekMinutes: 0, activeSessionMinutes: null },
      entries: []
    });
    setAuthStatus('unauthenticated');
  };

  const handleEmployeeChange = async (employeeId) => {
    setCurrentEmployeeId(employeeId);

    try {
      await loadEmployeeHistory(employeeId);
    } catch (error) {
      setFeedback({
        kind: 'error',
        message: error.message
      });
    }
  };

  const handleClock = async (code) => {
    setIsSubmitting(true);

    try {
      const result = await submitScan(code);
      const location = result.employee.profile.location;
      const event = {
        action: result.action,
        employeeName: result.employee.name,
        timestamp: result.timestamp,
        location
      };

      setLastClockEvent(event);
      setFeedback({
        kind: 'success',
        message:
          result.action === 'checked_in'
            ? `${result.employee.name} is ingeklokt om ${formatClockTime(result.timestamp)}.`
            : `${result.employee.name} is uitgeklokt om ${formatClockTime(result.timestamp)}.`
      });
      setActiveTab(isRestrictedEmployeeView ? 'badge' : 'history');
      await refreshEmployees();
      await loadEmployeeHistory(result.employee.id);
    } catch (error) {
      handleAuthError(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegenerateClick = async (employeeId) => {
    setRegeneratingId(employeeId);

    try {
      const result = await regenerateQrCode(employeeId);
      setFeedback({
        kind: 'success',
        message: `Nieuwe badgecode voor ${result.employee.name}: ${result.employee.qrCode}`
      });
      await refreshEmployees();
    } catch (error) {
      handleAuthError(error);
    } finally {
      setRegeneratingId(null);
    }
  };

  if (authStatus !== 'authenticated') {
    return (
      <div className="page-shell app-shell auth-shell">
        <section className="panel auth-panel">
          <div className="auth-brand">
            <div className="brand-mark" aria-hidden="true">
              TS
            </div>
            <div>
              <p className="eyebrow">TimeSignal</p>
              <h1 className="app-title">Badge clocking demo</h1>
              <p className="app-subtitle">
                Log in met een demo-account om direct de klokflow, historie en teamstatus te bekijken.
              </p>
            </div>
          </div>

          {feedback ? (
            <div className={`feedback feedback-${feedback.kind}`} role="status" aria-live="polite">
              {feedback.message}
            </div>
          ) : null}

          <div className="auth-grid">
            <form
              className="auth-form"
              onSubmit={(event) => {
                event.preventDefault();
                const formData = new FormData(event.currentTarget);
                handleLoginSubmit({
                  email: String(formData.get('email') ?? ''),
                  password: String(formData.get('password') ?? '')
                });
              }}
            >
              <label className="auth-field">
                <span className="detail-label">E-mailadres</span>
                <input
                  className="auth-input"
                  name="email"
                  type="email"
                  autoComplete="username"
                  placeholder="bob.admin@timesignal.demo"
                  defaultValue="bob.admin@timesignal.demo"
                />
              </label>
              <label className="auth-field">
                <span className="detail-label">Wachtwoord</span>
                <input
                  className="auth-input"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="Admin123!"
                  defaultValue="Admin123!"
                />
              </label>
              <button type="submit" className="primary-button" disabled={isLoggingIn || authStatus === 'loading'}>
                {isLoggingIn || authStatus === 'loading' ? 'Bezig...' : 'Inloggen'}
              </button>
            </form>

            <aside className="auth-demo-card">
              <p className="detail-label">Demo-accounts</p>
              <div className="auth-demo-list">
                <button
                  type="button"
                  className="secondary-button auth-demo-button"
                  onClick={() => handleLoginSubmit({ email: 'bob.admin@timesignal.demo', password: 'Admin123!' })}
                  disabled={isLoggingIn || authStatus === 'loading'}
                >
                  <strong>Admin</strong>
                  <span>bob.admin@timesignal.demo / Admin123!</span>
                </button>
                <button
                  type="button"
                  className="secondary-button auth-demo-button"
                  onClick={() => handleLoginSubmit({ email: 'alice@timesignal.demo', password: 'User123!' })}
                  disabled={isLoggingIn || authStatus === 'loading'}
                >
                  <strong>Gebruiker</strong>
                  <span>alice@timesignal.demo / User123!</span>
                </button>
              </div>
              <p className="panel-copy">
                Gebruik admin voor teambeheer en badge-rotatie. Gebruik medewerker voor de gewone badge- en historieflow.
              </p>
            </aside>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="page-shell app-shell">
      <header className="app-header">
        <div className="app-brand">
          <div className="brand-mark" aria-hidden="true">
            TS
          </div>
          <div>
            <p className="eyebrow">TimeSignal</p>
            <h1 className="app-title">Badge clocking demo</h1>
            <p className="app-subtitle">Compacte klokervaring voor medewerker, historie en teamzicht.</p>
          </div>
        </div>
        <div className="header-actions">
          <div className="header-session">
            <span className={`live-dot ${currentEmployee?.status === 'checked_in' ? 'live-dot-active' : ''}`} />
            <div>
              <p className="header-label">
                {currentEmployee?.status === 'checked_in' ? 'Actieve sessie' : 'Niet ingeklokt'}
              </p>
              <p className="header-value">{currentEmployee?.lastActionTime ?? '--:--'}</p>
            </div>
          </div>
          {initialEmployees.length === 0 ? (
            <button type="button" className="secondary-button header-logout" onClick={handleLogout}>
              Uitloggen
            </button>
          ) : null}
        </div>
      </header>

      {feedback ? (
        <div className={`feedback feedback-${feedback.kind}`} role="status" aria-live="polite">
          {feedback.message}
        </div>
      ) : null}

      {!isRestrictedEmployeeView ? (
        <nav className="bottom-nav" aria-label="Hoofdnavigatie">
          <button
            type="button"
            className={activeTab === 'badge' ? 'nav-button nav-button-active' : 'nav-button'}
            onClick={() => setActiveTab('badge')}
          >
            Mijn badge
          </button>
          <button
            type="button"
            className={activeTab === 'history' ? 'nav-button nav-button-active' : 'nav-button'}
            onClick={() => setActiveTab('history')}
          >
            Historie
          </button>
          <button
            type="button"
            className={activeTab === 'team' ? 'nav-button nav-button-active' : 'nav-button'}
            onClick={() => setActiveTab('team')}
          >
            Teamoverzicht
          </button>
        </nav>
      ) : null}

      <main className="layout">
        {activeTab === 'badge' || isRestrictedEmployeeView ? (
          <BadgeView
            currentEmployee={currentEmployee}
            employees={visibleTeamEntries}
            isSubmitting={isSubmitting}
            isRestricted={isRestrictedEmployeeView}
            onClock={handleClock}
            onEmployeeChange={handleEmployeeChange}
          />
        ) : null}

        {!isRestrictedEmployeeView && activeTab === 'history' ? (
          <HistoryView
            currentEmployee={currentEmployee}
            historyEntries={historyData.entries}
            summary={historyData.summary}
            lastClockEvent={lastClockEvent}
            onDismissResult={() => setLastClockEvent(null)}
          />
        ) : null}

        {!isRestrictedEmployeeView && activeTab === 'team' ? (
          <TeamOverviewView
            employees={teamEntries}
            checkedInCount={checkedInCount}
            checkedOutCount={checkedOutCount}
            regeneratingId={regeneratingId}
            onRefresh={refreshEmployees}
            onRegenerate={handleRegenerateClick}
          />
        ) : null}
      </main>
    </div>
  );
}
