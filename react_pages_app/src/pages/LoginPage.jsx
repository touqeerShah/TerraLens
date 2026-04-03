import { useEffect, useMemo, useState } from 'react';
import './LoginPage.css';
import { navigateToPath } from '../utils/navigation';

export const pageMeta = {
  slug: 'login',
  path: '/login',
  label: 'Login',
  title: 'Login | Axiom Property Intelligence',
};

const trustSignals = [
  { title: 'Multi-Factor Authentication', detail: 'Enterprise-grade 2FA supported across every workspace.' },
  { title: 'Audit Monitoring', detail: 'Login anomalies and risky sessions are flagged in real time.' },
  { title: 'SSO Ready', detail: 'Connect Google Workspace, Microsoft Entra, or a custom SAML provider.' },
];

const workspaceStats = [
  { label: 'Markets Covered', value: '214' },
  { label: 'Live Source Threads', value: '38' },
  { label: 'Critical Alerts', value: '06' },
];

function MaterialIcon({ children, filled = false }) {
  const style = filled ? { fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" } : undefined;
  return (
    <span className="material-symbols-outlined" style={style}>
      {children}
    </span>
  );
}

export default function LoginPage() {
  const [email, setEmail] = useState('analyst@axiomintel.com');
  const [password, setPassword] = useState('password');
  const [remember, setRemember] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [statusMessage, setStatusMessage] = useState('Ready for secure access.');

  useEffect(() => {
    const previousTitle = document.title;
    const previousHtmlClass = document.documentElement.className;
    const previousBodyClass = document.body.className;

    document.title = pageMeta.title;
    document.documentElement.className = 'light';
    document.body.className = 'bg-surface font-body text-on-surface min-h-screen';

    return () => {
      document.title = previousTitle;
      document.documentElement.className = previousHtmlClass;
      document.body.className = previousBodyClass;
    };
  }, []);

  const canSubmit = useMemo(() => email.trim() && password.trim(), [email, password]);

  function handleSubmit(event) {
    event.preventDefault();
    if (!canSubmit) {
      setStatusMessage('Enter email and password to continue.');
      return;
    }

    setStatusMessage(`Secure session prepared for ${email}${remember ? ' with 30-day persistence.' : '.'}`);
    navigateToPath('/axiom_main_dashboard');
  }

  function handleSso(provider) {
    setStatusMessage(`${provider} single sign-on initiated for institutional workspace access.`);
    navigateToPath('/axiom_main_dashboard');
  }

  return (
    <main className="login-page">
      <section className="login-page__panel login-page__panel--form">
        <header className="login-page__brand">
          <span>Axiom</span>
          <small>Property Intelligence</small>
        </header>

        <div className="login-page__form-wrap">
          <div className="login-page__intro">
            <p className="login-page__eyebrow">Institutional Access</p>
            <h1>Welcome back</h1>
            <p>Enter your credentials to continue into your intelligence workspace.</p>
          </div>

          <form className="login-page__form" onSubmit={handleSubmit}>
            <label>
              <span>Corporate Email</span>
              <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" placeholder="name@company.com" />
            </label>

            <label>
              <span>Password</span>
              <div className="login-page__password-field">
                <input
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                />
                <button type="button" onClick={() => setShowPassword((current) => !current)} aria-label="Toggle password visibility">
                  <MaterialIcon>{showPassword ? 'visibility_off' : 'visibility'}</MaterialIcon>
                </button>
              </div>
            </label>

            <div className="login-page__form-row">
              <label className="login-page__check">
                <input type="checkbox" checked={remember} onChange={() => setRemember((current) => !current)} />
                <span>Keep me logged in for 30 days</span>
              </label>
              <a href="#/forgot_password">Forgot password?</a>
            </div>

            <button className="login-page__primary" type="submit" disabled={!canSubmit}>
              Sign In
            </button>
          </form>

          <div className="login-page__divider">Or continue with</div>

          <div className="login-page__sso-grid">
            <button type="button" onClick={() => handleSso('Google')}>
              <MaterialIcon>language</MaterialIcon>
              Google
            </button>
            <button type="button" onClick={() => handleSso('Microsoft')}>
              <MaterialIcon>business</MaterialIcon>
              Microsoft
            </button>
          </div>

          <div className="login-page__status">
            <MaterialIcon filled>verified_user</MaterialIcon>
            <span>{statusMessage}</span>
          </div>
        </div>

        <footer className="login-page__trust">
          {trustSignals.map((signal) => (
            <article key={signal.title}>
              <strong>{signal.title}</strong>
              <p>{signal.detail}</p>
            </article>
          ))}
        </footer>
      </section>

      <section className="login-page__panel login-page__panel--promo">
        <div className="login-page__promo-content">
          <p className="login-page__eyebrow login-page__eyebrow--light">Architectural Intelligence</p>
          <h2>The command layer for property markets.</h2>
          <p>
            Monitor live ingestion, evaluate market movements, and route review work without leaving the same operational canvas.
          </p>

          <div className="login-page__stats">
            {workspaceStats.map((item) => (
              <article key={item.label}>
                <strong>{item.value}</strong>
                <span>{item.label}</span>
              </article>
            ))}
          </div>

          <div className="login-page__preview">
            <div className="login-page__preview-top">
              <span>Central District</span>
              <button type="button">
                <MaterialIcon>search</MaterialIcon>
              </button>
            </div>
            <div className="login-page__preview-kpis">
              <article>
                <small>Market Yield</small>
                <strong>+12.4%</strong>
              </article>
              <article>
                <small>New Sources</small>
                <strong>18</strong>
              </article>
            </div>
            <div className="login-page__preview-chart">
              {[42, 58, 72, 66, 84, 78].map((value, index) => (
                <div key={index} style={{ height: `${value}%` }} />
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
