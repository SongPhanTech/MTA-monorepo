# Kịch bản demo mô-đun Nền tảng LLM

> Tổng thời lượng: ~20 phút. Thứ tự: UC1 → UC2 → UC3 → UC4 → UC5. Cuối buổi **reset** tham số + prompt về mặc định.

## 0. Checklist trước demo (5 phút)

- [ ] Service healthy: mở tab check nhanh
  - `https://api.model.mta.swantech.vn/api/health`
  - `https://api.chat.chatbot.swantech.vn/health` (hoặc `/docs`)
  - `https://api.doc.chatbot.swantech.vn/health`
- [ ] DB `ChatBotConfig` có 5 row: `temperature=0.3, topP=0.9, topK=40, maxTokens=1024, presencePenalty=0`.
- [ ] DB `Prompt` có 2 row: `code=rag` và `code=no-rag` (xem template ở mục **Prompt mặc định** dưới).
- [ ] Tài liệu `01-noi-quy.docx` (trong `demo-files/`) đã **APPROVE** và nằm trong vector DB — test nhanh: chat hỏi "Nội quy sử dụng trợ lý ảo gồm bao nhiêu điều?" → trả lời "5 điều".
- [ ] DevTools mở sẵn ở tab **Network**, clear log trước mỗi UC.
- [ ] Mở sẵn 4 tab trình duyệt:
  1. `/` (Trang chat)
  2. `/quan-tri/cau-hinh/tham-so`
  3. `/quan-tri/cau-hinh/prompt-hoi-dap`
  4. `/quan-tri/du-lieu/tai-lieu` (để chứng minh tài liệu đã duyệt)

---

## UC 1 — Triển khai API của LLM (2 phút)

### Thao tác

1. Mở tab **chat** → gõ:
   > Xin chào, bạn là ai và có thể giúp gì cho tôi?
2. Chờ response stream xong.
3. Mở DevTools → Network → filter `api.chat.chatbot` → chỉ vào request streaming.
4. Click vào request → tab **Response** → show đó là SSE / chunked stream.

### Điểm nói

- "LLM đang được **host nội bộ** tại `api.model.mta.swantech.vn`, không gọi OpenAI ra ngoài → **dữ liệu không rò rỉ**."
- "Endpoint chuẩn OpenAI-compatible → có thể thay model (Qwen 32B / Llama-3 / DeepSeek…) mà **không phải sửa code FE**."
- "FE giao tiếp qua gateway `chatbot-core` (Python) để orchestrate nhiều bước (RAG, moderation, logging)."

---

## UC 2 — Cấu hình tham số LLM (3 phút)

### Thao tác

1. Vào **Quản trị → Cấu hình → Tham số mô hình**.
2. Đọc nhanh phần Alert giải thích tham số.
3. **Demo temperature**:
   - Đặt `temperature = 0.1` → **Lưu**.
   - Quay lại chat, hỏi: _"Viết 3 câu ngắn giới thiệu về nhà trường."_ → câu trả lời **bảo thủ, lặp ý**.
   - Đổi `temperature = 0.9` → **Lưu** → hỏi **cùng câu** → câu trả lời **sáng tạo, đa dạng hơn**.
4. **Demo maxTokens**:
   - Đặt `maxTokens = 40` → Lưu → hỏi _"Giới thiệu chi tiết về quy trình đăng ký học."_ → câu trả lời **bị cắt giữa chừng**.
5. Mở Network khi bấm Lưu → show call Prisma `update ChatBotConfig` (`/api/model/chatBotConfig/update`).

### Reset sau UC2

```
temperature = 0.3
topP = 0.9
topK = 40
maxTokens = 1024
presencePenalty = 0
```

### Điểm nói

- "Tham số lưu DB, key-value — admin tinh chỉnh **không cần redeploy**."
- "Phân quyền: chỉ role có `TRO_LY_AO_QUAN_TRI_CAU_HINH_THAM_SO.SUA` mới sửa được."

---

## UC 3 — RAG kết hợp LLM (5 phút)

### Tiền điều kiện

File `01-noi-quy.docx` đã APPROVE.

### Thao tác

**Phần A — So sánh có/không RAG**

1. Vào chat → **tắt RAG** (chuyển sang chế độ "Hỏi đáp thông thường" nếu UI có toggle).
2. Hỏi:
   > Nội quy sử dụng trợ lý ảo của nhà trường có bao nhiêu điều? Nêu tiêu đề từng điều.
   > → LLM bịa / nói chung chung / không biết chi tiết.
