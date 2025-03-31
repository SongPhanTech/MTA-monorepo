# Docker cho database

Cơ sơ dữ liệu cho con backup

```yaml
services:
  postgres:
    image: postgres:17
    environment:
      POSTGRES_USER: postgres
      POSTGRES_DB: pgbackweb
      POSTGRES_PASSWORD: password
    ports:
      - "5432:5432"
    volumes:
      - ./data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5
```
# Phát triển

```.env

# Key mã hoá dữ liệu backup
PBW_ENCRYPTION_KEY="encryption-key"

# Kết nối cơ sở dữ liệu bên trên
PBW_POSTGRES_CONN_STRING="postgresql://postgres:postgres@localhost:5432/pgbackweb?sslmode=disable"
# Đường dẫn để lấy session của ql-nguoi-dung đã login
PBW_AUTH_URL="http://localhost:3000/api/auth/session"
```

## Cài đặt

- Golang `https://go.dev/doc/install`
- Deno `https://docs.deno.com/runtime/getting_started/installation/`
- Task `https://taskfile.dev/installation/`

apps/backup/internal/integration/postgres/postgres.go

Cài đặt postgresql để backup nhận đc tool `pg_dump` và `psql` theo đường dẫn đã khai báo
```go
var (
	PG13 = PGVersion{version{
		Version: "13",
		PGDump:  "/usr/lib/postgresql/13/bin/pg_dump",
		PSQL:    "/usr/lib/postgresql/13/bin/psql",
	}}
	PG14 = PGVersion{version{
		Version: "14",
		PGDump:  "/usr/lib/postgresql/14/bin/pg_dump",
		PSQL:    "/usr/lib/postgresql/14/bin/psql",
	}}
	PG15 = PGVersion{version{
		Version: "15",
		PGDump:  "/usr/lib/postgresql/15/bin/pg_dump",
		PSQL:    "/usr/lib/postgresql/15/bin/psql",
	}}
	PG16 = PGVersion{version{
		Version: "16",
		PGDump:  "/usr/lib/postgresql/16/bin/pg_dump",
		PSQL:    "/usr/lib/postgresql/16/bin/psql",
	}}
	PG17 = PGVersion{version{
		Version: "17",
		PGDump:  "/usr/lib/postgresql/17/bin/pg_dump",
		PSQL:    "/usr/lib/postgresql/17/bin/psql",
	}}

	PGVersions = []PGVersion{PG13, PG14, PG15, PG16, PG17}
)
```


## Khởi chạy
Chạy `task dev`

Các lệnh khác tham khảo file `taskfile.yaml`

## Lưu ý

Phải chạy ql-nguoi-dung ở localhost:3000, sau đó truy cập vào localhost:3000/home để sử dụng  