import React, { useState } from 'react';
import { fetchEmployees, regenerateQrCode, submitScan } from '../lib/api';

export function QrIncheckApp({ initialEmployees }) {
  const [employees, setEmployees] = useState(initialEmployees);
  const [scanCode, setScanCode] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [regeneratingId, setRegeneratingId] = useState(null);

  const refreshEmployees = async () => {
    const nextEmployees = await fetchEmployees();
    setEmployees(nextEmployees);
  };

  const handleScanSubmit = async (event) => {
    event.preventDefault();

    if (!scanCode.trim()) {
      setFeedback({
        kind: 'error',
        message: 'Voer eerst een QR-code in.'
      });

      return;
    }

    setIsSubmitting(true);

    try {
      const result = await submitScan(scanCode);
      setFeedback({
        kind: 'success',
        message:
          result.action === 'checked_in'
            ? `${result.employee.name} is ingecheckt.`
            : `${result.employee.name} is uitgecheckt.`
      });
      setScanCode('');
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
        message: `Nieuwe QR-code voor ${result.employee.name}: ${result.employee.qrCode}`
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
    <div className="page-shell">
      <header className="hero">
        <p className="eyebrow">QR-Incheck Demo</p>
        <h1>Werkende check-in flow zonder ballast</h1>
        <p className="intro">
          Deze demo focust op een duidelijke verticale slice: scan, valideren, registreren en direct
          inzicht geven in de actuele status.
        </p>
      </header>

      <main className="layout">
        <section className="panel panel-accent">
          <h2>Scan simulatie</h2>
          <p className="panel-copy">
            Gebruik een van de demo-codes uit het overzicht hieronder om in of uit te checken.
          </p>

          <form className="scan-form" onSubmit={handleScanSubmit}>
            <label htmlFor="scan-code">QR-code</label>
            <div className="scan-form-row">
              <input
                id="scan-code"
                name="scan-code"
                type="text"
                value={scanCode}
                onChange={(event) => setScanCode(event.target.value)}
                placeholder="Bijv. ALICE-DEMO-001"
              />
              <button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Bezig...' : 'Verwerk scan'}
              </button>
            </div>
          </form>

          {feedback ? (
            <div className={`feedback feedback-${feedback.kind}`} role="status" aria-live="polite">
              {feedback.message}
            </div>
          ) : null}
        </section>

        <section className="panel">
          <div className="panel-heading">
            <div>
              <h2>Medewerkers</h2>
              <p className="panel-copy">Kleine beheerweergave met actuele status en QR-rotatie.</p>
            </div>
            <button className="secondary-button" type="button" onClick={refreshEmployees}>
              Vernieuwen
            </button>
          </div>

          <div className="employee-grid">
            {employees.map((employee) => (
              <article className="employee-card" key={employee.id}>
                <div className="employee-card-top">
                  <div>
                    <h3>{employee.name}</h3>
                    <p className={`status-badge status-${employee.status}`}>{employee.statusLabel}</p>
                  </div>
                  <button
                    className="secondary-button"
                    type="button"
                    disabled={regeneratingId === employee.id}
                    onClick={() => handleRegenerateClick(employee.id)}
                  >
                    {regeneratingId === employee.id ? 'Roteren...' : 'Nieuwe QR'}
                  </button>
                </div>

                <dl className="employee-meta">
                  <div>
                    <dt>Actieve code</dt>
                    <dd>{employee.qrCode}</dd>
                  </div>
                  <div>
                    <dt>Laatste activiteit</dt>
                    <dd>{employee.lastActionAt ?? 'Nog geen activiteit'}</dd>
                  </div>
                </dl>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
