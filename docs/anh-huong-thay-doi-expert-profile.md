# Ảnh hưởng thay đổi `ExpertProfile` — phân tích & checklist triển khai từng phần

**Phạm vi:** Model chuyên gia (`packages/database/models/ql-dao-tao/thesis.zmodel`) và toàn bộ FE/BE đang join / CRUD / in mẫu dựa trên hồ sơ chuyên gia.  
**Bối cảnh vấn đề:** Hồ sơ chuyên gia đang là **master sống (mutable)**. Sửa học hàm/học vị hoặc trạng thái trong/ngoài học viện làm **méo toàn bộ lịch sử** (in lại mẫu đợt cũ, thanh toán, hiển thị hội đồng…).  
**Mục tiêu tài liệu:** Ghi mức độ ảnh hưởng theo module/màn hình để triển khai **từng phần một**.

---

## Quyết định đã chốt

| Mục | Quyết định |
| --- | --- |
| Hướng | **Chỉ** `Expert` (identity) + `ExpertProfileVersion` (hồ sơ theo thời điểm) |
| Không làm | Tách `ThesisExpertProfile` / `ProjectExpertProfile` |
| Soft-split module | Flag `thesisExpert` / `projectExpert` nằm trên **`ExpertProfileVersion`** (danh mục UI filter theo `currentVersion`) |
| FK nghiệp vụ | Trỏ **`ExpertProfileVersion`** (không trỏ identity khi cần lịch sử in/thanh toán) |
| Research / Internship / SubjectClass | Cùng identity `Expert`; quan hệ gán HD/HĐ lưu `versionId` |

Ngày chốt: **2026-09-14**.

---

## 1. Vấn đề nghiệp vụ

| Tình huống | Kỳ vọng | Hiện tại |
| --- | --- | --- |
| Đợt 1: chuyên gia là Thạc sĩ → đợt 2 lên Tiến sĩ | In mẫu đợt 1 vẫn Thạc sĩ | In đợt 1 cũng thành Tiến sĩ |
| Đợt 1: trong học viện → đợt 2 ngoài học viện | Đợt 1 vẫn “trong HV” (kể cả định mức thanh toán) | Đợt 1 bị đổi thành ngoài HV |

**Nguyên nhân kỹ thuật:**

- `ThesisProject.supervisorId / coSupervisorId / thirdSupervisorId` → `ExpertProfile` (live)
- `CouncilMember.expertId` → `ExpertProfile` (live)
- In mẫu / Excel / thanh toán suy `inAcademy` từ `!!lecturerId` **tại thời điểm đọc**

---

## 2. Model hiện tại (tóm tắt)

```text
ExpertProfile (1 bảng = identity + hồ sơ sống)
  ├── flag: thesisExpert / projectExpert
  ├── ThesisProject (HD chính / phụ / thứ 3)
  ├── CouncilMember
  ├── StudentResearchTopic / StudentInternship
  ├── SubjectClass[] (M:N) — pool lớp đồ án (ít dùng ghi)
  ├── TrainingMajor[] (M:N)
  └── Lecturer?
```

---

## 3. Model đích: `Expert` + `ExpertProfileVersion`

```text
Expert                              ← identity ổn định (người là ai)
  ├── lecturerId?                   ← null = chuyên gia ngoài (ở tầng identity)
  ├── currentVersionId → ExpertProfileVersion
  ├── major[] / subjectClass[]      ← quan hệ gắn theo người
  └── versions[]

ExpertProfileVersion                ← hồ sơ tại một thời điểm (mọi field giấy tờ / vai trò)
  ├── expertId
  ├── name, academicDegree/Rank, organization, position,
  │   specialization, workplace
  ├── inAcademy (Boolean, lưu tường minh)
  ├── phone, email, bankAccountNumber, bankName
  ├── thesisExpert / projectExpert
  ├── eligiblePresident / eligibleSecretary
  ├── validFrom / validTo (null = đang hiệu lực)
  └── được FK từ: ThesisProject HD, CouncilMember,
      ResearchTopic, Internship, …
```

### 3.1. Phân field

