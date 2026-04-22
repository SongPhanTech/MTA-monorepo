# KỊCH BẢN DEMO TỔNG HỢP — TRỢ LÝ ẢO HỌC VIỆN

> File tổng hợp đầy đủ kịch bản demo 5 mô-đun theo đúng thứ tự UC nghiệm thu.
> Tổng thời lượng: **~60–75 phút**. Có thể rút gọn bằng cách bỏ các phần *(tuỳ chọn)*.
>
> Các file nội dung chi tiết đã được gộp vào đây từ:
> `README.md`, `llm-demo-script.md`, `app-demo-script.md`, `faq-samples.md`,
> `question-bank.md`, `text-processing-samples.md`.

---

## MỤC LỤC

- [A. Pre-flight checklist toàn cục](#a-pre-flight-checklist-toàn-cục)
- [MÔ-ĐUN 1 — Quản trị cơ sở dữ liệu](#mô-đun-1--quản-trị-cơ-sở-dữ-liệu)
  - [1.1. Nhập, xử lý dữ liệu văn bản từ file DOC/DOCX](#11-nhập-xử-lý-dữ-liệu-văn-bản-từ-file-docdocx)
  - [1.2. Nhập, xử lý dữ liệu văn bản từ file PDF](#12-nhập-xử-lý-dữ-liệu-văn-bản-từ-file-pdf)
  - [1.3. Kiểm tra trùng lặp dữ liệu văn bản](#13-kiểm-tra-trùng-lặp-dữ-liệu-văn-bản)
  - [1.4. Nhập, xử lý dữ liệu câu hỏi thường gặp](#14-nhập-xử-lý-dữ-liệu-câu-hỏi-thường-gặp)
  - [1.5. Nhập, xử lý dữ liệu câu trả lời cho FAQ](#15-nhập-xử-lý-dữ-liệu-câu-trả-lời-cho-faq)
  - [1.6. Kiểm tra trùng lặp dữ liệu FAQ](#16-kiểm-tra-trùng-lặp-dữ-liệu-faq)
  - [1.7. Quản lý dữ liệu nhập](#17-quản-lý-dữ-liệu-nhập)
  - [1.8. Duyệt dữ liệu nhập](#18-duyệt-dữ-liệu-nhập)
- [MÔ-ĐUN 2 — Xử lý văn bản, CSDL](#mô-đun-2--xử-lý-văn-bản-csdl)
  - [2.1. Phân đoạn văn bản (chunking)](#21-phân-đoạn-văn-bản-chunking)
  - [2.2. Vector hoá, lưu trữ CSDL văn bản](#22-vector-hoá-lưu-trữ-csdl-văn-bản)
  - [2.3. Vector hoá, lưu trữ CSDL FAQ](#23-vector-hoá-lưu-trữ-csdl-faq)
- [MÔ-ĐUN 3 — Nền tảng LLM](#mô-đun-3--nền-tảng-llm)
  - [3.1. Triển khai API của LLM](#31-triển-khai-api-của-llm)
  - [3.2. Cấu hình tham số LLM](#32-cấu-hình-tham-số-llm)
  - [3.3. RAG kết hợp LLM](#33-rag-kết-hợp-llm)
  - [3.4. Prompt cho hỏi đáp thông thường](#34-prompt-cho-hỏi-đáp-thông-thường)
  - [3.5. Prompt cho hỏi đáp dựa trên RAG](#35-prompt-cho-hỏi-đáp-dựa-trên-rag)
- [MÔ-ĐUN 4 — Ứng dụng](#mô-đun-4--ứng-dụng)
  - [4.A. Chức năng tư vấn tuyển sinh, học tập (UC1–UC9)](#4a-chức-năng-tư-vấn-tuyển-sinh-học-tập-uc1uc9)
  - [4.B. Hỏi đáp Văn bản hành chính (UC10–UC12)](#4b-hỏi-đáp-văn-bản-hành-chính-uc10uc12)
  - [4.C. Tìm kiếm văn bản theo từ khoá và ngữ nghĩa](#4c-tìm-kiếm-văn-bản-theo-từ-khoá-và-ngữ-nghĩa)
  - [4.D. Xử lý văn bản (4 mode)](#4d-xử-lý-văn-bản-4-mode)
- [MÔ-ĐUN 5 — Quản lý hội thoại, người dùng](#mô-đun-5--quản-lý-hội-thoại-người-dùng)
- [Phụ lục — Bank câu hỏi 12 topic, Prompt templates, Văn bản mẫu, Reset, Troubleshooting](#phụ-lục)

---

## A. Pre-flight checklist toàn cục

### Dịch vụ cần kiểm tra trước 15 phút

```
✓ api.model.mta.swantech.vn/api/health   (LLM runtime)
✓ api.chat.chatbot.swantech.vn/health    (chat gateway, RAG orchestrator)
✓ api.doc.chatbot.swantech.vn/health     (vector search, OCR, xử lý văn bản)
✓ mta.swantech.vn/api/sso-id              (SSO)
✓ FE trợ lý ảo chạy ổn định
```

### Dữ liệu cần nạp sẵn (trừ các file test dùng để demo live)

| File | Topic | Dùng cho UC |
|---|---|---|
| `01-noi-quy.docx` | `INTERNAL_GUIDELINES_AND_REGULATIONS_OF_THE_ACADEMY` | 1.1, 1.3, 3.3, 4.B-UC11 |
| `02-quy-dinh.pdf` | `TRAINING_RULES_AND_REGULATIONS` | 1.2, 4.A-UC3 |
| `03-scan.pdf` | (tuỳ topic) | 1.2 (OCR) |
| `04-trung-lap.docx` | cùng topic với 01 | 1.3 |
| `05-quy-che-dao-tao.docx` | `TRAINING_RULES_AND_REGULATIONS` | 4.A-UC3 |
| `06-quy-che-thi.docx` | `EXAMINATION_RULES_AND_REGULATIONS` | 4.A-UC4 |
| `07-thong-tin-tuyen-sinh.docx` | `GENERAL_ADMISSIONS_INFORMATION` + `ADMISSIONS_RULES_AND_REGULATIONS` | 4.A-UC1, UC2 |
| `08-chinh-sach-sv.docx` | `REGULATIONS_POLICIES_AND_BENEFITS_FOR_CIVILIAN_STUDENTS` | 4.A-UC8 |
| 2 FAQ gốc (ở Phụ lục) | (2 topic khác nhau) | 1.4–1.6 |

### Cấu hình mặc định (bảng `ChatBotConfig`)

`temperature=0.3`, `topP=0.9`, `topK=40`, `maxTokens=1024`, `presencePenalty=0`.

### Tab trình duyệt mở sẵn

1. `/` — Trang chat
2. `/quan-tri/du-lieu/tai-lieu` — Quản lý tài liệu
3. `/quan-tri/du-lieu/cau-hoi-thuong-gap` — Quản lý FAQ
4. `/quan-tri/cau-hinh/tham-so` — Tham số LLM
5. `/quan-tri/cau-hinh/prompt-hoi-dap` — Prompt
6. `/xu-ly-van-ban` — Xử lý văn bản
7. `/tim-kiem-van-ban` — Tìm kiếm văn bản
8. DevTools Network + Application mở sẵn.

---

# MÔ-ĐUN 1 — Quản trị cơ sở dữ liệu

> Mục tiêu: chứng minh pipeline **Nhập → Xử lý → Check trùng → Quản lý → Duyệt** cho cả **tài liệu văn bản** và **FAQ**.
> Trang: `/quan-tri/du-lieu/tai-lieu` và `/quan-tri/du-lieu/cau-hoi-thuong-gap`.

## 1.1. Nhập, xử lý dữ liệu văn bản từ file DOC/DOCX

### Thao tác

1. Vào **Quản trị → Dữ liệu → Tài liệu → Thêm mới**.
2. Chọn **Loại tài liệu** = `INTERNAL_GUIDELINES_AND_REGULATIONS_OF_THE_ACADEMY`.
3. Kéo thả `01-noi-quy.docx` vào ô upload.
4. Quan sát: hệ thống đọc **text trực tiếp** (không cần OCR), preview ra nội dung 5 điều nội quy.
5. Bấm **Lưu** → tài liệu vào tab **Chờ duyệt**.

### Điểm nói

- BE nhận file → parse bằng thư viện đọc DOCX (mammoth/docx-parser) → extract text + giữ metadata.
- Nội dung text được gửi sang pipeline phân đoạn (chunking) và chờ phê duyệt để index.

## 1.2. Nhập, xử lý dữ liệu văn bản từ file PDF

### Thao tác

**Phần A — PDF có text layer**

1. Upload `02-quy-dinh.pdf` với topic `TRAINING_RULES_AND_REGULATIONS`.
2. Preview → text hiện ra ngay (parse bằng `pdf-parse` / `pdftotext`).

**Phần B — PDF scan cần OCR**

1. Upload `03-scan.pdf` (PDF ảnh, không có text layer).
2. Quan sát UI hiện trạng thái **"Đang chuyển đổi hình ảnh / OCR…"**.
3. Sau khi OCR xong (Tesseract / paddleOCR ở service `api.doc`), text tiếng Việt có dấu hiện ra.

### Điểm nói

- Hệ thống **tự phát hiện** PDF có text layer hay không:
  - Có text → parse trực tiếp (nhanh).
  - Không có text → chuyển sang pipeline **OCR tiếng Việt**.
- Verify: chạy `pdftotext 03-scan.pdf` ở máy local → output rỗng, chứng minh là ảnh thuần.

## 1.3. Kiểm tra trùng lặp dữ liệu văn bản

### Tiền điều kiện

**BẮT BUỘC** `01-noi-quy.docx` đã được **Phê duyệt** (ở mục 1.8 phía dưới) để vào vector DB.

### Thao tác

1. **Quản trị → Tài liệu → Thêm mới**.
2. Chọn **cùng topic** với file 01 (`INTERNAL_GUIDELINES_AND_REGULATIONS_OF_THE_ACADEMY`) — chọn topic **TRƯỚC** khi kéo file.
3. Kéo `04-trung-lap.docx` vào.
4. Hệ thống gọi `POST /document/document-reader` với `{uri_file, topic_ids}` → trả về `document_simmilar` kèm `score`.
5. Khi `score > 0.8` → UI hiện **cảnh báo "Phát hiện nội dung trùng lặp"** + danh sách tài liệu đã trùng.
6. User có thể chọn **Huỷ** hoặc **Vẫn lưu**.

### Ngưỡng & debug

- Ngưỡng cảnh báo: `similar > 0.8` (xem `them-tai-lieu.tsx:692`).
- Nếu không báo trùng → DevTools → Network → `document-reader`:
  - `document_simmilar: []` → file 01 chưa approve hoặc khác topic.
  - `score < 0.8` → nội dung chưa đủ giống.

### Điểm nói

- So khớp **theo đúng topic** → tránh cảnh báo sai giữa các lĩnh vực khác nhau.
- Không chặn cứng, chỉ cảnh báo — user quyết định.

## 1.4. Nhập, xử lý dữ liệu câu hỏi thường gặp

### Thao tác

1. **Quản trị → Dữ liệu → Câu hỏi thường gặp → Thêm mới**.
2. Chọn **Loại câu hỏi** = (topic bất kỳ, ví dụ `FREQUENTLY_ASKED_QUESTIONS`).
3. Nhập **Câu hỏi** ở trường trên.
4. Xem validate: không cho rỗng, có giới hạn độ dài.

### Dữ liệu mẫu (Case A — happy path, không trùng)

- **Câu hỏi**: `Thời gian nghỉ hè của sinh viên trong năm học 2025-2026 là bao lâu?`

## 1.5. Nhập, xử lý dữ liệu câu trả lời cho FAQ

### Thao tác (tiếp nối 1.4)

1. Nhập **Câu trả lời** (Case A):
   ```
   Theo kế hoạch năm học, kỳ nghỉ hè của sinh viên kéo dài 8 tuần, bắt đầu từ giữa tháng 6 và kết thúc trước khai giảng năm học mới. Lịch cụ thể được công bố chính thức trên cổng thông tin đào tạo trước ít nhất 4 tuần.
   ```
2. Bấm **Lưu**.
3. **Kỳ vọng**: Không có cảnh báo trùng → FAQ vào tab **Chờ duyệt**.

### Điểm nói

- Câu hỏi + câu trả lời lưu DB bảng `FQA` với trạng thái `PENDING`.
- Phải phê duyệt mới được vector hoá (xem 2.3 và 1.8).

## 1.6. Kiểm tra trùng lặp dữ liệu FAQ

### Tiền điều kiện

2 FAQ gốc đã được **APPROVE** trước buổi demo (xem [Phụ lục B](#phụ-lục-b--faq-gốc-để-test-trùng-lặp)).

### Case B — Trùng CÂU HỎI (với FAQ gốc #1)

- **Loại**: cùng loại với FAQ gốc #1.
- **Câu hỏi**: `Quy trình đăng ký học lại ở trường được thực hiện ra sao?`
- **Câu trả lời**: `Sinh viên nộp đơn xin học lại tại phòng đào tạo kèm bảng điểm và đóng học phí theo quy định hiện hành, sau đó tham gia lớp đang mở môn tương ứng.`
- **Kỳ vọng**: modal *"Câu hỏi đã trùng hoặc gần giống một FAQ khác…"* với 2 nút **Vẫn lưu** / **Huỷ**.
  - **Huỷ** → rollback (xoá FAQ vừa tạo khỏi DB).
  - **Vẫn lưu** → giữ lại, vào tab **Chờ duyệt**.

### Case C — Trùng CÂU TRẢ LỜI (với FAQ gốc #2)

- **Loại**: cùng loại với FAQ gốc #2.
- **Câu hỏi**: `Thủ tục xin lại thẻ sinh viên khi bị hư hỏng cần làm gì?`
- **Câu trả lời**: `Khi thẻ sinh viên bị mất hoặc hỏng, sinh viên làm đơn xin cấp lại thẻ tại Phòng Công tác sinh viên, kèm bản sao CCCD và ảnh 3x4. Lệ phí cấp lại được thu theo quy định hiện hành. Thẻ mới trả sau 5 đến 7 ngày làm việc.`
- **Kỳ vọng**: modal *"Câu trả lời đã trùng hoặc gần giống một FAQ khác…"*. Demo cả 2 lựa chọn.

### Ngưỡng & debug

- Ngưỡng: `DUPLICATE_SCORE_THRESHOLD = 0.5` (xem `src/components/modal/put-cau-hoi.tsx`).
- API: `POST /fqa/similar-question`, `POST /fqa/similar-answer` — chỉ so với FAQ **APPROVED + vectorized**.
- Nếu API lỗi/timeout → fail-open (cho lưu).

## 1.7. Quản lý dữ liệu nhập

### Thao tác

1. Vào **Quản trị → Dữ liệu → Tài liệu** (tương tự cho FAQ).
2. Show 3 tab trạng thái: **Đã duyệt** | **Chờ duyệt** | **Từ chối**.
3. Demo các tính năng:
   - **Tìm kiếm** theo tên.
   - **Lọc** theo topic / người tạo / khoảng thời gian.
   - **Xem chi tiết** → mở `PreviewTaiLieu` (hoặc preview FAQ).
   - **Sửa**: cập nhật tên / topic / mô tả.
   - **Xoá**: xoá khỏi DB và vector store.
   - **Download** file gốc.
4. Show phân quyền: chỉ role có `...QUAN_TRI_DU_LIEU_TAI_LIEU.SUA/XOA` mới thấy nút.

## 1.8. Duyệt dữ liệu nhập

### Thao tác

1. Vào tab **Chờ duyệt**.
2. Chọn 1 tài liệu → **Phê duyệt**:
   - Hệ thống gọi pipeline: extract text → chunking (2.1) → embedding (2.2) → upsert vector DB.
   - Trạng thái chuyển sang **Đã duyệt**.
3. Chọn 1 tài liệu khác → **Từ chối** + nhập lý do → chuyển sang tab **Từ chối**, hiển thị lý do.
4. Thao tác tương tự trên FAQ (**Duyệt** → vector hoá FAQ, **Từ chối** → kèm lý do).

### Điểm nói

- Chỉ dữ liệu **APPROVED** mới vào vector DB → đảm bảo chất lượng tri thức chatbot dùng.
- Có audit trail (`approvedBy`, `approvedAt`, `rejectedReason`).
- Role phê duyệt tách biệt role nhập dữ liệu.

---

# MÔ-ĐUN 2 — Xử lý văn bản, CSDL

> Các UC ở mô-đun này **không có UI riêng** — chạy ngầm khi phê duyệt dữ liệu.
> Demo bằng cách theo dõi DB / Network / logs BE.

## 2.1. Phân đoạn văn bản (chunking)

### Thao tác

1. Sau khi phê duyệt `01-noi-quy.docx` ở UC 1.8, mở DB (pgAdmin / DBeaver).
2. Query bảng lưu chunk (ví dụ `DocumentChunk`):
   ```sql
   SELECT id, document_id, chunk_index, LEFT(content, 80) AS preview, token_count
   FROM "DocumentChunk"
   WHERE document_id = '<id-01-noi-quy>'
   ORDER BY chunk_index;
   ```
3. Show 1 tài liệu bị cắt thành **N chunk**, mỗi chunk ~500–800 token, có **overlap** ~50–100 token.

### Điểm nói

- Chia nhỏ để fit vào context window của embedding model.
- Có overlap để không mất ngữ cảnh ở biên.
- Metadata đi kèm: `document_id`, `topic_ids`, `chunk_index`, `page` (nếu PDF).

## 2.2. Vector hoá, lưu trữ CSDL văn bản

### Thao tác

1. Ngay sau phê duyệt → BE gọi embedding model (tại `api.model` hoặc service embed riêng).
2. Kết quả vector (768 / 1024 chiều) được upsert vào vector DB (pgvector / Qdrant / Milvus).
3. Demo:
   - Query bảng vector: `SELECT id, vector_dims(embedding) FROM document_embeddings LIMIT 5;`
   - Hoặc gọi trực tiếp: `POST /document/search` với `query = "nội quy trợ lý ảo"` → trả top-K chunk kèm cosine score.
4. Hỏi ở chat `"Nội quy có bao nhiêu điều?"` → bot trả lời chính xác → chứng minh vector hoá đã hoạt động.

### Điểm nói

- Lựa chọn embedding model on-premise (BGE / multilingual-e5 / Vietnamese-SBERT).
- Vector DB hỗ trợ **lọc metadata** (topic_ids) trước khi similarity search → tối ưu tốc độ.

## 2.3. Vector hoá, lưu trữ CSDL FAQ

### Thao tác

1. Phê duyệt 1 FAQ ở UC 1.8.
2. BE vector hoá **cả câu hỏi và câu trả lời** (2 embedding riêng).
3. Demo:
   - `POST /fqa/similar-question` với 1 câu tương tự → trả về FAQ vừa approve với score cao.
   - `POST /fqa/similar-answer` tương tự.
4. Ở chat, chọn topic `FREQUENTLY_ASKED_QUESTIONS` → hỏi đúng nội dung FAQ vừa approve → bot trả lời.

### Điểm nói

- FAQ **PENDING** không vào vector DB → không được dùng cho trả lời lẫn check trùng.
- Tách embedding của câu hỏi và câu trả lời giúp phát hiện trùng ở 2 chiều.

---

# MÔ-ĐUN 3 — Nền tảng LLM

> Thời lượng: ~20 phút. Thứ tự: 3.1 → 3.2 → 3.3 → 3.4 → 3.5. Cuối phần nhớ reset tham số + prompt.

## 3.1. Triển khai API của LLM

### Thao tác

1. Mở tab **chat** → gõ: `Xin chào, bạn là ai và có thể giúp gì cho tôi?`
2. Chờ response stream xong.
3. DevTools → Network → filter `api.chat.chatbot` → chỉ vào request streaming.
4. Tab **Response** → show đó là SSE / chunked stream.

### Điểm nói

- LLM host **nội bộ** tại `api.model.mta.swantech.vn`, không gọi OpenAI → **dữ liệu không rò rỉ**.
- Endpoint **OpenAI-compatible** → đổi model (Qwen 32B / Llama-3 / DeepSeek…) **không sửa code FE**.
- FE giao tiếp qua gateway `chatbot-core` (Python) để orchestrate nhiều bước.

## 3.2. Cấu hình tham số LLM

### Thao tác

1. **Quản trị → Cấu hình → Tham số mô hình**.
2. Đọc Alert giải thích tham số.
3. **Demo `temperature`**:
   - `0.1` → câu hỏi *"Viết 3 câu ngắn giới thiệu về nhà trường."* → trả lời bảo thủ, lặp ý.
   - `0.9` → cùng câu hỏi → trả lời sáng tạo, đa dạng.
4. **Demo `maxTokens`**: đặt `40` → hỏi *"Giới thiệu chi tiết về quy trình đăng ký học."* → trả lời **bị cắt**.
5. Network khi bấm Lưu → call `/api/model/chatBotConfig/update`.

### Reset sau demo

`temperature = 0.3, topP = 0.9, topK = 40, maxTokens = 1024, presencePenalty = 0`

### Điểm nói

- Key-value trong DB → chỉnh không cần redeploy.
- Phân quyền `TRO_LY_AO_QUAN_TRI_CAU_HINH_THAM_SO.SUA`.

## 3.3. RAG kết hợp LLM

### Tiền điều kiện: `01-noi-quy.docx` đã APPROVE.

### Phần A — So sánh có/không RAG

1. **Tắt RAG** (toggle "Hỏi đáp thông thường") → hỏi:
   > Nội quy sử dụng trợ lý ảo của nhà trường có bao nhiêu điều? Nêu tiêu đề từng điều.
   → LLM bịa / nói chung chung.
2. **Bật RAG** → cùng câu → trả lời **chính xác 5 điều**.

### Phần B — Xem pipeline trong Network

1. Clear Network → hỏi: *"Điều 4 của nội quy quy định về vấn đề gì?"*
2. Trình tự request:
   - `POST /document-search` → response `[{doc_id, chunk, score}, ...]` top-K.
   - `POST /chat/stream` → body chứa **context chunks** + câu hỏi.
3. Giải thích 3 bước: **Retrieve → Augment → Generate**.

### Phần C — Citation

- Scroll câu trả lời → thấy **chip trích dẫn** → click → mở đúng đoạn tài liệu gốc.

### Điểm nói

- Tài liệu mới → approve → index vector → chatbot biết **ngay**, không fine-tune.
- BM25 (keyword) + embedding (semantic) → tăng recall & precision.

## 3.4. Prompt cho hỏi đáp thông thường

### Thao tác

1. **Quản trị → Cấu hình → Prompt Hỏi đáp** → row **"Hỏi đáp thông thường"** (`code = no-rag`) → Chỉnh sửa.
2. **Demo A — personality**: paste **Prompt #2 (Vui tính)** → Lưu → chat (tắt RAG) *"Học máy là gì?"* → kèm câu đùa.
3. **Demo B — strict scope**: paste **Prompt #3** → Lưu → *"Thời tiết Hà Nội hôm nay?"* → bị từ chối; *"Quy trình đăng ký học?"* → trả lời bình thường.
4. **Reset**: paste **Prompt #1** → Lưu.

→ Xem nội dung Prompt #1/2/3 ở [Phụ lục C](#phụ-lục-c--prompt-templates).

## 3.5. Prompt cho hỏi đáp dựa trên RAG

### Thao tác

1. **Quản trị → Cấu hình → Prompt Hỏi đáp** → row **"Hỏi đáp dựa trên RAG"** (`code = rag`) → Chỉnh sửa.
2. Giải thích placeholder `{context}` + `{question}`.
3. **Demo A — strict grounding** (Prompt #4): paste + Lưu → bật RAG → hỏi *"Học phí học lại môn bao nhiêu tiền?"* (ngoài tài liệu) → *"Tôi không tìm thấy thông tin trong tài liệu."*
4. **Demo B — format Markdown** (Prompt #5): paste + Lưu → hỏi *"Nội quy gồm những điều gì?"* → render bullet + bold.
5. **Demo C — citation** (Prompt #6): paste + Lưu → hỏi câu trên → cuối trả lời có *"Tài liệu tham khảo: 01-noi-quy.docx"*.
6. **Reset**: paste **Prompt #4** → Lưu.

→ Xem nội dung Prompt #4/5/6 ở [Phụ lục C](#phụ-lục-c--prompt-templates).

### Điểm nói chung cho 3.4 + 3.5

- Prompt lưu DB bảng `Prompt` → sửa không cần redeploy → có thể A/B test.

---

# MÔ-ĐUN 4 — Ứng dụng

> Thao tác chung: trên trang chat, sidebar / dropdown chọn **Loại hỏi đáp (topic)** → gõ câu hỏi → bot trả lời kèm trích dẫn.

## 4.A. Chức năng tư vấn tuyển sinh, học tập (UC1–UC9)

| # | UC | Topic | Câu hỏi demo | Kỳ vọng |
|---|---|---|---|---|
| 1 | Thông tin chung tuyển sinh | `GENERAL_ADMISSIONS_INFORMATION` | *"Trường mình năm 2026 tuyển bao nhiêu ngành?"* | Dựa tài liệu 07, có citation |
| 2 | Quy chế tuyển sinh | `ADMISSIONS_RULES_AND_REGULATIONS` | *"Thí sinh diện tuyển thẳng cần điều kiện gì?"* | Dựa tài liệu 07 mục "Quy chế" |
| 3 | Quy chế đào tạo | `TRAINING_RULES_AND_REGULATIONS` | *"Quy định xét tốt nghiệp như thế nào?"* | Dựa tài liệu 05 |
| 4 | Quy chế thi | `EXAMINATION_RULES_AND_REGULATIONS` | *"Hình thức xử lý khi gian lận thi?"* | Dựa tài liệu 06 |
| 5 | Thông tin Học viện | `ACADEMY_INFORMATION` | *"Học viện được thành lập năm nào?"* | Dựa tài liệu giới thiệu HV |
| 6 | Chương trình đào tạo | `TRAINING_PROGRAMS_INFORMATION` | *"Ngành CNTT đào tạo mấy năm? Có những chuyên ngành nào?"* | Dựa tài liệu CTĐT |
| 7 | Chính sách HV quân sự | `REGULATIONS_POLICIES_AND_BENEFITS_FOR_MILITARY_CADETS` | *"Học viên quân sự có được hưởng phụ cấp nào?"* | Dựa tài liệu riêng |
| 8 | Chính sách SV dân sự | `REGULATIONS_POLICIES_AND_BENEFITS_FOR_CIVILIAN_STUDENTS` | *"Học bổng khuyến khích học tập cho SV dân sự?"* | Dựa tài liệu 08 |
| 9 | FAQ | `FREQUENTLY_ASKED_QUESTIONS` | *"Quy trình đăng ký học lại?"* | Lấy từ bảng FAQ (không phải document) |

### Điểm nhấn

- **Chọn sai topic** → không tìm thấy → cô lập nguồn dữ liệu theo lĩnh vực.
- Click **chip trích dẫn** → mở đoạn gốc.
- Cùng câu hỏi ở 2 topic khác nhau → câu trả lời khác nhau.

→ Bank 5 câu/topic ở [Phụ lục A](#phụ-lục-a--bank-câu-hỏi-12-topic).

## 4.B. Hỏi đáp Văn bản hành chính (UC10–UC12)

| # | UC | Topic | Câu hỏi demo |
|---|---|---|---|
| 10 | Công tác Đảng, Chính trị | `PARTY_WORK_AND_POLITICAL_WORK` | *"Quy định về sinh hoạt đảng viên dự bị?"* |
| 11 | Quy định nội bộ | `INTERNAL_GUIDELINES_AND_REGULATIONS_OF_THE_ACADEMY` | *"Nội quy sử dụng thư viện?"* |
| 12 | Sổ tay giảng viên | `IN_THE_FACULTY_HANDBOOK` | *"Giảng viên mới cần hoàn thành thủ tục gì trong tuần đầu?"* |

**Điểm nhấn**: các lĩnh vực **không public trên internet** → giá trị của RAG nội bộ.

## 4.C. Tìm kiếm văn bản theo từ khoá và ngữ nghĩa

**Trang**: `/tim-kiem-van-ban`

1. **Keyword (BM25)**: gõ `"gian lận"` → trả về tài liệu **chứa chính xác chuỗi**.
2. **Semantic (vector)**: gõ `"xử lý vi phạm khi kiểm tra"` → trả về tài liệu về gian lận dù **không có từ "vi phạm"** → chứng minh semantic.
3. Click kết quả → `PreviewTaiLieu` → download file → đúng nội dung.

**Điểm nhấn**: kết hợp keyword cho chính xác, semantic cho tìm theo ý.

## 4.D. Xử lý văn bản (4 mode)

**Trang**: `/xu-ly-van-ban`. Văn bản mẫu ở [Phụ lục D](#phụ-lục-d--văn-bản-mẫu-xử-lý-văn-bản).

### 4.D.1. Dịch thuật từ ngôn ngữ khác sang tiếng Việt

1. Mode **Dịch văn bản** → paste **EN-1** (~180 từ) → Xử lý → tiếng Việt chuẩn, giữ thuật ngữ.
2. Paste **ZH-1** (tiếng Trung) → vẫn dịch được đa ngôn ngữ.

### 4.D.2. Phát hiện và sửa lỗi văn bản

1. Mode **Sửa lỗi chính tả** → paste **ERR-1** (5–7 lỗi cố ý) → trả về văn bản đã sửa + list lỗi.
2. (Tuỳ chọn) paste **ERR-2** (email hành chính).

### 4.D.3. Tóm tắt **trích lược** (extractive)

1. Mode **Tóm lược** (UI ánh xạ → `EXTRACTIVE_TEXT_SUMMARIZATION`).
2. Paste **DOC-1** → kết quả là **vài câu trích nguyên văn**, không paraphrase.

### 4.D.4. Tóm tắt **tóm lược** (abstractive)

1. Mode **Trích lược** (UI ánh xạ → `ABSTRACTIVE_TEXT_SUMMARIZATION`).
2. Paste **cùng DOC-1** → **đoạn văn mới** (LLM paraphrase).

> ⚠️ Nhãn UI hiện đang bị **ngược** so với tên kỹ thuật: *"Tóm lược" (UI) = extractive*, *"Trích lược" (UI) = abstractive*. Demo theo **nhãn UI**.

**Điểm nhấn**: chạy 2 mode trên **cùng input** → thấy khác biệt rõ.

---

# MÔ-ĐUN 5 — Quản lý hội thoại, người dùng

## 5.1. Đăng ký người dùng

- Dùng **SSO tập trung** `mta.swantech.vn/api/sso-id`. Admin cấp account qua SSO — trợ lý ảo **không quản lý đăng ký local**.
- Demo: mở ẩn danh → truy cập trợ lý ảo → auto redirect SSO signin → nhập tài khoản → quay về trợ lý ảo với quyền phù hợp.
- *"1 tài khoản dùng cho nhiều ứng dụng, bảo mật tập trung."*

## 5.2. Đăng nhập hệ thống

- Trang `/` → click menu user góc phải → hiện thông tin + avatar + phân quyền.
- DevTools → Application → Cookies → show cookie session SSO.
- Network → endpoint `/api/auth/get-session` trả `{userId, username, permissions}`.

## 5.3. Quản lý hội thoại của người dùng

Sidebar trái hiển thị danh sách hội thoại của user. Demo:

- **Tạo mới**: nút "Hội thoại mới" → vào trang chat trống.
- **Đặt tên tự động**: sau câu hỏi đầu tiên, tên được generate (5 từ đầu câu hỏi).
- **Đổi tên**: icon edit → sửa → lưu.
- **Xoá**: icon thùng rác → xác nhận.
- **Chuyển qua hội thoại cũ**: click item → load lại lịch sử.
- **Follow-up context**: hỏi *"Điều 4 nội quy nói gì?"* → bot trả lời → hỏi *"Còn điều 5?"* → bot hiểu ngữ cảnh.

Prisma model `Conversation` có `userId` → đảm bảo user chỉ thấy hội thoại của mình (đa tenant).

## 5.4. Tiếp nhận phản hồi của người dùng

- Mỗi câu trả lời có icon **👍 / 👎**.
  - 👎 → popup nhập lý do → gửi → lưu bảng `FeedBack`.
  - Network → `POST /feedback`.
- Admin → trang báo cáo feedback → xem user phản hồi gì → cải thiện prompt / tài liệu.

---

## Câu chuyện kết thúc

> "Hệ thống trợ lý ảo không chỉ là giao diện chat, mà là **1 platform hoàn chỉnh** kết nối: quản trị tri thức nội bộ (tài liệu + FAQ), hạ tầng LLM tuỳ chỉnh (mô hình + tham số + prompt), ứng dụng đầu cuối (12 topic hỏi đáp + tìm kiếm + xử lý văn bản), và quản lý vòng đời (SSO + hội thoại + phản hồi). Tất cả **on-premise**, tuân thủ bảo mật quân đội."

---

# PHỤ LỤC

## Phụ lục A — Bank câu hỏi 12 topic

> Copy-paste nhanh. 5 câu/topic. Một số câu cố ý **ngoài** tài liệu để demo không bịa.

### 1. `GENERAL_ADMISSIONS_INFORMATION`
```
Trường mình năm 2026 tuyển bao nhiêu ngành?
Điểm chuẩn năm 2025 ngành Công nghệ thông tin là bao nhiêu?
Thí sinh có thể xét tuyển bằng học bạ không?
Thời gian nộp hồ sơ xét tuyển đợt 1 năm 2026 là khi nào?
Tôi có thể đăng ký nhiều nguyện vọng không?
```

### 2. `ADMISSIONS_RULES_AND_REGULATIONS`
```
Thí sinh diện tuyển thẳng cần điều kiện gì?
Trình tự đăng ký xét tuyển online gồm những bước nào?
Quy định về điểm ưu tiên khu vực được áp dụng như thế nào?
Thí sinh bị phát hiện gian lận hồ sơ sẽ bị xử lý ra sao?
Thí sinh có được rút hồ sơ sau khi đã nộp không?
```

### 3. `TRAINING_RULES_AND_REGULATIONS`
```
Quy định xét tốt nghiệp như thế nào?
Sinh viên đạt điểm F bao nhiêu môn thì bị cảnh báo học vụ?
Điều kiện để được miễn môn học là gì?
Sinh viên có thể học vượt tối đa bao nhiêu tín chỉ mỗi kỳ?
Quy định về nghỉ học tạm thời và bảo lưu kết quả?
```

### 4. `EXAMINATION_RULES_AND_REGULATIONS`
```
Hình thức xử lý khi gian lận thi cử?
Sinh viên mang điện thoại vào phòng thi sẽ bị xử lý như thế nào?
Quy định về thời gian phát đề và nộp bài thi?
Sinh viên được phép mang tài liệu gì vào phòng thi tự luận?
Quy trình phúc khảo bài thi diễn ra trong bao lâu?
```

### 5. `ACADEMY_INFORMATION`
```
Học viện được thành lập năm nào?
Hiệu trưởng hiện nay của Học viện là ai?
Cơ cấu tổ chức của Học viện gồm những khoa/viện nào?
Học viện có bao nhiêu cơ sở đào tạo?
Sứ mệnh và tầm nhìn của Học viện là gì?
```

### 6. `TRAINING_PROGRAMS_INFORMATION`
```
Ngành Công nghệ thông tin đào tạo mấy năm? Có những chuyên ngành nào?
Tổng số tín chỉ yêu cầu cho chương trình cử nhân là bao nhiêu?
Chương trình đào tạo thạc sĩ kéo dài bao lâu?
Sinh viên có thể học song ngành không?
Các học phần đại cương bắt buộc gồm những môn gì?
```

### 7. `REGULATIONS_POLICIES_AND_BENEFITS_FOR_MILITARY_CADETS`
```
Học viên quân sự có được hưởng phụ cấp nào?
Chế độ trang phục và sinh hoạt phí của học viên quân sự ra sao?
Quy định về thời gian nghỉ phép của học viên quân sự?
Sau khi tốt nghiệp, học viên quân sự được phân công công tác thế nào?
Học viên quân sự có được kết hôn trong thời gian học không?
```

### 8. `REGULATIONS_POLICIES_AND_BENEFITS_FOR_CIVILIAN_STUDENTS`
```
Học bổng khuyến khích học tập cho sinh viên dân sự?
Sinh viên dân sự có được miễn giảm học phí không?
Chế độ hỗ trợ cho sinh viên có hoàn cảnh khó khăn?
Sinh viên diện chính sách được cộng điểm ưu tiên bao nhiêu?
Quy định về học bổng dành cho sinh viên giỏi và xuất sắc?
```

### 9. `FREQUENTLY_ASKED_QUESTIONS`
```
Quy trình đăng ký học lại?
Làm thế nào để cấp lại thẻ sinh viên bị mất?
Thời gian nghỉ hè của sinh viên là bao lâu?
Tôi quên mật khẩu đăng nhập, phải làm sao?
Lịch thi học kỳ được công bố ở đâu?
```

### 10. `PARTY_WORK_AND_POLITICAL_WORK`
```
Quy định về sinh hoạt đảng viên dự bị?
Trình tự xét kết nạp Đảng đối với sinh viên?
Đảng viên chuyển sinh hoạt đảng cần làm thủ tục gì?
Quy định về đóng đảng phí của đảng viên đang học?
Hình thức khen thưởng đảng viên xuất sắc?
```

### 11. `INTERNAL_GUIDELINES_AND_REGULATIONS_OF_THE_ACADEMY`
```
Nội quy sử dụng thư viện?
Quy định về sử dụng phòng máy tính thực hành?
Thủ tục xin nghỉ học 1 buổi cần làm gì?
Quy định trang phục khi lên lớp?
Thủ tục đăng ký sử dụng hội trường để tổ chức sự kiện?
```

### 12. `IN_THE_FACULTY_HANDBOOK`
```
Giảng viên mới cần hoàn thành thủ tục gì trong tuần đầu?
Định mức giờ giảng tối thiểu của giảng viên một năm là bao nhiêu?
Quy định về biên soạn đề cương chi tiết môn học?
Giảng viên được hỗ trợ kinh phí nghiên cứu khoa học như thế nào?
Quy trình đề xuất đi học nâng cao trình độ?
```

### Câu hỏi **ngoài** phạm vi (demo không bịa)
```
Giá vàng SJC hôm nay bao nhiêu?
Lịch thi đấu World Cup 2030?
Tỷ giá USD/VND bao nhiêu?
```

---

## Phụ lục B — FAQ gốc để test trùng lặp

> Tạo + **APPROVE** 2 FAQ này **trước buổi demo**. Nếu không, Case B và Case C ở UC 1.6 sẽ không có gì để so sánh (vector DB trống).

### FAQ gốc #1

- **Loại**: (chọn 1 topic bất kỳ, ghi nhớ để dùng lại)
- **Câu hỏi**: `Quy trình đăng ký học lại tại nhà trường như thế nào?`
- **Câu trả lời**:
  ```
  Sinh viên có nhu cầu đăng ký học lại nộp đơn xin học lại tại Phòng Đào tạo kèm bảng điểm hiện tại. Sau khi được duyệt, sinh viên đóng học phí học lại theo quy định và tham gia lớp học cùng khóa đang mở môn tương ứng. Kết quả học lại sẽ được cập nhật thay thế điểm cũ trong bảng điểm chính thức của sinh viên.
  ```

### FAQ gốc #2

- **Loại**: (topic bất kỳ, khác loại với FAQ #1 càng tốt)
- **Câu hỏi**: `Làm thế nào để cấp lại thẻ sinh viên bị mất?`
- **Câu trả lời**:
  ```
  Khi thẻ sinh viên bị mất, sinh viên làm đơn xin cấp lại thẻ tại Phòng Công tác sinh viên, kèm bản sao CCCD và ảnh 3x4. Lệ phí cấp lại thẻ được thu theo quy định hiện hành của nhà trường. Thời gian trả thẻ mới khoảng 5 đến 7 ngày làm việc kể từ khi nộp đơn hợp lệ.
  ```

### Case D (tuỳ chọn) — Reject FAQ

Tạo 1 FAQ bất kỳ → vào **Chờ duyệt** → **Từ chối** với lý do → FAQ chuyển tab **Từ chối**, hiện lý do.

---

## Phụ lục C — Prompt templates

### Prompt #1 — no-RAG, MẶC ĐỊNH

```
Bạn là trợ lý ảo của nhà trường, tên là "SWAN Assistant".
Nhiệm vụ: trả lời câu hỏi của cán bộ, giảng viên, học viên và sinh viên bằng tiếng Việt.
Quy tắc:
- Trả lời ngắn gọn, lịch sự, chuyên nghiệp.
- Nếu không chắc chắn, hãy nói rõ bạn không biết — tuyệt đối không bịa thông tin.
- Với các câu hỏi nhạy cảm, chính trị, hoặc ngoài phạm vi đào tạo, hãy từ chối lịch sự.
```

### Prompt #2 — no-RAG, VUI TÍNH (UC 3.4-A)

```
Bạn là trợ lý ảo vui tính của nhà trường, tên là "SWAN Assistant".
Mỗi câu trả lời hãy thêm 1 câu đùa dí dỏm nhẹ nhàng ở cuối (nhưng vẫn giữ thông tin chính xác).
Dùng tiếng Việt, văn phong thân thiện.
```

### Prompt #3 — no-RAG, STRICT SCOPE (UC 3.4-B)

```
Bạn là trợ lý ảo của nhà trường, chỉ trả lời các câu hỏi liên quan đến:
- Đào tạo đại học, sau đại học
- Quy trình hành chính của sinh viên
- Nội quy, quy định nhà trường

Với mọi câu hỏi KHÁC (thời tiết, giải trí, chính trị, tin tức, v.v.), hãy trả lời:
"Xin lỗi, tôi chỉ hỗ trợ các câu hỏi liên quan đến đào tạo và quản lý sinh viên của nhà trường."

Dùng tiếng Việt, lịch sự.
```

### Prompt #4 — RAG, MẶC ĐỊNH / STRICT GROUNDING (UC 3.5-A)

```
Bạn là trợ lý ảo của nhà trường. Hãy trả lời câu hỏi của người dùng CHỈ DỰA VÀO phần THÔNG TIN được cung cấp bên dưới.

Quy tắc:
- Nếu THÔNG TIN không đủ để trả lời, hãy nói rõ: "Tôi không tìm thấy thông tin trong tài liệu."
- Tuyệt đối không bịa, không dùng kiến thức bên ngoài.
- Trả lời bằng tiếng Việt, ngắn gọn, chính xác.

THÔNG TIN:
{context}

CÂU HỎI: {question}

TRẢ LỜI:
```

### Prompt #5 — RAG, FORMAT MARKDOWN (UC 3.5-B)

```
Bạn là trợ lý ảo của nhà trường. Trả lời dựa trên THÔNG TIN cung cấp.

Định dạng trả lời:
- Dùng **Markdown**: danh sách gạch đầu dòng, in đậm (**...**) từ khoá quan trọng.
- Mỗi ý chính là 1 bullet.
- Không bịa nếu thông tin không đủ.

THÔNG TIN:
{context}

CÂU HỎI: {question}

TRẢ LỜI:
```

### Prompt #6 — RAG, CÓ CITATION (UC 3.5-C)

```
Bạn là trợ lý ảo của nhà trường. Trả lời câu hỏi dựa trên THÔNG TIN và GHI RÕ NGUỒN.

Quy tắc:
- Trả lời ngắn gọn, chính xác bằng tiếng Việt.
- Ở cuối câu trả lời, thêm dòng: "**Tài liệu tham khảo:** <tên tài liệu 1>, <tên tài liệu 2>"
- Nếu không có thông tin, nói "Tôi không tìm thấy thông tin trong tài liệu." và không liệt kê nguồn.

THÔNG TIN:
{context}

CÂU HỎI: {question}

TRẢ LỜI:
```

---

## Phụ lục D — Văn bản mẫu Xử lý văn bản

### Mẫu EN-1 — Dịch Anh → Việt (~180 từ)

```
Artificial intelligence is transforming higher education in many fundamental ways.
Universities are deploying intelligent virtual assistants to answer student
questions about admissions, curriculum, examination regulations, and administrative
procedures. These systems combine large language models with retrieval-augmented
generation so that responses are grounded in official institutional documents,
reducing misinformation. Beyond question answering, modern academic platforms
also offer text translation, grammar correction, summarization, and semantic search
over internal repositories such as faculty handbooks and party documents.
Adoption of these tools not only improves the efficiency of administrative staff
but also empowers students and cadets to self-serve information around the clock.
However, universities must carefully manage prompt design, data governance, and
privacy controls to ensure reliable, secure, and compliant operation. Ongoing
feedback from end users is essential for continuously improving answer quality
and expanding the knowledge base over time.
```

### Mẫu ZH-1 — Dịch Trung → Việt (~100 từ)

```
人工智能正在深刻改变高等教育。大学正在部署智能虚拟助手，
回答学生关于招生、课程、考试规则和行政程序的问题。这些系统将大型语言模型
与检索增强生成相结合，使回答基于官方机构文件，从而减少错误信息。
除了问答之外，现代学术平台还提供翻译、语法纠正、摘要和语义搜索功能。
```

### Mẫu ERR-1 — Sửa lỗi chính tả

```
Sinh viên có nhu câù đăng kí học laị liên hệ phòng đào taọ để được hưỡng dẫn.
Thời gian nộp hồ sơ trong vòng 7 nghàytừ khi có thông báo. Sinh vien cần chuẩn
bị đầy đủ giấy tờ bao gồm đơn xinhọc lại, bản sao bảng điễm và giấy tờ tuỳ thân.
Sau khi nộp hồ sơ, sinh viên chờ kết quả xét duyệt trong vòng 3 ngay làm việc.
```

**Lỗi cố ý**: "câù", "kí", "laị", "taọ", "hưỡng", "nghàytừ", "vien", "xinhọc", "điễm", "tuỳ", "ngay".

### Mẫu ERR-2 — Email hành chính

```
Kính gữi Thầy,
Em tên là Nguyễn Văn An, sinh viên lớp CNTT k25. Em víêt mail nay để hỏi về
qui trình đăng kí học vụ kỳ tới. Em mong Thầy phản hổi giúp em ạ.
Em xin tran tọng cảm ơn.
```

**Lỗi**: "gữi", "víêt", "nay", "qui", "kí", "phản hổi", "tran tọng".

### Mẫu DOC-1 — Tóm tắt (dùng cho cả 2 mode extractive / abstractive)

```
Trong những năm gần đây, việc ứng dụng trí tuệ nhân tạo vào giáo dục đại học
đã mở ra nhiều cơ hội mới cho cả giảng viên và sinh viên. Các trường đại học
trên thế giới đang triển khai các hệ thống trợ lý ảo thông minh nhằm hỗ trợ
sinh viên tra cứu thông tin về tuyển sinh, quy chế đào tạo, quy chế thi và
các thủ tục hành chính. Những hệ thống này thường kết hợp mô hình ngôn ngữ
lớn (LLM) với kỹ thuật truy xuất tài liệu (RAG) để đảm bảo câu trả lời bám
sát tài liệu chính thức của nhà trường, hạn chế hiện tượng bịa thông tin.

Bên cạnh chức năng hỏi đáp, các nền tảng học thuật hiện đại còn cung cấp
nhiều tiện ích khác như dịch thuật đa ngôn ngữ, phát hiện và sửa lỗi chính tả,
tóm tắt văn bản, tìm kiếm ngữ nghĩa trong kho tài liệu nội bộ bao gồm sổ tay
giảng viên và văn bản công tác đảng. Việc áp dụng các công cụ này không chỉ
giúp cán bộ quản lý tiết kiệm thời gian mà còn cho phép sinh viên, học viên
tự phục vụ nhu cầu thông tin 24/7.

Tuy nhiên, để triển khai thành công, các trường cần quan tâm đặc biệt tới
thiết kế prompt, kiểm soát dữ liệu, bảo mật thông tin cá nhân và tuân thủ
quy định pháp lý. Cơ chế tiếp nhận phản hồi từ người dùng là yếu tố then chốt
giúp liên tục cải thiện chất lượng câu trả lời và mở rộng kho tri thức theo
thời gian. Sự kết hợp giữa công nghệ AI tiên tiến với quy trình quản trị
chặt chẽ chính là chìa khóa để các trường đại học chuyển đổi số một cách
hiệu quả và bền vững.
```

**Extractive (Tóm lược)** → vài câu trích nguyên văn.
**Abstractive (Trích lược)** → đoạn văn mới do LLM viết lại, giữ ý chính.

### Mẫu DOC-2 — Tóm tắt ngắn (~150 từ, demo nhanh)

```
Học viện tổ chức kỳ thi tuyển sinh hàng năm vào tháng 7. Thí sinh đăng ký
trực tuyến qua cổng thông tin từ tháng 3 và nộp hồ sơ bản cứng trước ngày 30/6.
Kỳ thi gồm ba môn: Toán, Vật lý hoặc Hóa học và một môn tự chọn. Điểm xét tuyển
được tính theo công thức điểm thi nhân hệ số cộng điểm ưu tiên khu vực và đối
tượng. Kết quả trúng tuyển công bố trước ngày 20/8 và thí sinh phải xác nhận
nhập học trong vòng 7 ngày. Sau khi xác nhận, tân sinh viên tham gia tuần
sinh hoạt công dân và hoàn thiện thủ tục nhập học tại Phòng Đào tạo.
```

---

## Phụ lục E — Reset cuối buổi demo

1. **Tham số** (`/quan-tri/cau-hinh/tham-so`):
   `temperature=0.3, topP=0.9, topK=40, maxTokens=1024, presencePenalty=0`.
2. **Prompt no-RAG** (`code=no-rag`): Prompt #1.
3. **Prompt RAG** (`code=rag`): Prompt #4.
4. Xoá các tài liệu / FAQ demo phát sinh trong buổi (nếu không giữ lại).
5. Clear lịch sử chat demo.

---

## Phụ lục F — Troubleshooting nhanh

| Triệu chứng | Nguyên nhân | Xử lý |
|---|---|---|
| Chat không stream, xoay vòng mãi | LLM service down | Check `api.model/api/health`, restart model |
| File 04 không báo trùng | File 01 chưa APPROVE / khác topic | Vào `/quan-tri/du-lieu/tai-lieu` verify; Network → `document-reader` xem `document_simmilar` |
| FAQ không báo trùng | FAQ gốc chưa APPROVE / service QA lỗi | Approve FAQ gốc, check `/fqa/similar-*` |
| Bật RAG nhưng không biết tài liệu | File chưa APPROVE / chưa index | Approve lại, check vector DB |
| Đổi prompt xong không có tác dụng | Cache FE | `Ctrl+Shift+R`, gõ câu hỏi mới |
| Đổi temperature không thấy khác | Câu hỏi quá xác định | Dùng câu "sáng tạo" (viết bài giới thiệu, viết thơ…) |
| Citation không hiện | Retrieve rỗng | Check Network `document-search`, xem `sources` |
| Chat trả lời *"Tôi không tìm thấy…"* dù có tài liệu | Chưa APPROVE hoặc sai topic | Kiểm tra trạng thái + topic_ids |
| Dịch bị giới hạn 2000 ký tự | Giới hạn UI | Cắt bớt input hoặc demo nhiều lần |
| Tóm lược / trích lược giống nhau | Prompt yếu | Check prompt `EXTRACTIVE_/ABSTRACTIVE_TEXT_SUMMARIZATION` ở `/quan-tri/cau-hinh/prompt-chuc-nang` |
| Tìm kiếm ngữ nghĩa rỗng | Vector DB trống / `api.doc` down | Check `api.doc/health`, verify doc đã vectorize |
| Không thấy hội thoại cũ | User khác / session khác | Clear cache, re-login |
| Feedback không lưu | BE endpoint lỗi | Check Network `/feedback` |

---

## Phụ lục G — Danh sách file demo kèm theo

| File | Mục đích | Dùng cho UC |
|---|---|---|
| `01-noi-quy.docx` | Tài liệu DOCX nội quy | 1.1, 1.3, 3.3, 4.B-UC11 |
| `02-quy-dinh.pdf` | PDF có text layer | 1.2, 4.A-UC3 |
| `03-scan.pdf` | PDF scan (test OCR) | 1.2 |
| `04-trung-lap.docx` | Test trùng lặp văn bản | 1.3 |
| `05-quy-che-dao-tao.docx` | Nguồn UC3 | 4.A-UC3 |
| `06-quy-che-thi.docx` | Nguồn UC4 | 4.A-UC4 |
| `07-thong-tin-tuyen-sinh.docx` | Nguồn UC1, UC2 | 4.A-UC1, UC2 |
| `08-chinh-sach-sv.docx` | Nguồn UC8 | 4.A-UC8 |
| `DEMO-FULL.md` | (File này) Kịch bản tổng hợp | Toàn bộ |

---

**— Hết —**
