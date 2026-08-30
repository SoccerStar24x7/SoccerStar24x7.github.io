/**
 * vite.config.js — Vite Build Configuration
 * 
 * Configures Vite for the SAT Bluebook Simulator app.
 * Key settings:
 * - JSON import support (for loading question data)
 * - Dev server configuration
 * - Build output settings
 */

import { defineConfig } from 'vite';

export default defineConfig({
  // Enable JSON imports with stringify for massive performance gain on huge JSON
  json: {
    namedExports: false,
    stringify: true
  },

  // Dev server settings
  server: {
    port: 3000,
    open: true // Auto-open browser on dev server start
  },

  // Build output settings
  build: {
    outDir: 'dist',
    // Increase chunk size warning limit since our JSON data is large (~16MB)
    chunkSizeWarningLimit: 20000
  }
});
