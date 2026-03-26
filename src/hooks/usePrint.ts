'use client';

import { useCallback } from 'react';

export type PrintTarget = { id: string } | { className: string };

export interface UsePrintReturn {
  print: (target: PrintTarget) => boolean;
}

export function usePrint(): UsePrintReturn {
  const print = useCallback((target: PrintTarget): boolean => {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return false;
    }

    const elements =
      'id' in target
        ? Array.from(document.querySelectorAll<HTMLElement>(`#${CSS.escape(target.id)}`))
        : Array.from(
            document.querySelectorAll<HTMLElement>(`.${CSS.escape(target.className)}`)
          );

    if (elements.length === 0) {
      return false;
    }

    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    document.body.appendChild(iframe);

    const printWindow = iframe.contentWindow;
    if (!printWindow) {
      document.body.removeChild(iframe);
      return false;
    }

    const styleTags = Array.from(document.querySelectorAll('style'))
      .map((style) => style.outerHTML)
      .join('\n');

    const linkTags = Array.from(
      document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]')
    )
      .map((link) => link.outerHTML)
      .join('\n');

    const bodyContent = elements.map((element) => element.innerHTML).join('\n');

    printWindow.document.open();
    printWindow.document.write(
      `<!doctype html>
<html lang="he" dir="rtl">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    ${styleTags}
    ${linkTags}
  </head>
  <body style="padding-top:3em">
    ${bodyContent}
  </body>
</html>`
    );
    printWindow.document.close();

    printWindow.onafterprint = () => {
      if (iframe.parentNode) {
        iframe.parentNode.removeChild(iframe);
      }
    };

    printWindow.focus();
    printWindow.print();

    return true;
  }, []);

  return { print };
}
