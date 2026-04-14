# Hướng dẫn chạy dự án MTA Monorepo (Client/Backend) + Nâng cấp Database

Tài liệu này hướng dẫn cách cài đặt môi trường, chạy các ứng dụng trong `apps/client/*`, chạy các service trong `apps/backend/*`, và quy trình cập nhật/nâng cấp database trong `packages/database`.

---

## 1) Tổng quan kiến trúc dự án

- **Monorepo**: dùng `pnpm-workspace.yaml` gom các workspace:
  - `apps/client/*` (Frontend)
  - `apps/backend/*` (Backend)
  - `packages/*` (thư viện dùng chung)
- **Task runner**: `turborepo` (cấu hình ở `turbo.json`)
- **Frontend**: Next.js (React) + TailwindCSS + Ant Design
- **Backend**: Bun runtime + Hono (API)
- **Database**: PostgreSQL + Prisma + ZenStack
  - Migrations: `packages/database/prisma/migrations/*`

---

## 2) Yêu cầu môi trường

- **NodeJS**: khuyến nghị `v20.18.x` (theo `README.md` ở root)
- **pnpm**: repo dùng `pnpm` (root `package.json` có `packageManager`)
- **bun**: bắt buộc để chạy backend (các backend chạy `bun run --watch ...`)
- (Tuỳ chọn) **Docker + Docker Compose**: để chạy PostgreSQL local theo `docker-compose.yaml`

---

## 3) Cài đặt lần đầu (bắt buộc)

Tại thư mục root `MTA-monorepo`:

```bash
pnpm i
```

Khuyến nghị chạy generate chung (để `packages/database` và các mã sinh tự động đồng bộ):

```bash
pnpm generate
```

---

## 4) Chạy các app Frontend trong `apps/client/*`

### 4.1. Nguyên tắc chạy

Mỗi app client là một workspace riêng, có `scripts.dev` dạng `next dev --turbopack`.

Bạn có 2 cách chạy:

- **Cách A (đứng ở root, dùng filter theo package name)**:
  - Dạng: `pnpm --filter <package-name> dev`
- **Cách B (chạy theo đường dẫn thư mục)**:
  - Dạng: `pnpm -C <path> dev`

### 4.2. Ví dụ chạy một app client

Ví dụ chạy `apps/client/ql-dao-tao` (package name: `@client/ql-dao-tao`):

```bash
pnpm --filter @client/ql-dao-tao dev
```

Hoặc:

```bash
pnpm -C apps/client/ql-dao-tao dev
```

### 4.3. Danh sách app client hiện có (tham khảo)

- `apps/client/ql-dao-tao` → `@client/ql-dao-tao`
- `apps/client/khao-thi` → `@client/khao-thi`
- `apps/client/ql-ho-so` → `@client/ql-ho-so`
- `apps/client/dang-ky-hoc` → `@client/dang-ky-hoc`
- `apps/client/tro-ly-ao` → `@client/tro-ly-ao`

Chạy nhanh:

```bash
pnpm --filter @client/khao-thi dev
pnpm --filter @client/ql-ho-so dev
pnpm --filter @client/dang-ky-hoc dev
pnpm --filter @client/tro-ly-ao dev
```

### 4.4. Lưu ý về port

README của các app có thể ghi port khác nhau (3000/3001). **Port thực tế** sẽ được in ra trong terminal khi chạy `dev`.

---

## 5) Chạy các service Backend trong `apps/backend/*`

### 5.1. Chuẩn bị env cho từng service

Mỗi backend có `.env.example`. Bạn cần tạo `.env` tương ứng trước khi chạy.

Ví dụ với `apps/backend/be-portal`:

```bash
cd apps/backend/be-portal
cp .env.example .env
```

Chỉnh tối thiểu:
- **`DATABASE_URL`**: trỏ đúng DB (local hoặc server)

### 5.2. Chạy service backend

Có 2 cách:

**Cách A (đứng ở root):**

```bash
pnpm --filter @backend/be-portal dev
```

**Cách B (trong thư mục service):**

```bash
cd apps/backend/be-portal
pnpm dev
```

### 5.3. Danh sách service backend hiện có (tham khảo)

- `apps/backend/be-portal` → `@backend/be-portal`
- `apps/backend/be-ql-dao-tao` → `@backend/be-ql-dao-tao`
- `apps/backend/be-khao-thi` → `@backend/be-khao-thi`
- `apps/backend/be-exchange` → `@backend/be-exchange`
- `apps/backend/be-model` → `@backend/be-model`
- `apps/backend/be-ql-dao-tao-shared` → `@backend/be-ql-dao-tao-shared`

