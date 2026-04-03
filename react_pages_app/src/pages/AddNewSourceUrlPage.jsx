import { useEffect, useMemo, useState } from 'react';
import './AddNewSourceUrlPage.css';

export const pageMeta = {
  slug: 'add_new_source_url',
  path: '/add_new_source_url',
  label: 'Add New Source Url',
  title: 'Add New Source | Architectural Intelligence',
};

const avatarUrl =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuAlL8K98dSPAdGloKr4mIewOE5rjc3PRtwc1U_n252a8PRvrOERgMgztjS9y7gNawg8X0yUzE5vODufsxbWzMMbtiXPmxfGZodGBwkGFGl0AomT1dAytI9RLK88Trg5MBh_YG_XpE_3DsrfQGn7ybMKRu3QcnKM_tIZV86FsKfRxnXPP4d0oFmcKGjWJb48p6heGW1hlrzh6EeAmug_Lxdx6Gg0E5gxWmxRMsD6p2mZ_uKhwvsJqxjK-PtCrZ9yX4JIBOLNIchrqt8';

const navLinks = [
  { icon: 'dashboard', label: 'Dashboard', href: '#/axiom_main_dashboard' },
  { icon: 'map', label: 'Map', href: '#/axiom_map_explorer' },
  { icon: 'insights', label: 'Analytics', href: '#/axiom_analytics_market_trends' },
  { icon: 'database', label: 'Source Management', href: '#/source_management_console', active: true },
];

const behaviorOptions = [
  { id: 'search', title: 'Search Page', description: 'Extract results from a search query URL' },
  { id: 'list', title: 'List Page', description: 'Standard property directory listing' },
  { id: 'detail', title: 'Detail Page', description: 'Single asset deep extraction' },
];

const scheduleOptions = ['Once', 'Hourly', 'Daily', 'Custom'];

const initialToggles = {
  useLogin: false,
  followPagination: true,
  downloadPdfs: false,
  captureScreenshot: true,
};

