/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/**
 * Email service for sending confirmation emails
 * Uses smtp-tester in test environment, nodemailer in production
 * @module lib/email-service
 */

import nodemailer from 'nodemailer'

/**
 * Configuration for email service
 */
interface EmailConfig {
  isTestMode: boolean
  smtpHost?: string
  smtpPort?: number
  smtpUser?: string
  smtpPass?: string
}

/**
 * Get email configuration based on environment
 */
const getEmailConfig = (env: any): EmailConfig => {
  // More robust test environment detection
  const isTestMode =
    env.NODE_ENV === 'test' ||
    env.NODE_ENV === 'development' ||
    env.PLAYWRIGHT === '1' || // Playwright sets this
    process.argv.includes('playwright') || // Running via playwright
    typeof (globalThis as any).test !== 'undefined' // Test environment

  return {
    isTestMode,
    smtpHost: isTestMode ? '127.0.0.1' : env.SMTP_HOST || '127.0.0.1',
    smtpPort: isTestMode ? 1025 : parseInt(env.SMTP_PORT || '587'),
    smtpUser: env.SMTP_USER,
    smtpPass: env.SMTP_PASS,
  }
}

/**
 * Create email transporter based on configuration
 */
const createTransporter = (env: any) => {
  const config = getEmailConfig(env)
  if (config.isTestMode) {
    // Use smtp-tester for testing (assumes server running on port 1025)
    return nodemailer.createTransport({
      host: '127.0.0.1',
      port: 1025,
      secure: false,
      tls: {
        rejectUnauthorized: false,
      },
    })
  }

  // Production SMTP configuration
  return nodemailer.createTransport({
    host: config.smtpHost,
    port: config.smtpPort,
    secure: config.smtpPort === 465,
    auth:
      config.smtpUser && config.smtpPass
        ? {
            user: config.smtpUser,
            pass: config.smtpPass,
          }
        : undefined,
  })
}

/**
 * Send confirmation email to user
 * @param env - Cloudflare environment
 * @param email - User's email address
 * @param name - User's name
 * @param confirmationUrl - URL for email confirmation
 * @param token - Confirmation token
 */
export const sendConfirmationEmail = async (
  env: any,
  email: string,
  name: string,
  confirmationUrl: string,
  token: string
): Promise<void> => {
  console.log('🔔 sendConfirmationEmail called:', {
    email,
    name,
    confirmationUrl,
    token,
  })

  try {
    console.log('📧 Creating email transporter...')
    const transporter = createTransporter(env)

    const mailOptions = {
      from: env.FROM_EMAIL || 'noreply@example.com',
      to: email,
      subject: 'Confirm Your Email Address',
      html: `
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
          <h1 style="color: #333;">Welcome ${name}!</h1>
          <p>Thank you for signing up. Please confirm your email address by clicking the link below:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${confirmationUrl}" 
               style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
              Confirm Email Address
            </a>
          </div>
          <p style="color: #666; font-size: 14px;">
            If the button doesn't work, you can also copy and paste this link into your browser:
          </p>
          <p style="word-break: break-all; color: #666; font-size: 14px;">
            ${confirmationUrl}
          </p>
          <p style="color: #666; font-size: 12px; margin-top: 30px;">
            This confirmation link will expire in 24 hours.
          </p>
        </div>
      `,
      text: `
        Welcome ${name}!
        
        Thank you for signing up. Please confirm your email address by visiting this link:
        
        ${confirmationUrl}
        
        This confirmation link will expire in 24 hours.
      `,
    }

    const result = await transporter.sendMail(mailOptions)
    console.log('Confirmation email sent successfully:', result.messageId)
  } catch (error) {
    console.error('Failed to send confirmation email:', error)
    throw new Error('Failed to send confirmation email')
  }
}
