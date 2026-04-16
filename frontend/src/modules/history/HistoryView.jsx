import React from 'react';
import { ClockResultCard } from './ClockResultCard';
import { formatClockTime } from '../../shared/formatters/dateTime';
import './history.css';

function formatDuration(minutes) {
  if (!minutes) {
    return '--';
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (0 === hours) {
    return `${remainingMinutes}m`;
  }

  return `${hours}u ${String(remainingMinutes).padStart(2, '0')}m`;
}

export function HistoryView({ currentEmployee, historyEntries, summary, lastClockEvent, onDismissResult }) {
  const hasActiveSession = currentEmployee?.status === 'checked_in';

  return (
    <section className="view-stack">
      <ClockResultCard event={lastClockEvent} onClose={onDismissResult} />

      <section className="panel">
        <div className="panel-heading">
          <div>
            <h2>Mijn tijdlogs</h2>
            <p className="panel-copy">
              Overzicht van gewerkte uren, actuele sessie en recente klokmomenten.
            </p>
          </div>
          <div className="history-state-card">
            <span className={`history-badge history-badge-${hasActiveSession ? 'onsite' : 'offsite'}`}>
              {hasActiveSession ? 'Actieve dienst' : 'Geen actieve dienst'}
            </span>
          </div>
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

        {0 === historyEntries.length ? (
          <div className="history-empty">
            Nog geen klokmomenten voor deze medewerker.
          </div>
        ) : (
          <div className="history-list">
            {historyEntries.map((entry) => (
              <article className="history-item" key={entry.id}>
                <div className={`history-icon ${entry.action === 'checked_in' ? 'history-icon-in' : ''}`}>
                  {entry.action === 'checked_in' ? 'IN' : 'OUT'}
                </div>
                <div className="history-copy">
                  <h3>
                    {entry.action === 'checked_in'
                      ? `${currentEmployee?.name ?? 'Medewerker'} ingeklokt`
                      : `${currentEmployee?.name ?? 'Medewerker'} uitgeklokt`}
                  </h3>
                  <p>{`${entry.location} • ${formatClockTime(entry.timestamp)}`}</p>
                </div>
                <div className="history-meta">
                  <span className={`history-badge history-badge-${entry.state}`}>{entry.stateLabel}</span>
                  <span>{entry.timestamp}</span>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </section>
  );
}
