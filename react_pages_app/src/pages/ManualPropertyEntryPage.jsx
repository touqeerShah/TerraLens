import { useEffect, useMemo, useState } from 'react';
import './ManualPropertyEntryPage.css';
import { navigateToPath } from '../utils/navigation';

export const pageMeta = {
  slug: 'manual_property_entry',
  path: '/manual_property_entry',
  label: 'Manual Property Entry',
  title: 'Add Property | Axiom Intel',
};

const listingTypes = ['For Sale', 'For Rent', 'Auction'];
const propertyTypes = ['Commercial', 'Residential', 'Industrial', 'Mixed-Use'];
const sourceTypes = ['Direct Call', 'MLS Sync', 'Private Network', 'Other'];

function MaterialIcon({ children }) {
  return <span className="material-symbols-outlined">{children}</span>;
}

export default function ManualPropertyEntryPage() {
  const [form, setForm] = useState({
    title: '',
    listingType: listingTypes[0],
    propertyType: propertyTypes[0],
    price: '',
    address: '',
    bedrooms: 2,
    bathrooms: 2,
    description: '',
    notes: '',
    contactName: '',
    contactPhone: '',
    contactEmail: '',
    source: sourceTypes[0],
  });
  const [mediaCount, setMediaCount] = useState(0);
  const [documentCount, setDocumentCount] = useState(0);
  const [statusMessage, setStatusMessage] = useState('Manual entry mode enabled for off-market or unverified sources.');

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

  const confidence = useMemo(() => {
    let score = 38;
    if (form.title.trim()) score += 18;
    if (form.address.trim()) score += 18;
    if (form.price.trim()) score += 14;
    if (form.contactName.trim() && form.contactEmail.trim()) score += 12;
    return Math.min(score, 100);
  }, [form]);

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function adjustCounter(field, delta) {
    setForm((current) => ({ ...current, [field]: Math.max(0, current[field] + delta) }));
  }

  function saveDraft() {
    setStatusMessage(`Draft saved for "${form.title || 'Untitled Asset'}". Confidence is ${confidence}%.`);
  }

  function publishAsset() {
    setStatusMessage(`Asset published to review queue with ${mediaCount} media files and ${documentCount} documents attached.`);
    navigateToPath('/property_detail_page');
  }

  return (
    <div className="manual-entry-page">
      <aside className="manual-entry-page__sidebar">
        <div>
          <h1>Axiom Intel</h1>
          <p>Institutional Grade</p>
        </div>
        <nav>
          <a href="#/axiom_main_dashboard">Dashboard</a>
          <a href="#/agent_intelligence_chat">Intelligence</a>
          <a href="#/manual_property_entry" data-active="true">
            Sources
          </a>
          <a href="#/reports_data_exports_hub">Reports</a>
        </nav>
      </aside>

      <div className="manual-entry-page__main">
        <header className="manual-entry-page__topbar">
          <div>
            <p>Add New Property Asset</p>
            <h2>Manual Property Entry</h2>
          </div>
          <div className="manual-entry-page__topbar-actions">
            <button type="button" onClick={saveDraft}>
              Save Draft
            </button>
            <button type="button" onClick={publishAsset}>
              Publish Asset
            </button>
          </div>
        </header>

        <main className="manual-entry-page__layout">
          <section className="manual-entry-page__form">
            <article className="manual-entry-page__card">
              <h3>General Information</h3>
              <div className="manual-entry-page__grid">
                <label className="manual-entry-page__full">
                  <span>Property Title</span>
                  <input value={form.title} onChange={(event) => updateField('title', event.target.value)} placeholder="Skyline Plaza - Penthouse Suite" />
                </label>
                <label>
                  <span>Listing Type</span>
                  <select value={form.listingType} onChange={(event) => updateField('listingType', event.target.value)}>
                    {listingTypes.map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>Property Type</span>
                  <select value={form.propertyType} onChange={(event) => updateField('propertyType', event.target.value)}>
                    {propertyTypes.map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>Price</span>
                  <input value={form.price} onChange={(event) => updateField('price', event.target.value)} placeholder="$4,500,000" />
                </label>
                <label className="manual-entry-page__full">
                  <span>Address</span>
                  <input value={form.address} onChange={(event) => updateField('address', event.target.value)} placeholder="452 West End Ave, Manhattan, NY" />
                </label>
              </div>

              <div className="manual-entry-page__counters">
                {[
                  ['Bedrooms', 'bedrooms'],
                  ['Bathrooms', 'bathrooms'],
                ].map(([label, field]) => (
                  <div key={field}>
                    <span>{label}</span>
                    <div>
                      <button type="button" onClick={() => adjustCounter(field, -1)}>
                        -
                      </button>
                      <strong>{form[field]}</strong>
                      <button type="button" onClick={() => adjustCounter(field, 1)}>
                        +
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </article>

            <article className="manual-entry-page__card">
              <h3>Content &amp; Notes</h3>
              <label>
                <span>Description</span>
                <textarea
                  rows="5"
                  value={form.description}
                  onChange={(event) => updateField('description', event.target.value)}
                  placeholder="Describe the architectural features, market positioning, and key selling points..."
                />
              </label>
              <label>
                <span>Internal Analyst Notes</span>
                <textarea
                  rows="4"
                  value={form.notes}
                  onChange={(event) => updateField('notes', event.target.value)}
                  placeholder="Private notes for the investment committee or triage staff..."
                />
              </label>
            </article>

            <article className="manual-entry-page__card">
              <h3>Media &amp; Documents</h3>
              <div className="manual-entry-page__uploads">
                <button type="button" onClick={() => setMediaCount((current) => current + 1)}>
                  <MaterialIcon>add_a_photo</MaterialIcon>
                  Upload Property Images
                  <small>{mediaCount} files attached</small>
                </button>
                <button type="button" onClick={() => setDocumentCount((current) => current + 1)}>
                  <MaterialIcon>picture_as_pdf</MaterialIcon>
                  Attach PDF Documents
                  <small>{documentCount} files attached</small>
                </button>
              </div>
            </article>
          </section>

          <aside className="manual-entry-page__sidepanel">
            <section className="manual-entry-page__confidence">
              <p>Data Confidence</p>
              <strong>{confidence}%</strong>
              <span>{confidence >= 80 ? 'Ready for review' : 'Manual triage required'}</span>
            </section>

            <section className="manual-entry-page__card">
              <h3>Contact Reference</h3>
              <label>
                <span>Primary Name</span>
                <input value={form.contactName} onChange={(event) => updateField('contactName', event.target.value)} placeholder="John Doe" />
              </label>
              <label>
                <span>Phone Number</span>
                <input value={form.contactPhone} onChange={(event) => updateField('contactPhone', event.target.value)} placeholder="+1 (555) 000-0000" />
              </label>
              <label>
                <span>Email Address</span>
                <input value={form.contactEmail} onChange={(event) => updateField('contactEmail', event.target.value)} placeholder="contact@brokerage.com" />
              </label>
              <label>
                <span>Source / Referral</span>
                <select value={form.source} onChange={(event) => updateField('source', event.target.value)}>
                  {sourceTypes.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </label>
            </section>

            <section className="manual-entry-page__tip">
              <MaterialIcon>lightbulb</MaterialIcon>
              <p>{statusMessage}</p>
            </section>
          </aside>
        </main>
      </div>
    </div>
  );
}
