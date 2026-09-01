import { serve } from '@hono/node-server'
import { Hono } from 'hono'

export type Todo = {
  id: string
  title: string
}

export function createApp() {
  const app = new Hono()
  const todos: Todo[] = [
    {
      id: 'learn-kubernetes',
      title: 'Learn Kubernetes basics'
    },
    {
      id: 'deploy-app',
      title: 'Deploy application to cluster'
    },
    {
      id: 'persistent-volumes',
      title: 'Configure persistent volumes'
    }
  ]

  app.use('/todos', async (c, next) => {
    c.header('Access-Control-Allow-Origin', '*')
    c.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    c.header('Access-Control-Allow-Headers', 'Content-Type')

    if (c.req.method === 'OPTIONS') {
      return c.body(null, 204)
    }

    await next()
  })

  app.get('/todos', (c) => {
    return c.json(todos)
  })

  app.post('/todos', async (c) => {
    const body = await c.req.json().catch(() => null)

    if (!body || typeof body.title !== 'string') {
      return c.json({ error: 'A todo title is required.' }, 400)
    }

    const title = body.title.trim()

    if (!title) {
      return c.json({ error: 'Todo title cannot be empty.' }, 400)
    }

    if (title.length > 140) {
      return c.json({ error: 'Todos must be 140 characters or fewer.' }, 400)
    }

    const todo: Todo = {
      id: crypto.randomUUID(),
      title
    }

    todos.push(todo)

    return c.json(todo, 201)
  })

  return app
}

const shouldStartServer = process.env.NODE_ENV !== 'test'

if (shouldStartServer) {
  const PORT = Number(process.env.PORT) || 4004
  const app = createApp()

  serve(
    {
      fetch: app.fetch,
      port: PORT
    },
    (info) => {
      console.log(`Todo backend listening on port ${info.port}`)
    }
  )
}
