# Đối chiếu mta_mobile → mta_internet cho StudentPortal

Kiểm tra ngày 30/09/2026 trên cùng PostgreSQL host, dùng thông tin kết nối hiện có của MobileCongSinhVien. Hai phiên đọc catalog đều có `transaction_read_only=on`. Không đọc/copy dữ liệu người dùng; không chạy migration, đổi connection string, commit hoặc push lên production.

## Kết quả catalog thực tế

| Hạng mục | Kết quả |
| --- | --- |
| Bảng có trong mobile nhưng thiếu production | `ql-dao-tao.StudentPersonalEvent` |
| Bảng production có thêm | `ql-dao-tao.AccessRoleGrant`, `ql-dao-tao.AccessPermissionGrant` |
| Cột audit thiếu trên bảng chung | 1.784 cột trên 298 bảng |
| Phần audit khai báo được trong ZModel | 257 model chung hiện có; trong đó UserProfile đã có 4 cột String audit, chỉ thiếu 2 ngày audit |
| Phần audit của bảng nối implicit | 41 bảng, 246 cột; cần SQL riêng |
| Cột nghiệp vụ khác biệt | `Student.code`, `Lecturer.code`, `Staff.code`, `Lecturer.organizationId` |
| Định nghĩa cột chung | Không khác kiểu, nullable, default, identity, generated |
| Enum | 69 enum ở mỗi DB, tên/thứ tự giá trị giống nhau |
| Function/trigger tự viết | 2 function và 2 trigger, giống nhau |

Chi tiết từng schema/table/column/FK/index được lưu ở `packages/database/prisma/student-portal-db-diff-20260930.json`, chỉ chứa cấu trúc và không có mật khẩu/connection string.

## ZModel đã chuẩn bị

- `models/base.zmodel`: thêm trực tiếp vào cả Base và BaseNoCode các trường `sNguoiTao`, `sNguoiSua`, `dNgayTao`, `dNgaySua`, `sThietBiTao`, `sThietBiSua`. Tất cả nullable, không default, không backfill. Các ngày dùng `@db.Timestamp(6)`, tương đương độ chính xác mặc định của PostgreSQL `timestamp without time zone` trên mobile. Không dùng abstract audit riêng.
- `models/ql-ho-so/profile.zmodel`: BaseUuid cũng khai báo trực tiếp 6 trường audit, chuyển 4 trường String audit đã có từ UserProfile lên abstract để tránh trùng; các cột này vẫn giữ nguyên.
- `models/he-thong/changelog.zmodel`: thêm trực tiếp audit cho ChangeLog, vốn không kế thừa Base.
- `models/ql-dao-tao/note.zmodel`: hoàn thiện model StudentPersonalEvent đã có trong thay đổi staged của bạn: FK tới Student/SubjectClass, index owner/time đúng tên trên mobile; không tạo model trùng.
- `models/ql-dao-tao/plan-training.zmodel`: thêm quan hệ ngược SubjectClass → StudentPersonalEvent và index `[subjectClassId, classDate]`.

`CoreBase` trong schema mta đã có các cột audit ở cả hai DB và được giữ nguyên. Hai model phân quyền chỉ có trên production cũng được giữ lại; chúng nhận audit nullable theo BaseNoCode để không thiếu metadata khi .NET sử dụng sau này.

Bảng StudentPersonalEvent mới dùng Base của monorepo: `createdAt`, `updatedAt`, `deletedAt` theo TIMESTAMP(3), còn mobile hiện dùng timestamp mặc định độ chính xác 6. `startTime`, `endTime` và hai ngày audit dùng TIMESTAMP(6). Base cũng tạo unique index `StudentPersonalEvent_code_key`, trong khi bản mobile chưa có index này. Đây là khác biệt có chủ đích theo Base hiện tại, trên một bảng production mới và rỗng; không ALTER các bảng production đã có.

## Bảng nối và index dùng SQL riêng

Migration chuẩn bị ở `packages/database/prisma/migrations/20260930090000_student_portal_mobile_compat/migration.sql` thêm 1 bảng và 1.796 cột trên bảng hiện có (1.784 cột thiếu trên bảng chung + 12 cột audit cho hai model phân quyền chỉ có trên production). SQL gồm phần Prisma diff từ catalog production sang ZModel, cộng:

- 246 cột audit nullable cho 41 bảng nối implicit, giữ A/B, FK, index và API nested hiện có.
- Hai partial index đang có trên mobile: `ClassSchedule_classDate_idx`, `StudentSubjectScore_student_idx`, chỉ áp dụng khi `deletedAt IS NULL`.

Prisma 6.10.1 không biểu diễn metadata bổ sung trên bảng nối implicit trong model hiện tại; muốn khai báo chúng như model riêng phải chuyển quan hệ sang explicit và thay đổi API web. Do đó phần này được giữ bằng custom migration SQL. Tài liệu: https://docs.prisma.io/docs/orm/v6/prisma-schema/data-model/relations/many-to-many-relations

**Không dùng `db:sync`, `db:push` hoặc `migrate dev` trực tiếp lên production.** Sau khi chạy migration này trên DB tạm, Prisma diff về ZModel đề xuất DROP chính xác 246 cột audit của các bảng implicit. Custom SQL cần được giữ khi sinh migration tiếp theo; không chấp nhận những DROP đó. Partial index cũng được quản lý bằng SQL riêng.

## Những thay đổi production đã chủ động thực hiện

`20260924050000_drop_lecturer_organization` loại bỏ Lecturer.organizationId. Bạn đã chọn giữ thiết kế production: lấy đơn vị giảng viên qua UserProfile.sDM_DonViId → mta.DM_DonVi.Id. Không thêm lại cột/FK cũ.

Backend cần sửa trước khi đổi connection:

- MobileCongSinhVien `source/Be/Infrastructures/StudentPortal.Infrastructure.Npgsql/Reps/Contacts/ContactsQueryRep.cs:102`: hiện JOIN DM_DonVi theo `l.organizationId`. Cần JOIN UserProfile theo `l.userProfileId`, rồi JOIN DM_DonVi theo `up.sDM_DonViId`. Giữ các điều kiện active/deleted/candidate hiện tại.
- `source/Be/Domains/StudentPortal.Domain.Core/Entities/QlDaoTao/Lecturer/Lecturer.cs:51` vẫn map organizationId; các luồng generic CRUD Lecturer cần cập nhật theo model production nếu được sử dụng.

`20260924080000_drop_role_code` thực tế bỏ Student.code/Lecturer.code/Staff.code, dùng duy nhất UserProfile.code. Mobile hiện vẫn tham chiếu:

- `HomeQueryRep.cs:16` và `:52`: `s.code`/`st.code`.
- `RegistrationQueryRep.cs:20` và `:92`: StudentCte đọc s.code; các luồng kiểm tra sinh viên/đăng ký dùng lại CTE này.
- `StudentProfileQueryRep.cs:25`: st.code.
- `ScheduleQueryRep.cs:168`: `l.code`, cùng các nhánh giảng viên phụ/nhập điểm ở :171 và :174.
- Các entity Student/Lecturer/Staff còn map code.

Bạn đã chọn giữ thiết kế production cho cả ba cột code: không thêm lại chúng và không backfill/thay đổi UserProfile.code. Các truy vấn Home/Profile/Registration cần lấy mã từ UserProfile theo student.userProfileId; các nhánh giảng viên của Schedule cần dùng up.code/up2.code/up3.code. Các entity/generic CRUD phải bỏ mapping code trên Student/Lecturer/Staff nếu còn được sử dụng. Phiên này chỉ sửa ZModel/chuẩn bị migration, chưa sửa những truy vấn .NET này.

## Lịch sử migration production đang lệch catalog

Production có 11 bản ghi migration; một bản chưa hoàn tất và chưa rollback:

`20260714163000_data_sync_history`

Log lỗi: `ERROR: type "DataSyncType" already exists` (PostgreSQL 42710). Enum và bảng DataSyncHistory hiện đã tồn tại trong catalog. Không retry migration cũ hoặc reset DB.

Các migration local chưa có bản ghi completed trong production:
- `20260714163000_data_sync_history`
- `20260715140000_class_register_logs_unique`
- `20260731160000_subject_class_optimistic_lock`
- `20260807150000_survey_object_graduate`
- `20260924040000_userprofile_donvi_fk`
- `20260924050000_drop_lecturer_organization`
- `20260924080000_drop_role_code`
- `20260930090000_student_portal_mobile_compat`

