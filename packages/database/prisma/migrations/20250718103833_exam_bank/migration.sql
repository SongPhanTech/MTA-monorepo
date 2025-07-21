/*
  Warnings:

  - You are about to drop the column `subjectVersionId` on the `Exam` table. All the data in the column will be lost.
  - You are about to drop the column `sessionId` on the `ExamSessionQuestion` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[examBankId,questionId]` on the table `ExamSessionQuestion` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[examBankId,order]` on the table `ExamSessionQuestion` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `questionBankId` to the `Exam` table without a default value. This is not possible if the table is not empty.
  - Added the required column `examBankId` to the `ExamSessionQuestion` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "khao-thi"."Exam" DROP CONSTRAINT "Exam_subjectVersionId_fkey";

-- DropForeignKey
ALTER TABLE "khao-thi"."ExamSessionQuestion" DROP CONSTRAINT "ExamSessionQuestion_sessionId_fkey";

-- DropForeignKey
ALTER TABLE "mta"."DM_DonVi" DROP CONSTRAINT "FK_DM_DonVi_iParentId_DM_DonVi_Id";

-- DropForeignKey
ALTER TABLE "mta"."DM_NhanVien" DROP CONSTRAINT "FK_DM_NhanVien_DM_DonVi";

-- DropForeignKey
ALTER TABLE "mta"."DM_NhanVien" DROP CONSTRAINT "FK_DM_NhanVien_DM_ViTriCongViec";

-- DropForeignKey
ALTER TABLE "mta"."DM_QuanHuyen" DROP CONSTRAINT "DM_QuanHuyen_iDM_DonViHanhChinhId_fkey";

-- DropForeignKey
ALTER TABLE "mta"."DM_QuanHuyen" DROP CONSTRAINT "DM_QuanHuyen_sDM_TinhId_fkey";

-- DropForeignKey
ALTER TABLE "mta"."DM_Tinh" DROP CONSTRAINT "DM_Tinh_iDM_DonViHanhChinhId_fkey";

-- DropForeignKey
ALTER TABLE "mta"."DM_Tinh" DROP CONSTRAINT "DM_Tinh_iDM_KhuVucDiaLy_Id_fkey";

-- DropForeignKey
ALTER TABLE "mta"."DM_Tinh" DROP CONSTRAINT "DM_Tinh_sDM_QuocGiaId_fkey";

-- DropForeignKey
ALTER TABLE "mta"."DM_ViTriCongViec" DROP CONSTRAINT "FK_DM_ViTriCongViec_DM_ChucDanh";

-- DropForeignKey
ALTER TABLE "mta"."DM_XaPhuong" DROP CONSTRAINT "DM_XaPhuong_iDM_DonViHanhChinhId_fkey";

-- DropForeignKey
ALTER TABLE "mta"."DM_XaPhuong" DROP CONSTRAINT "DM_XaPhuong_sDM_QuanHuyenId_fkey";

-- DropForeignKey
ALTER TABLE "mta"."DM_XaPhuong" DROP CONSTRAINT "DM_XaPhuong_sDM_TinhId_fkey";

-- DropForeignKey
ALTER TABLE "mta"."NguoiDungTrongNhom" DROP CONSTRAINT "FK_NguoiDungTrongNhom_DM_NhanVien";

-- DropForeignKey
ALTER TABLE "mta"."NguoiDungTrongNhom" DROP CONSTRAINT "FK_NguoiDungTrongNhom_DM_NhomNguoiDung";

-- DropForeignKey
ALTER TABLE "mta"."NhatKyHoatDong" DROP CONSTRAINT "FK_Quyen_VaiTro_DM_NhanVien";

-- DropForeignKey
ALTER TABLE "mta"."Quyen_VaiTro" DROP CONSTRAINT "FK_Quyen_VaiTro_DM_NhanVien";

-- DropForeignKey
ALTER TABLE "mta"."Quyen_VaiTro" DROP CONSTRAINT "FK_Quyen_VaiTro_DM_VaiTro";

-- DropForeignKey
ALTER TABLE "mta"."TaiKhoan" DROP CONSTRAINT "FK_TaiKhoan_DM_NhanVien";

-- DropForeignKey
ALTER TABLE "mta"."VaiTroTrongNhom" DROP CONSTRAINT "FK_VaiTroTrongNhom_DM_VaiTro";

-- DropForeignKey
ALTER TABLE "mta"."VaiTroTrongNhom" DROP CONSTRAINT "VaiTroTrongNhom_sDM_NhomNguoiDungId_fkey";

-- DropIndex
DROP INDEX "khao-thi"."ExamSessionQuestion_sessionId_order_key";

-- DropIndex
DROP INDEX "khao-thi"."ExamSessionQuestion_sessionId_questionId_key";

-- DropIndex
DROP INDEX "mta"."DM_CapBac_sMa_key";

-- DropIndex
DROP INDEX "mta"."DM_ChucDanh_sMa_key";

-- DropIndex
DROP INDEX "mta"."DM_ChucVu_sMa_key";

-- DropIndex
DROP INDEX "mta"."DM_ChungChiTinHoc_sMa_key";

-- DropIndex
DROP INDEX "mta"."DM_DanToc_sMa_key";

-- DropIndex
DROP INDEX "mta"."DM_DonVi_sMa_key";

-- DropIndex
DROP INDEX "mta"."DM_DonViHanhChinh_sMa_key";

-- DropIndex
DROP INDEX "mta"."DM_HocHam_sMa_key";

-- DropIndex
DROP INDEX "mta"."DM_HocVi_sMa_key";

-- DropIndex
DROP INDEX "mta"."DM_KhuVuc_DiaLy_sMa_key";

-- DropIndex
DROP INDEX "mta"."DM_NgoaiNgu_sMa_key";

-- DropIndex
DROP INDEX "mta"."DM_NhanVien_sMa_key";

-- DropIndex
DROP INDEX "mta"."DM_NhomNguoiDung_sMa_key";

-- DropIndex
DROP INDEX "mta"."DM_NhomUngDung_sMa_key";

-- DropIndex
DROP INDEX "mta"."DM_PhanCap_ChatLuong_TrangThietBi_sMa_key";

-- DropIndex
DROP INDEX "mta"."DM_PhanLoai_CSKT_sMa_key";

-- DropIndex
DROP INDEX "mta"."DM_QuanHuyen_sMa_key";

-- DropIndex
DROP INDEX "mta"."DM_QuocGia_sMa_key";

-- DropIndex
DROP INDEX "mta"."DM_Tinh_sMa_key";

-- DropIndex
DROP INDEX "mta"."DM_TonGiao_sMa_key";

-- DropIndex
DROP INDEX "mta"."DM_TrinhDoNgoaiNgu_sMa_key";

-- DropIndex
DROP INDEX "mta"."DM_TrinhDoTinHoc_sMa_key";

-- DropIndex
DROP INDEX "mta"."DM_VaiTro_sMa_key";

-- DropIndex
DROP INDEX "mta"."DM_ViTriCongViec_sMa_key";

-- DropIndex
DROP INDEX "mta"."DM_XaPhuong_sMa_key";

-- DropIndex
DROP INDEX "mta"."NguoiDungTrongNhom_sMa_key";

-- DropIndex
DROP INDEX "mta"."NhatKyHoatDong_sMa_key";

-- DropIndex
DROP INDEX "mta"."Policy_sMa_key";

-- DropIndex
DROP INDEX "mta"."Quyen_VaiTro_sMa_key";

-- DropIndex
DROP INDEX "mta"."TaiKhoan_sMa_key";

-- DropIndex
DROP INDEX "mta"."VaiTroTrongNhom_sMa_key";

-- AlterTable
ALTER TABLE "khao-thi"."Exam" DROP COLUMN "subjectVersionId",
ADD COLUMN     "questionBankId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "khao-thi"."ExamSession" ADD COLUMN     "examBankId" TEXT;

-- AlterTable
ALTER TABLE "khao-thi"."ExamSessionQuestion" DROP COLUMN "sessionId",
ADD COLUMN     "examBankId" TEXT NOT NULL,
ALTER COLUMN "order" DROP NOT NULL;

-- CreateTable
CREATE TABLE "khao-thi"."ExamBank" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "ExamBank_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ExamBank_code_key" ON "khao-thi"."ExamBank"("code");

-- CreateIndex
CREATE UNIQUE INDEX "ExamSessionQuestion_examBankId_questionId_key" ON "khao-thi"."ExamSessionQuestion"("examBankId", "questionId");

-- CreateIndex
CREATE UNIQUE INDEX "ExamSessionQuestion_examBankId_order_key" ON "khao-thi"."ExamSessionQuestion"("examBankId", "order");

-- AddForeignKey
ALTER TABLE "khao-thi"."Exam" ADD CONSTRAINT "Exam_questionBankId_fkey" FOREIGN KEY ("questionBankId") REFERENCES "khao-thi"."QuestionBank"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "khao-thi"."ExamSession" ADD CONSTRAINT "ExamSession_examBankId_fkey" FOREIGN KEY ("examBankId") REFERENCES "khao-thi"."ExamBank"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "khao-thi"."ExamSessionQuestion" ADD CONSTRAINT "ExamSessionQuestion_examBankId_fkey" FOREIGN KEY ("examBankId") REFERENCES "khao-thi"."ExamBank"("id") ON DELETE CASCADE ON UPDATE CASCADE;
