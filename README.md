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

Provider settings live in **Administration → Auth Config, Email Config or Storage Config**. Stored passwords and secrets are encrypted with the installation's AUTH_SECRET. Keep this secret consistent across restarts and include it in your private backup.

- **Email** uses SMTP for verification, password recovery and support reply notifications. For local delivery run Mailpit, use its SMTP host and port, set a sender address, and inspect the Mailpit inbox. Set implicit TLS to `yes` for port 465.
- **Google and GitHub sign-in** appear after saving a client ID and secret. Register the callback `<APP_URL>/api/auth/callback/google` or `<APP_URL>/api/auth/callback/github` with the provider.
- **Private files** use a private S3-compatible bucket. Enter the endpoint, region, bucket and credentials. Uploads are limited to 8 MiB. To download, the server checks ownership or the staff assets permission and returns a short-lived signed URL.
- **Country statistics** group registered accounts by the two-letter country code entered on their profile. Accounts without a country are shown as unknown.
- The local `admin` role has all permissions. Create a role under **Roles**, then assign it from a user detail page. Registration always creates an ordinary member.

## Build and check

```sh
pnpm build
pnpm check
pnpm validate:all
pnpm start
```

For deployment set APP_URL to the site's HTTPS origin, AUTH_SECRET to a random secret of at least 32 characters and DATABASE_PATH to a SQLite file on a writable persistent volume. In production mirror the origin and port through your reverse proxy. The test starts a built server with a temporary database and verifies two-user isolation and administrative support actions. To include real S3 upload and download, supply TEST_S3_ENDPOINT, TEST_S3_BUCKET, TEST_S3_KEY and TEST_S3_SECRET for a disposable bucket. To include real email verification and password reset, supply TEST_MAILPIT_URL and TEST_SMTP_PORT for a local Mailpit instance.

## Deploy

The production container runs the standalone Node server. Give it an HTTPS
origin in `APP_URL`, a stable `AUTH_SECRET` of at least 32 characters, and a
persistent volume at `/app/data`. Route HTTPS requests to the container's
port 3000 through your reverse proxy.

```sh
docker build -t kernlift-free .
docker run -d --name kernlift-free --restart unless-stopped \
  --env-file .env.production --mount type=volume,src=kernlift-free-data,dst=/app/data \
  -p 127.0.0.1:3000:3000 kernlift-free
```

On Railway, attach the persistent volume at `/app/data` to one web replica.
Generate a public domain for port 3000 and set `APP_URL` to its HTTPS origin.
Set `AUTH_SECRET` in the service variables and use `RAILWAY_RUN_UID=0` for
Railway's root-owned volume. The deployment health check initializes SQLite
and verifies the authentication provider settings can be read.

After registering the first administrator, promote the account using
`node scripts/admin.mjs <registered-user-id>` inside the running container.

## Free 功能与入口

默认页面使用英文。路径前加 `/zh` 即可使用简体中文，例如 `/zh/admin/support`。

| 功能 | 管理端 | 用户端 |
| --- | --- | --- |
| 账户与地区 | `/admin` 查看近 7、30、90 天注册趋势，`/admin/users/dashboard` 搜索用户，从详情管理角色和账户状态，`/admin/countries` 查看全部或同期地区分布 | `/app` 显示本人数据，`/app/profile` 修改姓名、地区与客服通知偏好，查看验证状态、重发验证邮件或删除账户 |
| 认证和邮件 | `/admin/config/auth` 配置邮箱密码、邮箱验证及 Google、GitHub OAuth，`/admin/config/email` 配置 SMTP | 注册、登录、邮箱验证、找回和重置密码 |
| 角色、权限与审计 | `/admin/roles` 管理角色并分配，`/admin/permissions` 查看权限和授权角色，`/admin/audit` 查询并导出操作记录 | 按当前用户权限显示入口，服务端检查访问权限 |
| 客服 | `/admin/support` 查看队列和详情、公开回复、写内部备注、分配并更新状态 | `/app/tickets` 提单、跟帖和关闭工单，`/app/tickets/closed` 查看已关闭工单 |
| 私有文件 | `/admin/assets` 检索文件，`/admin/config/storage` 配置 S3 兼容存储 | `/app/assets` 查看本人文件，进入上传页、文件详情或下载 |
| 安装与公开页面 | `/setup`、`/onboarding` 查看本版服务配置并进入设置 | 首页、关于、联系、静态定价和升级链接、隐私与条款示例、通用状态页 |

页面入口位于 `src/routes/{-$locale}/`。管理组件、账户、资料和工单表单在 `src/components/`，权限和业务数据在 `src/server/`。开发者可以通过 `src/extensions.ts` 添加工作台导航入口。
