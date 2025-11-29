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
 * BOTH_SIGN_UP mode supports both GATED_SIGN_UP and INTEREST_SIGN_UP tests
 */
export const skipIfNotMode = async (expectedMode: SignUpMode) => {
  const currentMode = await detectSignUpMode()

  // BOTH_SIGN_UP mode supports gated and interest sign-up tests
  if (currentMode === 'BOTH_SIGN_UP') {
    if (
      expectedMode === 'GATED_SIGN_UP' ||
      expectedMode === 'INTEREST_SIGN_UP'
    ) {
      return // Don't skip - BOTH mode supports these tests
    }
  }

  if (currentMode !== expectedMode) {
    test.skip(
      true,
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
    test.skip(true, `Skipping test - not applicable in ${currentMode} mode`)
  }
}

/**
 * Skip test if not running in the exact expected mode (strict check)
 * Unlike skipIfNotMode, this does NOT allow BOTH_SIGN_UP to run GATED/INTEREST tests
 */
export const skipIfNotExactMode = async (expectedMode: SignUpMode) => {
  const currentMode = await detectSignUpMode()

  if (currentMode !== expectedMode) {
    test.skip(
      true,
      `Skipping test - requires exactly ${expectedMode} mode, currently in ${currentMode} mode`
    )
  }
}
