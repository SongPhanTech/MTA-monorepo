import type { Context } from "hono"

export const OPENAPI_INFO_DESCRIPTION = `## Giới thiệu

Tài liệu mô tả toàn bộ các API **Shared** phục vụ hệ thống Quản lý Đào tạo của Học viện Kỹ thuật Quân sự (MTA).

Bộ API này cung cấp dữ liệu cho ứng dụng di động và các hệ thống tích hợp bên thứ ba, bao gồm:

- Tra cứu **môn học**, **lớp niên chế**, **ngành đào tạo**, **đơn vị tổ chức**
- Tra cứu và quản lý thông tin **giảng viên**
- **Đăng ký / hủy đăng ký** học phần theo đợt
- Xem **thời khóa biểu**, **bảng điểm** sinh viên
- Tra cứu **học kỳ**, **năm học**, **đợt đăng ký**
- **REST v1** dành cho đối tác: \`/v1/subjects\`, \`/v1/subject-classes\`, \`/v1/lecturers\`

---

## Tích hợp đối tác — API v1 (RESTful)

### 1. Cấp Access Token (Keycloak Client Credentials)

\`\`\`http
POST {KEYCLOAK_URL}/realms/{REALM}/protocol/openid-connect/token
Content-Type: application/x-www-form-urlencoded

grant_type=client_credentials
&client_id={CLIENT_ID}
&client_secret={CLIENT_SECRET}
\`\`\`

Token TTL khuyến nghị: **15 phút**. Scopes/roles cần có:

| Scope | Endpoint |
|---|---|
| \`read:subjects\` | \`GET /v1/subjects\` |
| \`read:subject-classes\` | \`GET /v1/subject-classes\`, \`GET /v1/subject-classes/{class_code}\` |
| \`read:lecturers\` | \`GET /v1/lecturers\` |

### 2. Header bắt buộc cho mọi request \`/v1/*\`

| Header | Mô tả |
|---|---|
| \`Authorization\` | \`Bearer <access_token>\` |
| \`X-Timestamp\` | Unix time (giây hoặc ms). Chênh lệch > 5 phút → 401 |
| \`X-Nonce\` | Chuỗi ngẫu nhiên duy nhất; tái sử dụng trong 5 phút → 409 |

### 3. Chữ ký phản hồi

Nếu hệ thống bật ký số, response có header:

- \`X-Signature\`: Base64 RSA-SHA256 trên raw body JSON
- \`X-Signature-Alg\`: \`RSA-SHA256\`

Đối tác verify bằng **public key** được bàn giao.

### 4. Edge (Nginx)

- HTTPS bắt buộc; HTTP → HTTPS redirect
- IP whitelist (dải IP tĩnh do đối tác cung cấp)
- Rate limit: **100 req/phút/IP** → HTTP 429
- WAF (ModSecurity) lọc SQLi/XSS trước khi tới backend

Public path khuyến nghị: \`https://mta.edu.vn/api/shared/v1/...\`

### 5. REST resources

| Method | Path | Mô tả |
|---|---|---|
| GET | \`/v1/subjects?q=\` | Danh sách học phần |
| GET | \`/v1/subject-classes?q=&semester_code=\` | Danh sách lớp học phần |
| GET | \`/v1/subject-classes/{class_code}\` | Chi tiết: mã, tên, GV chính/phụ, danh sách HV |
| GET | \`/v1/lecturers?q=\` | Giảng viên + bộ môn + đơn vị |

---

## Xác thực (API legacy POST)

Các endpoint \`POST /get-*\` yêu cầu Bearer Token SSO (nếu middleware auth được bật trên môi trường tương ứng).

\`\`\`
Authorization: Bearer <access_token>
\`\`\`

---

## Định dạng phản hồi

\`\`\`json
{
  "result_code": "000",
  "result_desc": "success",
  "data": [ ... ]
}
\`\`\`

| Trường | Kiểu | Mô tả |
|---|---|---|
| \`result_code\` | string | \`"000"\` = thành công |
| \`result_desc\` | string | Mô tả ngắn kết quả |
| \`data\` | array / object | Dữ liệu trả về |

---

## Mã lỗi nghiệp vụ

| Mã lỗi | HTTP | Ý nghĩa |
|---|---|---|
| \`STUDENT_NOT_FOUND\` | 404 | Không tìm thấy sinh viên theo mã |
| \`STUDENT_NO_CLASS\` | 404 | Sinh viên chưa được xếp lớp niên chế |
| \`SESSION_NOT_FOUND\` | 404 | Không có đợt đăng ký học phù hợp |
| \`CLASS_NOT_FOUND\` | 404 | Lớp học phần không tồn tại hoặc đã bị hủy |
| \`CURRICULUM_NOT_FOUND\` | 404 | Chương trình đào tạo không tồn tại |

---

## Quy ước chung

- API **v1** dùng **GET** RESTful (query/path params).
- API legacy dùng **POST** + body \`application/json\`.
- Trường tìm kiếm **không phân biệt hoa/thường**.
- Ngày giờ theo **ISO 8601** (UTC).`

export function buildOpenApiDocumentConfig(c: Context) {
  return {
    openapi: "3.0.0" as const,
    info: {
      version: "1.1.0",
      title: "API Quản lý Đào tạo — MTA Shared",
      description: OPENAPI_INFO_DESCRIPTION,
    },
    servers: [
      {
        url: "https://mta.edu.vn/api/shared",
        description: "mta_online (qua Nginx)",
      },
      {
        url: "https://api.shared.daotao.mta.swantech.vn",
        description: "Dev environment",
      },
      {
        url: new URL(c.req.url).origin,
        description: "Current environment",
      },
    ],
  }
}
