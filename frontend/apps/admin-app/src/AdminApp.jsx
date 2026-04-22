import React, { useEffect, useMemo, useState } from 'react';
import { AuthShell } from '../../../shared/ui/AuthShell';
import { Feedback } from '../../../shared/ui/Feedback';
import {
  clearAuthToken,
  getAuthToken,
  getEmployeeHistory,
  getEmployees,
  login,
  me,
  regenerateQrCode
} from '../../../shared/api/client';
import { subscribeToTopics } from '../../../shared/api/mercure';
import { buildTeamEntries } from '../../../shared/utils/employee';
import { formatDateTime } from '../../../shared/utils/dateTime';
import { TeamOverviewView } from './TeamOverviewView';
import { HistoryView } from './HistoryView';

const EMPTY_HISTORY = {
  summary: {
    weekMinutes: 0,
    activeSessionMinutes: null
  },
  entries: []
};

const MAX_ACTIVITY_ITEMS = 6;

const DEMO_ACCOUNTS = [
  {
    label: 'Admin',
    email: 'bob.admin@timesignal.demo',
    password: 'Admin123!'
  }
];

export function AdminApp() {
  const [authStatus, setAuthStatus] = useState('idle');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [sessionUser, setSessionUser] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [currentEmployeeId, setCurrentEmployeeId] = useState(null);
  const [historyData, setHistoryData] = useState(EMPTY_HISTORY);
  const [feedback, setFeedback] = useState(null);
  const [regeneratingId, setRegeneratingId] = useState(null);
  const [activeTab, setActiveTab] = useState('team');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);

  const teamEntries = useMemo(() => buildTeamEntries(employees), [employees]);
  const currentEmployee = teamEntries.find((employee) => employee.id === currentEmployeeId) ?? teamEntries[0] ?? null;
  const checkedInCount = teamEntries.filter((employee) => employee.status === 'checked_in').length;
  const checkedOutCount = teamEntries.length - checkedInCount;

  useEffect(() => {
    if (!getAuthToken()) {
      setAuthStatus('unauthenticated');
      return;
    }

    bootstrap().catch(handleAuthError);
  }, []);

  useEffect(() => {
    if (authStatus !== 'authenticated' || 0 === employees.length) {
      return undefined;
    }

    return subscribeToTopics(
      employees.map((employee) => `/employees/${employee.id}`),
      {
        onMessage: (payload) => {
          if (!payload?.employee?.id) {
            return;
          }

          setEmployees((currentEmployees) => currentEmployees.map((employee) => (
            employee.id === payload.employee.id ? payload.employee : employee
          )));

          if (currentEmployeeId === payload.employee.id && payload.history) {
            setHistoryData({
              summary: payload.history.summary,
              entries: payload.history.entries
            });
          }

          if (payload.activity) {
            setRecentActivity((currentActivity) => {
              const nextActivity = [payload.activity, ...currentActivity.filter((entry) => entry.id !== payload.activity.id)];

              return nextActivity.slice(0, MAX_ACTIVITY_ITEMS);
            });
          }

          setLastRefreshedAt(new Date().toISOString());
        }
      }
    );
  }, [authStatus, currentEmployeeId, employees]);

  async function bootstrap(preferredEmployeeId = null) {
    setAuthStatus('loading');
    const session = await me();
    setSessionUser(session.user);
    await refreshEmployees(preferredEmployeeId ?? currentEmployeeId ?? session.user.employeeId ?? null);
    setAuthStatus('authenticated');
  }

  async function refreshEmployees(preferredEmployeeId = null) {
    setIsRefreshing(true);

    const nextEmployees = await getEmployees();
    setEmployees(nextEmployees);
    const selectedEmployeeId = nextEmployees.some((employee) => employee.id === preferredEmployeeId)
      ? preferredEmployeeId
      : (nextEmployees[0]?.id ?? null);

    setCurrentEmployeeId(selectedEmployeeId);

    if (selectedEmployeeId) {
      await loadEmployeeHistory(selectedEmployeeId);
    } else {
      setHistoryData(EMPTY_HISTORY);
    }

    setLastRefreshedAt(new Date().toISOString());
    setIsRefreshing(false);

    return nextEmployees;
  }

  async function loadEmployeeHistory(employeeId) {
    const history = await getEmployeeHistory(employeeId);
    setHistoryData({
      summary: history.summary,
      entries: history.entries
    });
  }

  function handleAuthError(error) {
    if (error?.status === 401) {
      clearAuthToken();
      setSessionUser(null);
      setEmployees([]);
      setCurrentEmployeeId(null);
      setHistoryData(EMPTY_HISTORY);
      setLastRefreshedAt(null);
      setRecentActivity([]);
      setAuthStatus('unauthenticated');
    }

    setIsRefreshing(false);

    setFeedback({
      kind: 'error',
      message: error.message
    });
  }

  async function handleLoginSubmit({ email, password }) {
    setIsLoggingIn(true);
    setFeedback(null);

    try {
      const result = await login({ email, password });
      setSessionUser(result.user);
      await bootstrap(result.user.employeeId);
      setFeedback({
        kind: 'success',
        message: `Ingelogd als ${result.user.name}.`
      });
    } catch (error) {
      handleAuthError(error);
    } finally {
      setIsLoggingIn(false);
    }
  }

  function handleLogout() {
    clearAuthToken();
    setSessionUser(null);
    setEmployees([]);
    setCurrentEmployeeId(null);
    setHistoryData(EMPTY_HISTORY);
    setLastRefreshedAt(null);
    setRecentActivity([]);
    setFeedback(null);
    setAuthStatus('unauthenticated');
  }

  async function handleEmployeeChange(employeeId) {
    setCurrentEmployeeId(employeeId);

    try {
      await loadEmployeeHistory(employeeId);
      setActiveTab('history');
    } catch (error) {
      handleAuthError(error);
    }
  }

  async function handleRefresh() {
    try {
      await refreshEmployees(currentEmployee?.id ?? null);
      setFeedback({
        kind: 'success',
        message: 'Teamstatus ververst.'
      });
    } catch (error) {
      handleAuthError(error);
    }
  }

  async function handleRegenerate(employeeId) {
    setRegeneratingId(employeeId);

    try {
      const result = await regenerateQrCode(employeeId);
      await refreshEmployees(employeeId);
      setFeedback({
        kind: 'success',
        message: `Nieuwe badgecode voor ${result.employee.name}: ${result.employee.qrCode}`
      });
    } catch (error) {
      handleAuthError(error);
    } finally {
      setRegeneratingId(null);
    }
  }

  if (authStatus !== 'authenticated') {
    return (
      <AuthShell
        eyebrow="TimeSignal"
        title="Admin console"
        subtitle="Log in als admin om teamstatus, historie en badgebeheer te openen."
        submitLabel={isLoggingIn || authStatus === 'loading' ? 'Bezig...' : 'Inloggen'}
        isSubmitting={isLoggingIn || authStatus === 'loading'}
        feedback={feedback}
        demoAccounts={DEMO_ACCOUNTS}
        defaultEmail="bob.admin@timesignal.demo"
        defaultPassword="Admin123!"
        onSubmit={handleLoginSubmit}
      />
    );
  }

  return (
    <div className="page-shell admin-shell">
      <section className="app-shell">
        <header className="app-header">
          <div className="app-brand">
            <div className="brand-mark" aria-hidden="true">
              TS
            </div>
            <div>
              <p className="eyebrow">TimeSignal</p>
              <h1 className="app-title">Admin console</h1>
              <p className="app-subtitle">Teamstatus, historie en badgebeheer vanuit een backend-gedreven dashboard.</p>
            </div>
          </div>
          <div className="header-actions">
            <div className="header-session">
              <div>
                <p className="header-label">Ingelogd als</p>
                <p className="header-value">{sessionUser?.name}</p>
              </div>
            </div>
            <button type="button" className="secondary-button header-logout" onClick={handleLogout}>
              Uitloggen
            </button>
          </div>
        </header>

        <Feedback feedback={feedback} />

        <nav className="bottom-nav" aria-label="Admin navigatie">
          <button
            type="button"
            className={activeTab === 'team' ? 'nav-button nav-button-active' : 'nav-button'}
            onClick={() => setActiveTab('team')}
          >
            Team
          </button>
          <button
            type="button"
            className={activeTab === 'history' ? 'nav-button nav-button-active' : 'nav-button'}
            onClick={() => setActiveTab('history')}
          >
            Historie
          </button>
        </nav>

        <main className="layout">
          {activeTab === 'team' ? (
            <TeamOverviewView
              employees={teamEntries}
              checkedInCount={checkedInCount}
              checkedOutCount={checkedOutCount}
              isRefreshing={isRefreshing}
              lastRefreshedLabel={lastRefreshedAt ? formatDateTime(lastRefreshedAt) : 'Nog geen live update'}
              liveModeLabel="Live updates via Mercure"
              recentActivity={recentActivity}
              regeneratingId={regeneratingId}
              selectedEmployeeId={currentEmployee?.id ?? null}
              onRefresh={handleRefresh}
              onRegenerate={handleRegenerate}
              onSelectEmployee={handleEmployeeChange}
            />
          ) : null}

          {activeTab === 'history' ? (
            <HistoryView
              currentEmployee={currentEmployee}
              employees={teamEntries}
              historyEntries={historyData.entries}
              summary={historyData.summary}
              onEmployeeChange={handleEmployeeChange}
            />
          ) : null}
        </main>
      </section>
    </div>
  );
}
