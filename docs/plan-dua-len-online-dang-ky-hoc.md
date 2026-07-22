# Plan đưa đăng ký học lên server online & vận hành thử (mục tiêu 500 SV)

**Phạm vi:** Cổng học viên online (`cong-hoc-vien` + `be-portal`) và luồng đồng bộ với QLĐT nội bộ.  
**Mục tiêu kỹ thuật đã có:** Transaction đăng ký dùng `FOR UPDATE` + unique constraint (xem `docs/bao-cao-giai-phap-transaction-dang-ky-hoc.md`).  
**Mục tiêu vận hành:** Mở đợt đăng ký thử → ổn định → sẵn sàng quy mô **~500 SV đăng ký online cùng khung giờ**.

---

## Tổng quan các giai đoạn

| Giai đoạn | Tên | Kết quả khi “xong” |
|-----------|-----|---------------------|
| **G0** | Chuẩn bị & gate | Checklist môi trường, backup, cửa sổ bảo trì đã thống nhất |
| **G1** | Đưa lên server online | FE + BE portal chạy ổn trên server online |
| **G2** | Đưa dữ liệu lên | Import đợt ĐK từ nội bộ thành công, SV thấy đúng lớp/môn |
| **G3** | Cấp tài khoản | SV (và cán bộ vận hành) đăng nhập được, đúng quyền |
| **G4** | Vận hành thử | Có biên bản thử: đăng ký / hủy / export về nội bộ |
| **G5** | Cải tiến chịu tải 500 SV | Có số liệu load test + cấu hình/ tối ưu đạt tiêu chí |

Có thể chạy **G1** trước; **G2–G3** thường đi cùng (import đã kéo theo UserProfile/Student). **G5** nên có baseline đo trong/sau **G4**.

---

## G0 — Chuẩn bị (trước khi đụng production online)

### Việc cần làm

- [ ] Chốt **server profile** deploy (`SERVER_PROFILE` / host SSH trong Makefile).
- [ ] Xác nhận stack online: Postgres, reverse proxy, HTTPS, DNS trỏ đúng `/cong-hoc-vien`.
- [ ] Backup DB portal (nếu đã có dữ liệu) trước mọi import/migrate lớn — tham chiếu quy trình backup hiện có.
- [ ] Chốt cửa sổ bảo trì + đầu mối: kỹ thuật, phòng Đào tạo, hỗ trợ SV.
- [ ] Verify bản code trên nhánh deploy đã gồm fix chịu tải (`FOR UPDATE`, unique `ClassRegisterLogs`, `DATABASE_POOL_SIZE`).
- [ ] Chuẩn bị 1 file JSON export đợt ĐK mẫu từ QLĐT nội bộ (`export-dot-dang-ky-*.json`, đúng version UI yêu cầu, hiện ghi v1.3.2 trên trang đồng bộ).
- [ ] Checklist rollback: image BE/FE cũ + backup DB + cách tắt `active` đợt đăng ký.

### Tiêu chí đạt

Mọi người liên quan biết: giờ go-live thử, ai trực, làm gì khi lỗi.

---

## G1 — Đưa lên server online

### Phạm vi triển khai tối thiểu (đăng ký học)

| Thành phần | Gói / service | Ghi chú |
|------------|---------------|---------|
| Backend | `be-portal` | API `class-register`, import/export đồng bộ |
| Frontend | `cong-hoc-vien` | `/dang-ky-hoc`, `/dong-bo-du-lieu` |
| DB | Postgres schema `ql-dao-tao` (portal) | Migration unique + index đã apply |
| Auth | Session/cookie theo stack hiện tại | Cùng nguồn tài khoản với import UserProfile |

### Việc cần làm

1. **Build & deploy BE**
   - Build image `be-portal` (Makefile: `make all-be-portal` hoặc `deploy-be-portal` / luồng `ship-be` tùy môi trường).
   - Deploy với override `local-deploy` + `pull_policy: never` (tránh GHCR đè image vừa load).
2. **Build & deploy FE**
   - Build `cong-hoc-vien`, `package-cdn` / `deploy-cdn` (hoặc `all-cong-hoc-vien`).
