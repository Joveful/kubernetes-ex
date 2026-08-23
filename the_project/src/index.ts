import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { html } from 'hono/html'
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'

const PORT = Number(process.env.PORT) || 3000
const CACHE_DURATION_MS = 10 * 60 * 1000
const imagePath = join(process.cwd(), 'data', 'picsum.jpg')
const metadataPath = join(process.cwd(), 'data', 'picsum.json')

const app = new Hono()

app.get('/', async (c) => {
  return c.html(html`<!doctype html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Todo app</title>
      </head>
      <body>
        <h1>Todo app</h1>
        <img src="/image" alt="Random image" />
      </body>
    </html>`)
})

app.get('/image', async (c) => {
  const image = await readFile(imagePath)

  return c.body(image, 200, {
    'Content-Type': 'image/jpeg',
    'Cache-Control': 'no-cache'
  })
})

async function downloadImage() {
  const response = await fetch('https://picsum.photos/1200')

  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`)
  }

  await mkdir(dirname(imagePath), { recursive: true })
  const imageData = Buffer.from(await response.arrayBuffer())
  const timestamp = Date.now()

  await writeFile(`${imagePath}.tmp`, imageData)
  await rename(`${imagePath}.tmp`, imagePath)
  await writeFile(`${metadataPath}.tmp`, JSON.stringify({ downloadedAt: timestamp }))
  await rename(`${metadataPath}.tmp`, metadataPath)
}

async function isImageCacheFresh() {
  try {
    const metadata = JSON.parse(await readFile(metadataPath, 'utf8')) as { downloadedAt?: number }

    return typeof metadata.downloadedAt === 'number' &&
      Date.now() - metadata.downloadedAt < CACHE_DURATION_MS
  } catch {
    return false
  }
}

async function ensureImageCache() {
  if (!(await isImageCacheFresh())) {
    await downloadImage()
  }
}

await ensureImageCache()

serve({
  fetch: app.fetch,
  port: PORT
}, (info) => {
  console.log(`Server started in port ${info.port}`)
})
