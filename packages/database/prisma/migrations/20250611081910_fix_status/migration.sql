/*
  Warnings:

  - You are about to drop the column `status` on the `Curriculum` table. All the data in the column will be lost.
  - The `status` column on the `Student` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `status` on the `TrainingCourse` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "ql-dao-tao"."StudentStatus" AS ENUM ('ENROLLED', 'GRADUATED', 'DEFERRED_STUDY', 'SUSPENDED_STUDY', 'WITHDRAWN', 'TRANSFERRED', 'PENDING_GRADUATION_REVIEW', 'ACADEMIC_SUSPENSION');

-- AlterTable
ALTER TABLE "ql-dao-tao"."Curriculum" DROP COLUMN "status";

-- AlterTable
ALTER TABLE "ql-dao-tao"."Student" DROP COLUMN "status",
ADD COLUMN     "status" "ql-dao-tao"."StudentStatus" NOT NULL DEFAULT 'ENROLLED';

-- AlterTable
ALTER TABLE "ql-dao-tao"."TrainingCourse" DROP COLUMN "status";

-- DropEnum
DROP TYPE "ql-dao-tao"."CurriculumStatus";

-- DropEnum
DROP TYPE "ql-dao-tao"."TrainingCourseStatus";

-- DropEnum
DROP TYPE "ql-nguoi-dung"."FixedClassStudentStatus";
