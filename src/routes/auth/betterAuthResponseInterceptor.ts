import { Hono } from 'hono'
import { createAuth } from '../../lib/auth'
import { redirectWithMessage } from '../../lib/redirects'
import { PATHS } from '../../constants'
import type { Bindings } from '../../local-types'

/**
 * Better-auth response interceptor to convert JSON responses to user-friendly redirects
 * This middleware intercepts successful better-auth API responses and redirects appropriately
 */
export const setupBetterAuthResponseInterceptor = (app: Hono<{ Bindings: Bindings }>) => {
  // Intercept sign-in endpoint specifically
  app.on(['POST'], '/api/auth/sign-in/email', async (c, next) => {
    try {
      // Create better-auth instance and handle the request normally
      const auth = createAuth(c.env.PROJECT_DB)
      const response = await auth.handler(c.req.raw)
      
      if (!response) {
        return next()
      }

      // Check if this was a successful sign-in (status 200 with user data)
      if (response.status === 200) {
        try {
          const responseData = await response.json()
          
          // If the response contains user data, it was a successful sign-in
          if (responseData && responseData.user && responseData.user.id) {
            // Create a new response with the same cookies but redirect instead of JSON
            const redirectResponse = redirectWithMessage(
              c,
              PATHS.ROOT,
              'Welcome! You have been signed in successfully.'
            )

            // Forward all cookies from better-auth response
            const cookies = response.headers.get('set-cookie')
            if (cookies) {
              // Handle single cookie header
              redirectResponse.headers.set('Set-Cookie', cookies)
            }

            // Handle multiple cookie headers if they exist
            const allCookieHeaders = response.headers.getSetCookie?.() || []
            allCookieHeaders.forEach(cookie => {
              redirectResponse.headers.append('Set-Cookie', cookie)
            })

            return redirectResponse
          }
        } catch (jsonError) {
          console.log('Response was not JSON, continuing with original response')
        }
      }

      // For non-200 responses or responses without user data, handle errors gracefully
      if (response.status === 401) {
        return redirectWithMessage(
          c,
          PATHS.AUTH.SIGN_IN,
          'Invalid email or password. Please check your credentials and try again.'
        )
      }

      if (response.status === 400) {
        return redirectWithMessage(
          c,
          PATHS.AUTH.SIGN_IN,
          'Please check your email and password and try again.'
        )
      }

      if (response.status >= 500) {
        return redirectWithMessage(
          c,
          PATHS.AUTH.SIGN_IN,
          'Something went wrong. Please try again.'
        )
      }

      // Return the original response for any other cases
      return response

    } catch (error) {
      console.error('Better-auth response interceptor error:', error)
      
      // Graceful fallback - redirect to sign-in with error message
      return redirectWithMessage(
        c,
        PATHS.AUTH.SIGN_IN,
        'Something went wrong. Please try again.'
      )
    }
  })
}
