import { Hono } from 'hono'
import { secureHeaders } from 'hono/secure-headers'

import { createAuth } from '../../lib/auth'
import { redirectWithMessage } from '../../lib/redirects'
import { PATHS, STANDARD_SECURE_HEADERS } from '../../constants'
import type { Bindings } from '../../local-types'

/**
 * Handle sign-in form submission with proper UX flow
 * Processes sign-in via better-auth and redirects to appropriate page
 */
export const handleSignIn = (app: Hono<{ Bindings: Bindings }>): void => {
  app.post(
    '/auth/sign-in',
    secureHeaders(STANDARD_SECURE_HEADERS),
    async (c) => {
      try {
        const formData = await c.req.formData()
        const email = formData.get('email') as string
        const password = formData.get('password') as string

        // Validate required fields
        if (!email || !password) {
          return redirectWithMessage(
            c,
            PATHS.AUTH.SIGN_IN,
            'Email and password are required.'
          )
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(email)) {
          return redirectWithMessage(
            c,
            PATHS.AUTH.SIGN_IN,
            'Please enter a valid email address.'
          )
        }

        // Validate password length
        if (password.length < 8) {
          return redirectWithMessage(
            c,
            PATHS.AUTH.SIGN_IN,
            'Password must be at least 8 characters long.'
          )
        }

        // Create better-auth instance
        const auth = createAuth(c.env)

        // Invoke better-auth handler directly and forward its cookies to our redirect response
        try {
          // Create a proper request that better-auth handler expects
          const authUrl = new URL(c.req.url)
          authUrl.pathname = '/api/auth/sign-in/email'

          const authRequest = new Request(authUrl.toString(), {
            method: 'POST',
            headers: c.req.raw.headers,
            body: formData,
          })

          // Call better-auth handler to get the actual response with proper cookies
          const authResponse = await auth.handler(authRequest)

          if (!authResponse) {
            return redirectWithMessage(
              c,
              PATHS.AUTH.SIGN_IN,
              'Sign-in failed. Please check your credentials and try again.'
            )
          }

          // Check response status
          if (authResponse.status !== 200) {
            console.log('Better-auth sign-in status:', authResponse.status)

            // Handle specific HTTP status codes
            if (authResponse.status === 401) {
              return redirectWithMessage(
                c,
                PATHS.AUTH.SIGN_IN,
                'Invalid email or password. Please check your credentials and try again.'
              )
            }

            if (authResponse.status === 400) {
              return redirectWithMessage(
                c,
                PATHS.AUTH.SIGN_IN,
                'Please check your email and password and try again.'
              )
            }

            return redirectWithMessage(
              c,
              PATHS.AUTH.SIGN_IN,
              'Sign-in failed. Please try again.'
            )
          }

          // Sign-in was successful! Create redirect response
          const response = redirectWithMessage(
            c,
            PATHS.PRIVATE,
            'Welcome! You have been signed in successfully.'
          )

          // Forward ALL cookies from better-auth response to our redirect response
          const cookies = authResponse.headers.get('set-cookie')
          if (cookies) {
            response.headers.set('Set-Cookie', cookies)
          }

          // Also check for multiple cookie headers
          const allCookieHeaders = authResponse.headers.getSetCookie?.() || []
          allCookieHeaders.forEach((cookie) => {
            response.headers.append('Set-Cookie', cookie)
          })

          return response
        } catch (apiError: any) {
          console.error('Better-auth sign-in API error:', apiError)

          // Check if it's an authentication error
          const errorMessage = apiError?.message || String(apiError)
          const errorString = errorMessage.toLowerCase()

          if (
            errorString.includes('invalid') ||
            errorString.includes('credentials') ||
            errorString.includes('unauthorized') ||
            errorString.includes('authentication') ||
            errorString.includes('password') ||
            errorString.includes('wrong')
          ) {
            return redirectWithMessage(
              c,
              PATHS.AUTH.SIGN_IN,
              'Invalid email or password. Please check your credentials and try again.'
            )
          }

          if (
            errorString.includes('not found') ||
            (errorString.includes('user') && errorString.includes('exist'))
          ) {
            return redirectWithMessage(
              c,
              PATHS.AUTH.SIGN_IN,
              'No account found with this email. Please check your email or sign up for a new account.'
            )
          }

          return redirectWithMessage(
            c,
            PATHS.AUTH.SIGN_IN,
            'Something went wrong during sign-in. Please try again.'
          )
        }
      } catch (error) {
        console.error('Sign-in handler error:', error)

        // Handle network/form errors gracefully
        return redirectWithMessage(
          c,
          PATHS.AUTH.SIGN_IN,
          'Something went wrong. Please try again.'
        )
      }
    }
  )
}
