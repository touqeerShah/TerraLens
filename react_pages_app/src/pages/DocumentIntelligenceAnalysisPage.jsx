import { useEffect, useMemo, useState } from 'react';
import './DocumentIntelligenceAnalysisPage.css';

export const pageMeta = {
  slug: 'document_intelligence_analysis',
  path: '/document_intelligence_analysis',
  label: 'Document Intelligence Analysis',
  title: 'Axiom | Document Intelligence',
};

const tabs = ['Preview', 'Raw Text', 'Extracted Media', 'Logs'];

const entities = [
  { id: 'trustee', name: 'Harvey & Associates P.C.', role: 'Substitute Trustee', icon: 'gavel' },
  { id: 'beneficiary', name: 'Global Capital Markets Trust', role: 'Beneficiary', icon: 'account_balance' },
  { id: 'county', name: 'DC Land Records API', role: 'Source Registry', icon: 'database' },
];

const history = [
  { id: 'verify', title: 'Human Verification Completed', meta: 'By Sarah Chen • Today, 9:42 AM', active: true },
  { id: 'ocr', title: 'Model: Axiom-Vision-v4.2', meta: 'OCR & Data Extraction • Oct 24, 11:20 PM' },
  { id: 'ingest', title: 'Initial Ingestion', meta: 'Source: DC Land Records API • Oct 24, 11:18 PM' },
];

function MaterialIcon({ children, filled = false, className = '' }) {
  const style = filled ? { fontVariationSettings: "'FILL' 1, 'wght' 300, 'GRAD' 0, 'opsz' 24" } : undefined;
  return (
    <span className={`material-symbols-outlined ${className}`.trim()} style={style}>
      {children}
    </span>
  );
}

