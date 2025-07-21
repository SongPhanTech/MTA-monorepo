/*
  Warnings:

  - A unique constraint covering the columns `[sCCCD]` on the table `DM_NhanVien` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "mta"."DM_DonVi" DROP CONSTRAINT "FK_DM_DonVi_iParentId_DM_DonVi_Id";

-- AlterTable
ALTER TABLE "mta"."DM_NhanVien" ADD COLUMN     "sCCCD" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "DM_NhanVien_sCCCD_key" ON "mta"."DM_NhanVien"("sCCCD");
