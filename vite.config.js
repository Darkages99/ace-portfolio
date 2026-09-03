import { defineConfig } from 'vite'
import { resolve } from 'node:path'

// Relative base so the built bundle works when deployed at any sub-path.
export default defineConfig({
  base: './',
  build: {
    target: 'es2020',
    cssCodeSplit: true,
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      // Multi-page app: the homepage plus the content subpages. Each is a real
      // HTML entry so it gets its own crawlable URL (e.g. /pricing/).
      input: {
        main: resolve(__dirname, 'index.html'),
        pricing: resolve(__dirname, 'pricing/index.html'),
        beginners: resolve(__dirname, 'beginners/index.html'),
        freeTrial: resolve(__dirname, 'free-trial/index.html'),
        contact: resolve(__dirname, 'contact/index.html'),
        weightlifting: resolve(__dirname, 'weightlifting/index.html'),
        bookacall: resolve(__dirname, 'bookacall/index.html'),
        bookTrial: resolve(__dirname, 'book-trial/index.html'),
      },
      output: {
        // Keep the heavy libs in their own chunks so they stay out of the
        // critical path and are only fetched when the 'full' tier imports them.
        manualChunks(id) {
          if (id.includes('node_modules/three')) return 'three'
          if (id.includes('node_modules/gsap') || id.includes('node_modules/lenis')) return 'motion'
        },
      },
    },
  },
})
