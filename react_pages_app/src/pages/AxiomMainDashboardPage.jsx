import { useEffect, useMemo, useState } from 'react';
import './AxiomMainDashboardPage.css';
import { navigateToPath } from '../utils/navigation';

export const pageMeta = {
  slug: 'axiom_main_dashboard',
  path: '/axiom_main_dashboard',
  label: 'Axiom Main Dashboard',
  title: 'Axiom Property Intelligence | Dashboard',
};

const mapImage =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDSuEP7rH5GUIp0yFETUKQ-M1AeleNxF0sUC4a1H8AFpXU6ZxL-L4-tX6Pabw95JXBS3Emjjumr-357wXNf1xvZVbVlwx3BtMCOHL1mn66rsl6Jkhkxl1LKqpxdUJn_RrK6dYlOls0RoC5kYEzqfjhwPFnO4o1-Gxo0ifv7PR2nWSt8hOcs9Q3m2dp5Gv8Z2SUIpxxr30aP7G6W7r1IznhQeWGQkODtVZwYyW-oPnFziVL8sXNITgqcnSXdvleyVPLaKFfBLlTeCxs';

const findingImages = [
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCwocsFaeQ5-dpmmSDruStKUoSwEuECN1q-vp_ZaXOZ2c9LXC9U3DOOdzdwZR4yAMdJTL8Rppxgorl0oN58u8RkmABszLfpVfylxCgB_MrXwa5OtbnaSZZJ1k0NbPSmyEZgPMkPz4hVBW0eiwTnAErbUvgOPO9hvBguBbnXBscmacQ9YROgStguRL3KGqr83vRTZTY_xOOTKAJlNxWAdJtB2e7ewvSB3cRpcB_ftatDBI-sdOZaQ4ZM1CCJOnoY_2WVsRP8PvYn6Q0',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuD5ZKEfpa5GGVAVDcexvoyFlhHisG0DlZOehXqpIcppGD-Qa6_hBZiop4ec0aNd97rbMKBX_CftD_RgvGxunJHDi24sYTyv0Ia2gim_qS_LtLdHPzoul4RPazSGs3uoUXYikR9-4J1dGHhwQbXPkCO1s-UvRwWGkK8oC4sYkg0SYifUiGzXd0_mDOcOUXA59Uiyfb8ZjxpVK99OTmlq94Kq7M4u35OQxYojCZxUhZhFNg0QtvLjFgKL_HNzmNeNBB8yCsWe-rdbkhU',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBHzeFCutRfXgCVC33KWq6novnRTr6rQLRcLjokGC5o3fZpxK8aMDMOi1zsKgtJ4L2QH5M0twDbEShhTf2pEVlQSvTeLytNR0Dd1hSOV7H5USEtnDn8YlX56oc0T_t7I1McmmiSWucFx2Ql2ir2ZGJPWPYahOaA7b5nKhyCPGQsplROthpis4SS_oapznWHkFRSQNI-MJLCBqKcJv80HLaA7rsrrEO9FkNfWjjZLNNrd3qyk6cwzHd1XmmfL6mKfkQZ1z2c5-Z6-5g',
];

const filters = ['Sale', 'Rent', 'Auction', 'Bank-Owned', 'Gov Portal'];
const periods = ['Weekly', 'Monthly'];
const chartValues = {
  Weekly: [42, 58, 55, 70, 62, 76],
  Monthly: [40, 60, 55, 75, 65, 85, 70, 60],
};
const chartLabels = {
  Weekly: ['W1', 'W2', 'W3', 'W4', 'W5', 'W6'],
  Monthly: ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb'],
};

function MaterialIcon({ children }) {
  return <span className="material-symbols-outlined">{children}</span>;
}

