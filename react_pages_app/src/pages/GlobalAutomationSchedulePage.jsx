import { useEffect, useMemo, useState } from 'react';
import './GlobalAutomationSchedulePage.css';

export const pageMeta = {
  slug: 'global_automation_schedule',
  path: '/global_automation_schedule',
  label: 'Global Automation Schedule',
  title: 'Automation Schedule | Architectural Intelligence',
};

const routines = [
  {
    id: 'zillow',
    name: 'Zillow NY-Primary Feed',
    cadence: 'Every 1 Hour',
    nextRun: '14:00:00',
    nextHint: 'In 42 minutes',
    lastRun: '13:00:04',
    status: 'Success',
    performance: '3m 12s',
    alertRule: 'Critical Only',
    paused: false,
  },
  {
    id: 'corelogic',
    name: 'CoreLogic Master Dataset',
    cadence: 'Daily at 8:00 AM',
    nextRun: 'Tomorrow, 08:00',
    nextHint: 'In 18 hours',
    lastRun: 'Today, 08:00:12',
    status: 'Timeout Error',
    performance: '14m 55s',
    alertRule: 'Immediate Alert',
    paused: false,
  },
  {
    id: 'redfin',
    name: 'Redfin Transaction Log',
    cadence: 'Weekly (Mon, 00:00)',
    nextRun: 'Monday, 00:00',
    nextHint: 'In 4 days',
    lastRun: 'Oct 23, 00:01:45',
    status: 'Paused',
    performance: '8m 22s',
    alertRule: 'Suppressed',
    paused: true,
  },
];

function MaterialIcon({ children, className = '' }) {
  return <span className={`material-symbols-outlined ${className}`.trim()}>{children}</span>;
}

