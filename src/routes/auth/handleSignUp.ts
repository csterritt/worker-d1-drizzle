import { Hono } from 'hono'
import { createAuth } from '../../lib/auth'
import { redirectWithMessage } from '../../lib/redirects'
import { PATHS } from '../../constants'
import type { Bindings } from '../../local-types'

/**
 * Handle sign-up form submission with proper UX flow
 * Processes registration via better-auth and redirects to appropriate page
 */
export const handleSignUp = (app: Hono<{ Bindings: Bindings }>): void => {
  app.post('/auth/sign-up', async (c) => {
    try {
      const formData = await c.req.formData()
      const name = formData.get('name') as string
      const email = formData.get('email') as string
      const password = formData.get('password') as string

      // Validate required fields
      if (!name || !email || !password) {
        return redirectWithMessage(
          c,
          PATHS.AUTH.SIGN_IN,
          'All fields are required for sign-up.'
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

      // Attempt to sign up via better-auth API with comprehensive error handling
      try {
        const signUpResponse = await auth.api.signUpEmail({
          body: {
            name,
            email,
            password,
          },
        })

        if (!signUpResponse) {
          return redirectWithMessage(
            c,
            PATHS.AUTH.SIGN_IN,
            'Failed to create account. Please try again.'
          )
        }

        // Check if there was an error in the response
        if ('error' in signUpResponse) {
          const errorMessage =
            (signUpResponse.error as any)?.message || 'Registration failed'
          console.log('Better-auth error response:', errorMessage)

          // Handle specific error cases
          if (
            errorMessage.toLowerCase().includes('already exists') ||
            errorMessage.toLowerCase().includes('duplicate') ||
            errorMessage.toLowerCase().includes('unique constraint') ||
            errorMessage.toLowerCase().includes('unique') ||
            errorMessage.toLowerCase().includes('email')
          ) {
            return redirectWithMessage(
              c,
              PATHS.AUTH.SIGN_IN,
              'An account with this email already exists. Please sign in instead.'
            )
          }

          return redirectWithMessage(
            c,
            PATHS.AUTH.SIGN_IN,
            `Registration failed: ${errorMessage}`
          )
        }

        // Check response status
        if ('status' in signUpResponse && signUpResponse.status !== 200) {
          console.log('Better-auth non-200 status:', signUpResponse.status)
          return redirectWithMessage(
            c,
            PATHS.AUTH.SIGN_IN,
            'Registration failed. Please try again.'
          )
        }
      } catch (apiError: any) {
        console.error('Better-auth sign-up API error:', apiError)

        // Check if it's a duplicate email error from database or API
        const errorMessage = apiError?.message || String(apiError)
        const errorString = errorMessage.toLowerCase()

        if (
          errorString.includes('already exists') ||
          errorString.includes('duplicate') ||
          errorString.includes('unique constraint') ||
          errorString.includes('unique') ||
          errorString.includes('violates unique') ||
          (errorString.includes('email') && errorString.includes('exists'))
        ) {
          return redirectWithMessage(
            c,
            PATHS.AUTH.SIGN_IN,
            'An account with this email already exists. Please sign in instead.'
          )
        }

        // Check for specific database constraint errors
        if (
          errorString.includes('constraint') ||
          errorString.includes('sqlite_constraint')
        ) {
          return redirectWithMessage(
            c,
            PATHS.AUTH.SIGN_IN,
            'An account with this email already exists. Please sign in instead.'
          )
        }

        return redirectWithMessage(
          c,
          PATHS.AUTH.SIGN_IN,
          'Something went wrong during registration. Please try again.'
        )
      }

      // Successful sign-up!
      // Redirect to await verification page with email parameter
      return c.redirect(`${PATHS.AUTH.AWAIT_VERIFICATION}?email=${encodeURIComponent(email)}`)
    } catch (error) {
      console.error('Sign-up error:', error)

      // Handle network/API errors gracefully
      return redirectWithMessage(
        c,
        PATHS.AUTH.SIGN_IN,
        'Something went wrong during registration. Please try again.'
      )
    }
  })
}
