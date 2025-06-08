import { Hono } from 'hono'

import { renderer } from './renderer'
import { buildHome } from './routes/buildHome'
import { buildRoot } from './routes/buildRoot' // PRODUCTION:REMOVE
import { buildCount } from './routes/buildCount'
import { handleIncrement } from './routes/handleIncrement'
import { build404 } from './routes/build404'

const app = new Hono<{ Bindings: CloudflareBindings }>()

app.use(renderer)

buildRoot(app) // PRODUCTION:REMOVE
buildCount(app)
handleIncrement(app)
buildHome(app)

// this MUST be the last route declared!
build404(app)

export default app
