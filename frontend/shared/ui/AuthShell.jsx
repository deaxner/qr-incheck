import React from 'react';
import { Feedback } from './Feedback';

export function AuthShell({
  eyebrow,
  title,
  subtitle,
  submitLabel,
  isSubmitting,
  feedback,
  demoAccounts,
  defaultEmail,
  defaultPassword,
  onSubmit
}) {
  return (
    <div className="page-shell auth-page">
      <section className="auth-shell panel">
        <div className="auth-brand">
          <div className="brand-mark" aria-hidden="true">
            TS
          </div>
          <div>
            <p className="eyebrow">{eyebrow}</p>
            <h1 className="app-title auth-title">{title}</h1>
            <p className="app-subtitle">{subtitle}</p>
          </div>
        </div>

        <Feedback feedback={feedback} />

        <div className="auth-grid">
          <form
            className="auth-form"
            onSubmit={(event) => {
              event.preventDefault();
              const formData = new FormData(event.currentTarget);
              onSubmit({
                email: String(formData.get('email') ?? ''),
                password: String(formData.get('password') ?? '')
              });
            }}
          >
            <label className="auth-field">
              <span className="detail-label">E-mailadres</span>
              <input
                className="auth-input"
                name="email"
                type="email"
                autoComplete="username"
                defaultValue={defaultEmail}
              />
            </label>
            <label className="auth-field">
              <span className="detail-label">Wachtwoord</span>
              <input
                className="auth-input"
                name="password"
                type="password"
                autoComplete="current-password"
                defaultValue={defaultPassword}
              />
            </label>
            <button type="submit" className="primary-button" disabled={isSubmitting}>
              {submitLabel}
            </button>
          </form>

          <aside className="auth-demo-card">
            <p className="detail-label">Demo-accounts</p>
            <div className="auth-demo-list">
              {demoAccounts.map((account) => (
                <button
                  key={account.email}
                  type="button"
                  className="secondary-button auth-demo-button"
                  disabled={isSubmitting}
                  onClick={() => onSubmit({ email: account.email, password: account.password })}
                >
                  <strong>{account.label}</strong>
                  <span>{`${account.email} / ${account.password}`}</span>
                </button>
              ))}
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}
