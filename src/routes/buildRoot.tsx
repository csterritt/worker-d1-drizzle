/**
 * Route builder for the root path.
 * @module routes/buildRoot
 */
import { Hono, Context } from 'hono'
import { PATHS, COOKIES } from '../constants'
import { useLayout } from './buildLayout'
import { Bindings } from '../local-types'

/**
 * Render the JSX for the root page.
 * @param c - Hono context
 */
const renderRoot = (c: Context) => {
  return (
    <div
      data-testid='startup-page-banner'
      className='flex flex-col items-center'
    >
      <div className='card w-full max-w-md bg-base-100 shadow-xl mb-6'>
        <div className='card-body'>
          <h2 className='card-title text-2xl font-bold'>Welcome!</h2>
          <h3 id='heading'>Worker, D1, Drizzle Project</h3>
          <p>
            <a
              href={PATHS.PRIVATE}
              className='btn btn-primary'
              data-testid='visit-private-link'
            >
              Protected Content
            </a>
          </p>
        </div>
      </div>

      {/* JavaScript to check for sign-out message cookie and display alert */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
          document.addEventListener('DOMContentLoaded', function() {
            // Function to get cookie by name
            function getCookie(name) {
              const value = \`; \${document.cookie}\`;
              const parts = value.split(\`; \${name}=\`);
              if (parts.length === 2) return parts.pop().split(';').shift();
            }
            
            // Function to delete cookie by name
            function deleteCookie(name) {
              document.cookie = name + '=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
            }
            
            // Check for sign-out message
            const signOutMessage = getCookie('${COOKIES.SIGN_OUT_MESSAGE}');
            if (signOutMessage) {
              // Decode the URI component to replace %20 with spaces
              const decodedMessage = decodeURIComponent(signOutMessage);
              
              // Create alert element
              const alertDiv = document.createElement('div');              
              alertDiv.innerHTML = \`
                <div class="alert alert-success shadow-lg max-w-md mx-auto mt-4" role="alert">
                  <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current flex-shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>\${decodedMessage}</span>
                </div>
              \`;
              
              // Insert alert before the main content
              const mainContent = document.querySelector('.container');
              if (mainContent && mainContent.parentNode) {
                mainContent.parentNode.insertBefore(alertDiv, mainContent);
              }
              
              // Clear the cookie
              deleteCookie('${COOKIES.SIGN_OUT_MESSAGE}');
            }
          });
        `,
        }}
      />
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
