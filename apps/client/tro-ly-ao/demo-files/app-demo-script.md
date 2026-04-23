# Kịch bản demo mô-đun Ứng dụng & Quản lý hội thoại

> Demo end-to-end toàn bộ UC mô-đun **Ứng dụng** (12 UC hỏi đáp + tìm kiếm văn bản + 4 UC xử lý văn bản) và **Quản lý hội thoại, người dùng** (4 UC).
> Tổng thời lượng: ~30–35 phút. Giả định các UC module LLM / Dữ liệu / FAQ đã demo trước.

---

## A. Pre-flight checklist

### Dữ liệu nạp sẵn trong DB (tạo + APPROVE trước)

| Loại tài liệu (`topic.type`) | File demo (có trong `demo-files/`) | Câu hỏi test nhanh |
|---|---|---|
| `INTERNAL_GUIDELINES_AND_REGULATIONS_OF_THE_ACADEMY` | `01-noi-quy.docx` | "Nội quy có bao nhiêu điều?" |
| `TRAINING_RULES_AND_REGULATIONS` | `02-quy-dinh.pdf` hoặc `05-quy-che-dao-tao.docx` | "Điểm rèn luyện được tính thế nào?" |
| `EXAMINATION_RULES_AND_REGULATIONS` | `03-scan.pdf` (OCR) hoặc `06-quy-che-thi.docx` | "Quy định về gian lận thi cử?" |
| `GENERAL_ADMISSIONS_INFORMATION` | `07-thong-tin-tuyen-sinh.docx` | "Chỉ tiêu tuyển sinh 2026?" |
| `REGULATIONS_POLICIES_AND_BENEFITS_FOR_CIVILIAN_STUDENTS` | `08-chinh-sach-sv.docx` | "Sinh viên dân sự có được miễn giảm học phí không?" |
| `FREQUENTLY_ASKED_QUESTIONS` | (từ FAQ seed ở `faq-samples.md`) | "Quy trình đăng ký học lại?" |

> Topic nào **không có tài liệu** thì chat sẽ trả lời *"Tôi chưa tìm thấy thông tin trong tài liệu."* → hữu ích để demo tính **không bịa**.

### Dịch vụ cần kiểm tra trước 15 phút

```
✓ api.model.mta.swantech.vn/api/health  (LLM runtime)
✓ api.chat.chatbot.swantech.vn/health    (chat gateway, RAG orchestrator)
✓ api.doc.chatbot.swantech.vn/health     (vector search, OCR, xử lý văn bản)
✓ FE trợ lý ảo chạy ổn (HTTP 200 ở trang chính)
```

### Tab trình duyệt mở sẵn

1. `/` — Trang chủ chat
2. `/hoi-thoai/<id>` — Một hội thoại đang có (để demo UC quản lý hội thoại)
3. `/xu-ly-van-ban` — Dịch / sửa lỗi / tóm tắt / trích lược
4. `/tim-kiem-van-ban` — Tìm kiếm văn bản
5. `/quan-tri/du-lieu/tai-lieu` — Show tài liệu đã APPROVE phục vụ từng topic

---

## B. Luồng demo theo module

### Module I — Tư vấn tuyển sinh, học tập (UC1–9) — ~10 phút

**Thao tác chung**: trên trang chat, ở sidebar hoặc dropdown chọn **Loại hỏi đáp (topic)** → gõ câu hỏi → model trả lời kèm trích dẫn.

