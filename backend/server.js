import { serve } from '@hono/node-server'
import app from './app.js'

const port = 3000

// Add global error handler
app.onError((err, c) => {
  console.error('Global error:', err)
  return c.text('Internal Server Error', 500)
})

// Add logging middleware
app.use('*', async (c, next) => {
  console.log(`${c.req.method} ${c.req.url}`)
  await next()
})

// Add more detailed error logging
app.onError((err, c) => {
  console.error('Detailed error:', err);
  console.error('Error stack:', err.stack);
  return c.text('Internal Server Error', 500);
});

console.log(`Server is running on port localhost:${port}`)

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