import { Hono } from 'hono'

import { renderer } from './renderer'
import { buildHome } from './routes/buildHome'
import { buildRoot } from './routes/buildRoot' // PRODUCTION:REMOVE
import { buildCount } from './routes/buildCount'
import { handleIncrement } from './routes/handleIncrement'
import { build404 } from './routes/build404'
import { createDbClient } from './db/client'

const app = new Hono<{ Bindings: CloudflareBindings }>()

// Apply middleware
app.use(renderer)

// Initialize db client for each request
app.use(async (c, next) => {
  // Create DB client for this request
  const db = createDbClient(c.env.PROJECT_DB)
  c.set('db', db)
  
  await next()
})

// Route declarations
buildRoot(app) // PRODUCTION:REMOVE
buildCount(app)
handleIncrement(app)
buildHome(app)

// this MUST be the last route declared!
build404(app)

export default app
