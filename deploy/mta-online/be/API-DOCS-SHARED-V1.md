# Tài liệu tích hợp API Shared v1 — Học viện Kỹ thuật Quân sự (MTA)

Phiên bản tài liệu: **1.2**  
Phạm vi: 5 API đọc dữ liệu đào tạo dành cho hệ thống bên thứ ba (gọi qua Internet).

| Nhu cầu | Method | Path |
|---------|--------|------|
| Danh sách học phần | `GET` | `/api/shared/v1/subjects` |
| Danh sách lớp học phần | `GET` | `/api/shared/v1/subject-classes` |
| Chi tiết lớp học phần | `GET` | `/api/shared/v1/subject-classes/{class_code}` |
| Danh sách giảng viên (bộ môn + đơn vị) | `GET` | `/api/shared/v1/lecturers` |
| Full điểm sinh viên (theo học kỳ) | `GET` | `/api/shared/v1/students/{student_code}/scores` |

---

## Lịch sử chỉnh sửa

| Thời gian (UTC+7) | Phiên bản | Nội dung chỉnh sửa |
|-------------------|-----------|--------------------|
| 2026-11-10 15:45 | 1.2 | Bản Internet-only: bỏ URL nội bộ MTA (`localhost`, `:3045`); chỉ còn `https://mta.edu.vn/...`. |
| 2026-11-10 15:50 | 1.2 | Xuất tài liệu Word (`.docx`) từ bản Markdown để bàn giao đối tác. |
| 2026-11-10 16:15 | 1.2 | Bổ sung API `GET /students/{student_code}/scores` (full điểm theo học kỳ, cờ học lại/thi lại); thêm scope `read:student-scores`. |
| 2026-11-10 16:20 | 1.2 | Thêm mục **Lịch sử chỉnh sửa**; giữ nguyên số phiên bản tài liệu **1.2**. |

---

## 1. Tổng quan

- Giao thức: **HTTPS** (RESTful, JSON UTF-8)
- Xác thực: **OAuth 2.0 Client Credentials** (Keycloak) → Access Token JWT
- Chống replay: header **X-Timestamp** + **X-Nonce**
- Phân quyền: JWT phải chứa **scope** tương ứng từng nhóm API
- Envelope response thành công: luôn có `result_code`, `result_desc`, `data`

### Base URL (Internet)

| Mục đích | URL |
|----------|-----|
| Token | `https://mta.edu.vn/iam/realms/mta/protocol/openid-connect/token` |
| API | `https://mta.edu.vn/api/shared/v1` |

Ví dụ đầy đủ một API: `https://mta.edu.vn/api/shared/v1/subjects?q=TIN`

> **Lưu ý tạm thời khi test:** DNS `mta.edu.vn` có thể đi qua WAF. Nếu request bị chặn/treo, dùng curl với `--resolve mta.edu.vn:443:27.71.20.109` để trỏ thẳng origin (vẫn là HTTPS Internet). Khi WAF đã whitelist path `/iam/` và `/api/shared/v1/`, bỏ `--resolve`.

---

## 2. Cơ chế xác thực & bảo mật

### 2.1. Lấy Access Token (bước bắt buộc)

**Luồng:** OAuth 2.0 **Client Credentials**.

```http
POST https://mta.edu.vn/iam/realms/mta/protocol/openid-connect/token
Content-Type: application/x-www-form-urlencoded

grant_type=client_credentials
&client_id={CLIENT_ID}
&client_secret={CLIENT_SECRET}
```

| Tham số | Ý nghĩa |
|---------|---------|
| `grant_type` | Cố định `client_credentials` |
| `client_id` | Mã client được cấp (vd `mta-shared-partner`) |
| `client_secret` | Secret được cấp riêng (bảo mật, không công khai) |

**Response token (rút gọn):**

```json
{
  "access_token": "<JWT>",
  "expires_in": 900,
  "token_type": "Bearer",
  "scope": "read:subjects read:subject-classes read:lecturers read:student-scores profile email"
}
```

| Trường | Ý nghĩa |
|--------|---------|
| `access_token` | JWT dùng cho header `Authorization` |
| `expires_in` | Thời hạn token (giây), hiện **900 = 15 phút** |
| `scope` | Danh sách quyền; phải đủ scope của API cần gọi |