| # | UC | Topic key | Câu hỏi demo (copy từ `question-bank.md`) | Kỳ vọng |
|---|---|---|---|---|
| 1 | Thông tin chung tuyển sinh | `GENERAL_ADMISSIONS_INFORMATION` | "Trường mình năm 2026 tuyển bao nhiêu ngành?" | Trả lời dựa tài liệu 07, có citation |
| 2 | Quy chế tuyển sinh | `ADMISSIONS_RULES_AND_REGULATIONS` | "Thí sinh diện tuyển thẳng cần điều kiện gì?" | Dựa tài liệu 07 mục "Quy chế" |
| 3 | Quy chế đào tạo | `TRAINING_RULES_AND_REGULATIONS` | "Quy định xét tốt nghiệp như thế nào?" | Dựa tài liệu 05 |
| 4 | Quy chế thi | `EXAMINATION_RULES_AND_REGULATIONS` | "Hình thức xử lý khi gian lận thi?" | Dựa tài liệu 06 |
| 5 | Thông tin Học viện | `ACADEMY_INFORMATION` | "Học viện được thành lập năm nào?" | Dựa tài liệu giới thiệu HV |
| 6 | Chương trình đào tạo | `TRAINING_PROGRAMS_INFORMATION` | "Ngành CNTT đào tạo mấy năm? Có những chuyên ngành nào?" | Dựa tài liệu CTĐT |
| 7 | Chính sách học viên quân sự | `REGULATIONS_POLICIES_AND_BENEFITS_FOR_MILITARY_CADETS` | "Học viên quân sự có được hưởng phụ cấp nào?" | Dựa tài liệu riêng |
| 8 | Chính sách sinh viên dân sự | `REGULATIONS_POLICIES_AND_BENEFITS_FOR_CIVILIAN_STUDENTS` | "Học bổng khuyến khích học tập cho SV dân sự?" | Dựa tài liệu 08 |
| 9 | FAQ | `FREQUENTLY_ASKED_QUESTIONS` | "Quy trình đăng ký học lại?" | Lấy trực tiếp từ bảng FAQ, không phải document |

### Điểm cần nhấn trong Module I

- Chọn **sai topic** → chatbot không tìm thấy → chứng minh hệ thống **cô lập nguồn dữ liệu theo lĩnh vực** (tránh lẫn thông tin quân sự vs dân sự).
- Chỉ vào **chip trích dẫn** → click → mở đúng đoạn trong tài liệu gốc.
- Mở cùng câu hỏi ở 2 topic khác nhau cho thấy câu trả lời khác nhau.

---

### Module II — Hỏi đáp văn bản hành chính (UC10–12) — ~4 phút

Tương tự Module I nhưng tập trung vào 3 topic nội bộ:

| # | UC | Topic key | Câu hỏi demo |
|---|---|---|---|
| 10 | Công tác Đảng, Chính trị | `PARTY_WORK_AND_POLITICAL_WORK` | "Quy định về sinh hoạt đảng viên dự bị?" |
| 11 | Quy định nội bộ Học viện | `INTERNAL_GUIDELINES_AND_REGULATIONS_OF_THE_ACADEMY` | "Nội quy sử dụng thư viện?" |
| 12 | Sổ tay giảng viên | `IN_THE_FACULTY_HANDBOOK` | "Giảng viên mới cần hoàn thành thủ tục gì trong tuần đầu?" |

**Điểm nhấn**: đây là các lĩnh vực **không public trên internet** → chứng minh giá trị của RAG nội bộ.

---

### Module III — Tìm kiếm văn bản theo từ khóa và ngữ nghĩa — ~3 phút

**Trang**: `/tim-kiem-van-ban`

**Thao tác**:

1. Chế độ **Tìm kiếm theo từ khóa** (BM25):
   - Gõ: `"gian lận"`
   - Kết quả trả về tài liệu có **chính xác chuỗi ký tự** đó.
2. Chế độ **Tìm kiếm ngữ nghĩa** (vector search):
   - Gõ: `"xử lý vi phạm khi kiểm tra"`
   - Kết quả trả về tài liệu về gian lận dù **không có từ "vi phạm"** — chứng minh semantic.
3. Click kết quả → mở `PreviewTaiLieu` → download → file tải về đúng.

**Điểm nhấn**: Người dùng có thể kết hợp 2 cơ chế — **keyword** cho search chính xác, **semantic** cho tìm theo ý.

---

