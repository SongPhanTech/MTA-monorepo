# mta_online — kiến trúc 2 server

| | Server A (App) | Server B (Data) |
|---|---|---|
| IP | `27.71.20.109` | `27.71.231.243` |
| SSH alias | `mta_online` | (data host) |
| Vai trò | FE/CDN, BE Node (Docker), Nginx, Keycloak, Router | PostgreSQL, Redis, Kafka, MinIO |

## Mapping dịch vụ

**Server A**

- `~/mta-app/be` — `mta-be-model`, `mta-be-portal`, `mta-be-ql-dao-tao`, `mta-be-ql-dao-tao-shared`, …
- `~/mta-app-sso` — FE CDN + compose
- Keycloak: `https://mta.edu.vn/iam` (realm `mta`, host port `9080`)
- Nginx reverse proxy → BE ports `3041`–`3045`

**Server B**

- Postgres: `mta_in`, `mta_core_db` / `mta_coredb`, Keycloak DB, …
- Redis: `:6379` (cache / nonce partner API)
- MinIO, Kafka (theo stack data)

## Kết nối từ App → Data

Trong `.env` trên Server A, hostname **Data** dùng IP B (không dùng `postgres`/`redis` Docker nội bộ A trừ khi đã proxy):

```bash
DATABASE_URL=postgresql://admin:***@27.71.231.243:5432/mta_in
REDIS_URL=redis://27.71.231.243:6379
KEYCLOAK_URL=https://mta.edu.vn/iam
KEYCLOAK_REALM=mta
```

Deploy BE/FE: SSH vào **Server A** (`make … SERVER_PROFILE=mta_online`).  
Migrate schema: từ máy local trỏ `DATABASE_URL` tới **Server B**.
