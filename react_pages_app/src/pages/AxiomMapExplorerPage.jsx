import { useEffect, useMemo, useState } from 'react';
import './AxiomMapExplorerPage.css';
import { navigateToPath } from '../utils/navigation';

export const pageMeta = {
  slug: 'axiom_map_explorer',
  path: '/axiom_map_explorer',
  label: 'Axiom Map Explorer',
  title: 'Axiom | Map Explorer',
};

const avatar =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBLFl68dJ5CxMJxJK1U53_PRE9G9HMPONcpjDdHDtWSyD-aeU0jw2gjHppavPGzdPU2XyPE_nPotxKOBqYjvlzRjJ9EDYNP-EEe33eqOCNot_2nS6rRYtGXOj_B5Ral1FQxEVxodkpxtKKKQcRiBeSxp1d_UtuOTEtodE2Sq5inZAMPuJr-mn9VwdGsvOW9fbdAC3cic0_6B8Dg0gyHzgc4-Zem0qBk3_h_wD2SXH656-82VGagUaMtyZJwgmTtlOAJzesyaV1wF1Q';
const mapImage =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBPhvlhOUeHv-5TmQ2Ujq2ASomYAN3918IAfsu9VsRhHeAldZ45Vn08ydXoS3EOx08smiLuSJkJJrmdKS_aixPc3b7i6CVLhJdslp6np7zQajgIRqg_V4gQYWCdAVbEyTWAb82ojzPTLON_qa93ZdYGIko8dj-P44b9wr8WdHA-6d_Bq7SM44Z24jut5uDUy_XILyVhRv4lVYUcGitEFjrdSluaadDowiVnngzlpAcfTdSj4ggWpLCYbwtsje7hYzFxIp7pEqMU3tQ';
const propertyPreview =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDRg7OtEN0QdaphErxIDo7VKz-aGbthXpcw6qo-DOy6M4HeVSCjycnsqZeM8-LjRrJ1Z56NY8H90oBvYPTr1UkahMQ1qUQxgi5E6zEpgYaaWKiUNqhuu-Y8srLdLxzBKjvfqL_CRrwVDdO8JamwNJ6-DdURy8eIuUPe1_jyi4fhob1h2O1WX_xr1f_PuCISpQ9KZ0VJRkiSfyplUBTuojFjionarZIouWci2EJjES4io6kp6cFRzHwd9zIe5J_jvlOV_icxuVGLi94';

const modes = ['Markers', 'Heatmap', 'Density'];
const markerData = [
  { id: 'cluster', title: 'Chelsea Highline Cluster', type: 'cluster', top: '40%', left: '45%', count: 12, status: 'For Sale', meta: '12 commercial assets in active monitor' },
  { id: 'single', title: 'Hudson Logistics One', type: 'single', top: '25%', left: '60%', count: 1, status: 'Tracked', meta: 'Industrial logistics signal with price drop' },
];

