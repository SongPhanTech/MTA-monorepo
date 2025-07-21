/*
  Warnings:

  - You are about to drop the `DM_VaiTro` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `NguoiDungTrongNhom` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `NhatKyHoatDong` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Policy` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Quyen_VaiTro` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `TaiKhoan` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `VaiTroTrongNhom` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropIndex
DROP INDEX "mta"."DM_CapBac_sTen_key";

-- DropIndex
DROP INDEX "mta"."DM_ChucDanh_sTen_key";

-- DropIndex
DROP INDEX "mta"."DM_ChucVu_sTen_key";

-- DropIndex
DROP INDEX "mta"."DM_ChungChiTinHoc_sTen_key";

-- DropIndex
DROP INDEX "mta"."DM_DanToc_sTen_key";

-- DropIndex
DROP INDEX "mta"."DM_DonViHanhChinh_sTen_key";

-- DropIndex
DROP INDEX "mta"."DM_HocHam_sTen_key";

-- DropIndex
DROP INDEX "mta"."DM_HocVi_sTen_key";

-- DropIndex
DROP INDEX "mta"."DM_KhuVuc_DiaLy_sTen_key";

-- DropIndex
DROP INDEX "mta"."DM_NgoaiNgu_sTen_key";

-- DropIndex
DROP INDEX "mta"."DM_NhanVien_sCCCD_key";

-- DropIndex
DROP INDEX "mta"."DM_NhomNguoiDung_sTen_key";

-- DropIndex
DROP INDEX "mta"."DM_NhomUngDung_sTen_key";

-- DropIndex
DROP INDEX "mta"."DM_PhanCap_ChatLuong_TrangThietBi_sTen_key";

-- DropIndex
DROP INDEX "mta"."DM_PhanLoai_CSKT_sTen_key";

-- DropIndex
DROP INDEX "mta"."DM_QuanHuyen_sDM_TinhId_sTen_key";

-- DropIndex
DROP INDEX "mta"."DM_QuocGia_sTen_key";

-- DropIndex
DROP INDEX "mta"."DM_Tinh_sTen_key";

-- DropIndex
DROP INDEX "mta"."DM_TonGiao_sTen_key";

-- DropIndex
DROP INDEX "mta"."DM_TrinhDoNgoaiNgu_sTen_key";

-- DropIndex
DROP INDEX "mta"."DM_TrinhDoTinHoc_sTen_key";

-- DropIndex
DROP INDEX "mta"."DM_ViTriCongViec_sTen_key";

-- DropIndex
DROP INDEX "mta"."DM_XaPhuong_sDM_QuanHuyenId_sTen_key";

-- AlterTable
ALTER TABLE "mta"."DM_CapBac" ALTER COLUMN "sTen" DROP NOT NULL;

-- AlterTable
ALTER TABLE "mta"."DM_ChucDanh" ALTER COLUMN "sTen" DROP NOT NULL;

-- AlterTable
ALTER TABLE "mta"."DM_ChucVu" ALTER COLUMN "sTen" DROP NOT NULL;

-- AlterTable
ALTER TABLE "mta"."DM_ChungChiTinHoc" ALTER COLUMN "sTen" DROP NOT NULL;

-- AlterTable
ALTER TABLE "mta"."DM_DanToc" ALTER COLUMN "sTen" DROP NOT NULL;

-- AlterTable
ALTER TABLE "mta"."DM_DonVi" ALTER COLUMN "sTen" DROP NOT NULL;

-- AlterTable
ALTER TABLE "mta"."DM_DonViHanhChinh" ALTER COLUMN "sTen" DROP NOT NULL;

-- AlterTable
ALTER TABLE "mta"."DM_HocHam" ALTER COLUMN "sTen" DROP NOT NULL;

-- AlterTable
ALTER TABLE "mta"."DM_HocVi" ALTER COLUMN "sTen" DROP NOT NULL;

-- AlterTable
ALTER TABLE "mta"."DM_KhuVuc_DiaLy" ALTER COLUMN "sTen" DROP NOT NULL;

-- AlterTable
ALTER TABLE "mta"."DM_NgoaiNgu" ALTER COLUMN "sTen" DROP NOT NULL;

-- AlterTable
ALTER TABLE "mta"."DM_NhomNguoiDung" ALTER COLUMN "sTen" DROP NOT NULL;

-- AlterTable
ALTER TABLE "mta"."DM_NhomUngDung" ALTER COLUMN "sTen" DROP NOT NULL;

-- AlterTable
ALTER TABLE "mta"."DM_PhanCap_ChatLuong_TrangThietBi" ALTER COLUMN "sTen" DROP NOT NULL;

-- AlterTable
ALTER TABLE "mta"."DM_PhanLoai_CSKT" ALTER COLUMN "sTen" DROP NOT NULL;

-- AlterTable
ALTER TABLE "mta"."DM_QuanHuyen" ALTER COLUMN "sTen" DROP NOT NULL;

-- AlterTable
ALTER TABLE "mta"."DM_QuocGia" ALTER COLUMN "sTen" DROP NOT NULL;

-- AlterTable
ALTER TABLE "mta"."DM_Tinh" ALTER COLUMN "sTen" DROP NOT NULL;

-- AlterTable
ALTER TABLE "mta"."DM_TonGiao" ALTER COLUMN "sTen" DROP NOT NULL;

-- AlterTable
ALTER TABLE "mta"."DM_TrinhDoNgoaiNgu" ALTER COLUMN "sTen" DROP NOT NULL;

-- AlterTable
ALTER TABLE "mta"."DM_TrinhDoTinHoc" ALTER COLUMN "sTen" DROP NOT NULL;

-- AlterTable
ALTER TABLE "mta"."DM_ViTriCongViec" ALTER COLUMN "sTen" DROP NOT NULL;

-- AlterTable
ALTER TABLE "mta"."DM_XaPhuong" ALTER COLUMN "sTen" DROP NOT NULL;

-- DropTable
DROP TABLE "mta"."DM_VaiTro";

-- DropTable
DROP TABLE "mta"."NguoiDungTrongNhom";

-- DropTable
DROP TABLE "mta"."NhatKyHoatDong";

-- DropTable
DROP TABLE "mta"."Policy";

-- DropTable
DROP TABLE "mta"."Quyen_VaiTro";

-- DropTable
DROP TABLE "mta"."TaiKhoan";

-- DropTable
DROP TABLE "mta"."VaiTroTrongNhom";
