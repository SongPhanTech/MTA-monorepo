import type { Context } from "hono"

export const OPENAPI_INFO_DESCRIPTION = `## Giới thiệu

Tài liệu mô tả toàn bộ các API **Shared** phục vụ hệ thống Quản lý Đào tạo của Học viện Kỹ thuật Quân sự (MTA).

Bộ API này cung cấp dữ liệu cho ứng dụng di động và các hệ thống tích hợp bên thứ ba, bao gồm:

- Tra cứu **môn học**, **lớp niên chế**, **ngành đào tạo**, **đơn vị tổ chức**
- Tra cứu và quản lý thông tin **giảng viên**
- **Đăng ký / hủy đăng ký** học phần theo đợt
- Xem **thời khóa biểu**, **bảng điểm** sinh viên
- Tra cứu **học kỳ**, **năm học**, **đợt đăng ký**

---

## Xác thực

Tất cả các endpoint đều yêu cầu xác thực bằng **Bearer Token (JWT)**.

Thêm header sau vào mỗi request:

\`\`\`
Authorization: Bearer <access_token>
\`\`\`

Token được cấp sau khi đăng nhập qua hệ thống SSO của MTA. Token có thời hạn sử dụng; khi hết hạn cần làm mới (refresh) trước khi gọi lại API.

---

## Định dạng phản hồi

Tất cả các response thành công đều trả về HTTP **200** với cấu trúc JSON thống nhất:

\`\`\`json
{
  "result_code": "000",
  "result_desc": "success",
  "data": [ ... ]
}
\`\`\`

| Trường | Kiểu | Mô tả |
|---|---|---|
| \`result_code\` | string | \`"000"\` = thành công; các giá trị khác là mã lỗi nghiệp vụ |
| \`result_desc\` | string | Mô tả ngắn kết quả |
| \`data\` | array / object | Dữ liệu trả về (tuỳ endpoint) |

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

- Tất cả request đều sử dụng phương thức **POST** với body \`application/json\`.
- Các trường tìm kiếm (\`key_word\`) **không phân biệt hoa/thường** (case-insensitive).
- Ngày giờ được trả về theo chuẩn **ISO 8601** (UTC).
- Trường \`class_time\` sử dụng ký hiệu: \`T2\`–\`T7\` là thứ 2–7, \`CN\` là Chủ nhật; theo sau là tiết bắt đầu và kết thúc, ví dụ: \`T3(1-5), T5(6-10)\`.`

export function buildOpenApiDocumentConfig(c: Context) {
  return {
    openapi: "3.0.0" as const,
    info: {
      version: "1.0.0",
      title: "API Quản lý Đào tạo — MTA Shared",
      description: OPENAPI_INFO_DESCRIPTION,
    },
    servers: [
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