### Module IV — Xử lý văn bản (4 mode) — ~5 phút

**Trang**: `/xu-ly-van-ban`

Ba văn bản mẫu ở file `text-processing-samples.md` — copy-paste thẳng.

#### 4.1. Dịch thuật sang tiếng Việt

1. Chọn mode **Dịch văn bản**.
2. Paste mẫu **EN-1** (đoạn tiếng Anh ~200 từ) → nhấn Xử lý.
3. Kết quả stream dần — tiếng Việt chuẩn, giữ thuật ngữ.
4. Demo thêm: paste mẫu **ZH-1** (tiếng Trung) → vẫn dịch được đa ngôn ngữ.

#### 4.2. Phát hiện và sửa lỗi văn bản

1. Chọn mode **Sửa lỗi chính tả**.
2. Paste mẫu **ERR-1** (có 5–7 lỗi chính tả cố ý).
3. Kết quả trả về văn bản đã sửa + optional list các lỗi đã phát hiện.

#### 4.3. Tóm tắt văn bản — **trích lược** (extractive)

1. Chọn mode **Tóm lược** (ánh xạ tới `EXTRACTIVE_TEXT_SUMMARIZATION`).
2. Paste mẫu **DOC-1** (bài báo ~500 từ).
3. Kết quả trả ra **2–3 câu lấy nguyên văn** từ bài gốc — không paraphrase.

#### 4.4. Tóm tắt văn bản — **tóm lược** (abstractive)

1. Chọn mode **Trích lược** (ánh xạ tới `ABSTRACTIVE_TEXT_SUMMARIZATION`).
2. Paste **cùng văn bản DOC-1**.
3. Kết quả trả ra **đoạn văn mới** (LLM paraphrase, không copy nguyên câu).

**Điểm nhấn**: cho chạy 2 mode tóm tắt trên **cùng một đầu vào** để thấy khác biệt rõ ràng giữa extractive (copy câu) vs abstractive (viết lại).

> ⚠️ Hiện tại nhãn UI đang bị ngược: *"Tóm lược"* trong UI trỏ tới `EXTRACTIVE`, *"Trích lược"* trỏ tới `ABSTRACTIVE` — nói rõ với khán giả theo nhãn UI, đừng nói theo tên kỹ thuật.

---

### Module V — Quản lý hội thoại, người dùng — ~5 phút

#### 5.1. Đăng ký người dùng

- Hệ thống dùng **SSO tập trung** tại `mta.swantech.vn/api/sso-id`. Admin cấp account qua hệ thống SSO — trợ lý ảo **không quản lý đăng ký local**.
- Demo: mở trình ẩn danh → truy cập trợ lý ảo → **auto redirect** sang SSO signin → nhập tài khoản mới cấp → quay về trợ lý ảo với quyền phù hợp.
- Nói: *"Đăng ký user được tích hợp SSO toàn hệ thống của Học viện — 1 tài khoản dùng cho nhiều ứng dụng, bảo mật tập trung."*

#### 5.2. Đăng nhập hệ thống

- Trên trang `/` → click menu user góc phải → hiện thông tin user + avatar + phân quyền.
- Mở **DevTools → Application → Cookies** → show cookie session SSO.
- Dev tools → Network → tab check endpoint `/api/auth/get-session` trả về `{userId, username, permissions}`.

#### 5.3. Quản lý hội thoại

- Sidebar trái hiển thị danh sách hội thoại người dùng.
- Demo:
  - **Tạo mới**: click nút "Hội thoại mới" → vào trang chat trống.
  - **Đặt tên tự động**: sau câu hỏi đầu tiên, tên hội thoại được generate tự động (từ 5 từ đầu của câu hỏi).
  - **Đổi tên**: click biểu tượng edit bên cạnh tên → sửa → lưu.
  - **Xóa**: click icon thùng rác → xác nhận → hội thoại bị xóa.
  - **Chuyển qua hội thoại cũ**: click 1 item trong sidebar → load lại đủ lịch sử chat.
