function RelationList({ title, routes, tone = 'default' }) {
  if (!routes.length) {
    return null;
  }

  const toneClass =
    tone === 'primary'
      ? 'bg-primary text-white hover:bg-primary-container'
      : 'bg-surface-container-low text-on-surface hover:bg-surface-container-high';

  return (
    <div>
      <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.24em] text-on-surface-variant">
        {title}
      </p>
      <div className="flex flex-wrap gap-2">
        {routes.map((route) => (
          <a
            key={route.path}
            href={`#${route.path}`}
            className={`rounded-full px-3 py-2 text-xs font-semibold transition-colors ${toneClass}`}
          >
            {route.label}
          </a>
        ))}
      </div>
    </div>
  );
}

export default function PageRelationshipDock({ route }) {
  if (!route || route.path === '/') {
    return null;
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[100] px-3 pb-3 md:px-6 md:pb-6">
      <div className="mx-auto max-w-6xl rounded-[28px] bg-white/88 shadow-[0px_24px_48px_rgba(25,28,30,0.16)] backdrop-blur-xl pointer-events-auto">
        <div className="grid gap-4 px-4 py-4 md:grid-cols-[1.2fr,1fr,1fr] md:px-6 md:py-5">
          <div>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <a
                href="#/"
                className="rounded-full bg-primary px-3 py-2 text-xs font-bold uppercase tracking-[0.2em] text-white transition-colors hover:bg-primary-container"
              >
                All Pages
              </a>
              <span className="rounded-full bg-surface-container-low px-3 py-2 text-[10px] font-bold uppercase tracking-[0.24em] text-secondary">
                {route.section}
              </span>
            </div>
            <h2 className="font-headline text-xl font-extrabold tracking-tight text-primary">
              {route.label}
            </h2>
            <p className="mt-2 text-sm leading-6 text-on-surface-variant">{route.description}</p>
          </div>

          <RelationList title="Leads To" routes={route.outgoingRoutes || []} tone="primary" />
          <RelationList title="Connected From" routes={route.incomingRoutes || []} />
        </div>
      </div>
    </div>
  );
}
