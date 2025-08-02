// src/scripts/article-preview.ts

import { createPopper, type Instance } from '@popperjs/core';

const SHOW_DELAY = 500;
const HIDE_DELAY = 200;

const cache = new Map<string, HTMLElement | null>();

const fetchData = async (href: string, qs = 'article') => {
  if (cache.has(href)) {
    return cache.get(href);
  }

  const res = await fetch(href);

  const html = await res.text();
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const article = doc.querySelector<HTMLElement>(qs);

  cache.set(href, article);

  return article;
}

function attachPreview(link: HTMLAnchorElement) {
  let popperInstance: Instance|null;
  let previewEl: HTMLDivElement | null = null;
  let showTimeout: number | null = null;
  let hideTimeout: number | null = null;
  let checkInterval: ReturnType<typeof window.setInterval> | null = null;

  const href = link.getAttribute('href');

  if (!href) {
    return;
  }

  const hidePreview = () => {
    if (previewEl) {
      previewEl.remove();
      previewEl = null;
    }
    popperInstance?.destroy?.();
    popperInstance = null;

    if (checkInterval) {
      clearInterval(checkInterval);
      checkInterval = null;
    }
  };

  const scheduleHide = () => {
    if (hideTimeout) clearTimeout(hideTimeout);
    hideTimeout = window.setTimeout(() => {
      if (
        previewEl &&
        !link.matches(':hover') &&
        !previewEl.matches(':hover')
      ) {
        hidePreview();
      }
    }, HIDE_DELAY);
  };

  const cancelHide = () => {
    if (hideTimeout) clearTimeout(hideTimeout);
  };

  const showPreview = (article: HTMLElement) => {
    previewEl = document.createElement('div');
    previewEl.className = 'article-preview';
    previewEl.appendChild(article.cloneNode(true));
    document.body.appendChild(previewEl);

    popperInstance = createPopper(link, previewEl, {
      placement: 'bottom-end',
      modifiers: [
        {
          name: 'flip',
          options: {
            fallbackPlacements: ['right', 'bottom', 'left'],
          },
        },
        { 
          name: 'offset', 
          options: { offset: [0, 8] } 
        },
      ],
    });

    previewEl.addEventListener('pointerenter', cancelHide);
    previewEl.addEventListener('pointerleave', scheduleHide);

    checkInterval = setInterval(() => {
      if (
        previewEl &&
        !link.matches(':hover') &&
        !previewEl.matches(':hover')
      ) {
        hidePreview();
      }
    }, 500);
  }

  const cancelShow = () => {
    if (showTimeout) clearTimeout(showTimeout);
  };

  link.addEventListener('pointerenter', async () => {
    cancelHide();
    fetchData(href).then(article => {
      if (!showTimeout && link.matches(':hover') && !previewEl && article) {
        showPreview(article);
      }
    });

    showTimeout = window.setTimeout(() => {
      if (!previewEl && link.matches(':hover') && cache.get(href)) {
        showPreview(cache.get(href) as HTMLElement);
      }
    }, SHOW_DELAY);
  });

  link.addEventListener('pointerleave', () => {
    cancelShow();
    scheduleHide();
  });
}


export function initArticlePreviews() {
  const links = document.querySelectorAll<HTMLAnchorElement>('a.article-wikilink');
  links.forEach(attachPreview);
}