- Show Prisma model `Conversation` có `userId` → đảm bảo mỗi user chỉ thấy hội thoại của mình (đa tenant).

#### 5.4. Tiếp nhận phản hồi

- Ở mỗi câu trả lời của bot, có icon **👍 / 👎** (hoặc "Đánh giá").
  - Click 👎 → mở popup nhập lý do → gửi → lưu vào bảng `FeedBack`.
  - Show Network tab thấy request `POST /feedback`.
- Admin vào trang quản trị → báo cáo feedback → xem user nào phản hồi gì → dùng để cải thiện prompt / thêm tài liệu.

---

## C. Câu chuyện kết thúc

> "Hệ thống trợ lý ảo không chỉ là giao diện chat, mà là **1 platform hoàn chỉnh** kết nối: quản trị tri thức nội bộ (tài liệu + FAQ), hạ tầng LLM tùy chỉnh (mô hình + tham số + prompt), ứng dụng đầu cuối (12 topic hỏi đáp + tìm kiếm + xử lý văn bản), và quản lý vòng đời (SSO + hội thoại + phản hồi). Tất cả **on-premise**, tuân thủ bảo mật quân đội."

---

## D. Danh sách file kèm theo trong `demo-files/`

| File | Mục đích | Dùng cho UC |
|---|---|---|
| `README.md` | Thứ tự demo tài liệu | Chung |
| `faq-samples.md` | Bank FAQ mẫu | UC9, Dữ liệu FAQ |
| `llm-demo-script.md` | Kịch bản demo module LLM | Nền tảng LLM |
| `app-demo-script.md` | (File này) Kịch bản module Ứng dụng | Module Ứng dụng + Quản lý user |
| `question-bank.md` | 60+ câu hỏi mẫu theo 12 topic | UC1-12 |
| `text-processing-samples.md` | Văn bản mẫu EN/ZH/lỗi/báo cáo | UC dịch, sửa lỗi, tóm tắt |
| `01-noi-quy.docx` | Tài liệu nội quy | UC11 |
| `02-quy-dinh.pdf` | Quy định đào tạo | UC3 |
| `03-scan.pdf` | Test OCR | Dữ liệu tài liệu |
| `04-trung-lap.docx` | Test check trùng lặp | Dữ liệu tài liệu |
| `05-quy-che-dao-tao.docx` | Tài liệu quy chế đào tạo | UC3 |
| `06-quy-che-thi.docx` | Tài liệu quy chế thi | UC4 |
| `07-thong-tin-tuyen-sinh.docx` | Tài liệu tuyển sinh | UC1, UC2 |
| `08-chinh-sach-sv.docx` | Chính sách SV dân sự | UC8 |

---

## E. Troubleshooting nhanh

| Triệu chứng | Nguyên nhân | Xử lý |
|---|---|---|
| Chat trả lời *"Tôi không tìm thấy…"* ở UC có tài liệu | Tài liệu chưa APPROVE hoặc sai topic | Vào `/quan-tri/du-lieu/tai-lieu` → kiểm tra trạng thái + topic_ids |
| Dịch văn bản bị giới hạn 2000 ký tự | Giới hạn UI | Cắt bớt input hoặc demo nhiều lần |
| Tóm lược / trích lược trả kết quả giống nhau | LLM không phân biệt được do prompt yếu | Check lại prompt của `EXTRACTIVE_TEXT_SUMMARIZATION` / `ABSTRACTIVE_TEXT_SUMMARIZATION` trong trang `/quan-tri/cau-hinh/prompt-chuc-nang` |
| Tìm kiếm ngữ nghĩa trả rỗng | Vector DB trống hoặc service `doc` down | Kiểm tra `api.doc/health`, verify doc đã vectorize |
| Không thấy hội thoại cũ | User khác / session khác | Clear cache, re-login |
| Feedback không lưu | BE endpoint lỗi | Check Network tab, kiểm tra response `/feedback` |
