# Triển khai cong-hoc-vien-cdn — mta_online (chi tiết)

## Kiến trúc

```
Trình duyệt
    │
    ▼
Nginx host (mta.edu.vn :443)
    ├── /cong-hoc-vien/cdn/  ──► 127.0.0.1:6009  (mta-cong-hoc-vien-cdn)
    ├── /cong-hoc-vien/      ──► 127.0.0.1:6009
    ├── /cong-hoc-vien/api/  ──► 127.0.0.1:5188  (router-cong-hoc-vien-api)
    └── /api/portal|model|lms/ ──► 3044|3041|3042  (đã cấu hình mta-be-apis.conf)

~/mta-app/fe/
├── docker-compose.yml
├── cong-hoc-vien-cdn/          ← static sau make deploy (unzip)
├── nginx-config-cdn/
│   ├── nginx.conf
│   └── default.conf
├── Configs/                    ← config router .NET
└── docker-images/              ← tar.gz router (optional)
```

---

## Điều kiện tiên quyết (đã xong nếu theo plan trước)

- [x] BE: portal 3044, model 3041, ql-dao-tao 3042, shared 3045 đang listen
- [x] `curl https://mta.edu.vn/api/portal/` → 200
- [x] `include /etc/nginx/snippets/mta-be-apis.conf` trong `prod_mta_portal`
- [ ] Thư mục `~/mta-app/fe` + docker-compose + nginx-config
- [ ] Build FE + unzip CDN
- [ ] Container CDN :6009 + router :5188
- [ ] `include cong-hoc-vien-fe.conf` trên nginx host

---

## PHẦN A — Chuẩn bị server (`~/mta-app/fe`)

### A1. Cấu trúc thư mục

```bash
mkdir -p ~/mta-app/fe/{nginx-config-cdn,Configs,docker-images}
cd ~/mta-app/fe
```

### A2. Copy file từ repo (máy local)

```bash
scp deploy/mta-online/fe/docker-compose.yml mta_online:~/mta-app/fe/
scp deploy/mta-online/fe/nginx-config-cdn/nginx.conf mta_online:~/mta-app/fe/nginx-config-cdn/
scp deploy/mta-online/fe/nginx-config-cdn/default.conf mta_online:~/mta-app/fe/nginx-config-cdn/
scp deploy/mta-online/fe/nginx-cong-hoc-vien-fe.conf mta_online:/tmp/
```

**Configs router:** copy từ server môi trường cũ (app/swan1) nếu có:

```bash
# Ví dụ từ server khác
scp -r user@server-cu:~/mta-app/fe/Configs mta_online:~/mta-app/fe/
```

Không có Configs → router `:5188` có thể không proxy đúng BE.

### A3. docker-compose.yml (tóm tắt)

| Service | Image | Port host |
|---------|-------|-----------|
| `mta-cong-hoc-vien-cdn` | `nginx:alpine` | **6009** |
| `router-cong-hoc-vien-api` | `mta.router.api` (local load) | **5188** |

File mẫu: `deploy/mta-online/fe/docker-compose.yml`

---

## PHẦN B — Cấu hình build (máy local)

### B1. Makefile — profile `mta_online`

Sửa `FE_APP_URL` **đúng domain production** (URL bake vào build):

```makefile
FE_APP_URL := https://mta.edu.vn
```

Hiện đang `http://27.71.20.109` → build ra link sai nếu user vào qua `mta.edu.vn`.

Build inject: `NEXT_PUBLIC_APP_URL=https://mta.edu.vn/cong-hoc-vien/home`

### B2. Env app `apps/client/cong-hoc-vien/.env`

Trước khi build, API phải trỏ **mta.edu.vn** (khớp nginx BE):

```env
NEXT_PUBLIC_API_PORTAL_BASE_URL="https://mta.edu.vn/api/portal"
NEXT_PUBLIC_API_MODEL_BASE_URL="https://mta.edu.vn/api/model"
NEXT_PUBLIC_API_LMS_BASE_URL="https://mta.edu.vn/api/lms"
NEXT_PUBLIC_API_SYSTEM_BASE_URL="https://mta.edu.vn/api/system"
NEXT_PUBLIC_MINIO_ENDPOINT="https://mta.edu.vn/minio"
# hoặc http://27.71.20.109:9000 nếu chưa map /minio/

AUTH_ISSUER=https://mta.edu.vn/api/sso-id
NEXT_PUBLIC_AUTH_ISSUER=https://mta.edu.vn/api/sso-id

NEXT_PUBLIC_BASE_PATH="/cong-hoc-vien"
NEXT_PUBLIC_ASSET_PREFIX="/cong-hoc-vien/cdn"
NEXT_PUBLIC_APP_URL="https://mta.edu.vn/cong-hoc-vien"
```

**Lưu ý:** Makefile override `NEXT_PUBLIC_APP_URL` lúc build; các `NEXT_PUBLIC_API_*` lấy từ `.env` — phải sửa tay.

### B3. Fix type (nếu build lỗi)

File `packages/libs/src/api/schemas/importFromInternalBody.ts`: `file: Blob` (đã sửa).

---

## PHẦN C — Build & đẩy static CDN

### C1. SSH phải OK

```bash
ssh mta_online 'echo ok'
# hoặc dùng sshpass theo Makefile
```

### C2. Build + deploy một lệnh

```bash
cd /Users/minhah/code/MTA-monorepo
make all-cong-hoc-vien SERVER_PROFILE=mta_online
```

Luồng Makefile:

1. `pnpm build` → export Next.js → thư mục `out/`
2. Đổi tên `out/` → `cong-hoc-vien-cdn/`
3. Zip → `scp` → `~/mta-app/fe/`
4. Trên server: `unzip`, `docker compose up mta-cong-hoc-vien-cdn router-cong-hoc-vien-api -d`

### C3. Chỉ deploy lại static (đã build, không build lại)

```bash
cd apps/client/cong-hoc-vien
# đã có cong-hoc-vien-cdn.zip
make _deploy-fe PACKAGE=cong-hoc-vien SERVER_PROFILE=mta_online
```

### C4. Image Docker — không pull registry

**CDN:** compose dùng `nginx:alpine` — lần đầu có thể:

```bash
docker pull nginx:alpine   # hoặc docker load nếu offline
```

**Router:** bắt buộc `docker load` từ máy có image:

```bash
# Máy nguồn
docker images | grep mta.router
docker save mta.router.api | gzip > mta.router.api.tar.gz
scp mta.router.api.tar.gz mta_online:~/mta-app/fe/docker-images/

# mta_online
docker load -i ~/mta-app/fe/docker-images/mta.router.api.tar.gz
docker images | grep mta.router
```

Nếu `make deploy` fail vì thiếu router → vẫn up CDN riêng:

```bash
cd ~/mta-app/fe
docker compose up mta-cong-hoc-vien-cdn -d
```

---

## PHẦN D — Nginx host (mta.edu.vn)

### D1. Copy snippet FE

```bash
sudo cp /tmp/nginx-cong-hoc-vien-fe.conf /etc/nginx/snippets/cong-hoc-vien-fe.conf
```

### D2. Sửa `prod_mta_portal`

Trong `server { listen 443; server_name mta.edu.vn; }`, **sau** `client_max_body_size`, **trước** `location /wp/`:

```nginx
    include /etc/nginx/snippets/mta-be-apis.conf;
    include /etc/nginx/snippets/cong-hoc-vien-fe.conf;
```

Thứ tự gợi ý:

1. `mta-be-apis.conf` — `/api/portal/`, `/api/model/`, …
2. `cong-hoc-vien-fe.conf` — `/cong-hoc-vien/`, `/cong-hoc-vien/cdn/`, `/cong-hoc-vien/api/`
3. `/wp/`, `/_next/`, `location /` → portal Next.js

### D3. Reload

```bash
sudo nginx -t && sudo systemctl reload nginx
```

---

## PHẦN E — Kiểm tra

### E1. Container & static

```bash
cd ~/mta-app/fe
ls cong-hoc-vien-cdn | head
docker compose ps
curl -I http://127.0.0.1:6009/
curl -I http://127.0.0.1:5188/    # sau khi router up
```

### E2. Qua nginx

```bash
curl -I https://mta.edu.vn/cong-hoc-vien/
curl -I https://mta.edu.vn/cong-hoc-vien/cdn/
curl -I https://mta.edu.vn/cong-hoc-vien/home
```

### E3. Trình duyệt

Mở: **https://mta.edu.vn/cong-hoc-vien/home**

DevTools → Network: JS/CSS load từ `/cong-hoc-vien/cdn/_next/...`; API gọi `/api/portal/` hoặc `/cong-hoc-vien/api/`.

---

## Lỗi thường gặp

| Triệu chứng | Nguyên nhân | Cách xử lý |
|-------------|-------------|------------|
| `No such image: swantech-cdn` | Compose cũ | Dùng `nginx:alpine` trong compose mới |
| `No such image: mta.router.api` | Chưa load | `docker load`; hoặc tạm chỉ up CDN |
| Trang trắng, JS 404 | Sai `FE_APP_URL` / `ASSET_PREFIX` | Sửa Makefile + `.env`, **build lại** |
| `/cong-hoc-vien` → Next.js portal | Thiếu `cong-hoc-vien-fe.conf` | Include snippet trước `location /` |
| API 502 | BE down | `docker ps`, `curl :3044` |
| Login SSO lỗi | `AUTH_ISSUER` sai domain | `.env` → `https://mta.edu.vn/api/sso-id` |

---

## Checklist nhanh

```
[ ] FE_APP_URL=https://mta.edu.vn trong Makefile
[ ] .env API → https://mta.edu.vn/api/*
[ ] make all-cong-hoc-vien SERVER_PROFILE=mta_online
[ ] ~/mta-app/fe/cong-hoc-vien-cdn/ có file
[ ] docker compose up mta-cong-hoc-vien-cdn -d  → :6009
[ ] docker load mta.router.api + up router → :5188
[ ] nginx: include mta-be-apis + cong-hoc-vien-fe
[ ] https://mta.edu.vn/cong-hoc-vien/home mở được
```

---

## Lệnh tóm tắt (copy-paste)

```bash
# === LOCAL ===
# 1. Sửa Makefile FE_APP_URL + .env cong-hoc-vien
make all-cong-hoc-vien SERVER_PROFILE=mta_online

# === SERVER ===
cd ~/mta-app/fe
docker compose pull mta-cong-hoc-vien-cdn    # nginx:alpine lần đầu
docker load -i docker-images/mta.router.api.tar.gz   # nếu có
COMPOSE_PULL_POLICY=never docker compose up -d

sudo cp /tmp/nginx-cong-hoc-vien-fe.conf /etc/nginx/snippets/
# thêm include vào prod_mta_portal
sudo nginx -t && sudo systemctl reload nginx

curl -I https://mta.edu.vn/cong-hoc-vien/home
```
