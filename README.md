# Kernlift Free

An MIT-licensed TanStack Start SaaS starter with a customer workspace and an administration console. It runs on Node.js and SQLite. Customers can register, edit their profile, open and reply to tickets, and upload private files to S3-compatible storage. Administrators can manage accounts, roles, support requests, provider settings and audit records.

## Run locally

Use Node.js 22.16 or later and pnpm 10.

```sh
git clone https://github.com/kernlift/kernlift-free.git
cd kernlift-free
pnpm install --frozen-lockfile
pnpm run setup
pnpm dev
```

Open http://localhost:5173. Register a user, open **My account** and copy the displayed account ID. From the project directory grant that registered account administrator access.

```sh
pnpm run admin <registered-user-id>
```

Refresh the workspace and select **Administration**. A second registered account lets you exercise the customer and support sides of the same ticket.

## Connect services

Provider settings live in **Administration → Settings**. Stored passwords and secrets are encrypted with the installation's AUTH_SECRET. Keep this secret consistent across restarts and include it in your private backup.

- **Email** uses SMTP for verification, password recovery and support reply notifications. For local delivery run Mailpit, use its SMTP host and port, set a sender address, and inspect the Mailpit inbox. Set implicit TLS to `yes` for port 465.
- **Google and GitHub sign-in** appear after saving a client ID and secret. Register the callback `<APP_URL>/api/auth/callback/google` or `<APP_URL>/api/auth/callback/github` with the provider.
- **Private files** use a private S3-compatible bucket. Enter the endpoint, region, bucket and credentials. Uploads are limited to 8 MiB. To download, the server checks ownership or the staff assets permission and returns a short-lived signed URL.
- **Country statistics** group registered accounts by the two-letter country code entered on their profile. Accounts without a country are shown as unknown.
- The local `admin` role has all permissions. Create a role under **Roles**, then assign it from a user detail page. Registration always creates an ordinary member.

## Build and check

```sh
pnpm build
pnpm typecheck
pnpm test
pnpm start
```

For deployment set APP_URL to the site's HTTPS origin, AUTH_SECRET to a random secret of at least 32 characters and DATABASE_PATH to a SQLite file on a writable persistent volume. In production mirror the origin and port through your reverse proxy. The test starts a built server with a temporary database and verifies two-user isolation and administrative support actions. To include real S3 upload and download, supply TEST_S3_ENDPOINT, TEST_S3_BUCKET, TEST_S3_KEY and TEST_S3_SECRET for a disposable bucket. To include real email verification and password reset, supply TEST_MAILPIT_URL and TEST_SMTP_PORT for a local Mailpit instance.
