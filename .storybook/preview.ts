// Global preview configuration for Storybook (HTML)
import { initialize, mswDecorator } from 'msw-storybook-addon';
import type { StoryContext, StoryFn } from '@storybook/html';
import { http, HttpResponse } from 'msw';
import { withThemeByClassName } from '@storybook/addon-themes';

// Initialize MSW
initialize({ onUnhandledRequest: 'bypass' });

// Provide default handlers so stories render without a backend
export const handlers = [
  // Paytable mirrors dist-publish/index.json when present
  http.get('/api/paytable', async () => {
    try {
      const r = await fetch('/publish/index.json');
      if (r.ok) {
        const data = await r.json();
        return HttpResponse.json(data, { status: 200 });
      }
    } catch {}
    // Fallback minimal shape expected by UI
    return HttpResponse.json({ modes: [{ name: 'base', cost: 1, events: 'books_base.jsonl.zst', weights: 'lookUpTable_base_0.csv' }] }, { status: 200 });
  }),
  // Spin returns a simple deterministic stub
  http.post('/api/spin', async ({ request }) => {
    let bet = 1;
    try {
      const body: any = await request.json();
      const n = Number(body?.bet);
      if (Number.isFinite(n) && n > 0) bet = Math.floor(n);
    } catch {}
    // Minimal event-like payload the app can consume
    const result = {
      bet,
      totalWin: Math.round((Math.random() < 0.25 ? bet * (2 + Math.floor(Math.random() * 5)) : 0) * 100) / 100,
      wins: [],
      steps: [],
    };
    return HttpResponse.json({ ok: true, result }, { status: 200 });
  }),
  // Bonus buy placeholder
  http.post('/api/buy', async () => {
    return HttpResponse.json({ ok: true, started: true }, { status: 200 });
  }),
];

// Inject theme CSS once (class-based themes)
(() => {
  const id = 'pm-theme-styles';
  if (typeof document !== 'undefined' && !document.getElementById(id)) {
    const style = document.createElement('style');
    style.id = id;
    style.textContent = `
    /* Light */
    body.theme-light { background: #f7fafc; color: #0b1220; }
    body.theme-light .pm-grid-wrap { background: #f9fafb; color: #0b1220; }
    body.theme-light { --cell-bg: #ffffff; --cell-border: #d1d5db; --win-color: #2563eb; }
    /* Dark */
    body.theme-dark { background: #0b1220; color: #e5e7eb; }
    body.theme-dark .pm-grid-wrap { background: #0b0f1a; color: #e5e7eb; }
    body.theme-dark { --cell-bg: #0f172a; --cell-border: #223; --win-color: #a78bfa; }
  /* Removed Pokédex theme */
    `;
    document.head.appendChild(style);
  }
})();

// Apply MSW and Theme decorators globally
export const decorators = [
  mswDecorator,
  withThemeByClassName({
    themes: { Light: 'theme-light', Dark: 'theme-dark' },
    defaultTheme: 'Dark',
  }),
];

export const parameters = {
  layout: 'fullscreen',
  controls: { expanded: true },
  a11y: { disable: false },
  themes: {
    default: 'Dark',
    list: [
      { name: 'Light', class: 'theme-light', color: '#f7fafc' },
      { name: 'Dark', class: 'theme-dark', color: '#0b1220' },
    ],
  },
};

// Themes addon configuration: toggles body classes and variables
export const globalTypes = {
  theme: {
    description: 'Global theme for components',
    defaultValue: 'dark',
    toolbar: {
      icon: 'mirror',
      items: [
        { value: 'light', title: 'Light' },
        { value: 'dark', title: 'Dark' },
      ],
      dynamicTitle: true,
    },
  },
};

// (Theme handled by addon-themes decorator above)
