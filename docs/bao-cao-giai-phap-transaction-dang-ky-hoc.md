# Báo cáo giải pháp xử lý Transaction đăng ký học

**Hệ thống:** Cổng học viên (cong-hoc-vien) / Backend portal (`be-portal`)  
**Phạm vi:** API `POST /api/class-register/class-register`  
**Commit tham chiếu:** `fa1132f67` — *fix logic chịu tải* (15/07/2026)  
**Mục đích tài liệu:** Trình bày giải pháp đã từng dùng, hạn chế, và giải pháp đã thay thế hiện tại.

---

## 1. Bối cảnh nghiệp vụ

Khi sinh viên đăng ký học phần trên cổng Internet:

1. Hệ thống kiểm tra điều kiện nghiệp vụ (đợt mở, tiên quyết, học trước, trần tín chỉ…).
2. Trong một **database transaction**, hệ thống:
   - Kiểm tra sĩ số lớp còn chỗ
   - Ghi bản ghi tham gia lớp (`StudentSubjectScore`)
   - Ghi nhật ký đăng ký theo đợt (`ClassRegisterLogs`)

Đặc thù vận hành: **nhiều sinh viên đăng ký đồng thời** vào cùng một lớp học phần (đặc biệt khi còn ít chỗ cuối). Nếu không khóa đúng tài nguyên, dễ xảy ra hiện tượng **overbooking** (vượt `maxStudent`).

---

## 2. Giải pháp đã từng dùng (trước khi sửa)

### 2.1. Ý tưởng

Dùng `prisma.$transaction` để gói các thao tác ghi vào một đơn vị atomic: hoặc thành công toàn bộ, hoặc rollback. Bên trong transaction vẫn thực hiện kiểm tra sĩ số bằng `count` rồi mới `create`.

### 2.2. Thứ tự xử lý trong Transaction

```
1. createMany ClassRegisterLogs          ← ghi nhật ký đăng ký trước
2. Với từng subjectClassId:
     a. findFirst StudentSubjectScore    ← đã đăng ký lớp này chưa?
     b. count StudentSubjectScore        ← đếm sĩ số hiện tại
     c. so sánh với maxStudent
     d. nếu còn chỗ → create StudentSubjectScore
```

### 2.3. Điểm mạnh

- Có rollback khi lỗi giữa chừng trong cùng transaction.
- Logic đơn giản, dễ đọc.
- Đủ dùng khi tải thấp / đăng ký ít người cùng lúc.

### 2.4. Hạn chế / rủi ro

| Rủi ro | Mô tả |
|--------|--------|
| **Race condition sĩ số** | Hai request cùng đọc `count` trước khi phía kia `create` → cả hai đều thấy “còn chỗ” → vượt `maxStudent`. |
| **Không có row lock** | Transaction không khóa dòng `SubjectClass` nên các session DB vẫn đọc/ghi song song trên cùng lớp. |
| **Thứ tự ghi chưa tối ưu** | Tạo `ClassRegisterLogs` trước `StudentSubjectScore` → nếu fail ở bước score, trạng thái trung gian khó diễn giải hơn. |
| **Trùng nhật ký** | Chưa có unique `(session, student, subjectClass)` trên `ClassRegisterLogs` → có thể sinh log trùng khi gửi request lặp. |
| **Deadlock tiềm ẩn** | Khi đăng ký nhiều lớp, nếu các transaction khóa/cập nhật theo thứ tự khác nhau (khi bổ sung lock sau này) dễ deadlock nếu không chuẩn hóa thứ tự. |

### 2.5. Minh họa race condition

Giả sử lớp có `maxStudent = 40`, đang có 39 SV:

| Thời điểm | Request A | Request B |
|-----------|-----------|-----------|
| T1 | `count = 39` → còn chỗ | `count = 39` → còn chỗ |
| T2 | `create` score thành công | `create` score thành công |
| Kết quả | Lớp có **41** SV — vượt sĩ số | |

