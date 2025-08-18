import { Hono } from 'hono'
import { secureHeaders } from 'hono/secure-headers'

import { createAuth } from '../../lib/auth'
import { redirectWithMessage } from '../../lib/redirects'
import { PATHS, STANDARD_SECURE_HEADERS } from '../../constants'
import type { Bindings } from '../../local-types'

/**
 * Handle sign-out with proper UX flow
 * Processes sign-out via better-auth and redirects to home page with success message
 */
export const handleSignOut = (app: Hono<{ Bindings: Bindings }>): void => {
  app.post(
    '/auth/sign-out',
    secureHeaders(STANDARD_SECURE_HEADERS),
    async (c) => {
      try {
        // Create better-auth instance
        const auth = createAuth(c.env)

        // Call better-auth handler directly to get proper response with cookie clearing
        try {
          // Create a proper request for the better-auth sign-out endpoint
          const authUrl = new URL(c.req.url)
          authUrl.pathname = '/api/auth/sign-out'

          const authRequest = new Request(authUrl.toString(), {
            method: 'POST',
            headers: c.req.raw.headers,
          })

          // Call better-auth handler to get the actual response with cookie clearing headers
          const authResponse = await auth.handler(authRequest)

          if (authResponse && authResponse.status === 200) {
            // Create redirect response with success message
            const redirectResponse = redirectWithMessage(
              c,
              PATHS.ROOT,
              'You have been signed out successfully.'
            )

            // Handle multiple cookie headers if they exist
            const allCookieHeaders = authResponse.headers.getSetCookie?.() || []
            allCookieHeaders.forEach((cookie) => {
              redirectResponse.headers.append('Set-Cookie', cookie)
            })

            return redirectResponse
          }
        } catch (apiError) {
          console.error('Better-auth sign-out API error:', apiError)
        }

        // Fallback: Clear cookies manually and redirect
        const fallbackResponse = redirectWithMessage(
          c,
          PATHS.ROOT,
          'You have been signed out successfully.'
        )

        // Manually clear better-auth session cookies
        fallbackResponse.headers.append(
          'Set-Cookie',
          'better-auth.session_token=; Path=/; HttpOnly; SameSite=lax; Max-Age=0'
        )
        fallbackResponse.headers.append(
          'Set-Cookie',
          'better-auth.session_data=; Path=/; HttpOnly; SameSite=lax; Max-Age=0'
        )

        return fallbackResponse
      } catch (error) {
        console.error('Sign-out handler error:', error)

        // Handle errors gracefully - still redirect to home
        return redirectWithMessage(c, PATHS.ROOT, 'Sign-out completed.')
      }
    }
  )
}
