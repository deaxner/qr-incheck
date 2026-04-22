import React from 'react';
import { formatDateTime } from '../../../shared/utils/dateTime';

export function TeamOverviewView({
  employees,
  checkedInCount,
  checkedOutCount,
  isRefreshing,
  lastRefreshedLabel,
  liveModeLabel,
  recentActivity,
  regeneratingId,
  selectedEmployeeId,
  onRefresh,
  onRegenerate,
  onSelectEmployee
}) {
  return (
    <section className="view-stack">
      <section className="panel">
        <div className="panel-heading">
          <div>
            <h2>Manager dashboard</h2>
            <p className="panel-copy">Compact teamoverzicht met actuele clocking-status en directe badgevernieuwing.</p>
            <p className="panel-copy team-sync-status">
              {isRefreshing ? 'Statusmonitor ververst nu.' : `${liveModeLabel} | Laatste update: ${lastRefreshedLabel}`}
            </p>
          </div>
          <button className="secondary-button" type="button" onClick={onRefresh} disabled={isRefreshing}>
            {isRefreshing ? 'Verversen...' : 'Ververs status'}
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
            <p className="summary-label">Uitgeklokt</p>
            <p className="summary-value">{String(checkedOutCount).padStart(2, '0')}</p>
          </article>
        </div>

        <div className="employee-grid">
          {employees.map((employee) => (
            <article
              className={selectedEmployeeId === employee.id ? 'employee-card employee-card-selected' : 'employee-card'}
              key={employee.id}
            >
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

              <div className="employee-actions">
                <button className="secondary-button" type="button" onClick={() => onSelectEmployee(employee.id)}>
                  Bekijk historie
                </button>
                <button
                  className="secondary-button"
                  type="button"
                  disabled={regeneratingId === employee.id}
                  onClick={() => onRegenerate(employee.id)}
                >
                  {regeneratingId === employee.id ? 'Vernieuwen...' : 'Nieuwe badge'}
                </button>
              </div>
            </article>
          ))}
        </div>

        <section className="activity-panel">
          <div className="panel-heading activity-panel-heading">
            <div>
              <h3>Live activity</h3>
              <p className="panel-copy">Laat in realtime zien wat er binnenkomt vanuit scans en badgebeheer.</p>
            </div>
          </div>

          {0 === recentActivity.length ? (
            <div className="activity-empty">Nog geen realtime activiteit ontvangen.</div>
          ) : (
            <div className="activity-feed">
              {recentActivity.map((activity) => (
                <article className="activity-item" key={activity.id}>
                  <div className={`activity-icon activity-icon-${activity.type}`}>
                    {'checked_in' === activity.type ? 'IN' : ('checked_out' === activity.type ? 'OUT' : 'QR')}
                  </div>
                  <div className="activity-copy">
                    <h4>{activity.label}</h4>
                    <p>
                      {activity.employeeName} op {activity.location}
                      {activity.qrCode ? ` | ${activity.qrCode}` : ''}
                    </p>
                  </div>
                  <div className="activity-meta">
                    {formatDateTime(activity.timestamp)}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </section>
    </section>
  );
}
