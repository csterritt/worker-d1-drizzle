/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import { Hono } from 'hono'
import { secureHeaders } from 'hono/secure-headers'

import { STANDARD_SECURE_HEADERS } from '../../constants'

/**
 * Test-only SMTP configuration manipulation endpoints
 * These endpoints should ONLY be available in development/test environments
 */

// Store test SMTP configuration override
let testSmtpConfig: {
  host?: string
  port?: number
} | null = null

/**
 * Get test SMTP configuration override (if set)
 * This is used by email-service.ts to check for test overrides
 */
export const getTestSmtpConfig = () => testSmtpConfig

const testSmtpRouter = new Hono()

/**
 * Set SMTP configuration for testing email failures
 * POST /test/set-smtp-config
 */
testSmtpRouter.post(
  '/set-smtp-config',
  secureHeaders(STANDARD_SECURE_HEADERS),
  async (c) => {
    try {
      const body = await c.req.json()

      // Set test config override
      testSmtpConfig = {
        host: body.host,
        port: body.port,
      }

      console.log('Test SMTP config override set:', testSmtpConfig)

      return c.json({
        success: true,
        message: 'SMTP configuration set for testing',
        config: testSmtpConfig,
      })
    } catch (error) {
      console.error('Failed to set SMTP config:', error)

      return c.json(
        {
          success: false,
          error: 'Failed to set SMTP configuration',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
        500
      )
    }
  }
)

/**
 * Reset SMTP configuration to original values
 * POST /test/reset-smtp-config
 */
testSmtpRouter.post(
  '/reset-smtp-config',
  secureHeaders(STANDARD_SECURE_HEADERS),
  async (c) => {
    try {
      // Clear test config override
      testSmtpConfig = null
      console.log('SMTP config override cleared')

      return c.json({
        success: true,
        message: 'SMTP configuration reset to original',
      })
    } catch (error) {
      console.error('Failed to reset SMTP config:', error)

      return c.json(
        {
          success: false,
          error: 'Failed to reset SMTP configuration',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
        500
      )
    }
  }
)

export { testSmtpRouter }
