import { test } from '@playwright/test'

export type SignUpMode =
  | 'OPEN_SIGN_UP'
  | 'NO_SIGN_UP'
  | 'GATED_SIGN_UP'
  | 'INTEREST_SIGN_UP'
  | 'BOTH_SIGN_UP'

/**
 * Detects the current sign-up mode by calling the test endpoint
 */
export const detectSignUpMode = async (): Promise<SignUpMode> => {
  try {
    const response = await fetch('http://localhost:3000/test/sign-up-mode')

    if (!response.ok) {
      console.error(
        'Failed to fetch sign-up mode:',
        response.status,
        response.statusText
      )
      // Default to OPEN_SIGN_UP if endpoint fails
      return 'OPEN_SIGN_UP'
    }

    const mode = (await response.text()).trim()

    // Validate the response and return appropriate mode
    if (mode === 'NO_SIGN_UP') {
      return 'NO_SIGN_UP'
    } else if (mode === 'OPEN_SIGN_UP') {
      return 'OPEN_SIGN_UP'
    } else if (mode === 'GATED_SIGN_UP') {
      return 'GATED_SIGN_UP'
    } else if (mode === 'INTEREST_SIGN_UP') {
      return 'INTEREST_SIGN_UP'
    } else if (mode === 'BOTH_SIGN_UP') {
      return 'BOTH_SIGN_UP'
    } else {
      console.warn(
        'Unknown sign-up mode returned:',
        mode,
        'defaulting to OPEN_SIGN_UP'
      )
      return 'OPEN_SIGN_UP'
    }
  } catch (error) {
    console.error('Failed to detect sign-up mode:', error)
    // Default to OPEN_SIGN_UP if detection fails
    return 'OPEN_SIGN_UP'
  }
}

/**
 * Skip test if not running in the expected mode
 * Tests must match their exact mode - BOTH_SIGN_UP mode has its own tests
 */
export const skipIfNotMode = async (expectedMode: SignUpMode) => {
  const currentMode = await detectSignUpMode()

  if (currentMode !== expectedMode) {
    test.skip(
      currentMode !== expectedMode,
      `Skipping test - requires ${expectedMode} mode, currently in ${currentMode} mode`
    )
  }
}

/**
 * Skip test if running in the specified mode
 */
export const skipIfMode = async (skipMode: SignUpMode) => {
  const currentMode = await detectSignUpMode()

  if (currentMode === skipMode) {
    test.skip(
      currentMode === skipMode,
      `Skipping test - not applicable in ${currentMode} mode`
    )
  }
}

/**
 * Skip test unless running in BOTH_SIGN_UP mode
 */
export const skipIfNotBothMode = async () => {
  const currentMode = await detectSignUpMode()

  if (currentMode !== 'BOTH_SIGN_UP') {
    test.skip(
      currentMode !== 'BOTH_SIGN_UP',
      `Skipping test - requires BOTH_SIGN_UP mode, currently in ${currentMode} mode`
    )
  }
}
