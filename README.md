# MTA monorepo

## ✏️Tech stack

~~Auth: Asgardeo, WSO2~~
Validation: Zod
Database: PostgreSQL
ORM: Prisma, Zenstack
Backend: Hono, Bun
Frontend: React, Nextjs, Tailwindcss, Antd, Tanstack Query

## Cấu trúc Monorepo

apps/ -> Các ứng dụng
backend/ -> Các backend (Honojs, Bun)
be-exchange/ -> Cung cấp API cho phân hệ Chỉ huy, Điều hành
be-khao-thi/ -> API nghiệp vụ Khảo thí: import đề, khảo sát, tự đánh giá CTĐT,...
be-model/ -> CRUD models, auth middleware, minio service,...
be-portal/ -> Cung cấp API cho Cổng sinh viên(Đăng ký học, xem TKB, KQHT) (Triển khai internet)
be-ql-dao-tao -> API nghiệp vụ đào tạo: Import SV, GV, CTĐT, tổng kết học kỳ, năm học, xét tốt nghiệp,...
be-ql-dao-tao-shared -> API cho bên thứ 3 (sMTA - ứng dụng trên điện thoại cho SV)
backup/ -> Source code service backup Postgres
client/ -> Các client (Nextjs)
dang-ky-hoc/ -> Cổng sinh viên (Triển khai internet)
khao-thi/ -> Khảo thí
ql-dao-tao/ -> Quản lý đào tạo
ql-ho-so/ -> Quản lý hồ sơ
tro-ly-ao/ -> Trợ lý ảo - Chatbot
packages/
auth/ -> Auth utils - fetch session, login, logout, register, JwtVerify, ...
constant/ -> Common constants
database/ -> Database schema, generated tanstack query hooks, prisma client...Somme script to seed data, fill score, delete training course data, ...
libs/ -> Common libs - fetch wrapper, generated hooks from openapi (by orval), utils function, parse excel files, ...
permissions/ -> Permissions utils for RBAC
router/ -> Script to generate router paths from project folder structures, need to manual map route to permission.
ui/ -> Common UI components
pnpm-workspace.yaml
package.json
Makefile -> Contains commands for building and deploying the monorepo
README.md

## ✏️Yêu cầu

- NodeJS v20.18.x
- pnpm : <https://pnpm.io/installation>
- bun: <https://bun.sh/>

## ✏️Cài đặt thu viên

```bash
pnpm i
```

## ✏️Cập nhật CSDL: packages/database

**Note**: Before you edit or add schema in `zmodel` folder, pull the latest changes from GitHub and run `pnpm migrate dev` (on local db)

1. `cd packages/database`
2. Edit or add schema in `zmodel` folder
3. Run `pnpm generate` to generate prisma schema
4. Run `pnpm prisma migrate dev` for create a migration from changes in schema, apply it to the database **_Use it only in development, You can't migrate down_**
5. If typescript doesn't work, restart your TS language server
6. You can use `pnpm prisma studio` to open Prisma Studio(web app for managing databases)
7. Make sure your model changes is OK before pushing to GitHub

## ✏️Get started

`pnpm generate` (this will run all `generate` scripts in all packages)
`pnpm generate:sql` in `packages/database`
Important part: `generate` scripts in `packages/database` is need for zenstack and prisma to work

## ✏️Sinh lại đường dẫn router: packages/router/src/index.ts

`cd MTA-monorepo/packages/router; pnpm generate:router`

## ✏️Phát triển client

- Ví dụ: Quản lý người dùng

`cd apps/client/ql-nguoi-dung`
`pnpm dev`

## ✏️Phát triển backend

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

## ✏️Build docker

Check Makefile to see example of build docker

## ✏️Quy Ước Viết Code Frontend (Next.js)

Quy ước viết code dành cho team FE nhằm đồng bộ cách viết code, đặt tên file, thư mục, comp và biến

## 1. Quy Tắc Đặt Tên Thư Mục, File, Component

### 1.1 Tên Page và Router

- Dùng **kebab-case**, tiếng Việt **không dấu**.
- Tên rõ nghĩa, diễn tả mục đích trang hoặc chức năng.
- Ví dụ:
  - `pages/ql-mon-hoc`
  - `pages/chi-tiet-nguoi-dung`

### 1.2 Tên Modal, Component Có Chức Năng Riêng

- Tên theo **kebab-case**, phản ánh rõ ngữ cảnh sử dụng.
- Ví dụ:
  - `put-modal-ql-mon-hoc`
  - `them-modal-nguoi-dung`

### 1.3 Component Đặc trưng

- Giữ nguyên tên tiếng Anh với những component phổ biến như:
  - `Button`, `WrapperModal`, `Input`, v.v...
- KHÔNG đổi tên thành tiếng Việt như `Nut`, `BocModal`,...

### 1.4 Component Biến Thể → Tạo Thư Mục Riêng

- Component có nhiều phiên bản hay ngữ cảnh khác nhau cần tách folder riêng.
- Ví dụ:
  ```
  components/
    button-them-nguoi-dung/
      index.tsx
    put-modal-ql-mon-hoc/
      index.tsx
  ```

## 2. Quy Tắc Đặt Tên Biến

- Viết theo **camelCase**, dùng **tiếng Việt không dấu**.
- Tên rõ nghĩa, viết tắt thì ghi chú luôn 1 chỗ để đỡ gây khó đoán .
- Component trong code viết theo PascalCase: `PutModalQLMonHoc` (file tương ứng: `put-modal-ql-mon-hoc/index.tsx`)

### Ví dụ:

```ts
const danhSachMonHoc = [] // (Ghi rõ cũng đc)
const DSSinhVienDS = [] // (Danh sách sinh viên dân sự) tuỳ cách viết tắt, nhưng nhớ ghi chú nhé
const loading = true // Đặc trưng, có thể dùng tiếng Anh khi quá phổ biến
const [isOpenModal, setIsOpenModal] = useState() // Đặc trưng, có thể dùng tiếng Anh khi quá phổ biến
```
