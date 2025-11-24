import { test, expect } from '@playwright/test'

import { getElementText } from '../support/finders'
import { testWithDatabase } from '../support/test-helpers'
import { navigateToProfile } from '../support/navigation-helpers'
import { submitSignInForm } from '../support/form-helpers'
import { TEST_USERS, BASE_URLS } from '../support/test-data'

test(
  'humorous question is displayed and deterministic',
  testWithDatabase(async ({ page }) => {
    // Sign in first
    await page.goto(BASE_URLS.SIGN_IN)
    await submitSignInForm(page, TEST_USERS.KNOWN_USER)

    // Navigate to profile
    await navigateToProfile(page)

    // Get the humorous question
    const question1 = await getElementText(page, 'humorous-question')
    expect(question1).toBeTruthy()
    expect(question1!.length).toBeGreaterThan(10)

    // Refresh the page
    await page.reload()

    // Question should be the same (deterministic based on date)
    const question2 = await getElementText(page, 'humorous-question')
    expect(question2).toBe(question1)
  })
)

test(
  'humorous question is one of the expected questions',
  testWithDatabase(async ({ page }) => {
    const expectedQuestions = [
      'How many of your chickens play the oboe?',
      'How many pancakes did you use to shingle your doghouse?',
      'How many squirrels have you trained to perform interpretive dance?',
      'On a scale of 1 to 10, how often do you argue with your houseplants?',
      'How many times have you mistaken a hat for a snack?',
      'How many invisible friends attended your last birthday party?',
      'How many spoons have you lost to the "spoon vortex" in your kitchen?',
      'How many clouds have you successfully herded this week?',
      'How many times have you tried to high-five a pigeon?',
      'How many socks have mysteriously vanished into the dryer dimension?',
      'How many hours have you spent teaching your pet rock to fetch?',
      'How many parallel universes do you suspect your keys are hiding in?',
      'How many times have you won an argument with your reflection?',
    ]

    // Sign in first
    await page.goto(BASE_URLS.SIGN_IN)
    await submitSignInForm(page, TEST_USERS.KNOWN_USER)

    // Navigate to profile
    await navigateToProfile(page)

    // Get the humorous question
    const question = await getElementText(page, 'humorous-question')

    // Verify it's one of the expected questions
    expect(expectedQuestions).toContain(question)
  })
)
