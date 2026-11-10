# Logging API Shared v1 — xem ai gọi / IP / domain

## 1. App audit (chi tiết nghiệp vụ)

Mỗi request `/api/shared/v1/*` ghi 1 dòng JSON stdout container `mta-be-ql-dao-tao-shared`:

| Trường | Ý nghĩa |
|--------|---------|
| `client_id` | **Ai gọi** — OAuth client Keycloak (vd `mta-shared-partner`) |
| `ip` | **IP gọi** — từ `X-Forwarded-For` / `X-Real-IP` (Nginx) |
| `host` | Host request (thường `mta.edu.vn`) |
| `origin` / `referer` | Domain bên gọi nếu client gửi (browser). Server-to-server C# thường `-` |
| `user_agent` | Client library (curl, .NET, …) |
| `path` / `query` / `status` / `duration_ms` | API nào, tham số, kết quả |

### Xem realtime

```bash
docker logs -f mta-be-ql-dao-tao-shared 2>&1 | grep shared_api_audit
```

### Lọc theo client / IP / path

```bash
# Theo đối tác (client_id)
docker logs mta-be-ql-dao-tao-shared --since 24h 2>&1 | grep shared_api_audit | grep mta-shared-partner

# Theo IP
docker logs mta-be-ql-dao-tao-shared --since 24h 2>&1 | grep shared_api_audit | grep '"ip":"14.'

# Theo API
docker logs mta-be-ql-dao-tao-shared --since 24h 2>&1 | grep shared_api_audit | grep subject-classes

# Pretty (cần jq)
docker logs mta-be-ql-dao-tao-shared --since 1h 2>&1 \
  | grep shared_api_audit \
  | jq -c '{t:.timestamp, client:.client_id, ip, host, origin, ua:.user_agent, path, status, q:.query}'
```

### Ví dụ dòng log

```json
{
  "type": "shared_api_audit",
  "timestamp": "2026-11-10T08:36:11.475Z",
  "request_id": "8849339dd72ad2624cd3d08b146e7cce",
  "ip": "14.224.217.69",
  "client_id": "mta-shared-partner",
  "host": "mta.edu.vn",
  "origin": "-",
  "referer": "-",
  "user_agent": "curl/8.7.1",
  "method": "GET",
  "path": "/v1/subjects",
  "status": 200,
  "duration_ms": 27,
  "query": "q=TIN"
}
```

**Lưu ý domain:** với tích hợp server-to-server (C# `HttpClient`), thường **không có Origin/Referer**. Nhận diện đối tác bằng `client_id` + `ip` (+ tùy chọn `User-Agent` họ set). Nếu muốn ghi “domain hệ thống đối tác”, họ phải gửi thêm header (vd `X-Partner-Domain`) hoặc khai báo IP/domain trong bàn giao.

## 2. Nginx access log (edge — IP + Host)

File: `/var/log/nginx/mta-shared-v1.access.log` (sau khi bật `access_log` trong snippet shared).

```bash
sudo tail -f /var/log/nginx/mta-shared-v1.access.log
# Format combined: IP - - [time] "METHOD /api/shared/v1/..." status size "referer" "user-agent"
```

Nginx **không** biết `client_id` OAuth — chỉ biết IP/Host/UA. Ghép với app audit qua thời gian hoặc `X-Request-Id`.

## 3. Cách đọc nhanh

| Câu hỏi | Nhìn vào |
|---------|----------|
| Ai (đối tác nào)? | `client_id` trong app audit |
| IP máy gọi? | `ip` (app) hoặc cột đầu Nginx access log |
| Domain API nhận? | `host` = `mta.edu.vn` |
| Domain hệ thống bên gọi? | `origin`/`referer` nếu có; không thì dựa IP + `client_id` |
| Gọi API nào? | `path` + `query` |
| Thành công? | `status` (200/401/403/…) |
