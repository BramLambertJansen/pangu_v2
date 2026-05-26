import { defineConfig, minimalPreset } from '@vite-pwa/assets-generator/config'

export default defineConfig({
  preset: {
    ...minimalPreset,
    maskable: {
      sizes: [192, 512],
      padding: 0.15,
    },
    apple: {
      sizes: [180],
      padding: 0.1,
    },
  },
  images: ['public/pangu-logo.png'],
})
