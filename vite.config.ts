import { defineConfig, type ViteDevServer } from 'vite'
import react from '@vitejs/plugin-react'
import type { IncomingMessage, ServerResponse } from 'http';
import fs from 'fs';
import path from 'path';

const wasmMiddleware = () => {
  return {
    name: 'wasm-middleware',
    configureServer(server: ViteDevServer) {
      server.middlewares.use((req: IncomingMessage, res: ServerResponse, next: () => void) => {
        if (req.url && req.url.endsWith('.wasm')) {
          const wasmPath = path.join(__dirname, 'node_modules/@sqlite.org/sqlite-wasm/dist', path.basename(req.url));
          const wasmFile = fs.readFileSync(wasmPath);
          res.setHeader('Content-Type', 'application/wasm');
          res.end(wasmFile);
          return;
        }
        next();
      });
    },
  };
};

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), wasmMiddleware()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom', 'react-router'],
          bootstrap: ['bootstrap', 'react-bootstrap'],
          drizzle: ['drizzle-orm', '@whitstable-software/sqlite-opfs', '@sqlite.org/sqlite-wasm'],
        },
      },
    },
  },
  server: {
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "require-corp",
    },
  },
  optimizeDeps: {
    exclude: ["@sqlite.org/sqlite-wasm"],
  }
})
