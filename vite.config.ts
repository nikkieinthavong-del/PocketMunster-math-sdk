import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Dev-only helper to optionally silence unknown same-origin /api/* requests
// This helps avoid noisy 404/400/412 logs from external/injected scripts during local runs.
// Enable by setting env var VITE_SILENCE_UNKNOWN_API=1 before starting dev/preview.
function silenceUnknownApi() {
  return {
    name: 'silence-unknown-api',
    configureServer(server: any) {
      if (!process.env.VITE_SILENCE_UNKNOWN_API) return;
      server.middlewares.use((req: any, res: any, next: any) => {
        try {
          const url: string = req.url || '';
          if (url.startsWith('/api/')) {
            res.statusCode = 204;
            res.setHeader('x-silenced-by', 'silence-unknown-api');
            res.end();
            return;
          }
        } catch {}
        next();
      });
    },
    configurePreviewServer(server: any) {
      if (!process.env.VITE_SILENCE_UNKNOWN_API) return;
      server.middlewares.use((req: any, res: any, next: any) => {
        try {
          const url: string = req.url || '';
          if (url.startsWith('/api/')) {
            res.statusCode = 204;
            res.setHeader('x-silenced-by', 'silence-unknown-api');
            res.end();
            return;
          }
        } catch {}
        next();
      });
    },
  } as const;
}

export default defineConfig({
  root: 'src/web',
  plugins: [react(), silenceUnknownApi()],
  server: { port: 3000 },
  preview: { port: 3000 },
  build: {
    outDir: '../../dist-web',
    emptyOutDir: true,
    target: 'es2020',
  },
});