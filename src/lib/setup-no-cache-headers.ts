import { Context } from 'hono'

export const setupNoCacheHeaders = (c: Context) => {
  // Set no-cache headers for signed-in users
  c.header('Cache-Control', 'no-cache, no-store, must-revalidate')
  c.header('Pragma', 'no-cache')
  c.header('Expires', '0')
}
