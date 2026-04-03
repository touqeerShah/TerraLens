import { useEffect, useMemo, useState } from 'react';
import './AxiomAnalyticsMarketTrendsPage.css';
import { navigateToPath } from '../utils/navigation';

export const pageMeta = {
  slug: 'axiom_analytics_market_trends',
  path: '/axiom_analytics_market_trends',
  label: 'Axiom Analytics Market Trends',
  title: 'Axiom | Market Trends Analytics',
};

const avatar =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBKoBG7vPnb-LyUx8SGFQLfwqLJNPwLudewbJUvMtlwli2LhR1sOLSrluBYfRc-Ic93lh3mCSXCVLdt2CylGLBaASyM1lunPmVb6QiVxFEMzhipgJwj-dBnyNStPKEulGjFVyIAiHG31jMZ_MUJd2QVwPrtnsKVqBYS4-9YiLbDhbitqnwHp33CkyAWk2CX4Oe23TpcUzG8pv-f8EiNabkc2BBc7CZGUsvlFbWZ0vQT54zz0hWWHFzfAuq8ogFc0-VTm188y0j3HaI';

const periods = ['Weekly', 'Monthly', 'Quarterly'];
const barsByPeriod = {
  Weekly: [42, 58, 46, 70, 64, 76, 52],
  Monthly: [40, 60, 55, 75, 65, 85, 70, 60],
  Quarterly: [55, 70, 82, 68],
};

const labelsByPeriod = {
  Weekly: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  Monthly: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'],
  Quarterly: ['Q1', 'Q2', 'Q3', 'Q4'],
};

const sectors = [
  { id: 'office', label: 'Office', delta: '+12.5%', volume: '42k listings' },
  { id: 'industrial', label: 'Industrial', delta: '+8.1%', volume: '18k listings' },
  { id: 'multifamily', label: 'Multifamily', delta: '+6.8%', volume: '27k listings' },
  { id: 'retail', label: 'Retail', delta: '-1.4%', volume: '11k listings' },
];

const alerts = [
  { title: 'Distressed office supply rising in Central London', level: 'Watch', tone: 'orange' },
  { title: 'Auction turnover above baseline in Valletta cluster', level: 'Healthy', tone: 'green' },
  { title: 'Rent compression stabilizing in logistics corridors', level: 'Healthy', tone: 'green' },
];

function MaterialIcon({ children, filled = false }) {
  const style = filled ? { fontVariationSettings: "'FILL' 1, 'wght' 300, 'GRAD' 0, 'opsz' 24" } : undefined;
  return <span className="material-symbols-outlined" style={style}>{children}</span>;
}

