/*
  Warnings:

  - You are about to drop the column `sTen` on the `NguoiDungTrongNhom` table. All the data in the column will be lost.
  - You are about to drop the column `sTen` on the `NhatKyHoatDong` table. All the data in the column will be lost.
  - You are about to drop the column `sTen` on the `VaiTroTrongNhom` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[sMa]` on the table `DM_CapBac` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[sTen]` on the table `DM_CapBac` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[sMa]` on the table `DM_ChucDanh` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[sTen]` on the table `DM_ChucDanh` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[sMa]` on the table `DM_ChucVu` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[sTen]` on the table `DM_ChucVu` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[sMa]` on the table `DM_ChungChiTinHoc` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[sTen]` on the table `DM_ChungChiTinHoc` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[sMa]` on the table `DM_DanToc` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[sTen]` on the table `DM_DanToc` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[sMa]` on the table `DM_DonVi` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[sTen]` on the table `DM_DonVi` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[sCode]` on the table `DM_DonVi` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[sMa]` on the table `DM_DonViHanhChinh` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[sTen]` on the table `DM_DonViHanhChinh` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[sMa]` on the table `DM_HocHam` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[sTen]` on the table `DM_HocHam` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[sMa]` on the table `DM_HocVi` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[sTen]` on the table `DM_HocVi` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[sMa]` on the table `DM_KhuVuc_DiaLy` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[sTen]` on the table `DM_KhuVuc_DiaLy` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[sMa]` on the table `DM_NgoaiNgu` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[sTen]` on the table `DM_NgoaiNgu` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[sMa]` on the table `DM_NhanVien` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[sMa]` on the table `DM_NhomNguoiDung` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[sTen]` on the table `DM_NhomNguoiDung` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[sMa]` on the table `DM_NhomUngDung` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[sTen]` on the table `DM_NhomUngDung` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[sMa]` on the table `DM_QuanHuyen` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[sDM_TinhId,sTen]` on the table `DM_QuanHuyen` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[sMa]` on the table `DM_QuocGia` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[sTen]` on the table `DM_QuocGia` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[sMa]` on the table `DM_Tinh` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[sTen]` on the table `DM_Tinh` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[sMa]` on the table `DM_TonGiao` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[sTen]` on the table `DM_TonGiao` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[sMa]` on the table `DM_TrinhDoNgoaiNgu` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[sTen]` on the table `DM_TrinhDoNgoaiNgu` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[sMa]` on the table `DM_TrinhDoTinHoc` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[sTen]` on the table `DM_TrinhDoTinHoc` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[sMa]` on the table `DM_UngDung` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[sTen]` on the table `DM_UngDung` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[sMa]` on the table `DM_VaiTro` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[sTen]` on the table `DM_VaiTro` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[sMa]` on the table `DM_ViTriCongViec` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[sTen]` on the table `DM_ViTriCongViec` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[sMa]` on the table `DM_XaPhuong` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[sDM_QuanHuyenId,sTen]` on the table `DM_XaPhuong` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[sMa]` on the table `NguoiDungTrongNhom` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[sMa]` on the table `NhatKyHoatDong` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[sMa]` on the table `Policy` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[sTen]` on the table `Policy` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[sMa]` on the table `Quyen_VaiTro` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[sTen]` on the table `Quyen_VaiTro` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[sMa]` on the table `TaiKhoan` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[sUserName]` on the table `TaiKhoan` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[sMa]` on the table `VaiTroTrongNhom` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[name]` on the table `TrainingField` will be added. If there are existing duplicate values, this will fail.
  - Made the column `sTen` on table `DM_CapBac` required. This step will fail if there are existing NULL values in that column.
  - Made the column `sTen` on table `DM_ChucDanh` required. This step will fail if there are existing NULL values in that column.
  - Made the column `sTen` on table `DM_ChucVu` required. This step will fail if there are existing NULL values in that column.
  - Made the column `sTen` on table `DM_ChungChiTinHoc` required. This step will fail if there are existing NULL values in that column.
  - Made the column `sTen` on table `DM_DanToc` required. This step will fail if there are existing NULL values in that column.
  - Made the column `sTen` on table `DM_DonVi` required. This step will fail if there are existing NULL values in that column.
  - Made the column `sTen` on table `DM_DonViHanhChinh` required. This step will fail if there are existing NULL values in that column.
  - Made the column `sTen` on table `DM_HocHam` required. This step will fail if there are existing NULL values in that column.
  - Made the column `sTen` on table `DM_HocVi` required. This step will fail if there are existing NULL values in that column.
  - Made the column `sTen` on table `DM_KhuVuc_DiaLy` required. This step will fail if there are existing NULL values in that column.
  - Made the column `sTen` on table `DM_NgoaiNgu` required. This step will fail if there are existing NULL values in that column.
  - Made the column `sTen` on table `DM_NhanVien` required. This step will fail if there are existing NULL values in that column.
  - Made the column `sTen` on table `DM_NhomNguoiDung` required. This step will fail if there are existing NULL values in that column.
  - Made the column `sTen` on table `DM_NhomUngDung` required. This step will fail if there are existing NULL values in that column.
  - Made the column `sTen` on table `DM_QuanHuyen` required. This step will fail if there are existing NULL values in that column.
  - Made the column `sTen` on table `DM_QuocGia` required. This step will fail if there are existing NULL values in that column.
  - Made the column `sTen` on table `DM_Tinh` required. This step will fail if there are existing NULL values in that column.
  - Made the column `sTen` on table `DM_TonGiao` required. This step will fail if there are existing NULL values in that column.
  - Made the column `sTen` on table `DM_TrinhDoNgoaiNgu` required. This step will fail if there are existing NULL values in that column.
  - Made the column `sTen` on table `DM_TrinhDoTinHoc` required. This step will fail if there are existing NULL values in that column.
  - Made the column `sTen` on table `DM_UngDung` required. This step will fail if there are existing NULL values in that column.
  - Made the column `sTen` on table `DM_VaiTro` required. This step will fail if there are existing NULL values in that column.
  - Made the column `sTen` on table `DM_ViTriCongViec` required. This step will fail if there are existing NULL values in that column.
  - Made the column `sTen` on table `DM_XaPhuong` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `size` to the `DocumentFile` table without a default value. This is not possible if the table is not empty.
  - Made the column `sTen` on table `Policy` required. This step will fail if there are existing NULL values in that column.
  - Made the column `sTen` on table `Quyen_VaiTro` required. This step will fail if there are existing NULL values in that column.
  - Made the column `sTen` on table `TaiKhoan` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX "ql-danh-muc"."DocumentFile_path_key";

-- AlterTable
ALTER TABLE "ql-danh-muc"."DM_CapBac" ALTER COLUMN "sTen" SET NOT NULL;

-- AlterTable
ALTER TABLE "ql-danh-muc"."DM_ChucDanh" ALTER COLUMN "sTen" SET NOT NULL;

-- AlterTable
ALTER TABLE "ql-danh-muc"."DM_ChucVu" ALTER COLUMN "sTen" SET NOT NULL;

-- AlterTable
ALTER TABLE "ql-danh-muc"."DM_ChungChiTinHoc" ALTER COLUMN "sTen" SET NOT NULL;

-- AlterTable
ALTER TABLE "ql-danh-muc"."DM_DanToc" ALTER COLUMN "sTen" SET NOT NULL;

-- AlterTable
ALTER TABLE "ql-danh-muc"."DM_DonVi" ALTER COLUMN "sTen" SET NOT NULL;

-- AlterTable
ALTER TABLE "ql-danh-muc"."DM_DonViHanhChinh" ALTER COLUMN "sTen" SET NOT NULL;

-- AlterTable
ALTER TABLE "ql-danh-muc"."DM_HocHam" ALTER COLUMN "sTen" SET NOT NULL;

-- AlterTable
ALTER TABLE "ql-danh-muc"."DM_HocVi" ALTER COLUMN "sTen" SET NOT NULL;

-- AlterTable
ALTER TABLE "ql-danh-muc"."DM_KhuVuc_DiaLy" ALTER COLUMN "sTen" SET NOT NULL;

-- AlterTable
ALTER TABLE "ql-danh-muc"."DM_NgoaiNgu" ALTER COLUMN "sTen" SET NOT NULL;

-- AlterTable
ALTER TABLE "ql-danh-muc"."DM_NhanVien" ALTER COLUMN "sTen" SET NOT NULL;

-- AlterTable
ALTER TABLE "ql-danh-muc"."DM_NhomNguoiDung" ALTER COLUMN "sTen" SET NOT NULL;

-- AlterTable
ALTER TABLE "ql-danh-muc"."DM_NhomUngDung" ALTER COLUMN "sTen" SET NOT NULL;

-- AlterTable
ALTER TABLE "ql-danh-muc"."DM_QuanHuyen" ALTER COLUMN "sTen" SET NOT NULL;

-- AlterTable
ALTER TABLE "ql-danh-muc"."DM_QuocGia" ALTER COLUMN "sTen" SET NOT NULL;

-- AlterTable
ALTER TABLE "ql-danh-muc"."DM_Tinh" ALTER COLUMN "sTen" SET NOT NULL;

-- AlterTable
ALTER TABLE "ql-danh-muc"."DM_TonGiao" ALTER COLUMN "sTen" SET NOT NULL;

-- AlterTable
ALTER TABLE "ql-danh-muc"."DM_TrinhDoNgoaiNgu" ALTER COLUMN "sTen" SET NOT NULL;

-- AlterTable
ALTER TABLE "ql-danh-muc"."DM_TrinhDoTinHoc" ALTER COLUMN "sTen" SET NOT NULL;

-- AlterTable
ALTER TABLE "ql-danh-muc"."DM_UngDung" ALTER COLUMN "sTen" SET NOT NULL;

-- AlterTable
ALTER TABLE "ql-danh-muc"."DM_VaiTro" ALTER COLUMN "sTen" SET NOT NULL;

-- AlterTable
ALTER TABLE "ql-danh-muc"."DM_ViTriCongViec" ALTER COLUMN "sTen" SET NOT NULL;

-- AlterTable
ALTER TABLE "ql-danh-muc"."DM_XaPhuong" ALTER COLUMN "sTen" SET NOT NULL;

-- AlterTable
ALTER TABLE "ql-danh-muc"."DocumentFile" ADD COLUMN     "size" BIGINT NOT NULL;

-- AlterTable
ALTER TABLE "ql-danh-muc"."NguoiDungTrongNhom" DROP COLUMN "sTen";

-- AlterTable
ALTER TABLE "ql-danh-muc"."NhatKyHoatDong" DROP COLUMN "sTen";

-- AlterTable
ALTER TABLE "ql-danh-muc"."Policy" ALTER COLUMN "sTen" SET NOT NULL;

-- AlterTable
ALTER TABLE "ql-danh-muc"."Quyen_VaiTro" ALTER COLUMN "sTen" SET NOT NULL;

-- AlterTable
ALTER TABLE "ql-danh-muc"."TaiKhoan" ALTER COLUMN "sTen" SET NOT NULL;

-- AlterTable
ALTER TABLE "ql-danh-muc"."VaiTroTrongNhom" DROP COLUMN "sTen";

-- CreateIndex
CREATE UNIQUE INDEX "DM_CapBac_sMa_key" ON "ql-danh-muc"."DM_CapBac"("sMa");

-- CreateIndex
CREATE UNIQUE INDEX "DM_CapBac_sTen_key" ON "ql-danh-muc"."DM_CapBac"("sTen");

-- CreateIndex
CREATE UNIQUE INDEX "DM_ChucDanh_sMa_key" ON "ql-danh-muc"."DM_ChucDanh"("sMa");

-- CreateIndex
CREATE UNIQUE INDEX "DM_ChucDanh_sTen_key" ON "ql-danh-muc"."DM_ChucDanh"("sTen");

-- CreateIndex
CREATE UNIQUE INDEX "DM_ChucVu_sMa_key" ON "ql-danh-muc"."DM_ChucVu"("sMa");

-- CreateIndex
CREATE UNIQUE INDEX "DM_ChucVu_sTen_key" ON "ql-danh-muc"."DM_ChucVu"("sTen");

-- CreateIndex
CREATE UNIQUE INDEX "DM_ChungChiTinHoc_sMa_key" ON "ql-danh-muc"."DM_ChungChiTinHoc"("sMa");

-- CreateIndex
CREATE UNIQUE INDEX "DM_ChungChiTinHoc_sTen_key" ON "ql-danh-muc"."DM_ChungChiTinHoc"("sTen");

-- CreateIndex
CREATE UNIQUE INDEX "DM_DanToc_sMa_key" ON "ql-danh-muc"."DM_DanToc"("sMa");

-- CreateIndex
CREATE UNIQUE INDEX "DM_DanToc_sTen_key" ON "ql-danh-muc"."DM_DanToc"("sTen");

-- CreateIndex
CREATE UNIQUE INDEX "DM_DonVi_sMa_key" ON "ql-danh-muc"."DM_DonVi"("sMa");

-- CreateIndex
CREATE UNIQUE INDEX "DM_DonVi_sTen_key" ON "ql-danh-muc"."DM_DonVi"("sTen");

-- CreateIndex
CREATE UNIQUE INDEX "DM_DonVi_sCode_key" ON "ql-danh-muc"."DM_DonVi"("sCode");

-- CreateIndex
CREATE UNIQUE INDEX "DM_DonViHanhChinh_sMa_key" ON "ql-danh-muc"."DM_DonViHanhChinh"("sMa");

-- CreateIndex
CREATE UNIQUE INDEX "DM_DonViHanhChinh_sTen_key" ON "ql-danh-muc"."DM_DonViHanhChinh"("sTen");

-- CreateIndex
CREATE UNIQUE INDEX "DM_HocHam_sMa_key" ON "ql-danh-muc"."DM_HocHam"("sMa");

-- CreateIndex
CREATE UNIQUE INDEX "DM_HocHam_sTen_key" ON "ql-danh-muc"."DM_HocHam"("sTen");

-- CreateIndex
CREATE UNIQUE INDEX "DM_HocVi_sMa_key" ON "ql-danh-muc"."DM_HocVi"("sMa");

-- CreateIndex
CREATE UNIQUE INDEX "DM_HocVi_sTen_key" ON "ql-danh-muc"."DM_HocVi"("sTen");

-- CreateIndex
CREATE UNIQUE INDEX "DM_KhuVuc_DiaLy_sMa_key" ON "ql-danh-muc"."DM_KhuVuc_DiaLy"("sMa");

-- CreateIndex
CREATE UNIQUE INDEX "DM_KhuVuc_DiaLy_sTen_key" ON "ql-danh-muc"."DM_KhuVuc_DiaLy"("sTen");

-- CreateIndex
CREATE UNIQUE INDEX "DM_NgoaiNgu_sMa_key" ON "ql-danh-muc"."DM_NgoaiNgu"("sMa");

-- CreateIndex
CREATE UNIQUE INDEX "DM_NgoaiNgu_sTen_key" ON "ql-danh-muc"."DM_NgoaiNgu"("sTen");

-- CreateIndex
CREATE UNIQUE INDEX "DM_NhanVien_sMa_key" ON "ql-danh-muc"."DM_NhanVien"("sMa");

-- CreateIndex
CREATE UNIQUE INDEX "DM_NhomNguoiDung_sMa_key" ON "ql-danh-muc"."DM_NhomNguoiDung"("sMa");

-- CreateIndex
CREATE UNIQUE INDEX "DM_NhomNguoiDung_sTen_key" ON "ql-danh-muc"."DM_NhomNguoiDung"("sTen");

-- CreateIndex
CREATE UNIQUE INDEX "DM_NhomUngDung_sMa_key" ON "ql-danh-muc"."DM_NhomUngDung"("sMa");

-- CreateIndex
CREATE UNIQUE INDEX "DM_NhomUngDung_sTen_key" ON "ql-danh-muc"."DM_NhomUngDung"("sTen");

-- CreateIndex
CREATE UNIQUE INDEX "DM_QuanHuyen_sMa_key" ON "ql-danh-muc"."DM_QuanHuyen"("sMa");

-- CreateIndex
CREATE UNIQUE INDEX "DM_QuanHuyen_sDM_TinhId_sTen_key" ON "ql-danh-muc"."DM_QuanHuyen"("sDM_TinhId", "sTen");

-- CreateIndex
CREATE UNIQUE INDEX "DM_QuocGia_sMa_key" ON "ql-danh-muc"."DM_QuocGia"("sMa");

-- CreateIndex
CREATE UNIQUE INDEX "DM_QuocGia_sTen_key" ON "ql-danh-muc"."DM_QuocGia"("sTen");

-- CreateIndex
CREATE UNIQUE INDEX "DM_Tinh_sMa_key" ON "ql-danh-muc"."DM_Tinh"("sMa");

-- CreateIndex
CREATE UNIQUE INDEX "DM_Tinh_sTen_key" ON "ql-danh-muc"."DM_Tinh"("sTen");

-- CreateIndex
CREATE UNIQUE INDEX "DM_TonGiao_sMa_key" ON "ql-danh-muc"."DM_TonGiao"("sMa");

-- CreateIndex
CREATE UNIQUE INDEX "DM_TonGiao_sTen_key" ON "ql-danh-muc"."DM_TonGiao"("sTen");

-- CreateIndex
CREATE UNIQUE INDEX "DM_TrinhDoNgoaiNgu_sMa_key" ON "ql-danh-muc"."DM_TrinhDoNgoaiNgu"("sMa");

-- CreateIndex
CREATE UNIQUE INDEX "DM_TrinhDoNgoaiNgu_sTen_key" ON "ql-danh-muc"."DM_TrinhDoNgoaiNgu"("sTen");

-- CreateIndex
CREATE UNIQUE INDEX "DM_TrinhDoTinHoc_sMa_key" ON "ql-danh-muc"."DM_TrinhDoTinHoc"("sMa");

-- CreateIndex
CREATE UNIQUE INDEX "DM_TrinhDoTinHoc_sTen_key" ON "ql-danh-muc"."DM_TrinhDoTinHoc"("sTen");

-- CreateIndex
CREATE UNIQUE INDEX "DM_UngDung_sMa_key" ON "ql-danh-muc"."DM_UngDung"("sMa");

-- CreateIndex
CREATE UNIQUE INDEX "DM_UngDung_sTen_key" ON "ql-danh-muc"."DM_UngDung"("sTen");

-- CreateIndex
CREATE UNIQUE INDEX "DM_VaiTro_sMa_key" ON "ql-danh-muc"."DM_VaiTro"("sMa");

-- CreateIndex
CREATE UNIQUE INDEX "DM_VaiTro_sTen_key" ON "ql-danh-muc"."DM_VaiTro"("sTen");

-- CreateIndex
CREATE UNIQUE INDEX "DM_ViTriCongViec_sMa_key" ON "ql-danh-muc"."DM_ViTriCongViec"("sMa");

-- CreateIndex
CREATE UNIQUE INDEX "DM_ViTriCongViec_sTen_key" ON "ql-danh-muc"."DM_ViTriCongViec"("sTen");

-- CreateIndex
CREATE UNIQUE INDEX "DM_XaPhuong_sMa_key" ON "ql-danh-muc"."DM_XaPhuong"("sMa");

-- CreateIndex
CREATE INDEX "IX_DM_XaPhuong_iDM_QuanHuyenId" ON "ql-danh-muc"."DM_XaPhuong"("sDM_QuanHuyenId");

-- CreateIndex
CREATE UNIQUE INDEX "DM_XaPhuong_sDM_QuanHuyenId_sTen_key" ON "ql-danh-muc"."DM_XaPhuong"("sDM_QuanHuyenId", "sTen");

-- CreateIndex
CREATE UNIQUE INDEX "NguoiDungTrongNhom_sMa_key" ON "ql-danh-muc"."NguoiDungTrongNhom"("sMa");

-- CreateIndex
CREATE UNIQUE INDEX "NhatKyHoatDong_sMa_key" ON "ql-danh-muc"."NhatKyHoatDong"("sMa");

-- CreateIndex
CREATE UNIQUE INDEX "Policy_sMa_key" ON "ql-danh-muc"."Policy"("sMa");

-- CreateIndex
CREATE UNIQUE INDEX "Policy_sTen_key" ON "ql-danh-muc"."Policy"("sTen");

-- CreateIndex
CREATE UNIQUE INDEX "Quyen_VaiTro_sMa_key" ON "ql-danh-muc"."Quyen_VaiTro"("sMa");

-- CreateIndex
CREATE UNIQUE INDEX "Quyen_VaiTro_sTen_key" ON "ql-danh-muc"."Quyen_VaiTro"("sTen");

-- CreateIndex
CREATE UNIQUE INDEX "TaiKhoan_sMa_key" ON "ql-danh-muc"."TaiKhoan"("sMa");

-- CreateIndex
CREATE UNIQUE INDEX "TaiKhoan_sUserName_key" ON "ql-danh-muc"."TaiKhoan"("sUserName");

-- CreateIndex
CREATE UNIQUE INDEX "VaiTroTrongNhom_sMa_key" ON "ql-danh-muc"."VaiTroTrongNhom"("sMa");

-- CreateIndex
CREATE UNIQUE INDEX "TrainingField_name_key" ON "ql-dao-tao"."TrainingField"("name");