| Thuộc `Expert` (identity) | Thuộc `ExpertProfileVersion` |
| --- | --- |
| `lecturerId` | `name` |
| `currentVersionId` | `academicDegreeTypeId`, `academicRankTypeId` |
| `major` (TrainingMajor M:N) | `organization`, `position`, `specialization`, `workplace` |
| `subjectClass` M:N (pool theo người) | **`inAcademy`** (bắt buộc lưu, không suy từ lecturer) |
| | `phone`, `email`, `bankAccountNumber`, `bankName` |
| | `thesisExpert`, `projectExpert` |
| | `eligiblePresident`, `eligibleSecretary` |
| | `validFrom`, `validTo` |

> Đổi cờ LV/ĐA, đủ điều kiện chủ tịch/thư ký, SĐT/email/TKNH cũng tạo **version mới** (không update in-place), vì có thể ảnh hưởng mẫu in / thanh toán / xếp HĐ theo đợt.

### 3.2. Remap FK nghiệp vụ

| Hiện tại | Đích |
| --- | --- |
| `ThesisProject.supervisorId` → ExpertProfile | `supervisorVersionId` → ExpertProfileVersion |
| `coSupervisorId`, `thirdSupervisorId` | `*VersionId` tương tự |
| `CouncilMember.expertId` | `expertProfileVersionId` (+ optional `expertId` denorm để filter) |
| Research topic / Internship supervisors | `*VersionId` |
| Danh mục UI / select list | Query `Expert` + `include: { currentVersion }`; filter flag trên **currentVersion** |
| In mẫu / thanh toán | **Chỉ** đọc version đã gán trên quan hệ |

### 3.3. Quy tắc nghiệp vụ

1. **Sửa bất kỳ field trên version** (học vị, trong↔ngoài HV, đơn vị, tên, phone/email/bank, cờ LV/ĐA, eligible CT/TK)  
   → đóng version cũ (`validTo = now`) → tạo version mới → cập nhật `Expert.currentVersionId`.  
   **Không** update in-place version đã được gán vào đợt/hội đồng.
2. **Gán HD / hội đồng**  
   → lưu `currentVersionId` (hoặc version user chọn) tại thời điểm gán.
3. **Đổi thành viên hội đồng**  
   → gắn version (thường current) của người mới; không sửa version người cũ.
4. **UI danh mục**  
   → vẫn 2 trang luận văn / đồ án; filter `currentVersion.thesisExpert` / `currentVersion.projectExpert`.

### 3.4. Migrate dữ liệu (một lần)

1. Mỗi `ExpertProfile` cũ → 1 `Expert` (giữ **cùng `id`** nếu được, giảm remap) + 1 `ExpertProfileVersion`.  
2. Version đầu: copy toàn bộ field hồ sơ + cờ + phone/email/bank; `inAcademy = !!lecturerId`; `validFrom = createdAt` (hoặc now); `validTo = null`.  
3. `Expert.currentVersionId` = version vừa tạo; `Expert.lecturerId` giữ từ bản cũ.  
4. Remap mọi FK nghiệp vụ cũ → `versionId` tương ứng.  
5. Đổi tên / drop model `ExpertProfile` cũ sau khi FE/BE chuyển xong.  
6. **Lịch sử đã méo trước migrate** không khôi phục được — chỉ chặn sai từ sau migrate.

---

## 4. Ma trận ảnh hưởng FE

Mức độ:

- **P0** — Phải đổi khi đổi schema/FK (CRUD hoặc gán)
- **P1** — In / thanh toán / hiển thị lịch sử
- **P2** — Đọc phụ / portal
- **P3** — Quan hệ ít dùng ghi

### 4.1. CRUD danh mục — P0

| # | Route / UI | File | Việc |
| --- | --- | --- | --- |
| 1 | `/quan-ly-luan-van/danh-sach-chuyen-gia` | `danh-sach-chuyen-gia` (LV) | CRUD `Expert` + current version; filter `currentVersion.thesisExpert` |
| 2 | `/quan-ly-do-an/danh-sach-chuyen-gia` | `danh-sach-chuyen-gia` (ĐA) | Như trên; filter `currentVersion.projectExpert` |
| 3 | Modal chuyên gia | `put-chuyen-gia.tsx` | Create Expert + version 1; mọi sửa field version = **tạo version mới** |

### 4.2. Gán HD / hội đồng — P0