3. **Cấu hình môi trường trên server**
   - `DATABASE_URL` portal đúng instance online.
   - `DATABASE_POOL_SIZE` (khuyến nghị **40**; scale 2 instance → cân `POSTGRES_MAX_CONNECTIONS`).
   - Postgres: `POSTGRES_MAX_CONNECTIONS=300` (xem `deploy/mta-online/be/.env.example`).
   - Scale portal: `docker-compose.portal-scale.yml` + nginx upstream `:3044,:3046`.
   - Load test: `scripts/load-test/class-register/` (k6).
   - URL CORS / public API portal khớp domain FE.
   - IP allowlist middleware (`check-ip`) nếu đang bật — mở đúng dải mạng vận hành / SV.
4. **Migrate DB**
   - Chạy migration (đặc biệt `ClassRegisterLogs` unique + index).
   - Verify index tồn tại trên DB.
5. **Smoke test sau deploy**
   - Health container `mta-be-portal`.
   - Mở `/cong-hoc-vien/home`, login tài khoản kỹ thuật.
   - Gọi thử `get-class-register-session` (có thể rỗng trước khi import — vẫn phải 200/UI ổn).

### Lệnh tham chiếu (theo Makefile repo)

```bash
# Ví dụ — điều chỉnh SERVER_PROFILE / tên target theo máy thật
make all-be-portal
make all-cong-hoc-vien
# hoặc ship theo gói lớn hơn khi cần
```

### Tiêu chí đạt

- [ ] Portal FE/BE online HTTPS ổn định.
- [ ] Không còn pull nhầm image GHCR cũ sau deploy local.
- [ ] Log không spam lỗi kết nối DB; pool không cạn ngay khi vài user thử.

---

## G2 — Đưa dữ liệu lên

### Luồng nghiệp vụ chuẩn

```
[QLĐT nội bộ]
  xuất JSON đợt đăng ký (export-dot-dang-ky-*.json)
       │
       ▼  (USB / kênh chuyển file an toàn)
[Cổng online — /dong-bo-du-lieu → tab Nhập từ nội bộ]
  parse preview → startDataSync(IMPORT) → importFromInternal
       │
       ▼
[DB portal] Đợt + lớp HP + TKB + SV/hồ sơ + CTĐT/môn + danh mục
       │
       ▼  (sau khi SV đăng ký xong / đóng đợt)
[Cổng — tab Xuất về nội bộ] export JSON kết quả
       │
       ▼
[QLĐT nội bộ] import kết quả đăng ký
```

### Việc cần làm

1. **Trên QLĐT nội bộ**
   - [ ] Chốt đợt đăng ký online cần mở (học kỳ, khóa học, lớp HP, credit limit, ngày giờ).
   - [ ] Export file JSON đúng phiên bản.
   - [ ] Kiểm tra nhanh: sĩ số `maxStudent`, môn mở, ràng buộc tiên quyết dữ liệu đầy đủ.
2. **Trên cổng online — `/dong-bo-du-lieu`**
   - [ ] Đăng nhập tài khoản có quyền `DANG_KY_HOC_DONG_BO_DU_LIEU`.
   - [ ] Upload → xem preview (tên đợt, số lớp, số SV…).
   - [ ] Import; theo dõi `DataSyncHistory` (tab Lịch sử).
   - [ ] Invalidate/refresh — vào `/dang-ky-hoc` thấy đợt (nếu đang trong `startDate–endDate` và `active`).
3. **Đối soát sau import**
   - [ ] Số SV / số lớp HP khớp file export (sai lệch ghi biên bản).
   - [ ] Sampling 5–10 SV: đúng CTĐT, thấy đúng môn mở đăng ký.
   - [ ] `creditLimit` hiển thị đúng trên UI (nếu có cấu hình).

### Rủi ro & xử lý

| Rủi ro | Cách xử lý |
|--------|------------|
| Import trùng / import lại | Chốt quy tắc: 1 đợt = 1 lần import chính; re-import chỉ khi đã thống nhất xóa/reset |
| File sai version | Dừng lại, export lại từ nội bộ đúng version |
| Đợt không hiện | Check `active`, `startDate/endDate`, SV thuộc `trainingCourses` của đợt |
| Timeout file lớn | Import ngoài giờ cao điểm; tăng timeout proxy nếu cần |

