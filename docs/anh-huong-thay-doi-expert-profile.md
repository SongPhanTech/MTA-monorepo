# Ảnh hưởng thay đổi `ExpertProfile` — phân tích & checklist triển khai từng phần

**Phạm vi:** Model `ExpertProfile` (`packages/database/models/ql-dao-tao/thesis.zmodel`) và toàn bộ FE/BE đang join / CRUD / in mẫu dựa trên hồ sơ chuyên gia.  
**Bối cảnh vấn đề:** Hồ sơ chuyên gia đang là **master sống (mutable)**. Sửa học hàm/học vị hoặc trạng thái trong/ngoài học viện làm **méo toàn bộ lịch sử** (in lại mẫu đợt cũ, thanh toán, hiển thị hội đồng…).  
**Mục tiêu tài liệu:** Ghi mức độ ảnh hưởng theo module/màn hình để khi **chốt cách làm** (tách bảng module / versioning / snapshot) sẽ giải quyết **từng phần một**.

---

## 1. Vấn đề nghiệp vụ

| Tình huống | Kỳ vọng | Hiện tại |
| --- | --- | --- |
| Đợt 1: chuyên gia là Thạc sĩ → đợt 2 lên Tiến sĩ | In mẫu đợt 1 vẫn Thạc sĩ | In đợt 1 cũng thành Tiến sĩ |
| Đợt 1: trong học viện → đợt 2 ngoài học viện | Đợt 1 vẫn “trong HV” (kể cả định mức thanh toán) | Đợt 1 bị đổi thành ngoài HV |

**Nguyên nhân kỹ thuật:**

- `ThesisProject.supervisorId / coSupervisorId / thirdSupervisorId` → `ExpertProfile`
- `CouncilMember.expertId` → `ExpertProfile`
- In mẫu / Excel / thanh toán thường suy `inAcademy` từ `!!lecturerId` **tại thời điểm đọc**, không lưu theo đợt

---

## 2. Model & quan hệ hiện tại (tóm tắt)

```text
ExpertProfile (1 bảng dùng chung)
  ├── flag: thesisExpert / projectExpert          ← soft-split luận văn / đồ án
  ├── ThesisProject (HD chính / phụ / thứ 3)
  ├── CouncilMember (thành viên hội đồng)
  ├── StudentResearchTopic (HD chuyên đề NC)
  ├── StudentInternship (HD thực tập)
  ├── SubjectClass[]  (M:N)                       ← pool theo lớp đồ án (ít dùng ghi)
  ├── TrainingMajor[] (M:N)
  └── Lecturer? (optional — null = ngoài trường)
```

Bảng join DB: `ql-dao-tao._ExpertProfileToSubjectClass`.

**Ghi chú `SubjectClass.expertProfile`:** Comment schema = “DS chuyên gia → tạo hội đồng tự động”. FE cấu hình HĐ đồ án có `include`, nhưng list xếp HĐ thực tế lấy từ `council.members.expert`; **gần như chưa thấy luồng connect/disconnect pool**. Khi refactor có thể giữ (gắn đồ án) hoặc bỏ nếu không dùng.

---

## 3. Các hướng đang xem xét (chưa chốt)

| Hướng | Ý tưởng | Giải quyết gì | Không giải quyết gì |
| --- | --- | --- | --- |
| **A — Snapshot trên quan hệ** | Copy học vị / `inAcademy` vào `CouncilMember` / assignment HD | Lịch sử theo lần gán | Isolation luận văn ↔ đồ án |
| **B — Version / effective-dated** | `Expert` + `ExpertProfileVersion`; FK nghiệp vụ lưu `versionId` | Lịch sử đầy đủ, audit | Cần schema/UI nặng |
| **Tách 2 bảng module** | `ThesisExpertProfile` vs `ProjectExpertProfile` | Sửa đồ án không đụng luận văn | Lệch đợt 1/đợt 2 **trong cùng** module |
| **Kết hợp** (đang nghiêng) | Tách module trước → version/snapshot trong từng module | Cả isolation module + lịch sử | Effort lớn nhất |

