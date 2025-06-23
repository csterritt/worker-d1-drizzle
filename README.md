### Basic CloudFlare worker+d1+drizzle app with magic-code sign-in

#### Setup

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

#### Adding initial users and count via sqlite3:

Change 'your-email@your-provider.com' to your actual email address.

    insert into user (id, email, emailVerified, createdAt, updatedAt) values ('aaaaa', 'your-email@your-provider.com', true, '1745988806997', '1745988806997');
    insert into user (id, email, emailVerified, createdAt, updatedAt) values ('aaaab', 'fredfred@team439980.testinator.com', true, '1745988806997', '1745988806997');
    insert into user (id, email, emailVerified, createdAt, updatedAt) values ('aaaac', 'fredfred2@team439980.testinator.com', true, '1745988806997', '1745988806997');
    insert into user (id, email, emailVerified, createdAt, updatedAt) values ('aaaad', 'rate-limit-user1@team439980.testinator.com', true, '1745988806997', '1745988806997');
    insert into user (id, email, emailVerified, createdAt, updatedAt) values ('aaaae', 'rate-limit-user2@team439980.testinator.com', true, '1745988806997', '1745988806997');
    insert into count (id, count) values ('foo', 0);

To run in production, set the following environment variables:

    SMTP_SERVER_HOST='<your email hosting provider>'
    SMTP_SERVER_PORT='<numeric port>'
    SMTP_SERVER_USER='<user name for email hosting provider>'
    SMTP_SERVER_PASSWORD='<password for email hosting provider>'
