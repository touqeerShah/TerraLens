import { useEffect, useMemo, useState } from 'react';
import './PropertySearchFiltersPage.css';
import { navigateToPath } from '../utils/navigation';

export const pageMeta = {
  slug: 'property_search_filters',
  path: '/property_search_filters',
  label: 'Property Search Filters',
  title: 'Property Search | Architectural Intelligence',
};

const properties = [
  { id: 'p1', title: 'Nexus Office Park', location: 'Arlington, VA', label: 'Government Asset', price: '$22,000,000', updated: '2d ago', type: 'Office' },
  { id: 'p2', title: 'Oakwood Residences', location: 'Austin, TX', label: 'Auction Scheduled', price: '$1,850,000', updated: '1d ago', type: 'Residential' },
  { id: 'p3', title: 'Silverfin Lofts', location: 'Seattle, WA', label: 'Auction Scheduled', price: '$3,425,000', updated: '3d ago', type: 'Mixed Use' },
  { id: 'p4', title: 'Harbor Commerce Hub', location: 'Miami, FL', label: 'Private Feed', price: '$8,100,000', updated: '5h ago', type: 'Industrial' },
];

const viewModes = ['Grid', 'List', 'Map'];
const filters = {
  propertyType: ['Commercial', 'Residential', 'Industrial', 'Mixed Use'],
  source: ['Government', 'Auction', 'Private Feed', 'Bank'],
};

function MaterialIcon({ children }) {
  return <span className="material-symbols-outlined">{children}</span>;
}

export default function PropertySearchFiltersPage() {
  const [query, setQuery] = useState('');
  const [viewMode, setViewMode] = useState('Grid');
  const [selectedTypes, setSelectedTypes] = useState(['Commercial', 'Residential']);
  const [selectedSources, setSelectedSources] = useState(['Auction', 'Government']);
  const [priceCap, setPriceCap] = useState(25);

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

  const filteredProperties = useMemo(() => {
    const search = query.trim().toLowerCase();
    return properties.filter((property) => {
      const typeMatch = selectedTypes.includes(property.type);
      const sourceMatch = selectedSources.some((source) => property.label.includes(source) || property.label === source);
      const queryMatch = !search || `${property.title} ${property.location} ${property.type}`.toLowerCase().includes(search);
      return typeMatch && sourceMatch && queryMatch;
    });
  }, [query, selectedTypes, selectedSources]);

  function toggle(list, value, setter) {
    setter((current) => (current.includes(value) ? current.filter((item) => item !== value) : [...current, value]));
  }

  return (
    <div className="property-search-page">
      <aside className="property-search-page__sidebar">
        <h1>Enterprise Intel</h1>
        <p>Data Analytics v2.4</p>
        <nav>
          <a href="#/axiom_main_dashboard">Dashboard</a>
          <a href="#/property_search_filters" data-active="true">
            Property Search
          </a>
          <a href="#/document_upload_center">Source Management</a>
          <a href="#/global_automation_schedule">Automation Schedule</a>
          <a href="#/role_permission_settings">Settings</a>
        </nav>
      </aside>

      <div className="property-search-page__main">
        <header className="property-search-page__topbar">
          <label className="property-search-page__search">
            <MaterialIcon>search</MaterialIcon>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search markets, properties, or entities..."
            />
          </label>

          <div className="property-search-page__view-switch">
            {viewModes.map((mode) => (
              <button key={mode} type="button" data-active={viewMode === mode} onClick={() => setViewMode(mode)}>
                {mode}
              </button>
            ))}
          </div>
        </header>

        <main className="property-search-page__content">
          <section className="property-search-page__heading">
            <div>
              <h2>Property Search</h2>
              <p>
                Found <strong>{filteredProperties.length}</strong> properties matching your current filters.
              </p>
            </div>
            <button type="button" onClick={() => navigateToPath('/my_intelligence_watchlists')}>Save Search</button>
          </section>

          <section className="property-search-page__layout">
            <aside className="property-search-page__filters">
              <div>
                <p>Property Type</p>
                {filters.propertyType.map((type) => (
                  <label key={type}>
                    <input type="checkbox" checked={selectedTypes.includes(type)} onChange={() => toggle(selectedTypes, type, setSelectedTypes)} />
                    <span>{type}</span>
                  </label>
                ))}
              </div>

              <div>
                <p>Source</p>
                {filters.source.map((source) => (
                  <label key={source}>
                    <input
                      type="checkbox"
                      checked={selectedSources.includes(source)}
                      onChange={() => toggle(selectedSources, source, setSelectedSources)}
                    />
                    <span>{source}</span>
                  </label>
                ))}
              </div>

              <div>
                <p>Price Ceiling</p>
                <input type="range" min="1" max="50" value={priceCap} onChange={(event) => setPriceCap(Number(event.target.value))} />
                <strong>Up to ${priceCap}M</strong>
              </div>
            </aside>

            <section className="property-search-page__results" data-view={viewMode.toLowerCase()}>
              {filteredProperties.map((property) => (
                <article key={property.id} className="property-search-page__card" onClick={() => navigateToPath('/property_detail_page')}>
                  <div className="property-search-page__card-media">
                    <span>{property.label}</span>
                  </div>
                  <div className="property-search-page__card-body">
                    <div>
                      <h3>{property.title}</h3>
                      <p>{property.location}</p>
                    </div>
                    <div className="property-search-page__card-meta">
                      <div>
                        <small>Market Price</small>
                        <strong>{property.price}</strong>
                      </div>
                      <div>
                        <small>Updated</small>
                        <strong>{property.updated}</strong>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </section>
          </section>
        </main>
      </div>
    </div>
  );
}