| # | Route / UI | File | Việc |
| --- | --- | --- | --- |
| 4 | `/quan-ly-luan-van/dm-luan-van` | `dm-luan-van` | Select Expert; lưu `*VersionId` |
| 5 | Cấu hình HĐ đợt LV | `cau-hinh-hoi-dong/[id]` | Member → version |
| 6 | Modal cấu hình LV | `modal-cau-hinh-luan-van.tsx` | Như trên |
| 7 | Modal thành viên HĐ | `put-thanh-vien-hoi-dong.tsx` | FK version |
| 8 | `/quan-ly-do-an/dm-do-an` | `dm-do-an` | Như luận văn |
| 9 | Cấu hình HĐ đồ án | `cau-hinh-hoi-dong` | + `SubjectClass.experts` nếu giữ |
| 10 | Modal đồ án | `put-do-an.tsx` | Lưu version |
| 11 | Chuyên đề NC | page + `put-chuyen-de-nghien-cuu` | Remap version |
| 12 | Thực tập | page + `put-thuc-tap` | Remap version |

### 4.3. In / thanh toán — P1 (đóng bug)

| # | UI / util | Việc |
| --- | --- | --- |
| 13 | `thesis-excel.ts`, `thesis-profile.ts` | Đọc version đã gán; `inAcademy` từ version |
| 14 | `thesis-supervisor-payment-export.ts` | Như trên |
| 15 | `modal-print-quyet-dinh-hoi-dong.tsx` | Include version |
| 16–19 | Pages thanh toán HĐ / GVHD (LV + ĐA) | Join version |
| 20 | `put-thanh-toan*.tsx` | Lookup Expert / version |

### 4.4. P2 / P3 / Backend

| # | Chỗ | Việc |
| --- | --- | --- |
| 21–23 | Modal chi tiết GV (ql-dao-tao, cong-HV, cong-SV) | `lecturer.experts` + current version |
| 24 | tro-ly-ao types | Generate lại |
| 25–26 | `thesis-council-import/export` (be-model) | Map version khi import; export theo version đã gán |
| P3 | `SubjectClass` M:N | Giữ trên `Expert`; reconnect join table |

---

## 5. Checklist triển khai từng phần

### Phần 0 — Quyết định

- [x] Hướng: **Expert + ExpertProfileVersion only**
- [x] Không tách bảng luận văn / đồ án
- [x] `phone` / `email` / `bank*` / cờ LV-ĐA / eligible CT-TK → **`ExpertProfileVersion`**
- [ ] Chi tiết: giữ nguyên `id` Expert = id ExpertProfile cũ khi migrate? (khuyến nghị: **có**)
- [ ] SubjectClass M:N: **giữ trên Expert** (đề xuất)

### Phần 1 — Schema + migrate

- [x] Thêm `Expert`, `ExpertProfileVersion` trong `thesis.zmodel`
- [x] Đổi FK `ThesisProject`, `CouncilMember`, research, internship → version
- [x] Remap `Lecturer`, `TrainingMajor`, `SubjectClass`, `DM_HocHam`/`DM_HocVi`
- [x] Script migrate dữ liệu + backfill version đầu (`prisma/migrations/20260914040000_expert_profile_version`)
- [x] `zenstack generate` / hooks (`expert.ts`, `expert-profile-version.ts`)

> **Đã apply** lên DB `mta_in` (2026-09-14). Phần 2–4 FE/BE gán LV/ĐA đã chuyển sang `Expert` / version.

### Phần 2 — CRUD danh mục (P0)

- [x] Hooks/pages luận văn + đồ án dùng `Expert`
- [x] `put-chuyen-gia`: tạo version mới khi đổi field giấy tờ
- [x] Cảnh báo UI: đợt đã gán không đổi

### Phần 3 — Gán luận văn (P0)

- [x] `dm-luan-van`, cấu hình HĐ, modal HĐ
- [x] Import/export council backend

### Phần 4 — Gán đồ án (P0)

- [x] `dm-do-an`, cấu hình HĐ, `put-do-an`

### Phần 5 — Chuyên đề NC + Thực tập (P0)

- [ ] Remap FK + modal/page

### Phần 6 — In mẫu + thanh toán (P1)

- [ ] Utils + pages đọc version
- [ ] Bỏ `inAcademy = !!lecturerId` live

### Phần 7 — Portal (P2)

- [ ] Modal chi tiết GV

### Phần 8 — Dọn dẹp

- [ ] Drop `ExpertProfile` cũ / đổi tên xong
- [ ] Regression: đổi current → in lại đợt cũ vẫn đúng

---

## 6. Tiêu chí chấp nhận

