import React, { useEffect, useMemo, useState } from 'react';
import { fetchEmployees, regenerateQrCode, submitScan } from '../lib/api';

const PROFILE_PRESETS = [
  { department: 'Product Engineering', employmentType: 'Full-time', location: 'Main Entrance' },
  { department: 'Operations', employmentType: 'Shift-based', location: 'North Lobby' },
  { department: 'People & Planning', employmentType: 'Full-time', location: 'HQ Reception' }
];

export function QrIncheckApp({ initialEmployees }) {
  const [employees, setEmployees] = useState(initialEmployees);
  const [feedback, setFeedback] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [regeneratingId, setRegeneratingId] = useState(null);
  const [activeTab, setActiveTab] = useState('badge');
  const [currentEmployeeId, setCurrentEmployeeId] = useState(initialEmployees[0]?.id ?? null);
  const [lastClockEvent, setLastClockEvent] = useState(null);

  const currentEmployee =
    employees.find((employee) => employee.id === currentEmployeeId) ?? employees[0] ?? null;

  const checkedInCount = employees.filter((employee) => employee.status === 'checked_in').length;
  const checkedOutCount = employees.length - checkedInCount;

  const teamEntries = useMemo(
    () =>
      employees.map((employee, index) => ({
        ...employee,
        profile: PROFILE_PRESETS[index % PROFILE_PRESETS.length],
        employeeCode: toEmployeeCode(employee.qrCode),
      })),
    [employees]
  );

  const historyEntries = useMemo(() => buildHistoryEntries(teamEntries), [teamEntries]);

  useEffect(() => {
    if (initialEmployees.length > 0) {
      return;
    }

    refreshEmployees().catch((error) => {
      setFeedback({
        kind: 'error',
        message: error.message
      });
    });
    // initialEmployees is intentionally used as a one-time preload signal.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refreshEmployees = async () => {
    const nextEmployees = await fetchEmployees();
    setEmployees(nextEmployees);

    if (!nextEmployees.some((employee) => employee.id === currentEmployeeId)) {
      setCurrentEmployeeId(nextEmployees[0]?.id ?? null);
    }
  };

  const handleClock = async (code) => {
    setIsSubmitting(true);

    try {
      const result = await submitScan(code);
      const event = {
        action: result.action,
        employeeName: result.employee.name,
        timestamp: result.timestamp,
        location: currentEmployee
          ? getProfileForEmployee(teamEntries, result.employee.id).location
          : 'Main Entrance',
      };

      setLastClockEvent(event);
      setFeedback({
        kind: 'success',
        message:
          result.action === 'checked_in'
            ? `${result.employee.name} is ingeklokt om ${formatClockTime(result.timestamp)}.`
            : `${result.employee.name} is uitgeklokt om ${formatClockTime(result.timestamp)}.`
      });
      setActiveTab('history');
      await refreshEmployees();
    } catch (error) {
      setFeedback({
        kind: 'error',
        message: error.message
      });
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
      setFeedback({
        kind: 'error',
        message: error.message
      });
    } finally {
      setRegeneratingId(null);
    }
  };

  return (
    <div className="page-shell app-shell">
      <header className="app-header">
        <div>
          <p className="eyebrow">TimeSignal</p>
          <h1 className="app-title">Badge clocking demo</h1>
        </div>
        <div className="header-session">
          <span className={`live-dot ${currentEmployee?.status === 'checked_in' ? 'live-dot-active' : ''}`} />
          <div>
            <p className="header-label">
              {currentEmployee?.status === 'checked_in' ? 'Actieve sessie' : 'Niet ingeklokt'}
            </p>
            <p className="header-value">
              {currentEmployee?.lastActionAt ? formatClockTime(currentEmployee.lastActionAt) : '--:--'}
            </p>
          </div>
        </div>
      </header>

      {feedback ? (
        <div className={`feedback feedback-${feedback.kind}`} role="status" aria-live="polite">
          {feedback.message}
        </div>
      ) : null}

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

      <main className="layout">
        {activeTab === 'badge' && currentEmployee ? (
          <section className="view-stack">
            <section className="panel badge-panel">
              <div className="status-chip">
                <span className="live-dot live-dot-active" />
                {currentEmployee.status === 'checked_in' ? 'Momenteel ingeklokt' : 'Klaar om te klokken'}
              </div>

              <div className="badge-heading">
                <div>
                  <h2>Mijn badge</h2>
                  <p className="panel-copy">
                    Medewerker-ID: {toEmployeeCode(currentEmployee.qrCode)}
                  </p>
                </div>
                <select
                  className="employee-switcher"
                  aria-label="Actieve medewerker"
                  value={currentEmployee.id}
                  onChange={(event) => setCurrentEmployeeId(Number(event.target.value))}
                >
                  {teamEntries.map((employee) => (
                    <option key={employee.id} value={employee.id}>
                      {employee.name}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                className="badge-visual"
                onClick={() => handleClock(currentEmployee.qrCode)}
                disabled={isSubmitting}
              >
                <div className="badge-qr">
                  <div className="qr-grid">
                    {currentEmployee.qrCode.split('').map((char, index) => (
                      <span
                        key={`${char}-${index}`}
                        className={(char.charCodeAt(0) + index) % 2 === 0 ? 'qr-block qr-block-solid' : 'qr-block'}
                      />
                    ))}
                  </div>
                </div>
                <span className="badge-code">{currentEmployee.qrCode}</span>
              </button>

              <div className="cta-row">
                <button
                  type="button"
                  className="primary-button"
                  onClick={() => handleClock(currentEmployee.qrCode)}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Bezig...' : 'Klok met mijn badge'}
                </button>
              </div>

              <div className="detail-grid">
                <article className="detail-card">
                  <p className="detail-label">Afdeling</p>
                  <p className="detail-value">{getProfileForEmployee(teamEntries, currentEmployee.id).department}</p>
                </article>
                <article className="detail-card">
                  <p className="detail-label">Dienstverband</p>
                  <p className="detail-value">
                    {getProfileForEmployee(teamEntries, currentEmployee.id).employmentType}
                  </p>
                </article>
                <article className="detail-card detail-card-wide">
                  <p className="detail-label">Badge status</p>
                  <p className="detail-value">
                    {currentEmployee.status === 'checked_in'
                      ? `Actief sinds ${formatClockTime(currentEmployee.lastActionAt)}`
                      : 'Badge actief en klaar voor gebruik'}
                  </p>
                </article>
              </div>
            </section>
          </section>
        ) : null}

        {activeTab === 'history' ? (
          <section className="view-stack">
            {lastClockEvent ? (
              <section className="panel result-panel">
                <div className="result-icon">{lastClockEvent.action === 'checked_in' ? '✓' : '↗'}</div>
                <p className="eyebrow result-eyebrow">Klokmoment geregistreerd</p>
                <h2>{lastClockEvent.action === 'checked_in' ? 'Ingeklokt' : 'Uitgeklokt'}</h2>
                <div className="result-card">
                  <div>
                    <p className="detail-label">Tijdstip</p>
                    <p className="result-time">{formatClockTime(lastClockEvent.timestamp)}</p>
                  </div>
                  <div>
                    <p className="detail-label">Datum</p>
                    <p className="detail-value">{formatDate(lastClockEvent.timestamp)}</p>
                  </div>
                  <div>
                    <p className="detail-label">Medewerker</p>
                    <p className="detail-value">{lastClockEvent.employeeName}</p>
                  </div>
                  <div>
                    <p className="detail-label">Locatie</p>
                    <p className="detail-value">{lastClockEvent.location}</p>
                  </div>
                </div>
                <button type="button" className="primary-button" onClick={() => setLastClockEvent(null)}>
                  Sluiten
                </button>
              </section>
            ) : null}

            <section className="panel">
              <div className="panel-heading">
                <div>
                  <h2>Mijn tijdlogs</h2>
                  <p className="panel-copy">
                    Overzicht van gewerkte uren, actuele sessie en recente klokmomenten.
                  </p>
                </div>
              </div>

              <div className="summary-grid">
                <article className="summary-card">
                  <p className="summary-label">Totaal deze week</p>
                  <p className="summary-value">38.5</p>
                  <p className="summary-meta">van 40.0 uur</p>
                </article>
                <article className="summary-card">
                  <p className="summary-label">Actieve sessie</p>
                  <p className="summary-value">
                    {currentEmployee?.status === 'checked_in' ? '3u 12m' : '--'}
                  </p>
                  <p className="summary-meta">
                    {currentEmployee?.status === 'checked_in' ? 'Lopende dienst' : 'Geen actieve dienst'}
                  </p>
                </article>
              </div>

              <div className="history-list">
                {historyEntries.map((entry) => (
                  <article className="history-item" key={entry.id}>
                    <div className={`history-icon ${entry.kind === 'in' ? 'history-icon-in' : ''}`}>
                      {entry.kind === 'in' ? '↘' : '↗'}
                    </div>
                    <div className="history-copy">
                      <h3>{entry.title}</h3>
                      <p>{entry.subtitle}</p>
                    </div>
                    <div className="history-meta">
                      <span className={`history-badge history-badge-${entry.state}`}>{entry.stateLabel}</span>
                      <span>{entry.meta}</span>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          </section>
        ) : null}

        {activeTab === 'team' ? (
          <section className="view-stack">
            <section className="panel">
              <div className="panel-heading">
                <div>
                  <h2>Manager dashboard</h2>
                  <p className="panel-copy">
                    Compact teamoverzicht met actuele clocking-status en directe badgevernieuwing.
                  </p>
                </div>
                <button className="secondary-button" type="button" onClick={refreshEmployees}>
                  Ververs status
                </button>
              </div>

              <div className="summary-grid">
                <article className="summary-card">
                  <p className="summary-label">Totaal team</p>
                  <p className="summary-value">{String(employees.length).padStart(2, '0')}</p>
                </article>
                <article className="summary-card">
                  <p className="summary-label">Ingeklokt</p>
                  <p className="summary-value">{String(checkedInCount).padStart(2, '0')}</p>
                </article>
                <article className="summary-card">
                  <p className="summary-label">Nog niet ingeklokt</p>
                  <p className="summary-value">{String(checkedOutCount).padStart(2, '0')}</p>
                </article>
              </div>

              <div className="employee-grid">
                {teamEntries.map((employee) => (
                  <article className="employee-card" key={employee.id}>
                    <div className="employee-card-top">
                      <div>
                        <h3>{employee.name}</h3>
                        <p className="employee-role">{employee.profile.department}</p>
                        <p className={`status-badge status-${employee.status}`}>{employee.statusLabel}</p>
                      </div>
                      <button
                        className="secondary-button"
                        type="button"
                        disabled={regeneratingId === employee.id}
                        onClick={() => handleRegenerateClick(employee.id)}
                      >
                        {regeneratingId === employee.id ? 'Vernieuwen...' : 'Nieuwe badge'}
                      </button>
                    </div>

                    <dl className="employee-meta">
                      <div>
                        <dt>Badgecode</dt>
                        <dd>{employee.qrCode}</dd>
                      </div>
                      <div>
                        <dt>Laatste klokmoment</dt>
                        <dd>{employee.lastActionAt ?? 'Nog geen klokmoment'}</dd>
                      </div>
                    </dl>
                  </article>
                ))}
              </div>
            </section>
          </section>
        ) : null}
      </main>
    </div>
  );
}

function toEmployeeCode(qrCode) {
  return `TS-${qrCode.replace(/[^A-Z0-9]/gi, '').slice(0, 8)}`;
}

function formatClockTime(timestamp) {
  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) {
    return timestamp;
  }

  return new Intl.DateTimeFormat('nl-NL', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'UTC'
  }).format(date);
}

function formatDate(timestamp) {
  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) {
    return timestamp;
  }

  return new Intl.DateTimeFormat('nl-NL', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC'
  }).format(date);
}

function buildHistoryEntries(employees) {
  return employees.map((employee) => ({
    id: employee.id,
    kind: employee.status === 'checked_in' ? 'in' : 'out',
    title:
      employee.status === 'checked_in'
        ? `${employee.name} ingeklokt bij ${employee.profile.location}`
        : `${employee.name} uitgeklokt`,
    subtitle: employee.lastActionAt ?? 'Nog geen klokmoment',
    state: employee.status === 'checked_in' ? 'onsite' : 'offsite',
    stateLabel: employee.status === 'checked_in' ? 'Op locatie' : 'Uitgeklokt',
    meta:
      employee.status === 'checked_in'
        ? 'Lopende dienst'
        : employee.lastActionAt
          ? formatClockTime(employee.lastActionAt)
          : '--'
  }));
}

function getProfileForEmployee(employees, employeeId) {
  return (
    employees.find((employee) => employee.id === employeeId)?.profile ?? PROFILE_PRESETS[0]
  );
}