Khi hết hạn: gọi lại endpoint token để lấy JWT mới.

### 2.2. Scope ↔ API

| Scope trong JWT | API được phép |
|-----------------|---------------|
| `read:subjects` | `GET /api/shared/v1/subjects` |
| `read:subject-classes` | `GET /api/shared/v1/subject-classes`, `GET /api/shared/v1/subject-classes/{class_code}` |
| `read:lecturers` | `GET /api/shared/v1/lecturers` |
| `read:student-scores` | `GET /api/shared/v1/students/{student_code}/scores` |

Thiếu scope → HTTP **403**.

### 2.3. Header bắt buộc trên mọi request API

| Header | Bắt buộc | Ý nghĩa |
|--------|----------|---------|
| `Authorization` | Có | `Bearer <access_token>` |
| `X-Timestamp` | Có | Unix time (giây **hoặc** mili-giây). Lệch quá **±5 phút** so với server → 401 |
| `X-Nonce` | Có | Chuỗi ngẫu nhiên duy nhất (khuyến nghị UUID). Dùng lại trong 5 phút → **409** (replay) |

Mỗi request phải dùng **nonce mới**.

### 2.4. Header phản hồi (tham khảo)

| Header | Ý nghĩa |
|--------|---------|
| `X-Request-Id` | Mã truy vết request |
| `X-Signature` | Chữ ký RSA-SHA256 (Base64) trên raw body JSON (nếu hệ thống bật) |
| `X-Signature-Alg` | `RSA-SHA256` |

Đối tác có thể verify `X-Signature` bằng **public key** được bàn giao.

### 2.5. Mã lỗi HTTP thường gặp

| HTTP | Ý nghĩa |
|------|---------|
| 200 | Thành công |
| 400 | Thiếu/sai `X-Timestamp` hoặc `X-Nonce` |
| 401 | Thiếu/sai token, token hết hạn, timestamp ngoài cửa sổ |
| 403 | Client không được phép hoặc thiếu scope |
| 404 | Không tìm thấy tài nguyên (vd mã lớp) |
| 409 | Nonce đã dùng (replay) |
| 429 | Vượt rate limit (100 req/phút/IP) |
| 503 | Hạ tầng phụ trợ chưa sẵn sàng |

Lỗi thường trả body:

```json
{ "message": "mô tả lỗi tiếng Việt" }
```

---

## 3. Định dạng response thành công (chung)

```json
{
  "result_code": "000",
  "result_desc": "success",
  "data": [ ... ]
}
```

| Trường | Kiểu | Ý nghĩa |
|--------|------|---------|
| `result_code` | string | `"000"` = thành công nghiệp vụ |
| `result_desc` | string | `"success"` khi thành công |
| `data` | array \| object | Payload theo từng API |

---

## 4. API chi tiết

### 4.1. Danh sách học phần

**Mô tả:** Tra cứu danh sách học phần (phiên bản môn học).

```http
GET https://mta.edu.vn/api/shared/v1/subjects?q={keyword}
```

**Scope:** `read:subjects`

#### Query parameters

| Tham số | Bắt buộc | Kiểu | Ý nghĩa | Ví dụ |
|---------|----------|------|---------|-------|
| `q` | Không | string | Từ khóa tìm theo **mã** hoặc **tên** học phần (không phân biệt hoa thường). Bỏ trống = lấy danh sách (tối đa ~500 bản ghi) | `TIN` |

#### Ví dụ gọi

```bash
curl -sSk --resolve mta.edu.vn:443:27.71.20.109 \
  "https://mta.edu.vn/api/shared/v1/subjects?q=TIN" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Timestamp: $(date +%s)000" \
  -H "X-Nonce: $(uuidgen)"
```

#### Response `data[]`

```json
{
  "result_code": "000",
  "result_desc": "success",
  "data": [
    {
      "subject_code": "2316715",
      "subject_name": "Tin học ứng dụng trong kỹ thuật ôtô xe máy",
      "courser": 60,
      "class_credit_hour": 2,
      "dvht": 4,
      "description": "Thi viết"
    }
  ]
}
```

| Trường | Kiểu | Ý nghĩa |
|--------|------|---------|
| `subject_code` | string \| null | Mã học phần |
| `subject_name` | string | Tên học phần |
| `courser` | number \| null | Số tiết học |
| `class_credit_hour` | number | Số tín chỉ |
| `dvht` | number | Đơn vị học trình (quy đổi ≈ số tiết / 15) |
| `description` | string | Hình thức thi (diễn giải tiếng Việt) |

