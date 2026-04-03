import { useEffect, useMemo, useState } from 'react';
import './LiveAgentMonitorConsolePage.css';

export const pageMeta = {
  slug: 'live_agent_monitor_console',
  path: '/live_agent_monitor_console',
  label: 'Live Agent Monitor Console',
  title: 'Axiom | Live Agent Monitor',
};

const workers = [
  {
    id: 'AF72',
    name: 'Worker-AF72',
    mode: 'Normal Replay',
    source: 'zillow_commercial_v2',
    step: 'Extracting Cards...',
    progress: 68,
    retries: 0,
    output: '{ "property_id": "NYC_1289", "asking_price": "$12,400,000" }',
  },
  {
    id: 'BX04',
    name: 'Worker-BX04',
    mode: 'OCR Mode',
    source: 'loopnet_distress_api',
    step: 'Downloading PDF (Offering Memo)...',
    progress: 24,
    retries: 2,
    output: 'Waiting for file-stream-buffer...',
  },
  {
    id: 'KL99',
    name: 'Worker-KL99',
    mode: 'Repair Mode',
    source: 'costar_deep_scan',
    step: 'Resolving Anti-Bot Challenge...',
    progress: 92,
    retries: 1,
    output: 'REPAIR_TRIGGER: Element not found at XPATH [//div[@id="mkt-summary"]]',
  },
];

const terminalLines = [
  '[14:22:01] INFO Initializing worker node AF72...',
  '[14:22:03] INFO Connection established via Proxy-DE-88',
  '[14:22:09] INFO Page loaded. 18 cards detected.',
  '[14:22:18] WARN CoStar anti-bot shield triggered. Initiating Repair Mode...',
  '[14:22:26] INFO Routing to OCR Engine (Tesseract-Optimized-v4)',
  '[14:22:34] INFO Streaming live events...',
];

function MaterialIcon({ children }) {
  return <span className="material-symbols-outlined">{children}</span>;
}

export default function LiveAgentMonitorConsolePage() {
  const [selectedWorkerId, setSelectedWorkerId] = useState(workers[0].id);
  const [statusFilter, setStatusFilter] = useState('All Active');
  const [workerGroup, setWorkerGroup] = useState('Regional Node A');

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

  const selectedWorker = workers.find((worker) => worker.id === selectedWorkerId) ?? workers[0];
  const visibleWorkers = useMemo(() => workers.filter(() => statusFilter === 'All Active'), [statusFilter]);

  return (
    <div className="monitor-page">
      <header className="monitor-page__topbar">
        <div className="monitor-page__brand">Architectural Intelligence</div>
        <nav>
          <a href="#/axiom_main_dashboard">Dashboard</a>
          <a href="#/live_agent_monitor_console" data-active="true">
            Intelligence
          </a>
          <a href="#/add_new_source_url">Sources</a>
          <a href="#/global_automation_schedule">Automation</a>
          <a href="#/document_upload_center">Documents</a>
        </nav>
      </header>

      <aside className="monitor-page__sidebar">
        <h2>Property Intelligence</h2>
        <p>Institutional Admin</p>
        <nav>
          <a href="#/axiom_main_dashboard">Dashboard</a>
          <a href="#/live_agent_monitor_console" data-active="true">
            Intelligence
          </a>
          <a href="#/add_new_source_url">Sources</a>
          <a href="#/global_automation_schedule">Automation</a>
          <a href="#/document_upload_center">Documents</a>
        </nav>
        <button type="button">New Extraction</button>
      </aside>

      <main className="monitor-page__main">
        <section className="monitor-page__hero">
          <div>
            <h1>Live Agent Monitor</h1>
            <p>Real-time supervision of active data extraction pipelines.</p>
          </div>

          <div className="monitor-page__filters">
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option>All Active</option>
            </select>
            <select value={workerGroup} onChange={(event) => setWorkerGroup(event.target.value)}>
              <option>Regional Node A</option>
              <option>Regional Node B</option>
            </select>
          </div>
        </section>

        <section className="monitor-page__stats">
          {[
            ['Active Jobs', '42'],
            ['Queued', '1,284'],
            ['Failed (24h)', '12'],
            ['Paused', '08'],
            ['Avg. Runtime', '14.2s'],
          ].map(([label, value]) => (
            <article key={label}>
              <span>{label}</span>
              <strong>{value}</strong>
            </article>
          ))}
        </section>

        <div className="monitor-page__layout">
          <section className="monitor-page__worker-list">
            <div className="monitor-page__section-head">
              <h2>Running Workers</h2>
            </div>

            {visibleWorkers.map((worker) => (
              <button
                key={worker.id}
                type="button"
                className="monitor-page__worker-card"
                data-active={worker.id === selectedWorker.id}
                onClick={() => setSelectedWorkerId(worker.id)}
              >
                <div className="monitor-page__worker-head">
                  <div>
                    <strong>{worker.name}</strong>
                    <small>{worker.mode}</small>
                  </div>
                  <span>{worker.retries} retries</span>
                </div>
                <p>{worker.source}</p>
                <div className="monitor-page__progress-meta">
                  <span>{worker.step}</span>
                  <span>{worker.progress}%</span>
                </div>
                <div className="monitor-page__progress">
                  <div style={{ width: `${worker.progress}%` }} />
                </div>
                <pre>{worker.output}</pre>
              </button>
            ))}
          </section>

          <aside className="monitor-page__terminal">
            <div className="monitor-page__terminal-head">
              <div>
                <MaterialIcon>terminal</MaterialIcon>
                <span>System Log Stream</span>
              </div>
            </div>
            <div className="monitor-page__terminal-body">
              {terminalLines.map((line) => (
                <p key={line}>{line}</p>
              ))}
              <p className="monitor-page__terminal-live">
                Streaming live events for <strong>{selectedWorker.name}</strong>...
              </p>
            </div>
            <div className="monitor-page__terminal-stats">
              <div>
                <span>Memory Usage</span>
                <strong>4.2GB</strong>
              </div>
              <div>
                <span>CPU Load</span>
                <strong>78%</strong>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
