import React from 'react';
import { formatClockTime, formatDate, formatDuration } from '../../../shared/utils/dateTime';

export function HistoryView({ currentEmployee, employees, historyEntries, summary, onEmployeeChange }) {
  const hasActiveSession = currentEmployee?.status === 'checked_in';

  return (
    <section className="view-stack">
      <section className="panel">
        <div className="panel-heading">
          <div>
            <h2>Medewerkerhistorie</h2>
            <p className="panel-copy">Bekijk weektotalen, actuele sessie en recente klokmomenten per medewerker.</p>
          </div>
          <select
            className="employee-switcher"
            aria-label="Geselecteerde medewerker"
            value={currentEmployee?.id ?? ''}
            onChange={(event) => onEmployeeChange(Number(event.target.value))}
          >
            {employees.map((employee) => (
              <option key={employee.id} value={employee.id}>
                {employee.name}
              </option>
            ))}
          </select>
        </div>

        <div className="summary-grid">
          <article className="summary-card">
            <p className="summary-label">Totaal deze week</p>
            <p className="summary-value">{formatDuration(summary.weekMinutes)}</p>
            <p className="summary-meta">Geregistreerde tijd in de lopende week</p>
          </article>
          <article className="summary-card">
            <p className="summary-label">Actieve sessie</p>
            <p className="summary-value">{hasActiveSession ? formatDuration(summary.activeSessionMinutes) : '--'}</p>
            <p className="summary-meta">{hasActiveSession ? 'Lopende dienst' : 'Geen actieve dienst'}</p>
          </article>
        </div>

        {currentEmployee ? (
          <article className="detail-card detail-card-wide">
            <p className="detail-label">Status</p>
            <p className="detail-value">
              {currentEmployee.statusLabel} {currentEmployee.lastActionTime ? `sinds ${currentEmployee.lastActionTime}` : ''}
            </p>
          </article>
        ) : null}

        {0 === historyEntries.length ? (
          <div className="history-empty">Nog geen klokmomenten voor deze medewerker.</div>
        ) : (
          <div className="history-list">
            {historyEntries.map((entry) => (
              <article className="history-item" key={entry.id}>
                <div className={`history-icon ${entry.action === 'checked_in' ? 'history-icon-in' : ''}`}>
                  {entry.action === 'checked_in' ? 'IN' : 'OUT'}
                </div>
                <div className="history-copy">
                  <h3>{entry.action === 'checked_in' ? 'Ingeklokt' : 'Uitgeklokt'}</h3>
                  <p>{`${currentEmployee?.name ?? 'Medewerker'} op ${entry.location}`}</p>
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
  );
}