---

### 4.2. Danh sách lớp học phần

**Mô tả:** Tra cứu danh sách lớp học phần đang hiệu lực (chưa xóa/hủy).

```http
GET https://mta.edu.vn/api/shared/v1/subject-classes?q={keyword}&semester_code={code}
```

**Scope:** `read:subject-classes`

#### Query parameters

| Tham số | Bắt buộc | Kiểu | Ý nghĩa | Ví dụ |
|---------|----------|------|---------|-------|
| `q` | Không | string | Tìm theo mã/tên **lớp** hoặc mã/tên **học phần** | `003` |
| `semester_code` | Không | string | Lọc theo mã học kỳ hoặc khớp tên học kỳ | `HK1-2025` |

#### Ví dụ gọi

```bash
curl -sSk --resolve mta.edu.vn:443:27.71.20.109 \
  "https://mta.edu.vn/api/shared/v1/subject-classes?q=003" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Timestamp: $(date +%s)000" \
  -H "X-Nonce: $(uuidgen)"
```

#### Response `data[]`

```json
{
  "result_code": "000",
  "result_desc": "success",
  "data": [
    {
      "class_code": "003560 01",
      "class_name": "Chủ nghĩa xã hội khoa học + TL",
      "subject_code": "003560",
      "subject_name": "Chủ nghĩa xã hội khoa học + TL",
      "semester_name": "Học kỳ 2 2023 - 2024",
      "main_teacher": "Tô Thanh Tùng",
      "extra_teacher": null,
      "enrolled_count": 0
    }
  ]
}
```

| Trường | Kiểu | Ý nghĩa |
|--------|------|---------|
| `class_code` | string | Mã lớp học phần |
| `class_name` | string | Tên lớp học phần |
| `subject_code` | string \| null | Mã học phần gắn lớp |
| `subject_name` | string | Tên học phần |
| `semester_name` | string | Tên học kỳ |
| `main_teacher` | string \| null | Họ tên giảng viên chính (null nếu chưa phân công) |
| `extra_teacher` | string \| null | Họ tên giảng viên phụ |
| `enrolled_count` | number | Sĩ số đã ghi danh |

> Nếu `class_code` có khoảng trắng, khi gọi API chi tiết phải **URL-encode** (vd `003560%2001`).

---

### 4.3. Chi tiết lớp học phần

**Mô tả:** Chi tiết một lớp: mã, tên, GV chính/phụ, danh sách học viên đã ghi danh.

```http
GET https://mta.edu.vn/api/shared/v1/subject-classes/{class_code}
```

**Scope:** `read:subject-classes`

#### Path parameters

| Tham số | Bắt buộc | Kiểu | Ý nghĩa |
|---------|----------|------|---------|
| `class_code` | Có | string | Mã lớp học phần (đúng `class_code` trả về ở API danh sách) |

#### Ví dụ gọi

```bash
# class_code = "003560 01" → encode khoảng trắng
curl -sSk --resolve mta.edu.vn:443:27.71.20.109 \
  "https://mta.edu.vn/api/shared/v1/subject-classes/003560%2001" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Timestamp: $(date +%s)000" \
  -H "X-Nonce: $(uuidgen)"
```

#### Response `data` (object)

```json
{
  "result_code": "000",
  "result_desc": "success",
  "data": {
    "class_code": "003560 01",
    "class_name": "Chủ nghĩa xã hội khoa học + TL",
    "main_teacher": {
      "teacher_code": "GV19005042",
      "teacher": "Nguyễn Thị Nương"
    },
    "extra_teacher": null,
    "students": [
      {
        "student_code": "25150001",
        "student_name": "Nguyễn Văn A"
      }
    ],
    "enrolled_count": 58
  }
}
```

| Trường | Kiểu | Ý nghĩa |
|--------|------|---------|
| `class_code` | string | Mã lớp |
| `class_name` | string | Tên lớp |
| `main_teacher` | object \| null | Giảng viên chính |
| `main_teacher.teacher_code` | string \| null | Mã giảng viên |
| `main_teacher.teacher` | string | Họ tên giảng viên chính |
| `extra_teacher` | object \| null | Giảng viên phụ (cùng cấu trúc `main_teacher`) |
| `students` | array | Danh sách học viên đã có trong lớp |
| `students[].student_code` | string \| null | Mã học viên / sinh viên |
| `students[].student_name` | string | Họ tên học viên |
| `enrolled_count` | number | Sĩ số đã ghi danh |

