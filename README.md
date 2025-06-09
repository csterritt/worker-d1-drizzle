```txt
npm install
npm run dev
```

```txt
npm run deploy
```

[For generating/synchronizing types based on your Worker configuration run](https://developers.cloudflare.com/workers/wrangler/commands/#types):

```txt
npm run cf-typegen
```

Pass the `CloudflareBindings` as generics when instantiation `Hono`:

```ts
// src/index.ts
const app = new Hono<{ Bindings: CloudflareBindings }>()
```

----

Note once the drizzle database schema in src/db/schema.ts is updated, run `npx drizzle-kit generate`
again to update the database schema. This will update the generated `drizzle/*.sql` files. Then run
`./build-schema-update.sh` to update the database schema. **NOTE**: If you give an argument to the
`./build-schema-update.sh` script it will update the remote Cloudflare database instead of the local
one, **BUT** it will use the file `./schema-prod.sql` which you need to create from `schema.sql`.