1. Sau khi đổi học vị / trong↔ngoài HV / bank / cờ eligible trên hồ sơ current, **in lại đợt/hội đồng đã gán** vẫn giữ version cũ.  
2. Định mức thanh toán dùng `inAcademy` trên **version đã gán**.  
3. Danh mục LV/ĐA filter bằng flag trên **`currentVersion`**; một người có thể vừa LV vừa ĐA tùy version hiện tại.  
4. Select list luôn ưu tiên hiển thị `currentVersion`; quan hệ nghiệp vụ không tự nhảy theo current.

---

## 7. Tham chiếu code

| Chủ đề | Path |
| --- | --- |
| Model | `packages/database/models/ql-dao-tao/thesis.zmodel` |
| Migrate | `packages/database/prisma/migrations/20260914040000_expert_profile_version/` |
| SubjectClass pool | `plan-training.zmodel` (`SubjectClass.expert` → `Expert[]`) |
| FE helper select | `apps/client/ql-dao-tao/src/utils/expert-select.ts` |
| BE resolve version | `apps/backend/be-model/src/services/expert-version.ts` |
| Format / PersonLike | `apps/client/ql-dao-tao/src/utils/thesis-profile.ts` |
| Modal CRUD | `apps/client/ql-dao-tao/src/components/modal/put-chuyen-gia.tsx` |
| Import/export HĐ LV | `apps/backend/be-model/src/services/thesis-council-*.service.ts` + `thesis-batch-update.service.ts` |
| In / Excel | `apps/client/ql-dao-tao/src/utils/thesis-excel.ts` *(Phần 6)* |

---

## 8. Nhật ký quyết định & triển khai

### 8.1. Quyết định thiết kế

| Ngày | Quyết định | Chi tiết |
| --- | --- | --- |
| 2026-09-14 | Chỉ **Expert + ExpertProfileVersion** | Không tách bảng ThesisExpert / ProjectExpert |
| 2026-09-14 | FK nghiệp vụ → **versionId** | Đóng bug lịch sử in/thanh toán khi sửa hồ sơ |
| 2026-09-14 | Cờ LV/ĐA, eligible CT-TK, phone/email/bank* → **Version** | `Expert` chỉ còn identity + `lecturerId` + quan hệ M:N |
| (chưa) | SubjectClass M:N | Giữ trên `Expert` (`_ExpertToSubjectClass`) |

### 8.2. Quy tắc FE/BE đã áp dụng (Phần 2+)

1. **Select UI** luôn dùng `Expert.id` (catalog = `Expert` + `include.currentVersion`).
2. **Lưu gán HD / HĐ** resolve `Expert.id` → `currentVersionId` tại thời điểm save; ghi `*VersionId` / `expertProfileVersionId` (+ denorm `expertId` trên `CouncilMember`).
3. **Hiển thị đã gán** đọc snapshot (`supervisor` / `expertProfileVersion`), **không** nhảy theo `currentVersion`.
4. **Hydrate form** từ `version.expertId` / `member.expertId`, không dùng `version.id` làm value select.
5. Helper: FE `flattenExpertForSelect` / `versionToPersonLike`; BE `resolveCurrentVersionIds`.

### 8.3. Phần 1 — Schema + migrate (`mta_in`, 2026-09-14)

**Đã làm gì**

- Thêm model `Expert`, `ExpertProfileVersion` trong `thesis.zmodel`; remap quan hệ Lecturer / TrainingMajor / SubjectClass / học hàm–học vị.
- Đổi FK: `ThesisProject.supervisorVersionId` / `coSupervisorVersionId` / `thirdSupervisorVersionId`; `CouncilMember.expertProfileVersionId` (+ `expertId`); research / internship tương tự.
- Migration `20260914040000_expert_profile_version`: rename `ExpertProfile` → `Expert`; mỗi expert 1 version đầu (`id = v_` + expertId); backfill FK; `inAcademy = !!lecturerId`.
- `zenstack generate` → hooks `expert.ts`, `expert-profile-version.ts` (bỏ hook `expert-profile`).

**Kết quả:** ~1763 expert/version trên `mta_in`; bảng cũ không còn.

### 8.4. Phần 2 — CRUD danh mục (2026-09-14)

**Đã làm gì**