Không tìm thấy lớp → HTTP **404** `{ "message": "Lớp học phần không tồn tại" }`.

---

### 4.4. Danh sách giảng viên (bộ môn + đơn vị)

**Mô tả:** Tra cứu giảng viên kèm **bộ môn** và **đơn vị** (khoa/viện).

```http
GET https://mta.edu.vn/api/shared/v1/lecturers?q={keyword}
```

**Scope:** `read:lecturers`

#### Query parameters

| Tham số | Bắt buộc | Kiểu | Ý nghĩa | Ví dụ |
|---------|----------|------|---------|-------|
| `q` | Không | string | Tìm theo họ tên / mã định danh (không phân biệt hoa thường). Nên dùng tiếng Việt có dấu nếu tìm theo tên | `Nguyễn` |

#### Ví dụ gọi

```bash
curl -sSk --resolve mta.edu.vn:443:27.71.20.109 \
  --get "https://mta.edu.vn/api/shared/v1/lecturers" \
  --data-urlencode "q=Nguyễn" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Timestamp: $(date +%s)000" \
  -H "X-Nonce: $(uuidgen)"
```

#### Response `data[]`

```json
{
  "result_code": "000",
  "result_desc": "success",
  "data": [
    {
      "teacher_code": "GV001",
      "teacher": "Nguyễn Văn A",
      "bo_mon_code": "BM_MMT",
      "bo_mon_name": "Bộ môn Mạng máy tính",
      "department_code": "K_CNTT",
      "department_name": "Khoa CNTT",
      "rank_name": "Thượng tá",
      "position_name": "Giảng viên",
      "phone_number": "0901234567",
      "working_mail": "gv@mta.edu.vn"
    }
  ]
}
```

| Trường | Kiểu | Ý nghĩa |
|--------|------|---------|
| `teacher_code` | string \| null | Mã định danh giảng viên |
| `teacher` | string | Họ tên đầy đủ |
| `bo_mon_code` | string \| null | Mã bộ môn (null nếu hồ sơ gắn trực tiếp đơn vị cấp khoa) |
| `bo_mon_name` | string | Tên bộ môn (rỗng nếu không có) |
| `department_code` | string \| null | Mã đơn vị (khoa/viện/…) |
| `department_name` | string | Tên đơn vị |
| `rank_name` | string | Quân hàm / cấp bậc |
| `position_name` | string | Chức vụ / chức danh |
| `phone_number` | string | Số điện thoại |
| `working_mail` | string | Email công tác |

**Quy ước bộ môn / đơn vị:**  
Nếu đơn vị gắn hồ sơ là **bộ môn** → `bo_mon_*` = đơn vị đó, `department_*` = đơn vị cha.  
Nếu gắn trực tiếp khoa/viện → `department_*` = đơn vị đó, `bo_mon_*` để trống/null.

---

### 4.5. Full điểm sinh viên (gom theo học kỳ)

**Mô tả:** Lấy toàn bộ điểm của một sinh viên theo mã. Kết quả gom nhóm theo học kỳ (mới → cũ). Mỗi môn có cờ **học lại** / **thi lại** theo loại lớp.

```http
GET https://mta.edu.vn/api/shared/v1/students/{student_code}/scores
```

**Scope:** `read:student-scores`

#### Path parameters

| Tham số | Bắt buộc | Kiểu | Ý nghĩa |
|---------|----------|------|---------|
| `student_code` | Có | string | Mã sinh viên / học viên (`UserProfile.code`) |

#### Ví dụ gọi

```bash
curl -sSk --resolve mta.edu.vn:443:27.71.20.109 \
  "https://mta.edu.vn/api/shared/v1/students/25150001/scores" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Timestamp: $(date +%s)000" \
  -H "X-Nonce: $(uuidgen)"
```

#### Response `data`

