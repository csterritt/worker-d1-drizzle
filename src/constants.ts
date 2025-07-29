/**
 * Path constants for the application.
 * @module constants
 */

/**
 * All HTML status codes used in the app.
 * @readonly
 */
export const HTML_STATUS = {
  SEE_OTHER: 303 as const,
  CONTENT_TOO_LARGE: 413 as const,
} as const

/**
 * All route paths used in the app.
 * @readonly
 */
export const PATHS = {
  ROOT: '/' as const,
  PRIVATE: '/private' as const,

  // Auth API paths
  AUTH: {
    // Base path for Better Auth API
    API_BASE: '/api/auth',

    // Sign in page
    SIGN_IN: '/auth/sign-in',

    // Start OTP verification process
    START_OTP: '/auth/start-otp',

    // Finish OTP verification process
    FINISH_OTP: '/auth/finish-otp',

    // Await code page
    AWAIT_CODE: '/auth/await-code',

    // Cancel OTP verification
    CANCEL_OTP: '/auth/cancel-otp',

    // Resend OTP code
    RESEND_CODE: '/auth/resend-code',

    // Set and reset clock (for testing) // PRODUCTION:REMOVE
    SET_CLOCK: '/auth/set-clock', // PRODUCTION:REMOVE
    RESET_CLOCK: '/auth/reset-clock', // PRODUCTION:REMOVE

    // Set DB failures (for testing) // PRODUCTION:REMOVE
    SET_DB_FAILURES: '/auth/set-db-failures', // PRODUCTION:REMOVE

    // Clean sessions for a user (for testing) // PRODUCTION:REMOVE
    CLEAN_SESSIONS: '/auth/clean-sessions', // PRODUCTION:REMOVE

    // Sign out
    SIGN_OUT: '/auth/sign-out',
  },
} as const

// Cookie names
export const COOKIES = {
  // Ordinary message cookie
  MESSAGE_FOUND: 'MESSAGE_FOUND',
  // Error message cookie
  ERROR_FOUND: 'ERROR_FOUND',
  // Email entered cookie
  EMAIL_ENTERED: 'EMAIL_ENTERED',
  // OTP setup timestamp cookie (encrypted)
  OTP_SETUP: 'OTP_SETUP',
  // Session cookie
  SESSION: 'SESSION',
  // Sign out message cookie
  SIGN_OUT_MESSAGE: 'SIGN_OUT_MESSAGE',
  // DB failure count cookie for testing // PRODUCTION:REMOVE
  DB_FAIL_COUNT: 'DB_FAIL_COUNT', // PRODUCTION:REMOVE
  DB_FAIL_INCR: 'DB_FAIL_INCR', // PRODUCTION:REMOVE
  // Standard cookie options
  STANDARD_COOKIE_OPTIONS: {
    path: '/',
    httpOnly: true,
    sameSite: 'Strict',
    // secure: true, // PRODUCTION:UNCOMMENT
    // domain: 'mini-auth.example.com', // PRODUCTION:UNCOMMENT
  },
} as const

/**
 * Validation patterns and messages
 */
export const VALIDATION = {
  // Patterns
  EMAIL_PATTERN: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,

  // Messages
  REQUIRED: 'This field is required',
  EMAIL_INVALID: 'Please enter a valid email address',
  OTP_INVALID: 'Please enter a valid 6-digit code',
} as const

export const DURATIONS = {
  // THIRTY_SECONDS_IN_MILLISECONDS: 30 * 1000, // PRODUCTION:UNCOMMENT
  THIRTY_SECONDS_IN_MILLISECONDS: 3 * 1000, // PRODUCTION:REMOVE
  FIFTEEN_MINUTES_IN_MILLISECONDS: 15 * 60 * 1000,
  SIX_MONTHS_IN_MILLISECONDS: 6 * 30 * 24 * 60 * 60 * 1000,
  RATE_LIMIT_WINDOW_MS: 5 * 60 * 1000, // 5 minutes in milliseconds
}

/**
 * Standard retry options for async operations
 * @readonly
 */
// @ts-ignore
export const STANDARD_RETRY_OPTIONS = {
  // minTimeout: 200, // PRODUCTION:UNCOMMENT
  minTimeout: 20, // PRODUCTION:REMOVE
  retries: 5,
} as const

// API URLs
export const API_URLS = {
  PUSHOVER: 'https://api.pushover.net/1/messages.json',
}
