/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import { Hono, Context, Next } from 'hono'

import { createAuth } from '../../lib/auth'
import { redirectWithMessage } from '../../lib/redirects'
import { PATHS, COOKIES, MESSAGES } from '../../constants'
import type { Bindings } from '../../local-types'
import { addCookie } from '../../lib/cookie-support'

interface AuthResponseData {
  user?: {
    id: string
    email: string
    emailVerified: boolean
  }
}

interface AuthErrorData {
  code?: string
  message?: string
}

interface InterceptorVariables {
  signInEmail?: string
}

type InterceptorEnv = { Bindings: Bindings; Variables: InterceptorVariables }
type InterceptorContext = Context<InterceptorEnv>

const ERROR_MESSAGES = {
  INVALID_CREDENTIALS:
    'Invalid email or password. Please check your credentials and try again.',
  CHECK_CREDENTIALS: 'Please check your email and password and try again.',
  ACCOUNT_CREATED:
    'Account created! Please check your email to verify your account.',
  WELCOME: 'Welcome! You have been signed in successfully.',
} as const

/**
 * Handle successful sign-up requiring email verification
 */
const handleUnverifiedSignUp = (
  c: InterceptorContext,
  email: string,
  isSignUp: boolean
): Response | null => {
  if (!isSignUp) {
    return null
  }

  addCookie(c, COOKIES.EMAIL_ENTERED, email)
  return redirectWithMessage(
    c,
    PATHS.AUTH.EMAIL_SENT,
    ERROR_MESSAGES.ACCOUNT_CREATED
  )
}

/**
 * Handle successful sign-in with verified email
 */
const handleVerifiedSignIn = (
  c: InterceptorContext,
  response: Response
): Response => {
  const redirectResponse = redirectWithMessage(
    c,
    PATHS.PRIVATE,
    ERROR_MESSAGES.WELCOME
  )

  const allCookieHeaders = response.headers.getSetCookie?.() || []
  allCookieHeaders.forEach((cookie) => {
    redirectResponse.headers.append('Set-Cookie', cookie)
  })

  return redirectResponse
}

/**
 * Handle unverified user attempting to sign in
 */
const handleUnverifiedSignIn = (c: InterceptorContext): Response =>
  redirectWithMessage(
    c,
    PATHS.AUTH.SIGN_IN,
    MESSAGES.VERIFY_EMAIL_BEFORE_SIGN_IN
  )

/**
 * Process successful (200) auth response
 */
const handleSuccessResponse = async (
  c: InterceptorContext,
  response: Response
): Promise<Response | null> => {
  let responseData: AuthResponseData

  try {
    responseData = (await response.json()) as AuthResponseData
  } catch {
    console.log('Response was not JSON, continuing with original response')
    return null
  }

  const user = responseData?.user
  if (!user) {
    return null
  }

  const isSignUp = c.req.url.includes('/sign-up')

  if (!user.emailVerified) {
    const signUpRedirect = handleUnverifiedSignUp(c, user.email, isSignUp)
    if (signUpRedirect) {
      return signUpRedirect
    }

    return handleUnverifiedSignIn(c)
  }

  if (user.id && user.emailVerified) {
    return handleVerifiedSignIn(c, response)
  }

  return null
}

/**
 * Handle 403 forbidden response (typically email not verified)
 */
const handleForbiddenResponse = async (
  c: InterceptorContext,
  response: Response,
  capturedEmail: string | undefined
): Promise<Response> => {
  try {
    const responseClone = response.clone()
    const errorData = (await responseClone.json()) as AuthErrorData

    if (errorData?.code === 'EMAIL_NOT_VERIFIED' && capturedEmail) {
      addCookie(c, COOKIES.EMAIL_ENTERED, capturedEmail)
      return redirectWithMessage(
        c,
        PATHS.AUTH.AWAIT_VERIFICATION,
        MESSAGES.VERIFY_EMAIL_BEFORE_SIGN_IN
      )
    }
  } catch {
    // Could not parse 403 response, continue with fallback
  }

  return redirectWithMessage(
    c,
    PATHS.AUTH.SIGN_IN,
    MESSAGES.VERIFY_EMAIL_BEFORE_SIGN_IN
  )
}

/**
 * Handle error responses by status code
 */
const handleErrorResponse = async (
  c: InterceptorContext,
  response: Response,
  capturedEmail: string | undefined
): Promise<Response | null> => {
  switch (response.status) {
    case 401:
      return redirectWithMessage(
        c,
        PATHS.AUTH.SIGN_IN,
        ERROR_MESSAGES.INVALID_CREDENTIALS
      )

    case 403:
      return handleForbiddenResponse(c, response, capturedEmail)

    case 400:
      return redirectWithMessage(
        c,
        PATHS.AUTH.SIGN_IN,
        ERROR_MESSAGES.CHECK_CREDENTIALS
      )

    default:
      if (response.status >= 500) {
        return redirectWithMessage(
          c,
          PATHS.AUTH.SIGN_IN,
          MESSAGES.GENERIC_ERROR_TRY_AGAIN
        )
      }

      return null
  }
}

/**
 * Middleware to capture email from sign-in requests
 */
const captureEmailMiddleware = async (
  c: InterceptorContext,
  next: Next
): Promise<void> => {
  try {
    const clonedRequest = c.req.raw.clone()
    const formData = await clonedRequest.formData()
    const email = formData.get('email') as string | null

    if (email) {
      c.set('signInEmail', email)
    }
  } catch {
    // Silently continue if email capture fails
  }

  await next()
}

/**
 * Main sign-in handler that intercepts better-auth responses
 */
const signInHandler = async (
  c: InterceptorContext,
  next: Next
): Promise<Response | void> => {
  try {
    const capturedEmail = c.get('signInEmail')
    const auth = createAuth(c.env)
    const response = await auth.handler(c.req.raw)

    if (!response) {
      return next()
    }

    if (response.status === 200) {
      const successResult = await handleSuccessResponse(c, response)
      if (successResult) {
        return successResult
      }
    }

    const errorResult = await handleErrorResponse(c, response, capturedEmail)
    if (errorResult) {
      return errorResult
    }

    return response
  } catch (error) {
    console.error('Better-auth response interceptor error:', error)
    return redirectWithMessage(
      c,
      PATHS.AUTH.SIGN_IN,
      MESSAGES.GENERIC_ERROR_TRY_AGAIN
    )
  }
}

/**
 * Better-auth response interceptor to convert JSON responses to user-friendly redirects
 */
export const setupBetterAuthResponseInterceptor = (
  app: Hono<{ Bindings: Bindings }>
): void => {
  app.use(PATHS.AUTH.SIGN_IN_EMAIL_API, captureEmailMiddleware)
  app.on(['POST'], PATHS.AUTH.SIGN_IN_EMAIL_API, signInHandler)
}
