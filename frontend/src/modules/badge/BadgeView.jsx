import React from 'react';
import './badge.css';

export function BadgeView({
  currentEmployee,
  employees,
  isSubmitting,
  onClock,
  onEmployeeChange,
}) {
  if (!currentEmployee) {
    return null;
  }
  const profile = currentEmployee.profile;

  return (
    <section className="view-stack">
      <section className="panel badge-panel">
        <div className="badge-hero">
          <div>
            <div className="status-chip">
              <span className={`live-dot ${currentEmployee.status === 'checked_in' ? 'live-dot-active' : ''}`} />
              {currentEmployee.status === 'checked_in' ? 'Momenteel ingeklokt' : 'Klaar om te klokken'}
            </div>
            <div className="badge-heading">
              <div>
                <h2>Mijn badge</h2>
                <p className="panel-copy">Toon je badge of registreer direct een klokmoment vanaf dit scherm.</p>
              </div>
            </div>
          </div>
          <select
            className="employee-switcher"
            aria-label="Actieve medewerker"
            value={currentEmployee.id}
            onChange={(event) => onEmployeeChange(Number(event.target.value))}
          >
            {employees.map((employee) => (
              <option key={employee.id} value={employee.id}>
                {employee.name}
              </option>
            ))}
          </select>
        </div>

        <div className="badge-identity">
          <span className="badge-identity-label">Medewerker-ID</span>
          <strong>{currentEmployee.employeeCode}</strong>
        </div>

        <button
          type="button"
          className="badge-visual"
          onClick={() => onClock(currentEmployee.qrCode)}
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
            onClick={() => onClock(currentEmployee.qrCode)}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Bezig...' : 'Klok met mijn badge'}
          </button>
          <p className="badge-helper">Gebruik de badge hierboven of de knop om direct in of uit te klokken.</p>
        </div>

        <div className="detail-grid">
          <article className="detail-card">
            <p className="detail-label">Afdeling</p>
            <p className="detail-value">{profile.department}</p>
          </article>
          <article className="detail-card">
            <p className="detail-label">Dienstverband</p>
            <p className="detail-value">{profile.employmentType}</p>
          </article>
          <article className="detail-card detail-card-wide">
            <p className="detail-label">Badge status</p>
            <p className="detail-value">
              {currentEmployee.status === 'checked_in'
                ? `Actief sinds ${currentEmployee.lastActionTime ?? '--:--'}`
                : 'Badge actief en klaar voor gebruik'}
            </p>
          </article>
        </div>
      </section>
    </section>
  );
}
