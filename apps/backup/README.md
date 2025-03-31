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
PBW_POSTGRES_CONN_STRING="postgresql://postgres:postgres@postgres:5432/pgbackweb?sslmode=disable"

```

## Cài đặt

- Golang `https://go.dev/doc/install`
- Deno `https://docs.deno.com/runtime/getting_started/installation/`
- Task `https://taskfile.dev/installation/`

## Khởi chạy
Chạy `task dev`

Các lệnh khác tham khảo file `taskfile.yaml`

## Lưu ý

Phải chạy ql-nguoi-dung ở localhost:3000, sau đó truy cập vào localhost:3000/home để sử dụng  