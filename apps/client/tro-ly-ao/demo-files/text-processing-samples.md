# Văn bản mẫu cho Module Xử lý văn bản

Bộ 4 mẫu copy-paste sẵn cho trang `/xu-ly-van-ban`. Mỗi mẫu kèm kết quả kỳ vọng để đối chiếu.

---

## Mẫu EN-1 — Dịch Anh → Việt (~180 từ)

**Mode UI**: *Dịch văn bản*

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

**Kỳ vọng**: bản dịch tiếng Việt tự nhiên, giữ các thuật ngữ chuyên môn (RAG, LLM, prompt), độ dài tương đương.

---

## Mẫu ZH-1 — Dịch Trung → Việt (~100 từ)

**Mode UI**: *Dịch văn bản*

```
人工智能正在深刻改变高等教育。大学正在部署智能虚拟助手，
回答学生关于招生、课程、考试规则和行政程序的问题。这些系统将大型语言模型
与检索增强生成相结合，使回答基于官方机构文件，从而减少错误信息。
除了问答之外，现代学术平台还提供翻译、语法纠正、摘要和语义搜索功能。
```

**Kỳ vọng**: dịch đúng ý, tiếng Việt mạch lạc — chứng minh khả năng **đa ngôn ngữ**.

---

## Mẫu ERR-1 — Sửa lỗi chính tả

**Mode UI**: *Sửa lỗi chính tả*

```
Sinh viên có nhu câù đăng kí học laị liên hệ phòng đào taọ để được hưỡng dẫn.
Thời gian nộp hồ sơ trong vòng 7 nghàytừ khi có thông báo. Sinh vien cần chuẩn
bị đầy đủ giấy tờ bao gồm đơn xinhọc lại, bản sao bảng điễm và giấy tờ tuỳ thân.
Sau khi nộp hồ sơ, sinh viên chờ kết quả xét duyệt trong vòng 3 ngay làm việc.
```

**Lỗi cố ý**: "câù", "kí", "laị", "taọ", "hưỡng", "nghàytừ", "vien" (thiếu dấu), "xinhọc" (dính), "điễm", "tuỳ", "ngay".

**Kỳ vọng**: văn bản trả về đã sửa hết lỗi, giữ nguyên ý.

---

## Mẫu DOC-1 — Tóm tắt (dùng chung cho cả Tóm lược và Trích lược)

**Mode UI**: *Tóm lược* (= extractive) và *Trích lược* (= abstractive) — chạy lần lượt cùng input để so sánh.

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

### Kỳ vọng khi chạy **Tóm lược (extractive)**

- Kết quả là **vài câu được trích nguyên văn** từ bài gốc.
- Ví dụ: *"Các trường đại học trên thế giới đang triển khai các hệ thống trợ lý ảo thông minh... Những hệ thống này thường kết hợp LLM với kỹ thuật RAG... Cơ chế tiếp nhận phản hồi từ người dùng là yếu tố then chốt giúp liên tục cải thiện chất lượng."*
- **Không tạo câu mới**, không paraphrase.

### Kỳ vọng khi chạy **Trích lược (abstractive)**

- Kết quả là **đoạn văn mới do LLM viết lại**, không copy câu từ bài gốc.
- Ví dụ: *"Bài viết giới thiệu việc ứng dụng AI vào giáo dục đại học, tập trung vào trợ lý ảo kết hợp RAG để hỗ trợ sinh viên tra cứu. Các nền tảng cũng cung cấp nhiều chức năng như dịch thuật, tóm tắt, tìm kiếm ngữ nghĩa. Thành công của triển khai phụ thuộc vào thiết kế prompt, bảo mật dữ liệu và phản hồi người dùng."*
- Văn phong khác, câu từ khác nhưng **giữ được ý chính**.

---

## Mẫu ngắn bổ sung — ERR-2 (sửa lỗi đoạn email hành chính)

```
Kính gữi Thầy,
Em tên là Nguyễn Văn An, sinh viên lớp CNTT k25. Em víêt mail nay để hỏi về
qui trình đăng kí học vụ kỳ tới. Em mong Thầy phản hổi giúp em ạ.
Em xin tran tọng cảm ơn.
```

**Lỗi**: "gữi", "víêt", "nay", "qui", "kí", "phản hổi", "tran tọng".
**Kỳ vọng**: sửa đúng, format email giữ nguyên.

---

## Mẫu DOC-2 — Tóm tắt ngắn hơn cho demo nhanh (~150 từ)

```
Học viện tổ chức kỳ thi tuyển sinh hàng năm vào tháng 7. Thí sinh đăng ký
trực tuyến qua cổng thông tin từ tháng 3 và nộp hồ sơ bản cứng trước ngày 30/6.
Kỳ thi gồm ba môn: Toán, Vật lý hoặc Hóa học và một môn tự chọn. Điểm xét tuyển
được tính theo công thức điểm thi nhân hệ số cộng điểm ưu tiên khu vực và đối
tượng. Kết quả trúng tuyển công bố trước ngày 20/8 và thí sinh phải xác nhận
nhập học trong vòng 7 ngày. Sau khi xác nhận, tân sinh viên tham gia tuần
sinh hoạt công dân và hoàn thiện thủ tục nhập học tại Phòng Đào tạo.
```

**Dùng**: test nhanh khi thời gian demo hạn chế.

---

## Checklist khi demo Xử lý văn bản

- [ ] Clear output trước mỗi lần test.
- [ ] Chuyển mode xong mới paste (tránh nhầm).
- [ ] Với mẫu dịch: để ý giới hạn 2000 ký tự (EN-1 ~1100 ký tự, OK).
- [ ] Demo tóm tắt: chạy **cả 2 mode** trên **cùng input** để so sánh trực quan.
- [ ] Show button **Dừng lại** khi đang stream để demo khả năng abort.