export default function AxiomMainDashboardPage() {
  const [activeFilter, setActiveFilter] = useState('Sale');
  const [period, setPeriod] = useState('Monthly');
  const [selectedSpot, setSelectedSpot] = useState('Manhattan Core');

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

  const activeBars = useMemo(() => chartValues[period], [period]);
  const activeLabels = useMemo(() => chartLabels[period], [period]);

  return (
    <div className="dashboard-page">
      <div className="dashboard-page__layout">
        <aside className="dashboard-page__sidebar">
          <div className="dashboard-page__brand">
            <div className="dashboard-page__brand-title">Intelligence</div>
            <div className="dashboard-page__brand-subtitle">Institutional Grade</div>
          </div>

          <nav className="dashboard-page__nav">
            <a href="#/axiom_main_dashboard" data-active="true"><MaterialIcon>domain</MaterialIcon><span>Portfolio</span></a>
            <a href="#/axiom_analytics_market_trends"><MaterialIcon>analytics</MaterialIcon><span>Analytics</span></a>
            <a href="#/live_agent_monitor_console"><MaterialIcon>query_stats</MaterialIcon><span>Monitor</span></a>
            <a href="#/workspace_team_settings"><MaterialIcon>settings</MaterialIcon><span>Settings</span></a>
          </nav>

          <div className="dashboard-page__sidebar-actions">
            <a className="dashboard-page__primary-button" href="#/add_new_source_url">
              <MaterialIcon>add</MaterialIcon>
              New Source
            </a>
            <a className="dashboard-page__secondary-button" href="#/document_upload_center">
              <MaterialIcon>upload_file</MaterialIcon>
              Document
            </a>
          </div>
        </aside>

        <div className="dashboard-page__main">
          <header className="dashboard-page__topbar">
            <div className="dashboard-page__topbar-left">
              <h1 className="dashboard-page__title">Architectural Intelligence</h1>
              <label className="dashboard-page__search">
                <MaterialIcon>search</MaterialIcon>
                <input type="text" placeholder="Search properties, locations, or agents..." />
              </label>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button className="dashboard-page__icon-button" type="button" onClick={() => navigateToPath('/market_alerts_subscriptions')}>
                <MaterialIcon>notifications</MaterialIcon>
                <span className="dashboard-page__notification-dot" />
              </button>
              <button className="dashboard-page__icon-button" type="button" onClick={() => navigateToPath('/workspace_team_settings')}><MaterialIcon>account_circle</MaterialIcon></button>
            </div>
          </header>

          <main className="dashboard-page__content">
            <div className="dashboard-page__filters">
              <span className="dashboard-page__filter-label">Filters</span>
              {filters.map((filter) => (
                <button key={filter} className="dashboard-page__filter-chip" data-active={filter === activeFilter} onClick={() => setActiveFilter(filter)}>
                  {filter}
                </button>
              ))}
            </div>

            <section className="dashboard-page__kpis">
              {[
                { label: 'Total Properties', value: '42,891', badge: '+4%', badgeClass: 'green' },
                { label: 'Active Sale', value: '12,042' },
                { label: 'New Today', value: '842', badge: 'High Vol', badgeClass: 'green' },
                { label: 'Running Sources', value: '18' },
                { label: 'Failed Tasks', value: '3', badge: 'Critical', badgeClass: 'red' },
                { label: 'Doc Review', value: '156' },
              ].map((item) => (
                <article key={item.label} className="dashboard-page__kpi">
                  <div className="dashboard-page__kpi-label">{item.label}</div>
                  <div className="dashboard-page__kpi-value">
                    {item.value}
                    {item.badge ? (
                      <span className={`dashboard-page__kpi-badge dashboard-page__kpi-badge--${item.badgeClass}`}>{item.badge}</span>
                    ) : null}
                  </div>
                </article>
              ))}
            </section>

            <div className="dashboard-page__grid">
              <div className="dashboard-page__column">
                <section className="dashboard-page__card">
                  <div className="dashboard-page__card-body">
                    <div className="dashboard-page__card-header">
                      <div>
                        <h2 className="dashboard-page__card-title">Market Trend Analysis</h2>
                        <p className="dashboard-page__card-subtitle">
                          Aggregate pricing across institutional sectors for {activeFilter.toLowerCase()} inventory.
                        </p>
                      </div>
                      <div className="dashboard-page__periods">
                        {periods.map((option) => (
                          <button key={option} type="button" data-active={period === option} onClick={() => setPeriod(option)}>
                            {option}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="dashboard-page__chart">
                      {activeBars.map((value, index) => (
                        <div key={`${period}-${index}`} className="dashboard-page__bar-wrap">
                          <div className="dashboard-page__bar" data-active={value === Math.max(...activeBars)} style={{ height: `${value}%` }} />
                          <div className="dashboard-page__bar-label">{activeLabels[index]}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>

                <div className="dashboard-page__two-up">
                  <section className="dashboard-page__card">
                    <div className="dashboard-page__card-body">
                      <div className="dashboard-page__card-header">
                        <div>
                          <h2 className="dashboard-page__card-title">Agent Activity</h2>
                          <p className="dashboard-page__card-subtitle">4 live automation workers currently running.</p>
                        </div>
                      </div>
                      {[
                        ['Zillow Scraper #04', 'Extracting: 442 Park Ave, NY', 67],
                        ['Gov Registry Indexer', 'Matching IDs: 1,040 remaining', 100],
                        ['Lease Analyzer AI', "Reading 'Standard_Form_L.pdf'", 12],
                      ].map(([title, meta, progress]) => (
                        <div
                          key={title}
                          className="dashboard-page__activity"
                          onClick={() => navigateToPath(title.includes('Lease Analyzer') ? '/document_intelligence_analysis' : '/live_agent_monitor_console')}
                        >
                          <MaterialIcon>{title.includes('Scraper') ? 'robot_2' : title.includes('Registry') ? 'database' : 'description'}</MaterialIcon>
                          <div style={{ flex: 1 }}>
                            <div className="dashboard-page__activity-title">{title}</div>
                            <div className="dashboard-page__activity-meta">{meta}</div>
                            {progress < 100 ? (
                              <div className="dashboard-page__mini-progress"><div style={{ width: `${progress}%` }} /></div>
                            ) : null}
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>

                  <section className="dashboard-page__card">
                    <div className="dashboard-page__card-body">
                      <div className="dashboard-page__card-header">
                        <div>
                          <h2 className="dashboard-page__card-title">Quality Review</h2>
                          <p className="dashboard-page__card-subtitle">12 records need attention.</p>
                        </div>
                      </div>
                      {[
                        ['882 Westview Plaza', 'Multiple price anchors found: $1.2M vs $1.8M'],
                        ['99 Industrial Way', "Ambiguous zoning classification 'M-1/B'"],
                      ].map(([title, meta]) => (
                        <div key={title} className="dashboard-page__review" onClick={() => navigateToPath('/review_correct_property_data')}>
                          <div>
                            <div className="dashboard-page__review-title">{title}</div>
                            <div className="dashboard-page__review-meta">{meta}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                </div>
              </div>

              <div className="dashboard-page__column">
                <section className="dashboard-page__card">
                  <div className="dashboard-page__card-body">
                    <h2 className="dashboard-page__card-title">Geographic Intel</h2>
                    <p className="dashboard-page__card-subtitle">Top hotspots in the last 24 hours.</p>
                    <div className="dashboard-page__map" style={{ marginTop: '1rem' }}>
                      <img src={mapImage} alt="Geographic intel map" />
                      <button className="dashboard-page__hotspot" style={{ top: '32%', left: '36%' }} onClick={() => { setSelectedSpot('Chelsea Core'); navigateToPath('/axiom_map_explorer'); }} />
                      <button className="dashboard-page__hotspot" style={{ top: '48%', left: '52%' }} onClick={() => { setSelectedSpot('Manhattan Core'); navigateToPath('/axiom_map_explorer'); }} />
                      <button className="dashboard-page__hotspot" style={{ top: '68%', left: '72%' }} onClick={() => { setSelectedSpot('Brooklyn Edge'); navigateToPath('/axiom_map_explorer'); }} />
                      <div className="dashboard-page__spot-label">{selectedSpot}</div>
                    </div>
                  </div>
                </section>

                <section className="dashboard-page__card">
                  <div className="dashboard-page__card-body">
                    <h2 className="dashboard-page__card-title">Latest Findings</h2>
                    <p className="dashboard-page__card-subtitle">Fresh assets discovered by the monitoring layer.</p>
                    {[
                      ['Nexus Office Park', 'Austin, TX | EUR 42.5M', 'Retail'],
                      ['The Sterling Lofts', 'Seattle, WA | EUR 8.2M', 'Bank-Owned'],
                      ['Logistics Hub A4', 'Denver, CO | EUR 14.1M', 'Price Drop'],
                    ].map(([title, meta, badge], index) => (
                      <div key={title} className="dashboard-page__finding" onClick={() => navigateToPath('/property_detail_page')}>
                        <img className="dashboard-page__finding-thumb" src={findingImages[index]} alt={title} />
                        <div>
                          <div className="dashboard-page__finding-title">{title}</div>
                          <div className="dashboard-page__finding-meta">{meta}</div>
                          <div className={`dashboard-page__kpi-badge dashboard-page__kpi-badge--${index === 1 ? 'red' : 'green'}`} style={{ marginLeft: 0, marginTop: '0.4rem' }}>
                            {badge}
                          </div>
                        </div>
                      </div>
                    ))}
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
