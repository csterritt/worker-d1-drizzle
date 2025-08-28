### Basic CloudFlare worker+d1+drizzle app with username and password authentication

Standard sign in, and password reset via email routes are provided.

#### Sign up modes

The app can be configured to run in one of following four modes, by setting the `SIGN_UP_MODE`
environment variable:

1. `NO_SIGN_UP` - No sign up allowed
2. `OPEN_SIGN_UP` - Anyone can sign up, as long as they validate their sign in via an email
3. `GATED_SIGN_UP` - Sign up is allowed, with a validation email, but only for users with a single-use sign up code.
4. `INTEREST_SIGN_UP` - Sign up is not allowed, but users can express interest in signing up, by giving their email address.

There are tests for each of these modes (and general functionality) in the `e2e-tests` directory.

#### 404 behavior

This app responds to unknown routes with a rendered 404 page but an HTTP 200 status. End-to-end
tests intentionally assert a 200 status while checking that the response body contains the 404-page
content (e.g., "Page Not Found").

#### Setup for development

[For generating/synchronizing types based on your Worker configuration run](https://developers.cloudflare.com/workers/wrangler/commands/#types):

```txt
npm run cf-typegen
```

#### Styling

The app uses the [Sakura](https://github.com/oxalorg/sakura) CSS theme. It's a class-free system that
just decorates HTML elements, as a basic start to styling. You can remove it and the `normalize.css`
file, remove loading them from `renderer.tsx`, and you'll be left with a plain HTML page.

There is another git branch for this project named `tailwind-css-and-daisyui` that uses Tailwind
CSS and DaisyUI. It is functionally identical, just styled differently.

#### Development quickstart

- Install dependencies:

  ```bash
  npm install
  ```
  
- Install the `mailpit` SMTP sink. See the [mailpit installation documentation](https://mailpit.axllent.org/docs/install/)
for instructions for your platform.

- Set up the D1 database:

  ```bash
  wrangler d1 create <DATABASE_NAME>
  ```

Then set the `CLOUDFLARE_DATABASE_ID` environment variable to the ID of the database. Also set
the "database_id" in the "d1_databases" section of the `wrangler.jsonc` file to the ID of the
database.
  
- Set up the local D1 database schema:

  ```bash
  ./build-schema-update.sh
  ```
  
Also see the "Adding initial users via sqlite3" below.

- Copy the `.dev.vars.all.template` to `.dev.vars.all` and fill in the values for your environment.

- Start the dev server in a specific sign-up mode:

  ```bash
  npm run dev-open-sign-up
  npm run dev-gated-sign-up
  npm run dev-interest-sign-up
  npm run dev-no-sign-up
  ```

- These scripts call `./run-dev.sh <mode>`, which:
  - Exports `SIGN_UP_MODE` for Wrangler.
  - Starts Wrangler dev and Mailpit (SMTP sink) concurrently.

- Mailpit UI (for viewing sent emails) is available at:
  - http://localhost:8025

#### Database migrations

Note once the drizzle database schema in src/db/schema.ts is updated, run `npx drizzle-kit generate`
again to update the database schema. This will update the generated `drizzle/*.sql` files. Then run
`./build-schema-update.sh` to update the database schema. **NOTE**: If you give an argument to the
`./build-schema-update.sh` script it will update the remote Cloudflare database instead of the local
one, **BUT** it will use the file `./schema-prod.sql` which you need to create from `schema.sql`.

#### Adding initial users via sqlite3:

You can add users to the local sqlite3 database as follows. Change 'your-email@your-provider.com' to
your actual email address. Note that `createdAt` and `updatedAt` are set to the current time in
milliseconds since the epoch.

    insert into user (id, email, emailVerified, createdAt, updatedAt) values ('aaaaa', 'your-email@your-provider.com', true, SELECT strftime('%s', 'now') * 1000, SELECT strftime('%s', 'now') * 1000);

You'll want to use the `wrangler d1` commands to add users to the remote Cloudflare database.

#### Running E2E tests

1. Start the dev server in the desired mode (see Development quickstart above).
2. Run all tests:

   ```bash
   npx playwright test
   ```
   
Alternatively, you can run the `ui-tests.sh` script to bring up the UI to run the tests, and
see the intermediate steps of each test.

3. Mode-specific tests are skipped automatically when not in the matching `SIGN_UP_MODE`.
4. Tests use helpers from `e2e-tests/support/` for navigation, forms, workflows, and validation.

#### Production

The only javascript served to clients in this entire project is in the `buildRoot.tsx` file. It
is used to display a sign-out message if one is present in the cookie. This is done to allow
the `index.html` file to be built, and then put into the `/public` directory so that it's
treated as a static file by Cloudflare. The thinking behind this is that people will come to
the website, see the description of the product or service, and many (alas :-) will decide it's
not for them. So they leave, without causing a single Cloudflare worker execution. The
`prod_deploy.sh` (currently untested, and probably broken) builds the `public/index.html`, but
then removes it. The `index.ts` file would need to be changed to add `// PRODUCTION:REMOVE`
comments to the import and call to `buildRoot`.

In production, notifications can be made via the [Pushover](https://pushover.net) web service. None are
currently done, and this service is optional; if you don't want to use Pushover, just don't set the
`PO_APP_ID` and `PO_USER_ID` environment variables.

To run in production, set the following environment variables on Cloudflare:

    SMTP_SERVER_HOST='<your email hosting provider>'
    SMTP_SERVER_PORT='<numeric port>'
    SMTP_SERVER_USER='<user name for email hosting provider>'
    SMTP_SERVER_PASSWORD='<password for email hosting provider>'

    CLOUDFLARE_ACCOUNT_ID='<your cloudflare account id>'
    CLOUDFLARE_DATABASE_ID='<your cloudflare database id>'
    CLOUDFLARE_D1_TOKEN='<your cloudflare d1 access token>'

    PO_APP_ID='<your pushover app id>'
    PO_USER_ID='<your pushover user id>'

##### Dev-only routes and flags

Several routes and configuration toggles are intended only for development and testing and are
marked in the code with `// PRODUCTION:REMOVE` or `// PRODUCTION:UNCOMMENT`. Ensure these are
not enabled in production builds. The `prod_deploy.sh` script runs the
`clean-for-production.rb` script, which removes all dev-only routes and flags. Note that the
`prod_deploy.sh` script is currently untested, and probably broken.

#### Development execution

For development, you can use the `go` script with the appropriate single-letter indicator for the
sign-up mode.

### Setting up for production

Change the host name in the files that have the domain name as `mini-auth.example.com` (and
`mini-auth.workers.dev` if needed) to the domain name you want to use for the worker.

**TODO**: Document build-to-production steps.

### Licensing
See LICENSE.txt