**Kết luận giai đoạn cũ:** Transaction đảm bảo atomicity cho từng request, **nhưng không đảm bảo isolation đúng mức** cho bài toán tranh chấp sĩ số giữa nhiều request.

---

## 3. Giải pháp hiện tại (sau khi thay đổi)

### 3.1. Ý tưởng

Giữ `$transaction`, bổ sung **khóa bi quan (pessimistic lock)** trên dòng `SubjectClass` bằng `SELECT … FOR UPDATE`, chuẩn hóa thứ tự khóa, đảo thứ tự ghi Score → Log, và gia cố bằng **ràng buộc unique ở DB** + cấu hình connection pool.

### 3.2. Thứ tự xử lý trong Transaction (hiện tại)

```
0. (Ngoài TX) Validate nghiệp vụ: đợt mở, tiên quyết, học trước, trần tín chỉ
1. Sort danh sách subjectClassIds theo id
2. Trong $transaction:
     a. SELECT id FROM SubjectClass WHERE id IN (...) ORDER BY id FOR UPDATE
        → khóa các lớp cần đăng ký; request khác chờ đến khi TX này kết thúc
     b. findMany StudentSubjectScore (cùng student + danh sách lớp)
        → từ chối nếu đã đăng ký
     c. Với từng lớp (đã giữ lock):
          - count sĩ số
          - nếu đủ → throw lỗi
          - create StudentSubjectScore
     d. createMany ClassRegisterLogs
```

### 3.3. Các thay đổi kèm theo

| Hạng mục | Nội dung | Mục đích |
|----------|----------|----------|
| **Row lock** | `SELECT … FOR UPDATE` trên `SubjectClass` | Tuần tự hóa đăng ký cùng lớp → tránh overbook |
| **Thứ tự khóa** | Sort `id` trước khi lock | Tránh deadlock khi 2 TX khóa nhiều lớp theo thứ tự khác nhau |
| **Thứ tự ghi** | Score trước, Log sau | Chỉ ghi nhật ký khi đã vào lớp thành công |
| **Unique constraint** | `ClassRegisterLogs(sessionId, studentId, subjectClassId)` | DB chặn log trùng (kèm migration dọn duplicate cũ) |
| **Unique sẵn có** | `StudentSubjectScore(subjectClassId, studentId)` | Lớp phòng thủ thứ hai ở DB |
| **Pool size** | `DATABASE_POOL_SIZE` (mặc định 20) trên Prisma portal | Chịu tải nhiều connection khi đợt đăng ký đông |
| **Đồng bộ pattern** | Cùng `FOR UPDATE` ở API registration shared (`be-ql-dao-tao-shared`) | Hành vi sĩ số thống nhất giữa portal và đăng ký nội bộ |

### 3.4. Hành vi sau khi sửa (cùng ví dụ 39/40)

| Thời điểm | Request A | Request B |
|-----------|-----------|-----------|
| T1 | `FOR UPDATE` lấy lock lớp | Chờ lock |
| T2 | `count = 39` → create → commit | — |
| T3 | — | Nhận lock, `count = 40` → reject “đã đủ số lượng” |

Chỉ **một** sinh viên nhận chỗ cuối; sinh viên còn lại nhận lỗi nghiệp vụ rõ ràng.

### 3.5. Điểm mạnh của giải pháp hiện tại

- Khắc phục trực tiếp race condition sĩ số dưới tải đồng thời cao.
- An toàn ở cả tầng ứng dụng (lock + check) và tầng dữ liệu (unique).
- Thông báo lỗi gắn tên học phần, dễ hỗ trợ người dùng.
- Pattern có thể tái sử dụng cho các API đăng ký tương tự.

### 3.6. Lưu ý / trade-off

