import { prisma } from ".."

type CatalogEntry = {
  key: string
  load: () => Promise<unknown[]>
}

const DM_CATALOG_LOADERS: CatalogEntry[] = [
  { key: "DM_CapBac", load: () => prisma.dM_CapBac.findMany() },
  { key: "DM_ChucDanh", load: () => prisma.dM_ChucDanh.findMany() },
  { key: "DM_ChucVu", load: () => prisma.dM_ChucVu.findMany() },
  { key: "DM_HocHam", load: () => prisma.dM_HocHam.findMany() },
  { key: "DM_HocVi", load: () => prisma.dM_HocVi.findMany() },
  { key: "DM_ChungChiTinHoc", load: () => prisma.dM_ChungChiTinHoc.findMany() },
  { key: "DM_DanToc", load: () => prisma.dM_DanToc.findMany() },
  { key: "DM_DonVi", load: () => prisma.dM_DonVi.findMany() },
  { key: "DM_DonViHanhChinh", load: () => prisma.dM_DonViHanhChinh.findMany() },
  { key: "DM_KhuVuc_DiaLy", load: () => prisma.dM_KhuVuc_DiaLy.findMany() },
  { key: "DM_NgoaiNgu", load: () => prisma.dM_NgoaiNgu.findMany() },
  { key: "DM_TonGiao", load: () => prisma.dM_TonGiao.findMany() },
  { key: "DM_TrinhDoNgoaiNgu", load: () => prisma.dM_TrinhDoNgoaiNgu.findMany() },
  { key: "DM_TrinhDoTinHoc", load: () => prisma.dM_TrinhDoTinHoc.findMany() },
  { key: "DM_GioiTinh", load: () => prisma.dM_GioiTinh.findMany() },
  { key: "DM_NhanVien", load: () => prisma.dM_NhanVien.findMany() },
  {
    key: "DM_PhanCap_ChatLuong_TrangThietBi",
    load: () => prisma.dM_PhanCap_ChatLuong_TrangThietBi.findMany(),
  },
  { key: "DM_PhanLoai_CSKT", load: () => prisma.dM_PhanLoai_CSKT.findMany() },
  { key: "DM_NhomNguoiDung", load: () => prisma.dM_NhomNguoiDung.findMany() },
  { key: "DM_NhomUngDung", load: () => prisma.dM_NhomUngDung.findMany() },
  { key: "DM_QuocGia", load: () => prisma.dM_QuocGia.findMany() },
  { key: "DM_Tinh", load: () => prisma.dM_Tinh.findMany() },
  { key: "DM_Tinh_New", load: () => prisma.dM_Tinh_New.findMany() },
  { key: "DM_QuanHuyen", load: () => prisma.dM_QuanHuyen.findMany() },
  { key: "DM_XaPhuong", load: () => prisma.dM_XaPhuong.findMany() },
  { key: "DM_XaPhuong_New", load: () => prisma.dM_XaPhuong_New.findMany() },
  { key: "DM_ViTriCongViec", load: () => prisma.dM_ViTriCongViec.findMany() },
  {
    key: "DM_TrinhDoHocVan",
    load: () => prisma.dM_TrinhDoHocVan.findMany({ where: { deletedAt: null } }),
  },
  {
    key: "DM_TrinhDoLyLuanChinhTri",
    load: () => prisma.dM_TrinhDoLyLuanChinhTri.findMany({ where: { deletedAt: null } }),
  },
  {
    key: "DM_TrinhDoQuanLyNhaNuoc",
    load: () => prisma.dM_TrinhDoQuanLyNhaNuoc.findMany({ where: { deletedAt: null } }),
  },
  {
    key: "DM_TinhTrangHonNhan",
    load: () => prisma.dM_TinhTrangHonNhan.findMany({ where: { deletedAt: null } }),
  },
  {
    key: "DM_QuanHeThanNhan",
    load: () => prisma.dM_QuanHeThanNhan.findMany({ where: { deletedAt: null } }),
  },
  {
    key: "DM_TrangThaiLamViec",
    load: () => prisma.dM_TrangThaiLamViec.findMany({ where: { deletedAt: null } }),
  },
  {
    key: "DM_HinhThucKhenThuongChinhQuyen",
    load: () => prisma.dM_HinhThucKhenThuongChinhQuyen.findMany({ where: { deletedAt: null } }),
  },
  {
    key: "DM_HinhThucKhenThuongDang",
    load: () => prisma.dM_HinhThucKhenThuongDang.findMany({ where: { deletedAt: null } }),
  },
  {
    key: "DM_XepLoaiDanhGiaCanBo",
    load: () => prisma.dM_XepLoaiDanhGiaCanBo.findMany({ where: { deletedAt: null } }),
  },
  {
    key: "DM_XepLoaiDanhGiaChatLuongDangVien",
    load: () => prisma.dM_XepLoaiDanhGiaChatLuongDangVien.findMany({ where: { deletedAt: null } }),
  },
  {
    key: "DM_LoaiHinhCongTac",
    load: () => prisma.dM_LoaiHinhCongTac.findMany({ where: { deletedAt: null } }),
  },
  {
    key: "DM_TinhTrangCongTac",
    load: () => prisma.dM_TinhTrangCongTac.findMany({ where: { deletedAt: null } }),
  },
  {
    key: "DM_LoaiTinhTrangCongTac",
    load: () => prisma.dM_LoaiTinhTrangCongTac.findMany({ where: { deletedAt: null } }),
  },
  {
    key: "DM_LoaiHinhDiHocTap",
    load: () => prisma.dM_LoaiHinhDiHocTap.findMany({ where: { deletedAt: null } }),
  },
  {
    key: "DM_TinhTrangDiHocTap",
    load: () => prisma.dM_TinhTrangDiHocTap.findMany({ where: { deletedAt: null } }),
  },
  {
    key: "DM_NuocCuDiHocTap",
    load: () => prisma.dM_NuocCuDiHocTap.findMany({ where: { deletedAt: null } }),
  },
  {
    key: "DM_ChucDanhCMNVGiangVien",
    load: () => prisma.dM_ChucDanhCMNVGiangVien.findMany({ where: { deletedAt: null } }),
  },
  {
    key: "DM_ChucDanhCMNVNghienCuuVien",
    load: () => prisma.dM_ChucDanhCMNVNghienCuuVien.findMany({ where: { deletedAt: null } }),
  },
  {
    key: "DM_ChucDanhCMNVKySu",
    load: () => prisma.dM_ChucDanhCMNVKySu.findMany({ where: { deletedAt: null } }),
  },
  {
    key: "DM_TruongDaoTaoBacDH",
    load: () => prisma.dM_TruongDaoTaoBacDH.findMany({ where: { deletedAt: null } }),
  },
  {
    key: "DM_ChuyenNganhDaoTaoBacDH",
    load: () => prisma.dM_ChuyenNganhDaoTaoBacDH.findMany({ where: { deletedAt: null } }),
  },
  {
    key: "DM_ChiHuyQuanLy",
    load: () => prisma.dM_ChiHuyQuanLy.findMany({ where: { deletedAt: null } }),
  },
  {
    key: "DM_ChuyenMonKyThuat",
    load: () => prisma.dM_ChuyenMonKyThuat.findMany({ where: { deletedAt: null } }),
  },
  { key: "DM_SucKhoe", load: () => prisma.dM_SucKhoe.findMany({ where: { deletedAt: null } }) },
  { key: "DM_NhomMau", load: () => prisma.dM_NhomMau.findMany({ where: { deletedAt: null } }) },
  {
    key: "DM_LoaiThuongTat",
    load: () => prisma.dM_LoaiThuongTat.findMany({ where: { deletedAt: null } }),
  },
  { key: "DM_NganhHoc", load: () => prisma.dM_NganhHoc.findMany({ where: { deletedAt: null } }) },
  {
    key: "DM_ToChucXaHoi",
    load: () => prisma.dM_ToChucXaHoi.findMany({ where: { deletedAt: null } }),
  },
  { key: "DM_Ngach", load: () => prisma.dM_Ngach.findMany({ where: { deletedAt: null } }) },
  { key: "DM_BacLuong", load: () => prisma.dM_BacLuong.findMany({ where: { deletedAt: null } }) },
]

