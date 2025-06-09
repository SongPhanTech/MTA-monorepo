/*
  Warnings:

  - You are about to drop the `CurriculumVersionSubject` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "ql-dao-tao"."CurriculumVersionSubject" DROP CONSTRAINT "CurriculumVersionSubject_subjectId_fkey";

-- DropForeignKey
ALTER TABLE "ql-dao-tao"."CurriculumVersionSubject" DROP CONSTRAINT "CurriculumVersionSubject_trainingBlockId_fkey";

-- DropTable
DROP TABLE "ql-dao-tao"."CurriculumVersionSubject";

-- CreateTable
CREATE TABLE "ql-dao-tao"."TrainingBlockSubject" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "subjectId" TEXT NOT NULL,
    "trainingBlockId" TEXT NOT NULL,
    "semester" INTEGER,
    "type" "ql-dao-tao"."CurriculumVersionSubjectType" NOT NULL DEFAULT 'None',
    "information" TEXT,
    "documentPath" TEXT,
    "renderPath" TEXT,

    CONSTRAINT "TrainingBlockSubject_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TrainingBlockSubject_code_key" ON "ql-dao-tao"."TrainingBlockSubject"("code");

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."TrainingBlockSubject" ADD CONSTRAINT "TrainingBlockSubject_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "ql-dao-tao"."SubjectVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."TrainingBlockSubject" ADD CONSTRAINT "TrainingBlockSubject_trainingBlockId_fkey" FOREIGN KEY ("trainingBlockId") REFERENCES "ql-dao-tao"."TrainingBlock"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