export default function AxiomAnalyticsMarketTrendsPage() {
  const [period, setPeriod] = useState('Monthly');
  const [compareMode, setCompareMode] = useState(true);
  const [activeSector, setActiveSector] = useState('office');

  useEffect(() => {
    const previousTitle = document.title;
    const previousHtmlClass = document.documentElement.className;
    const previousBodyClass = document.body.className;
    document.title = pageMeta.title;
    document.documentElement.className = 'light';
    document.body.className = 'bg-background text-on-background font-body';
    return () => {
      document.title = previousTitle;
      document.documentElement.className = previousHtmlClass;
      document.body.className = previousBodyClass;
    };
  }, []);

  const activeBars = useMemo(() => barsByPeriod[period], [period]);
  const activeLabels = useMemo(() => labelsByPeriod[period], [period]);
  const activeSectorData = sectors.find((sector) => sector.id === activeSector) ?? sectors[0];

  return (
    <div className="analytics-page">
      <div className="analytics-page__layout">
        <aside className="analytics-page__sidebar">
          <div className="analytics-page__brand">
            <div className="analytics-page__brand-icon">
              <MaterialIcon filled>domain</MaterialIcon>
            </div>
            <div>
              <p className="analytics-page__brand-title">Axiom Intel</p>
              <p className="analytics-page__brand-subtitle">Enterprise Tier</p>
            </div>
          </div>

          <nav className="analytics-page__nav">
            <a href="#/axiom_main_dashboard">Dashboard</a>
            <a href="#/property_search_filters">Portfolio</a>
            <a href="#/axiom_analytics_market_trends" data-active="true">Analytics</a>
            <a href="#/market_activity_analysis">Market Trends</a>
          </nav>

          <div className="analytics-page__sidebar-footer">
            <button className="analytics-page__side-button" type="button" onClick={() => navigateToPath('/sign_up')}>Upgrade Plan</button>
            <a className="analytics-page__utility-link" href="#/help_documentation_center">
              <MaterialIcon>help</MaterialIcon>
              <span>Help Center</span>
            </a>
            <a className="analytics-page__utility-link" href="#/login">
              <MaterialIcon>logout</MaterialIcon>
              <span>Log Out</span>
            </a>
          </div>
        </aside>

        <div className="analytics-page__main">
          <header className="analytics-page__topbar">
            <div className="analytics-page__topbar-left">
              <h1 className="analytics-page__title">Analytics</h1>
              <nav className="analytics-page__topnav">
                <a href="#/axiom_main_dashboard">Portfolio</a>
                <a href="#/axiom_analytics_market_trends" data-active="true">Analytics</a>
                <a href="#/market_activity_analysis">Market Monitoring</a>
              </nav>
            </div>

            <div className="analytics-page__topbar-right">
              <label className="analytics-page__search">
                <MaterialIcon>search</MaterialIcon>
                <input type="text" placeholder="Search markets..." />
              </label>
              <button className="analytics-page__icon-button" type="button"><MaterialIcon>notifications</MaterialIcon></button>
              <button className="analytics-page__icon-button" type="button"><MaterialIcon>settings</MaterialIcon></button>
              <img className="analytics-page__avatar" src={avatar} alt="User profile" />
            </div>
          </header>

          <main className="analytics-page__content">
            <div className="analytics-page__header-row">
              <div>
                <p className="analytics-page__section-label">Market Overview</p>
                <h2 className="analytics-page__hero-title">Market Intelligence Hub</h2>
              </div>
              <div className="analytics-page__actions">
                <div className="analytics-page__compare">
                  <span>Compare Mode</span>
                  <button
                    className={`analytics-page__toggle ${compareMode ? 'analytics-page__toggle--on' : ''}`}
                    type="button"
                    onClick={() => setCompareMode((value) => !value)}
                  >
                    <span />
                  </button>
                </div>
                <button className="analytics-page__ghost" type="button" onClick={() => navigateToPath('/reports_data_exports_hub')}>Export Chart</button>
                <button className="analytics-page__cta" type="button" onClick={() => navigateToPath('/my_intelligence_watchlists')}>Save Dashboard</button>
              </div>
            </div>

            <section className="analytics-page__kpis">
              {[
                { label: 'Total Listings', value: '124,802', note: 'Growth vs previous quarter', pill: '+12.5%', tone: 'green' },
                { label: 'New Additions', value: '14,291', note: 'Verified listings last 30 days', pill: '+4.2%', tone: 'green' },
                { label: 'Updated Data', value: '45,108', note: 'Refreshed price and status points', pill: 'Stable', tone: 'blue' },
                { label: 'Removed / Sold', value: '8,432', note: 'Closed or delisted inventory', pill: '-2.1%', tone: 'blue' },
              ].map((item) => (
                <article key={item.label} className="analytics-page__kpi">
                  <div className="analytics-page__kpi-label">{item.label}</div>
                  <div className="analytics-page__kpi-value">
                    {item.value}
                    <span className={`analytics-page__kpi-pill analytics-page__kpi-pill--${item.tone}`}>{item.pill}</span>
                  </div>
                  <div className="analytics-page__kpi-note">{item.note}</div>
                </article>
              ))}
            </section>

            <div className="analytics-page__grid">
              <section className="analytics-page__card">
                <div className="analytics-page__card-body">
                  <div className="analytics-page__header-row">
                    <div>
                      <h3 className="analytics-page__card-title">Market Trend Analysis</h3>
                      <p className="analytics-page__card-subtitle">
                        {compareMode
                          ? `Comparing ${activeSectorData.label} against portfolio baseline`
                          : 'Aggregate pricing across institutional sectors'}
                      </p>
                    </div>
                    <div className="analytics-page__periods">
                      {periods.map((option) => (
                        <button key={option} type="button" data-active={period === option} onClick={() => setPeriod(option)}>
                          {option}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="analytics-page__chart">
                    {activeBars.map((value, index) => (
                      <div key={`${period}-${index}`} className="analytics-page__bar-wrap">
                        <div className="analytics-page__bar" data-active={value === Math.max(...activeBars)} style={{ height: `${value}%` }} />
                        <div className="analytics-page__bar-label">{activeLabels[index]}</div>
                      </div>
                    ))}
                  </div>

                  <div className="analytics-page__segments">
                    <p className="analytics-page__section-label">Focus Segment</p>
                    <div className="analytics-page__segment-list">
                      {sectors.map((sector) => (
                        <button
                          key={sector.id}
                          type="button"
                          data-active={sector.id === activeSector}
                          onClick={() => setActiveSector(sector.id)}
                        >
                          {sector.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </section>

              <div>
                <section className="analytics-page__card">
                  <div className="analytics-page__card-body">
                    <h3 className="analytics-page__card-title">Sector Ranking</h3>
                    <p className="analytics-page__card-subtitle">Top performance by listing velocity and yield resilience.</p>
                    <div className="analytics-page__rank-list">
                      {sectors.map((sector) => (
                        <div key={sector.id} className="analytics-page__rank-item">
                          <div>
                            <div className="analytics-page__rank-name">{sector.label}</div>
                            <div className="analytics-page__rank-meta">{sector.volume}</div>
                          </div>
                          <span className="analytics-page__pill analytics-page__pill--green">{sector.delta}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>

                <section className="analytics-page__card" style={{ marginTop: '1rem' }}>
                  <div className="analytics-page__card-body">
                    <h3 className="analytics-page__card-title">Active Signals</h3>
                    <p className="analytics-page__card-subtitle">Operational alerts feeding the intelligence layer.</p>
                    <div style={{ marginTop: '1rem' }}>
                      {alerts.map((alert) => (
                        <div key={alert.title} className="analytics-page__alert" onClick={() => navigateToPath('/market_alerts_subscriptions')}>
                          <div>
                            <div className="analytics-page__alert-title">{alert.title}</div>
                            <div className="analytics-page__alert-meta">Updated in the last 15 minutes</div>
                          </div>
                          <span className={`analytics-page__pill analytics-page__pill--${alert.tone}`}>{alert.level}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
