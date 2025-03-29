# Yêu cầu

- NodeJS v20.18.x
- pnpm : https://pnpm.io/installation
- bun: https://bun.sh/

# Cài đặt thu viên

`pnpm i`

# Sinh kiểu dữ liêu từ packages/database/models

`cd MTA-monorepo; pnpm generate`

# Sinh lại đường dẫn router:  packages/router/src/index.ts

`cd MTA-monorepo; pnpm router:generate`

# Phát triển client:

- Ví dụ: Quản lý người dùng
 
`cd apps/client/ql-nguoi-dung`
`pnpm dev`

# Phát triển backend:

- Ví dụ: Quản lý người dùng
 
`cd apps/backend/ql-nguoi-dung`
`pnpm dev`