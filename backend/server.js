import { serve } from '@hono/node-server'
import app from './app.js'

const port = 2406

app.use('*', async (c, next) => {
  console.log(`${c.req.method} ${c.req.url}`)
  await next()
})

app.onError((err, c) => {
  console.error('Global error:', err)
  console.error('Detailed error:', err);
  console.error('Error stack:', err.stack);
  return c.text('Internal Server Error', 500);
});

console.log(`Server is running on http://localhost:${port}`)

serve({
  fetch: app.fetch,
  port
})

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason)
})

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error)
})
