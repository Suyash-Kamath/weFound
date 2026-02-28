// import { defineConfig } from 'vite'
// import react from '@vitejs/plugin-react-swc'
// // removed Tailwind plugin — using handcrafted CSS
// import { fileURLToPath } from 'url'
// import { dirname, resolve } from 'path'

// // https://vite.dev/config/
// const __dirname = dirname(fileURLToPath(import.meta.url))

// export default defineConfig({
//   plugins: [react()],
//   resolve: {
//     alias: {
//       '@': resolve(__dirname, 'src'),
//     },
//   },
// })
import { defineConfig } from "vite"
import react from "@vitejs/plugin-react-swc"
import { fileURLToPath } from "url"
import { dirname, resolve } from "path"

// ESM-safe __dirname
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": resolve(__dirname, "src")
    }
  }
})