export default function GlobalAutomationSchedulePage() {
  const [query, setQuery] = useState('');
  const [scheduleType, setScheduleType] = useState('Hourly');
  const [selectedSource, setSelectedSource] = useState('Zillow API - North America');
  const [interval, setInterval] = useState('1');
  const [minuteOffset, setMinuteOffset] = useState(':00');
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [draftCreated, setDraftCreated] = useState(false);

  useEffect(() => {
    const previousTitle = document.title;
    const previousHtmlClass = document.documentElement.className;
    const previousBodyClass = document.body.className;

    document.title = pageMeta.title;
    document.documentElement.className = 'light';
    document.body.className = 'bg-surface font-body text-on-surface';

    return () => {
      document.title = previousTitle;
      document.documentElement.className = previousHtmlClass;
      document.body.className = previousBodyClass;
    };
  }, []);

  const filteredRoutines = useMemo(
    () => routines.filter((routine) => routine.name.toLowerCase().includes(query.trim().toLowerCase())),
    [query],
  );

  return (
    <div className="schedule-page">
      <header className="schedule-page__topbar">
        <div className="schedule-page__brand">Architectural Intelligence</div>
        <nav>
          <a href="#/axiom_main_dashboard">Dashboard</a>
          <a href="#/agent_intelligence_chat">Intelligence</a>
          <a href="#/add_new_source_url">Sources</a>
          <a href="#/global_automation_schedule" data-active="true">
            Automation
          </a>
          <a href="#/document_upload_center">Documents</a>
        </nav>
      </header>

      <aside className="schedule-page__sidebar">
        <div>
          <div className="schedule-page__logo">
            <span>A</span>
            <div>
              <strong>AXIOM</strong>
              <small>Institutional Admin</small>
            </div>
          </div>

          <nav className="schedule-page__side-links">
            <a href="#/axiom_main_dashboard">Dashboard</a>
            <a href="#/agent_intelligence_chat">Intelligence</a>
            <a href="#/add_new_source_url">Sources</a>
            <a href="#/global_automation_schedule" data-active="true">
              Automation
            </a>
            <a href="#/document_upload_center">Documents</a>
          </nav>
        </div>

        <div className="schedule-page__sidebar-footer">
          <button type="button">New Extraction</button>
          <a href="#/extraction_job_history">Logs</a>
          <a href="#/api_external_integrations">Status</a>
        </div>
      </aside>

      <main className="schedule-page__main">
        <section className="schedule-page__hero">
          <div>
            <p className="schedule-page__eyebrow">Operations Engine</p>
            <h1>Automation Schedule</h1>
            <p>System timezone: UTC (GMT+00:00)</p>
          </div>
          <div className="schedule-page__hero-actions">
            <label className="schedule-page__search">
              <MaterialIcon>search</MaterialIcon>
              <input
                type="text"
                placeholder="Search routines..."
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </label>
            <button type="button" className="schedule-page__primary-button">
              <MaterialIcon>calendar_add_on</MaterialIcon>
              New Schedule
            </button>
          </div>
        </section>

        <section className="schedule-page__stats">
          {[
            ['Active Jobs', '42', '+4 from last month'],
            ['Success Rate', '99.8%', 'Nominal performance'],
            ['Avg. Run Time', '4m 12s', '-12s vs last week'],
            ['Alerts (24h)', '03', 'Requires attention'],
          ].map(([label, value, note]) => (
            <article key={label}>
              <span>{label}</span>
              <strong>{value}</strong>
              <small>{note}</small>
            </article>
          ))}
        </section>

        <div className="schedule-page__layout">
          <section className="schedule-page__table-card">
            <div className="schedule-page__table-head">
              <h2>Scheduled Routines</h2>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Source</th>
                  <th>Next Run</th>
                  <th>Last Run</th>
                  <th>Performance</th>
                  <th>Alert Rule</th>
                </tr>
              </thead>
              <tbody>
                {filteredRoutines.map((routine) => (
                  <tr key={routine.id}>
                    <td>
                      <strong>{routine.name}</strong>
                      <small>{routine.cadence}</small>
                    </td>
                    <td>
                      <strong>{routine.nextRun}</strong>
                      <small>{routine.nextHint}</small>
                    </td>
                    <td>
                      <strong>{routine.lastRun}</strong>
                      <small>{routine.status}</small>
                    </td>
                    <td>{routine.performance}</td>
                    <td>
                      <span className="schedule-page__pill">{routine.alertRule}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <aside className="schedule-page__drawer">
            <div className="schedule-page__drawer-head">
              <div>
                <h2>New Schedule</h2>
                <p>Configure automated intelligence extraction.</p>
              </div>
              <button type="button" aria-label="Close">
                <MaterialIcon>close</MaterialIcon>
              </button>
            </div>

            <label>
              <span>Target Data Source</span>
              <select value={selectedSource} onChange={(event) => setSelectedSource(event.target.value)}>
                <option>Zillow API - North America</option>
                <option>CoreLogic - Property Tax DB</option>
                <option>Redfin - ML Training Set</option>
                <option>Custom Webhook Hook_042</option>
              </select>
            </label>

            <div className="schedule-page__types">
              {['Hourly', 'Daily', 'Weekly', 'Custom Cron'].map((type) => (
                <button
                  key={type}
                  type="button"
                  data-active={scheduleType === type}
                  onClick={() => setScheduleType(type)}
                >
                  {type}
                </button>
              ))}
            </div>

            <div className="schedule-page__interval">
              <label>
                <span>Interval</span>
                <input value={interval} onChange={(event) => setInterval(event.target.value)} />
              </label>
              <label>
                <span>Minute Offset</span>
                <input value={minuteOffset} onChange={(event) => setMinuteOffset(event.target.value)} />
              </label>
            </div>

            <article className="schedule-page__plan-card">
              <p>
                This job will run using <strong>{scheduleType}</strong> cadence for{' '}
                <strong>{selectedSource}</strong>, every <strong>{interval}</strong> interval block at{' '}
                <strong>{minuteOffset}</strong>.
              </p>
            </article>

            <div className="schedule-page__toggle-row">
              <div>
                <strong>Email Notifications</strong>
                <small>Notify on job failure or timeout</small>
              </div>
              <button
                type="button"
                className="schedule-page__toggle"
                data-active={emailAlerts}
                onClick={() => setEmailAlerts((current) => !current)}
              >
                <span />
              </button>
            </div>

            {draftCreated ? <p className="schedule-page__success">Schedule draft created and queued for review.</p> : null}

            <div className="schedule-page__drawer-actions">
              <button type="button">Discard</button>
              <button type="button" className="schedule-page__primary-button" onClick={() => setDraftCreated(true)}>
                Create Schedule
              </button>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