export default function DocumentIntelligenceAnalysisPage() {
  const [activeTab, setActiveTab] = useState('Preview');
  const [selectedEntityId, setSelectedEntityId] = useState(entities[0].id);
  const [statusNote, setStatusNote] = useState('Verified');

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

  const selectedEntity = useMemo(
    () => entities.find((entity) => entity.id === selectedEntityId) ?? entities[0],
    [selectedEntityId],
  );

  function rerunOcr() {
    setStatusNote('OCR rerun queued');
  }

  function exportData() {
    setStatusNote('Structured export prepared');
  }

  return (
    <div className="doc-analysis-page">
      <header className="doc-analysis-page__topbar">
        <div className="doc-analysis-page__brand">
          <span>Architectural Intelligence</span>
          <nav>
            <a href="#/agent_intelligence_chat">
              Intelligence
            </a>
            <a href="#/add_new_source_url">Sources</a>
            <a href="#/live_agent_monitor_console">Automation</a>
            <a href="#/document_upload_center" data-active="true">
              Documents
            </a>
          </nav>
        </div>

        <div className="doc-analysis-page__topbar-actions">
          <button type="button" className="doc-analysis-page__icon-button" aria-label="Notifications">
            <MaterialIcon>notifications</MaterialIcon>
          </button>
          <button type="button" className="doc-analysis-page__icon-button" aria-label="Settings">
            <MaterialIcon>settings</MaterialIcon>
          </button>
        </div>
      </header>

      <aside className="doc-analysis-page__sidebar">
        <h2>Core Intelligence</h2>
        <p>Institutional Grade</p>
        <nav>
          <a href="#/agent_intelligence_chat">Intelligence</a>
          <a href="#/add_new_source_url">Sources</a>
          <a href="#/live_agent_monitor_console">Automation</a>
          <a href="#/document_intelligence_analysis" data-active="true">
            Documents
          </a>
        </nav>
      </aside>

      <main className="doc-analysis-page__main">
        <section className="doc-analysis-page__header">
          <div>
            <p className="doc-analysis-page__breadcrumb">
              Documents / Auction Notices / <span>AX-2024-9981</span>
            </p>
            <h1>Notice of Trustee&apos;s Sale: 4400 Massachusetts Ave</h1>
            <div className="doc-analysis-page__meta-row">
              <span>
                <MaterialIcon>calendar_today</MaterialIcon>
                Added Oct 24, 2023
              </span>
              <span>
                <MaterialIcon>history</MaterialIcon>
                Processed 2m ago
              </span>
              <mark>{statusNote}</mark>
            </div>
          </div>

          <div className="doc-analysis-page__header-actions">
            <button type="button" onClick={rerunOcr}>
              <MaterialIcon>refresh</MaterialIcon>
              Re-run OCR
            </button>
            <button type="button" className="doc-analysis-page__primary-button" onClick={exportData}>
              <MaterialIcon>ios_share</MaterialIcon>
              Export Data
            </button>
          </div>
        </section>

        <div className="doc-analysis-page__layout">
          <section className="doc-analysis-page__viewer">
            <div className="doc-analysis-page__tabs">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  type="button"
                  className={activeTab === tab ? 'is-active' : ''}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="doc-analysis-page__viewer-body">
              {activeTab === 'Preview' ? (
                <article className="doc-analysis-page__paper">
                  <div className="doc-analysis-page__paper-head">
                    <span>DOCKET: 23-CA-004521</span>
                    <span>Page 1 of 4</span>
                  </div>
                  <h2>NOTICE OF TRUSTEE&apos;S SALE</h2>
                  <p>
                    Whereas, by Deed of Trust dated March 14, 2018, recorded in the land records of the
                    District of Columbia as Instrument No. 201802941, the property hereinafter described
                    was conveyed to the trustees therein named in trust to secure the payment of a
                    certain promissory note.
                  </p>
                  <div className="doc-analysis-page__highlight">
                    <strong>Property Description</strong>
                    <p>
                      Lot numbered Forty-one (41) in Square numbered Sixteen Hundred (1600) in the
                      subdivision made by the American University.
                    </p>
                    <p>
                      Commonly known as: <mark>4400 Massachusetts Avenue NW, Washington, DC 20016</mark>
                    </p>
                  </div>
                  <p>
                    Notice is hereby given that in execution of said deed of trust, and at the request
                    of the holder of the note, the undersigned trustees will sell at public auction the
                    property described herein.
                  </p>
                  <div className="doc-analysis-page__paper-metrics">
                    <div>
                      <span>Sale Date</span>
                      <strong>November 12, 2024</strong>
                    </div>
                    <div>
                      <span>Sale Time</span>
                      <strong>11:00 AM EST</strong>
                    </div>
                  </div>
                </article>
              ) : null}

              {activeTab === 'Raw Text' ? (
                <pre className="doc-analysis-page__code-block">{`WHEREAS, by Deed of Trust dated March 14, 2018...
COMMONLY KNOWN AS: 4400 Massachusetts Avenue NW, Washington, DC 20016
SALE DATE: November 12, 2024
SALE TIME: 11:00 AM EST`}</pre>
              ) : null}

              {activeTab === 'Extracted Media' ? (
                <div className="doc-analysis-page__media-grid">
                  {['Official stamp', 'Signature block', 'Address snippet'].map((label) => (
                    <div key={label} className="doc-analysis-page__media-card">
                      <div className="doc-analysis-page__media-placeholder" />
                      <strong>{label}</strong>
                    </div>
                  ))}
                </div>
              ) : null}

              {activeTab === 'Logs' ? (
                <div className="doc-analysis-page__logs">
                  {history.map((item) => (
                    <div key={item.id} className="doc-analysis-page__log-row">
                      <span className={item.active ? 'is-active' : ''} />
                      <div>
                        <strong>{item.title}</strong>
                        <p>{item.meta}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </section>

          <aside className="doc-analysis-page__data-panel">
            <div className="doc-analysis-page__panel-head">
              <h3>Structured Intelligence</h3>
              <button type="button">Edit Fields</button>
            </div>

            <section className="doc-analysis-page__panel-section">
              <p className="doc-analysis-page__section-label">Property Identity</p>
              <div className="doc-analysis-page__identity-card">
                <div>
                  <strong>University Heights Residence</strong>
                  <span>4400 Massachusetts Avenue NW</span>
                </div>
                <MaterialIcon>apartment</MaterialIcon>
              </div>
            </section>

            <section className="doc-analysis-page__panel-section">
              <p className="doc-analysis-page__section-label">Financial Metadata</p>
              <div className="doc-analysis-page__financial-grid">
                {[
                  ['Loan Principal', '$12,450,000', '98% confidence'],
                  ['Estimated Arrears', '$842,100', '94% confidence'],
                  ['Interest Rate', '4.25% Fixed', 'Cross-verified'],
                  ['Appraised Value', '$18,200,000', 'From appraisal packet'],
                ].map(([label, value, note]) => (
                  <div key={label}>
                    <span>{label}</span>
                    <strong>{value}</strong>
                    <small>{note}</small>
                  </div>
                ))}
              </div>
            </section>

            <section className="doc-analysis-page__panel-section">
              <p className="doc-analysis-page__section-label">Extracted Entities</p>
              <div className="doc-analysis-page__entity-list">
                {entities.map((entity) => (
                  <button
                    key={entity.id}
                    type="button"
                    className="doc-analysis-page__entity"
                    data-active={entity.id === selectedEntityId}
                    onClick={() => setSelectedEntityId(entity.id)}
                  >
                    <span>
                      <MaterialIcon>{entity.icon}</MaterialIcon>
                    </span>
                    <div>
                      <strong>{entity.name}</strong>
                      <small>{entity.role}</small>
                    </div>
                  </button>
                ))}
              </div>
              <div className="doc-analysis-page__entity-detail">
                <strong>{selectedEntity.name}</strong>
                <p>{selectedEntity.role} linked to the extracted chain of title and review workflow.</p>
              </div>
            </section>

            <section className="doc-analysis-page__panel-section">
              <p className="doc-analysis-page__section-label">Processing History</p>
              <div className="doc-analysis-page__timeline">
                {history.map((item) => (
                  <div key={item.id} className="doc-analysis-page__timeline-item">
                    <span className={item.active ? 'is-active' : ''} />
                    <div>
                      <strong>{item.title}</strong>
                      <small>{item.meta}</small>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </aside>
        </div>
      </main>
    </div>
  );
}
