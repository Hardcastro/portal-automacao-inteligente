import http from 'http'
import { createApp } from './src/server/app.js'
import config from './src/server/config.js'
import { initStore } from './data/reportsData.js'

await initStore()

const app = createApp()
const server = http.createServer(app)

export default server

if (process.env.NODE_ENV !== 'test') {
  server.listen(config.port, () => {
    // eslint-disable-next-line no-console
    console.log(`Servidor iniciado em http://localhost:${config.port}`)
  })
}
