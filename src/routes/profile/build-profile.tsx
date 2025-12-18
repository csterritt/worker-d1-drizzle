/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/**
 * Route builder for the profile page.
 * @module routes/profile/buildProfile
 */
import { Context, Hono } from 'hono'
import { secureHeaders } from 'hono/secure-headers'

import { PATHS, STANDARD_SECURE_HEADERS } from '../../constants'
import type { AuthUser, Bindings } from '../../local-types'
import { useLayout } from '../build-layout'
import { setupNoCacheHeaders } from '../../lib/setup-no-cache-headers'
import { signedInAccess } from '../../middleware/signed-in-access'

/**
 * List of humorous questions for the optional user information field
 */
const HUMOROUS_QUESTIONS = [
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

/**
 * Get a humorous question based on the current date
 * Uses a simple deterministic selection based on day of year
 */
const getQuestionOfTheDay = (): string => {
  const now = new Date()
  const start = new Date(now.getFullYear(), 0, 0)
  const diff = now.getTime() - start.getTime()
  const oneDay = 1000 * 60 * 60 * 24
  const dayOfYear = Math.floor(diff / oneDay)

  const index = dayOfYear % HUMOROUS_QUESTIONS.length
  return HUMOROUS_QUESTIONS[index]
}

const getSignedInUser = (c: Context): AuthUser => {
  const user = c.get('user') as AuthUser | undefined | null
  return user as AuthUser
}

/**
 * Render the JSX for the profile page.
 * @param userName - User's name
 * @param userEmail - User's email
 */
const renderProfile = (userName: string, userEmail: string) => {
  const questionOfTheDay = getQuestionOfTheDay()

  return (
    <div data-testid='profile-page'>
      <div>
        <div>
          <div>
            <h2>Profile</h2>
            <a href={PATHS.PRIVATE} data-testid='go-back-action'>
              Back
            </a>
          </div>

          {/* User Information Section */}
          <div className=''>
            <h3>Your Information</h3>
            <div>
              <div>
                <span>Name</span>
                <span data-testid='profile-name'>{userName}</span>
              </div>
              <div>
                <span>Email</span>
                <span data-testid='profile-email'>{userEmail}</span>
              </div>
            </div>
          </div>

          <div></div>

          {/* Change Password Section */}
          <div>
            <h3>Change Password</h3>
            <form
              method='post'
              action={PATHS.PROFILE}
              aria-label='Change password form'
              noValidate
            >
              <div>
                <label htmlFor='current-password'>
                  <span>Current Password</span>
                </label>
                <input
                  id='current-password'
                  name='currentPassword'
                  type='password'
                  placeholder='Enter your current password'
                  required
                  data-testid='current-password-input'
                  aria-label='Current Password'
                />
              </div>

              <div>
                <label htmlFor='new-password'>
                  <span>New Password</span>
                </label>
                <input
                  id='new-password'
                  name='newPassword'
                  type='password'
                  placeholder='Enter your new password'
                  required
                  minLength={8}
                  data-testid='new-password-input'
                  aria-label='New Password'
                />
              </div>

              <div>
                <label htmlFor='confirm-password'>
                  <span>Confirm New Password</span>
                </label>
                <input
                  id='confirm-password'
                  name='confirmPassword'
                  type='password'
                  placeholder='Confirm your new password'
                  required
                  minLength={8}
                  data-testid='confirm-password-input'
                  aria-label='Confirm Password'
                />
              </div>

              <div></div>

              {/* Humorous Question */}
              <div>
                <span data-testid='humorous-question'>{questionOfTheDay}</span>
              </div>

              <div>
                <button type='submit' data-testid='change-password-action'>
                  Change Password
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Attach the profile route to the app.
 * @param app - Hono app instance
 */
export const buildProfile = (app: Hono<{ Bindings: Bindings }>): void => {
  app.get(
    PATHS.PROFILE,
    secureHeaders(STANDARD_SECURE_HEADERS),
    signedInAccess,
    (c: Context) => {
      const user = getSignedInUser(c)
      const userName = user.name || 'User'
      const userEmail = user.email || ''

      setupNoCacheHeaders(c)
      return c.render(useLayout(c, renderProfile(userName, userEmail)))
    }
  )
}
