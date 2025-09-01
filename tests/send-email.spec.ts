// ====================================
// Tests for send-email.ts
// To run this, cd to this directory and type 'bun test'
// ====================================

import { describe, it } from 'node:test'
import assert from 'node:assert'
import { sendOtpToUserViaEmail } from '../src/lib/send-email'
import { isOk } from 'true-myth/result'

describe('sendOtpToUserViaEmail', () => {
  it('sends email with correct content and OTP code', async () => {
    // Mock data
    const testEmail = 'test@example.com'
    const testOtp = '123456'
    let capturedArgs: any = null

    // Create mock email agent that captures arguments and returns successfully
    const mockEmailAgent = async (
      fromAddress: string,
      toAddress: string,
      subject: string,
      content: string
    ): Promise<void> => {
      capturedArgs = { fromAddress, toAddress, subject, content }
      return Promise.resolve()
    }

    // Call the function with our mock
    const result = await sendOtpToUserViaEmail(
      testEmail,
      testOtp,
      mockEmailAgent
    )

    // Verify result is successful
    assert.strictEqual(isOk(result), true)

    // Verify email was "sent" with correct parameters
    assert.notStrictEqual(capturedArgs, null)
    assert.strictEqual(capturedArgs?.fromAddress, 'noreply@cls.cloud')
    assert.strictEqual(capturedArgs?.toAddress, testEmail)
    assert.strictEqual(
      capturedArgs?.subject,
      'Your Mini-Auth Verification Code'
    )

    // Verify email content contains the OTP
    assert.ok(capturedArgs?.content.includes(`<strong>${testOtp}</strong>`))
    assert.ok(capturedArgs?.content.includes('<h1>Verification Code</h1>'))
    assert.ok(
      capturedArgs?.content.includes('This code will expire in 15 minutes')
    )
  })

  it('handles email sending failure', async () => {
    // Mock data
    const testEmail = 'test@example.com'
    const testOtp = '123456'

    // Create mock email agent that fails
    const mockFailingEmailAgent = async (): Promise<void> => {
      throw new Error('Email sending failed')
    }

    // Call the function with our failing mock
    const result = await sendOtpToUserViaEmail(
      testEmail,
      testOtp,
      mockFailingEmailAgent
    )

    // Verify result is an error
    assert.strictEqual(result.isErr, true)
    assert.ok(result.error?.message.includes('Email sending failed'))
  })
})
