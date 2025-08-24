import { Hono } from 'hono'
import { secureHeaders } from 'hono/secure-headers'

import { STANDARD_SECURE_HEADERS, SIGN_UP_MODES } from '../../constants'

/**
 * Test-only sign-up mode detection endpoint
 * This endpoint should ONLY be available in development/test environments
 */

const testSignUpModeRouter = new Hono()

/**
 * Get current sign-up mode
 * GET /test/sign-up-mode
 */
testSignUpModeRouter.get(
  '/',
  secureHeaders(STANDARD_SECURE_HEADERS),
  async (c) => {
    try {
      const currentMode = process.env.SIGN_UP_MODE || SIGN_UP_MODES.NO_SIGN_UP
      
      // Return just the mode as plain text for easy parsing
      return new Response(currentMode, {
        headers: { 'Content-Type': 'text/plain' },
      })
    } catch (error) {
      console.error('Failed to get sign-up mode:', error)

      return new Response('ERROR', {
        status: 500,
        headers: { 'Content-Type': 'text/plain' },
      })
    }
  }
)

export { testSignUpModeRouter }
