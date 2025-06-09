import { Hono } from 'hono'

import { renderer } from './renderer'
import { provideSession } from './middleware/provide-session'
import { buildHome } from './routes/buildHome'
import { buildRoot } from './routes/buildRoot' // PRODUCTION:REMOVE
import { buildCount } from './routes/buildCount'
import { handleIncrement } from './routes/handleIncrement'
import { build404 } from './routes/build404'
import { createDbClient } from './db/client'
import { buildSignIn } from './routes/auth/buildSignIn'
import { handleStartOtp } from './routes/auth/handleStartOtp'
import { buildAwaitCode } from './routes/auth/buildAwaitCode'
import { handleFinishOtp } from './routes/auth/handleFinishOtp'
import { handleCancelSignIn } from './routes/auth/handleCancelSignIn'
import { handleSignOut } from './routes/auth/handleSignOut'
import { Bindings } from './local-types'
import { buildPrivate } from './routes/buildPrivate'

const app = new Hono<{ Bindings: Bindings }>()

// Apply middleware
app.use(renderer)
app.use(provideSession)

// Initialize db client for each request
app.use(async (c, next) => {
  // Create DB client for this request
  const db = createDbClient(c.env.PROJECT_DB)
  c.set('db', db)

  await next()
})

// Route declarations
buildRoot(app) // PRODUCTION:REMOVE
buildPrivate(app)
buildCount(app)
handleIncrement(app)
buildHome(app)
buildSignIn(app)
handleStartOtp(app)
buildAwaitCode(app)
handleFinishOtp(app)
handleCancelSignIn(app)
handleSignOut(app)

// this MUST be the last route declared!
build404(app)

export default app
