import { mkdir, readdir, readFile, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(__dirname, '..');
const templatesRoot = path.resolve(appRoot, '../stitch_property');
const pagesOutputDir = path.resolve(appRoot, 'src/pages');
const routesOutputFile = path.resolve(appRoot, 'src/routes.jsx');

function toPascalCase(value) {
  return value
    .split(/[_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
}

function toLabel(slug) {
  return slug
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function extractFirstMatch(input, pattern, fallback = '') {
  const match = input.match(pattern);
  return match ? match[1].trim() : fallback;
}

function escapeJs(value) {
  return JSON.stringify(value);
}

async function generate() {
  await mkdir(pagesOutputDir, { recursive: true });
  const existingPageFiles = await readdir(pagesOutputDir);

  for (const fileName of existingPageFiles) {
    if (!fileName.endsWith('.jsx') || fileName === 'HomePage.jsx') {
      continue;
    }

    await unlink(path.join(pagesOutputDir, fileName));
  }

  const directoryEntries = await readdir(templatesRoot, { withFileTypes: true });
  const pageEntries = [];

  for (const entry of directoryEntries) {
    if (!entry.isDirectory()) {
      continue;
    }

    const htmlFile = path.join(templatesRoot, entry.name, 'code.html');

    let html;
    try {
      html = await readFile(htmlFile, 'utf8');
    } catch {
      continue;
    }

    const title = extractFirstMatch(html, /<title>([\s\S]*?)<\/title>/i, entry.name);
    const htmlClass = extractFirstMatch(html, /<html[^>]*class="([^"]*)"/i, '');
    const bodyClass = extractFirstMatch(html, /<body[^>]*class="([^"]*)"/i, '');
    const bodyHtml = extractFirstMatch(html, /<body[^>]*>([\s\S]*?)<\/body>/i, '');
    const styles = [...html.matchAll(/<style>([\s\S]*?)<\/style>/gi)]
      .map((match) => match[1].trim())
      .filter(Boolean)
      .join('\n\n');

    const slug = entry.name;
    const baseComponentName = toPascalCase(slug);
    const componentName = baseComponentName.endsWith('Page')
      ? baseComponentName
      : `${baseComponentName}Page`;
    const fileName = `${componentName}.jsx`;
    const label = toLabel(slug);
    const routePath = `/${slug}`;
    const fileContents = `import TemplatePage from '../components/TemplatePage';

export const pageMeta = {
  slug: ${escapeJs(slug)},
  path: ${escapeJs(routePath)},
  label: ${escapeJs(label)},
  title: ${escapeJs(title)},
};

const page = {
  title: ${escapeJs(title)},
  htmlClass: ${escapeJs(htmlClass)},
  bodyClass: ${escapeJs(bodyClass)},
  styles: ${escapeJs(styles)},
  bodyHtml: ${escapeJs(bodyHtml)},
};

export default function ${componentName}() {
  return <TemplatePage {...page} />;
}
`;

    await writeFile(path.join(pagesOutputDir, fileName), fileContents);
    pageEntries.push({ componentName, fileName, label, routePath, slug, title });
  }

  pageEntries.sort((left, right) => left.slug.localeCompare(right.slug));

  const importLines = pageEntries
    .map(
      ({ componentName }) =>
        `import ${componentName}, { pageMeta as ${componentName}Meta } from './pages/${componentName}';`,
    )
    .join('\n');

  const routeLines = pageEntries
    .map(
      ({ componentName }) =>
        `  { ...${componentName}Meta, component: ${componentName} },`,
    )
    .join('\n');

  const routesFileContents = `${importLines}

export const routes = [
  { path: '/', slug: 'home', label: 'Template Directory', title: 'Stitch Property React Pages' },
${routeLines}
];
`;

  await writeFile(routesOutputFile, routesFileContents);
  console.log(`Generated ${pageEntries.length} React pages.`);
}

generate().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
