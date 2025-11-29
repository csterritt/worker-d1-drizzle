/**
 * Centralized test data for E2E tests
 * Eliminates hardcoded credentials scattered across test files
 */

export const TEST_USERS = {
  // Known user from seeded test database
  KNOWN_USER: {
    email: 'fredfred@team439980.testinator.com',
    password: 'freds-clever-password',
    name: 'FredF',
  },

  // Standard new user for sign-up tests
  NEW_USER: {
    email: 'testuser@example.com',
    password: 'securepassword123',
    name: 'Test User',
  },

  // For testing duplicate email scenarios
  DUPLICATE_USER: {
    email: 'duplicate@example.com',
    password: 'password123',
    name: 'Duplicate User',
  },

  // For gated sign-up tests
  GATED_USER: {
    email: 'gated-test@example.com',
    password: 'securepassword123',
    name: 'Gated Test User',
  },

  // For interest sign-up tests
  INTERESTED_USER: {
    email: 'interested-user@example.com',
    password: 'securepassword123',
    name: 'Interested User',
  },

  // For reset password tests
  RESET_USER: {
    email: 'reset-test@example.com',
    password: 'newpassword123',
    name: 'Reset User',
  },
} as const

export const GATED_CODES = {
  WELCOME: 'WELCOME2024',
  BETA: 'BETA-ACCESS-123',
  EARLY_BIRD: 'EARLY-BIRD-456',
  PREMIUM: 'PREMIUM-ACCESS-789',
  DEVELOPER: 'DEV-PREVIEW-101',
} as const

export const INVALID_DATA = {
  EMAILS: [
    'invalid-email',
    'not-an-email',
    '@invalid.com',
    'user@',
    'user@.com',
  ],
  PASSWORDS: [
    '', // empty
    '123', // too short
    'weak', // too simple
  ],
  CODES: ['INVALID-CODE', 'EXPIRED-123', 'WRONG-FORMAT'],
} as const

export const ERROR_MESSAGES = {
  // Authentication errors
  INVALID_CREDENTIALS:
    'Invalid email or password. Please check your credentials and try again.',
  EMAIL_NOT_VERIFIED:
    'Please verify your email address before signing in. Check your email for a verification link.',
  MUST_SIGN_IN: 'You must sign in to visit that page',
  SIGN_OUT_SUCCESS: 'You have been signed out successfully.',
  SIGN_IN_SUCCESS: 'Welcome! You have been signed in successfully.',

  // Validation errors
  INVALID_EMAIL: 'Please enter a valid email address.',
  EMAIL_REQUIRED: 'Please enter your email address.',
  PASSWORD_REQUIRED: 'Please enter your password.',
  NAME_REQUIRED: 'Please enter your name.',
  CODE_REQUIRED: 'Please enter a valid sign-up code.',

  // Sign-up errors
  DUPLICATE_EMAIL:
    'An account with this email already exists. Please check your email for a verification link or sign in if you have already verified your account.',
  INVALID_CODE:
    'Invalid or expired sign-up code. Please check your code and try again.',

  // Interest sign-up messages
  WAITLIST_SUCCESS:
    "Thanks! You've been added to our waitlist. We'll notify you when we start accepting new accounts.",
  ALREADY_ON_WAITLIST:
    "Thanks! Your email is already on our waitlist. We'll notify you when we're accepting new accounts.",

  // Reset password messages
  RESET_LINK_SENT:
    "If an account with that email exists, we've sent you a password reset link.",
  PASSWORD_RESET_SUCCESS:
    'Your password has been successfully reset. You can now sign in with your new password.',
} as const

export const BASE_URLS = {
  HOME: 'http://localhost:3000',
  SIGN_IN: 'http://localhost:3000/auth/sign-in',
  SIGN_UP: 'http://localhost:3000/auth/sign-up',
  INTEREST_SIGN_UP: 'http://localhost:3000/auth/interest-sign-up',
  FORGOT_PASSWORD: 'http://localhost:3000/auth/forgot-password',
  AWAIT_VERIFICATION: 'http://localhost:3000/auth/await-verification',
  PRIVATE: 'http://localhost:3000/private',
  WAITING_FOR_RESET: 'http://localhost:3000/auth/waiting-for-reset',
  PROFILE: 'http://localhost:3000/profile',
} as const
