import { useEffect, useMemo, useState } from 'react';
import './ComparePropertiesSideBySidePage.css';

export const pageMeta = {
  slug: 'compare_properties_side_by_side',
  path: '/compare_properties_side_by_side',
  label: 'Compare Properties Side By Side',
  title: 'Property Comparison | Axiom Platform',
};

const sidebarLinks = [
  { icon: 'dashboard', label: 'Dashboard', href: '#/axiom_main_dashboard' },
  { icon: 'search', label: 'Search', href: '#/property_search_filters' },
  { icon: 'domain', label: 'Properties', href: '#/compare_properties_side_by_side', active: true },
  { icon: 'analytics', label: 'Analytics', href: '#/axiom_analytics_market_trends' },
  { icon: 'map', label: 'Map', href: '#/axiom_map_explorer' },
  { icon: 'description', label: 'Documents', href: '#/document_intelligence_analysis' },
];

const properties = [
  {
    id: 'obsidian',
    name: 'The Obsidian Plaza',
    category: 'Commercial Mixed-Use',
    assetId: 'AX-2091',
    location: 'Canary Wharf, E14',
    district: 'Business District',
    price: 'GBP 12.45M',
    delta: '+2.4% vs prev',
    area: '42,500 sqft',
    units: '12 units / 4 floors',
    owner: 'Institutional Bank',
    source: 'Bloomberg Real Estate',
    sourceIcon: 'database',
    updated: '4h ago',
    status: 'Verified Batch 402',
    badge: 'High Yield',
    badgeTone: 'positive',
    locationScore: 98,
    yield: 5.8,
    pricePerSqft: 292,
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuADoG1gSoCyVixoDKzUc-RICPfsmYIrYKZND8nBru1Y1zPJLzoZHvfHbu3N0cDYzOidOmt10IQUpAoDVkZ4tPbNZgk7hHEacbZcajtztd4FU1QXo1kWZubeScw3XzD1Hp9dH02cdfSxUjHBWVjNwxeaRnbyssknbXkGi9pWWYf-CZVZmYmT7SiBWuYXfNSwHHaDILD7YkOz0K3uxF30LXH0F_dhcc9rJNunICDpsBWPGOoKxAnfFPX_fWokMK4xkidQtSVk9vzY76g',
  },
  {
    id: 'st-jude',
    name: 'St. Jude Complex',
    category: 'Adaptive Re-use / Loft',
    assetId: 'AX-5510',
    location: 'Shoreditch, EC1',
    district: 'Tech Corridor',
    price: 'GBP 8.90M',
    delta: '-1.2% auction base',
    area: '28,200 sqft',
    units: '8 units / 3 floors',
    owner: 'Governmental',
    source: 'UK Land Registry',
    sourceIcon: 'public',
    updated: '1d ago',
    status: 'Manual Audit Pending',
    badge: 'High Risk',
    badgeTone: 'negative',
    locationScore: 82,
    yield: 4.6,
    pricePerSqft: 315,
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuD_z0e1VU9sx0EKfJJO3yPFNoLbt3LGGSe5p1DW6YEwDtMAyhI8T6V1NCdryi_ygF2IIkLPW5ArUi-H31N06FmiESRH3Yo8SEVyJk9WZP5QuCxbUYPdhbcImVFHBEounmFUJmGUJsmMyBLacYCRhWF3byRvC3zwtl3u9Pnn7KyjtqCb7aroMwQERlVedGTSNvRQ-25PQITqPD2ys9p4sktooaIXsgYxYj21c_D7_oSSjdRj5SHZUv1q5tRRmx6wt0Zg90lL4i16XqU',
  },
  {
    id: 'mercer',
    name: 'Mercer Yards',
    category: 'Multi-Family Retail',
    assetId: 'AX-1122',
    location: 'Southwark, SE1',
    district: 'Regeneration Zone',
    price: 'GBP 15.20M',
    delta: 'Static evaluation',
    area: '56,800 sqft',
    units: '24 units / 6 floors',
    owner: 'Private Family Office',
    source: 'Axiom proprietary',
    sourceIcon: 'home_work',
    updated: '2m ago',
    status: 'Live Connection Active',
    badge: 'Core Plus',
    badgeTone: 'neutral',
    locationScore: 91,
    yield: 5.2,
    pricePerSqft: 267,
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAPeiGs7mJwhVgXsihR1eLdo7raTs_sWvD6EJqhwnFYxHl8inuyBAdg-xRgXMjOhXsTBLvadzImBtC3Zua6vXTGIEEwgOG3VsoyW9jkfaP2Vpmrar2a_04HVtSsAUEHFN_gw5VmlmkRShvmi3KzfEM1KXtEOpv7GH7ILpk_yK-fhy4bhYz4533uUyajj0L5J4q0-qJ9MXkh7Stbr91Tr-93byCd-pJeTXQkBZc0rPgLQShJp8JwprJ8iZiqh5W4POsD1arAPmYTbnk',
  },
];

