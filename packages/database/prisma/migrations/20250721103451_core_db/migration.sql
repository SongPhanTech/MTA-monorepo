/*
  Warnings:

  - The `iDM_DonViHanhChinhId` column on the `DM_QuanHuyen` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `iDM_KhuVucDiaLy_Id` column on the `DM_Tinh` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `iDM_DonViHanhChinhId` column on the `DM_Tinh` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `iDM_DonViHanhChinhId` column on the `DM_XaPhuong` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "mta"."DM_QuanHuyen" DROP COLUMN "iDM_DonViHanhChinhId",
ADD COLUMN     "iDM_DonViHanhChinhId" INTEGER;

-- AlterTable
ALTER TABLE "mta"."DM_Tinh" DROP COLUMN "iDM_KhuVucDiaLy_Id",
ADD COLUMN     "iDM_KhuVucDiaLy_Id" INTEGER,
DROP COLUMN "iDM_DonViHanhChinhId",
ADD COLUMN     "iDM_DonViHanhChinhId" INTEGER;

-- AlterTable
ALTER TABLE "mta"."DM_XaPhuong" DROP COLUMN "iDM_DonViHanhChinhId",
ADD COLUMN     "iDM_DonViHanhChinhId" INTEGER;
