import { useState, type SyntheticEvent } from 'react'
import { createRoot } from 'react-dom/client'

function TodoApp() {
  const [todo, setTodo] = useState('')
  const [error, setError] = useState('')
  const [todos, setTodos] = useState<string[]>([
    'Learn Kubernetes basics',
    'Deploy application to cluster',
    'Configure persistent volumes'
  ])

  function addTodo(event: SyntheticEvent) {
    event.preventDefault()
    const trimmedTodo = todo.trim()

    if (!trimmedTodo) return
    if (trimmedTodo.length > 140) {
      setError('Todos must be 140 characters or fewer.')
      return
    }

    setTodos((currentTodos) => [...currentTodos, trimmedTodo])
    setTodo('')
    setError('')
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
        {todos.length > 0 && (
          <ul className="todo-list">
            {todos.map((item, index) => (
              <li className="todo-item" key={`${item}-${index}`}>
                <span className="todo-marker" aria-hidden="true" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        )}
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