### Tiêu chí đạt

- [ ] Đợt đăng ký hiện trên portal đúng thời gian thử.
- [ ] Lịch sử đồng bộ IMPORT = success.
- [ ] Biên bản đối soát số liệu có chữ ký / xác nhận bên nghiệp vụ.

---

## G3 — Cấp tài khoản

### Nguyên tắc với hệ thống hiện tại

- Dữ liệu **UserProfile / Student** thường **đi cùng JSON import** từ nội bộ (không cần tạo tay từng SV nếu file đủ).
- Việc “cấp tài khoản” = đảm bảo SV **đăng nhập được** + có **permission** nhóm học viên (menu Đăng ký học), và cán bộ vận hành có quyền đồng bộ.

### Việc cần làm

1. **Đối soát tài khoản SV sau import**
   - [ ] Mapping mã SV ↔ user login (username / email / mã định danh đang dùng).
   - [ ] Sampling đăng nhập 10–20 tài khoản (mỗi lớp/khóa một vài).
   - [ ] SV thấy đúng menu: Hồ sơ, Đăng ký học (không thấy Đồng bộ nếu không phải role vận hành).
2. **Tài khoản vận hành**
   - [ ] Cấp / kiểm tra quyền `DANG_KY_HOC_DONG_BO_DU_LIEU` cho cán bộ kỹ thuật + Đào tạo.
   - [ ] Tài khoản giám sát (read-only / hỗ trợ) nếu cần.
3. **Chính sách mật khẩu / phát hành**
   - [ ] Chốt cách phát TK: mật khẩu tạm + bắt đổi lần đầu **hoặc** SSO (nếu môi trường online đã gắn).
   - [ ] Kênh gửi TK an toàn (không gửi hàng loạt public chat).
   - [ ] Quy trình khóa TK / reset mật khẩu khi SV báo mất.
4. **Truyền thông trước giờ mở**
   - [ ] Hướng dẫn đăng nhập + link cổng + giờ mở/đóng đợt.
   - [ ] FAQ ngắn: lớp đầy, vượt tín chỉ, tiên quyết, không hủy khi đã có điểm.

### Tiêu chí đạt

- [ ] ≥ 95% tài khoản mẫu đăng nhập OK trong đợt kiểm thử nội bộ.
- [ ] 0 trường hợp SV thấy sai đợt / sai CTĐT trong sample (hoặc đã ghi bug và fix trước G4).

---

## G4 — Vận hành thử

### Mục tiêu

Chạy một đợt “thử” (có thể giới hạn số SV / khung giờ ngắn) để kiểm chứng end-to-end trước khi mở rộng 500 SV.

### Kịch bản thử đề xuất

| # | Kịch bản | Ai | Pass khi |
|---|----------|-----|----------|
| 1 | Login → vào `/dang-ky-hoc` thấy đợt | SV | UI đúng hạn đăng ký |
| 2 | Đăng ký 1 lớp còn chỗ | SV | Toast OK, hiện trên TKB |
| 3 | Đăng ký lớp đã đủ sĩ số | SV | Báo đủ sĩ số, không vào lớp |
| 4 | Đăng ký vượt trần TC / thiếu tiên quyết | SV | BE trả lỗi đúng message |
| 5 | Hủy đăng ký lớp vừa ĐK | SV | Hủy OK, TKB cập nhật |
| 6 | 2 SV tranh 1 chỗ cuối (thử tay hoặc script) | KT | Chỉ 1 người thắng |
| 7 | Export kết quả về nội bộ | CB | JSON tải được; import QLĐT OK |
| 8 | Đóng đợt (`active=false` hoặc hết `endDate`) | CB | Không ĐK/hủy được |

### Tổ chức vận hành thử

- [ ] Chọn nhóm pilot: **30–50 SV** (hoặc 1–2 lớp) trước; tăng dần.
- [ ] Phân ca trực: kỹ thuật (log/DB/container) + nghiệp vụ (hỗ trợ quy định).
- [ ] Kênh hỗ trợ (hotline / Zalo / ticket) + mẫu câu trả lời.
- [ ] Dashboard theo dõi (tối thiểu): CPU/RAM container `be-portal`, connection DB, error rate 4xx/5xx, thời gian p95 API `class-register`.
- [ ] Sau thử: họp rút kinh nghiệm ≤ 24h, list bug P0/P1.

