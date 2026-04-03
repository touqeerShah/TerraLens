import { useEffect } from 'react';
import './AxiomLandingPage.css';

export const pageMeta = {
  slug: 'axiom_landing_page',
  path: '/axiom_landing_page',
  label: 'Axiom Landing Page',
  title: 'Axiom | Property Intelligence Platform',
};

const heroImage =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBpUrqM0FIts8p76oFFRS3qMsnCpUrqWsQorye1deKGwbyswe4DsT_q6RWrVINfSVIl31o69vgF6q3C-XxrHwU-n0Wddk_y_Fws5EPR_3SBZVpzdTtfNJ7PGY3jhoYeeZYDxz5eG2WXs0MJVtadd07O6jJXxS6sxhWla8sad6b9hkbBkJd7tIafq5fclQOGSc-fP6GX08wwzFOSTBzEuJgMCsdX9Fjk_aXvSngs0-Nw9tDBTvJ8d0kjvbBctys_djvrFhLSpKWXaYw';

const featureImages = [
  'https://lh3.googleusercontent.com/aida-public/AB6AXuB7hC_hivoEikWCTiM1LDSEjl1iKuVTlgtQCJETKN0M7FNAFopmD3qCEp_iJWstYqKceh23MWXgaqq6j9oQT7vyhYh0D4WsKRklh7g_3uC9UTYM7s-Kn3k3j1SOFMR-yQtXuZTg1WgjFCNMouMj9hhJv1PgbEiB-neILGWBXYsAfaMWycFLoQ-eYslzTmOX_BNwZusOIMTD0RFzGMauZgK_FmqejqFPaHJdcaGdhSDbs1Hifs7JTjvKMoMwjOClDl3LXQERKB92JF0',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuA9Q4knkkQj4HzFpZkHWgRlPskcUPkCiocx0Kypwa4056t_QHkgRSI7IHsxuZQlvpzl1QyBv4_PvvHr242Jl-0jVVMnLPfi0Q842VzwZiDGoYXjB8Qr1gTW1h5sk0dQBEkwdU1IXFMCpBbtgljbe5_SqVFTBl9bPhOpVC7s_jgRW7xNpPz53bnL9ZdXxzTF_oipYn0XbDQe0q3w6m_CDN6YYmGg6RrEKT8CGvELFiaw7uNDtR0LhYpJQ6WzgEGAQg2mQ2upA0rn7-w',
];

const stats = [
  { value: '45k+', label: 'Active Sources' },
  { value: '2.8M', label: 'Docs Processed' },
  { value: 'Real-time', label: 'Daily Updates' },
  { value: '99.9%', label: 'OCR Accuracy' },
];

const challenges = [
  { icon: 'cloud_off', title: 'Fragmented Data', text: 'Listings, legal notices, and bank auctions are scattered across disconnected silos.' },
  { icon: 'history', title: 'Manual Monitoring', text: 'Teams still refresh sites and download PDFs by hand to track price and auction changes.' },
  { icon: 'timer', title: 'Time Decay', text: 'By the time a distressed asset is found, someone else has already moved.' },
  { icon: 'warning', title: 'Missed Signals', text: 'Important market triggers stay hidden inside long PDFs and poorly indexed portals.' },
];

const features = [
  { title: 'Map Heatmaps', text: 'Visualize market velocity, auction concentration, and supply-demand imbalance across regions.', image: featureImages[0] },
  { title: 'Graph Analytics', text: 'Surface relationships between developers, lenders, owners, and assets to reveal ownership patterns.', image: featureImages[1] },
];

function MaterialIcon({ children }) {
  return <span className="material-symbols-outlined">{children}</span>;
}