function MaterialIcon({ children, filled = false }) {
  const style = filled ? { fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" } : undefined;
  return <span className="material-symbols-outlined" style={style}>{children}</span>;
}

export default function AxiomMapExplorerPage() {
  const [mode, setMode] = useState('Markers');
  const [price, setPrice] = useState(65);
  const [types, setTypes] = useState({
    office: true,
    retail: false,
    logistics: true,
  });
  const [activeMarkerId, setActiveMarkerId] = useState('cluster');

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

  const activeMarker = useMemo(
    () => markerData.find((marker) => marker.id === activeMarkerId) ?? markerData[0],
    [activeMarkerId],
  );

  function toggleType(key) {
    setTypes((current) => ({ ...current, [key]: !current[key] }));
  }

  return (
    <div className="map-page">
      <header className="map-page__topbar">
        <div className="map-page__topbar-left">
          <div className="map-page__brand">Architect Intelligence</div>
          <label className="map-page__search">
            <MaterialIcon>search</MaterialIcon>
            <input type="text" placeholder="Search markets, properties, or districts..." />
          </label>
        </div>
        <div className="map-page__topbar-right">
          <button className="map-page__icon-button" type="button" onClick={() => navigateToPath('/market_alerts_subscriptions')}><MaterialIcon>notifications</MaterialIcon></button>
          <button className="map-page__icon-button" type="button" onClick={() => navigateToPath('/workspace_team_settings')}><MaterialIcon>settings</MaterialIcon></button>
          <img className="map-page__avatar" src={avatar} alt="Executive user profile" />
        </div>
      </header>

      <div className="map-page__layout">
        <aside className="map-page__sidebar">
          <div>
            <h2>Navigation</h2>
            <p>Market Insights</p>
          </div>
          <nav className="map-page__nav">
            <a href="#/axiom_map_explorer" data-active="true"><MaterialIcon filled>map</MaterialIcon><span>Map Explorer</span></a>
            <a href="#/axiom_analytics_market_trends"><MaterialIcon>analytics</MaterialIcon><span>Analytics</span></a>
            <a href="#/property_search_filters"><MaterialIcon>domain</MaterialIcon><span>Portfolio</span></a>
            <a href="#/reports_data_exports_hub"><MaterialIcon>description</MaterialIcon><span>Reports</span></a>
            <a href="#/workspace_team_settings"><MaterialIcon>admin_panel_settings</MaterialIcon><span>Admin</span></a>
          </nav>

          <div className="map-page__filters">
            <p className="map-page__filter-title">View Configuration</p>
            <div className="map-page__mode-grid">
              {modes.map((item) => (
                <button key={item} type="button" data-active={mode === item} onClick={() => setMode(item)}>
                  {item}
                </button>
              ))}
            </div>

            <div className="map-page__filter-group">
              <p className="map-page__filter-title">Price Range</p>
              <input type="range" min="0" max="100" value={price} onChange={(event) => setPrice(Number(event.target.value))} />
              <div className="map-page__range-label">
                <span>$500k</span>
                <span>{`$${(price / 4).toFixed(1)}M+`}</span>
              </div>
            </div>

            <div className="map-page__filter-group">
              <p className="map-page__filter-title">Property Type</p>
              <label className="map-page__checkbox">
                <input type="checkbox" checked={types.office} onChange={() => toggleType('office')} />
                <span>Commercial Office</span>
              </label>
              <label className="map-page__checkbox">
                <input type="checkbox" checked={types.retail} onChange={() => toggleType('retail')} />
                <span>Retail / Mixed Use</span>
              </label>
              <label className="map-page__checkbox">
                <input type="checkbox" checked={types.logistics} onChange={() => toggleType('logistics')} />
                <span>Industrial Logistics</span>
              </label>
            </div>

            <button className="map-page__apply" type="button" onClick={() => navigateToPath('/property_search_filters')}>Apply Filters</button>
          </div>
        </aside>

        <main className="map-page__canvas">
          <div className="map-page__map-image">
            <img src={mapImage} alt="Map explorer background" />
            {(mode === 'Heatmap' || mode === 'Density') ? (
              <>
                <div className="map-page__heat" style={{ width: '16rem', height: '16rem', top: '20%', left: '28%' }} />
                <div className="map-page__heat" style={{ width: '22rem', height: '22rem', top: '45%', left: '56%' }} />
              </>
            ) : null}
          </div>

          <div className="map-page__toolbar">
            {[
              ['pan_tool', 'Pan'],
              ['radio_button_unchecked', 'Radius'],
              ['polyline', 'Polygon'],
              ['straighten', 'Measure'],
            ].map(([icon, label], index) => (
              <button key={label} type="button" data-active={index === 0}>
                <MaterialIcon filled={index === 0}>{icon}</MaterialIcon>
              </button>
            ))}
          </div>

          {markerData.map((marker) => (
            <button
              key={marker.id}
              className="map-page__marker"
              style={{ top: marker.top, left: marker.left }}
              type="button"
              onClick={() => {
                setActiveMarkerId(marker.id);
                navigateToPath('/property_detail_page');
              }}
            >
              {marker.type === 'cluster' ? (
                <div className="map-page__marker-badge">{marker.count}</div>
              ) : (
                <div className="map-page__marker-dot"><MaterialIcon filled>apartment</MaterialIcon></div>
              )}
              {activeMarkerId === marker.id ? <div className="map-page__label">{marker.title}</div> : null}
            </button>
          ))}

          <section className="map-page__preview">
            <div className="map-page__preview-image">
              <img src={propertyPreview} alt={activeMarker.title} />
              <div className="map-page__status-pill map-page__status-pill--green">{activeMarker.status}</div>
            </div>
            <div className="map-page__preview-body">
              <h2 className="map-page__preview-title">{activeMarker.title}</h2>
              <p className="map-page__preview-meta">{activeMarker.meta}</p>
              <p className="map-page__preview-copy">
                Current mode: {mode}. Active type filters:
                {' '}
                {Object.entries(types).filter(([, checked]) => checked).map(([key]) => key).join(', ')}.
              </p>
            </div>
          </section>

          <section className="map-page__legend">
            <p className="map-page__legend-title">Market Context</p>
            <div className="map-page__legend-row">
              <span>Selected mode</span>
              <strong>{mode}</strong>
            </div>
            <div className="map-page__legend-row">
              <span>Price threshold</span>
              <strong>{`${price}%`}</strong>
            </div>
            <div className="map-page__legend-row">
              <span>Tracked clusters</span>
              <strong>{markerData.length}</strong>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
