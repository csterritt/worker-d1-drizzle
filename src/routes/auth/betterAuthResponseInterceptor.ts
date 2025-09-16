/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import { Hono } from 'hono'

import { createAuth } from '../../lib/auth'
import { redirectWithMessage } from '../../lib/redirects'
import { PATHS, COOKIES } from '../../constants'
import type { Bindings } from '../../local-types'
import { addCookie } from '../../lib/cookie-support'

/**
 * Better-auth response interceptor to convert JSON responses to user-friendly redirects
 * This middleware intercepts successful better-auth API responses and redirects appropriately
 */
export const setupBetterAuthResponseInterceptor = (
  app: Hono<{ Bindings: Bindings }>
) => {
  // Add middleware to capture email from sign-in requests without consuming the body
  app.use('/api/auth/sign-in/email', async (c: any, next) => {
    try {
      // Clone the request to avoid consuming the original body
      const clonedRequest = c.req.raw.clone()
      const formData = await clonedRequest.formData()
      const email = formData.get('email') as string | null

      if (email) {
        c.set('signInEmail', email)
      }
    } catch (e) {
      // Silently continue if email capture fails
    }

    await next()
  })

  // Intercept sign-in endpoint specifically
  app.on(['POST'], '/api/auth/sign-in/email', async (c: any, next) => {
    try {
      // Get the captured email from context
      const capturedEmail = c.get('signInEmail') as string | null

      // Create better-auth instance and handle the request normally
      const auth = createAuth(c.env)
      const response = await auth.handler(c.req.raw)

      if (!response) {
        return next()
      }

      // Handle better-auth response based on status

      // Check if this was a successful auth response (status 200)
      if (response.status === 200) {
        try {
          const responseData = (await response.json()) as any

          // Handle successful sign-up that requires email verification
          if (
            responseData &&
            responseData.user &&
            !responseData.user.emailVerified &&
            c.req.url.includes('/sign-up')
          ) {
            // User signed up but needs to verify email
            const email = responseData.user.email
            addCookie(c, COOKIES.EMAIL_ENTERED, email)
            return redirectWithMessage(
              c,
              `${PATHS.AUTH.EMAIL_SENT}`,
              'Account created! Please check your email to verify your account.'
            )
          }

          // If the response contains user data and user is verified, it was a successful sign-in
          if (
            responseData &&
            responseData.user &&
            responseData.user.id &&
            responseData.user.emailVerified
          ) {
            // Create a new response with the same cookies but redirect instead of JSON
            const redirectResponse = redirectWithMessage(
              c,
              PATHS.PRIVATE,
              'Welcome! You have been signed in successfully.'
            )

            // Handle multiple cookie headers if they exist
            const allCookieHeaders = response.headers.getSetCookie?.() || []
            allCookieHeaders.forEach((cookie) => {
              redirectResponse.headers.append('Set-Cookie', cookie)
            })

            return redirectResponse
          }

          // If the response contains user data but email is not verified
          if (
            responseData &&
            responseData.user &&
            responseData.user.id &&
            !responseData.user.emailVerified
          ) {
            return redirectWithMessage(
              c,
              PATHS.AUTH.SIGN_IN,
              'Please verify your email address before signing in. Check your email for a verification link.'
            )
          }
        } catch (jsonError) {
          console.log(
            'Response was not JSON, continuing with original response'
          )
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

      if (response.status === 403) {
        // For 403 responses, check if it's specifically for unverified email
        try {
          const responseClone = response.clone()
          const errorData: any = await responseClone.json()

          // Check if this is specifically an EMAIL_NOT_VERIFIED error
          if (errorData && errorData.code === 'EMAIL_NOT_VERIFIED') {
            // Use the captured email from context
            if (capturedEmail) {
              addCookie(c, COOKIES.EMAIL_ENTERED, capturedEmail)
              return redirectWithMessage(
                c,
                PATHS.AUTH.AWAIT_VERIFICATION,
                'Please verify your email address before signing in. Check your email for a verification link.'
              )
            }
          }
        } catch (e) {
          // Could not parse 403 response, continue with fallback
        }

        // Fallback to original behavior for other 403 cases or if no email captured
        return redirectWithMessage(
          c,
          PATHS.AUTH.SIGN_IN,
          'Please verify your email address before signing in. Check your email for a verification link.'
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

      // Graceful fallback - redirect to sign-in page with error message
      return redirectWithMessage(
        c,
        PATHS.AUTH.SIGN_IN,
        'Something went wrong. Please try again.'
      )
    }
  })
}
