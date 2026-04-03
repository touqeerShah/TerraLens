import { useEffect, useMemo, useState } from 'react';
import './OnboardingSetupPage.css';
import { navigateToPath } from '../utils/navigation';

export const pageMeta = {
  slug: 'onboarding_setup',
  path: '/onboarding_setup',
  label: 'Onboarding Setup',
  title: 'Onboarding Setup | Axiom',
};

const jurisdictions = [
  { code: 'uk', label: 'United Kingdom', region: 'London, Manchester, Birmingham' },
  { code: 'us', label: 'United States', region: 'New York, Austin, Miami' },
  { code: 'de', label: 'Germany', region: 'Berlin, Frankfurt, Munich' },
  { code: 'sg', label: 'Singapore', region: 'Central, East, West' },
];

const focusAreas = ['Commercial', 'Residential', 'Industrial', 'Mixed-Use'];

function MaterialIcon({ children }) {
  return <span className="material-symbols-outlined">{children}</span>;
}

export default function OnboardingSetupPage() {
  const [workspaceName, setWorkspaceName] = useState('');
  const [selectedJurisdictions, setSelectedJurisdictions] = useState(['us', 'uk']);
  const [selectedFocus, setSelectedFocus] = useState(['Commercial', 'Mixed-Use']);
  const [teamSize, setTeamSize] = useState('11-25 analysts');
  const [statusMessage, setStatusMessage] = useState('Step 1 of 3: define the workspace boundary.');

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

  const readiness = useMemo(() => {
    let score = 28;
    if (workspaceName.trim()) score += 28;
    if (selectedJurisdictions.length >= 2) score += 22;
    if (selectedFocus.length >= 2) score += 22;
    return Math.min(score, 100);
  }, [workspaceName, selectedJurisdictions, selectedFocus]);

  function toggleSelection(value, state, setter) {
    setter((current) => (current.includes(value) ? current.filter((item) => item !== value) : [...current, value]));
  }

  function continueSetup() {
    setStatusMessage(
      `Workspace "${workspaceName || 'Untitled Workspace'}" is ${readiness}% configured. Jurisdiction sync will cover ${selectedJurisdictions.length} regions.`,
    );
    navigateToPath('/axiom_main_dashboard');
  }

  return (
    <div className="onboarding-page">
      <header className="onboarding-page__topbar">
        <a href="#/axiom_landing_page" className="onboarding-page__brand">
          Axiom <span>Intel</span>
        </a>
        <div className="onboarding-page__progress">
          <span>Setup Progress</span>
          <div className="onboarding-page__progress-bars" aria-hidden="true">
            {[1, 2, 3].map((step) => (
              <i key={step} data-active={step === 1} />
            ))}
          </div>
        </div>
      </header>

      <main className="onboarding-page__main">
        <section className="onboarding-page__context">
          <p className="onboarding-page__eyebrow">Workspace Basics</p>
          <h1>Define your market perimeter.</h1>
          <p>
            Establish the organizational and regional context that Axiom should use when prioritizing sources, documents, and alert rules.
          </p>

          <div className="onboarding-page__info-card">
            <article>
              <MaterialIcon>domain</MaterialIcon>
              <div>
                <strong>Organizational Hub</strong>
                <p>Collaborate under a shared market intelligence workspace with role-based access.</p>
              </div>
            </article>
            <article>
              <MaterialIcon>public</MaterialIcon>
              <div>
                <strong>Regional Focus</strong>
                <p>Routing and compliance defaults adapt to the selected jurisdictions.</p>
              </div>
            </article>
          </div>
        </section>

        <section className="onboarding-page__card">
          <div className="onboarding-page__card-head">
            <div>
              <p>Step 01 / 03</p>
              <h2>Workspace Setup</h2>
            </div>
            <div className="onboarding-page__readiness">
              <strong>{readiness}%</strong>
              <span>Ready</span>
            </div>
          </div>

          <label>
            <span>Workspace Name</span>
            <input
              value={workspaceName}
              onChange={(event) => setWorkspaceName(event.target.value)}
              placeholder="e.g. Gotham Development Partners"
            />
          </label>

          <div>
            <span className="onboarding-page__label">Primary Jurisdictions</span>
            <div className="onboarding-page__selection-grid">
              {jurisdictions.map((item) => (
                <button
                  key={item.code}
                  type="button"
                  data-active={selectedJurisdictions.includes(item.code)}
                  onClick={() => toggleSelection(item.code, selectedJurisdictions, setSelectedJurisdictions)}
                >
                  <strong>{item.label}</strong>
                  <small>{item.region}</small>
                </button>
              ))}
            </div>
          </div>

          <div>
            <span className="onboarding-page__label">Focus Areas</span>
            <div className="onboarding-page__chips">
              {focusAreas.map((item) => (
                <button
                  key={item}
                  type="button"
                  data-active={selectedFocus.includes(item)}
                  onClick={() => toggleSelection(item, selectedFocus, setSelectedFocus)}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <label>
            <span>Team Size</span>
            <select value={teamSize} onChange={(event) => setTeamSize(event.target.value)}>
              <option>1-10 analysts</option>
              <option>11-25 analysts</option>
              <option>26-50 analysts</option>
              <option>50+ analysts</option>
            </select>
          </label>

          <div className="onboarding-page__actions">
            <button type="button" className="onboarding-page__ghost" onClick={() => navigateToPath('/axiom_main_dashboard')}>
              Skip for now
            </button>
            <div>
              <button type="button" className="onboarding-page__ghost" onClick={() => navigateToPath('/sign_up')}>
                Back
              </button>
              <button type="button" className="onboarding-page__primary" onClick={continueSetup}>
                Continue
              </button>
            </div>
          </div>

          <p className="onboarding-page__status">{statusMessage}</p>
        </section>
      </main>
    </div>
  );
}
