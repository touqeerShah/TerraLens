import { useEffect, useMemo, useState } from 'react';
import './HelpDocumentationCenterPage.css';

export const pageMeta = {
  slug: 'help_documentation_center',
  path: '/help_documentation_center',
  label: 'Help Documentation Center',
  title: 'Axiom | Help & Documentation',
};

const faqGroups = {
  Technical: [
    'How often is property data updated?',
    'Can I export reports to PDF or Excel?',
    "What is the 'Agent Chat' limit?",
    'Managing API integration keys',
  ],
  Billing: ['How is workspace billing calculated?', 'Can I add seats mid-cycle?'],
  General: ['How do I share a workspace with my team?', 'Are custom map overlays supported?'],
};

const resources = [
  {
    id: 'sources',
    title: 'Getting Started: Adding Sources',
    description: 'Learn how to connect MLS feeds, public records, and custom URLs to your workspace.',
    links: ['Configure your first data source', 'Template mapping for custom schemas'],
  },
  {
    id: 'features',
    title: 'Key Features',
    description: 'Explore maps, agent chat, and monitoring workflows across the platform.',
    links: ['Interactive Map', 'Agent Chat'],
  },
  {
    id: 'troubleshoot',
    title: 'Reviewing Failures',
    description: 'Resolve schema mismatches, timeouts, and missing selectors quickly.',
    links: ['Troubleshoot now'],
  },
];

function MaterialIcon({ children, filled = false }) {
  const style = filled ? { fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" } : undefined;
  return (
    <span className="material-symbols-outlined" style={style}>
      {children}
    </span>
  );
}

export default function HelpDocumentationCenterPage() {
  const [search, setSearch] = useState('');
  const [activeFaqGroup, setActiveFaqGroup] = useState('Technical');
  const [openFaq, setOpenFaq] = useState(faqGroups.Technical[0]);

  useEffect(() => {
    const previousTitle = document.title;
    const previousHtmlClass = document.documentElement.className;
    const previousBodyClass = document.body.className;

    document.title = pageMeta.title;
    document.documentElement.className = 'light';
    document.body.className = 'bg-surface text-on-surface min-h-screen';

    return () => {
      document.title = previousTitle;
      document.documentElement.className = previousHtmlClass;
      document.body.className = previousBodyClass;
    };
  }, []);

  const filteredResources = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return resources;
    return resources.filter((item) => `${item.title} ${item.description} ${item.links.join(' ')}`.toLowerCase().includes(q));
  }, [search]);

  const activeFaqs = faqGroups[activeFaqGroup];

  return (
    <div className="help-page">
      <aside className="help-page__sidebar">
        <div className="help-page__brand">
          <div className="help-page__brand-mark">
            <MaterialIcon filled>domain</MaterialIcon>
          </div>
          <div>
            <h1>Axiom</h1>
            <p>Property Intelligence</p>
          </div>
        </div>

        <nav className="help-page__nav">
          <a href="#/axiom_main_dashboard">Dashboard</a>
          <a href="#/property_search_filters">Search</a>
          <a href="#/agent_intelligence_chat">Agent Chat</a>
          <a href="#/help_documentation_center" data-active="true">
            Help &amp; Documentation
          </a>
          <a href="#/extraction_job_history">Run History</a>
          <a href="#/workspace_team_settings">Workspace Settings</a>
        </nav>

        <div className="help-page__support-card">
          <p>Need personal assistance?</p>
          <button type="button">Contact Agent</button>
        </div>
      </aside>

      <div className="help-page__main">
        <header className="help-page__topbar">
          <label className="help-page__search">
            <MaterialIcon>search</MaterialIcon>
            <input
              type="text"
              placeholder="Search documentation, guides, or FAQs..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>
        </header>

        <main className="help-page__content">
          <section className="help-page__hero">
            <h1>Knowledge Base</h1>
            <p>
              Master the Axiom platform with guides, technical documentation, and expert support for
              property intelligence workflows.
            </p>
          </section>

          <section className="help-page__resource-grid">
            {filteredResources.map((resource, index) => (
              <article key={resource.id} className={`help-page__resource-card help-page__resource-card--${index + 1}`.trim()}>
                <h2>{resource.title}</h2>
                <p>{resource.description}</p>
                <div className="help-page__resource-links">
                  {resource.links.map((link) => (
                    <a key={link} href="#/add_new_source_url">
                      {link}
                      <MaterialIcon>arrow_forward</MaterialIcon>
                    </a>
                  ))}
                </div>
              </article>
            ))}
          </section>

          <section className="help-page__faq">
            <div className="help-page__faq-head">
              <h2>Frequently Asked Questions</h2>
              <div className="help-page__chips">
                {Object.keys(faqGroups).map((group) => (
                  <button
                    key={group}
                    type="button"
                    data-active={activeFaqGroup === group}
                    onClick={() => {
                      setActiveFaqGroup(group);
                      setOpenFaq(faqGroups[group][0]);
                    }}
                  >
                    {group}
                  </button>
                ))}
              </div>
            </div>

            <div className="help-page__faq-list">
              {activeFaqs.map((question) => (
                <button
                  key={question}
                  type="button"
                  className="help-page__faq-item"
                  data-open={openFaq === question}
                  onClick={() => setOpenFaq((current) => (current === question ? '' : question))}
                >
                  <div>
                    <strong>{question}</strong>
                    {openFaq === question ? (
                      <p>
                        This guide walks through the exact workflow in Axiom, including where to find
                        the related settings, exports, and operational safeguards.
                      </p>
                    ) : null}
                  </div>
                  <MaterialIcon>{openFaq === question ? 'remove' : 'add'}</MaterialIcon>
                </button>
              ))}
            </div>
          </section>

          <section className="help-page__cta">
            <h2>Still haven&apos;t found what you&apos;re looking for?</h2>
            <p>Our support team is available to help optimize your workspace and resolve edge cases.</p>
            <div>
              <button type="button">Submit a Ticket</button>
              <button type="button" className="help-page__secondary-button">
                Documentation PDF
              </button>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
