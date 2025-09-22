-- AlterTable
ALTER TABLE "ql-dao-tao"."SubjectVersion" ADD COLUMN     "codeTkb" TEXT;

-- CreateTable
CREATE TABLE "ql-dao-tao"."TrainingCourseRegulation" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "trainingCourseId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "TrainingCourseRegulation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TrainingCourseRegulation_code_key" ON "ql-dao-tao"."TrainingCourseRegulation"("code");

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."TrainingCourseRegulation" ADD CONSTRAINT "TrainingCourseRegulation_trainingCourseId_fkey" FOREIGN KEY ("trainingCourseId") REFERENCES "ql-dao-tao"."TrainingCourse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
