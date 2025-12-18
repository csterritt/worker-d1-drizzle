/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/**
 * Handler for interest sign-up form submissions.
 * @module routes/auth/handleInterestSignUp
 */
import { Hono } from 'hono'
import { secureHeaders } from 'hono/secure-headers'

import { PATHS, STANDARD_SECURE_HEADERS, MESSAGES } from '../../constants'
import { Bindings, DrizzleClient } from '../../local-types'
import { redirectWithError, redirectWithMessage } from '../../lib/redirects'
import { addInterestedEmail } from '../../lib/db-access'
import { addCookie } from '../../lib/cookie-support'
import { COOKIES } from '../../constants'
import { validateRequest, InterestSignUpFormSchema } from '../../lib/validators'

/**
 * Attach the interest sign-up handler to the app.
 * @param app - Hono app instance
 */
export const handleInterestSignUp = (
  app: Hono<{ Bindings: Bindings }>
): void => {
  app.post(
    PATHS.AUTH.INTEREST_SIGN_UP,
    secureHeaders(STANDARD_SECURE_HEADERS),
    async (c) => {
      try {
        console.log('🔧 handleInterestSignUp called')

        // Check if user is already signed in
        const user = (c as unknown as { get: (key: string) => unknown }).get(
          'user'
        ) as { id: string } | null
        if (user) {
          console.log('Already signed in')
          return redirectWithMessage(
            c,
            PATHS.PRIVATE,
            MESSAGES.ALREADY_SIGNED_IN
          )
        }

        // Get form data and validate
        const body = await c.req.parseBody()
        const [ok, data, err] = validateRequest(body, InterestSignUpFormSchema)
        if (!ok) {
          const emailEntered = (body as any)?.email as string
          if (emailEntered) {
            addCookie(c, COOKIES.EMAIL_ENTERED, emailEntered)
          }

          return redirectWithError(
            c,
            PATHS.AUTH.INTEREST_SIGN_UP,
            err || MESSAGES.INVALID_INPUT
          )
        }

        const email = data!.email as string
        const trimmedEmail = email.trim().toLowerCase()
        console.log('Processing interest sign-up for email:', trimmedEmail)

        // Get database instance
        const db = c.get('db') as DrizzleClient

        try {
          console.log('🔧 About to call addInterestedEmail for:', trimmedEmail)
          // Add email to interested emails list
          const addResult = await addInterestedEmail(db, trimmedEmail)
          console.log(
            '🔧 addInterestedEmail completed, result:',
            addResult.isOk ? 'SUCCESS' : 'ERROR'
          )

          if (addResult.isErr) {
            console.error(
              'Database error adding interested email:',
              addResult.error
            )
            addCookie(c, COOKIES.EMAIL_ENTERED, email)
            return redirectWithError(
              c,
              PATHS.AUTH.INTEREST_SIGN_UP,
              'Sorry, there was an error processing your request. Please try again.'
            )
          }

          if (!addResult.value) {
            // Email already exists in the list
            console.log('Email already registered for interest:', trimmedEmail)
            return redirectWithMessage(
              c,
              PATHS.AUTH.SIGN_IN,
              "Thanks! Your email is already on our waitlist. We'll notify you when we're accepting new accounts."
            )
          }

          // Successfully added to waitlist
          console.log('Email successfully added to waitlist:', trimmedEmail)
          return redirectWithMessage(
            c,
            PATHS.AUTH.SIGN_IN,
            "Thanks! You've been added to our waitlist. We'll notify you when we start accepting new accounts."
          )
        } catch (error) {
          console.error('Unexpected error in handleInterestSignUp:', error)
          addCookie(c, COOKIES.EMAIL_ENTERED, email)
          return redirectWithError(
            c,
            PATHS.AUTH.INTEREST_SIGN_UP,
            'Sorry, there was an error processing your request. Please try again.'
          )
        }
      } catch (error) {
        console.error('Handle interest sign-up error:', error)
        return redirectWithMessage(
          c,
          PATHS.AUTH.INTEREST_SIGN_UP,
          MESSAGES.GENERIC_ERROR_TRY_AGAIN
        )
      }
    }
  )
}
