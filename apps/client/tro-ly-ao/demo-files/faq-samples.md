# FAQ mẫu cho demo

> Quy trình: vào **Quản trị → Dữ liệu → Câu hỏi thường gặp → Thêm mới**, chọn `Loại câu hỏi`, copy-paste `Câu hỏi` và `Câu trả lời`.

## Chuẩn bị (tạo trước buổi demo — đã APPROVE)

Nạp 2 FAQ này trước và phê duyệt để có dữ liệu gốc trong vector DB. Nếu không có dữ liệu gốc, các FAQ test trùng lặp ở dưới sẽ không có gì để so sánh.

### FAQ gốc #1

- **Loại**: (chọn 1 topic bất kỳ, ghi nhớ để dùng lại ở phần trùng lặp)
- **Câu hỏi**: `Quy trình đăng ký học lại tại nhà trường như thế nào?`
- **Câu trả lời**:
  ```
  Sinh viên có nhu cầu đăng ký học lại nộp đơn xin học lại tại Phòng Đào tạo kèm bảng điểm hiện tại. Sau khi được duyệt, sinh viên đóng học phí học lại theo quy định và tham gia lớp học cùng khóa đang mở môn tương ứng. Kết quả học lại sẽ được cập nhật thay thế điểm cũ trong bảng điểm chính thức của sinh viên.
  ```

### FAQ gốc #2

- **Loại**: (chọn topic bất kỳ, khác loại với FAQ #1 cũng được)
- **Câu hỏi**: `Làm thế nào để cấp lại thẻ sinh viên bị mất?`
- **Câu trả lời**:
  ```
  Khi thẻ sinh viên bị mất, sinh viên làm đơn xin cấp lại thẻ tại Phòng Công tác sinh viên, kèm bản sao CCCD và ảnh 3x4. Lệ phí cấp lại thẻ được thu theo quy định hiện hành của nhà trường. Thời gian trả thẻ mới khoảng 5 đến 7 ngày làm việc kể từ khi nộp đơn hợp lệ.
  ```

---

## Case demo khi chạy live

### Case A — FAQ hợp lệ, không trùng (happy path)

- **Loại**: (topic bất kỳ)
- **Câu hỏi**: `Thời gian nghỉ hè của sinh viên trong năm học 2025-2026 là bao lâu?`
- **Câu trả lời**:
  ```
  Theo kế hoạch năm học, kỳ nghỉ hè của sinh viên kéo dài 8 tuần, bắt đầu từ giữa tháng 6 và kết thúc trước khai giảng năm học mới. Lịch cụ thể được công bố chính thức trên cổng thông tin đào tạo trước ít nhất 4 tuần.
  ```
- **Kỳ vọng**: Tạo thành công, vào tab **Chờ duyệt**.

### Case B — Trùng CÂU HỎI với FAQ gốc #1

- **Loại**: _Đúng loại của FAQ gốc #1 đã chuẩn bị_
- **Câu hỏi**: `Quy trình đăng ký học lại ở trường được thực hiện ra sao?`
- **Câu trả lời**:
  ```
  Sinh viên nộp đơn xin học lại tại phòng đào tạo kèm bảng điểm và đóng học phí theo quy định hiện hành, sau đó tham gia lớp đang mở môn tương ứng.
  ```
- **Kỳ vọng**: Hệ thống hiện **modal xác nhận** "Phát hiện nội dung trùng lặp" với nội dung _"Câu hỏi đã trùng hoặc gần giống một FAQ khác..."_ và 2 nút **"Vẫn lưu"** / **"Hủy"**.
  - Nếu chọn **Hủy** → FAQ vừa tạo được rollback (xóa khỏi DB).
  - Nếu chọn **Vẫn lưu** → FAQ được giữ lại, vào tab **Chờ duyệt** như bình thường.

### Case C — Trùng CÂU TRẢ LỜI với FAQ gốc #2

- **Loại**: _Đúng loại của FAQ gốc #2 đã chuẩn bị_
- **Câu hỏi**: `Thủ tục xin lại thẻ sinh viên khi bị hư hỏng cần làm gì?`
- **Câu trả lời**:
  ```
  Khi thẻ sinh viên bị mất hoặc hỏng, sinh viên làm đơn xin cấp lại thẻ tại Phòng Công tác sinh viên, kèm bản sao CCCD và ảnh 3x4. Lệ phí cấp lại được thu theo quy định hiện hành. Thẻ mới trả sau 5 đến 7 ngày làm việc.
  ```
- **Kỳ vọng**: Hệ thống hiện **modal xác nhận** với nội dung _"Câu trả lời đã trùng hoặc gần giống một FAQ khác..."_. Demo cả 2 lựa chọn:
  - **Hủy** → rollback FAQ vừa tạo.
  - **Vẫn lưu** → chấp nhận trùng, FAQ vẫn được giữ.

### Case D — Reject FAQ (quản trị vòng đời)

- Tạo 1 FAQ bất kỳ mới, sau đó vào tab **Chờ duyệt** → **Từ chối** với lý do tùy ý.
- **Kỳ vọng**: FAQ chuyển sang tab **Từ chối**, hiển thị lý do.

---

## Ghi chú quan trọng

1. Ngưỡng trùng lặp: **0.5** (xem `src/components/modal/put-cau-hoi.tsx` — biến `DUPLICATE_SCORE_THRESHOLD`). BE trả về cosine similarity, với FAQ ngắn thực tế chỉ đạt ~0.5–0.7 nên đặt ở 0.5; nếu muốn chặt hơn thì nâng lên 0.6.
2. API `/fqa/similar-question` và `/fqa/similar-answer` chỉ so khớp với FAQ **đã APPROVE + vectorize**. Vì vậy phải phê duyệt FAQ gốc trước. FAQ `PENDING` chưa vào vector DB nên không bao giờ được dùng để đối chiếu.
3. Nếu API trùng lặp lỗi/timeout, hệ thống fail-open (cho lưu) — khi demo nên kiểm tra service QA chạy ổn trước 15 phút.
4. Hành vi khi phát hiện trùng: **không chặn cứng**, chỉ cảnh báo + cho người dùng quyết định có lưu tiếp hay không. Logic ở `put-cau-hoi.tsx` → `confirmKeepDuplicate()`.