Các migration completed đã có đều khớp checksum với file local. Không có migration completed nào mất file local.

Cần đối chiếu tác dụng đầy đủ của từng migration cũ trước khi reconcile bằng `prisma migrate resolve`. Đặc biệt `class_register_logs_unique` có DELETE dữ liệu trùng và `subject_class_optimistic_lock` có backfill UPDATE; việc schema đã tồn tại không chứng minh các thao tác dữ liệu này đã chạy. Phiên này chỉ kiểm tra cấu trúc, không xác nhận/xử lý các thao tác đó và không đánh dấu migration applied.

## Quy trình chạy do bạn thực hiện

1. Review ZModel và SQL đã chuẩn bị. Chuẩn bị backup và kiểm tra trên staging/copy production trước khi chạy trên production có dữ liệu.
2. Trong `packages/database`, đặt DATABASE_URL bằng thông tin hiện có nhưng Database=`mta_internet`; không đưa mật khẩu vào tài liệu hay Git. Kiểm tra đúng tên DB/host và trạng thái migration.
3. Xử lý migration history failed/pending nêu trên trước. Chỉ resolve từng migration đã chứng minh đầy đủ tác dụng hoặc có quyết định baseline rõ ràng; không resolve hàng loạt theo danh sách này.
4. Generate từ ZModel, kiểm tra migration status rồi deploy khi lịch sử đã nhất quán:

```bash
cd /Users/swantech/Code/MTA-monorepo/packages/database
pnpm exec zenstack generate
pnpm exec prisma migrate status
# Chỉ sau khi lịch sử cũ được reconcile và SQL đã review:
pnpm exec prisma migrate deploy
```

`migrate deploy` áp dụng tất cả migration pending, không chỉ migration mới. Không chạy lệnh deploy nếu failed migration cũ vẫn tồn tại hoặc chưa đánh giá các migration pending khác.

5. Sau migration, kiểm tra bảng mới, audit, FK/index và sửa các truy vấn .NET còn dùng cột đã bị loại bỏ trước khi chuyển key `mtaMobile` sang mta_internet. Các DB system/core/management/audit có vai trò khác; không đổi đồng loạt theo DB nghiệp vụ.

## Kiểm chứng và giới hạn

- ZenStack 2.21.1 sinh Prisma schema thành công trong thư mục tạm; chỉ chạy plugin Prisma, không ghi đè generated của monorepo. Cảnh báo `generateClient=false` là do cố ý bỏ sinh client; công cụ còn báo không format được, nên Prisma validation riêng được chạy sau đó.
- Prisma 6.10.1 validate schema thành công.
- SQL chạy trên PostgreSQL local 15.17 với 327 bảng business dựng lại từ catalog production 18.6, không sao chép row production.
- Kiểm tra cuối sau khi giữ cả ba code bị bỏ: chỉ thiếu đúng 4 cột cũ đã được bạn chấp nhận loại trừ (3 code và Lecturer.organizationId); các cột nghiệp vụ mobile khác đều tồn tại. Định nghĩa nullable/default/kiểu audit tương đương; các cột production hiện có giữ nguyên định nghĩa. FK/index mobile được giữ theo phạm vi, ngoại trừ FK organization và 3 unique index code cũ. Thử FK StudentPersonalEvent với ID giả không tồn tại và xác nhận bị từ chối.
- Chưa chạy trên PostgreSQL production 18.6, chưa đo thời gian lock/index trên bảng có dữ liệu; lock_timeout=5s và statement_timeout=120s trong migration sẽ dừng/rollback khi vượt giới hạn.
- SQL chứa transaction BEGIN/COMMIT và kiểm tra current_database() phải là mta_internet; không có câu lệnh DROP/TRUNCATE/DELETE/UPDATE dữ liệu hay ALTER COLUMN. ON DELETE/ON UPDATE trong FK chỉ định hành vi khóa ngoại.
- Chưa đổi connection string, sửa API danh bạ hoặc chạy E2E mobile. Migration schema không chứng minh dữ liệu/người dùng/session từ các DB auth/core tương thích với mta_internet.