export default function AxiomLandingPage() {
  useEffect(() => {
    const previousTitle = document.title;
    const previousHtmlClass = document.documentElement.className;
    const previousBodyClass = document.body.className;

    document.title = pageMeta.title;
    document.documentElement.className = 'light';
    document.body.className = 'bg-surface font-body text-on-surface selection:bg-primary-fixed selection:text-on-primary-fixed';

    return () => {
      document.title = previousTitle;
      document.documentElement.className = previousHtmlClass;
      document.body.className = previousBodyClass;
    };
  }, []);

  return (
    <div className="landing-page">
      <header className="landing-page__header">
        <div className="landing-page__shell landing-page__header-inner">
          <a className="landing-page__brand" href="#/axiom_landing_page">
            Axiom
          </a>
          <nav className="landing-page__nav">
            <a href="#features" data-active="true">
              Features
            </a>
            <a href="#solutions">Solutions</a>
            <a href="#pricing">Pricing</a>
            <a href="#about">About</a>
          </nav>
          <div className="landing-page__header-actions">
            <a className="landing-page__ghost" href="#/login">
              Login
            </a>
            <a className="landing-page__primary" href="#/sign_up">
              Start Free
            </a>
          </div>
        </div>
      </header>

      <main className="landing-page__shell">
        <section className="landing-page__hero">
          <div>
            <p className="landing-page__eyebrow">Architectural Intelligence</p>
            <h1>One platform to track property listings, auctions, PDFs, and market activity</h1>
            <p>
              Axiom centralizes fragmented real estate data into a single, high-fidelity intelligence layer for
              institutional decision-makers.
            </p>
            <div className="landing-page__hero-actions">
              <a className="landing-page__primary" href="#/sign_up">
                Start Now
              </a>
              <a className="landing-page__secondary" href="#/help_documentation_center">
                Request Demo
              </a>
            </div>
            <div className="landing-page__source-types">
              {['Websites', 'PDFs', 'Bank Auctions', 'Gov Notices'].map((item, index) => (
                <div key={item} className="landing-page__source-item">
                  <MaterialIcon>{['language', 'picture_as_pdf', 'gavel', 'account_balance'][index]}</MaterialIcon>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="landing-page__hero-card">
            <img className="landing-page__hero-image" src={heroImage} alt="Axiom platform hero preview" />
          </div>
        </section>

        <section className="landing-page__stats">
          {stats.map((stat) => (
            <div key={stat.label} className="landing-page__stat">
              <div className="landing-page__stat-value">{stat.value}</div>
              <div className="landing-page__stat-label">{stat.label}</div>
            </div>
          ))}
        </section>

        <section className="landing-page__section" id="about">
          <div className="landing-page__section-intro">
            <p className="landing-page__eyebrow">The Challenge</p>
            <h2>The market moves fast. Your data should not be the bottleneck.</h2>
          </div>
          <div className="landing-page__challenge-grid">
            {challenges.map((item) => (
              <article key={item.title} className="landing-page__challenge-card">
                <div className="landing-page__icon-box">
                  <MaterialIcon>{item.icon}</MaterialIcon>
                </div>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="landing-page__section" id="solutions">
          <div className="landing-page__section-intro">
            <p className="landing-page__eyebrow">The Architectural Solution</p>
            <h2>Structured intelligence across every source and signal.</h2>
            <p className="landing-page__section-copy">
              We combine search, extraction, enrichment, and monitoring into one operating layer for institutional real estate research.
            </p>
          </div>
          <div className="landing-page__solutions">
            <article className="landing-page__solution-card landing-page__solution-card--wide">
              <h3>Unified Search</h3>
              <p>Query every portal, PDF, and auction notice from one search surface with instant indexing.</p>
              <div className="landing-page__mock-search">
                <div className="landing-page__mock-search-bar">
                  <MaterialIcon>search</MaterialIcon>
                  <span>Class A office auctions in central London</span>
                </div>
                <div className="landing-page__mock-search-card">
                  <div className="landing-page__mock-thumb" />
                  <div>
                    <strong>Nexus Office Park</strong>
                    <div>Reserve EUR 42.5M | New signal detected</div>
                  </div>
                </div>
                <div className="landing-page__mock-search-card">
                  <div className="landing-page__mock-thumb" />
                  <div>
                    <strong>Sterling Lofts</strong>
                    <div>Bank-owned | OCR-backed yield summary</div>
                  </div>
                </div>
              </div>
            </article>

            <article className="landing-page__solution-card landing-page__solution-card--tall">
              <h3>Continuous Monitoring</h3>
              <p>Automate source checks so price changes, reserve updates, and new listings surface immediately.</p>
              <div className="landing-page__mock-code">
                {'// SOURCE_DETECTED: Gov_Portal_Notice'}
                <br />
                {'event: "NEW_LISTING"'}
                <br />
                {'reserve: "EUR 4.2M"'}
                <br />
                {'coords: [35.89, 14.51]'}
              </div>
            </article>

            <article className="landing-page__solution-card landing-page__solution-card--full">
              <h3>Graph Relationships</h3>
              <p>
                Connect developers, owners, debt holders, and related assets to see market ownership patterns before they become obvious.
              </p>
            </article>
          </div>
        </section>

        <section className="landing-page__section" id="features">
          <div className="landing-page__section-intro">
            <h2>Designed for research depth.</h2>
            <p className="landing-page__section-copy">
              Axiom is built for professionals who need signal density, traceability, and speed.
            </p>
          </div>
          <div className="landing-page__feature-grid">
            {features.map((feature) => (
              <article key={feature.title} className="landing-page__feature-card">
                <div className="landing-page__icon-box" style={{ color: '#041627', background: '#eceef0' }}>
                  <MaterialIcon>{feature.title === 'Map Heatmaps' ? 'map' : 'monitoring'}</MaterialIcon>
                </div>
                <h3>{feature.title}</h3>
                <p>{feature.text}</p>
                <img src={feature.image} alt={feature.title} />
              </article>
            ))}
          </div>
        </section>

        <section className="landing-page__cta" id="pricing">
          <h2 className="landing-page__cta-title">The future of property intelligence is here.</h2>
          <p>Join the institutions using Axiom to out-research the market and move before competitors do.</p>
          <div className="landing-page__cta-actions">
            <a className="landing-page__primary" href="#/sign_up">
              Start Your Free Trial
            </a>
            <a className="landing-page__secondary" href="#/login">
              Talk to Sales
            </a>
          </div>
        </section>

        <footer className="landing-page__footer">
          <div className="landing-page__footer-grid">
            <div>
              <a className="landing-page__brand" href="#/axiom_landing_page">
                Axiom
              </a>
              <p>
                A next-generation property intelligence platform providing market clarity through structured data and architectural insight.
              </p>
            </div>
            <div>
              <h4>Product</h4>
              <a href="#features">Features</a>
              <br />
              <a href="#solutions">Solutions</a>
              <br />
              <a href="#pricing">Pricing</a>
            </div>
            <div>
              <h4>Company</h4>
              <a href="#about">About</a>
              <br />
              <a href="#/help_documentation_center">Contact</a>
            </div>
            <div>
              <h4>Platform</h4>
              <a href="#/login">Login</a>
              <br />
              <a href="#/sign_up">Start Free</a>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
