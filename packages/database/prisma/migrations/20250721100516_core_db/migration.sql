/*
  Warnings:

  - The `sTruongDonVi` column on the `DM_DonVi` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "mta"."DM_ChucVu" ADD COLUMN     "iNhomChucVu" INTEGER DEFAULT 0;

-- AlterTable
ALTER TABLE "mta"."DM_ChungChiTinHoc" ADD COLUMN     "sDoiTuong" TEXT,
ADD COLUMN     "sGiaTri" TEXT,
ADD COLUMN     "sNguonCap" TEXT,
ADD COLUMN     "sNoiDung" TEXT;

-- AlterTable
ALTER TABLE "mta"."DM_DonVi" DROP COLUMN "sTruongDonVi",
ADD COLUMN     "sTruongDonVi" UUID;
