import { useEffect, useMemo, useState } from 'react';
import './MarketAlertsSubscriptionsPage.css';

export const pageMeta = {
  slug: 'market_alerts_subscriptions',
  path: '/market_alerts_subscriptions',
  label: 'Market Alerts Subscriptions',
  title: 'Alerts & Notifications | Property Intel',
};

const initialAlerts = [
  {
    id: 'auction',
    title: 'Auction Inventory Spike',
    scope: 'Manhattan Core',
    description: 'Alert when new institutional-grade auction inventory exceeds 8 listings in 24 hours.',
    status: 'Active',
    lastTriggered: '14 May 2024',
  },
  {
    id: 'zoning',
    title: 'Zoning Variance Application',
    scope: 'Commercial District',
    description: 'Monitor for FAR changes, mixed-use re-zoning permits, and district overlays.',
    status: 'Active',
    lastTriggered: '08 May 2024',
  },
  {
    id: 'yield',
    title: 'Cap Rate Target > 5.5%',
    scope: 'Austin MSA',
    description: 'Track listings that cross the workspace yield threshold for multi-family inventory.',
    status: 'Paused',
    lastTriggered: 'Never',
  },
];

function MaterialIcon({ children }) {
  return <span className="material-symbols-outlined">{children}</span>;
}

export default function MarketAlertsSubscriptionsPage() {
  const [search, setSearch] = useState('');
  const [alerts, setAlerts] = useState(initialAlerts);
  const [selectedAlertId, setSelectedAlertId] = useState(initialAlerts[0].id);
  const [channels, setChannels] = useState({ email: true, slack: true, push: false });

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

  const filteredAlerts = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return alerts;
    return alerts.filter((alert) => `${alert.title} ${alert.scope} ${alert.description}`.toLowerCase().includes(query));
  }, [alerts, search]);

  const selectedAlert = filteredAlerts.find((alert) => alert.id === selectedAlertId) || filteredAlerts[0] || alerts[0];

  function toggleChannel(channel) {
    setChannels((current) => ({ ...current, [channel]: !current[channel] }));
  }

  function toggleAlert(id) {
    setAlerts((current) =>
      current.map((alert) =>
        alert.id === id ? { ...alert, status: alert.status === 'Active' ? 'Paused' : 'Active' } : alert,
      ),
    );
  }

  function createAlert() {
    const newAlert = {
      id: `alert-${Date.now()}`,
      title: 'Custom Distress Signal',
      scope: 'New Workspace Region',
      description: 'Track debt stress, fast price revisions, and foreclosure filing velocity.',
      status: 'Active',
      lastTriggered: 'Just now',
    };
    setAlerts((current) => [newAlert, ...current]);
    setSelectedAlertId(newAlert.id);
  }

  return (
    <div className="market-alerts-page">
      <aside className="market-alerts-page__sidebar">
        <div>
          <h1>Property Intel</h1>
          <p>Architectural Intelligence</p>
        </div>
        <nav>
          <a href="#/axiom_main_dashboard">Overview</a>
          <a href="#/extraction_repair_console">Data Repair</a>
          <a href="#/deduplication_merge_center">Merge Center</a>
          <a href="#/my_intelligence_watchlists">Watchlists</a>
          <a href="#/market_alerts_subscriptions" data-active="true">
            Alerts
          </a>
        </nav>
        <button type="button" className="market-alerts-page__new-alert" onClick={createAlert}>
          <MaterialIcon>add_alert</MaterialIcon>
          New Analysis
        </button>
      </aside>

      <div className="market-alerts-page__main">
        <header className="market-alerts-page__topbar">
          <label className="market-alerts-page__search">
            <MaterialIcon>search</MaterialIcon>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search alert rules, markets, or trigger logic..."
            />
          </label>
          <div className="market-alerts-page__topbar-actions">
            <button type="button">
              <MaterialIcon>notifications</MaterialIcon>
            </button>
            <button type="button">
              <MaterialIcon>settings</MaterialIcon>
            </button>
          </div>
        </header>

        <main className="market-alerts-page__content">
          <section className="market-alerts-page__hero">
            <div>
              <p>Signal Management</p>
              <h2>Market alerts and subscriptions</h2>
              <span>Route market changes to the right team with delivery-specific triggers and workspace-level guardrails.</span>
            </div>

            <div className="market-alerts-page__channel-card">
              <h3>Delivery Channels</h3>
              {Object.entries(channels).map(([key, enabled]) => (
                <button key={key} type="button" data-active={enabled} onClick={() => toggleChannel(key)}>
                  <span>{key}</span>
                  <i />
                </button>
              ))}
            </div>
          </section>

          <section className="market-alerts-page__grid">
            <div className="market-alerts-page__list">
              {filteredAlerts.map((alert) => (
                <article
                  key={alert.id}
                  className="market-alerts-page__alert"
                  data-active={selectedAlert?.id === alert.id}
                  onClick={() => setSelectedAlertId(alert.id)}
                >
                  <div>
                    <strong>{alert.title}</strong>
                    <p>{alert.scope}</p>
                  </div>
                  <span data-status={alert.status.toLowerCase()}>{alert.status}</span>
                </article>
              ))}
            </div>

            <aside className="market-alerts-page__detail">
              {selectedAlert ? (
                <>
                  <div className="market-alerts-page__detail-head">
                    <div>
                      <h3>{selectedAlert.title}</h3>
                      <p>{selectedAlert.scope}</p>
                    </div>
                    <button type="button" onClick={() => toggleAlert(selectedAlert.id)}>
                      {selectedAlert.status === 'Active' ? 'Pause' : 'Resume'}
                    </button>
                  </div>

                  <p className="market-alerts-page__detail-copy">{selectedAlert.description}</p>

                  <div className="market-alerts-page__detail-stats">
                    <article>
                      <small>Status</small>
                      <strong>{selectedAlert.status}</strong>
                    </article>
                    <article>
                      <small>Last Triggered</small>
                      <strong>{selectedAlert.lastTriggered}</strong>
                    </article>
                  </div>

                  <div className="market-alerts-page__audit">
                    <p>Recent Trigger Log</p>
                    <ul>
                      <li>New auction filing indexed from county records.</li>
                      <li>Yield threshold re-evaluated after ingestion refresh.</li>
                      <li>Notification payload delivered to active analyst channel.</li>
                    </ul>
                  </div>
                </>
              ) : (
                <p>No alerts match the current filter.</p>
              )}
            </aside>
          </section>
        </main>
      </div>
    </div>
  );
}
