import { defineConfig } from 'vite'

// Relative base so the built bundle works when deployed at any sub-path.
export default defineConfig({
  base: './',
  build: {
    target: 'es2020',
    cssCodeSplit: true,
    chunkSizeWarningLimit: 700,
    rollupOptions: {
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
