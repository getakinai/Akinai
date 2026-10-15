/*
|--------------------------------------------------------------------------
| HTTP server entrypoint
|--------------------------------------------------------------------------
|
| The "server.ts" file is the entrypoint for starting the AdonisJS HTTP
| server. Either you can run this file directly or use the "serve"
| command to run this file and monitor file changes
|
*/

await import('reflect-metadata')
const { Ignitor, prettyPrintError } = await import('@adonisjs/core/ignitor')
const { createServer: createHttpServer } = await import('node:http')
const { createServer: createHttpsServer } = await import('node:https')
const { readFileSync } = await import('node:fs')

type RequestHandler = import('node:http').RequestListener

/**
 * Serves HTTPS directly (e.g. with a Cloudflare Origin Certificate) when
 * TLS_CERT_PATH / TLS_KEY_PATH are set; otherwise plain HTTP.
 *
 * reusePort lets two instances on the same host bind the same port at once,
 * so a blue/green deploy can overlap them with zero downtime.
 * HEALTH_PORT is an optional per-instance plain-HTTP listener on 127.0.0.1 that
 * only answers /health (200 once the HTTPS listener is up), so a deploy can
 * probe one specific instance without exposing /health publicly.
 */
const createNodeServer = (handle: RequestHandler) => {
  const certPath = process.env.TLS_CERT_PATH
  const keyPath = process.env.TLS_KEY_PATH
  if (!certPath || !keyPath) {
    return createHttpServer(handle)
  }

  const server = createHttpsServer(
    { cert: readFileSync(certPath), key: readFileSync(keyPath) },
    handle
  )

  const listen = server.listen.bind(server) as (...args: unknown[]) => typeof server
  server.listen = ((port: number, host: string, ...rest: unknown[]) =>
    listen({ port, host, reusePort: true }, ...rest)) as typeof server.listen

  const healthPort = Number(process.env.HEALTH_PORT)
  if (healthPort) {
    server.once('listening', () => {
      const healthServer = createHttpServer((req, res) => {
        const ok = req.url === '/health' && server.listening
        res.writeHead(ok ? 200 : 404, { 'content-type': 'application/json' })
        res.end(JSON.stringify({ ok }))
      }).listen({ port: healthPort, host: '127.0.0.1' })
      server.once('close', () => healthServer.close())
    })
  }

  return server
}

/**
 * URL to the application root. AdonisJS need it to resolve
 * paths to file and directories for scaffolding commands
 */
const APP_ROOT = new URL('../', import.meta.url)

/**
 * The importer is used to import files in context of the
 * application.
 */
const IMPORTER = (filePath: string) => {
  if (filePath.startsWith('./') || filePath.startsWith('../')) {
    return import(new URL(filePath, APP_ROOT).href)
  }
  return import(filePath)
}

new Ignitor(APP_ROOT, { importer: IMPORTER })
  .tap((app) => {
    app.booting(async () => {
      await import('#start/env')
    })
    app.listen('SIGTERM', () => app.terminate())
    app.listenIf(app.managedByPm2, 'SIGINT', () => app.terminate())
  })
  .httpServer()
  .start(createNodeServer)
  .catch((error) => {
    process.exitCode = 1
    prettyPrintError(error)
  })
