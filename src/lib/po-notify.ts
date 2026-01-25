/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import { Context } from 'hono'

import { API_URLS } from '../constants'
import type { Bindings, PushoverMessage } from '../local-types'

type AppContext = Context<{ Bindings: Bindings }>

const post = async (url: string, data: PushoverMessage): Promise<Response> => {
  /**
   * gatherResponse awaits and returns a response body as a string.
   * Use await gatherResponse(...) in an async function to get the response body
   * @param {Response} response
   */
  const gatherResponse = async (response: Response): Promise<string> => {
    const { headers } = response
    const contentType = headers.get('content-type') || ''
    if (contentType.includes('application/json')) {
      return JSON.stringify(await response.json())
    } else if (contentType.includes('application/text')) {
      return response.text()
    } else if (contentType.includes('text/html')) {
      return response.text()
    } else {
      return response.text()
    }
  }

  const init = {
    body: JSON.stringify(data),
    method: 'POST',
    headers: {
      'content-type': 'application/json;charset=UTF-8',
    },
  }
  const response = await fetch(url, init)
  const results = await gatherResponse(response)
  return new Response(results, init)
}

export const pushoverNotify = async (
  c: AppContext,
  message: string
): Promise<void> => {
  const appId = c.env.PO_APP_ID?.trim()
  const userId = c.env.PO_USER_ID?.trim()

  if (appId && userId) {
    const msg: PushoverMessage = {
      token: appId,
      user: userId,
      message,
    }

    try {
      if (c.env.NODE_ENV !== 'development') {
        await post(API_URLS.PUSHOVER, msg)
      } else {
        console.log(`========> Notify would have been sent in production:`)
        console.log(`========> ${message}`)
      }
    } catch (err) {
      console.log(`pushoverNotify final error:`, err)
    }
  }
}
