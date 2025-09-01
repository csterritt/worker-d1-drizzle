/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import { Context } from 'hono'

import { API_URLS } from '../constants'

const post = async (url: string, data: any) => {
  /**
   * gatherResponse awaits and returns a response body as a string.
   * Use await gatherResponse(...) in an async function to get the response body
   * @param {Response} response
   */
  const gatherResponse = async (response: any) => {
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

export const pushoverNotify = async (c: Context, message: string) => {
  if (
    c.env.PO_APP_ID != null &&
    c.env.PO_APP_ID !== '' &&
    c.env.PO_USER_ID != null &&
    c.env.PO_USER_ID !== ''
  ) {
    const msg = {
      token: c.env.PO_APP_ID,
      user: c.env.PO_USER_ID,
      message,
    }

    try {
      await post(API_URLS.PUSHOVER, msg)
    } catch (err) {
      console.log(`pushoverNotify final error:`, err)
    }
  }
}
