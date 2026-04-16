import React from 'react';
import './team.css';

export function TeamOverviewView({
  employees,
  checkedInCount,
  checkedOutCount,
  regeneratingId,
  onRefresh,
  onRegenerate,
}) {
  return (
    <section className="view-stack">
      <section className="panel">
        <div className="panel-heading">
          <div>
            <h2>Manager dashboard</h2>
            <p className="panel-copy">
              Compact teamoverzicht met actuele clocking-status en directe badgevernieuwing.
            </p>
          </div>
          <button className="secondary-button" type="button" onClick={onRefresh}>
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
          {employees.map((employee) => (
            <article className="employee-card" key={employee.id}>
              <div className="employee-card-top">
                <div className="employee-card-main">
                  <h3>{employee.name}</h3>
                  <p className="employee-role">{employee.profile.department}</p>
                  <p className={`status-badge status-${employee.status}`}>{employee.statusLabel}</p>
                </div>
                <div className="employee-card-side">
                  <span className="employee-time-label">Laatste klokmoment</span>
                  <strong className="employee-time-value">{employee.lastActionAt ?? 'Nog geen klokmoment'}</strong>
                </div>
                <button
                  className="secondary-button"
                  type="button"
                  disabled={regeneratingId === employee.id}
                  onClick={() => onRegenerate(employee.id)}
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
                  <dt>Dienstverband</dt>
                  <dd>{employee.profile.employmentType}</dd>
                </div>
                <div>
                  <dt>Locatie</dt>
                  <dd>{employee.profile.location}</dd>
                </div>
              </dl>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}
