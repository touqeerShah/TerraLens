import { useEffect, useMemo, useState } from 'react';
import './DocumentUploadCenterPage.css';

export const pageMeta = {
  slug: 'document_upload_center',
  path: '/document_upload_center',
  label: 'Document Upload Center',
  title: 'Axiom | Document Upload Center',
};

const initialJobs = [
  {
    id: 'appraisal',
    name: 'Appraisal_Report_V4_NY.pdf',
    progress: 82,
    status: 'processing',
    details: '42.1k OCR chars',
    tag: 'Drafting',
  },
  {
    id: 'zoning',
    name: 'Zoning_Clearance_District_8.jpg',
    progress: 100,
    status: 'complete',
    details: 'Field Extraction: 18/20',
    tag: 'Analyzed',
  },
  {
    id: 'tax',
    name: 'Tax_Assessment_2023_corrupt.pdf',
    progress: 100,
    status: 'warning',
    details: 'Low confidence parse',
    tag: 'Manual Review',
  },
];

function MaterialIcon({ children, filled = false, className = '' }) {
  const style = filled ? { fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" } : undefined;
  return (
    <span className={`material-symbols-outlined ${className}`.trim()} style={style}>
      {children}
    </span>
  );
}

export default function DocumentUploadCenterPage() {
  const [runOcr, setRunOcr] = useState(true);
  const [autoTagging, setAutoTagging] = useState(true);
  const [sourceType, setSourceType] = useState('Direct Institutional API');
  const [region, setRegion] = useState('NYC, Manhattan, District 4');
  const [documentCategory, setDocumentCategory] = useState('Bank Appraisal');
  const [listingType, setListingType] = useState('Commercial');
  const [jobs, setJobs] = useState(initialJobs);
  const [statusMessage, setStatusMessage] = useState('3 active threads');

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

  const activeThreads = useMemo(() => jobs.filter((job) => job.status === 'processing').length, [jobs]);

  function browseFiles() {
    setJobs((current) => [
      {
        id: `upload-${Date.now()}`,
        name: `AuctionNotice_${current.length + 1}.pdf`,
        progress: 24,
        status: 'processing',
        details: 'Queued for OCR',
        tag: 'Queued',
      },
      ...current,
    ]);
    setStatusMessage('New batch added to intake queue');
  }

  function executeIngest() {
    setJobs((current) =>
      current.map((job) =>
        job.status === 'processing'
          ? { ...job, progress: Math.min(job.progress + 12, 100), details: runOcr ? 'OCR + tagging active' : 'Tagging only' }
          : job,
      ),
    );
    setStatusMessage(`Ingest launched for ${sourceType}`);
  }

  return (
    <div className="upload-page">
      <header className="upload-page__topbar">
        <div className="upload-page__brand">Architectural Intelligence</div>
        <nav className="upload-page__topnav">
          <a href="#/agent_intelligence_chat">Intelligence</a>
          <a href="#/add_new_source_url">Sources</a>
          <a href="#/live_agent_monitor_console">Automation</a>
          <a href="#/document_upload_center" data-active="true">
            Documents
          </a>
        </nav>
      </header>

      <aside className="upload-page__sidebar">
        <h2>Core Intelligence</h2>
        <p>Institutional Grade</p>
        <nav>
          <a href="#/agent_intelligence_chat">Intelligence</a>
          <a href="#/add_new_source_url">Sources</a>
          <a href="#/live_agent_monitor_console">Automation</a>
          <a href="#/document_upload_center" data-active="true">
            Documents
          </a>
        </nav>
      </aside>

      <main className="upload-page__main">
        <section className="upload-page__hero">
          <div>
            <h1>Ingestion Engine</h1>
            <p>Structured document processing for institutional real estate assets.</p>
          </div>
          <div className="upload-page__hero-actions">
            <button type="button" className="upload-page__ghost-button">
              Bulk Settings
            </button>
            <button type="button" className="upload-page__primary-button">
              History
            </button>
          </div>
        </section>

        <section className="upload-page__grid">
          <article className="upload-page__dropzone-card">
            <button type="button" className="upload-page__dropzone" onClick={browseFiles}>
              <MaterialIcon className="upload-page__dropzone-icon">cloud_upload</MaterialIcon>
              <strong>Central Deposit</strong>
              <span>PDF, TIFF, JPEG up to 500MB per file</span>
              <em>Browse Architecture Files</em>
            </button>

            <div className="upload-page__toggles">
              <label>
                <input type="checkbox" checked={runOcr} onChange={() => setRunOcr((current) => !current)} />
                <span>
                  <strong>Run OCR</strong>
                  <small>Optical Character Recognition</small>
                </span>
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={autoTagging}
                  onChange={() => setAutoTagging((current) => !current)}
                />
                <span>
                  <strong>Auto-Tagging</strong>
                  <small>LLM-based classification</small>
                </span>
              </label>
            </div>
          </article>

          <article className="upload-page__metadata-card">
            <p className="upload-page__section-label">Batch Metadata</p>
            <label>
              <span>Source Type</span>
              <select value={sourceType} onChange={(event) => setSourceType(event.target.value)}>
                <option>Direct Institutional API</option>
                <option>Physical Scan / Courier</option>
                <option>Third-party Aggregator</option>
                <option>Email Attachment</option>
              </select>
            </label>
            <label>
              <span>Country / Area Tagging</span>
              <input value={region} onChange={(event) => setRegion(event.target.value)} />
            </label>
            <div className="upload-page__metadata-grid">
              <label>
                <span>Document Category</span>
                <select value={documentCategory} onChange={(event) => setDocumentCategory(event.target.value)}>
                  <option>Bank Appraisal</option>
                  <option>Auction Notice</option>
                  <option>Zoning Map</option>
                  <option>Title Deed</option>
                </select>
              </label>
              <label>
                <span>Listing Type</span>
                <select value={listingType} onChange={(event) => setListingType(event.target.value)}>
                  <option>Commercial</option>
                  <option>Residential</option>
                  <option>Industrial</option>
                  <option>Mixed-Use</option>
                </select>
              </label>
            </div>

            <button type="button" className="upload-page__execute-button" onClick={executeIngest}>
              Execute High-Volume Ingest
            </button>
          </article>
        </section>

        <section className="upload-page__monitor">
          <div className="upload-page__monitor-header">
            <div>
              <h2>Live Intake Monitor</h2>
              <p>{statusMessage}</p>
            </div>
            <span className="upload-page__thread-pill">{activeThreads} active threads</span>
          </div>

          <div className="upload-page__job-list">
            {jobs.map((job) => (
              <article key={job.id} className={`upload-page__job upload-page__job--${job.status}`.trim()}>
                <div className="upload-page__job-media">
                  {job.status === 'warning' ? <MaterialIcon filled>warning</MaterialIcon> : <MaterialIcon>description</MaterialIcon>}
                </div>

                <div className="upload-page__job-body">
                  <div className="upload-page__job-head">
                    <strong>{job.name}</strong>
                    <span>{job.status === 'processing' ? `${job.progress}% processing` : job.tag}</span>
                  </div>
                  <div className="upload-page__progress">
                    <div style={{ width: `${job.progress}%` }} />
                  </div>
                  <p>{job.details}</p>
                </div>

                <div className="upload-page__job-tag">{job.tag}</div>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
