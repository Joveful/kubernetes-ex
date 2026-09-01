import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { html } from 'hono/html'
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'

// Default port number won't work with the k8s deployment
const PORT = Number(process.env.PORT) || 3003
const CACHE_DURATION_MS = 10 * 60 * 1000
const appRoot = process.cwd()
const distPath = join(appRoot, 'dist')
const imagePath = join(appRoot, 'data', 'picsum.jpg')
const metadataPath = join(appRoot, 'data', 'picsum.json')

const app = new Hono()

app.get('/', async (c) => {
  await ensureImageCache()

  return c.html(html`<!doctype html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Todo app</title>
        <link rel="stylesheet" href="/client.css" />
      </head>
      <body>
        <main id="root"></main>
        <script type="module" src="/app.js"></script>
      </body>
    </html>`)
})

app.get('/app.js', async (c) => {
  const client = await readFile(join(distPath, 'client.js'))

  return c.body(client, 200, {
    'Content-Type': 'text/javascript; charset=UTF-8',
    'Cache-Control': 'no-cache'
  })
})

app.get('/client.css', async (c) => {
  const styles = await readFile(join(distPath, 'client.css'))

  return c.body(styles, 200, {
    'Content-Type': 'text/css; charset=UTF-8',
    'Cache-Control': 'no-cache'
  })
})

app.get('/image', async (c) => {
  const image = await readFile(imagePath)

  return c.body(image, 200, {
    'Content-Type': 'image/jpeg',
    'Cache-Control': 'no-cache'
  })
})

async function downloadImage() {
  const response = await fetch('https://picsum.photos/1200/800')

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

serve(
  {
    fetch: app.fetch,
    port: PORT
  },
  (info) => {
    console.log(`Todo app front-end listening on port ${info.port}`)
  }
)
