import { useEffect, useMemo, useState } from 'react';
import './ReportsDataExportsHubPage.css';

export const pageMeta = {
  slug: 'reports_data_exports_hub',
  path: '/reports_data_exports_hub',
  label: 'Reports Data Exports Hub',
  title: 'Axiom | Reports & Export',
};

const templates = [
  { id: 'committee', title: 'Investment Committee Deck', description: 'Narrative market summary with risk flags and supporting visuals.' },
  { id: 'diligence', title: 'Due Diligence Packet', description: 'Structured appendix covering source lineage, extraction confidence, and comparables.' },
  { id: 'watchlist', title: 'Watchlist Digest', description: 'Scheduled report for tracked properties, alerts, and pricing deltas.' },
];

const recentRuns = [
  { name: 'Committee_Deck_Q2.pdf', format: 'PDF', status: 'Delivered' },
  { name: 'Warehouse_Pipeline.xlsx', format: 'XLSX', status: 'Queued' },
  { name: 'Market_Alerts_Digest.csv', format: 'CSV', status: 'Delivered' },
];

export default function ReportsDataExportsHubPage() {
  const [selectedTemplateId, setSelectedTemplateId] = useState('committee');
  const [format, setFormat] = useState('PDF');
  const [delivery, setDelivery] = useState('Email');
  const [includeAppendix, setIncludeAppendix] = useState(true);
  const [statusMessage, setStatusMessage] = useState('Ready to generate a new export package.');

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

  const selectedTemplate = useMemo(
    () => templates.find((template) => template.id === selectedTemplateId) || templates[0],
    [selectedTemplateId],
  );

  function generateExport() {
    setStatusMessage(`${selectedTemplate.title} scheduled as ${format} via ${delivery}${includeAppendix ? ' with appendix.' : '.'}`);
  }

  return (
    <div className="reports-export-page">
      <header className="reports-export-page__hero">
        <div>
          <p>Distribution Center</p>
          <h1>Reports and data exports</h1>
          <span>Assemble presentation-ready deliverables from your intelligence workspace without leaving the operating flow.</span>
        </div>
        <button type="button" onClick={generateExport}>
          Generate Export
        </button>
      </header>

      <main className="reports-export-page__layout">
        <section className="reports-export-page__templates">
          <h2>Templates</h2>
          {templates.map((template) => (
            <button key={template.id} type="button" data-active={selectedTemplateId === template.id} onClick={() => setSelectedTemplateId(template.id)}>
              <strong>{template.title}</strong>
              <span>{template.description}</span>
            </button>
          ))}
        </section>

        <section className="reports-export-page__config">
          <article className="reports-export-page__card">
            <h2>Export Configuration</h2>
            <label>
              <span>Format</span>
              <select value={format} onChange={(event) => setFormat(event.target.value)}>
                <option>PDF</option>
                <option>XLSX</option>
                <option>CSV</option>
              </select>
            </label>
            <label>
              <span>Delivery</span>
              <select value={delivery} onChange={(event) => setDelivery(event.target.value)}>
                <option>Email</option>
                <option>Workspace Inbox</option>
                <option>Secure Link</option>
              </select>
            </label>
            <label className="reports-export-page__toggle">
              <input type="checkbox" checked={includeAppendix} onChange={() => setIncludeAppendix((current) => !current)} />
              <span>Include appendix with source lineage and confidence notes</span>
            </label>
          </article>

          <article className="reports-export-page__card">
            <h2>Preview</h2>
            <strong>{selectedTemplate.title}</strong>
            <p>{selectedTemplate.description}</p>
            <small>{statusMessage}</small>
          </article>
        </section>

        <aside className="reports-export-page__history">
          <h2>Recent Exports</h2>
          {recentRuns.map((run) => (
            <article key={run.name}>
              <strong>{run.name}</strong>
              <span>{run.format}</span>
              <em>{run.status}</em>
            </article>
          ))}
        </aside>
      </main>
    </div>
  );
}
