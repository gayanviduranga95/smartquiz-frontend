import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(), 
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'assets/favicon.png', 'assets/logo.png'],
      manifest: {
        name: 'SmartQuiz',
        short_name: 'SmartQuiz',
        description: 'Master Your Learning with SmartQuiz',
        theme_color: '#14b8a6',
        background_color: '#f8fafc',
        display: 'standalone',
        icons: [
          {
            src: 'assets/favicon.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'assets/favicon.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
})
