/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

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

    // Sign up page
    SIGN_UP: '/auth/sign-up',

    // Interest sign up page
    INTEREST_SIGN_UP: '/auth/interest-sign-up',

    // Email confirmation pages
    VERIFY_EMAIL: '/auth/verify-email',
    EMAIL_SENT: '/auth/email-sent',
    AWAIT_VERIFICATION: '/auth/await-verification',
    RESEND_EMAIL: '/auth/resend-email',

    // Password reset pages
    FORGOT_PASSWORD: '/auth/forgot-password',
    WAITING_FOR_RESET: '/auth/waiting-for-reset',
    RESET_PASSWORD: '/auth/reset-password',

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

/*
 * Sign up modes
 */
export const SIGN_UP_MODES = {
  GATED_SIGN_UP: 'GATED_SIGN_UP' as const,
  INTEREST_SIGN_UP: 'INTEREST_SIGN_UP' as const,
  NO_SIGN_UP: 'NO_SIGN_UP' as const,
  OPEN_SIGN_UP: 'OPEN_SIGN_UP' as const,
}

/**
 * Validation patterns and messages
 */
export const VALIDATION = {
  // Patterns
  EMAIL_PATTERN: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,

  // Messages
  REQUIRED: 'This field is required',
  EMAIL_INVALID: 'Please enter a valid email address',
} as const

export const DURATIONS = {
  // EMAIL_RESEND_TIME_IN_MILLISECONDS: 30 * 1000, // PRODUCTION:UNCOMMENT
  EMAIL_RESEND_TIME_IN_MILLISECONDS: 3 * 1000, // PRODUCTION:REMOVE
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

// Security headers
export const STANDARD_SECURE_HEADERS: any = {
  referrerPolicy: 'strict-origin-when-cross-origin',
  contentSecurityPolicy: {
    // defaultSrc: ["'self'", 'https://mini-auth.example.com', 'https://mini-auth.workers.dev'], // PRODUCTION:UNCOMMENT
    defaultSrc: ["'self'"], // PRODUCTION:REMOVE
    baseUri: ["'self'"],
    childSrc: ["'self'"],
    connectSrc: ["'self'"],
    fontSrc: ["'self'", 'https:', 'data:'],
    // formAction: ["'self'", 'https://mini-auth.example.com', 'https://mini-auth.workers.dev'], // PRODUCTION:UNCOMMENT
    formAction: ["'self'"], // PRODUCTION:REMOVE
    frameAncestors: ["'self'"],
    frameSrc: ["'self'"],
    imgSrc: ["'self'", 'data:'],
    manifestSrc: ["'self'"],
    mediaSrc: ["'self'"],
    objectSrc: ["'none'"],
    reportTo: 'endpoint-1',
    sandbox: ['allow-same-origin', 'allow-forms'],
    scriptSrc: ["'self'"],
    styleSrc: ["'self'", "'https:'"],
    styleSrcAttr: ["'none'"],
    styleSrcElem: ["'self'", "'https:'"],
    upgradeInsecureRequests: [],
    workerSrc: ["'none'"],
  },
  permissionsPolicy: {
    fullscreen: ['self'],
    bluetooth: ['self'],
    payment: ['self'],
    syncXhr: [],
    camera: ['self'],
    microphone: ['self'],
    geolocation: ['self'],
    usb: ['self'],
    accelerometer: ['self'],
    gyroscope: ['self'],
    magnetometer: ['self'],
  },
}

export const ALLOW_SCRIPTS_SECURE_HEADERS: any = {
  ...STANDARD_SECURE_HEADERS,
  contentSecurityPolicy: {
    ...STANDARD_SECURE_HEADERS.contentSecurityPolicy,
    sandbox: ['allow-same-origin', 'allow-scripts', 'allow-forms'],
  },
}
