import { defineConfig } from 'vite'

// Stride dev/build server. The app boots the Claude-designed prototype 1:1
// from /public via Babel-standalone (see index.html + public/bridge.js) and
// talks to the Laravel Stride API (default http://localhost:8100/api/stride —
// override by setting window.STRIDE_API_BASE before /bridge.js, or edit it).
export default defineConfig({
  server: {
    host: true,
    port: 5180,
  },
})
