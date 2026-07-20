# Hướng dẫn triển khai cong-hoc-vien-cdn lên mta_online

## Tổng quan

| Thành phần | Vai trò |
|------------|---------|
| `cong-hoc-vien-cdn/` | Static export Next.js (HTML/JS/CSS) |
| `mta-cong-hoc-vien-cdn` | Container nginx serve thư mục CDN |
| `router-cong-hoc-vien-api` | Proxy `/cong-hoc-vien/api/*` → BE (portal/model…) |

Makefile profile `mta_online`:
- `FE_APP_DIR` = `~/mta-app/fe`
- `FE_COMPOSE_FILE` = `docker-compose.yml`
- Build inject: `NEXT_PUBLIC_APP_URL=$(FE_APP_URL)/cong-hoc-vien/home`

---

## Bước 0 — Sửa FE_APP_URL trước khi build

Trong `Makefile` profile `mta_online`, hiện đang copy nhầm:

```makefile
FE_APP_URL := http://192.168.100.134
```

Đổi thành domain/IP **thật** người dùng sẽ mở trình duyệt, ví dụ:

```makefile
FE_APP_URL := http://27.71.20.109
```

hoặc `https://your-domain.vn` nếu đã có HTTPS.

URL bake vào build = `http://27.71.20.109/cong-hoc-vien/home`.  
**Sai URL → phải build lại**, không sửa được bằng env trên server.

---

## Bước 1 — Chuẩn bị thư mục + compose trên server

```bash
mkdir -p ~/mta-app/fe
cd ~/mta-app/fe
```

Tạo `~/mta-app/fe/docker-compose.yml` (mẫu tối thiểu):

```yaml
name: mta-fe

services:
  mta-cong-hoc-vien-cdn:
    image: nginx:alpine
    container_name: mta-cong-hoc-vien-cdn
    restart: unless-stopped
    volumes:
      - ./cong-hoc-vien-cdn:/usr/share/nginx/html:ro
      # optional: ./nginx-cong-hoc-vien.conf:/etc/nginx/conf.d/default.conf:ro
    ports:
      - "3081:80"   # đổi port nếu cần
    networks:
      - mta-fe-net

  # Router API — image tùy hạ tầng hiện có trên các server khác.
  # Tên service PHẢI khớp Makefile: router-cong-hoc-vien-api
  router-cong-hoc-vien-api:
    image: nginx:alpine   # TODO: thay bằng image router thật nếu team dùng image riêng
    container_name: router-cong-hoc-vien-api
    restart: unless-stopped
    volumes:
      - ./router-cong-hoc-vien.conf:/etc/nginx/conf.d/default.conf:ro
    ports:
      - "3082:80"
    networks:
      - mta-fe-net
      - mta-net      # để proxy tới be-portal trên network BE

networks:
  mta-fe-net:
    name: mta-fe-net
  mta-net:
    external: true
    name: mta-net
```

**Khuyến nghị:** copy `docker-compose.yml` FE từ server `app` / `swan1` (đã chạy ổn) rồi chỉ giữ 2 service `mta-cong-hoc-vien-cdn` + `router-cong-hoc-vien-api`.

### Mẫu nginx CDN (`nginx-cong-hoc-vien.conf`) — optional

```nginx
server {
  listen 80;
  root /usr/share/nginx/html;
  index index.html;

  location / {
    try_files $uri $uri/ /index.html;
  }
}
```

### Mẫu proxy API (`router-cong-hoc-vien.conf`) — chỉnh theo path thật của FE

```nginx
server {
  listen 80;

  # Ví dụ: FE gọi /cong-hoc-vien/api/... hoặc /api/...
  location /api/ {
    proxy_pass http://mta-be-portal:3000/api/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

Port BE trên host (tham chiếu): portal `3044`, model `3041`, shared `3045`.  
Trong Docker network dùng hostname `mta-be-portal:3000` (port trong container).

---

## Bước 2 — Env build FE (máy local)

Kiểm tra `apps/client/cong-hoc-vien/.env` / `.env.prod` trỏ đúng API online trước khi build, tối thiểu:

- `NEXT_PUBLIC_*` API → domain/IP online (hoặc path qua nginx)
- `NEXT_PUBLIC_MINIO_ENDPOINT` → MinIO public (vd `http://27.71.20.109:9000`)
- `NEXT_PUBLIC_BASE_PATH` / asset prefix khớp path `/cong-hoc-vien` (theo app)

Makefile chỉ override `NEXT_PUBLIC_APP_URL` và `NEXT_PUBLIC_ONLY_OFFICE_ENDPOINT` lúc `pnpm build`. Các biến khác lấy từ `.env` của app.

---

## Bước 3 — Build + deploy từ máy local

SSH tới `mta_online` phải OK (key hoặc sshpass).

```bash
cd /Users/minhah/code/MTA-monorepo

# Build static + zip + scp + unzip + compose up 2 service
make all-cong-hoc-vien SERVER_PROFILE=mta_online
```

Lệnh này làm gì:

