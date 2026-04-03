import { useEffect, useMemo, useState } from 'react';
import './MarketActivityAnalysisPage.css';
import { navigateToPath } from '../utils/navigation';

export const pageMeta = {
  slug: 'market_activity_analysis',
  path: '/market_activity_analysis',
  label: 'Market Activity Analysis',
  title: 'Market Activity Analysis | Architect Intelligence',
};

const periods = ['Year', 'Quarter', 'Month'];
const metrics = ['Avg. Listing Price', 'Auction Velocity', 'Cap Rate Shift'];
const sources = ['All Sources', 'Government', 'Bank', 'Private'];
const zones = [
  {
    id: 'central',
    name: 'Central District',
    activity: 'Extreme',
    listings: '1,248',
    delta: '+12%',
    price: '$4.2M',
    priceDelta: '-2.1%',
    trend: [34, 46, 58, 48, 62, 74],
    sectors: [
      ['Industrial Warehouse', '+8.4%'],
      ['Multi-Family', '+5.2%'],
      ['Retail Boutique', '-1.2%'],
    ],
    position: { top: '30%', left: '36%' },
  },
  {
    id: 'wharf',
    name: 'North Wharf',
    activity: 'Escalating',
    listings: '682',
    delta: '+7%',
    price: '$5.1M',
    priceDelta: '+3.4%',
    trend: [28, 32, 40, 51, 54, 66],
    sectors: [
      ['Office Conversion', '+6.1%'],
      ['Mixed-Use', '+4.4%'],
      ['Retail', '+1.1%'],
    ],
    position: { top: '22%', left: '58%' },
  },
  {
    id: 'west',
    name: 'West Corridor',
    activity: 'Cooling',
    listings: '418',
    delta: '-4%',
    price: '$2.9M',
    priceDelta: '-5.7%',
    trend: [55, 50, 48, 44, 38, 30],
    sectors: [
      ['Logistics', '+1.2%'],
      ['Retail Strip', '-2.4%'],
      ['Hospitality', '-4.8%'],
    ],
    position: { top: '56%', left: '22%' },
  },
];

function MaterialIcon({ children }) {
  return <span className="material-symbols-outlined">{children}</span>;
}

export default function MarketActivityAnalysisPage() {
  const [period, setPeriod] = useState('Year');
  const [metric, setMetric] = useState(metrics[0]);
  const [source, setSource] = useState(sources[0]);
  const [activeZoneId, setActiveZoneId] = useState('central');

  useEffect(() => {
    const previousTitle = document.title;
    const previousHtmlClass = document.documentElement.className;
    const previousBodyClass = document.body.className;

    document.title = pageMeta.title;
    document.documentElement.className = 'light';
    document.body.className = 'bg-surface text-on-surface min-h-screen';

    return () => {
      document.title = previousTitle;
      document.documentElement.className = previousHtmlClass;
      document.body.className = previousBodyClass;
    };
  }, []);

  const activeZone = useMemo(() => zones.find((zone) => zone.id === activeZoneId) || zones[0], [activeZoneId]);

  return (
    <div className="market-activity-page">
      <header className="market-activity-page__topbar">
        <div>
          <strong>Architect Intelligence</strong>
          <nav>
            <a href="#/market_activity_analysis" data-active="true">
              Market
            </a>
            <a href="#/my_intelligence_watchlists">Portfolio</a>
            <a href="#/axiom_analytics_market_trends">Insights</a>
          </nav>
        </div>
        <div className="market-activity-page__topbar-actions">
          <button type="button" onClick={() => navigateToPath('/market_alerts_subscriptions')}>
            <MaterialIcon>notifications</MaterialIcon>
          </button>
          <button type="button" onClick={() => navigateToPath('/workspace_team_settings')}>
            <MaterialIcon>account_circle</MaterialIcon>
          </button>
        </div>
      </header>

      <div className="market-activity-page__layout">
        <aside className="market-activity-page__sidebar">
          <p>Market Intel</p>
          <div className="market-activity-page__nav">
            <a href="#/axiom_map_explorer">Map View</a>
            <a href="#/market_activity_analysis" data-active="true">
              Analytics
            </a>
            <a href="#/market_alerts_subscriptions">Alerts</a>
            <a href="#/reports_data_exports_hub">Exports</a>
          </div>

          <section className="market-activity-page__feed-card">
            <small>Live Market Feed</small>
            <strong>New listing detected in {activeZone.name}</strong>
            <p>{metric} is being refreshed from {source.toLowerCase()} data sources.</p>
          </section>
        </aside>

        <main className="market-activity-page__main">
          <div className="market-activity-page__controls">
            <div className="market-activity-page__pill-group">
              {periods.map((item) => (
                <button key={item} type="button" data-active={period === item} onClick={() => setPeriod(item)}>
                  {item}
                </button>
              ))}
            </div>

            <label>
              <span>Metric</span>
              <select value={metric} onChange={(event) => setMetric(event.target.value)}>
                {metrics.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>

            <label>
              <span>Source</span>
              <select value={source} onChange={(event) => setSource(event.target.value)}>
                {sources.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>
          </div>

          <section className="market-activity-page__canvas">
            <div className="market-activity-page__map">
              {zones.map((zone) => (
                <button
                  key={zone.id}
                  type="button"
                  className="market-activity-page__hotspot"
                  data-active={activeZoneId === zone.id}
                  style={zone.position}
                  onClick={() => setActiveZoneId(zone.id)}
                >
                  <span />
                  {zone.name}
                </button>
              ))}
            </div>

            <section className="market-activity-page__summary">
              <div>
                <p className="market-activity-page__section-label">Hot Zone Summary</p>
                <h1>{activeZone.name}</h1>
                <p>Activity density: {activeZone.activity}</p>
              </div>

              <div className="market-activity-page__kpis">
                <article>
                  <small>Listings</small>
                  <strong>{activeZone.listings}</strong>
                  <span>{activeZone.delta} MoM</span>
                </article>
                <article>
                  <small>Avg Price</small>
                  <strong>{activeZone.price}</strong>
                  <span>{activeZone.priceDelta} MoM</span>
                </article>
              </div>

              <div>
                <div className="market-activity-page__section-label">Volume Trend • {period}</div>
                <div className="market-activity-page__trend">
                  {activeZone.trend.map((value, index) => (
                    <div key={`${activeZone.id}-${index}`} style={{ height: `${value}%` }} />
                  ))}
                </div>
              </div>
            </section>

            <aside className="market-activity-page__insights">
              <div className="market-activity-page__insight-card">
                <p className="market-activity-page__section-label">Hot Zones Analysis</p>
                <article>
                  <strong>North Wharf Re-zoning</strong>
                  <p>High velocity auctions detected across 15 properties in the last 48 hours.</p>
                </article>
                <article>
                  <strong>West Corridor Liquidity</strong>
                  <p>Average days-on-market increased by 14 days for warehouse inventory.</p>
                </article>
              </div>

              <div className="market-activity-page__insight-card">
                <p className="market-activity-page__section-label">Top Performing Sectors</p>
                {activeZone.sectors.map(([name, value]) => (
                  <div key={name} className="market-activity-page__sector">
                    <div>
                      <strong>{name}</strong>
                      <span>{value}</span>
                    </div>
                    <i />
                  </div>
                ))}
              </div>

              <button type="button" className="market-activity-page__export" onClick={() => navigateToPath('/reports_data_exports_hub')}>
                Export Full Report
                <MaterialIcon>north_east</MaterialIcon>
              </button>
            </aside>
          </section>
        </main>
      </div>
    </div>
  );
}
