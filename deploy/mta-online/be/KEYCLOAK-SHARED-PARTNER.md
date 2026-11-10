# Keycloak — Client Credentials cho đối tác (Giai đoạn 2)

## Tạo client

1. Vào Admin Console Keycloak → Realm đang dùng (vd realm MTA / swantech).
2. **Clients → Create client**
   - Client ID: `mta-shared-partner` (hoặc tên bàn giao)
   - Client authentication: **ON**
   - Authentication flow: chỉ bật **Service accounts roles** (Client Credentials)
   - Standard flow / Direct access: OFF
3. Credentials tab → copy **Client secret**
4. Advanced → Access Token Lifespan: **15 phút** (hoặc realm default tương đương)

## Scopes / Roles

Tạo client scopes (hoặc realm roles) và gán cho service account:

| Scope / Role | Quyền |
|---|---|
| `read:subjects` | GET /v1/subjects |
| `read:subject-classes` | GET /v1/subject-classes* |
| `read:lecturers` | GET /v1/lecturers |
| `read:student-scores` | GET /v1/students/{student_code}/scores |

Gán vào **Service account roles** của client (hoặc Optional client scopes mặc định).

Đảm bảo access token chứa `scope` (space-separated) hoặc `realm_access.roles`.

## Đổi token

```bash
curl -sS -X POST "$KEYCLOAK_URL/realms/$REALM/protocol/openid-connect/token" \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -d "grant_type=client_credentials&client_id=mta-shared-partner&client_secret=***"
```

## Env trên be-ql-dao-tao-shared

```bash
# Admin console: https://mta.edu.vn/iam/admin/master/console/
# Token iss thực tế (frontend URL Keycloak): http://mta.edu.vn:9080/iam/realms/mta
KEYCLOAK_URL=http://mta.edu.vn:9080/iam
KEYCLOAK_REALM=mta
KEYCLOAK_ISSUER=http://mta.edu.vn:9080/iam/realms/mta
KEYCLOAK_JWKS_URL=http://172.17.0.1:9080/iam/realms/mta/protocol/openid-connect/certs
SHARED_API_ALLOWED_CLIENTS=mta-shared-partner
# Redis trên Server B (data)
REDIS_URL=redis://27.71.231.243:6379
# SHARED_API_AUTH_DISABLED=true
# SHARED_API_SIGNING_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
```

Client đã tạo sẵn: `mta-shared-partner` (Client Credentials, token 15 phút, scopes `read:subjects|subject-classes|lecturers`).

