import { useEffect, useMemo, useState } from 'react';
import './ExtractionRepairConsolePage.css';

export const pageMeta = {
  slug: 'extraction_repair_console',
  path: '/extraction_repair_console',
  label: 'Extraction Repair Console',
  title: 'Data Repair | Axiom',
};

const pipelines = [
  {
    id: 'nyc-zoning',
    name: 'NYC_Zoning_Registry',
    severity: 'Critical',
    summary: 'Selector mismatch: #tax-lot-details',
    failedAgo: '14m ago',
    failure: 'Selector Changed (Structural Drift)',
    details:
      'The engine could not find .tax-lot-summary--v2. The site structure appears to have been updated in the last 24 hours.',
    oldSelector: 'div > main > section.detail-pane > #tax-lot-details',
    newSelector: 'div > main > section.v3-layout-wrapper > #lot-summary-view',
    confidence: 98,
    retries: [
      ['Oct 24, 14:12:05', 'Automated (Standard)', 'Failed', '1,240ms'],
      ['Oct 24, 12:00:01', 'Scheduled (Cron)', 'Success', '890ms'],
    ],
  },
  {
    id: 'chicago-permits',
    name: 'Chicago_Bldg_Permits',
    severity: 'Timeout',
    summary: 'Network response exceeded 30s threshold.',
    failedAgo: '2h ago',
    failure: 'Slow upstream service',
    details: 'The source responds intermittently and often exceeds the retry timeout budget.',
    oldSelector: 'api://permits/v2/search?region=chi',
    newSelector: 'Increase timeout budget + retry with staggered backoff',
    confidence: 86,
    retries: [['Oct 24, 11:10:02', 'Automated', 'Failed', '30,000ms']],
  },
  {
    id: 'london-registry',
    name: 'London_Land_Registry',
    severity: 'Structure',
    summary: 'Unexpected schema change detected.',
    failedAgo: '4h ago',
    failure: 'Schema drift',
    details: 'A new payload version now nests the parcel block under a different object path.',
    oldSelector: 'payload.parcel.summary',
    newSelector: 'payload.assetBundle.parcel.summary',
    confidence: 94,
    retries: [['Oct 24, 10:40:01', 'Automated', 'Failed', '1,980ms']],
  },
];

function MaterialIcon({ children, className = '' }) {
  return <span className={`material-symbols-outlined ${className}`.trim()}>{children}</span>;
}