const TRAINING_CATALOG_LOADERS: CatalogEntry[] = [
  {
    key: "LecturerType",
    load: () => prisma.lecturerType.findMany({ where: { deletedAt: null } }),
  },
  { key: "StaffType", load: () => prisma.staffType.findMany({ where: { deletedAt: null } }) },
  {
    key: "StaffPosition",
    load: () => prisma.staffPosition.findMany({ where: { deletedAt: null } }),
  },
  {
    key: "TrainingLanguage",
    load: () => prisma.trainingLanguage.findMany({ where: { deletedAt: null } }),
  },
  { key: "TrainingType", load: () => prisma.trainingType.findMany({ where: { deletedAt: null } }) },
  {
    key: "TrainingLevel",
    load: () => prisma.trainingLevel.findMany({ where: { deletedAt: null } }),
  },
  { key: "TrainingForm", load: () => prisma.trainingForm.findMany({ where: { deletedAt: null } }) },
  { key: "TrainingTime", load: () => prisma.trainingTime.findMany({ where: { deletedAt: null } }) },
  { key: "DiplomaType", load: () => prisma.diplomaType.findMany({ where: { deletedAt: null } }) },
  {
    key: "PriorityObject",
    load: () => prisma.priorityObject.findMany({ where: { deletedAt: null } }),
  },
  {
    key: "TrainingField",
    load: () => prisma.trainingField.findMany({ where: { deletedAt: null } }),
  },
  {
    key: "AcademicRankingConvert",
    load: () => prisma.academicRankingConvert.findMany({ where: { deletedAt: null } }),
  },
  {
    key: "SubjectVersionCategory",
    load: () => prisma.subjectVersionCategory.findMany({ where: { deletedAt: null } }),
  },
  { key: "LoadCategory", load: () => prisma.loadCategory.findMany({ where: { deletedAt: null } }) },
  {
    key: "TemplateFile",
    load: () => prisma.templateFile.findMany({ where: { deletedAt: null } }),
  },
]

export async function loadAllCatalogs(): Promise<Record<string, unknown[]>> {
  const loaders = [...DM_CATALOG_LOADERS, ...TRAINING_CATALOG_LOADERS]
  const entries = await Promise.all(
    loaders.map(async (loader) => {
      try {
        return [loader.key, await loader.load()] as const
      } catch (e) {
        console.warn(
          `[export-all-catalogs] Bỏ qua catalog ${loader.key}:`,
          e instanceof Error ? e.message : e
        )
        return [loader.key, []] as const
      }
    })
  )
  return Object.fromEntries(entries)
}