3. **Bật RAG** lại → hỏi **cùng câu** → trả lời **chính xác 5 điều** kèm tiêu đề.

**Phần B — Xem pipeline trong Network**

1. DevTools → Network → clear → hỏi 1 câu mới:
   > Điều 4 của nội quy quy định về vấn đề gì?
2. Thấy trình tự request:
   - `POST /document-search` (hoặc tên tương đương) → response chứa `[{doc_id, chunk, score}, ...]` top-K.
   - `POST /chat/stream` → request body chứa **context chunks** vừa retrieve + câu hỏi.
3. Giải thích 3 bước: **Retrieve** (vector search) → **Augment** (nhét context vào prompt) → **Generate** (LLM sinh câu trả lời).

**Phần C — Citation**

1. Scroll câu trả lời trong chat → thấy **chip trích dẫn** sau mỗi đoạn.
2. Hover/click chip → mở sidebar document → scroll tới đúng đoạn được LLM dùng.
3. "Người dùng verify được nguồn, chống bịa (hallucination)."

### Điểm nói

- "RAG = LLM + tri thức nội bộ. Khi có tài liệu mới → approve → index vector → chatbot biết **ngay lập tức**, không cần fine-tune model."
- "Pipeline BM25 (keyword) + embedding (semantic) → tăng cả recall và precision."

---

## UC 4 — Prompt cho hỏi đáp thông thường (4 phút)

### Thao tác

1. Vào **Quản trị → Cấu hình → Prompt Hỏi đáp** → dòng **"Hỏi đáp thông thường"** → Chỉnh sửa.
2. **Demo A — đổi personality**:
   - Paste **Prompt #2 — vui tính** (mục "Prompt templates" dưới) → Lưu.
   - Chat (tắt RAG) hỏi _"Học máy là gì?"_ → LLM trả lời kèm câu đùa.
3. **Demo B — giới hạn scope**:
   - Paste **Prompt #3 — strict scope** → Lưu.
   - Hỏi _"Thời tiết Hà Nội hôm nay thế nào?"_ → LLM **từ chối lịch sự** vì ngoài lĩnh vực.
   - Hỏi _"Quy trình đăng ký học như thế nào?"_ → trả lời bình thường.
4. **Reset**: Paste **Prompt #1 — mặc định no-RAG** → Lưu.

### Điểm nói

- "Prompt lưu DB bảng `Prompt`, `code = no-rag` — đổi prompt không cần redeploy."
- "Dùng để điều hướng **hành vi, phong cách, giới hạn chủ đề** của trợ lý."

---

## UC 5 — Prompt cho hỏi đáp RAG (5 phút)

### Thao tác

