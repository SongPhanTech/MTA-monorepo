/*
  Warnings:

  - You are about to drop the column `sTen` on the `DM_NhanVien` table. All the data in the column will be lost.
  - You are about to drop the column `bonusGrade` on the `Scholarship` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "ql-danh-muc"."DM_NhanVien" DROP COLUMN "sTen";

-- AlterTable
ALTER TABLE "ql-dao-tao"."Scholarship" DROP COLUMN "bonusGrade",
ALTER COLUMN "effectiveFrom" DROP NOT NULL;