| Điểm | Giải thích |
|------|------------|
| **Lock contention** | Nhiều SV đổ vào cùng 1 lớp sẽ xếp hàng theo lock → độ trễ request tăng nhẹ ở “chỗ nóng”, đổi lấy đúng sĩ số. |
| **Phạm vi lock** | Chỉ khóa các `SubjectClass` trong request; không khóa toàn bảng. |
| **Validate ngoài TX** | Tiên quyết / tín chỉ vẫn kiểm trước transaction; phần tranh chấp tài nguyên (sĩ số, trùng lớp) nằm trong TX có lock. |
| **Unregister** | Transaction hủy đăng ký riêng (xóa log → history → attendance → score); không dùng `FOR UPDATE` vì không tranh sĩ số khi hủy; vẫn chặn hủy nếu đã phát sinh điểm/điểm danh/thi. |

---

## 4. Bảng so sánh tổng hợp

| Tiêu chí | Giải pháp cũ | Giải pháp hiện tại |
|----------|--------------|-------------------|
| Atomic ghi Score + Log | Có (`$transaction`) | Có (`$transaction`) |
| Chống overbook khi concurrent | Không đảm bảo | Đảm bảo bằng `FOR UPDATE` |
| Thứ tự ghi | Log → Score | Score → Log |
| Chống log trùng | Yếu | Unique constraint DB |
| Deadlock khi đăng ký nhiều lớp | Chưa đặt ra (vì chưa lock) | Phòng bằng sort `id` trước lock |
| Khả năng chịu tải đăng ký đồng thời | Hạn chế | Phù hợp đợt đăng ký đông |
| Connection pool cấu hình được | Chưa nhấn mạnh | `DATABASE_POOL_SIZE` |

---

## 5. Kiến trúc xử lý tổng thể (sau thay đổi)

```
[FE cong-hoc-vien]
    │  soft-gate: lớp đầy / đã ĐK / vượt TC / cùng môn
    ▼
[POST class-register — be-portal]
    │  1. Check đợt còn mở
    │  2. Check tiên quyết, học trước
    │  3. Check trần tín chỉ theo GPA
    ▼
[$transaction]
    │  FOR UPDATE SubjectClass (sorted ids)
    │  Check trùng StudentSubjectScore
    │  Count sĩ số → Create StudentSubjectScore
    │  CreateMany ClassRegisterLogs
    ▼
[DB]
    Unique: StudentSubjectScore(subjectClassId, studentId)
    Unique: ClassRegisterLogs(session, student, subjectClass)
```

---

## 6. Kết luận trình bày

1. **Giải pháp cũ** dựa trên Prisma transaction + kiểm tra sĩ số bằng `count`, phù hợp tải thấp nhưng **không an toàn dưới tranh chấp đồng thời**.
2. **Giải pháp hiện tại** bổ sung **pessimistic locking (`FOR UPDATE`)**, chuẩn hóa thứ tự khóa/ghi, và **ràng buộc unique ở DB**, chuyển từ “atomic từng request” sang “**tuần tự hóa truy cập tài nguyên lớp học phần**”.
3. Kết quả mong đợi: **không vượt sĩ số**, giảm log trùng, hệ thống sẵn sàng hơn cho đợt đăng ký học đồng thời quy mô lớn trên cổng học viên.

---

## 7. Phụ lục kỹ thuật (tham chiếu mã nguồn)

| Thành phần | Đường dẫn |
|------------|-----------|
| API đăng ký portal | `apps/backend/be-portal/src/api/class-register.ts` |
| Pool Prisma portal | `apps/backend/be-portal/src/index.ts` |
| Registration shared | `apps/backend/be-ql-dao-tao-shared/src/api/registration.ts` |
| Migration unique log | `packages/database/prisma/migrations/20260715140000_class_register_logs_unique/migration.sql` |
| FE soft-gate | `apps/client/cong-hoc-vien/src/components/commons/registered-courses-list/helper.tsx` |

**Lệnh xem diff gốc (nếu cần đính kèm slide):**

```bash
git show fa1132f67 -- apps/backend/be-portal/src/api/class-register.ts
```
