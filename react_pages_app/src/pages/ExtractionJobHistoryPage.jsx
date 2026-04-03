import { useEffect, useMemo, useState } from 'react';
import './ExtractionJobHistoryPage.css';

export const pageMeta = {
  slug: 'extraction_job_history',
  path: '/extraction_job_history',
  label: 'Extraction Job History',
  title: 'Axiom | Extraction Job History',
};

const runs = [
  {
    id: 'AX-99281',
    source: 'Zillow API Cluster',
    region: 'North-East Region',
    status: 'Success',
    statusTone: 'success',
    start: 'Today, 10:42 AM',
    end: 'Today, 10:46 AM',
    duration: '4m 12s',
    created: 142,
    updated: 28,
    worker: 'US-EAST-04',
    sourceType: 'External API',
    logs: [
      '[10:42:01] INFO Initiating session AX-99281',
      '[10:42:03] INFO Target: Zillow API v4.2',
      '[10:42:10] INFO Processing cluster: NE_URBAN_RESI',
      '[10:44:30] WARN Retrying unit #88219 (Timeout)',
      '[10:46:02] SUCCESS Job AX-99281 completed in 252s',
    ],
  },
  {
    id: 'AX-99274',
    source: 'Redfin Scraper v2',
    region: 'California West',
    status: 'Failed',
    statusTone: 'error',
    start: 'Today, 08:15 AM',
    end: 'Today, 08:22 AM',
    duration: '7m 04s',
    created: 0,
    updated: 0,
    worker: 'US-WEST-01',
    sourceType: 'Internal OCR',
    logs: [
      '[08:15:01] INFO Worker boot sequence started',
      '[08:17:12] WARN Source schema mismatch detected',
      '[08:18:41] ERROR Browser process disconnected',
      '[08:22:09] FAILED Run terminated after retry budget exhausted',
    ],
  },
  {
    id: 'AX-99261',
    source: 'MLS Direct Sync',
    region: 'Texas Metroplex',
    status: 'Partial',
    statusTone: 'partial',
    start: 'Yesterday, 11:50 PM',
    end: 'Yesterday, 11:59 PM',
    duration: '9m 33s',
    created: 402,
    updated: 115,
    worker: 'TX-SYNC-09',
    sourceType: 'Manual Upload',
    logs: [
      '[23:50:10] INFO Starting MLS sync window',
      '[23:54:33] WARN 17 records skipped due to incomplete zoning data',
      '[23:59:12] SUCCESS Partial completion, review needed for skipped set',
    ],
  },
  {
    id: 'AX-99258',
    source: 'DocuParser Engine',
    region: 'Portfolio A-9',
    status: 'Success',
    statusTone: 'success',
    start: 'Yesterday, 09:20 PM',
    end: 'Yesterday, 09:21 PM',
    duration: '1m 12s',
    created: 12,
    updated: 0,
    worker: 'OCR-02',
    sourceType: 'Internal OCR',
    logs: [
      '[21:20:01] INFO Batch received',
      '[21:20:09] INFO OCR pipeline attached',
      '[21:21:13] SUCCESS 12 new records written',
    ],
  },
];

function MaterialIcon({ children, className = '' }) {
  return <span className={`material-symbols-outlined ${className}`.trim()}>{children}</span>;
}

