import React from 'react';
import { formatDateTime } from '../../../shared/utils/dateTime';

export function LiveActivityView({ checkedInCount, checkedOutCount, recentActivity }) {
  return (
    <section className="view-stack">
      <section className="panel">
        <div className="panel-heading">
          <div>
            <h2>Live operations wall</h2>
            <p className="panel-copy">Realtime feed voor scans en badgebeheer, bedoeld als direct zichtbare operationele laag.</p>
          </div>
        </div>

        <div className="summary-grid">
          <article className="summary-card">
            <p className="summary-label">Ingeklokt</p>
            <p className="summary-value">{String(checkedInCount).padStart(2, '0')}</p>
            <p className="summary-meta">Actueel aanwezige medewerkers</p>
          </article>
          <article className="summary-card">
            <p className="summary-label">Uitgeklokt</p>
            <p className="summary-value">{String(checkedOutCount).padStart(2, '0')}</p>
            <p className="summary-meta">Niet actief op locatie</p>
          </article>
          <article className="summary-card">
            <p className="summary-label">Events</p>
            <p className="summary-value">{String(recentActivity.length).padStart(2, '0')}</p>
            <p className="summary-meta">Laatste realtime activiteiten</p>
          </article>
        </div>

        <section className="activity-panel activity-panel-standalone">
          <div className="panel-heading activity-panel-heading">
            <div>
              <h3>Live activity</h3>
              <p className="panel-copy">Gebeurtenissen komen direct binnen via het admin-activiteitstopic van Mercure.</p>
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
                  <div className="activity-meta">{formatDateTime(activity.timestamp)}</div>
                </article>
              ))}
            </div>
          )}
        </section>
      </section>
    </section>
  );
}
