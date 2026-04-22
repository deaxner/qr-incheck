import React, { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { AuthShell } from '../../../shared/ui/AuthShell';
import { Feedback } from '../../../shared/ui/Feedback';
import { subscribeToTopics } from '../../../shared/api/mercure';
import { clearAuthToken, getAuthToken, getMyHistory, getMyStatus, login, me } from '../../../shared/api/client';
import { formatClockTime, formatDate, formatDateTime, formatDuration } from '../../../shared/utils/dateTime';

const DEMO_ACCOUNTS = [
  {
    label: 'Medewerker',
    email: 'alice@timesignal.demo',
    password: 'User123!'
  }
];

const EMPTY_HISTORY = {
  summary: {
    weekMinutes: 0,
    activeSessionMinutes: null
  },
  entries: []
};

export function EmployeeApp() {
  const [authStatus, setAuthStatus] = useState('idle');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [sessionUser, setSessionUser] = useState(null);
  const [employee, setEmployee] = useState(null);
  const [selfStatus, setSelfStatus] = useState(null);
  const [historyData, setHistoryData] = useState(EMPTY_HISTORY);
  const [feedback, setFeedback] = useState(null);
  const [lastRealtimeAt, setLastRealtimeAt] = useState(null);

  useEffect(() => {
    if (!getAuthToken()) {
      setAuthStatus('unauthenticated');
      return;
    }

    bootstrap().catch(handleAuthError);
  }, []);

  useEffect(() => {
    if (authStatus !== 'authenticated' || !employee?.id) {
      return undefined;
    }

    return subscribeToTopics(
      [`/employees/${employee.id}`],
      {
        onMessage: (payload) => {
          if (!payload?.employee?.id || payload.employee.id !== employee.id) {
            return;
          }

          setEmployee((currentEmployee) => ({
            ...currentEmployee,
            ...payload.employee,
            profile: payload.employee.profile ?? currentEmployee?.profile
          }));

          if (payload.selfStatus) {
            setSelfStatus(payload.selfStatus);
          }

          if (payload.history) {
            setHistoryData({
              summary: payload.history.summary,
              entries: payload.history.entries
            });
          }

          setLastRealtimeAt(new Date().toISOString());
        }
      }
    );
  }, [authStatus, employee?.id]);

  async function bootstrap() {
    setAuthStatus('loading');
    const session = await me();
    const nextStatus = await getMyStatus();
    const nextHistory = await getMyHistory();
    setSessionUser(session.user);
    setEmployee(session.employee);
    setSelfStatus(nextStatus);
    setHistoryData({
      summary: nextHistory.summary,
      entries: nextHistory.entries
    });
    setAuthStatus('authenticated');
  }

  function handleAuthError(error) {
    if (error?.status === 401) {
      clearAuthToken();
      setSessionUser(null);
      setEmployee(null);
      setSelfStatus(null);
      setHistoryData(EMPTY_HISTORY);
      setLastRealtimeAt(null);
      setAuthStatus('unauthenticated');
    }

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
      await bootstrap();
      setFeedback({
        kind: 'success',
        message: `Welkom ${result.user.name}.`
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
    setEmployee(null);
    setSelfStatus(null);
    setHistoryData(EMPTY_HISTORY);
    setLastRealtimeAt(null);
    setFeedback(null);
    setAuthStatus('unauthenticated');
  }

  if (authStatus !== 'authenticated') {
    return (
      <AuthShell
        eyebrow="TimeSignal"
        title="Employee self-service"
        subtitle="Log in om je badge, huidige status en laatste klokmoment te bekijken."
        submitLabel={isLoggingIn || authStatus === 'loading' ? 'Bezig...' : 'Inloggen'}
        isSubmitting={isLoggingIn || authStatus === 'loading'}
        feedback={feedback}
        demoAccounts={DEMO_ACCOUNTS}
        defaultEmail="alice@timesignal.demo"
        defaultPassword="User123!"
        onSubmit={handleLoginSubmit}
      />
    );
  }

  const hasActiveSession = selfStatus?.status === 'IN';

  return (
    <div className="page-shell employee-shell">
      <section className="employee-frame">
        <header className="employee-header">
          <div>
            <p className="eyebrow">TimeSignal</p>
            <h1 className="app-title employee-title">Mijn badge</h1>
            <p className="app-subtitle">Self-service overzicht voor badge, status, laatste activiteit en persoonlijke historie.</p>
            <p className="panel-copy employee-live-status">
              Live updates via Mercure | Laatste update: {lastRealtimeAt ? formatDateTime(lastRealtimeAt) : 'Nog geen live update'}
            </p>
          </div>
          <button type="button" className="secondary-button" onClick={handleLogout}>
            Uitloggen
          </button>
        </header>

        <Feedback feedback={feedback} />

        <section className="panel employee-panel">
          <div className="employee-hero">
            <div>
              <h2>{employee?.name ?? sessionUser?.name}</h2>
              <p className="panel-copy">{employee?.profile?.department ?? 'Medewerker'} | {employee?.profile?.location ?? 'Locatie onbekend'}</p>
            </div>
            <span className={selfStatus?.status === 'IN' ? 'status-badge status-badge-active' : 'status-badge status-badge-idle'}>
              {selfStatus?.status === 'IN' ? 'Ingeklokt' : 'Uitgeklokt'}
            </span>
          </div>

          <div className="employee-card-grid">
            <article className="employee-qr-card">
              {employee?.qrCode ? <QRCodeSVG value={employee.qrCode} size={220} includeMargin /> : null}
              <p className="detail-label">Badgecode</p>
              <p className="detail-value">{employee?.qrCode ?? '--'}</p>
            </article>

            <div className="employee-detail-stack">
              <article className="detail-card">
                <p className="detail-label">Huidige status</p>
                <p className="detail-value">{selfStatus?.status === 'IN' ? 'Aanwezig' : 'Niet ingeklokt'}</p>
              </article>
              <article className="detail-card">
                <p className="detail-label">Laatste activiteit</p>
                <p className="detail-value">{selfStatus?.lastClock ? formatDateTime(selfStatus.lastClock) : 'Nog geen klokmoment'}</p>
              </article>
              <article className="detail-card">
                <p className="detail-label">Dienstverband</p>
                <p className="detail-value">{employee?.profile?.employmentType ?? '--'}</p>
              </article>
            </div>
          </div>
        </section>

        <section className="panel employee-history-panel">
          <div className="panel-heading">
            <div>
              <h2>Mijn historie</h2>
              <p className="panel-copy">Bekijk je geregistreerde tijd deze week, je lopende sessie en de meest recente klokmomenten.</p>
            </div>
          </div>

          <div className="summary-grid">
            <article className="summary-card">
              <p className="summary-label">Totaal deze week</p>
              <p className="summary-value">{formatDuration(historyData.summary.weekMinutes)}</p>
              <p className="summary-meta">Geregistreerde tijd in de lopende week</p>
            </article>
            <article className="summary-card">
              <p className="summary-label">Actieve sessie</p>
              <p className="summary-value">{hasActiveSession ? formatDuration(historyData.summary.activeSessionMinutes) : '--'}</p>
              <p className="summary-meta">{hasActiveSession ? 'Lopende dienst' : 'Geen actieve dienst'}</p>
            </article>
          </div>

          {0 === historyData.entries.length ? (
            <div className="history-empty">Nog geen persoonlijke klokmomenten geregistreerd.</div>
          ) : (
            <div className="history-list">
              {historyData.entries.map((entry) => (
                <article className="history-item" key={entry.id}>
                  <div className={`history-icon ${entry.action === 'checked_in' ? 'history-icon-in' : ''}`}>
                    {entry.action === 'checked_in' ? 'IN' : 'OUT'}
                  </div>
                  <div className="history-copy">
                    <h3>{entry.action === 'checked_in' ? 'Ingeklokt' : 'Uitgeklokt'}</h3>
                    <p>{`${employee?.name ?? 'Medewerker'} op ${entry.location}`}</p>
                  </div>
                  <div className="history-meta">
                    <span className={`history-badge history-badge-${entry.state}`}>{entry.stateLabel}</span>
                    <span>{`${formatDate(entry.timestamp)} ${formatClockTime(entry.timestamp)}`}</span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </section>
    </div>
  );
}