> Tài liệu này **không chốt** hướng. Checklist phía dưới gắn theo **nhóm ảnh hưởng** để làm dần sau khi chốt.

---

## 4. Ma trận ảnh hưởng FE

Mức độ:

- **P0** — Phải đổi ngay khi đổi schema/FK (CRUD hoặc gán expert)
- **P1** — In / thanh toán / hiển thị lịch sử (sai nghiệp vụ nếu không snapshot/version)
- **P2** — Đọc phụ / portal / type generated
- **P3** — Quan hệ tồn tại nhưng ít/không dùng ghi

### 4.1. App `ql-dao-tao` — CRUD danh mục

| # | Route / UI | File chính | Mức | Việc khi refactor |
| --- | --- | --- | --- | --- |
| 1 | `/quan-ly-luan-van/danh-sach-chuyen-gia` | `pages/quan-ly-luan-van/danh-sach-chuyen-gia` | **P0** | CRUD thesis expert; bỏ filter `thesisExpert` nếu tách bảng |
| 2 | `/quan-ly-do-an/danh-sach-chuyen-gia` | `pages/quan-ly-do-an/danh-sach-chuyen-gia` | **P0** | CRUD project expert; bỏ filter `projectExpert` |
| 3 | Modal thêm/sửa chuyên gia | `components/modal/put-chuyen-gia.tsx` | **P0** | Tách modal hoặc `domain: thesis \| project`; nếu versioning: sửa = tạo version mới |

### 4.2. App `ql-dao-tao` — Gán HD / hội đồng

| # | Route / UI | File chính | Mức | Việc khi refactor |
| --- | --- | --- | --- | --- |
| 4 | `/quan-ly-luan-van/dm-luan-van` | `pages/quan-ly-luan-van/dm-luan-van` | **P0 + P1** | Select + lưu version/snapshot; format trong/ngoài HV |
| 5 | `/quan-ly-luan-van/.../cau-hinh-hoi-dong/[id]` | `ql-dot-xet-luan-van/cau-hinh-hoi-dong/[id]` | **P0** | Pool / tạo HĐ luận văn |
| 6 | Modal cấu hình luận văn | `modal-cau-hinh-luan-van.tsx` | **P0** | Select thành viên HĐ |
| 7 | Modal thành viên HĐ | `put-thanh-vien-hoi-dong.tsx` | **P0** | FK member → expert/version |
| 8 | `/quan-ly-do-an/dm-do-an` | `pages/quan-ly-do-an/dm-do-an` | **P0 + P1** | Select expert đồ án + export |
| 9 | `/quan-ly-do-an/.../cau-hinh-hoi-dong` | `danh-muc-do-an/cau-hinh-hoi-dong` | **P0 / P3** | HĐ đồ án; include `SubjectClass.expertProfile` |
| 10 | Modal đồ án | `put-do-an.tsx` | **P0** | Form chọn expert |
| 11 | `/quan-ly-diem/chuyen-de-nghien-cuu` + modal | page + `put-chuyen-de-nghien-cuu.tsx` | **P0** | Chốt thuộc bảng expert nào sau tách |
| 12 | `/quan-ly-diem/thuc-tap` + modal | page + `put-thuc-tap.tsx` | **P0** | Chốt thuộc bảng expert nào sau tách |

### 4.3. App `ql-dao-tao` — In mẫu / thanh toán (P1 — lõi bug lịch sử)

| # | Route / UI | File chính | Mức | Việc khi refactor |
| --- | --- | --- | --- | --- |
| 13 | Export / in luận văn | `utils/thesis-excel.ts`, `thesis-profile.ts` | **P1** | Đọc version/snapshot; **không** suy `inAcademy` từ `lecturerId` live |
| 14 | Export thanh toán HD | `utils/thesis-supervisor-payment-export.ts` | **P1** | Tương tự |
| 15 | Modal in QĐ hội đồng | `modal-print-quyet-dinh-hoi-dong.tsx` | **P1** | Type/include expert version |
| 16 | `/quan-ly-luan-van/danh-sach-thanh-toan` | page thanh toán HĐ | **P1** | Join member → version |
| 17 | `/quan-ly-luan-van/danh-sach-thanh-toan-gvhd` | page + `put-thanh-toan-gvhd.tsx` | **P1** | Join supervisor version |
| 18 | `/quan-ly-do-an/danh-sach-thanh-toan` | page | **P1** | Như luận văn, nhánh đồ án |
| 19 | `/quan-ly-do-an/danh-sach-thanh-toan-gvhd` | page | **P1** | Như trên |
| 20 | Modal thanh toán | `put-thanh-toan*.tsx` | **P0/P1** | Lookup expert đúng bảng/version |

