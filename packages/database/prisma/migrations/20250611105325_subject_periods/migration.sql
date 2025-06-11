/*
  Warnings:

  - You are about to drop the column `numberOfInternship` on the `SubjectVersion` table. All the data in the column will be lost.
  - You are about to drop the column `numberOfProject` on the `SubjectVersion` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "ql-dao-tao"."SubjectVersion" DROP COLUMN "numberOfInternship",
DROP COLUMN "numberOfProject",
ADD COLUMN     "numberOfExam" INTEGER,
ADD COLUMN     "numberOfPractical" INTEGER,
ADD COLUMN     "numberOfReview" INTEGER;
