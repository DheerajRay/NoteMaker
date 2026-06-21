import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: [
        "icons/notemaker-icon.svg",
        "icons/apple-touch-icon.png",
        "icons/favicon-32.png"
      ],
      manifest: {
        name: "NoteMaker",
        short_name: "NoteMaker",
        description: "A tactile browser sampler and step sequencer.",
        start_url: "/",
        scope: "/",
        display: "standalone",
        background_color: "#151513",
        theme_color: "#f18a36",
        icons: [
          {
            src: "/icons/notemaker-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any maskable"
          },
          {
            src: "/icons/notemaker-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable"
          },
          {
            src: "/icons/notemaker-1024.png",
            sizes: "1024x1024",
            type: "image/png",
            purpose: "any"
          }
        ]
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,wav}"],
        navigateFallback: "/index.html"
      }
    })
  ],
  test: {
    environment: "jsdom",
    setupFiles: "./src/test/setup.ts",
    globals: true
  }
});
