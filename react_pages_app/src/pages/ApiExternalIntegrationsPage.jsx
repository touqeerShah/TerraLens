import { useEffect, useState } from 'react';
import './ApiExternalIntegrationsPage.css';

export const pageMeta = {
  slug: 'api_external_integrations',
  path: '/api_external_integrations',
  label: 'Api External Integrations',
  title: 'Axiom | API & Integrations',
};

const sidebarLinks = [
  { icon: 'dashboard', label: 'Dashboard', href: '#/axiom_main_dashboard' },
  { icon: 'domain', label: 'Properties', href: '#/property_search_filters' },
  { icon: 'analytics', label: 'Analytics', href: '#/axiom_analytics_market_trends' },
  { icon: 'extension', label: 'Integrations', href: '#/api_external_integrations', active: true },
  { icon: 'history', label: 'Run History', href: '#/extraction_job_history' },
  { icon: 'settings', label: 'Workspace Settings', href: '#/workspace_team_settings' },
];

const initialKeys = [
  {
    id: 'production-main',
    name: 'Production Main',
    prefix: 'pk_live_',
    secret: '7K91M4B23X8FQW71H9PLAA42',
    status: 'active',
    lastUsed: '2 minutes ago',
  },
  {
    id: 'staging-environment',
    name: 'Staging Environment',
    prefix: 'pk_test_',
    secret: '4F82TT1A93NLM0QX5DKR8831',
    status: 'unused',
    lastUsed: 'Never',
  },
];

const providerCards = [
  {
    id: 'aws',
    name: 'AWS S3 Bucket',
    meta: 'axiom-prod-assets-01',
    icon: 'cloud_queue',
    connected: true,
  },
  {
    id: 'gcs',
    name: 'Google Storage',
    meta: 'Not connected',
    icon: 'storage',
    connected: false,
  },
];

const developerLinks = [
  { id: 'specs', title: 'Import/Export Specs', icon: 'import_export', hint: 'Schemas and transport contracts' },
  { id: 'reference', title: 'API Reference', icon: 'menu_book', hint: 'REST endpoints and auth headers' },
  { id: 'sdk', title: 'SDK Libraries', icon: 'javascript', hint: 'JavaScript, Python, and CLI tooling' },
];

const healthStats = [
  { id: 'latency', label: 'Latency', icon: 'speed', value: '124', suffix: 'ms', trend: '12% faster than avg', tone: 'good' },
  { id: 'errors', label: 'Error Rate', icon: 'error', value: '0.02', suffix: '%', trend: 'Within threshold', tone: 'good' },
  { id: 'sync', label: 'Sync Status', icon: 'cloud_sync', value: 'Live', suffix: '', trend: 'Last sync: 14s ago', tone: 'neutral' },
];

const engineerAvatar =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBeOYCAei29ioCQa52yC67IJyJbZrqm_cv5g0iO2MPEN-Qq1DzVCAc6dap_POaNQgWiiWDlz150K-7vdRsSfbmss35LIiUqkarrNOn28pPbzI_HNgHxoq8jpXmlDxCDshwqKCWHLIkJkeOjZ5_Y2htLf8crQYs4v3g6KWJAUnPTHW9sW3wge1Ftwr8tvtt9RsaTC1qsBWVbl6l_PQFvim22q3k_cjmEIxjUbcjT2wWnTu8XslTA5tzMLEy2OQeAbFyNnklEPzMo-wc';

