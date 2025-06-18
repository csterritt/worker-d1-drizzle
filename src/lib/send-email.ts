import nodemailer from 'nodemailer'
import retry from 'async-retry'
import Result from 'true-myth/result'

import { STANDARD_RETRY_OPTIONS } from '../constants'

/**
 * Sends an email using SMTP with the provided details
 *
 * @param fromAddress - The email address to send from
 * @param toAddress - The email address to send to
 * @param subject - The subject of the email
 * @param content - The HTML content of the email
 * @returns A promise that resolves when the email is sent
 * @throws Error if SMTP configuration is missing or if sending fails
 */
export const sendEmail = async (
  fromAddress: string,
  toAddress: string,
  subject: string,
  content: string
): Promise<void> => {
  // Get SMTP configuration from environment variables
  const port = process.env.SMTP_SERVER_PORT
  const host = process.env.SMTP_SERVER_HOST
  const user = process.env.SMTP_SERVER_USER
  const password = process.env.SMTP_SERVER_PASSWORD

  // Validate that all required SMTP configuration is present
  if (!port || !host || !user || !password) {
    throw new Error(
      'Missing SMTP configuration. Please set SMTP_SERVER_PORT, SMTP_SERVER_HOST, SMTP_SERVER_USER, and SMTP_SERVER_PASSWORD environment variables.'
    )
  }

  // Create a transporter with the SMTP configuration
  const transporter = nodemailer.createTransport({
    port: parseInt(port, 10),
    host,
    auth: {
      user,
      pass: password,
    },
    secure: true, // Use TLS
  })

  // Define the email options
  const mailOptions = {
    from: fromAddress,
    to: toAddress,
    subject,
    html: content,
  }

  try {
    // Send the email
    await transporter.sendMail(mailOptions)
    console.log(`Email sent successfully to ${toAddress}`)
  } catch (error) {
    console.error('Error sending email:', error)
    throw new Error(
      `Failed to send email: ${error instanceof Error ? error.message : String(error)}`
    )
  }
}

export const sendOtpToUserViaEmail = async (
  email: string,
  otp: string,
  emailAgent: typeof sendEmail = sendEmail
): Promise<Result<boolean, Error>> => {
  let res: Result<boolean, Error>
  try {
    res = await retry(
      () => sendOtpToUserViaEmailActual(email, otp, emailAgent),
      STANDARD_RETRY_OPTIONS
    )
  } catch (err) {
    console.log(`sendOtpToUserViaEmail final error:`, err)
    res = Result.err(err instanceof Error ? err : new Error(String(err)))
  }

  return res
}

const sendOtpToUserViaEmailActual = async (
  email: string,
  otp: string,
  emailAgent: typeof sendEmail
): Promise<Result<boolean, Error>> => {
  try {
    await emailAgent(
      'noreply@cls.cloud',
      email,
      'Your Mini-Auth Verification Code',
      `<h1>Verification Code</h1>
         <p>Your verification code is: <strong>${otp}</strong></p>
         <p>This code will expire in 15 minutes.</p>`
    )
    console.log(`Email with OTP code sent to ${email}`)
    return Result.ok(true)
  } catch (e) {
    throw Result.err(e instanceof Error ? e : new Error(String(e)))
  }
}
