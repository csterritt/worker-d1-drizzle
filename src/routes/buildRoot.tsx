/**
 * Route builder for the root path.
 * @module routes/buildRoot
 */
import { Hono, Context } from 'hono'
import { PATHS } from '../constants'
import { useLayout } from './buildLayout'
import { Bindings } from '../local-types'

/**
 * Render the JSX for the root page.
 * @param c - Hono context
 */
const renderRoot = (c: Context) => {
  return (
    <div data-testid='root-page-banner' className='flex flex-col items-center'>
      <div className='card w-full max-w-md bg-base-100 shadow-xl mb-6'>
        <div className='card-body'>
          <h2 className='card-title text-2xl font-bold'>Welcome!</h2>
          <h3 id='heading'>Worker, D1, Drizzle Project</h3>
          <p>
            <a
              href={PATHS.HOME}
              className='btn btn-primary'
              data-testid='visit-home-link'
            >
              Home
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}

/**
 * Attach the root route to the app.
 * @param app - Hono app instance
 */
export const buildRoot = (app: Hono<{ Bindings: Bindings }>): void => {
  app.get(PATHS.ROOT, (c) => c.render(useLayout(c, renderRoot(c))))
}
