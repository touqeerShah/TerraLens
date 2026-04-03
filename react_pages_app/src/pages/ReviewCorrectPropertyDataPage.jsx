import { useEffect, useMemo, useState } from 'react';
import './ReviewCorrectPropertyDataPage.css';
import { navigateToPath } from '../utils/navigation';

export const pageMeta = {
  slug: 'review_correct_property_data',
  path: '/review_correct_property_data',
  label: 'Review Correct Property Data',
  title: 'Axiom | Manual Data Review',
};

const duplicateCandidates = [
  { id: 'hudson', name: 'Hudson Plaza I', detail: '450 West End Ave • 92% Match' },
  { id: 'riverside', name: 'Riverside Phase II', detail: '460 West End Ave • 64% Match' },
];

export default function ReviewCorrectPropertyDataPage() {
  const [fields, setFields] = useState({
    title: 'The Hudson Waterfront Plaza - Phase II',
    valuation: '$142,500,000',
    squareFootage: '842,000 GSF',
    location: '452 West End Ave, Financial District, Manhattan, NY',
    zoning: 'C6-4M Commercial',
    yield: '5.82%',
  });
  const [selectedDuplicateId, setSelectedDuplicateId] = useState('hudson');
  const [statusMessage, setStatusMessage] = useState('Last edit 2m ago by AI-Parser-V4.');

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
    let score = 82;
    if (fields.valuation.includes('140')) score -= 6;
    return score;
  }, [fields.valuation]);

  const selectedDuplicate = duplicateCandidates.find((item) => item.id === selectedDuplicateId) || duplicateCandidates[0];

  function updateField(field, value) {
    setFields((current) => ({ ...current, [field]: value }));
  }

  function approveEntry() {
    setStatusMessage(`Entry approved at ${confidence}% confidence.`);
    navigateToPath('/property_detail_page');
  }

  function sendToSenior() {
    setStatusMessage(`Escalated with duplicate candidate ${selectedDuplicate.name}.`);
    navigateToPath('/extraction_repair_console');
  }

  return (
    <div className="review-property-page">
      <header className="review-property-page__hero">
        <div>
          <p>Manual Data Validation</p>
          <h1>Review Property Extraction</h1>
          <span>ID: PROP-8842-AX</span>
        </div>
        <div className="review-property-page__actions">
          <button type="button" onClick={approveEntry}>
            Approve Entry
          </button>
          <button type="button" onClick={() => navigateToPath('/extraction_repair_console')}>Reject</button>
          <button type="button" onClick={sendToSenior}>
            Send to Senior Analyst
          </button>
        </div>
      </header>

      <main className="review-property-page__layout">
        <section className="review-property-page__editor">
          <article className="review-property-page__card">
            <div className="review-property-page__card-head">
              <h2>Extracted Metadata</h2>
              <span>{statusMessage}</span>
            </div>

            <div className="review-property-page__grid">
              {[
                ['Property Title', 'title'],
                ['Valuation (USD)', 'valuation'],
                ['Square Footage', 'squareFootage'],
                ['Location / District', 'location'],
                ['Zoning Category', 'zoning'],
                ['Yield Forecast (%)', 'yield'],
              ].map(([label, field]) => (
                <label key={field}>
                  <span>{label}</span>
                  <input value={fields[field]} onChange={(event) => updateField(field, event.target.value)} />
                </label>
              ))}
            </div>
          </article>

          <article className="review-property-page__card">
            <h2>Linked Verification Sources</h2>
            <div className="review-property-page__sources">
              <article>
                <strong>Offering_Memorandum_V3.pdf</strong>
                <span>Uploaded Sep 12, 2023 • 4.2 MB</span>
              </article>
              <article>
                <strong>Zoning_Report_Manhattan_Dist4.pdf</strong>
                <span>Internal Archive • 1.1 MB</span>
              </article>
            </div>
          </article>
        </section>

        <aside className="review-property-page__side">
          <section className="review-property-page__confidence">
            <h2>AI Confidence Score</h2>
            <strong>{confidence}%</strong>
            <p>Text extraction, entity resolution, and contextual logic are blended into a single review score.</p>
          </section>

          <section className="review-property-page__card">
            <h2>Raw Text Fragment</h2>
            <pre>
              ...subject property located at 452 West End Ave with a projected capitalization of 5.82% following Phase II
              completion. Gross square footage estimated at 842,000. Market valuation estimated between $140.5M and $142.5M...
            </pre>
          </section>

          <section className="review-property-page__card">
            <h2>Potential Duplicates</h2>
            <div className="review-property-page__duplicates">
              {duplicateCandidates.map((item) => (
                <button key={item.id} type="button" data-active={selectedDuplicateId === item.id} onClick={() => setSelectedDuplicateId(item.id)}>
                  <strong>{item.name}</strong>
                  <span>{item.detail}</span>
                </button>
              ))}
            </div>
            <small>Selected candidate: {selectedDuplicate.name}</small>
          </section>
        </aside>
      </main>
    </div>
  );
}
