# Phần mềm

HỌC VIỆN KĨ THUẬT QUÂN SỰ - MTA

### Công nghệ

- [NextJs] Frontend
- [NodeJs-20] Môi trường
- [Antd] Thư viện UI
- [Antd-icon] Thư viện icon
- [Tailwind] framwork css

### Chạy dự án trên local

- Clone dự án và cài đặt package
- Đường dẫn folder làm việc: MTA-monorepo/apps/clients
- Môi trường làm việc NodeJs 20

```sh
// Bước 1: clone code dự án
git clone https://github.com/SongPhanTech/MTA-monorepo
// Bước 2: Di chuyển vào thư mục làm việc
cd MTA-monorepo
// Bước 3: Cài đặt package thư mục gốc
pnpm install
// Bước 4: Biến .env
Sao chép tệp `.env.example` sang `.env.local` và sửa đổi cấu hình trong tệp `.env.local` cho phù hợp với môi trường đang làm việc.
// Bước 4: chạy ứng dụng
pnpm dev --filter=client
```

- local app: <http://localhost:3001>

### Sử dụng Docker (Nếu có)

```bash
# Start
docker-compose up -d --build

# Stop
docker-compose stop
```

### Các lệnh

| Môi trường  | Lệnh          | Mô tả                           |
| ----------- | ------------- | ------------------------------- |
| Development | `pnpm build`  | Build source code               |
| Development | `pnpm dev`    | Start the for local development |
| Development | `pnpm format` | Format source codes             |
| Development | `pnpm lint`   | Run biome lint                  |
| Production  | `pnpm start`  | Start in production             |

### Cấu trúc thư mục

```sh
📦client
 ┣ 📂.next
 ┣ 📂generated
 ┃ ┣ 📜assets.json
 ┃ ┗ 📜router.json
 ┣ 📂public
 ┃ ┣ 📜favicon.ico
 ┣ 📂scripts
 ┃ ┣ 📜gen-assets.js
 ┃ ┗ 📜gen-router-path.js
 ┣ 📂src
 ┃ ┣ 📂assets
 ┃ ┃ ┗ 📂images
 ┃ ┃ ┃ ┗ 📜logo_mta.png
 ┃ ┣ 📂components
 ┃ ┃ ┣ 📂charts
 ┃ ┃ ┃ ┗ 📂Line
 ┃ ┃ ┣ 📂commons
 ┃ ┃ ┃ ┣ 📂card-dashboard
 ┃ ┃ ┣ 📂icons
 ┃ ┃ ┃ ┣ 📂delete
 ┃ ┃ ┃ ┗ 📂edit
 ┃ ┃ ┣ 📂layouts
 ┃ ┃ ┃ ┣ 📂avatar-dropdown
 ┃ ┃ ┃ ┗ 📂sider
 ┃ ┃ ┗ 📂modal
 ┃ ┣ 📂constants
 ┃ ┃ ┣ 📂languages
 ┃ ┃ ┃ ┣ 📜en.ts
 ┃ ┃ ┃ ┗ 📜vi.ts
 ┃ ┃ ┣ 📜assets.ts
 ┃ ┃ ┣ 📜colors.ts
 ┃ ┃ ┣ 📜constants.ts
 ┃ ┃ ┣ 📜dialog-tags.ts
 ┃ ┃ ┗ 📜page-path.ts
 ┃ ┣ 📂hooks
 ┃ ┃ ┣ 📜format-vnd.ts
 ┃ ┣ 📂layouts
 ┃ ┃ ┗ 📂default-layout
 ┃ ┃ ┃ ┗ 📜index.tsx
 ┃ ┣ 📂lib
 ┃ ┃ ┣ 📂api
 ┃ ┃ ┃ ┗ 📜index.ts
 ┃ ┃ ┣ 📂casl
 ┃ ┃ ┃ ┣ 📜ability.ts
 ┃ ┃ ┃ ┣ 📜can.ts
 ┃ ┃ ┃ ┗ 📜hooks.ts
 ┃ ┃ ┣ 📂redux
 ┃ ┃ ┃ ┣ 📂models
 ┃ ┃ ┃ ┣ 📂stores
 ┃ ┃ ┃ ┣ 📜hook.ts
 ┃ ┃ ┃ ┗ 📜store.ts
 ┃ ┃ ┗ 📜utils.ts
 ┃ ┣ 📂mocks
 ┃ ┣ 📂pages
 ┃ ┃ ┣ 📂home
 ┃ ┃ ┣ 📂login
 ┃ ┃ ┣ 📜index.tsx
 ┃ ┃ ┣ 📜_app.tsx
 ┃ ┃ ┗ 📜_document.tsx
 ┃ ┗ 📂styles
 ┃ ┃ ┣ 📂theme
 ┃ ┃ ┃ ┣ 📜global-theme-custom.ts
 ┃ ┃ ┗ 📜globals.css
 ┣ 📜.env.example
 ┣ 📜.gitignore
 ┣ 📜.nvmrc
 ┣ 📜biome.json
 ┣ 📜develop.Dockerfile
 ┣ 📜next-env.d.ts
 ┣ 📜next.config.ts
 ┣ 📜package.json
 ┣ 📜postcss.config.mjs
 ┣ 📜product.Dockerfile
 ┣ 📜README.md
 ┣ 📜tailwind.config.ts
 ┗ 📜tsconfig.json
```