export default function ExtractionRepairConsolePage() {
  const [selectedPipelineId, setSelectedPipelineId] = useState(pipelines[0].id);
  const [repairState, setRepairState] = useState('Suggestions ready');

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

  const selectedPipeline = useMemo(
    () => pipelines.find((pipeline) => pipeline.id === selectedPipelineId) ?? pipelines[0],
    [selectedPipelineId],
  );

  return (
    <div className="repair-page">
      <aside className="repair-page__sidebar">
        <div>
          <div className="repair-page__brand">
            <h1>Property Intel</h1>
            <p>Architectural Intelligence</p>
          </div>

          <nav className="repair-page__nav">
            <a href="#/axiom_main_dashboard">Overview</a>
            <a href="#/extraction_repair_console" data-active="true">
              Data Repair
            </a>
            <a href="#/deduplication_merge_center">Merge Center</a>
            <a href="#/workspace_team_settings">Watchlists</a>
            <a href="#/axiom_analytics_market_trends">Insights</a>
          </nav>
        </div>

        <div className="repair-page__sidebar-footer">
          <button type="button">New Analysis</button>
          <a href="#/workspace_team_settings">Settings</a>
          <a href="#/help_documentation_center">Support</a>
        </div>
      </aside>

      <div className="repair-page__main">
        <header className="repair-page__topbar">
          <label className="repair-page__search">
            <MaterialIcon>search</MaterialIcon>
            <input type="text" placeholder="Search architecture data..." />
          </label>
          <div className="repair-page__topbar-actions">
            <button type="button">Run Report</button>
          </div>
        </header>

        <main className="repair-page__content">
          <section className="repair-page__hero">
            <div>
              <h1>Repair Center</h1>
              <p>Manage and resolve extraction failures across active data pipelines.</p>
            </div>
            <div className="repair-page__alert-pill">12 Failures Detected</div>
          </section>

          <div className="repair-page__layout">
            <section className="repair-page__pipeline-list">
              <div className="repair-page__list-header">
                <h2>Failed Pipelines</h2>
                <button type="button">Mark all resolved</button>
              </div>

              {pipelines.map((pipeline) => (
                <button
                  key={pipeline.id}
                  type="button"
                  className="repair-page__pipeline-card"
                  data-active={pipeline.id === selectedPipeline.id}
                  onClick={() => setSelectedPipelineId(pipeline.id)}
                >
                  <div className="repair-page__pipeline-head">
                    <strong>{pipeline.name}</strong>
                    <span>{pipeline.severity}</span>
                  </div>
                  <p>{pipeline.summary}</p>
                  <small>Failed {pipeline.failedAgo}</small>
                </button>
              ))}
            </section>

            <section className="repair-page__inspector">
              <div className="repair-page__inspector-head">
                <div>
                  <p className="repair-page__eyebrow">Selected Failure</p>
                  <h2>{selectedPipeline.name}</h2>
                </div>
                <div className="repair-page__inspector-actions">
                  <button type="button">Disable Source</button>
                  <button type="button" className="repair-page__primary-button">
                    Retry Now
                  </button>
                </div>
              </div>

              <div className="repair-page__inspector-grid">
                <article className="repair-page__panel">
                  <h3>Detected Failure Reason</h3>
                  <div className="repair-page__reason">
                    <strong>{selectedPipeline.failure}</strong>
                    <p>{selectedPipeline.details}</p>
                  </div>
                  <div className="repair-page__compare">
                    <div>
                      <span>Last Successful Version</span>
                      <code>{selectedPipeline.oldSelector}</code>
                    </div>
                    <div>
                      <span>Suggested Fix Target</span>
                      <code>{selectedPipeline.newSelector}</code>
                    </div>
                  </div>
                </article>

                <article className="repair-page__panel">
                  <h3>Page Screenshot at Failure</h3>
                  <div className="repair-page__snapshot">
                    <div />
                    <span>Structural drift overlay</span>
                  </div>
                  <div className="repair-page__panel-actions">
                    <button type="button">Edit Rule</button>
                    <button type="button">Manual Review</button>
                  </div>
                </article>
              </div>

              <article className="repair-page__suggestion">
                <div className="repair-page__suggestion-head">
                  <div>
                    <p className="repair-page__eyebrow">AI Suggested Repair</p>
                    <h3>Semantic repair candidate</h3>
                  </div>
                  <strong>{selectedPipeline.confidence}% confidence</strong>
                </div>
                <p>{repairState}</p>
                <code>{selectedPipeline.newSelector}</code>
                <div className="repair-page__panel-actions">
                  <button type="button" onClick={() => setRepairState('Repair test passed on shadow run')}>
                    Test Repair
                  </button>
                  <button
                    type="button"
                    className="repair-page__primary-button"
                    onClick={() => setRepairState('Approved repair pushed to active worker set')}
                  >
                    Approve &amp; Apply Repair
                  </button>
                </div>
              </article>

              <article className="repair-page__retry-table">
                <h3>Recent Retry History</h3>
                <table>
                  <thead>
                    <tr>
                      <th>Timestamp</th>
                      <th>Method</th>
                      <th>Result</th>
                      <th>Latency</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedPipeline.retries.map(([time, method, result, latency]) => (
                      <tr key={`${time}-${method}`}>
                        <td>{time}</td>
                        <td>{method}</td>
                        <td>{result}</td>
                        <td>{latency}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </article>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
