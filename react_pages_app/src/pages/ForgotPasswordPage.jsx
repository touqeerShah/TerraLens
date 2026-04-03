import { useEffect, useMemo, useState } from 'react';
import './ForgotPasswordPage.css';

export const pageMeta = {
  slug: 'forgot_password',
  path: '/forgot_password',
  label: 'Forgot Password',
  title: 'Account Recovery | Axiom',
};

function MaterialIcon({ children, filled = false }) {
  const style = filled ? { fontVariationSettings: "'FILL' 1, 'wght' 300, 'GRAD' 0, 'opsz' 24" } : undefined;
  return (
    <span className="material-symbols-outlined" style={style}>
      {children}
    </span>
  );
}

function passwordStrength(password) {
  let score = 0;
  if (password.length >= 8) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  return score;
}

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [linkSent, setLinkSent] = useState(false);
  const [credentialsUpdated, setCredentialsUpdated] = useState(false);

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

  const strength = useMemo(() => passwordStrength(password), [password]);
  const passwordMessage =
    strength >= 4 ? 'Strength: Strong Architecture' : strength >= 2 ? 'Strength: Improving' : 'Strength: Weak';

  return (
    <div className="forgot-page">
      <header className="forgot-page__topbar">Axiom</header>

      <main className="forgot-page__content">
        <section className="forgot-page__layout">
          <article className="forgot-page__info">
            <p className="forgot-page__eyebrow">Security Protocol</p>
            <h1>Securing your Intelligence.</h1>
            <p>
              Axiom employs enterprise-grade encryption to protect your architectural insights. Follow
              the recovery process to securely regain access to your workspace.
            </p>

            <div className="forgot-page__feature-list">
              <div>
                <span><MaterialIcon>shield</MaterialIcon></span>
                <div>
                  <strong>Multi-Factor Readiness</strong>
                  <p>Enable 2FA after reset for enhanced vault security.</p>
                </div>
              </div>
              <div>
                <span><MaterialIcon>encrypted</MaterialIcon></span>
                <div>
                  <strong>Encrypted Reset</strong>
                  <p>Recovery tokens are single-use and expire within 15 minutes.</p>
                </div>
              </div>
            </div>
          </article>

          <section className="forgot-page__forms">
            <article className="forgot-page__card">
              <div className="forgot-page__card-head">
                <h2>Recovery Initiation</h2>
                <p>Enter the email associated with your Axiom account.</p>
              </div>

              <label>
                <span>Registered Email Address</span>
                <input
                  type="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </label>

              <button type="button" className="forgot-page__primary-button" onClick={() => setLinkSent(Boolean(email))}>
                Send Reset Link
              </button>

              <button type="button" className="forgot-page__link-button">
                Return to Secure Login
              </button>
            </article>

            <article className="forgot-page__notice" data-visible={linkSent}>
              <span><MaterialIcon filled>check_circle</MaterialIcon></span>
              <div>
                <strong>Check your inbox</strong>
                <p>{linkSent ? `A reset link has been dispatched to ${email || 'your email'}.` : 'Send a reset link to continue.'}</p>
              </div>
            </article>

            <article className="forgot-page__card forgot-page__card--accent">
              <div className="forgot-page__card-head">
                <p className="forgot-page__token-pill">Verification Active</p>
                <h2>Finalize Recovery</h2>
                <p>Establish a high-entropy password for your account.</p>
              </div>

              <label>
                <span>New Secure Password</span>
                <input
                  type="password"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
              </label>

              <div className="forgot-page__strength">
                {[0, 1, 2, 3].map((index) => (
                  <i key={index} data-active={index < strength} />
                ))}
              </div>
              <p className="forgot-page__strength-label">{passwordMessage}</p>

              <label>
                <span>Confirm New Password</span>
                <input
                  type="password"
                  placeholder="••••••••••••"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                />
              </label>

              <button
                type="button"
                className="forgot-page__primary-button"
                onClick={() => setCredentialsUpdated(Boolean(password) && password === confirmPassword)}
              >
                Update Credentials
              </button>

              {credentialsUpdated ? (
                <p className="forgot-page__success-message">Credentials updated. Your secure login is ready.</p>
              ) : null}
            </article>

            <footer className="forgot-page__footer-note">
              <p>
                Need technical assistance? <a href="#/help_documentation_center">Contact Axiom Support</a>
              </p>
              <div>
                <span><MaterialIcon>lock</MaterialIcon> 256-bit AES</span>
                <span><MaterialIcon>verified_user</MaterialIcon> SOC2 Type II</span>
              </div>
            </footer>
          </section>
        </section>
      </main>
    </div>
  );
}