1. Vào **Quản trị → Cấu hình → Prompt Hỏi đáp** → dòng **"Hỏi đáp dựa trên RAG"** → Chỉnh sửa.
2. Show template có placeholder `{context}` + `{question}` — giải thích: _"khi chat, hệ thống thay `{context}` bằng các chunk retrieve được, thay `{question}` bằng câu hỏi người dùng."_
3. **Demo A — strict grounding** (Prompt #4):
   - Paste + Lưu.
   - Chat (bật RAG) hỏi _"Học phí học lại môn bao nhiêu tiền?"_ (không có trong tài liệu 01) → LLM trả lời **"Tôi không tìm thấy thông tin trong tài liệu."** → chứng minh **không bịa**.
4. **Demo B — format output** (Prompt #5):
   - Paste + Lưu.
   - Hỏi _"Nội quy sử dụng trợ lý ảo gồm những điều gì?"_ → kết quả render **Markdown list, in đậm từ khoá**.
5. **Demo C — citation** (Prompt #6):
   - Paste + Lưu.
   - Hỏi câu trên → cuối câu có _"Tài liệu tham khảo: 01-noi-quy.docx"_.
6. **Reset**: Paste **Prompt #4 — mặc định RAG** (cũng là Prompt #7 dưới) → Lưu.

### Điểm nói

- "Prompt RAG = System prompt + context chunks + câu hỏi. Sửa template → đổi behaviour toàn trợ lý."
- "Admin có thể **A/B test prompt** để tối ưu chất lượng trả lời trên thực tế."

---

## Câu hỏi demo (copy-paste sẵn)

### Cho UC 1

```
Xin chào, bạn là ai và có thể giúp gì cho tôi?
```

### Cho UC 2 — so sánh temperature

```
Viết 3 câu ngắn giới thiệu về nhà trường.
```

```
Giới thiệu chi tiết về quy trình đăng ký học.
```

### Cho UC 3 — RAG

```
Nội quy sử dụng trợ lý ảo của nhà trường có bao nhiêu điều? Nêu tiêu đề từng điều.
```

```
Điều 4 của nội quy quy định về vấn đề gì?
```

### Cho UC 4 — prompt no-RAG

```
Học máy là gì?
```

```
Thời tiết Hà Nội hôm nay thế nào?
```

```
Quy trình đăng ký học tại trường như thế nào?
```

### Cho UC 5 — prompt RAG

```
Học phí học lại môn bao nhiêu tiền?
```

```
Nội quy sử dụng trợ lý ảo gồm những điều gì? Tóm tắt ngắn gọn.
```

---

## Prompt templates (copy-paste sẵn)

### Prompt #1 — no-RAG, MẶC ĐỊNH

```
Bạn là trợ lý ảo của nhà trường, tên là "SWAN Assistant".
Nhiệm vụ: trả lời câu hỏi của cán bộ, giảng viên, học viên và sinh viên bằng tiếng Việt.
Quy tắc:
- Trả lời ngắn gọn, lịch sự, chuyên nghiệp.
- Nếu không chắc chắn, hãy nói rõ bạn không biết — tuyệt đối không bịa thông tin.
- Với các câu hỏi nhạy cảm, chính trị, hoặc ngoài phạm vi đào tạo, hãy từ chối lịch sự.
```

### Prompt #2 — no-RAG, VUI TÍNH (demo UC4-A)

```
Bạn là trợ lý ảo vui tính của nhà trường, tên là "SWAN Assistant".
Mỗi câu trả lời hãy thêm 1 câu đùa dí dỏm nhẹ nhàng ở cuối (nhưng vẫn giữ thông tin chính xác).
Dùng tiếng Việt, văn phong thân thiện.
```

### Prompt #3 — no-RAG, STRICT SCOPE (demo UC4-B)

```
Bạn là trợ lý ảo của nhà trường, chỉ trả lời các câu hỏi liên quan đến:
- Đào tạo đại học, sau đại học
- Quy trình hành chính của sinh viên
- Nội quy, quy định nhà trường

Với mọi câu hỏi KHÁC (thời tiết, giải trí, chính trị, tin tức, v.v.), hãy trả lời:
"Xin lỗi, tôi chỉ hỗ trợ các câu hỏi liên quan đến đào tạo và quản lý sinh viên của nhà trường."

Dùng tiếng Việt, lịch sự.
```

### Prompt #4 — RAG, MẶC ĐỊNH (strict grounding, demo UC5-A)

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

### Prompt #5 — RAG, FORMAT MARKDOWN (demo UC5-B)

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

### Prompt #6 — RAG, CÓ CITATION (demo UC5-C)

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

### Prompt #7 — RAG, reset về mặc định sau demo

Dùng lại **Prompt #4**.

---

## Reset cuối buổi demo

1. **Tham số**:
   - `temperature = 0.3`, `topP = 0.9`, `topK = 40`, `maxTokens = 1024`, `presencePenalty = 0`.
2. **Prompt no-RAG** (`code=no-rag`): Prompt #1.
3. **Prompt RAG** (`code=rag`): Prompt #4.
4. Clear lịch sử chat demo (nếu có nút xoá).

---

## Troubleshooting nhanh khi demo fail

| Triệu chứng                               | Nguyên nhân có thể                                   | Xử lý nhanh                                                           |
| ----------------------------------------- | ---------------------------------------------------- | --------------------------------------------------------------------- |
| Chat không stream, xoay vòng mãi          | LLM service down                                     | Check `/api/health`, restart model                                    |
| Bật RAG nhưng LLM vẫn không biết tài liệu | File chưa APPROVE / chưa index                       | Mở trang tài liệu verify, approve lại                                 |
| Đổi prompt xong không có tác dụng         | Prompt cache FE                                      | Hard reload `Ctrl+Shift+R`, gõ câu hỏi **mới** (tránh cache response) |
| Đổi temperature không thấy khác biệt      | Câu hỏi quá xác định → model luôn trả lời giống nhau | Dùng câu "sáng tạo": viết bài giới thiệu, viết thơ…                   |
| Citation không hiện                       | Retrieve trả rỗng / document-search lỗi              | Check Network tab, xem response `sources`                             |
