import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import { defineConfig, loadEnv, type Plugin } from 'vite'

// dev only: serve the vercel functions in api/ (e.g. /api/search) from the vite server
function vercelApi(): Plugin {
  return {
    name: 'vercel-api-dev',
    configureServer(server) {
      server.middlewares.use('/api/', async (req, res, next) => {
        const name = req.url?.split('?')[0].replace(/^\//, '')
        if (!name || !/^[a-z]+$/i.test(name)) return next()
        try {
          const mod = await server.ssrLoadModule(`/api/${name}.ts`)
          const handler = mod[req.method ?? 'GET']
          if (!handler) return next()
          const response: Response = await handler(
            new Request(`http://localhost${req.originalUrl}`, { headers: req.headers as Record<string, string> }),
          )
          res.statusCode = response.status
          response.headers.forEach((value, key) => res.setHeader(key, value))
          res.end(await response.text())
        } catch (err) {
          next(err)
        }
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // server-side secrets (YOUTUBE_API_KEY) for the dev api; never exposed to the client bundle
  Object.assign(process.env, loadEnv(mode, process.cwd(), ''))

  return {
    server: {
      port: 1212,
      open: true,
    },
    plugins: [react(), babel({ presets: [reactCompilerPreset()] }), vercelApi()],
  }
})
