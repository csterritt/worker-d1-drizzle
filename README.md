### Basic CloudFlare worker+d1+drizzle app with username and password authentication

#### Sign up modes

The app can be configured to run in one of following four modes, by setting the `SIGNUP_MODE`
environment variable:

1. `NO_SIGN_UP` - No sign up allowed
2. `OPEN_SIGN_UP` - Anyone can sign up, as long as they validate their sign in via an email
3. `GATED_SIGN_UP` - Sign up is allowed, with a validation email, but only for users with a single-use sign up code.
4. `INTEREST_SIGN_UP` - Sign up is not allowed, but users can express interest in signing up, by giving their email address.

There are tests for each of these modes (and general functionality) in the `e2e-tests` directory.

#### Setup for development

[For generating/synchronizing types based on your Worker configuration run](https://developers.cloudflare.com/workers/wrangler/commands/#types):

```txt
npm run cf-typegen
```

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

#### Production

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

#### Development

For development, can copy the `.dev.vars.all.template` into `.dev.vars.all` file (which is in `.gitignore`)
in the root directory of the project. See the script `run-dev.sh` for how to run the development server,
and how it sets up `.dev.vars` from the `.dev.vars.all` file. For ease of command line usage, you can use
the `go` script.

### Setting up for production

Change the host name in the files that have the domain name as `mini-auth.example.com` (and `mini-auth.workers.dev`
if needed) to the domain name you want to use for the worker.

### Licensing
See LICENSE.txt
