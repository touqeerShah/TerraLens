export function normalizePath(path) {
  if (!path) {
    return '/';
  }

  return path.startsWith('/') ? path : `/${path}`;
}

export function hrefForPath(path) {
  return `#${normalizePath(path)}`;
}

export function navigateToPath(path) {
  window.location.hash = normalizePath(path);
}
