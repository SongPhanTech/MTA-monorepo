/*
  Warnings:

  - You are about to drop the column `communecurrentAddressId` on the `UserProfile` table. All the data in the column will be lost.
  - You are about to drop the column `districtcurrentAddressId` on the `UserProfile` table. All the data in the column will be lost.
  - Made the column `userProfileId` on table `Student` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "ql-dao-tao"."Student" DROP CONSTRAINT "Student_userProfileId_fkey";

-- DropForeignKey
ALTER TABLE "ql-nguoi-dung"."UserProfile" DROP CONSTRAINT "UserProfile_communecurrentAddressId_fkey";

-- DropForeignKey
ALTER TABLE "ql-nguoi-dung"."UserProfile" DROP CONSTRAINT "UserProfile_districtcurrentAddressId_fkey";

-- AlterTable
ALTER TABLE "ql-dao-tao"."Student" ALTER COLUMN "userProfileId" SET NOT NULL;

-- AlterTable
ALTER TABLE "ql-nguoi-dung"."UserProfile" DROP COLUMN "communecurrentAddressId",
DROP COLUMN "districtcurrentAddressId",
ADD COLUMN     "communeCurrentAddressId" TEXT,
ADD COLUMN     "districtCurrentAddressId" TEXT;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."Student" ADD CONSTRAINT "Student_userProfileId_fkey" FOREIGN KEY ("userProfileId") REFERENCES "ql-nguoi-dung"."UserProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-nguoi-dung"."UserProfile" ADD CONSTRAINT "UserProfile_districtCurrentAddressId_fkey" FOREIGN KEY ("districtCurrentAddressId") REFERENCES "ql-danh-muc"."DM_QuanHuyen"("Id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-nguoi-dung"."UserProfile" ADD CONSTRAINT "UserProfile_communeCurrentAddressId_fkey" FOREIGN KEY ("communeCurrentAddressId") REFERENCES "ql-danh-muc"."DM_XaPhuong"("Id") ON DELETE SET NULL ON UPDATE CASCADE;
