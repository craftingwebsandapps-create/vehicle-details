import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"
import { VitePWA } from "vite-plugin-pwa"
import { defineConfig } from "vite"
import { visualizer } from "rollup-plugin-visualizer"

export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
    visualizer({
      open: true,
      gzipSize: true,
    }),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico", "apple-touch-icon.png"],
      manifest: {
        name: "Vehicle Information",
        short_name: "Vehicle Info",
        description: "Vehicle information application.",
        theme_color: "#ffffff",
        background_color: "#ffffff",
        display: "standalone",
        icons: [
          {
            src: "pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
          },
        ],
      },
    }),
  ],
  resolve: {
    tsconfigPaths: true,
  },
  preview: {
    allowedHosts: ["vehicleinformation.apcrda.org"],
  },
  server: {
    allowedHosts: ["vehicleinformation.apcrda.org"],
  },
})
