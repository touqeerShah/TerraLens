import { useEffect, useMemo, useState } from 'react';
import './HomePage.css';

function groupLabelText(section) {
  switch (section) {
    case 'Public':
      return 'Entry pages and authentication flow';
    case 'Main':
      return 'Primary dashboard and top-level workspace hub';
    case 'Explore':
      return 'Search, map, analytics, and chat discovery flows';
    case 'Data':
      return 'Property, document, report, and watchlist detail views';
    case 'Operations':
      return 'Monitoring, repair, source operations, and review workflows';
    case 'Input':
      return 'Data intake, schema definition, and new source creation';
    case 'Admin':
      return 'Workspace administration, permissions, integrations, and help';
    default:
      return 'Additional converted pages';
  }
}

export default function HomePage({ notFoundPath, routes, groupedRoutes = [] }) {
  const [query, setQuery] = useState('');
  const pageRoutes = routes.filter((route) => route.path !== '/');
  const filteredGroups = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    if (!normalized) {
      return groupedRoutes;
    }

    return groupedRoutes
      .map((group) => ({
        ...group,
        routes: group.routes.filter((route) =>
          `${route.slug} ${route.label} ${route.title} ${route.description || ''}`.toLowerCase().includes(normalized),
        ),
      }))
      .filter((group) => group.routes.length > 0);
  }, [groupedRoutes, query]);

  useEffect(() => {
    const previousTitle = document.title;
    const previousHtmlClass = document.documentElement.className;
    const previousBodyClass = document.body.className;

    document.title = 'Axiom | Converted Page Directory';
    document.documentElement.className = 'light';
    document.body.className = 'bg-surface text-on-surface min-h-screen';

    return () => {
      document.title = previousTitle;
      document.documentElement.className = previousHtmlClass;
      document.body.className = previousBodyClass;
    };
  }, []);

  return (
    <main className="home-page">
      <section className="home-page__container">
        <div className="home-page__hero">
          <p className="home-page__eyebrow">Stitch Property</p>
          <h1>
            React page conversions for the HTML templates
          </h1>
          <p>
            Each page below is routed from the original template folder and rendered inside a shared
            React wrapper. Navigation uses hash routes, so you can open any page directly with a URL
            like <code>#/login</code>.
          </p>
          <label className="home-page__search">
            <span className="material-symbols-outlined">search</span>
            <input
              type="text"
              placeholder="Search converted pages..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
        </div>

        {notFoundPath ? (
          <div className="home-page__notice">
            <p>
              No converted page exists for <span className="font-mono">{notFoundPath}</span>.
            </p>
          </div>
        ) : null}

        <div className="home-page__summary">
          <p className="home-page__eyebrow">Relationship Graph</p>
          <p>
            Pages are now grouped using the flow in
            <code>doc/page_relationship.md</code>
            . Open any page to see its connected destinations and the pages that lead into it.
          </p>
          <strong>Total converted pages: {pageRoutes.length}</strong>
        </div>

        <div className="home-page__groups">
          {filteredGroups.map((group) => (
            <section key={group.section}>
              <div className="home-page__group-head">
                <div>
                  <p className="home-page__eyebrow">{group.section}</p>
                  <h2>
                    {group.section} Pages
                  </h2>
                </div>
                <p>{groupLabelText(group.section)}</p>
              </div>

              <div className="home-page__grid">
                {group.routes.map((route) => (
                  <a
                    key={route.path}
                    href={`#${route.path}`}
                    className="home-page__card"
                  >
                    <div className="home-page__card-head">
                      <p className="home-page__eyebrow">{route.slug.replaceAll('_', ' ')}</p>
                      <span>
                        {route.relatedRoutes?.length || 0} links
                      </span>
                    </div>
                    <h3>{route.label}</h3>
                    <p>{route.description || route.title}</p>
                    <p className="home-page__card-meta">
                      Leads to
                      <span>
                        {route.outgoingRoutes?.length || 0}
                      </span>
                      pages and is linked from
                      <span>
                        {route.incomingRoutes?.length || 0}
                      </span>
                      .
                    </p>
                    <p className="home-page__card-cta">Open page</p>
                  </a>
                ))}
              </div>
            </section>
          ))}
        </div>
      </section>
    </main>
  );
}
