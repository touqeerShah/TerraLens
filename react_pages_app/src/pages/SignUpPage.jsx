import { useEffect, useMemo, useState } from 'react';
import './SignUpPage.css';
import { hrefForPath, navigateToPath } from '../utils/navigation';

export const pageMeta = {
  slug: 'sign_up',
  path: '/sign_up',
  label: 'Sign Up',
  title: 'Sign Up | Axiom Intelligence',
};

const roles = ['Analyst', 'Admin', 'Executive', 'Research Lead'];
const countries = ['United States', 'United Kingdom', 'Germany', 'Singapore', 'United Arab Emirates'];

function MaterialIcon({ children }) {
  return <span className="material-symbols-outlined">{children}</span>;
}

function getPasswordStrength(password) {
  const checks = [password.length >= 8, /[A-Z]/.test(password), /\d/.test(password), /[^A-Za-z0-9]/.test(password)];
  return checks.filter(Boolean).length;
}

export default function SignUpPage() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    company: '',
    role: roles[0],
    country: countries[0],
    password: '',
    acceptedTerms: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [statusMessage, setStatusMessage] = useState('Create your workspace access profile.');

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

  const strength = useMemo(() => getPasswordStrength(form.password), [form.password]);
  const canSubmit = useMemo(
    () => form.name.trim() && form.email.trim() && form.company.trim() && form.password.trim() && form.acceptedTerms,
    [form],
  );

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    if (!canSubmit) {
      setStatusMessage('Complete all required fields and accept the terms to continue.');
      return;
    }

    setStatusMessage(`Workspace invitation drafted for ${form.name} at ${form.company}.`);
    navigateToPath('/onboarding_setup');
  }

  return (
    <div className="signup-page">
      <header className="signup-page__header">
        <a href={hrefForPath('/axiom_landing_page')} className="signup-page__brand">
          Axiom
        </a>
        <a href="#/login" className="signup-page__signin-link">
          Sign In
        </a>
      </header>

      <main className="signup-page__main">
        <section className="signup-page__intro">
          <p className="signup-page__eyebrow">Workspace Creation</p>
          <h1>Architect the next market advantage.</h1>
          <p>
            Join the Axiom network to activate document intelligence, live market monitoring, and team-based review workflows.
          </p>

          <div className="signup-page__feature-list">
            {[
              'Spin up secure workspace roles in minutes.',
              'Connect market sources and document pipelines in one place.',
              'Share alerts, exports, and agent findings across your team.',
            ].map((item) => (
              <div key={item}>
                <MaterialIcon>check_circle</MaterialIcon>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="signup-page__card">
          <form className="signup-page__form" onSubmit={handleSubmit}>
            <div className="signup-page__grid">
              <label>
                <span>Full Name</span>
                <input value={form.name} onChange={(event) => updateField('name', event.target.value)} placeholder="Johnathan Sterling" />
              </label>
              <label>
                <span>Work Email</span>
                <input
                  type="email"
                  value={form.email}
                  onChange={(event) => updateField('email', event.target.value)}
                  placeholder="j.sterling@axiom.com"
                />
              </label>
            </div>

            <label>
              <span>Password</span>
              <div className="signup-page__password">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={(event) => updateField('password', event.target.value)}
                  placeholder="Create a secure password"
                />
                <button type="button" onClick={() => setShowPassword((current) => !current)}>
                  <MaterialIcon>{showPassword ? 'visibility_off' : 'visibility'}</MaterialIcon>
                </button>
              </div>
              <div className="signup-page__strength">
                {[1, 2, 3, 4].map((step) => (
                  <span key={step} data-active={strength >= step} />
                ))}
              </div>
              <small>
                Strength:{' '}
                {['Weak', 'Developing', 'Good', 'Optimal'][Math.max(0, strength - 1)] || 'Weak'}
              </small>
            </label>

            <div className="signup-page__grid">
              <label>
                <span>Company / Organization</span>
                <input value={form.company} onChange={(event) => updateField('company', event.target.value)} placeholder="Sterling Holdings" />
              </label>
              <label>
                <span>Role</span>
                <select value={form.role} onChange={(event) => updateField('role', event.target.value)}>
                  {roles.map((role) => (
                    <option key={role}>{role}</option>
                  ))}
                </select>
              </label>
            </div>

            <label>
              <span>Country</span>
              <select value={form.country} onChange={(event) => updateField('country', event.target.value)}>
                {countries.map((country) => (
                  <option key={country}>{country}</option>
                ))}
              </select>
            </label>

            <label className="signup-page__terms">
              <input
                type="checkbox"
                checked={form.acceptedTerms}
                onChange={() => updateField('acceptedTerms', !form.acceptedTerms)}
              />
              <span>
                I accept the <a href="#/help_documentation_center">Terms of Service</a> and Privacy Policy.
              </span>
            </label>

            <button className="signup-page__primary" type="submit" disabled={!canSubmit}>
              Create Account
            </button>

            <p className="signup-page__status">{statusMessage}</p>
          </form>
        </section>
      </main>
    </div>
  );
}
