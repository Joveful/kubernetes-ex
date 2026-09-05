import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { Pool } from 'pg'

export type Todo = {
  id: string
  title: string
}

export type TodoStore = {
  list(): Promise<Todo[]>
  create(title: string): Promise<Todo>
}

const seedTodos: Todo[] = [
  {
    id: 'seed-learn-kubernetes',
    title: 'Learn Kubernetes basics'
  },
  {
    id: 'seed-deploy-app',
    title: 'Deploy application to cluster'
  },
  {
    id: 'seed-persistent-volumes',
    title: 'Configure persistent volumes'
  }
]

function createMemoryStore(): TodoStore {
  const todos = seedTodos.map((todo) => ({ ...todo }))

  return {
    async list() {
      return todos
    },
    async create(title) {
      const todo = { id: crypto.randomUUID(), title }
      todos.push(todo)
      return todo
    }
  }
}

export async function createPostgresStore(): Promise<TodoStore> {
  const pool = new Pool({
    host: process.env.PGHOST || 'postgres-svc',
    port: Number(process.env.PGPORT) || 5432,
    database: process.env.PGDATABASE || 'todos',
    user: process.env.PGUSER || 'postgres',
    password: process.env.PGPASSWORD || 'postgres'
  })

  await pool.query(`
    CREATE TABLE IF NOT EXISTS todos (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL
    )
  `)

  for (const todo of seedTodos) {
    await pool.query(
      'INSERT INTO todos (id, title) VALUES ($1, $2) ON CONFLICT (id) DO NOTHING',
      [todo.id, todo.title]
    )
  }

  return {
    async list() {
      const result = await pool.query<Todo>('SELECT id, title FROM todos ORDER BY id')
      return result.rows
    },
    async create(title) {
      const todo = { id: crypto.randomUUID(), title }
      await pool.query('INSERT INTO todos (id, title) VALUES ($1, $2)', [todo.id, todo.title])
      return todo
    }
  }
}

export function createApp(store: TodoStore = createMemoryStore()) {
  const app = new Hono()

  app.use('/todos', async (c, next) => {
    c.header('Access-Control-Allow-Origin', '*')
    c.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    c.header('Access-Control-Allow-Headers', 'Content-Type')

    if (c.req.method === 'OPTIONS') {
      return c.body(null, 204)
    }

    await next()
  })

  app.get('/todos', async (c) => {
    return c.json(await store.list())
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

    const todo = await store.create(title)

    return c.json(todo, 201)
  })

  return app
}

const shouldStartServer = process.env.NODE_ENV !== 'test'

if (shouldStartServer) {
  const PORT = Number(process.env.PORT) || 4004

  void createPostgresStore().then((store) => {
    serve(
      {
        fetch: createApp(store).fetch,
        port: PORT
      },
      (info) => {
        console.log(`Todo backend listening on port ${info.port}`)
      }
    )
  }).catch((error) => {
    console.error('Unable to initialize PostgreSQL:', error)
    process.exitCode = 1
  })
}
