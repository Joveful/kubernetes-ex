import { useEffect, useState, type SyntheticEvent } from 'react'
import { createRoot } from 'react-dom/client'

type Todo = {
  id: string
  title: string
}

const API_URL = `http://${window.location.hostname}:4010/todos`

function TodoApp() {
  const [todo, setTodo] = useState('')
  const [error, setError] = useState('')
  const [todos, setTodos] = useState<Todo[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadTodos() {
      try {
        const response = await fetch(API_URL, {
          headers: {
            Accept: 'application/json'
          }
        })

        if (!response.ok) {
          throw new Error(`Unable to load todos (${response.status}).`)
        }

        const items = (await response.json()) as Todo[]
        setTodos(items)
      } catch (fetchError) {
        console.error('Failed to fetch todos', fetchError)
        setError('Unable to load todos right now.')
      } finally {
        setLoading(false)
      }
    }

    void loadTodos()
  }, [])

  async function addTodo(event: SyntheticEvent) {
    event.preventDefault()
    const trimmedTodo = todo.trim()

    if (!trimmedTodo) return
    if (trimmedTodo.length > 140) {
      setError('Todos must be 140 characters or fewer.')
      return
    }

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ title: trimmedTodo })
      })

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({ error: 'Unable to save todo.' }))) as { error?: string }
        throw new Error(payload.error ?? 'Unable to save todo.')
      }

      const savedTodo = (await response.json()) as Todo
      setTodos((currentTodos) => [...currentTodos, savedTodo])
      setTodo('')
      setError('')
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to save todo.')
    }
  }

  return (
    <section className="todo-app">
      <header className="hero">
        <div className="hero-copy">
          <p className="eyebrow">A little room for what matters</p>
          <h1>Todo app</h1>
          <p className="intro">Keep today&apos;s loose ends close, clear, and moving.</p>
        </div>
        <img className="hero-image" src="/image" alt="Random image" />
      </header>
      <div className="todo-panel">
        <form className="todo-form" onSubmit={addTodo}>
          <label htmlFor="todo-input">Add a todo</label>
          <div className="input-row">
            <input
              id="todo-input"
              value={todo}
              onChange={(event) => {
                setTodo(event.target.value)
                setError('')
              }}
              placeholder="What needs doing?"
              autoComplete="off"
              aria-invalid={Boolean(error)}
              aria-describedby={error ? 'todo-error' : undefined}
            />
            <button type="submit">Add todo</button>
          </div>
          {error && <p className="input-error" id="todo-error" role="alert">{error}</p>}
        </form>
        {loading ? (
          <p className="input-error">Loading todos...</p>
        ) : todos.length > 0 ? (
          <ul className="todo-list">
            {todos.map((item) => (
              <li className="todo-item" key={item.id}>
                <span className="todo-marker" aria-hidden="true" />
                <span>{item.title}</span>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </section>
  )
}

const root = document.getElementById('root')

if (root) {
  const appRoot = document.createElement('div')
  root.appendChild(appRoot)
  createRoot(appRoot).render(<TodoApp />)
}