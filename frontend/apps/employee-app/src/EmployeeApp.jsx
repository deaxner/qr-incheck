import React, { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { AuthShell } from '../../../shared/ui/AuthShell';
import { Feedback } from '../../../shared/ui/Feedback';
import { clearAuthToken, getAuthToken, getMyStatus, login, me } from '../../../shared/api/client';
import { formatDateTime } from '../../../shared/utils/dateTime';

const DEMO_ACCOUNTS = [
  {
    label: 'Medewerker',
    email: 'alice@timesignal.demo',
    password: 'User123!'
  }
];

export function EmployeeApp() {
  const [authStatus, setAuthStatus] = useState('idle');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [sessionUser, setSessionUser] = useState(null);
  const [employee, setEmployee] = useState(null);
  const [selfStatus, setSelfStatus] = useState(null);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    if (!getAuthToken()) {
      setAuthStatus('unauthenticated');
      return;
    }

    bootstrap().catch(handleAuthError);
  }, []);

  async function bootstrap() {
    setAuthStatus('loading');
    const session = await me();
    const nextStatus = await getMyStatus();
    setSessionUser(session.user);
    setEmployee(session.employee);
    setSelfStatus(nextStatus);
    setAuthStatus('authenticated');
  }

  function handleAuthError(error) {
    if (error?.status === 401) {
      clearAuthToken();
      setSessionUser(null);
      setEmployee(null);
      setSelfStatus(null);
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

  return (
    <div className="page-shell employee-shell">
      <section className="employee-frame">
        <header className="employee-header">
          <div>
            <p className="eyebrow">TimeSignal</p>
            <h1 className="app-title employee-title">Mijn badge</h1>
            <p className="app-subtitle">Self-service overzicht voor badge, status en laatste activiteit.</p>
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
              <p className="panel-copy">{employee?.profile?.department ?? 'Medewerker'} · {employee?.profile?.location ?? 'Locatie onbekend'}</p>
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
      </section>
    </div>
  );
}