```json
{
  "result_code": "000",
  "result_desc": "success",
  "data": {
    "student_code": "25150001",
    "student_name": "Nguyễn Văn A",
    "semesters": [
      {
        "semester_code": "080",
        "semester_name": "Học kỳ 1 2025-2026",
        "scores": [
          {
            "subject_code": "TIN001",
            "subject_name": "Tin học đại cương",
            "class_code": "TIN001 01",
            "class_name": "Tin học đại cương - N01",
            "class_type": "RETAKE",
            "is_retake": true,
            "is_reexam": false,
            "is_improving": false,
            "credit": 3,
            "attendance_score": 8,
            "midterm_score": 7,
            "exam_score": 8,
            "final_score10": 7.8,
            "final_score4": 3,
            "grade_letter": "B",
            "pass": true,
            "bonus_score": 0,
            "description": ""
          }
        ]
      }
    ]
  }
}
```

| Trường | Kiểu | Ý nghĩa |
|--------|------|---------|
| `class_type` | string | `NORMAL` \| `RETAKE` \| `REEXAM` \| `LINKED` \| `STAYBACK` \| `TRANSFER` |
| `is_retake` | boolean | `true` = **học lại** (`class_type = RETAKE`) |
| `is_reexam` | boolean | `true` = **thi lại** (`class_type = REEXAM`) |
| `is_improving` | boolean | Học cải thiện (môn đã đạt, học lại để nâng điểm) |
| `final_score10` / `final_score4` / `grade_letter` / `pass` | | Điểm tổng kết + quy đổi theo cấu hình khóa học |

Không tìm thấy sinh viên → HTTP **404** `{ "message": "Không tìm thấy thông tin sinh viên" }`.

---

## 5. Quy trình gọi end-to-end

1. Nhận `client_id` / `client_secret` từ MTA (kênh bảo mật).
2. `POST` token endpoint Internet → lấy `access_token` (TTL ~15 phút).
3. Kiểm tra `scope` trong response token đủ quyền API cần gọi.
4. Với mỗi request API:
   - Gắn `Authorization: Bearer …`
   - Gắn `X-Timestamp` (unix ms khuyến nghị)
   - Gắn `X-Nonce` **mới** (UUID)
5. Parse JSON: `result_code === "000"` rồi đọc `data`.
6. (Tuỳ chọn) Verify `X-Signature` bằng public key được bàn giao.
7. Token gần hết hạn → xin token mới trước khi gọi tiếp.

### Script mẫu (Internet)

```bash
#!/usr/bin/env bash
set -euo pipefail

CLIENT_ID="mta-shared-partner"
CLIENT_SECRET="***"   # điền secret được cấp
RESOLVE=(--resolve mta.edu.vn:443:27.71.20.109)  # bỏ khi WAF đã whitelist

TOKEN=$(curl -sSk "${RESOLVE[@]}" \
  -X POST "https://mta.edu.vn/iam/realms/mta/protocol/openid-connect/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=client_credentials&client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}" \
  | jq -r .access_token)

if [[ -z "$TOKEN" || "$TOKEN" == "null" ]]; then
  echo "Không lấy được token" >&2
  exit 1
fi

call_api () {
  local path="$1"
  curl -sSk "${RESOLVE[@]}" "https://mta.edu.vn/api/shared/v1${path}" \
    -H "Authorization: Bearer ${TOKEN}" \
    -H "X-Timestamp: $(date +%s)000" \
    -H "X-Nonce: $(uuidgen)"
}

call_api "/subjects?q=TIN"
# call_api "/subject-classes?q=003"
# call_api "/subject-classes/003560%2001"
# call_api "/lecturers?q=a"
# call_api "/students/25150001/scores"
```

---

## 6. Thông tin bàn giao

| Hạng mục | Giá trị |
|----------|---------|
| Client ID | `mta-shared-partner` |
| Client Secret | Cấp riêng (không ghi công khai trong tài liệu) |
| Token endpoint | `https://mta.edu.vn/iam/realms/mta/protocol/openid-connect/token` |
| API base | `https://mta.edu.vn/api/shared/v1` |
| Token TTL | 15 phút |
| Rate limit | 100 request / phút / IP |
| Public key chữ ký | File `shared-api-signing.pub.pem` (bàn giao kèm) |

**Bảo mật:** không đưa `client_secret` vào repository hay kênh không mã hóa. Sau giai đoạn test nên rotate secret nếu đã lộ.