### Tiêu chí đạt để chuyển G5 / mở rộng

- [ ] Không overbook lớp trong thử nghiệm.
- [ ] Không mất dữ liệu đăng ký; export–import khép vòng được.
- [ ] P0 = 0; P1 có phương án trước khi mở 500.

---

## G5 — Cải tiến đáp ứng quy mô ~500 SV đăng ký online

### Giả định làm việc

- **500 SV** không nhất thiết = 500 request/giây; thường là 500 user trong cùng cửa sổ (vd 10–30 phút), có burst đầu giờ.
- Bottleneck chính đã biết: **DB transaction + `FOR UPDATE` theo từng SubjectClass** (đúng sĩ số nhưng xếp hàng ở lớp “hot”).
- Mục tiêu chất lượng gợi ý (chỉnh theo SLA thật của nhà trường):

| Chỉ tiêu | Mục tiêu đề xuất |
|----------|------------------|
| Tỷ lệ đăng ký thành công (request hợp lệ) | ≥ 99% không lỗi 5xx |
| p95 `POST class-register` | ≤ 2–3s khi tải cao |
| Overbook sĩ số | **= 0** |
| Lỗi timeout / pool exhausted | ≈ 0 trong kịch bản 500 |

### 5.1. Đobaseline (bắt buộc trước khi tối ưu thêm)

- [ ] Load test kịch bản:
  - Ramp 0 → 100 → 300 → **500** VUs trong X phút.
  - Mix: 70% đăng ký lớp còn chỗ, 20% get-classes-info, 10% hủy / trùng / lớp đầy.
  - Tập trung vài lớp “hot” + trải đều nhiều lớp.
- [ ] Ghi: RPS, p50/p95/p99, error rate, DB connections, lock wait, deadlocks.
- [ ] Tool gợi ý: k6 / Artillery / script nội bộ gọi API đã auth.

### 5.2. Tối ưu cấu hình (nhanh, ít đụng code)

| Hạng mục | Hành động | Ghi chú |
|----------|-----------|---------|
| Pool Prisma | `DATABASE_POOL_SIZE` 30–50 (tinh theo max_connections Postgres) | Đã hỗ trợ trong `be-portal` |
| Postgres | `max_connections`, `shared_buffers`; theo dõi `pg_stat_activity` | Tránh pool app > DB |
| Container | CPU/RAM limit `mta-be-portal` đủ cho burst | Scale vertical trước |
| Proxy timeout | Tăng timeout body/API đăng ký nếu file/proxy cắt sớm | Chỉ phần cần |
| Index | Đã có index `ClassRegisterLogs(studentId/subjectClassId)` — verify trên prod | |

### 5.3. Tối ưu ứng dụng (theo mức ưu tiên)

**P0 — ổn định đúng nghiệp vụ (đã có / giữ vững)**

- Giữ `FOR UPDATE` + unique constraints.
- Không bỏ lock để “nhanh hơn” nếu làm overbook.

**P1 — giảm thời gian giữ lock**

- [ ] Chuyển tối đa validate “nặng” (tiên quyết, GPA credit) ra ngoài hoặc cache read-only trước khi vào đoạn lock.
- [ ] Trong TX chỉ còn: lock → count → insert score → insert log.
- [ ] Batch count / giảm round-trip trong loop nếu đăng ký nhiều lớp một request.

**P2 — giảm hot-spot & trải tải**

- [ ] Nghiệp vụ: mở nhiều lớp song song, hạn chế 1 lớp quá “hot” nếu có thể.
- [ ] Truyền thông: mở đăng ký lệch khung giờ theo khối/lớp (giảm 500 đồng loạt).
- [ ] FE: disable nút khi pending (đã có) + tránh spam click; có thể thêm cooldown ngắn.

**P3 — scale ngang (khi vertical không đủ)**

