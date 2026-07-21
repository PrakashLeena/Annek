import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
// import { visualizer } from "rollup-plugin-visualizer";

export default defineConfig({
  plugins: [
    react(),
    // Uncomment to analyze bundle: npx vite build && open stats.html
    // visualizer({ open: true, filename: "stats.html" }),
  ],

  build: {
    target: "es2020",
    minify: "esbuild",
    rollupOptions: {
      output: {
        // Granular code-splitting for better caching
        manualChunks: (id) => {
          if (id.includes("node_modules/react") || id.includes("node_modules/react-dom")) {
            return "react-vendor";
          }
          if (id.includes("node_modules/react-router")) {
            return "router";
          }
          if (id.includes("node_modules/firebase")) {
            return "firebase";
          }
          if (id.includes("node_modules/framer-motion")) {
            return "animations";
          }
          if (id.includes("node_modules/")) {
            return "vendor";
          }
        },
        // Content-hash filenames for long-term caching
        chunkFileNames:  "assets/[name]-[hash].js",
        entryFileNames:  "assets/[name]-[hash].js",
        assetFileNames:  "assets/[name]-[hash][extname]",
      },
    },
    // Warn on large chunks
    chunkSizeWarningLimit: 350,
    // Generate source maps for production error tracking
    sourcemap: false,
    // CSS code splitting
    cssCodeSplit: true,
  },

  // Preview / dev server
  server: {
    port: 5173,
    strictPort: false,
    open: false,
    headers: {
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "DENY",
    },
  },

  // Pre-bundle large deps for faster cold starts
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react-router-dom",
    ],
  },

  // CSS
  css: {
    devSourcemap: true,
  },
});