### 4.4. App khác / đọc phụ (P2)

| # | App | File | Mức | Việc khi refactor |
| --- | --- | --- | --- | --- |
| 21 | `ql-dao-tao` | `modal-chi-tiet-giang-vien.tsx` | **P2** | Tab hồ sơ chuyên gia (current) |
| 22 | `cong-hoc-vien` | `modal-chi-tiet-giang-vien.tsx` | **P2** | `lecturer.expertProfile` |
| 23 | `cong-sinh-vien` | `modal-chi-tiet-giang-vien.tsx` | **P2** | Như trên |
| 24 | `tro-ly-ao` | generated `commonComponents` | **P2** | Type union model |

### 4.5. Backend

| # | Service | Mức | Việc khi refactor |
| --- | --- | --- | --- |
| 25 | `be-model` `thesis-council-import.service.ts` | **P0** | Import HĐ map đúng bảng/version |
| 26 | `be-model` `thesis-council-export.service.ts` | **P1** | Export theo snapshot/version đã gán |

---

## 5. Ảnh hưởng schema / DB (khi tách hoặc version)

### 5.1. Nếu tách 2 bảng module

| Đối tượng | Hướng remap |
| --- | --- |
| `ThesisProject` (`thesisType = THESIS`) | → `ThesisExpertProfile` (hoặc version của bảng đó) |
| `ThesisProject` (`thesisType = PROJECT`) | → `ProjectExpertProfile` |
| `CouncilMember` | Không dùng 1 FK chung: nhánh theo loại HĐ / 2 field nullable |
| `StudentResearchTopic` | **Chưa chốt** — thesis / project / giữ tạm |
| `StudentInternship` | **Chưa chốt** |
| `SubjectClass` M:N | Gắn **project**; hoặc drop nếu không dùng |
| `TrainingMajor` M:N | Remap / nhân đôi theo module nếu cần |
| Flag `thesisExpert` / `projectExpert` | Xóa sau migrate |

**Migrate dữ liệu:**

1. Copy `thesisExpert=true` → bảng luận văn  
2. Copy `projectExpert=true` → bảng đồ án  
3. Cả 2 flag → **2 record** (id khác nhau) nếu chọn isolation tuyệt đối  
4. Remap FK theo `thesisType` / nguồn màn hình  
5. Deprecate / drop `ExpertProfile`

### 5.2. Nếu thêm versioning (trên từng bảng sau tách, hoặc trên bảng hiện tại)

| Layer | Vai trò |
| --- | --- |
| Identity (`Expert` / giữ `ExpertProfile` rút gọn) | Người là ai, lecturer, bank, cờ eligible… |
| `ExpertProfileVersion` | name, học hàm/học vị, `inAcademy`, đơn vị, `validFrom`/`validTo` |
| FK nghiệp vụ | Lưu `expertProfileVersionId` (không lưu chỉ identity khi in lịch sử) |

Quy tắc: **đổi học vị / trong↔ngoài HV = đóng version cũ + tạo version mới**, không update in-place version đã gán đợt.

---

## 6. Gợi ý chia phần triển khai (sau khi chốt)

Thứ tự có thể điều chỉnh; mỗi phần nên mergeable độc lập khi được.

### Phần 0 — Chốt quyết định

- [ ] Chọn hướng: chỉ tách bảng / chỉ version / **kết hợp**
- [ ] Cùng 1 người ở 2 module = **2 record độc lập** hay share identity?
- [ ] Research topic + Internship gắn bảng nào?
- [ ] Giữ hay bỏ `SubjectClass ↔ Expert` M:N?
- [ ] Backfill: chấp nhận version/snapshot đầu = trạng thái **hiện tại** (lịch sử đã méo trước đó không khôi phục)?