- [ ] Chạy ≥ 2 instance `be-portal` sau reverse proxy (sticky session nếu auth cookie cần).
- [ ] DB vẫn là điểm hội tụ lock — scale app giúp CPU, không thay thế lock sĩ số.
- [ ] Cân nhắc connection pooler (PgBouncer) nếu số instance tăng.

**P4 — quan sát & vận hành**

- [ ] Alert: error rate `class-register`, số connection DB, container restart.
- [ ] Log structured: `sessionId`, `subjectClassId`, latency, lỗi nghiệp vụ vs hệ thống.
- [ ] Runbook: tắt đợt (`active=false`), thông báo SV, rollback release.

### 5.4. Kế hoạch cải tiến theo tuần (gợi ý)

| Tuần | Việc | Output |
|------|------|--------|
| T1 | Deploy online + import pilot + account sample | G1–G3 xong |
| T2 | Vận hành thử 30–50 SV + sửa P0/P1 | Biên bản G4 |
| T2–T3 | Load test 100 → 300 → 500 + chỉnh pool/DB | Báo cáo số liệu |
| T3 | Tối ưu giữ lock ngắn + truyền thông lệch sóng | p95 đạt mục tiêu |
| T4 | Dress rehearsal gần giờ thật + checklist go-live | Quyết định mở rộng |

### Tiêu chí đạt G5

- [ ] Load test 500 VU (kịch bản thống nhất) đạt chỉ tiêu bảng trên.
- [ ] Overbook = 0 trong test và trong thử thật.
- [ ] Có runbook + người trực cho ngày mở đăng ký chính thức.

---

## Checklist go-live ngày mở đăng ký (rút gọn)

**T-1 ngày**

- [ ] Backup DB; verify disk; verify image đang chạy đúng bản.
- [ ] Import / đối soát dữ liệu lần cuối (freeze thay đổi lớp HP trừ P0).
- [ ] Thông báo link + giờ mở + kênh hỗ trợ.

**T-0 (trước giờ mở 30–60’)**

- [ ] `active=true`, cửa sổ thời gian đúng.
- [ ] Smoke: login + get session + đăng ký 1 tài khoản test (rollback/hủy sau).
- [ ] Giám sát log/metrics bật.

**Trong giờ đăng ký**

- [ ] Theo dõi error 5xx, pool, lớp hot.
- [ ] Không deploy nóng trừ hotfix P0 đã duyệt.

**Sau đóng đợt**

- [ ] Export JSON về nội bộ; import QLĐT; đối soát số liệu.
- [ ] Họp postmortem ngắn: số ĐK, lỗi thường gặp, việc cải tiến tiếp.

---

## Phân công gợi ý (điền tên thật khi vận hành)

| Vai trò | Trách nhiệm |
|---------|-------------|
| Kỹ thuật / DevOps | Deploy, migrate, backup, monitor, load test |
| Backend | Transaction, pool, hotfix API đăng ký |
| Đào tạo / nghiệp vụ | Chốt đợt, file export, quy định ĐK, truyền thông SV |
| Hỗ trợ SV | Reset TK, FAQ, tiếp nhận lỗi UI |
| QA | Chạy checklist G4, xác nhận tiêu chí pass |

---

## Tài liệu liên quan trong repo

- `docs/bao-cao-giai-phap-transaction-dang-ky-hoc.md` — giải pháp Transaction cũ vs mới  
- Trang đồng bộ: `apps/client/cong-hoc-vien/src/pages/dong-bo-du-lieu/index.tsx`  
- API đăng ký: `apps/backend/be-portal/src/api/class-register.ts`  
- Deploy: `Makefile` (`deploy-*`, `local-deploy`, `DATABASE_POOL_SIZE` trong `be-portal`)

---

## Phụ lục — Định nghĩa “xong” toàn plan

Plan được coi là hoàn thành khi:

1. Cổng online chạy ổn định với bản có lock sĩ số.  
2. Có quy trình khép kín: **nội bộ → import → SV ĐK → export → nội bộ**.  
3. Tài khoản pilot + quy trình cấp/reset rõ ràng.  
4. Có biên bản vận hành thử.  
5. Có kết quả load test / cấu hình chứng minh chịu được kịch bản **~500 SV** theo SLA đã chốt với nhà trường.
