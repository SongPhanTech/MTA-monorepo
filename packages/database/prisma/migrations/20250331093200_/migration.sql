/*
  Warnings:

  - You are about to drop the column `isDeleted` on the `AcademicDegreeType` table. All the data in the column will be lost.
  - You are about to drop the column `isDeleted` on the `AcademicRankType` table. All the data in the column will be lost.
  - You are about to drop the column `isDeleted` on the `BlockedIp` table. All the data in the column will be lost.
  - You are about to drop the column `isDeleted` on the `Commune` table. All the data in the column will be lost.
  - You are about to drop the column `isDeleted` on the `Config` table. All the data in the column will be lost.
  - You are about to drop the column `isDeleted` on the `District` table. All the data in the column will be lost.
  - You are about to drop the column `isDeleted` on the `Feedback` table. All the data in the column will be lost.
  - You are about to drop the column `isDeleted` on the `Group` table. All the data in the column will be lost.
  - You are about to drop the column `isDeleted` on the `Level` table. All the data in the column will be lost.
  - You are about to drop the column `isDeleted` on the `Organization` table. All the data in the column will be lost.
  - You are about to drop the column `isDeleted` on the `OrganizationType` table. All the data in the column will be lost.
  - You are about to drop the column `isDeleted` on the `Permission` table. All the data in the column will be lost.
  - You are about to drop the column `isDeleted` on the `Position` table. All the data in the column will be lost.
  - You are about to drop the column `isDeleted` on the `Province` table. All the data in the column will be lost.
  - You are about to drop the column `isDeleted` on the `Rank` table. All the data in the column will be lost.
  - You are about to drop the column `isDeleted` on the `Role` table. All the data in the column will be lost.
  - You are about to drop the column `isDeleted` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "AcademicDegreeType" DROP COLUMN "isDeleted";

-- AlterTable
ALTER TABLE "AcademicRankType" DROP COLUMN "isDeleted";

-- AlterTable
ALTER TABLE "BlockedIp" DROP COLUMN "isDeleted";

-- AlterTable
ALTER TABLE "Commune" DROP COLUMN "isDeleted";

-- AlterTable
ALTER TABLE "Config" DROP COLUMN "isDeleted";

-- AlterTable
ALTER TABLE "District" DROP COLUMN "isDeleted";

-- AlterTable
ALTER TABLE "Feedback" DROP COLUMN "isDeleted";

-- AlterTable
ALTER TABLE "Group" DROP COLUMN "isDeleted";

-- AlterTable
ALTER TABLE "Level" DROP COLUMN "isDeleted";

-- AlterTable
ALTER TABLE "Organization" DROP COLUMN "isDeleted";

-- AlterTable
ALTER TABLE "OrganizationType" DROP COLUMN "isDeleted";

-- AlterTable
ALTER TABLE "Permission" DROP COLUMN "isDeleted";

-- AlterTable
ALTER TABLE "Position" DROP COLUMN "isDeleted";

-- AlterTable
ALTER TABLE "Province" DROP COLUMN "isDeleted";

-- AlterTable
ALTER TABLE "Rank" DROP COLUMN "isDeleted";

-- AlterTable
ALTER TABLE "Role" DROP COLUMN "isDeleted";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "isDeleted";