Chạy nhanh:

```bash
pnpm --filter @backend/be-ql-dao-tao dev
pnpm --filter @backend/be-khao-thi dev
pnpm --filter @backend/be-exchange dev
pnpm --filter @backend/be-model dev
pnpm --filter @backend/be-ql-dao-tao-shared dev
```

### 5.4. Lưu ý về port backend

README backend ghi chung `http://localhost:3000`, tuy nhiên **port thực tế phụ thuộc cấu hình từng service**. Xem log khi chạy để lấy URL chính xác.

---

## 6) Chạy database local bằng Docker Compose (tuỳ chọn)

Repo có `docker-compose.yaml` ở root (bao gồm Postgres + OpenObserve + backup).

Chạy:

```bash
docker compose up -d
```

Mặc định theo `docker-compose.yaml`:
- PostgreSQL: `localhost:5432`
- OpenObserve: `localhost:5080`
- Backup UI: `localhost:8085`

Sau đó cập nhật `DATABASE_URL` trong:
- `packages/database/.env`
- và `.env` của backend bạn chạy

---

## 7) Nâng cấp / cập nhật Database (Prisma + ZenStack)

### 7.1. Các file/thư mục quan trọng

- Prisma schema/migrations:
  - `packages/database/prisma/schema.prisma`
  - `packages/database/prisma/migrations/*`
- ZenStack model (nguồn khai báo model):
  - `packages/database/schema.zmodel`
- Env cho database package:
  - `packages/database/.env.example` → copy sang `packages/database/.env`

### 7.2. Thiết lập env cho database package

```bash
cd packages/database
cp .env.example .env
```

Chỉnh `DATABASE_URL` trong `.env` cho đúng DB.

### 7.3. Quy trình đồng bộ schema nhanh (dev/local) – khuyến nghị khi dựng mới DB

Trong `packages/database` có sẵn scripts:
- `pnpm db:push`: `prisma db push --skip-generate`
- `pnpm db:sync`: `zenstack generate && prisma db push --skip-generate`

Chạy đồng bộ nhanh:

```bash
cd packages/database
pnpm db:sync
```

Khi nào dùng:
- DB local mới tạo
- Muốn “kéo schema lên DB” nhanh, không quan tâm lịch sử migration

### 7.4. Quy trình migration (chuẩn phát triển)

Theo `README.md` ở root, quy trình dev:

```bash
cd packages/database
pnpm generate
pnpm prisma migrate dev
```

Ghi chú:
- `prisma migrate dev` phù hợp **development/local**.
- Repo đã có thư mục migrations trong `packages/database/prisma/migrations/*`.

### 7.5. Generate SQL/client (nếu cần)

Trong `packages/database` có:
- `pnpm generate:sql` → `prisma generate --sql`

```bash
cd packages/database
pnpm generate:sql
```

---

## 8) Seed dữ liệu (tham khảo)

Repo có:
- Seed TypeScript: `packages/database/src/seed.ts`
- Seed SQL: `packages/database/src/seed.sql`

Hiện tại `packages/database/package.json` **chưa chuẩn hoá script `seed`**, nên tuỳ cách team muốn chạy:

- **Seed SQL**: chạy bằng `psql` (nếu bạn đang dùng PostgreSQL local)
- **Seed TS**: chạy bằng runtime phù hợp (bun/ts-node) theo cách team thống nhất

Nếu cần chuẩn hoá 1 lệnh seed cho cả team (ví dụ `pnpm --filter @workspace/db seed`), hãy bổ sung script `seed` trong `packages/database/package.json` và cấu hình seed của Prisma tương ứng.

---

## 9) Checklist chạy end-to-end (DB + Backend + Client)

- [ ] `pnpm i` ở root thành công
- [ ] `pnpm generate` ở root đã chạy (ít nhất sau mỗi lần pull lớn)
- [ ] DB chạy (local Docker hoặc server) và `DATABASE_URL` đúng:
  - [ ] `packages/database/.env`
  - [ ] `apps/backend/<service>/.env`
- [ ] `packages/database`: đã `pnpm db:sync` (hoặc `pnpm prisma migrate dev` tuỳ quy trình)
- [ ] Backend chạy được (bun)
- [ ] Client chạy được và trỏ đúng API theo cấu hình app

