# Demo files - Trợ lý ảo

Bộ file mẫu cho buổi demo UC Nhập/xử lý tài liệu và FAQ.

## File tài liệu

| File                           | Dùng để                                                                                    | Kỳ vọng khi upload                                                                              |
| ------------------------------ | ------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------- |
| `01-noi-quy.docx`              | Chứng minh UC xử lý DOCX                                                                   | Upload → đọc text trực tiếp, không cần OCR                                                      |
| `02-quy-dinh.pdf`              | Chứng minh UC xử lý PDF text                                                               | Upload → đọc text trực tiếp, không cần OCR                                                      |
| `03-scan.pdf`                  | **Chứng minh OCR** — PDF ảnh, không có text layer                                          | Upload → hệ thống nhận diện cần OCR, hiện trạng thái "đang chuyển đổi hình ảnh" rồi mới có text |
| `04-trung-lap.docx`            | Chứng minh UC check trùng lặp văn bản                                                      | Upload **SAU KHI** đã phê duyệt `01-noi-quy.docx` → hiện cảnh báo độ tương đồng cao             |
| `05-quy-che-dao-tao.docx`      | Nguồn tri thức topic `TRAINING_RULES_AND_REGULATIONS`                                      | UC3 - Hỏi đáp quy chế đào tạo                                                                   |
| `06-quy-che-thi.docx`          | Nguồn tri thức topic `EXAMINATION_RULES_AND_REGULATIONS`                                   | UC4 - Hỏi đáp quy chế thi                                                                       |
| `07-thong-tin-tuyen-sinh.docx` | Nguồn tri thức topic `GENERAL_ADMISSIONS_INFORMATION` + `ADMISSIONS_RULES_AND_REGULATIONS` | UC1, UC2 - Tuyển sinh                                                                           |
| `08-chinh-sach-sv.docx`        | Nguồn tri thức topic `REGULATIONS_POLICIES_AND_BENEFITS_FOR_CIVILIAN_STUDENTS`             | UC8 - Chính sách SV dân sự                                                                      |

### Thứ tự demo được đề xuất

1. Upload `01-noi-quy.docx` → **vào tab "Chờ duyệt" bấm Phê duyệt** (bắt buộc, vì vector DB chỉ chứa tài liệu đã APPROVE — nếu bỏ bước này file 04 sẽ không báo trùng).
2. Upload `02-quy-dinh.pdf` → demo PDF text.
3. Upload `03-scan.pdf` → demo OCR.
4. Upload `04-trung-lap.docx` → demo check trùng lặp.

### ⚠️ Điều kiện để file 04 báo trùng lặp

Check trùng lặp gọi `POST /document/document-reader` với payload `{ uri_file, topic_ids }` — API lọc kết quả theo **đúng topic_ids** gửi lên. Vì vậy:

- **BẮT BUỘC**: `01-noi-quy.docx` đã được **phê duyệt** trước (để index vào vector DB).
- **BẮT BUỘC**: Chọn **cùng một loại tài liệu / topic** cho cả file 01 và file 04.
- **Lưu ý**: Phải chọn topic **trước** khi kéo file vào (nếu kéo file trước thì request đi với `topic_ids: []` → không có kết quả).
- Ngưỡng cảnh báo trong code: `similar > 0.8` (xem `them-tai-lieu.tsx:692`).

Nếu không báo trùng, mở DevTools → Network → tìm request `document-reader`:

- `document_simmilar: []` → file 01 chưa vào vector DB (chưa approve) hoặc khác topic.
- `score < 0.8` → nội dung chưa đủ giống (hãy tạo lại file 04 bằng script ở cuối README).

### Kiểm tra nhanh (đã verify)

- `pdftotext 03-scan.pdf` trả rỗng → đúng là ảnh thuần, BE phải OCR.
- `pdftotext 02-quy-dinh.pdf` trả ra text đầy đủ → không cần OCR.

## File FAQ

Danh sách câu hỏi / trả lời mẫu để copy-paste vào form **Thêm câu hỏi**:

Xem `faq-samples.md`.

## Quy trình tạo lại file (nếu cần)

Script dựng file tại `src/`:

```bash
cd apps/client/tro-ly-ao/demo-files

# DOCX: html -> odt -> docx
libreoffice --headless --convert-to odt --outdir src \
  src/01-noi-quy.html src/04-trung-lap.html \
  src/05-quy-che-dao-tao.html src/06-quy-che-thi.html \
  src/07-thong-tin-tuyen-sinh.html src/08-chinh-sach-sv.html
libreoffice --headless --convert-to docx --outdir . \
  src/01-noi-quy.odt src/04-trung-lap.odt \
  src/05-quy-che-dao-tao.odt src/06-quy-che-thi.odt \
  src/07-thong-tin-tuyen-sinh.odt src/08-chinh-sach-sv.odt

# PDF text
libreoffice --headless --convert-to pdf --outdir . \
  src/02-quy-dinh.html

# PDF scan (không có text layer) — render ra ảnh rồi gộp lại
libreoffice --headless --convert-to pdf --outdir . \
  src/03-scan-noi-dung.html
pdftoppm -r 200 -png 03-scan-noi-dung.pdf src/scan-page
convert src/scan-page*.png 03-scan.pdf
rm -f 03-scan-noi-dung.pdf
```
