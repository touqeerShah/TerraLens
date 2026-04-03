import { useEffect, useMemo, useState } from 'react';
import './PropertyDetailPage.css';

export const pageMeta = {
  slug: 'property_detail_page',
  path: '/property_detail_page',
  label: 'Property Detail Page',
  title: 'Nexus Office Park - Phase 2 | Architectural Intelligence',
};

const gallery = ['Overview', 'Aerial', 'Lobby', 'Site Plan'];
const tabs = ['Overview', 'Source Lineage', 'Risk Notes'];

function MaterialIcon({ children }) {
  return <span className="material-symbols-outlined">{children}</span>;
}

export default function PropertyDetailPage() {
  const [activeImage, setActiveImage] = useState('Overview');
  const [activeTab, setActiveTab] = useState('Overview');
  const [showSourceNotes, setShowSourceNotes] = useState(true);

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

  const activeTabCopy = useMemo(() => {
    if (activeTab === 'Source Lineage') return 'This asset was assembled from offering memoranda, zoning records, and internal analyst commentary.';
    if (activeTab === 'Risk Notes') return 'Lease rollover concentration and entitlement timing remain the two material diligence flags.';
    return 'Institutional-grade office campus with phased repositioning strategy and stable tenancy mix.';
  }, [activeTab]);

  return (
    <div className="property-detail-page">
      <header className="property-detail-page__hero">
        <div className="property-detail-page__hero-copy">
          <p>Property Intelligence Record</p>
          <h1>Nexus Office Park - Phase 2</h1>
          <span>Arlington, VA • 842,000 GSF • Class A Office</span>
        </div>
        <div className="property-detail-page__hero-actions">
          <a href="#/compare_properties_side_by_side">Compare</a>
          <a href="#/reports_data_exports_hub">Export</a>
        </div>
      </header>

      <main className="property-detail-page__layout">
        <section className="property-detail-page__main">
          <article className="property-detail-page__media">
            <div className="property-detail-page__media-frame">
              <div>
                <small>{activeImage}</small>
                <strong>Institutional visual reference</strong>
              </div>
            </div>
            <div className="property-detail-page__media-tabs">
              {gallery.map((item) => (
                <button key={item} type="button" data-active={activeImage === item} onClick={() => setActiveImage(item)}>
                  {item}
                </button>
              ))}
            </div>
          </article>

          <article className="property-detail-page__stats">
            {[
              ['Asking Value', '$142.5M'],
              ['Cap Rate', '5.82%'],
              ['Occupancy', '91%'],
              ['Confidence', '82%'],
            ].map(([label, value]) => (
              <div key={label}>
                <small>{label}</small>
                <strong>{value}</strong>
              </div>
            ))}
          </article>

          <article className="property-detail-page__card">
            <div className="property-detail-page__tab-row">
              {tabs.map((tab) => (
                <button key={tab} type="button" data-active={activeTab === tab} onClick={() => setActiveTab(tab)}>
                  {tab}
                </button>
              ))}
            </div>
            <p>{activeTabCopy}</p>
          </article>
        </section>

        <aside className="property-detail-page__side">
          <section className="property-detail-page__card">
            <h3>Extraction Confidence</h3>
            <div className="property-detail-page__confidence">
              <strong>82%</strong>
              <span>+4% since last document refresh</span>
            </div>
            <ul>
              <li>Text extraction: 94%</li>
              <li>Entity resolution: 78%</li>
              <li>Contextual logic: 62%</li>
            </ul>
          </section>

          <section className="property-detail-page__card">
            <div className="property-detail-page__toggle-row">
              <h3>Source Lineage</h3>
              <button type="button" onClick={() => setShowSourceNotes((current) => !current)}>
                <MaterialIcon>{showSourceNotes ? 'visibility_off' : 'visibility'}</MaterialIcon>
              </button>
            </div>
            {showSourceNotes ? (
              <div className="property-detail-page__sources">
                <article>
                  <strong>Offering Memorandum V3</strong>
                  <span>Primary valuation source • Page 14 anchors</span>
                </article>
                <article>
                  <strong>Zoning Report</strong>
                  <span>District 4 overlay and FAR references</span>
                </article>
                <article>
                  <strong>Analyst Notes</strong>
                  <span>Debt and liquidity commentary appended manually</span>
                </article>
              </div>
            ) : (
              <p className="property-detail-page__muted">Source notes hidden for focused review.</p>
            )}
          </section>
        </aside>
      </main>
    </div>
  );
}
