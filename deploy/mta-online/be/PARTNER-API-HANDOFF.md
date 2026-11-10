# Tài liệu bàn giao — API Shared v1

## Base URL

`https://mta.edu.vn/api/shared/v1` (đã mở Nginx trên Server A)

Token endpoint:

`POST http://mta.edu.vn:9080/iam/realms/mta/protocol/openid-connect/token`  
(hoặc qua admin console [Keycloak](https://mta.edu.vn/iam/admin/master/console/))

Client: `mta-shared-partner` — secret lấy trong Keycloak → Credentials.

Public key verify `X-Signature`: file `shared-api-signing.pub.pem` trên server (`~/mta-app/be/`).

OpenAPI UI nội bộ: `http://127.0.0.1:3045/reference`

## Luồng gọi

1. Lấy token Keycloak (Client Credentials) — xem [KEYCLOAK-SHARED-PARTNER.md](./KEYCLOAK-SHARED-PARTNER.md)
2. Gọi REST với headers:
   - `Authorization: Bearer <token>`
   - `X-Timestamp: <unix_ms>`
   - `X-Nonce: <uuid>`
3. (Tuỳ chọn) Verify `X-Signature` bằng public key hệ thống

## Endpoints

| Method | Path | Scope |
|---|---|---|
| GET | `/subjects?q=` | `read:subjects` |
| GET | `/subject-classes?q=&semester_code=` | `read:subject-classes` |
| GET | `/subject-classes/{class_code}` | `read:subject-classes` |
| GET | `/lecturers?q=` | `read:lecturers` |
| GET | `/students/{student_code}/scores` | `read:student-scores` |

## IP whitelist

Đối tác gửi danh sách IP tĩnh → ops cập nhật `allow` trong `/etc/nginx/snippets/mta-shared-v1.conf`.

## Rate limit

100 requests / phút / IP → HTTP **429**.

## Ví dụ

```bash
TOKEN=$(curl -sS -X POST "$KEYCLOAK_URL/realms/$REALM/protocol/openid-connect/token" \
  -d "grant_type=client_credentials&client_id=$CLIENT_ID&client_secret=$CLIENT_SECRET" \
  | jq -r .access_token)

curl -sS "https://mta.edu.vn/api/shared/v1/subjects?q=TIN" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Timestamp: $(date +%s)000" \
  -H "X-Nonce: $(uuidgen)"
```
