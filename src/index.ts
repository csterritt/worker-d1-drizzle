import { Hono } from 'hono'
import { logger } from 'hono/logger'
import { csrf } from 'hono/csrf'
import { secureHeaders } from 'hono/secure-headers'
import { bodyLimit } from 'hono/body-limit'

import { HTML_STATUS } from './constants'
import { renderer } from './renderer'
import { provideSession } from './middleware/provide-session'
import { buildHome } from './routes/buildHome'
import { buildRoot } from './routes/buildRoot' // PRODUCTION:REMOVE
import { build404 } from './routes/build404'
import { createDbClient } from './db/client'
import { buildSignIn } from './routes/auth/buildSignIn'
import { handleStartOtp } from './routes/auth/handleStartOtp'
import { buildAwaitCode } from './routes/auth/buildAwaitCode'
import { handleFinishOtp } from './routes/auth/handleFinishOtp'
import { handleResendCode } from './routes/auth/handleResendCode'
import { handleCancelSignIn } from './routes/auth/handleCancelSignIn'
import { handleSignOut } from './routes/auth/handleSignOut'
import { Bindings } from './local-types'
import { buildPrivate } from './routes/buildPrivate'
import { handleSetClock } from './routes/auth/handleSetClock' // PRODUCTION:REMOVE
import { handleResetClock } from './routes/auth/handleResetClock' // PRODUCTION:REMOVE
import { handleSetDbFailures } from './routes/handleSetDbFailures' // PRODUCTION:REMOVE
import { handleCleanSessions } from './routes/auth/handleCleanSessions' // PRODUCTION:REMOVE

const app = new Hono<{ Bindings: Bindings }>()

// Apply middleware
app.use(secureHeaders({ referrerPolicy: 'strict-origin-when-cross-origin' }))
app.use(
  '*',
  csrf({
    origin: (origin: string) => {
      // return /https:\/\/recipes.cls.cloud$/.test(origin)  // PRODUCTION:UNCOMMENT
      return /http:\/\/localhost(:\d+)?$/.test(origin) // PRODUCTION:REMOVE
    },
  })
)
app.use(
  bodyLimit({
    // maxSize: 4 * 1024, // 4kb // PRODUCTION:UNCOMMENT
    maxSize: 1024, // 50kb // PRODUCTION:REMOVE
    onError: (c) => {
      console.log('Body limit exceeded')
      return c.text('overflow :(', HTML_STATUS.CONTENT_TOO_LARGE)
    },
  })
)

app.use(logger())
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
buildHome(app)
buildSignIn(app)
handleStartOtp(app)
buildAwaitCode(app)
handleFinishOtp(app)
handleResendCode(app)
handleCancelSignIn(app)
handleSignOut(app)

handleSetClock(app) // PRODUCTION:REMOVE
handleResetClock(app) // PRODUCTION:REMOVE
handleSetDbFailures(app) // PRODUCTION:REMOVE
handleCleanSessions(app) // PRODUCTION:REMOVE

// this MUST be the last route declared!
build404(app)

export default app
