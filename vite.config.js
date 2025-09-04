import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  define: {
    global: 'globalThis',
  },
  resolve: {
    alias: {
      buffer: 'buffer',
      process: 'process/browser',
      util: 'util',
      events: 'events',
      stream: 'stream-browserify',
      crypto: 'crypto-browserify',
      assert: 'assert',
      http: 'stream-http',
      https: 'https-browserify',
      os: 'os-browserify/browser',
      url: 'url',
      zlib: 'browserify-zlib',
    },
  },
  optimizeDeps: {
    include: [
      'buffer', 
      'process', 
      'events', 
      'stream-browserify', 
      'crypto-browserify',
      'assert',
      'stream-http',
      'https-browserify',
      'os-browserify/browser',
      'url',
      'browserify-zlib'
    ],
  },
  build: {
    target: 'esnext',
    rollupOptions: {
      external: [],
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          crypto: ['viem', 'wagmi', '@rainbow-me/rainbowkit'],
        },
        globals: {
          buffer: 'Buffer',
        },
      },
      onwarn(warning, warn) {
        // Suppress warnings about comments in ox package
        if (warning.code === 'INVALID_ANNOTATION') return;
        warn(warning);
      },
    },
  },
})