const comparisonRows = [
  { label: 'Core Identity', key: 'category', secondaryKey: 'assetId' },
  { label: 'Geographic Link', key: 'location', secondaryKey: 'district' },
  { label: 'Financial Position', key: 'price', secondaryKey: 'delta' },
  { label: 'Architecture', key: 'area', secondaryKey: 'units' },
  { label: 'Entity Type', key: 'owner' },
  { label: 'Intelligence Source', key: 'source', iconKey: 'sourceIcon' },
  { label: 'Data Currency', key: 'updated', secondaryKey: 'status' },
];

const insightModes = [
  { id: 'yield', label: 'Yield Focus' },
  { id: 'pricePerSqft', label: 'Price / Sqft' },
  { id: 'locationScore', label: 'Location Score' },
];

function MaterialIcon({ children, className = '' }) {
  return <span className={`material-symbols-outlined ${className}`.trim()}>{children}</span>;
}

export default function ComparePropertiesSideBySidePage() {
  const [activePropertyId, setActivePropertyId] = useState(properties[0].id);
  const [insightMode, setInsightMode] = useState('yield');

  useEffect(() => {
    const previousTitle = document.title;
    const previousHtmlClass = document.documentElement.className;
    const previousBodyClass = document.body.className;

    document.title = pageMeta.title;
    document.documentElement.className = 'light';
    document.body.className = 'bg-surface text-on-surface';

    return () => {
      document.title = previousTitle;
      document.documentElement.className = previousHtmlClass;
      document.body.className = previousBodyClass;
    };
  }, []);

  const activeProperty = useMemo(
    () => properties.find((property) => property.id === activePropertyId) ?? properties[0],
    [activePropertyId],
  );

  const topValue = useMemo(
    () => Math.max(...properties.map((property) => property[insightMode])),
    [insightMode],
  );

  return (
    <div className="compare-page">
      <aside className="compare-page__sidebar">
        <div>
          <div className="compare-page__brand">
            <div className="compare-page__brand-mark">
              <MaterialIcon>architecture</MaterialIcon>
            </div>
            <div>
              <h1>Axiom</h1>
              <p>Property Intelligence</p>
            </div>
          </div>

          <nav className="compare-page__nav" aria-label="Comparison navigation">
            {sidebarLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className={`compare-page__nav-link ${link.active ? 'compare-page__nav-link--active' : ''}`.trim()}
              >
                <MaterialIcon>{link.icon}</MaterialIcon>
                <span>{link.label}</span>
              </a>
            ))}
          </nav>
        </div>

        <div className="compare-page__sidebar-footer">
          <a href="#/workspace_team_settings">Workspace Settings</a>
        </div>
      </aside>

      <div className="compare-page__main">
        <header className="compare-page__topbar">
          <label className="compare-page__search">
            <MaterialIcon>search</MaterialIcon>
            <input type="text" placeholder="Quick search properties..." />
          </label>
          <div className="compare-page__topbar-actions">
            <button type="button" className="compare-page__icon-button" aria-label="Notifications">
              <MaterialIcon>notifications</MaterialIcon>
            </button>
            <button type="button" className="compare-page__icon-button" aria-label="Help">
              <MaterialIcon>help_outline</MaterialIcon>
            </button>
          </div>
        </header>

        <main className="compare-page__content">
          <section className="compare-page__hero">
            <div>
              <p className="compare-page__eyebrow">Properties / Comparison Engine</p>
              <h2>Competitive Matrix</h2>
              <p className="compare-page__hero-copy">
                Detailed side-by-side analysis of three distressed commercial assets in the Greater
                London metropolitan area.
              </p>
            </div>
            <div className="compare-page__hero-actions">
              <button type="button" className="compare-page__ghost-button">
                Export PDF
              </button>
              <button type="button" className="compare-page__primary-button">
                Share Report
              </button>
            </div>
          </section>

          <section className="compare-page__property-grid" aria-label="Property comparison cards">
            {properties.map((property) => (
              <article
                key={property.id}
                className={`compare-page__property-card ${
                  property.id === activeProperty.id ? 'compare-page__property-card--active' : ''
                }`.trim()}
              >
                <button
                  type="button"
                  className="compare-page__property-card-button"
                  onClick={() => setActivePropertyId(property.id)}
                >
                  <img src={property.image} alt={property.name} className="compare-page__property-image" />
                  <div className="compare-page__property-body">
                    <span className={`compare-page__badge compare-page__badge--${property.badgeTone}`.trim()}>
                      {property.badge}
                    </span>
                    <h3>{property.name}</h3>
                    <p>{property.location}</p>
                  </div>
                </button>
              </article>
            ))}
          </section>

          <section className="compare-page__matrix">
            {comparisonRows.map((row) => (
              <div key={row.label} className="compare-page__matrix-row">
                <div className="compare-page__matrix-label">{row.label}</div>
                <div className="compare-page__matrix-values">
                  {properties.map((property) => (
                    <div
                      key={`${property.id}-${row.label}`}
                      className={`compare-page__matrix-cell ${
                        property.id === activeProperty.id ? 'compare-page__matrix-cell--active' : ''
                      }`.trim()}
                    >
                      <div className="compare-page__matrix-primary">
                        {row.iconKey ? <MaterialIcon className="compare-page__matrix-icon">{property[row.iconKey]}</MaterialIcon> : null}
                        <span>{property[row.key]}</span>
                      </div>
                      {row.secondaryKey ? <div className="compare-page__matrix-secondary">{property[row.secondaryKey]}</div> : null}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </section>

          <section className="compare-page__insights">
            <div className="compare-page__insights-header">
              <div>
                <p className="compare-page__eyebrow">Compare Dimensions</p>
                <h3>Signal Benchmarks</h3>
              </div>
              <div className="compare-page__chips">
                {insightModes.map((mode) => (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => setInsightMode(mode.id)}
                    className={`compare-page__chip ${insightMode === mode.id ? 'compare-page__chip--active' : ''}`.trim()}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="compare-page__insight-grid">
              <article className="compare-page__insight-card compare-page__insight-card--chart">
                <p className="compare-page__section-label">
                  {insightMode === 'yield'
                    ? 'Yield Estimate'
                    : insightMode === 'pricePerSqft'
                      ? 'Price / Sqft Efficiency'
                      : 'Strategic Location Score'}
                </p>
                <div className="compare-page__bars">
                  {properties.map((property) => (
                    <div key={property.id} className="compare-page__bar-group">
                      <div
                        className={`compare-page__bar ${
                          property.id === activeProperty.id ? 'compare-page__bar--active' : ''
                        }`.trim()}
                        style={{ height: `${(property[insightMode] / topValue) * 100}%` }}
                      />
                      <strong>{property.name.split(' ')[0]}</strong>
                      <span>
                        {insightMode === 'yield'
                          ? `${property.yield.toFixed(1)}%`
                          : insightMode === 'pricePerSqft'
                            ? `GBP ${property.pricePerSqft}`
                            : `${property.locationScore}/100`}
                      </span>
                    </div>
                  ))}
                </div>
              </article>

              <article className="compare-page__insight-card compare-page__insight-card--focus">
                <p className="compare-page__section-label">Focused Asset</p>
                <h4>{activeProperty.name}</h4>
                <p className="compare-page__focus-copy">
                  {activeProperty.name} leads the current comparison set with the strongest combined
                  location reach and institutional data quality.
                </p>
                <dl className="compare-page__focus-metrics">
                  <div>
                    <dt>Location</dt>
                    <dd>{activeProperty.locationScore}/100</dd>
                  </div>
                  <div>
                    <dt>Yield</dt>
                    <dd>{activeProperty.yield.toFixed(1)}%</dd>
                  </div>
                  <div>
                    <dt>Price / sqft</dt>
                    <dd>GBP {activeProperty.pricePerSqft}</dd>
                  </div>
                </dl>
              </article>

              <article className="compare-page__insight-card compare-page__insight-card--benchmark">
                <p className="compare-page__section-label">Area Benchmark</p>
                <strong>GBP 14,200 / sqm</strong>
                <span className="compare-page__benchmark-pill">Undervalued pocket</span>
                <p>
                  Next auction window opens on <b>Oct 24, 2024</b>. Mercer Yards currently trades at
                  the most attractive price efficiency inside the selected cluster.
                </p>
              </article>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