function MaterialIcon({ children, filled = false }) {
  const style = filled ? { fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" } : undefined;
  return (
    <span className="material-symbols-outlined" style={style} aria-hidden="true">
      {children}
    </span>
  );
}

function cronForSchedule(schedule) {
  switch (schedule) {
    case 'Once':
      return '0 0 9 * * ?';
    case 'Hourly':
      return '0 0/1 * 1/1 * ? *';
    case 'Daily':
      return '0 0 6 * * ?';
    default:
      return '0 */30 * * * ?';
  }
}

export default function AddNewSourceUrlPage() {
  const [form, setForm] = useState({
    sourceUrl: 'https://www.metropolis-realty.com/en/search/london-offices',
    sourceName: 'Metropolis Commercial - London',
    category: 'Private',
    listingType: 'Sale',
    country: 'United Kingdom',
    city: 'London',
    sellerType: 'Agency',
  });
  const [behavior, setBehavior] = useState('search');
  const [schedule, setSchedule] = useState('Hourly');
  const [tags, setTags] = useState(['Premium', 'Commercial']);
  const [tagInput, setTagInput] = useState('');
  const [toggles, setToggles] = useState(initialToggles);
  const [priority, setPriority] = useState(8);
  const [statusText, setStatusText] = useState('Ready to save');

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

  const cronExpression = useMemo(() => cronForSchedule(schedule), [schedule]);

  function setField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function addTag() {
    const nextTag = tagInput.trim();
    if (!nextTag || tags.includes(nextTag)) {
      return;
    }
    setTags((current) => [...current, nextTag]);
    setTagInput('');
  }

  function removeTag(tag) {
    setTags((current) => current.filter((item) => item !== tag));
  }

  function toggleOption(name) {
    setToggles((current) => ({ ...current, [name]: !current[name] }));
  }

  function testExtraction() {
    setStatusText(`Preview refreshed for ${form.sourceName || 'Untitled Source'}`);
  }

  function saveSource() {
    setStatusText(`Saved ${form.sourceName || 'Untitled Source'} with ${schedule.toLowerCase()} sync`);
  }

  return (
    <div className="source-page">
      <div className="source-page__layout">
        <aside className="source-page__sidebar">
          <div>
            <h1 className="source-page__sidebar-title">Command Console</h1>
            <p className="source-page__sidebar-subtitle">Institutional Grade</p>
          </div>

          <nav className="source-page__nav" aria-label="Source navigation">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className={`source-page__nav-link ${link.active ? 'source-page__nav-link--active' : ''}`.trim()}
              >
                <MaterialIcon>{link.icon}</MaterialIcon>
                <span>{link.label}</span>
              </a>
            ))}
          </nav>

          <button className="source-page__cta" type="button">
            <MaterialIcon>add</MaterialIcon>
            New Analysis
          </button>

          <div className="source-page__sidebar-footer">
            <button className="source-page__footer-link" type="button">
              <MaterialIcon>help</MaterialIcon>
              <span>Support</span>
            </button>
            <button className="source-page__footer-link" type="button">
              <MaterialIcon>logout</MaterialIcon>
              <span>Sign Out</span>
            </button>
          </div>
        </aside>

        <div className="source-page__main">
          <header className="source-page__topbar">
            <div className="source-page__topbar-left">
              <h2 className="source-page__title">Add New Source</h2>
              <div className="source-page__divider" />
              <button className="source-page__tool-button" type="button" onClick={testExtraction}>
                <MaterialIcon>play_circle</MaterialIcon>
                Test Extraction
              </button>
              <button className="source-page__save-button" type="button" onClick={saveSource}>
                <MaterialIcon>save</MaterialIcon>
                Save Source
              </button>
            </div>

            <div className="source-page__topbar-right">
              <button className="source-page__tool-button" type="button">
                <MaterialIcon>notifications</MaterialIcon>
              </button>
              <img className="source-page__avatar" src={avatarUrl} alt="Executive profile" />
            </div>
          </header>

          <div className="source-page__content">
            <div className="source-page__form-column">
              <section className="source-page__card">
                <div className="source-page__card-body">
                  <h3 className="source-page__card-title">
                    <MaterialIcon>settings_input_component</MaterialIcon>
                    Core Configuration
                  </h3>

                  <div className="source-page__grid">
                    <div className="source-page__field source-page__span-12">
                      <label htmlFor="source-url">Source URL</label>
                      <input
                        id="source-url"
                        value={form.sourceUrl}
                        onChange={(event) => setField('sourceUrl', event.target.value)}
                        placeholder="https://www.property-exchange.com/listings/search?type=commercial"
                      />
                    </div>

                    <div className="source-page__field source-page__span-6">
                      <label htmlFor="source-name">Source Name</label>
                      <input
                        id="source-name"
                        value={form.sourceName}
                        onChange={(event) => setField('sourceName', event.target.value)}
                      />
                    </div>

                    <div className="source-page__field source-page__span-3">
                      <label htmlFor="category">Category</label>
                      <select id="category" value={form.category} onChange={(event) => setField('category', event.target.value)}>
                        <option>Private</option>
                        <option>Bank</option>
                        <option>Gov</option>
                      </select>
                    </div>

                    <div className="source-page__field source-page__span-3">
                      <label htmlFor="listing-type">Listing Type</label>
                      <select
                        id="listing-type"
                        value={form.listingType}
                        onChange={(event) => setField('listingType', event.target.value)}
                      >
                        <option>Sale</option>
                        <option>Rent</option>
                        <option>Auction</option>
                      </select>
                    </div>

                    <div className="source-page__field source-page__span-4">
                      <label htmlFor="country">Country</label>
                      <input id="country" value={form.country} onChange={(event) => setField('country', event.target.value)} />
                    </div>

                    <div className="source-page__field source-page__span-4">
                      <label htmlFor="city">Area / City</label>
                      <input id="city" value={form.city} onChange={(event) => setField('city', event.target.value)} />
                    </div>

                    <div className="source-page__field source-page__span-4">
                      <label htmlFor="seller-type">Seller Type</label>
                      <select
                        id="seller-type"
                        value={form.sellerType}
                        onChange={(event) => setField('sellerType', event.target.value)}
                      >
                        <option>Agency</option>
                        <option>Developer</option>
                        <option>Direct Owner</option>
                      </select>
                    </div>

                    <div className="source-page__field source-page__span-12">
                      <label>Tags</label>
                      <div className="source-page__tag-box">
                        {tags.map((tag) => (
                          <span key={tag} className="source-page__tag">
                            {tag}
                            <button type="button" onClick={() => removeTag(tag)} aria-label={`Remove ${tag}`}>
                              <MaterialIcon>close</MaterialIcon>
                            </button>
                          </span>
                        ))}
                        <input
                          className="source-page__tag-input"
                          value={tagInput}
                          onChange={(event) => setTagInput(event.target.value)}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter') {
                              event.preventDefault();
                              addTag();
                            }
                          }}
                          placeholder="Add tag..."
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <div className="source-page__split">
                <section className="source-page__card">
                  <div className="source-page__card-body">
                    <h3 className="source-page__card-title">
                      <MaterialIcon>rebase_edit</MaterialIcon>
                      Source Behavior
                    </h3>
                    {behaviorOptions.map((option) => (
                      <label
                        key={option.id}
                        className={`source-page__choice ${behavior === option.id ? 'source-page__choice--selected' : ''}`.trim()}
                      >
                        <input
                          type="radio"
                          name="behavior"
                          checked={behavior === option.id}
                          onChange={() => setBehavior(option.id)}
                        />
                        <div>
                          <p className="source-page__choice-title">{option.title}</p>
                          <p className="source-page__choice-meta">{option.description}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </section>

                <section className="source-page__card">
                  <div className="source-page__card-body">
                    <h3 className="source-page__card-title">
                      <MaterialIcon>schedule</MaterialIcon>
                      Sync Schedule
                    </h3>

                    <div className="source-page__schedule-grid">
                      {scheduleOptions.map((option) => (
                        <button
                          key={option}
                          className={`source-page__schedule-button ${
                            schedule === option ? 'source-page__schedule-button--active' : ''
                          }`.trim()}
                          type="button"
                          onClick={() => setSchedule(option)}
                        >
                          {option}
                        </button>
                      ))}
                    </div>

                    <div className="source-page__cron">
                      <p className="source-page__cron-label">Custom Expression (CRON)</p>
                      <code>{cronExpression}</code>
                    </div>
                  </div>
                </section>
              </div>

              <section className="source-page__card">
                <div className="source-page__card-body">
                  <h3 className="source-page__card-title">
                    <MaterialIcon>tune</MaterialIcon>
                    Advanced Parameters
                  </h3>

                  <div className="source-page__split">
                    <div>
                      <div className="source-page__toggle-row">
                        <div className="source-page__toggle-copy">
                          <p className="source-page__toggle-title">Use Login / Session</p>
                          <p className="source-page__toggle-meta">Authenticates with saved credentials</p>
                        </div>
                        <button
                          className={`source-page__toggle ${toggles.useLogin ? 'source-page__toggle--on' : ''}`.trim()}
                          type="button"
                          onClick={() => toggleOption('useLogin')}
                        >
                          <span className="source-page__toggle-thumb" />
                        </button>
                      </div>

                      <div className="source-page__toggle-row">
                        <div className="source-page__toggle-copy">
                          <p className="source-page__toggle-title">Download PDFs</p>
                          <p className="source-page__toggle-meta">Store brochures and attachments</p>
                        </div>
                        <button
                          className={`source-page__toggle ${toggles.downloadPdfs ? 'source-page__toggle--on' : ''}`.trim()}
                          type="button"
                          onClick={() => toggleOption('downloadPdfs')}
                        >
                          <span className="source-page__toggle-thumb" />
                        </button>
                      </div>
                    </div>

                    <div>
                      <div className="source-page__toggle-row">
                        <div className="source-page__toggle-copy">
                          <p className="source-page__toggle-title">Follow Pagination</p>
                          <p className="source-page__toggle-meta">Traverse all available pages</p>
                        </div>
                        <button
                          className={`source-page__toggle ${toggles.followPagination ? 'source-page__toggle--on' : ''}`.trim()}
                          type="button"
                          onClick={() => toggleOption('followPagination')}
                        >
                          <span className="source-page__toggle-thumb" />
                        </button>
                      </div>

                      <div className="source-page__toggle-row">
                        <div className="source-page__toggle-copy">
                          <p className="source-page__toggle-title">Capture Screenshot</p>
                          <p className="source-page__toggle-meta">Full-page visual evidence</p>
                        </div>
                        <button
                          className={`source-page__toggle ${toggles.captureScreenshot ? 'source-page__toggle--on' : ''}`.trim()}
                          type="button"
                          onClick={() => toggleOption('captureScreenshot')}
                        >
                          <span className="source-page__toggle-thumb" />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div style={{ marginTop: '1.5rem' }}>
                    <div className="source-page__priority-row">
                      <label className="source-page__card-title" style={{ margin: 0 }}>
                        Extraction Priority
                      </label>
                      <span className="source-page__priority-badge">High Priority ({priority.toFixed(1)})</span>
                    </div>
                    <input
                      className="source-page__slider"
                      type="range"
                      min="1"
                      max="10"
                      step="0.5"
                      value={priority}
                      onChange={(event) => setPriority(Number(event.target.value))}
                    />
                  </div>
                </div>
              </section>
            </div>

            <aside className="source-page__preview-column">
              <section className="source-page__card source-page__preview-card">
                <div className="source-page__card-body" style={{ paddingBottom: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
                    <h3 className="source-page__card-title" style={{ marginBottom: 0 }}>
                      <MaterialIcon>monitoring</MaterialIcon>
                      Live Extraction Preview
                    </h3>
                    <span className="source-page__priority-badge">Simulating</span>
                  </div>
                </div>

                <div className="source-page__preview-shell">
                  <div className="source-page__browser-bar">
                    <span className="source-page__browser-dot source-page__browser-dot--red" />
                    <span className="source-page__browser-dot source-page__browser-dot--green" />
                    <span className="source-page__browser-dot source-page__browser-dot--blue" />
                    <div className="source-page__browser-url">{form.sourceUrl || 'No URL provided'}</div>
                  </div>

                  <div className="source-page__preview-content">
                    <div className="source-page__skeleton-line" style={{ width: '68%' }} />
                    <div className="source-page__skeleton-grid">
                      <div className="source-page__skeleton-image">
                        <MaterialIcon>image</MaterialIcon>
                      </div>
                      <div>
                        <div className="source-page__skeleton-line" />
                        <div className="source-page__skeleton-line" style={{ width: '84%' }} />
                        <div className="source-page__skeleton-line" style={{ width: '62%' }} />
                        <div className="source-page__priority-badge" style={{ display: 'inline-flex', marginTop: '0.8rem' }}>
                          {form.listingType}
                        </div>
                      </div>
                    </div>
                    <div className="source-page__skeleton-line" />
                    <div className="source-page__skeleton-line" style={{ width: '80%' }} />

                    <div className="source-page__schema">
                      <p className="source-page__schema-title">Interpreted Key Schema</p>
                      <div className="source-page__schema-row">
                        <span className="source-page__schema-key">asset_name</span>
                        <span className="source-page__schema-value">"{form.sourceName || 'Untitled Source'}"</span>
                      </div>
                      <div className="source-page__schema-row">
                        <span className="source-page__schema-key">location</span>
                        <span className="source-page__schema-value">"{form.city || 'Unknown'}, {form.country || 'Unknown'}"</span>
                      </div>
                      <div className="source-page__schema-row">
                        <span className="source-page__schema-key">listing_type</span>
                        <span className="source-page__schema-value">"{form.listingType}"</span>
                      </div>
                      <div className="source-page__schema-row source-page__schema-row--muted">
                        <span className="source-page__schema-key">requires_session</span>
                        <span className="source-page__schema-value">{String(toggles.useLogin)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <button className="source-page__refresh" type="button" onClick={testExtraction}>
                  Refresh Live Mapping
                </button>
              </section>

              <section className="source-page__card source-page__insight">
                <div className="source-page__card-body">
                  <h4 className="source-page__card-title" style={{ color: '#ffffff', marginBottom: '0.5rem' }}>
                    Technical Insight
                  </h4>
                  <p>
                    This URL behaves like a client-rendered flow. Axiom will likely deploy a headless browser worker,
                    apply {behavior} extraction logic, and schedule {schedule.toLowerCase()} syncs with priority {priority.toFixed(1)}.
                  </p>
                  <div className="source-page__insight-icon">
                    <MaterialIcon>memory</MaterialIcon>
                  </div>
                </div>
              </section>

              <section className="source-page__card">
                <div className="source-page__card-body">
                  <h4 className="source-page__card-title">Status</h4>
                  <p style={{ margin: 0, color: '#44474c', lineHeight: 1.7 }}>{statusText}</p>
                </div>
              </section>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}
