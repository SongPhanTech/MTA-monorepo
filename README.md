# MTA monorepo

## Tech stack

Auth: Asgardeo, WSO2
Validation: Zod
Database: PostgreSQL
ORM: Prisma, Zenstack
Backend: Hono, Bun, OpenTelemetry
Frontend: React, Nextjs, Tailwindcss, Antd, Tanstack Query

## Yêu cầu

- NodeJS v20.18.x
- pnpm : <https://pnpm.io/installation>
- bun: <https://bun.sh/>

## Cài đặt thu viên

```bash
pnpm i
```

## Cập nhật CSDL: packages/database

**Note**: Before you edit or add schema in `zmodel` folder, pull the latest changes from GitHub and run `pnpm migrate dev` (on local db)

1. Edit or add schema in `zmodel` folder
2. Run `pnpm generate` to generate prisma schema
3. Run `pnpm prisma migrate dev` for create a migration from changes in schema, apply it to the database **_Use it only in development, You can't migrate down_**
4. If typescript doesn't work, restart your TS language server
5. You can use `pnpm prisma studio` to open Prisma Studio(web app for managing databases)
6. Make sure your model changes is OK before pushing to GitHub

## Get started

`pnpm generate` (this will run all `generate` scripts in all packages)
Important part: `generate` scripts in `packages/database` is need for zenstack and prisma to work

## Sinh lại đường dẫn router:  packages/router/src/index.ts

`cd MTA-monorepo; pnpm router:generate`

## Phát triển client

- Ví dụ: Quản lý người dùng

`cd apps/client/ql-nguoi-dung`
`pnpm dev`

## Phát triển backend

- Ví dụ: Quản lý người dùng

cài đặt `bun` runtime: [https://bun.sh/](https://bun.sh/)

```bash
cd apps/backend/ql-nguoi-dung
cp .env.example .env
pnpm dev
```

Có thể chạy database local với `docker compose up -d`
Sau đó cập nhật `DATABASE_URL` trong file `.env`
Tạo database với `pnpm migrate dev`

```bash
cd packages/database
pnpm prisma migrate dev
```

## build docker

Check Makefile to see example of build docker
