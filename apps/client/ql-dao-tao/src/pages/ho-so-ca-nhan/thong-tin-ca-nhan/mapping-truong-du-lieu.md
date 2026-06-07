# Đối chiếu trường dữ liệu — Hồ sơ cá nhân (Thông tin cá nhân)

Tài liệu so sánh dữ liệu fake (`types.ts`) với schema thật
[`profile.zmodel`](../../../../../../../packages/database/models/ql-ho-so/profile.zmodel) để tham chiếu
khi thay dữ liệu fake bằng dữ liệu thật.

- ✅ Có — map thẳng tới 1 trường.
- ⚠️ Có nhưng cần xử lý (qua quan hệ id, gộp chung, hoặc phải tính toán).
- ❌ Chưa có trường trong schema.

## Khối 1 — Thông tin chung (`ThongTinCaNhan`)

| Field fake | Trường trong schema | Trạng thái |
|---|---|---|
| `hoVaTen` | `UserProfile.fullname` (hoặc `firstName`+`lastName`) | ✅ Có |
| `gioiTinh` | `UserProfile.gender` → `DM_GioiTinh` | ⚠️ Qua quan hệ |
| `ngaySinh` | `UserProfile.dateOfBirth` | ✅ Có |
| `email` | `UserProfile.email` | ✅ Có |
| `soDienThoai` | `UserProfile.phoneNumber` | ✅ Có |
| `cmndCccd` | `UserProfile.idCardNumber` | ✅ Có |
| `maGiangVien` | `UserProfile.code` (hoặc `Lecturer.code`) | ✅ Có |
| `donViCongTac` | `UserProfile.sDM_DonViId` / `Lecturer.organization` | ⚠️ Id quan hệ, cần join danh mục để ra tên |
| `chucVu` | `UserProfile.chucVuChinhQuyen` → `DM_ChucVu` | ⚠️ Qua quan hệ |
| `chucDanh` | `UserProfile.level` → `DM_ChucDanh` | ⚠️ Qua quan hệ |
| `hocHam` | `UserProfile.academicRankType` → `DM_HocHam` | ⚠️ Qua quan hệ. *Lưu ý: "Tiến sĩ" thực ra là **học vị** (`academicDegreeType`/`DM_HocVi`), không phải học hàm* |
| `ngayVaoTruong` | — | ❌ Chưa có (gần nhất: `recruitmentDate` = ngày tuyển dụng, `tenureDate` = ngày vào niên chế) |
| `tinhTrang` | `UserProfile.trangThaiLamViec` → `DM_TrangThaiLamViec` | ⚠️ Qua quan hệ |
| `anhDaiDien` | `UserProfile.avatar` | ✅ Có |

## Khối 1 — Ô THỐNG KÊ (`ThongKeHoSo`)

Cả 4 số liệu đều là **tổng hợp/tính toán (aggregate)**, không lưu sẵn trong `UserProfile`.

| Field fake | Nguồn | Trạng thái |
|---|---|---|
| `soNamCongTac` | Tính từ `recruitmentDate` / `QuaTrinhCongTac` | ⚠️ Phải tính |
| `soMonHocPhuTrach` | Đếm từ quan hệ giảng dạy của `Lecturer` (model khác) | ⚠️ Phải tính |
| `soLopGiangDay` | Đếm số lớp của `Lecturer` | ⚠️ Phải tính |
| `soSinhVienHuongDan` | Đếm SV hướng dẫn (đồ án/luận văn — model khác) | ⚠️ Phải tính |

## Khối 2 — Thông tin liên hệ (`ThongTinLienHe`)

| Field fake | Trường trong schema | Trạng thái |
|---|---|---|
| `diaChiLienHe` | `UserProfile.contactAddress` | ✅ Có |
| `diaChiThuongTru` | `UserProfile.permanentAddress` | ✅ Có |
| `emailCaNhan` | `UserProfile.email` | ⚠️ Chỉ có 1 trường email chung, không tách cá nhân/cơ quan |
| `dienThoaiDiDong` | `UserProfile.phoneNumber` | ⚠️ Chỉ có 1 số điện thoại chung |
| `dienThoaiCoQuan` | — | ❌ Chưa có trường riêng |

## Khối 2 — Trình độ đào tạo cao nhất (`TrinhDoDaoTao`)

| Field fake | Trường trong schema | Trạng thái |
|---|---|---|
| `trinhDo` | `academicDegreeType`→`DM_HocVi` / `trinhDoHocVan` / `HocVi[]` | ⚠️ Qua quan hệ |
| `namCapBang` | `academicDegreeDate` hoặc `HocVi.year` | ✅ Có |
| `chuyenNganh` | `QuaTrinhHocTap.chuyenNganh` / `HocVi.linhVuc` | ⚠️ Qua quan hệ |
| `noiDaoTao` | `HocVi.truong` / `QuaTrinhHocTap.tenTruong` → `DM_TruongDaoTaoBacDH` | ⚠️ Qua quan hệ |
| `tenLuanAn` | — | ❌ Chưa có trường lưu tên luận án/đề tài |

## Khối 3 — Quá trình công tác (model `QuaTrinhCongTac`)

| Field fake | Trường trong schema | Trạng thái |
|---|---|---|
| `thoiGian` | `tuThangNam` + `denThangNam` | ✅ Có (2 trường) |
| `donViCongTac` | `donVi` | ✅ Có |
| `viTriCongTac` | `chucDanh` hoặc `chucVu` → `DM_ChucVu` | ✅ Có |
| `ghiChu` | (có thể là `description` của `Base`, hoặc `soQuyetDinh`/`diaChi`) | ⚠️ Không có trường `ghiChu` riêng — cần xác nhận `Base` có `description` |

## Tóm tắt

**❌ Hoàn toàn chưa có trong schema (cần thêm trường hoặc bỏ khỏi UI):**
- `ngayVaoTruong` (ngày vào trường)
- `dienThoaiCoQuan` (điện thoại cơ quan)
- `tenLuanAn` (tên luận án/đề tài)

**⚠️ Có nhưng không khớp 1-1 (cần xử lý):**
- `emailCaNhan` / `dienThoaiDiDong` — schema chỉ có 1 `email` và 1 `phoneNumber`, không tách cá nhân/cơ quan.
- `donViCongTac`, `chucVu`, `chucDanh`, `hocHam`, `tinhTrang`, `gioiTinh`, `chuyenNganh`, `noiDaoTao` —
  đều là quan hệ (id) tới bảng danh mục, phải `include`/join mới ra text hiển thị.
- 4 số liệu THỐNG KÊ đều phải tính toán (aggregate), không có sẵn trong `UserProfile`.
- `hocHam` đang để "Tiến sĩ" nhưng đó là học vị (`DM_HocVi`), không phải học hàm (`DM_HocHam`).

**✅ Map thẳng được:** `hoVaTen`, `ngaySinh`, `email`, `soDienThoai`, `cmndCccd`, `maGiangVien`,
`anhDaiDien`, `diaChiLienHe`, `diaChiThuongTru`, `namCapBang`, và cụm `thoiGian`/`donVi`/`viTri`
của quá trình công tác.
