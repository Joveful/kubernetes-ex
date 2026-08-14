import { serve } from '@hono/node-server'
import { Hono } from 'hono'

const PORT = Number(process.env.PORT) || 3000

const app = new Hono()

app.get('/', (c) => {
  return c.text('Hello Hono!')
})

serve({
  fetch: app.fetch,
  port: PORT
}, (info) => {
  console.log(`Server started in port ${info.port}`)
})