### Phần 1 — Schema + migrate dữ liệu

- [ ] Thêm model mới (tách và/hoặc version)
- [ ] Script migrate / remap FK
- [ ] Seed / generate ZenStack + hooks
- [ ] Kiểm tra constraint unique (`lecturerId` trên từng bảng nếu tách)

### Phần 2 — CRUD danh mục (P0)

- [ ] Page + modal luận văn
- [ ] Page + modal đồ án
- [ ] (Nếu version) UX: sửa hồ sơ → tạo version + cảnh báo không ảnh hưởng đợt đã gán

### Phần 3 — Gán HD / hội đồng luận văn (P0)

- [ ] `dm-luan-van`, cấu hình HĐ đợt, modal HĐ
- [ ] Lưu đúng FK version/snapshot lúc gán
- [ ] Import/export council backend

### Phần 4 — Gán HD / hội đồng đồ án (P0)

- [ ] `dm-do-an`, cấu hình HĐ lớp, `put-do-an`
- [ ] Remap `SubjectClass.expertProfile` (nếu giữ)

### Phần 5 — Chuyên đề NC + Thực tập (P0)

- [ ] Remap FK + modal/page theo quyết định Phần 0

### Phần 6 — In mẫu + thanh toán (P1) — **đóng bug lịch sử**

- [ ] `thesis-profile.ts` / `thesis-excel.ts` đọc version/snapshot
- [ ] Bỏ `inAcademy = !!lecturerId` live
- [ ] Pages thanh toán HĐ / GVHD (luận văn + đồ án)
- [ ] Modal in QĐ

### Phần 7 — Portal / chi tiết GV (P2)

- [ ] Modal chi tiết GV (`ql-dao-tao`, `cong-hoc-vien`, `cong-sinh-vien`) — hiển thị current profile

### Phần 8 — Dọn dẹp

- [ ] Drop bảng/cột cũ, flag cũ
- [ ] Cập nhật docs / quyền / router nếu đổi tên entity
- [ ] Regression: in lại mẫu đợt cũ sau khi đổi hồ sơ current

---

## 7. Tiêu chí chấp nhận (sau cùng)

1. Sửa học vị chuyên gia ở **đồ án** không đổi mẫu/in **luận văn** (nếu đã tách bảng).  
2. Trong **cùng** module: sau khi đổi hồ sơ current, **in lại đợt đã chốt** vẫn giữ học vị / trong-ngoài HV cũ (nếu đã version/snapshot).  
3. Định mức thanh toán theo `inAcademy` lấy từ giá trị **đã lưu lúc gán**, không từ `lecturerId` hiện tại.  
4. Danh mục luận văn / đồ án CRUD độc lập, không phụ thuộc flag chung.

---

## 8. Tham chiếu code nhanh

| Chủ đề | Path |
| --- | --- |
| Model expert | `packages/database/models/ql-dao-tao/thesis.zmodel` |
| SubjectClass pool | `packages/database/models/ql-dao-tao/plan-training.zmodel` (`expertProfile`) |
| In / Excel | `apps/client/ql-dao-tao/src/utils/thesis-excel.ts` |
| Format profile | `apps/client/ql-dao-tao/src/utils/thesis-profile.ts` |
| Modal CRUD | `apps/client/ql-dao-tao/src/components/modal/put-chuyen-gia.tsx` |
| Import/export HĐ | `apps/backend/be-model/src/services/thesis-council-*.service.ts` |

---

## 9. Nhật ký quyết định

| Ngày | Quyết định | Ghi chú |
| --- | --- | --- |
| (điền khi chốt) | | Ví dụ: tách 2 bảng + version phase 2 |
| | | Research/Internship → ? |
| | | SubjectClass M:N → giữ / bỏ |
| | | Cùng người 2 module → 2 record? |

---

*Tài liệu living: cập nhật bảng nhật ký và tick checklist khi triển khai từng phần.*
