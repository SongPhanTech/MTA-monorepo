# API LỊCH THI & LỊCH COI THI (MTA)

### 1. Header bắt buộc (Gửi kèm mọi request)

```http
x-clientid: <CLIENT_ID>
x-clientsecret: <CLIENT_SECRET>
Content-Type: application/json
```

- **Base URL Prod:** `https://daotao.swantech.vn/api/system/public`
- **Base URL Local:** `http://localhost:6083`

---

### 2. Lịch thi Sinh viên

- **Method:** `GET` hoặc `POST`
- **Endpoint:** `/ExamSchedules/student`

#### Đầu vào (Params / JSON Body):

| Tham số         |  Kiểu  |    Bắt buộc     | Mô tả                            |
| :-------------- | :----: | :-------------: | :------------------------------- |
| `userProfileId` | string | **Khuyên dùng** | ID UserProfile SSO của sinh viên |
| `semesterId`    |  uuid  |      Không      | ID kỳ học                        |
| `schoolYearId`  |  uuid  |      Không      | ID năm học                       |
| `fromDate`      |  date  |      Không      | Từ ngày (VD: `2026-09-01`)       |
| `toDate`        |  date  |      Không      | Đến ngày (VD: `2026-09-30`)      |

#### Ví dụ gọi (GET):

```http
GET https://daotao.swantech.vn/api/system/public/ExamSchedules/student?userProfileId=USER_123&fromDate=2026-09-01&toDate=2026-09-30
```

#### Dữ liệu trả về (200 OK):

```json
{
  "Total": 1,
  "Data": [
    {
      "Id": "8f2d4e61-a1b2-c3d4-e5f6-7890abcdef12",
      "Rownum": 1,
      "student_code": "2001001",
      "student_name": "Nguyễn Văn An",
      "user_profile_id": "USER_123",
      "so_thu_tu": 15,
      "exam_class_code": "ATTT20_PTPMAT 1",
      "exam_date": "2026-09-15T00:00:00",
      "start_time": "07:30:00",
      "end_time": "09:30:00",
      "room_name": "P.302",
      "building_name": "Nhà H1",
      "training_location_name": "236 Hoàng Quốc Việt",
      "subject_code": "PTPMAT",
      "subject_name": "Phát triển phần mềm an toàn",
      "credit_count": 4,
      "exam_type": "Tự luận",
      "exam_period_name": "Ca 1",
      "semester_name": "Học kỳ 1",
      "school_year_name": "2026-2027"
    }
  ]
}
```

---

### 3. Lịch coi thi Giảng viên

- **Method:** `GET` hoặc `POST`
- **Endpoint:** `/ExamSchedules/lecturer`

#### Đầu vào (Params / JSON Body):

| Tham số         |  Kiểu  |    Bắt buộc     | Mô tả                             |
| :-------------- | :----: | :-------------: | :-------------------------------- |
| `userProfileId` | string | **Khuyên dùng** | ID UserProfile SSO của giảng viên |
| `semesterId`    |  uuid  |      Không      | ID kỳ học                         |
| `schoolYearId`  |  uuid  |      Không      | ID năm học                        |
| `fromDate`      |  date  |      Không      | Từ ngày (VD: `2026-09-01`)        |
| `toDate`        |  date  |      Không      | Đến ngày (VD: `2026-09-30`)       |

#### Ví dụ gọi (GET):

```http
GET https://daotao.swantech.vn/api/system/public/ExamSchedules/lecturer?userProfileId=GV_456&fromDate=2026-09-01&toDate=2026-09-30
```

#### Dữ liệu trả về (200 OK):

```json
{
  "Total": 1,
  "Data": [
    {
      "Id": "3c9a496f-6e27-cdb9-1938-fdfba6a2c832",
      "Rownum": 1,
      "lecturer_code": "CB0123",
      "lecturer_name": "Khương Thành Văn",
      "user_profile_id": "GV_456",
      "student_count": 45,
      "exam_class_code": "ATTT20_PTPMAT 1",
      "exam_date": "2026-09-15T00:00:00",
      "start_time": "07:30:00",
      "end_time": "09:30:00",
      "room_name": "P.302",
      "building_name": "Nhà H1",
      "training_location_name": "236 Hoàng Quốc Việt",
      "subject_code": "PTPMAT",
      "subject_name": "Phát triển phần mềm an toàn",
      "credit_count": 4,
      "exam_type": "Tự luận",
      "exam_period_name": "Ca 1",
      "semester_name": "Học kỳ 1",
      "school_year_name": "2026-2027"
    }
  ]
}
```