export default function ExtractionJobHistoryPage() {
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [sourceFilter, setSourceFilter] = useState('Any Source');
  const [selectedRunId, setSelectedRunId] = useState(runs[0].id);

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

  const filteredRuns = useMemo(() => {
    return runs.filter((run) => {
      const matchesQuery = `${run.id} ${run.source} ${run.region}`.toLowerCase().includes(query.trim().toLowerCase());
      const matchesStatus = statusFilter === 'All Status' || run.status === statusFilter;
      const matchesSource = sourceFilter === 'Any Source' || run.sourceType === sourceFilter;
      return matchesQuery && matchesStatus && matchesSource;
    });
  }, [query, statusFilter, sourceFilter]);

  const selectedRun = filteredRuns.find((run) => run.id === selectedRunId) ?? filteredRuns[0] ?? runs[0];

  return (
    <div className="job-history-page">
      <aside className="job-history-page__sidebar">
        <div>
          <div className="job-history-page__brand">
            <div className="job-history-page__brand-icon">
              <MaterialIcon>architecture</MaterialIcon>
            </div>
            <div>
              <h1>Property Intelligence</h1>
              <p>Institutional Admin</p>
            </div>
          </div>

          <nav className="job-history-page__nav">
            <a href="#/axiom_main_dashboard">Dashboard</a>
            <a href="#/agent_intelligence_chat">Intelligence</a>
            <a href="#/add_new_source_url">Sources</a>
            <a href="#/global_automation_schedule">Automation</a>
            <a href="#/extraction_job_history" data-active="true">
              Documents
            </a>
          </nav>
        </div>

        <div className="job-history-page__sidebar-footer">
          <button type="button">New Extraction</button>
          <a href="#/live_agent_monitor_console">Logs</a>
          <a href="#/api_external_integrations">Status</a>
        </div>
      </aside>

      <div className="job-history-page__main">
        <header className="job-history-page__topbar">
          <div>
            <h2>Job History</h2>
            <nav>
              <a href="#/live_agent_monitor_console">Overview</a>
              <a href="#/extraction_job_history" data-active="true">
                Run History
              </a>
              <a href="#/live_agent_monitor_console">Workers</a>
            </nav>
          </div>
          <div className="job-history-page__topbar-actions">
            <button type="button" aria-label="Notifications">
              <MaterialIcon>notifications</MaterialIcon>
            </button>
            <button type="button" aria-label="Settings">
              <MaterialIcon>settings</MaterialIcon>
            </button>
          </div>
        </header>

        <main className="job-history-page__content">
          <section className="job-history-page__hero">
            <div>
              <p className="job-history-page__eyebrow">System Execution Logs</p>
              <h1>Automation Runs</h1>
            </div>
            <button type="button" className="job-history-page__export-button">
              <MaterialIcon>download</MaterialIcon>
              Export CSV
            </button>
          </section>

          <section className="job-history-page__filters">
            <label className="job-history-page__search">
              <MaterialIcon>search</MaterialIcon>
              <input
                type="text"
                placeholder="Filter by Source or Run ID..."
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </label>

            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option>All Status</option>
              <option>Success</option>
              <option>Failed</option>
              <option>Partial</option>
            </select>

            <select value={sourceFilter} onChange={(event) => setSourceFilter(event.target.value)}>
              <option>Any Source</option>
              <option>Internal OCR</option>
              <option>External API</option>
              <option>Manual Upload</option>
            </select>
          </section>

          <div className="job-history-page__layout">
            <section className="job-history-page__table-card">
              <table>
                <thead>
                  <tr>
                    <th>Run ID</th>
                    <th>Source</th>
                    <th>Start / End</th>
                    <th>Duration</th>
                    <th>Status</th>
                    <th>Properties</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {filteredRuns.map((run) => (
                    <tr
                      key={run.id}
                      data-active={run.id === selectedRun.id}
                      onClick={() => setSelectedRunId(run.id)}
                    >
                      <td className="job-history-page__mono">#{run.id}</td>
                      <td>
                        <strong>{run.source}</strong>
                        <small>{run.region}</small>
                      </td>
                      <td>
                        <strong>{run.start}</strong>
                        <small>{run.end}</small>
                      </td>
                      <td>{run.duration}</td>
                      <td>
                        <span className={`job-history-page__status job-history-page__status--${run.statusTone}`.trim()}>
                          {run.status}
                        </span>
                      </td>
                      <td>
                        <strong>{run.created}</strong> new
                        <small>{run.updated} upd</small>
                      </td>
                      <td>
                        <MaterialIcon>chevron_right</MaterialIcon>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>

            <aside className="job-history-page__detail-card">
              <div className="job-history-page__detail-head">
                <div>
                  <p className="job-history-page__eyebrow">Active Selection</p>
                  <h3>#{selectedRun.id}</h3>
                </div>
                <span className={`job-history-page__status job-history-page__status--${selectedRun.statusTone}`.trim()}>
                  {selectedRun.status}
                </span>
              </div>

              <dl className="job-history-page__detail-meta">
                <div>
                  <dt>Worker</dt>
                  <dd>{selectedRun.worker}</dd>
                </div>
                <div>
                  <dt>Source Type</dt>
                  <dd>{selectedRun.sourceType}</dd>
                </div>
              </dl>

              <div className="job-history-page__log-stream">
                {selectedRun.logs.map((line) => (
                  <p key={line}>{line}</p>
                ))}
              </div>

              <div className="job-history-page__detail-actions">
                <button type="button">Download Full Log</button>
                <button type="button" aria-label="Open log">
                  <MaterialIcon>open_in_new</MaterialIcon>
                </button>
              </div>
            </aside>
          </div>
        </main>
      </div>
    </div>
  );
}
