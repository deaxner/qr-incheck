import React, { useEffect, useMemo, useState } from 'react';
import { fetchEmployeeHistory, fetchEmployees, regenerateQrCode, submitScan } from '../lib/api';
import { BadgeView } from '../modules/badge/BadgeView';
import { HistoryView } from '../modules/history/HistoryView';
import { TeamOverviewView } from '../modules/team/TeamOverviewView';
import { buildTeamEntries } from '../shared/employee/presentation';
import { formatClockTime } from '../shared/formatters/dateTime';
import '../shared/styles/ui.css';
import './app.css';

export function App({ initialEmployees }) {
  const [employees, setEmployees] = useState(initialEmployees);
  const [feedback, setFeedback] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [regeneratingId, setRegeneratingId] = useState(null);
  const [activeTab, setActiveTab] = useState('badge');
  const [currentEmployeeId, setCurrentEmployeeId] = useState(initialEmployees[0]?.id ?? null);
  const [lastClockEvent, setLastClockEvent] = useState(null);
  const [historyData, setHistoryData] = useState({
    summary: { weekMinutes: 0, activeSessionMinutes: null },
    entries: []
  });

  const teamEntries = useMemo(() => buildTeamEntries(employees), [employees]);
  const currentEmployee =
    teamEntries.find((employee) => employee.id === currentEmployeeId) ?? teamEntries[0] ?? null;
  const checkedInCount = teamEntries.filter((employee) => employee.status === 'checked_in').length;
  const checkedOutCount = teamEntries.length - checkedInCount;

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
    const selectedEmployeeId = nextEmployees.some((employee) => employee.id === currentEmployeeId)
      ? currentEmployeeId
      : (nextEmployees[0]?.id ?? null);

    setCurrentEmployeeId(selectedEmployeeId);

    if (selectedEmployeeId) {
      await loadEmployeeHistory(selectedEmployeeId);
    }

    return { nextEmployees, selectedEmployeeId };
  };

  const loadEmployeeHistory = async (employeeId) => {
    const response = await fetchEmployeeHistory(employeeId);
    setHistoryData({
      summary: response.summary,
      entries: response.entries
    });

    return response;
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
      setActiveTab('history');
      await refreshEmployees();
      await loadEmployeeHistory(result.employee.id);
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
        <div className="header-session">
          <span className={`live-dot ${currentEmployee?.status === 'checked_in' ? 'live-dot-active' : ''}`} />
          <div>
            <p className="header-label">
              {currentEmployee?.status === 'checked_in' ? 'Actieve sessie' : 'Niet ingeklokt'}
            </p>
            <p className="header-value">{currentEmployee?.lastActionTime ?? '--:--'}</p>
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
        {activeTab === 'badge' ? (
          <BadgeView
            currentEmployee={currentEmployee}
            employees={teamEntries}
            isSubmitting={isSubmitting}
            onClock={handleClock}
            onEmployeeChange={handleEmployeeChange}
          />
        ) : null}

        {activeTab === 'history' ? (
          <HistoryView
            currentEmployee={currentEmployee}
            historyEntries={historyData.entries}
            summary={historyData.summary}
            lastClockEvent={lastClockEvent}
            onDismissResult={() => setLastClockEvent(null)}
          />
        ) : null}

        {activeTab === 'team' ? (
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
