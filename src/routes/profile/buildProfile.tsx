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
import { Bindings } from '../../local-types'
import { useLayout } from '../buildLayout'
import { setupNoCacheHeaders } from '../../lib/setup-no-cache-headers'

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

/**
 * Render the JSX for the profile page.
 * @param userName - User's name
 * @param userEmail - User's email
 */
const renderProfile = (userName: string, userEmail: string) => {
  const questionOfTheDay = getQuestionOfTheDay()

  return (
    <div data-testid='profile-page' className='flex justify-center'>
      <div className='card w-full max-w-2xl bg-base-100 shadow-xl'>
        <div className='card-body'>
          <h2 className='card-title text-2xl font-bold mb-4'>Profile</h2>

          {/* User Information Section */}
          <div className=''>
            <h3 className='text-lg font-semibold mb-3'>Your Information</h3>
            <div className='space-y-2'>
              <div className='flex flex-col'>
                <span className='text-sm text-gray-500'>Name</span>
                <span className='text-base' data-testid='profile-name'>
                  {userName}
                </span>
              </div>
              <div className='flex flex-col'>
                <span className='text-sm text-gray-500'>Email</span>
                <span className='text-base' data-testid='profile-email'>
                  {userEmail}
                </span>
              </div>
            </div>
          </div>

          <div className='divider my-2'></div>

          {/* Change Password Section */}
          <div>
            <h3 className='text-lg font-semibold mb-3'>Change Password</h3>
            <form
              method='post'
              action={PATHS.PROFILE}
              className='flex flex-col gap-4'
              aria-label='Change password form'
              noValidate
            >
              <div className='form-control w-full'>
                <label className='label' htmlFor='current-password'>
                  <span className='label-text'>Current Password</span>
                </label>
                <input
                  id='current-password'
                  name='currentPassword'
                  type='password'
                  placeholder='Enter your current password'
                  required
                  className='input input-bordered w-full'
                  data-testid='current-password-input'
                  aria-label='Current Password'
                />
              </div>

              <div className='form-control w-full'>
                <label className='label' htmlFor='new-password'>
                  <span className='label-text'>New Password</span>
                </label>
                <input
                  id='new-password'
                  name='newPassword'
                  type='password'
                  placeholder='Enter your new password'
                  required
                  minLength={8}
                  className='input input-bordered w-full'
                  data-testid='new-password-input'
                  aria-label='New Password'
                />
              </div>

              <div className='form-control w-full'>
                <label className='label' htmlFor='confirm-password'>
                  <span className='label-text'>Confirm New Password</span>
                </label>
                <input
                  id='confirm-password'
                  name='confirmPassword'
                  type='password'
                  placeholder='Confirm your new password'
                  required
                  minLength={8}
                  className='input input-bordered w-full'
                  data-testid='confirm-password-input'
                  aria-label='Confirm Password'
                />
              </div>

              <div className='divider my-2'></div>

              {/* Humorous Question */}
              <div className='form-control w-full'>
                <span
                  className='text-sm text-gray-600 italic'
                  data-testid='humorous-question'
                >
                  {questionOfTheDay}
                </span>
              </div>

              <div className='card-actions justify-end mt-4'>
                <button
                  type='submit'
                  className='btn btn-primary'
                  data-testid='change-password-action'
                >
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
    (c: Context) => {
      setupNoCacheHeaders(c)

      const user = c.get('user')

      // Redirect to sign-in if not authenticated
      if (!user) {
        return c.redirect(PATHS.AUTH.SIGN_IN)
      }

      const userName = user.name || 'User'
      const userEmail = user.email || ''

      return c.render(useLayout(c, renderProfile(userName, userEmail)))
    }
  )
}
