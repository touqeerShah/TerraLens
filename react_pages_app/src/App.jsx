import { useEffect, useState } from 'react';
import PageRelationshipDock from './components/PageRelationshipDock';
import HomePage from './pages/HomePage';
import { enrichRoutesWithGraph } from './pageGraph';
import { routes } from './routes';

function getCurrentPath() {
  const rawHash = window.location.hash.replace(/^#/, '');

  if (!rawHash) {
    return '/';
  }

  return rawHash.startsWith('/') ? rawHash : `/${rawHash}`;
}

export default function App() {
  const [path, setPath] = useState(getCurrentPath);
  const { routes: enrichedRoutes, groupedRoutes } = enrichRoutesWithGraph(routes);

  useEffect(() => {
    const onHashChange = () => {
      setPath(getCurrentPath());
    };

    window.addEventListener('hashchange', onHashChange);

    return () => {
      window.removeEventListener('hashchange', onHashChange);
    };
  }, []);

  const route = enrichedRoutes.find((entry) => entry.path === path);

  if (!route) {
    return <HomePage notFoundPath={path} routes={enrichedRoutes} groupedRoutes={groupedRoutes} />;
  }

  if (path === '/') {
    return <HomePage routes={enrichedRoutes} groupedRoutes={groupedRoutes} />;
  }

  const Page = route.component;
  return (
    <>
      <Page />
      <PageRelationshipDock route={route} />
    </>
  );
}
