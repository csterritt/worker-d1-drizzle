import { jsxRenderer } from 'hono/jsx-renderer'

export const renderer = jsxRenderer(({ children }) => {
  return (
    <html lang='en'>
      <head>
        <meta charSet='UTF-8' />
        <meta name='viewport' content='width=device-width, initial-scale=1.0' />
        <link rel='stylesheet' href='/style-XXXXXX.css' type='text/css' />
        <title>Worker, D1, Drizzle</title>
      </head>
      <body>{children}</body>
    </html>
  )
})