| File / màn | Thay đổi |
| --- | --- |
| `quan-ly-luan-van/danh-sach-chuyen-gia` | `useFindManyExpert`; filter `currentVersion.thesisExpert`; cột/sort/search trên `currentVersion` + lecturer |
| `quan-ly-do-an/danh-sach-chuyen-gia` | Như trên với `currentVersion.projectExpert` |
| `put-chuyen-gia.tsx` | **Tạo mới:** `Expert` + version 1 + gắn `currentVersionId`. **Sửa:** đóng version cũ (`validTo = now`) → tạo version mới → cập nhật `Expert.currentVersionId` / `lecturerId`. Không update in-place field giấy tờ. Alert: đợt/HĐ đã gán giữ version cũ |

**Cách hoạt động:** danh mục chỉ hiện hồ sơ **current**; lịch sử gán không bị sửa khi CRUD.

### 8.5. Phần 3 — Gán luận văn (2026-09-14)

**Đã làm gì**

| File | Thay đổi |
| --- | --- |
| `dm-luan-van/index.tsx` | Catalog `useFindManyExpert` + `thesisExpert`; include `supervisor`/`coSupervisor`/`expertProfileVersion` (version + `expert.lecturer`); hydrate/peer-exclude bằng `expertId`; batch payload vẫn gửi `supervisorId` = Expert.id |
| `cau-hinh-hoi-dong/[id].tsx` (LV) | Flatten expert; tạo HĐ ghi `expertId` + `expertProfileVersionId`; loại GVHD qua `supervisor.expertId` |
| `modal-cau-hinh-luan-van.tsx` | Save member/HD → version map; hydrate `expertId`; `inAcademy` từ `currentVersion` |
| `put-thanh-vien-hoi-dong.tsx` | Select Expert; save `expertId` + `expertProfileVersionId` |
| `thesis-batch-update.service.ts` | `resolveCurrentVersionIds`; update `supervisorVersionId`/`coSupervisorVersionId`; `councilMember` kèm version |
| `thesis-council-import.service.ts` | Label map = Expert.id; trước TX resolve version; ghi version FK |
| `thesis-council-export.service.ts` | Catalog từ Expert+currentVersion; cột data lookup `supervisor.expertId` |
| `thesis-profile.ts` | `formatPersonName` / council format ưu tiên `expertProfileVersion` |

**Cách hoạt động:** FE chọn Expert → BE/FE resolve current version lúc lưu → in lại đợt cũ vẫn đọc version đã gắn trên quan hệ.

### 8.6. Phần 4 — Gán đồ án (2026-09-14)

**Đã làm gì**

| File | Thay đổi |
| --- | --- |
| `put-do-an.tsx` | Catalog `projectExpert`; form giữ `supervisorId`/`coSupervisorId` = Expert.id; payload `supervisorVersionId`/`coSupervisorVersionId`; hydrate từ `supervisor.expertId` |
| `dm-do-an/index.tsx` | **GVHD1–2 vẫn `Lecturer`** (`primarySupervisor`/`secondarySupervisor`). **GVHD3** = Expert → connect `thirdSupervisor` bằng version id. Hội đồng upsert `expertId` + `expertProfileVersionId`. Include/display HD3 qua `thirdSupervisor.expert.lecturer` |
| `danh-muc-do-an/cau-hinh-hoi-dong` | `useFindManyExpert` + `projectExpert`; `SubjectClass.expert` (không còn `expertProfile`); tạo HĐ bắt buộc có `expertProfileVersionId` |
| `danh-muc-do-an/index.tsx` | Không đổi logic — đã filter/hiển thị `supervisor.name` trên version |

**Cách hoạt động:** giống Phần 3; flag catalog = `projectExpert`; riêng ĐA vẫn tách GV trong HV (Lecturer) vs chuyên gia ngoài/thứ 3 (Expert version).

### 8.7. Chưa làm

| Phần | Nội dung |
| --- | --- |
| 5 | Chuyên đề NC + Thực tập (modal/page + FK version trên FE) |
| 6 | In mẫu / Excel / thanh toán — bỏ suy `inAcademy = !!lecturerId` live |
| 7 | Portal modal chi tiết GV |
| 8 | Dọn hook/tên cũ + regression đổi current vẫn in đúng đợt cũ |
| — | SubjectClass M:N: giữ trên Expert (chốt khi đụng pool lớp) |

---

*Tài liệu living: tick checklist khi triển khai từng phần; cập nhật mục 8 khi xong một phần.*
