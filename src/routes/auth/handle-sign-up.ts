/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import { Hono } from 'hono'
import { secureHeaders } from 'hono/secure-headers'

import { createAuth } from '../../lib/auth'
import { redirectWithError } from '../../lib/redirects'
import { PATHS, STANDARD_SECURE_HEADERS, MESSAGES } from '../../constants'
import type { Bindings } from '../../local-types'
import { createDbClient } from '../../db/client'
import { validateRequest, SignUpFormSchema } from '../../lib/validators'
import {
  handleSignUpResponseError,
  handleSignUpApiError,
  updateAccountTimestampAfterSignUp,
  redirectToAwaitVerification,
} from '../../lib/sign-up-utils'

interface SignUpData {
  name: string
  email: string
  password: string
}

/**
 * Handle sign-up form submission with proper UX flow
 * Processes registration via better-auth and redirects to appropriate page
 */
export const handleSignUp = (app: Hono<{ Bindings: Bindings }>): void => {
  app.post(
    PATHS.AUTH.SIGN_UP,
    secureHeaders(STANDARD_SECURE_HEADERS),
    async (c) => {
      try {
        const body = await c.req.parseBody()
        const [ok, data, err] = validateRequest(body, SignUpFormSchema)

        if (!ok) {
          return redirectWithError(
            c,
            PATHS.AUTH.SIGN_IN,
            err || MESSAGES.INVALID_INPUT
          )
        }

        const { name, email, password } = data as SignUpData
        const auth = createAuth(c.env)

        try {
          const signUpResponse = await auth.api.signUpEmail({
            body: {
              name,
              email,
              password,
              callbackURL: `${PATHS.AUTH.SIGN_IN}/true`,
            },
          })

          if (!signUpResponse) {
            return redirectWithError(
              c,
              PATHS.AUTH.SIGN_IN,
              MESSAGES.GENERIC_ERROR_TRY_AGAIN
            )
          }

          const errorResponse = handleSignUpResponseError(
            c,
            signUpResponse,
            email,
            PATHS.AUTH.SIGN_IN
          )

          if (errorResponse) {
            return errorResponse
          }

          if ('status' in signUpResponse && signUpResponse.status !== 200) {
            console.log('Better-auth non-200 status:', signUpResponse.status)
            return redirectWithError(
              c,
              PATHS.AUTH.SIGN_IN,
              MESSAGES.GENERIC_ERROR_TRY_AGAIN
            )
          }
        } catch (apiError: unknown) {
          return handleSignUpApiError(c, apiError, email, PATHS.AUTH.SIGN_IN)
        }

        const dbClient = createDbClient(c.env.PROJECT_DB)
        await updateAccountTimestampAfterSignUp(dbClient, email)

        return redirectToAwaitVerification(c, email)
      } catch (error) {
        console.error('Sign-up error:', error)
        return redirectWithError(
          c,
          PATHS.AUTH.SIGN_IN,
          MESSAGES.REGISTRATION_GENERIC_ERROR
        )
      }
    }
  )
}
