/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import { jsxRenderer } from 'hono/jsx-renderer'

export const renderer = jsxRenderer(({ children }) => {
  return (
    <html lang='en'>
      <head>
        <meta charSet='UTF-8' />
        <meta name='viewport' content='width=device-width, initial-scale=1.0' />
        <link
          rel='stylesheet'
          href='/style-20250722184943.css'
          type='text/css'
        />
        <title>Worker, D1, Drizzle</title>
      </head>
      <body className='font-slabserif'>{children}</body>
    </html>
  )
})