function MaterialIcon({ children, filled = false, className = '' }) {
  const style = filled ? { fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" } : undefined;

  return (
    <span className={`material-symbols-outlined ${className}`.trim()} style={style} aria-hidden="true">
      {children}
    </span>
  );
}

function StatusPill({ status }) {
  const config =
    status === 'active'
      ? { className: 'api-pill api-pill--active', label: 'Active' }
      : { className: 'api-pill api-pill--unused', label: 'Unused' };

  return <span className={config.className}>{config.label}</span>;
}

function maskSecret(secret) {
  return '•'.repeat(secret.length);
}

export default function ApiExternalIntegrationsPage() {
  const [searchText, setSearchText] = useState('');
  const [keys, setKeys] = useState(initialKeys);
  const [visibleKeyIds, setVisibleKeyIds] = useState([]);
  const [copiedKeyId, setCopiedKeyId] = useState('');
  const [webhookUrl, setWebhookUrl] = useState('https://api.yourdomain.com/webhooks/axiom-receiver');
  const [retryEnabled, setRetryEnabled] = useState(true);

  useEffect(() => {
    const previousTitle = document.title;
    const previousHtmlClass = document.documentElement.className;
    const previousBodyClass = document.body.className;

    document.title = pageMeta.title;
    document.documentElement.className = 'light';
    document.body.className = 'bg-background font-body text-on-surface';

    return () => {
      document.title = previousTitle;
      document.documentElement.className = previousHtmlClass;
      document.body.className = previousBodyClass;
    };
  }, []);

  useEffect(() => {
    if (!copiedKeyId) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setCopiedKeyId('');
    }, 1800);

    return () => window.clearTimeout(timeoutId);
  }, [copiedKeyId]);

  const normalizedSearch = searchText.trim().toLowerCase();
  const filteredKeys = keys.filter((key) => {
    if (!normalizedSearch) {
      return true;
    }

    return `${key.name} ${key.prefix}`.toLowerCase().includes(normalizedSearch);
  });

  const filteredDeveloperLinks = developerLinks.filter((link) => {
    if (!normalizedSearch) {
      return true;
    }

    return `${link.title} ${link.hint}`.toLowerCase().includes(normalizedSearch);
  });

  function toggleKeyVisibility(keyId) {
    setVisibleKeyIds((current) =>
      current.includes(keyId) ? current.filter((id) => id !== keyId) : [...current, keyId],
    );
  }

  async function copySecret(key) {
    const value = `${key.prefix}${key.secret}`;

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
      }
      setCopiedKeyId(key.id);
    } catch {
      setCopiedKeyId(key.id);
    }
  }

  function createSecretKey() {
    const newKey = {
      id: `generated-${Date.now()}`,
      name: `Partner Sync ${keys.length + 1}`,
      prefix: 'pk_live_',
      secret: Math.random().toString(36).slice(2, 26).toUpperCase(),
      status: 'active',
      lastUsed: 'Just now',
    };

    setKeys((current) => [newKey, ...current]);
  }

  function deleteKey(keyId) {
    setKeys((current) => current.filter((key) => key.id !== keyId));
    setVisibleKeyIds((current) => current.filter((id) => id !== keyId));
  }

  return (
    <div className="api-page">
      <div className="api-page__layout">
        <aside className="api-page__sidebar">
          <div className="api-page__sidebar-inner">
            <div className="api-page__brand">
              <div className="api-page__brand-icon">
                <MaterialIcon filled>architecture</MaterialIcon>
              </div>
              <div>
                <h1 className="api-page__brand-title">Axiom</h1>
                <p className="api-page__eyebrow">Property Intelligence</p>
              </div>
            </div>

            <p className="api-page__sidebar-title">Connectivity</p>
            <nav className="api-page__nav" aria-label="Sidebar navigation">
              {sidebarLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className={`api-page__nav-link ${link.active ? 'api-page__nav-link--active' : ''}`.trim()}
                >
                  <MaterialIcon className="api-page__nav-icon">{link.icon}</MaterialIcon>
                  <span>{link.label}</span>
                </a>
              ))}
            </nav>
          </div>

          <div className="api-page__sidebar-footer">
            <div className="api-page__profile">
              <img className="api-page__avatar" src={engineerAvatar} alt="Marcus Chen" />
              <div>
                <p className="api-page__profile-name">Marcus Chen</p>
                <p className="api-page__profile-role">Admin Access</p>
              </div>
            </div>
          </div>
        </aside>

        <div className="api-page__main">
          <header className="api-page__topbar">
            <label className="api-page__search">
              <MaterialIcon>search</MaterialIcon>
              <input
                type="text"
                value={searchText}
                onChange={(event) => setSearchText(event.target.value)}
                placeholder="Search API logs, keys, or documentation..."
                aria-label="Search API content"
              />
            </label>

            <div className="api-page__topbar-actions">
              <button className="api-page__icon-button" type="button" aria-label="Notifications">
                <MaterialIcon>notifications</MaterialIcon>
              </button>
              <button className="api-page__icon-button" type="button" aria-label="Help">
                <MaterialIcon>help_outline</MaterialIcon>
              </button>
              <div className="api-page__status" aria-label="API operational status">
                <span className="api-page__status-dot" />
                <span>API Status: Operational</span>
              </div>
            </div>
          </header>

          <main className="api-page__content">
            <section className="api-page__hero">
              <h1>Integrations &amp; API</h1>
              <p>
                Build automated workflows and connect your property data ecosystem. Manage
                authentication, webhooks, storage providers, and developer access from one
                operational surface.
              </p>
            </section>

            <div className="api-page__grid">
              <div className="api-page__column">
                <section className="api-card">
                  <div className="api-card__body">
                    <div className="api-card__header">
                      <div>
                        <h2 className="api-card__title">Authentication Keys</h2>
                        <p className="api-card__subtitle">Production and sandbox environments</p>
                      </div>
                      <button className="api-button api-button--primary" type="button" onClick={createSecretKey}>
                        <MaterialIcon>add</MaterialIcon>
                        Create Secret Key
                      </button>
                    </div>

                    <div className="api-key-list">
                      {filteredKeys.length ? (
                        filteredKeys.map((key) => {
                          const isVisible = visibleKeyIds.includes(key.id);
                          const displaySecret = isVisible ? key.secret : maskSecret(key.secret);

                          return (
                            <article key={key.id} className="api-key-item">
                              <div className="api-key-item__left">
                                <div className="api-key-item__name">
                                  <span className="api-key-item__label">{key.name}</span>
                                  <StatusPill status={key.status} />
                                  {copiedKeyId === key.id ? (
                                    <span className="api-pill api-pill--healthy">Copied</span>
                                  ) : null}
                                </div>

                                <div className="api-key-item__secret">
                                  <span>{key.prefix}</span>
                                  <span className="api-key-item__mask">{displaySecret}</span>
                                  <span className="api-inline-actions">
                                    <button
                                      className="api-inline-icon"
                                      type="button"
                                      onClick={() => toggleKeyVisibility(key.id)}
                                      aria-label={isVisible ? 'Hide secret' : 'Show secret'}
                                    >
                                      <MaterialIcon>{isVisible ? 'visibility_off' : 'visibility'}</MaterialIcon>
                                    </button>
                                    <button
                                      className="api-inline-icon"
                                      type="button"
                                      onClick={() => copySecret(key)}
                                      aria-label="Copy secret"
                                    >
                                      <MaterialIcon>content_copy</MaterialIcon>
                                    </button>
                                  </span>
                                </div>
                              </div>

                              <div className="api-key-item__meta">
                                <p className="api-key-item__meta-label">Last Used</p>
                                <p className="api-key-item__meta-value">{key.lastUsed}</p>
                                {key.status !== 'active' ? (
                                  <button
                                    className="api-inline-icon api-inline-icon--danger"
                                    type="button"
                                    onClick={() => deleteKey(key.id)}
                                    aria-label={`Delete ${key.name}`}
                                  >
                                    <MaterialIcon>delete</MaterialIcon>
                                  </button>
                                ) : null}
                              </div>
                            </article>
                          );
                        })
                      ) : (
                        <div className="api-empty">No keys match the current search.</div>
                      )}
                    </div>
                  </div>
                </section>

                <section className="api-card">
                  <div className="api-card__body">
                    <div className="api-card__header">
                      <div>
                        <h2 className="api-card__title">Webhooks</h2>
                        <p className="api-card__subtitle">Real-time property data stream endpoints</p>
                      </div>
                    </div>

                    <label className="api-field">
                      <span className="api-field__label">Primary Endpoint URL</span>
                      <MaterialIcon>link</MaterialIcon>
                      <input
                        className="api-field__input"
                        type="text"
                        value={webhookUrl}
                        onChange={(event) => setWebhookUrl(event.target.value)}
                      />
                      <button className="api-button api-button--secondary" type="button">
                        Edit
                      </button>
                    </label>

                    <div className="api-toggle-row">
                      <div>
                        <p className="api-key-item__label">Retry Strategy</p>
                        <p className="api-card__subtitle">Exponential backoff with up to 12 retries</p>
                      </div>
                      <button
                        className={`api-toggle ${retryEnabled ? 'api-toggle--enabled' : ''}`.trim()}
                        type="button"
                        onClick={() => setRetryEnabled((current) => !current)}
                        aria-pressed={retryEnabled}
                        aria-label="Toggle retry strategy"
                      >
                        <span className="api-toggle__thumb" />
                      </button>
                    </div>
                  </div>
                </section>

                <section>
                  <div className="api-card__header">
                    <div>
                      <h2 className="api-card__title">Integration Health</h2>
                    </div>
                  </div>

                  <div className="api-health-grid">
                    {healthStats.map((stat) => (
                      <article key={stat.id} className="api-health-card">
                        <p className="api-health-card__label">
                          <MaterialIcon filled={stat.id !== 'errors'}>{stat.icon}</MaterialIcon>
                          <span>{stat.label}</span>
                        </p>
                        <p className="api-health-card__value">
                          {stat.value}
                          {stat.suffix ? <span className="api-health-card__suffix">{stat.suffix}</span> : null}
                        </p>
                        <p
                          className={`api-health-card__trend ${
                            stat.tone === 'good' ? 'api-health-card__trend--good' : 'api-health-card__trend--neutral'
                          }`.trim()}
                        >
                          {stat.trend}
                        </p>
                      </article>
                    ))}
                  </div>
                </section>

                <footer className="api-footer">
                  <div className="api-footer__content">
                    <div className="api-footer__icon">
                      <MaterialIcon>terminal</MaterialIcon>
                    </div>
                    <div>
                      <p className="api-footer__title">Need a custom integration?</p>
                      <p className="api-footer__text">
                        Our engineering team can help with bespoke data pipes and source-specific ingestion.
                      </p>
                    </div>
                  </div>
                  <button className="api-button api-button--secondary" type="button">
                    Contact Engineering Support
                  </button>
                </footer>
              </div>

              <aside className="api-page__column">
                <section>
                  <p className="api-card__section-label">Storage Providers</p>
                  <div className="api-provider-list">
                    {providerCards.map((provider) => (
                      <article
                        key={provider.id}
                        className={`api-provider ${provider.connected ? 'api-provider--connected' : 'api-provider--inactive'}`.trim()}
                      >
                        <div className="api-provider__icon">
                          <MaterialIcon filled={provider.connected}>{provider.icon}</MaterialIcon>
                        </div>
                        <div style={{ flex: 1 }}>
                          <p className="api-provider__name">{provider.name}</p>
                          <p className="api-provider__meta">{provider.meta}</p>
                        </div>
                        {provider.connected ? (
                          <span className="api-pill api-pill--healthy">Connected</span>
                        ) : (
                          <button className="api-button api-button--secondary" type="button">
                            Connect
                          </button>
                        )}
                      </article>
                    ))}
                  </div>
                </section>

                <section className="api-card api-card--dark">
                  <div className="api-card__body">
                    <div className="api-card__header">
                      <div>
                        <h2 className="api-card__title api-card__title--light">Developer Hub</h2>
                        <p className="api-card__subtitle api-card__subtitle--light">
                          Reference materials for integrations and automation.
                        </p>
                      </div>
                    </div>

                    <div className="api-link-list">
                      {filteredDeveloperLinks.length ? (
                        filteredDeveloperLinks.map((link) => (
                          <a key={link.id} className="api-link" href="#/help_documentation_center">
                            <div className="api-link__meta">
                              <MaterialIcon className="api-card__subtitle--light">{link.icon}</MaterialIcon>
                              <div>
                                <div>{link.title}</div>
                                <div className="api-card__subtitle api-card__subtitle--light">{link.hint}</div>
                              </div>
                            </div>
                            <MaterialIcon className="api-link__arrow">arrow_forward_ios</MaterialIcon>
                          </a>
                        ))
                      ) : (
                        <div className="api-empty">No developer resources match the current search.</div>
                      )}
                    </div>
                  </div>
                </section>

                <section className="api-card">
                  <div className="api-card__body">
                    <p className="api-card__section-label">API Usage (Monthly)</p>
                    <div className="api-usage__row">
                      <span>Requests</span>
                      <span>14,202 / 50,000</span>
                    </div>
                    <div className="api-progress" aria-hidden="true">
                      <div className="api-progress__value" style={{ width: '28%' }} />
                    </div>
                    <p className="api-note">
                      Your plan resets in 8 days. High-volume usage may require a plan upgrade.
                    </p>
                  </div>
                </section>
              </aside>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
