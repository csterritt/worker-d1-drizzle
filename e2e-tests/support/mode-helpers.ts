import { test } from '@playwright/test'

/**
 * Detects the current sign-up mode by making a request to check if sign-up routes are available
 */
export async function detectSignUpMode(): Promise<'OPEN_SIGN_UP' | 'NO_SIGN_UP'> {
  try {
    const response = await fetch('http://localhost:3000/auth/sign-up')
    const text = await response.text()
    
    // If the response contains the 404 page banner, we're in NO_SIGN_UP mode
    if (text.includes('404-page-banner') || text.includes('Page Not Found')) {
      return 'NO_SIGN_UP'
    }
    
    // If the response contains the sign-up page banner, we're in OPEN_SIGN_UP mode
    if (text.includes('sign-up-page-banner')) {
      return 'OPEN_SIGN_UP'
    }
    
    // Default to OPEN_SIGN_UP if we can't determine
    return 'OPEN_SIGN_UP'
  } catch (error) {
    console.error('Failed to detect sign-up mode:', error)
    // Default to OPEN_SIGN_UP if detection fails
    return 'OPEN_SIGN_UP'
  }
}

/**
 * Skip test if not running in the expected mode
 */
export async function skipIfNotMode(expectedMode: 'OPEN_SIGN_UP' | 'NO_SIGN_UP') {
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
export async function skipIfMode(skipMode: 'OPEN_SIGN_UP' | 'NO_SIGN_UP') {
  const currentMode = await detectSignUpMode()
  
  if (currentMode === skipMode) {
    test.skip(
      currentMode === skipMode,
      `Skipping test - not applicable in ${currentMode} mode`
    )
  }
}
