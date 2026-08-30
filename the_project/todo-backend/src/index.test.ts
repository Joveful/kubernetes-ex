import test from 'node:test'
import assert from 'node:assert/strict'

import { createApp } from './index.js'

test('GET /todos returns the stored list', async () => {
  const app = createApp()
  const response = await app.request('http://localhost/todos')

  assert.equal(response.status, 200)
  const payload = await response.json()
  assert.deepEqual(payload, [
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
  ])
})

test('POST /todos adds a new todo', async () => {
  const app = createApp()
  const response = await app.request('http://localhost/todos', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ title: 'Write the API tests' })
  })

  assert.equal(response.status, 201)
  const payload = await response.json()
  assert.equal(payload.title, 'Write the API tests')
  assert.equal(typeof payload.id, 'string')
})
