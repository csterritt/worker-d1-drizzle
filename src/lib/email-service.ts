/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/**
 * Email service for sending confirmation emails
 * Uses smtp-tester in test environment, nodemailer in production
 * @module lib/email-service
 */

import nodemailer from 'nodemailer'

import { getTestSmtpConfig } from '../routes/test/smtp-config'
import type { Bindings } from '../local-types'

/**
 * Escape HTML special characters to prevent XSS in email templates
 */
const escapeHtml = (str: string): string =>
  str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

/**
 * Configuration for email service
 */
interface EmailConfig {
  isTestMode: boolean
  smtpHost?: string
  smtpPort?: number
  smtpUser?: string
  smtpPass?: string
  emailUrl?: string
  emailCode?: string
}

/**
 * Get email configuration based on environment
 */
const getEmailConfig = (env: Bindings): EmailConfig => {
  // More robust test environment detection
  const isTestMode =
    env.NODE_ENV === 'test' ||
    env.NODE_ENV === 'development' ||
    env.PLAYWRIGHT === '1' || // Playwright sets this
    process.argv.includes('playwright') || // Running via playwright
    typeof (globalThis as any).test !== 'undefined' // Test environment

  return {
    isTestMode,
    smtpHost: isTestMode ? '127.0.0.1' : env.SMTP_SERVER_HOST || '127.0.0.1',
    smtpPort: isTestMode ? 1025 : parseInt(env.SMTP_SERVER_PORT || '587'),
    smtpUser: env.SMTP_SERVER_USER,
    smtpPass: env.SMTP_SERVER_PASS,
    emailUrl: env.EMAIL_SEND_URL,
    emailCode: env.EMAIL_SEND_CODE,
  }
}

/**
 * Mail options for sending emails
 */
interface MailOptions {
  to: string
  subject: string
  html: string
  text: string
}

/**
 * Email transporter interface
 */
interface EmailTransporter {
  sendMail: (options: MailOptions) => Promise<unknown>
}

/**
 * Create email transporter based on configuration
 */
const createTransporter = (env: Bindings): EmailTransporter => {
  const config = getEmailConfig(env)

  // Check if SMTP config has been overridden for testing
  const testOverride = getTestSmtpConfig()
  const smtpHost = testOverride?.host || config.smtpHost
  const smtpPort = testOverride?.port || config.smtpPort

  if (config.isTestMode) {
    // Use smtp-tester for testing (assumes server running on port 1025)
    // But allow override via environment variables for failure testing
    return nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: false,
      tls: {
        rejectUnauthorized: false,
      },
    })
  }

  // Production POST configuration
  return {
    sendMail: async (mailOptions: MailOptions) => {
      if (!env.EMAIL_SEND_URL) {
        throw new Error('EMAIL_SEND_URL is not configured')
      }

      return fetch(env.EMAIL_SEND_URL, {
        body: JSON.stringify({
          email_to: mailOptions.to,
          subject: mailOptions.subject,
          sending_site: 'cls.cloud',
          text_content: mailOptions.text,
          html_content: mailOptions.html,
        }),
        method: 'POST',
        headers: {
          Authorization: `Bearer ${env.EMAIL_SEND_CODE}`,
          'content-type': 'application/json;charset=UTF-8',
        },
      })
    },
  }
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
  env: Bindings,
  email: string,
  name: string,
  confirmationUrl: string,
  token: string
): Promise<void> => {
  console.log('🔔 sendConfirmationEmail called:', {
    email,
    name,
    confirmationUrl, // PRODUCTION:REMOVE
    token, // PRODUCTION:REMOVE
  })

  try {
    console.log('📧 Creating email transporter...')
    const transporter = createTransporter(env)

    const mailOptions = {
      to: email,
      subject: 'Confirm Your Email Address',
      html: `
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
          <h1 style="color: #333;">Welcome ${escapeHtml(name)}!</h1>
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
    console.log('Confirmation email sent successfully:', result)
  } catch (error) {
    console.error('Failed to send confirmation email:', error)
    throw new Error('Failed to send confirmation email')
  }
}

/**
 * Send password reset email to user
 * @param env - Cloudflare environment
 * @param email - User's email address
 * @param name - User's name
 * @param resetUrl - Password reset URL with token
 * @param token - Reset token
 */
export const sendPasswordResetEmail = async (
  env: Bindings,
  email: string,
  name: string,
  resetUrl: string,
  token: string
): Promise<void> => {
  console.log('🔔 sendPasswordResetEmail called:', {
    email,
    name,
    resetUrl, // PRODUCTION:REMOVE
    token, // PRODUCTION:REMOVE
  })

  try {
    console.log('📧 Creating email transporter...')
    const transporter = createTransporter(env)

    const mailOptions = {
      to: email,
      subject: 'Reset Your Password',
      html: `
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
          <h1 style="color: #333;">Password Reset Request</h1>
          <p>Hi ${escapeHtml(name)},</p>
          <p>You requested to reset your password. Please click the button below to set a new password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="background-color: #dc3545; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
              Reset Your Password
            </a>
          </div>
          <p style="color: #666; font-size: 14px;">
            If the button doesn't work, you can also copy and paste this link into your browser:
          </p>
          <p style="word-break: break-all; color: #666; font-size: 14px;">
            ${resetUrl}
          </p>
          <p style="color: #666; font-size: 12px; margin-top: 30px;">
            This password reset link will expire in 24 hours.
          </p>
          <p style="color: #666; font-size: 12px;">
            If you didn't request this password reset, you can safely ignore this email.
          </p>
        </div>
      `,
      text: `
        Password Reset Request
        
        Hi ${name},
        
        You requested to reset your password. Please visit this link to set a new password:
        
        ${resetUrl}
        
        This password reset link will expire in 24 hours.
        
        If you didn't request this password reset, you can safely ignore this email.
      `,
    }

    const result = await transporter.sendMail(mailOptions)
    console.log('Password reset email sent successfully:', result)
  } catch (error) {
    console.error('Failed to send password reset email:', error)
    throw new Error('Failed to send password reset email')
  }
}
