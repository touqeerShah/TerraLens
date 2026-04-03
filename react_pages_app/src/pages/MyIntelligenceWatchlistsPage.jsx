import { useEffect, useMemo, useState } from 'react';
import './MyIntelligenceWatchlistsPage.css';
import { navigateToPath } from '../utils/navigation';

export const pageMeta = {
  slug: 'my_intelligence_watchlists',
  path: '/my_intelligence_watchlists',
  label: 'My Intelligence Watchlists',
  title: 'My Intelligence Watchlists | Axiom',
};

const tabs = ['Saved Searches', 'Watchlists', 'Geographic Alerts'];
const trackedProperties = [
  { id: '1', title: 'One Liberty Annex', location: 'New York, NY', type: 'Office', valuation: '$38.4M', capRate: '5.9%' },
  { id: '2', title: 'Canal House Portfolio', location: 'Chicago, IL', type: 'Mixed Use', valuation: '$22.8M', capRate: '6.4%' },
  { id: '3', title: 'The Foundry Lofts', location: 'Austin, TX', type: 'Residential', valuation: '$12.9M', capRate: '7.4%' },
];

const savedSearches = [
  { id: 's1', name: 'Debt Distress / Manhattan', filters: 'Commercial • Distressed • Last 7 days', count: '18 matches' },
  { id: 's2', name: 'Sunbelt Multifamily > 5.5%', filters: 'Residential • Yield • 12 markets', count: '42 matches' },
  { id: 's3', name: 'Adaptive Reuse Pipeline', filters: 'Mixed Use • Permit change • 5 regions', count: '9 matches' },
];

const geographicAlerts = [
  { id: 'g1', name: 'Lower Manhattan', filters: 'Permit velocity, auction notices, zoning overlays', count: '3 active signals' },
  { id: 'g2', name: 'Austin MSA', filters: 'Cap-rate movement and multi-family supply shock', count: '5 active signals' },
  { id: 'g3', name: 'South Florida Coast', filters: 'Insurance risk, flood overlays, pricing revisions', count: '2 active signals' },
];

function MaterialIcon({ children, filled = false }) {
  const style = filled ? { fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" } : undefined;
  return (
    <span className="material-symbols-outlined" style={style}>
      {children}
    </span>
  );
}

export default function MyIntelligenceWatchlistsPage() {
  const [activeTab, setActiveTab] = useState('Saved Searches');
  const [search, setSearch] = useState('');
  const [favorites, setFavorites] = useState(['1', '3']);

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

  const filteredProperties = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return trackedProperties;
    return trackedProperties.filter((item) => `${item.title} ${item.location} ${item.type}`.toLowerCase().includes(query));
  }, [search]);

  const activeCollection = activeTab === 'Geographic Alerts' ? geographicAlerts : savedSearches;

  function toggleFavorite(id) {
    setFavorites((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  }

  return (
    <div className="watchlists-page">
      <aside className="watchlists-page__sidebar">
        <div>
          <h1>Property Intel</h1>
          <p>Architectural Intelligence</p>
        </div>
        <nav>
          <a href="#/axiom_main_dashboard">Overview</a>
          <a href="#/market_alerts_subscriptions">Alerts</a>
          <a href="#/my_intelligence_watchlists" data-active="true">
            Watchlists
          </a>
          <a href="#/reports_data_exports_hub">Exports</a>
        </nav>
      </aside>

      <div className="watchlists-page__main">
        <header className="watchlists-page__hero">
          <div>
            <p>Persistent Intelligence</p>
            <h2>My watchlists and tracked searches</h2>
            <span>Save strategic views, follow properties, and keep regional signals connected to your workspace.</span>
          </div>

          <label className="watchlists-page__search">
            <MaterialIcon>search</MaterialIcon>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search tracked properties, markets, or feed names..."
            />
          </label>
        </header>

        <div className="watchlists-page__tabs">
          {tabs.map((tab) => (
            <button key={tab} type="button" data-active={activeTab === tab} onClick={() => setActiveTab(tab)}>
              {tab}
            </button>
          ))}
        </div>

        <section className="watchlists-page__saved-searches">
          {activeCollection.map((searchItem) => (
            <article key={searchItem.id} onClick={() => navigateToPath('/property_search_filters')}>
              <strong>{searchItem.name}</strong>
              <p>{searchItem.filters}</p>
              <span>{searchItem.count}</span>
            </article>
          ))}
        </section>

        {activeTab !== 'Geographic Alerts' ? (
          <section className="watchlists-page__properties">
            {filteredProperties.map((property) => (
              <article key={property.id} className="watchlists-page__property-card" onClick={() => navigateToPath('/property_detail_page')}>
                <div className="watchlists-page__property-media">
                  <button type="button" onClick={(event) => { event.stopPropagation(); toggleFavorite(property.id); }}>
                    <MaterialIcon filled={favorites.includes(property.id)}>favorite</MaterialIcon>
                  </button>
                  <span>{property.type}</span>
                </div>
                <div className="watchlists-page__property-body">
                  <h3>{property.title}</h3>
                  <p>{property.location}</p>
                  <div>
                    <article>
                      <small>Valuation</small>
                      <strong>{property.valuation}</strong>
                    </article>
                    <article>
                      <small>Cap Rate</small>
                      <strong>{property.capRate}</strong>
                    </article>
                  </div>
                </div>
              </article>
            ))}

            <button type="button" className="watchlists-page__add-card" onClick={() => navigateToPath('/property_search_filters')}>
              <MaterialIcon>add</MaterialIcon>
              Add Property to Watchlist
            </button>
          </section>
        ) : null}

        <section className="watchlists-page__feeds">
          <div>
            <h3>Connected Intelligence Feeds</h3>
            <p>Operational feeds that are currently enriching your saved searches and tracked assets.</p>
          </div>

          <div className="watchlists-page__feed-grid">
            {[
              ['MSCI Real Assets', 'Live API Connection', 'Connected'],
              ['EDGAR Filings', 'Hourly Sync', 'Connected'],
              ['Zillow Market Trend', 'Restricted', 'Attention'],
            ].map(([name, detail, state]) => (
              <article key={name}>
                <strong>{name}</strong>
                <span>{detail}</span>
                <em>{state}</em>
              </article>
            ))}
            <a href="#/api_external_integrations">Integrate Source</a>
          </div>
        </section>
      </div>
    </div>
  );
}
