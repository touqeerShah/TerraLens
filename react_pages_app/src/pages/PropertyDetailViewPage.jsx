import { useEffect, useMemo, useState } from 'react';
import './PropertyDetailViewPage.css';

export const pageMeta = {
  slug: 'property_detail_view',
  path: '/property_detail_view',
  label: 'Property Detail View',
  title: 'Property Detail | Architectural Intelligence',
};

const sections = ['Summary', 'History', 'Similar'];

export default function PropertyDetailViewPage() {
  const [activeSection, setActiveSection] = useState('Summary');
  const [selectedGallery, setSelectedGallery] = useState('Primary');

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

  const sectionCopy = useMemo(() => {
    if (activeSection === 'History') return 'Three extraction passes were completed across listing PDFs, public records, and broker commentary.';
    if (activeSection === 'Similar') return 'Nearby assets show a tighter pricing band but slower turnover relative to this property.';
    return 'Adaptive mixed-use property with renovated interiors, strong neighborhood amenities, and recent underwriting updates.';
  }, [activeSection]);

  return (
    <div className="property-detail-view-page">
      <main className="property-detail-view-page__container">
        <section className="property-detail-view-page__hero">
          <div className="property-detail-view-page__visual">
            <div>
              <small>{selectedGallery} View</small>
              <strong>Architectural showcase</strong>
            </div>
          </div>
          <div className="property-detail-view-page__gallery">
            {['Primary', 'Interior', 'Street', 'Plan'].map((item) => (
              <button key={item} type="button" data-active={selectedGallery === item} onClick={() => setSelectedGallery(item)}>
                {item}
              </button>
            ))}
          </div>
        </section>

        <section className="property-detail-view-page__content">
          <div className="property-detail-view-page__headline">
            <p>Residential Detail View</p>
            <h1>Hudson Terrace Residence</h1>
            <span>Upper West Side, New York • 4 Bed • 3 Bath • 3,400 SF</span>
          </div>

          <div className="property-detail-view-page__section-tabs">
            {sections.map((section) => (
              <button key={section} type="button" data-active={activeSection === section} onClick={() => setActiveSection(section)}>
                {section}
              </button>
            ))}
          </div>

          <article className="property-detail-view-page__card">
            <p>{sectionCopy}</p>
          </article>

          <section className="property-detail-view-page__grid">
            <article className="property-detail-view-page__card">
              <h3>Key Metrics</h3>
              <div className="property-detail-view-page__metrics">
                {[
                  ['Asking Price', '$7.85M'],
                  ['Price / SF', '$2,309'],
                  ['Confidence', '89%'],
                  ['Updated', '6h ago'],
                ].map(([label, value]) => (
                  <div key={label}>
                    <small>{label}</small>
                    <strong>{value}</strong>
                  </div>
                ))}
              </div>
            </article>

            <article className="property-detail-view-page__card">
              <h3>Extraction History</h3>
              <ul>
                <li>Broker brochure ingested and normalized.</li>
                <li>Floorplan dimensions reconciled against archived documents.</li>
                <li>Comparable set refreshed from local market feed.</li>
              </ul>
            </article>
          </section>
        </section>
      </main>
    </div>
  );
}
