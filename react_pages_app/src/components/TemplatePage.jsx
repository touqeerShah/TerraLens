import { useEffect } from 'react';

function syncTemplateStyle(styles) {
  const existing = document.querySelector('style[data-stitch-template-style]');

  if (existing) {
    existing.remove();
  }

  if (!styles) {
    return null;
  }

  const styleTag = document.createElement('style');
  styleTag.dataset.stitchTemplateStyle = 'true';
  styleTag.textContent = styles;
  document.head.appendChild(styleTag);
  return styleTag;
}

export default function TemplatePage({
  title,
  htmlClass = '',
  bodyClass = '',
  bodyHtml,
  styles = '',
}) {
  useEffect(() => {
    const htmlElement = document.documentElement;
    const bodyElement = document.body;
    const previousHtmlClass = htmlElement.className;
    const previousBodyClass = bodyElement.className;
    const previousTitle = document.title;
    const styleTag = syncTemplateStyle(styles);

    if (title) {
      document.title = title;
    }

    htmlElement.className = htmlClass;
    bodyElement.className = bodyClass;

    if (window.tailwind?.refresh) {
      window.tailwind.refresh();
    }

    return () => {
      document.title = previousTitle;
      htmlElement.className = previousHtmlClass;
      bodyElement.className = previousBodyClass;

      if (styleTag) {
        styleTag.remove();
      }
    };
  }, [bodyClass, htmlClass, styles, title]);

  return (
    <div
      onSubmitCapture={(event) => event.preventDefault()}
      dangerouslySetInnerHTML={{ __html: bodyHtml }}
    />
  );
}
