import { defineConfig, type Plugin } from 'vite'
import { transform } from 'esbuild'
import { readFile, readdir } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { fileURLToPath } from 'node:url'

// Stride dev/build server.
//
// The app is the Claude-designed prototype in public/proto/*.jsx. Those files use
// NO import/export — they share one global scope in a fixed order, and i18n.jsx
// monkey-patches React.createElement mid-sequence. So we CANNOT bundle them as ES
// modules. Instead the `strideProto` plugin concatenates them in order and runs a
// single classic JSX transform (React.createElement factory) into one script,
// /proto/bundle.js — preserving shared scope + order exactly like the old runtime
// Babel path, but precompiled (no on-device @babel/standalone, no CDN).
//
// bridge.js loads /proto/bundle.js (see its bootProto()). React/ReactDOM are
// self-hosted UMD globals (public/vendor), fonts are self-hosted (public/fonts) —
// the built app is fully self-contained/offline for Capacitor.

// Boot order — canonical here (was bridge.js's FILES). tweaks-panel.jsx is a
// design-editor-only file and is intentionally excluded.
const PROTO_FILES = [
  'ios-frame', 'android-frame', 'data', 'data-live', 'i18n-sk', 'i18n', 'ui',
  'screens-main', 'screens-web', 'screens-spots', 'screens-meta', 'screens-train', 'screens-onboarding', 'screens-ai', 'screens-workouts', 'app',
]

const PROTO_DIR = fileURLToPath(new URL('./public/proto', import.meta.url))

async function compileProto(): Promise<string> {
  const parts: string[] = []
  for (const f of PROTO_FILES) {
    const src = await readFile(`${PROTO_DIR}/${f}.jsx`, 'utf8')
    parts.push(`/* ==== ${f}.jsx ==== */\n${src}`)
  }
  // One transform over the concatenation → one shared top-level scope, in order.
  // Classic JSX only: `automatic` would inject react/jsx-runtime imports and break
  // both the single-scope model and i18n.jsx's React.createElement interception.
  const { code } = await transform(parts.join('\n'), {
    loader: 'jsx',
    jsx: 'transform',
    jsxFactory: 'React.createElement',
    jsxFragment: 'React.Fragment',
  })
  return code
}

function strideProto(): Plugin {
  return {
    name: 'stride-proto',
    // Dev: compile on every request so proto edits are live (no browser Babel).
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url && req.url.split('?')[0] === '/proto/bundle.js') {
          try {
            const code = await compileProto()
            res.setHeader('Content-Type', 'application/javascript')
            res.end(code)
          } catch (e) {
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/javascript')
            res.end(`console.error(${JSON.stringify('Stride proto compile error: ' + String(e))})`)
          }
          return
        }
        next()
      })
    },
    // Build: emit the single precompiled bundle into dist/proto/bundle.js.
    async generateBundle() {
      const proto = await compileProto()
      this.emitFile({ type: 'asset', fileName: 'proto/bundle.js', source: proto })
      const publicDir = fileURLToPath(new URL('./public', import.meta.url))
      const files = (await readdir(publicDir, { recursive: true })).filter((name) =>
        /\.(js|css|woff2|png|svg|webmanifest)$/.test(name) && !name.startsWith('proto/')
      ).sort()
      const template = await readFile('service-worker.js', 'utf8')
      const hash = createHash('sha256').update(proto).update(await readFile('index.html')).update(template)
      for (const file of files) hash.update(await readFile(`${publicDir}/${file}`))
      const worker = template
        .replace('__BUILD_ID__', hash.digest('hex').slice(0, 16))
        .replace('__PRECACHE_ASSETS__', JSON.stringify(['/index.html', '/proto/bundle.js', ...files.map((file) => '/' + file)]))
      this.emitFile({ type: 'asset', fileName: 'sw.js', source: worker })
    },
  }
}

export default defineConfig({
  plugins: [strideProto()],
  server: {
    host: true,
    port: 5180,
    proxy: {
      '/api/stride': {
        target: process.env.STRIDE_API_TARGET || 'http://127.0.0.1:8100',
        changeOrigin: true,
      },
    },
  },
  preview: {
    host: true,
    port: 5180,
  },
})
