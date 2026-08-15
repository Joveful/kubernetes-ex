import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { html } from 'hono/html'

const PORT = Number(process.env.PORT) || 3000

const app = new Hono()

app.get('/', (c) => {
  return c.html(
    html`<!doctype html>
    <h1>Todo app</h1>`
  )
})

serve({
  fetch: app.fetch,
  port: PORT
}, (info) => {
  console.log(`Server started in port ${info.port}`)
})