1. `pnpm build` trong `apps/client/cong-hoc-vien`
2. Đổi `out/` → `cong-hoc-vien-cdn/` → zip
3. `scp` zip → `~/mta-app/fe/`
4. Trên server: xóa CDN cũ, unzip,  
   `docker compose up mta-cong-hoc-vien-cdn router-cong-hoc-vien-api -d`

Nếu chỉ cần deploy lại (đã build sẵn zip):

```bash
# zip đã có tại apps/client/cong-hoc-vien/cong-hoc-vien-cdn.zip
make _deploy-fe PACKAGE=cong-hoc-vien SERVER_PROFILE=mta_online
```

(hoặc chạy lại `all-cong-hoc-vien` cho chắc)

---

## Map nginx cho BE đã deploy (làm trước khi FE)

Ports hiện tại trên host:

| Service | Port |
|---------|------|
| be-model | 3041 |
| be-ql-dao-tao | 3042 |
| be-portal | 3044 |
| be-ql-dao-tao-shared | 3045 |
| minio | 9000 / 9001 |

File: `nginx-mta-be-apis.conf` → path `/api/portal|model|lms|shared|lms-shared/` + `/minio/`.

```bash
# Local → server
scp deploy/mta-online/fe/nginx-mta-be-apis.conf mta_online:/tmp/

# Server
sudo mkdir -p /etc/nginx/snippets
sudo cp /tmp/nginx-mta-be-apis.conf /etc/nginx/snippets/mta-be-apis.conf

# Sửa 2 file site — THÊM dòng include TRƯỚC location / :
#   /etc/nginx/sites-available/prod_mta_portal  (server 443 mta.edu.vn)
#   /etc/nginx/sites-available/mta_portal       (server 80 27.71.20.109)
#
#   include /etc/nginx/snippets/mta-be-apis.conf;

sudo nginx -t && sudo systemctl reload nginx

# Test
curl -sS -o /dev/null -w "%{http_code}\n" http://127.0.0.1:3044/
curl -sS -o /dev/null -w "%{http_code}\n" https://mta.edu.vn/api/portal/
curl -sS -o /dev/null -w "%{http_code}\n" http://27.71.20.109/api/portal/
```

HTTP 404/401 từ API vẫn OK (nginx đã proxy tới BE). 502 = BE chưa chạy / sai port.

## Bước 4 — Nginx / reverse proxy FE (CDN)

Trên host hoặc container nginx chính, map path công khai:

| Path công khai | Upstream |
|----------------|----------|
| `/cong-hoc-vien/` hoặc `/cong-hoc-vien/cdn/` | `mta-cong-hoc-vien-cdn:80` (hoặc `127.0.0.1:3081`) |
| `/cong-hoc-vien/api/` | `router-cong-hoc-vien-api` hoặc thẳng `127.0.0.1:3044` |

Ví dụ host nginx:

```nginx
location /cong-hoc-vien/cdn/ {
  proxy_pass http://127.0.0.1:3081/;
}

location /cong-hoc-vien/api/ {
  proxy_pass http://127.0.0.1:3044/api/;
}
```

Chỉnh cho khớp `NEXT_PUBLIC_BASE_PATH` / `ASSET_PREFIX` đã build.

---

## Bước 5 — Kiểm tra

```bash
# Server
cd ~/mta-app/fe
ls cong-hoc-vien-cdn | head
docker compose ps
docker logs mta-cong-hoc-vien-cdn --tail 20
curl -I http://127.0.0.1:3081/
curl -sS http://127.0.0.1:3044/   # be-portal còn sống
```

Trình duyệt: `http://<FE_APP_URL>/cong-hoc-vien/home` (đúng URL đã bake).

---

## Lỗi thường gặp

| Triệu chứng | Nguyên nhân |
|-------------|-------------|
| `compose` không biết service `mta-cong-hoc-vien-cdn` | Chưa tạo compose FE / sai tên service |
| Trang trắng / JS 404 | Sai `FE_APP_URL` / basePath / asset prefix → **build lại** |
| API CORS / 401 | Router chưa proxy đúng; OIDC chưa cấu hình domain mới |
| `Permission denied` SSH | Giống lỗi deploy BE — sửa SSH trước |
| `deploy-cdn` xóa hết CDN khác | Đừng dùng `deploy-cdn` nếu chỉ muốn 1 app; dùng `all-cong-hoc-vien` |

---

## Thứ tự khuyến nghị với stack hiện tại

1. BE portal (+ model nếu cần) đã chạy ổn  
2. Sửa `FE_APP_URL` trong Makefile  
3. Tạo `~/mta-app/fe/docker-compose.yml` (copy từ server mẫu)  
4. `make all-cong-hoc-vien SERVER_PROFILE=mta_online`  
5. Cấu hình nginx host + mở firewall  
6. Test login / trang đăng ký học  

---

## Lệnh tóm tắt

```bash
# 1) Sửa Makefile: FE_APP_URL := http://27.71.20.109

# 2) Server: có ~/mta-app/fe/docker-compose.yml với
#    mta-cong-hoc-vien-cdn + router-cong-hoc-vien-api

# 3) Local
make all-cong-hoc-vien SERVER_PROFILE=mta_online

# 4) Server
docker compose -f ~/mta-app/fe/docker-compose.yml ps
```
