import { defineConfig } from 'vite'
import { createVuePlugin } from 'vite-plugin-vue2'

export default defineConfig({
  plugins: [
    createVuePlugin(/* options */)
  ],
  build: {
    sourcemap: true,
    minify: false,
  },
  resolve: {
    alias: {
      '@/': __dirname + '/src',
      'vue$': 'vue/dist/vue.esm.js'
    }
  },
})