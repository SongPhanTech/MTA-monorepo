# Checklist đưa BE lên mta_online

## Đã xong
- [x] Docker trên server
- [x] Postgres + MinIO chạy (`~/mta-app/be`)

## Việc còn lại (theo thứ tự)

### 1. Cập nhật docker-compose trên server
Copy từ repo:
- `deploy/mta-online/be/docker-compose.yml` → `~/mta-app/be/docker-compose.yml`
- `.env.be-model.example` → `.env.be-model`
- `.env.be-portal.example` → `.env.be-portal`
- `.env.be-ql-dao-tao-shared.example` → `.env.be-ql-dao-tao-shared`

Chỉnh mật khẩu / OIDC cho đúng.  
**Quan trọng:** trong env BE dùng `postgres` và `minio` (hostname Docker), không dùng `27.71.20.109`.

Giữ Postgres/MinIO đang chạy:
```bash
cd ~/mta-app/be
docker compose up -d postgres minio
```

### 2. Migrate schema (máy local)
Trong `packages/database/.env`:
```
DATABASE_URL="postgres://root:123456654321@27.71.20.109:5432/mta"
```
Rồi chạy migrate Prisma/ZenStack theo quy trình dự án (ví dụ `pnpm` script migrate trong `packages/database`).

Verify:
```bash
docker exec -it mta-postgres psql -U root -d mta -c '\dn'
# kỳ vọng có schema ql-dao-tao, ...
```

### 3. Build + đẩy image (máy local)
```bash
make all-be-model SERVER_PROFILE=mta_online
make all-be-portal SERVER_PROFILE=mta_online
make all-be-ql-dao-tao-shared SERVER_PROFILE=mta_online
```
Mỗi lệnh: build → scp tar.gz → `docker load` → tag `*:local-deploy` → `compose up` service đó.

### 4. Kiểm tra trên server
```bash
docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'
docker logs mta-be-model --tail 50
docker logs mta-be-portal --tail 50
docker logs mta-be-ql-dao-tao-shared --tail 50

curl -sS http://127.0.0.1:3000/   # be-model (tùy route health)
curl -sS http://127.0.0.1:3003/
curl -sS http://127.0.0.1:3004/
```

| Service | Host port |
|---------|-----------|
| mta-be-model | 3000 |
| mta-be-portal | 3003 |
| mta-be-ql-dao-tao-shared | 3004 |

### 5. (Sau) Nginx / FE
Map domain → các port trên; rồi mới `make all-cong-hoc-vien SERVER_PROFILE=mta_online`.

## Lỗi thường gặp
| Triệu chứng | Nguyên nhân |
|-------------|-------------|
| `compose up` không có service mta-be-* | Chưa cập nhật compose (vẫn chỉ postgres/minio) |
| BE không kết nối DB | `DATABASE_URL` dùng IP thay vì `postgres` |
| MinIO SSL error | `MINIO_USE_SSL=true` với `http://` → để `false` |
| `pull` / image not found | Chưa `make deploy` / chưa `docker load` |
| Schema empty | Chưa migrate |
