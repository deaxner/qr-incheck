import React from 'react';
import { formatClockTime, formatDate } from '../../shared/formatters/dateTime';

const RESULT_ICON = {
  checked_in: 'IN',
  checked_out: 'OUT'
};

const RESULT_TITLE = {
  checked_in: 'Ingeklokt',
  checked_out: 'Uitgeklokt'
};

export function ClockResultCard({ event, onClose }) {
  if (!event) {
    return null;
  }

  return (
    <section className="panel result-panel">
      <div className="result-icon">{RESULT_ICON[event.action] ?? 'OK'}</div>
      <p className="eyebrow result-eyebrow">Klokmoment geregistreerd</p>
      <h2>{RESULT_TITLE[event.action] ?? 'Bijgewerkt'}</h2>
      <div className="result-card">
        <div>
          <p className="detail-label">Tijdstip</p>
          <p className="result-time">{formatClockTime(event.timestamp)}</p>
        </div>
        <div>
          <p className="detail-label">Datum</p>
          <p className="detail-value">{formatDate(event.timestamp)}</p>
        </div>
        <div>
          <p className="detail-label">Medewerker</p>
          <p className="detail-value">{event.employeeName}</p>
        </div>
        <div>
          <p className="detail-label">Locatie</p>
          <p className="detail-value">{event.location}</p>
        </div>
      </div>
      <button type="button" className="primary-button" onClick={onClose}>
        Sluiten
      </button>
    </section>
  );
}
