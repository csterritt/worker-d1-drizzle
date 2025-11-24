/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/**
 * Route builder for the root path.
 * @module routes/buildRoot
 */
import { Hono } from 'hono'
import { secureHeaders } from 'hono/secure-headers'
import { PATHS, COOKIES, ALLOW_SCRIPTS_SECURE_HEADERS } from '../constants'
import { useLayout } from './buildLayout'
import { Bindings } from '../local-types'

/**
 * Render the JSX for the root page.
 */
const renderRoot = () => {
  return (
    <div data-testid='startup-page-banner'>
      <div>
        <div class='container'>
          <h2>Welcome!</h2>
          <h3 id='heading'>Worker, D1, Drizzle Project</h3>
          <p>
            <a href={PATHS.PRIVATE} data-testid='visit-private-action'>
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
              if (parts.length === 2) {
                return parts.pop().split(';').shift();
              }
              return null;
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
                <div role="alert">
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
  const secureHeadersWithNonce = {
    ...ALLOW_SCRIPTS_SECURE_HEADERS,
    contentSecurityPolicy: {
      ...ALLOW_SCRIPTS_SECURE_HEADERS.contentSecurityPolicy,
      scriptSrc: ["'sha256-ZXNCd2pGZQ/P0yKye0SdGhvwzepU6qcYgIvceOpTeMQ='"],
    },
  }

  app.get(PATHS.ROOT, secureHeaders(secureHeadersWithNonce), (c) =>
    c.render(useLayout(c, renderRoot()))
  )
}
