# Checklist đưa BE lên mta_online

## Múi giờ (bắt buộc đồng nhất)

Tất cả container BE / Postgres / Redis / MinIO dùng `TZ=Asia/Ho_Chi_Minh`.
Code FE/BE gọi `setupAppTimezone()` từ `@workspace/libs/timezone`.

Khi hiển thị ngày giờ trên UI nên dùng:

```ts
import { formatDateVn, formatDateTimeVn, toVnStartOfDay } from "@workspace/libs/timezone"

formatDateVn(record.createdAt)           // DD/MM/YYYY
formatDateTimeVn(record.createdAt)      // DD/MM/YYYY HH:mm
toVnStartOfDay(pickerValue)              // lưu đầu ngày theo giờ VN
```

## Đã xong

- [x] Docker trên server
- [x] Postgres + MinIO chạy (`~/mta-app/be`)

## Chịu tải đợt ĐK (~500 SV)

### Redis cache (đợt ĐK / credit / info SV / classes-info)

Trong `.env` / `.env.be-portal`:

```bash
REDIS_URL=redis://redis:6379
REDIS_CACHE_ENABLED=true
REDIS_TTL_SESSION=60          # get-class-register-session (+ creditLimit)
REDIS_TTL_STUDENT=60          # get-student-info
REDIS_TTL_CLASSES_INFO=5      # get-classes-info (short TTL vì sĩ số)

# Rate-limit (per userId, fixed window trên Redis)
REDIS_RATE_LIMIT_ENABLED=true
REDIS_RL_REGISTER_MAX=20      # POST class-register
REDIS_RL_REGISTER_WINDOW=60
REDIS_RL_UNREGISTER_MAX=20    # POST class-unregister
REDIS_RL_UNREGISTER_WINDOW=60
REDIS_RL_READ_MAX=120         # GET get-classes-info
REDIS_RL_READ_WINDOW=60
```

```bash
docker compose up -d redis
docker compose up -d --force-recreate mta-be-portal
```

Không có Redis / tắt cache: API vẫn chạy bình thường (graceful degrade).

Rate-limit: Redis down → **fail-open** (cho qua). Load test dùng 1 token spam → `REDIS_RATE_LIMIT_ENABLED=false` hoặc tăng `REDIS_RL_*_MAX`.

### Pool + Postgres

Trong `~/mta-app/be/.env` (xem `.env.example`):

```bash
POSTGRES_MAX_CONNECTIONS=300
DATABASE_POOL_SIZE=40   # mỗi instance be-portal
```

Áp dụng (Postgres recreate để nhận `max_connections` từ `command`):

```bash
cd ~/mta-app/be
docker compose up -d --force-recreate postgres
docker compose up -d --force-recreate mta-be-portal
docker exec -it postgres psql -U root -d mta -c 'SHOW max_connections;'
```

Ngân sách connection: `N_portal × 40 + model + ql-dao-tao + shared + 20 < max_connections`.

### Scale ngang be-portal

```bash
docker compose -f docker-compose.yml -f docker-compose.portal-scale.yml up -d
# Nginx: uncomment 127.0.0.1:3046 trong upstream mta_be_portal
# (deploy/mta-online/fe/nginx-mta-be-apis.conf) rồi reload nginx
```

### Load test

Xem `scripts/load-test/class-register/README.md` (k6 ramp 100→300→500).

## Việc còn lại (theo thứ tự)

### 1. Cập nhật docker-compose trên server

Copy từ repo:

- `deploy/mta-online/be/docker-compose.yml` → `~/mta-app/be/docker-compose.yml`
- `deploy/mta-online/be/docker-compose.portal-scale.yml` (tuỳ chọn scale)
- `.env.example` → `.env` (merge `POSTGRES_MAX_CONNECTIONS`, `REDIS_*`, …)
- `.env.be-portal.example` → `.env.be-portal` (`DATABASE_POOL_SIZE=40`, `REDIS_URL=…`)

Chỉnh mật khẩu / OIDC cho đúng.  
**Quan trọng:** trong env BE dùng `postgres` và `minio` (hostname Docker), không dùng IP host.

# <<<<<<< HEAD

Giữ Postgres/MinIO đang chạy:

> > > > > > > 739545e75263a60b6681a4e6dbeef7136528cc56

```bash
cd ~/mta-app/be
docker compose up -d postgres minio redis
```

### 2. Migrate schema (máy local)

<<<<<<< HEAD

# Trong `packages/database/.env` trỏ DB online rồi migrate theo quy trình dự án.

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

> > > > > > > 739545e75263a60b6681a4e6dbeef7136528cc56

### 3. Build + đẩy image (máy local)

```bash
make all-be-portal SERVER_PROFILE=mta_online
# …
```

# <<<<<<< HEAD

Mỗi lệnh: build → scp tar.gz → `docker load` → `compose up` service đó (image `ghcr.io/...:latest`).

> > > > > > > 739545e75263a60b6681a4e6dbeef7136528cc56

### 4. Kiểm tra trên server

```bash
docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'
docker logs mta-be-portal --tail 50
curl -sS http://127.0.0.1:3044/api/
```

| Service | Host port |
| ------- | --------- |

<<<<<<< HEAD
| mta-be-model | 3041 |
| mta-be-ql-dao-tao | 3042 |
| mta-be-portal | 3044 |
| mta-be-portal-2 (scale) | 3046 |
| mta-be-ql-dao-tao-shared | 3045 |

### 5. (Sau) Nginx / FE

Map domain → port trên; rồi `make all-cong-hoc-vien SERVER_PROFILE=…`.

## Lỗi thường gặp

| Triệu chứng                            | Nguyên nhân                               |
| -------------------------------------- | ----------------------------------------- |
| BE không kết nối DB                    | `DATABASE_URL` dùng IP thay vì `postgres` |
| `too many clients already`             | Tổng pool BE > `max_connections`          |
| Image not found                        | Chưa `docker load` / deploy               |
| Scale portal nhưng nginx vẫn 1 backend | Chưa bật `:3046` trong upstream           |

=======
| mta-be-model | 3000 |
| mta-be-portal | 3003 |
| mta-be-ql-dao-tao-shared | 3004 |

### 5. (Sau) Nginx / FE

Map domain → các port trên; rồi mới `make all-cong-hoc-vien SERVER_PROFILE=mta_online`.

## Lỗi thường gặp

| Triệu chứng                             | Nguyên nhân                                     |
| --------------------------------------- | ----------------------------------------------- |
| `compose up` không có service mta-be-\* | Chưa cập nhật compose (vẫn chỉ postgres/minio)  |
| BE không kết nối DB                     | `DATABASE_URL` dùng IP thay vì `postgres`       |
| MinIO SSL error                         | `MINIO_USE_SSL=true` với `http://` → để `false` |
| `pull` / image not found                | Chưa `make deploy` / chưa `docker load`         |
| Schema empty                            | Chưa migrate                                    |

> > > > > > > 739545e75263a60b6681a4e6dbeef7136528cc56
