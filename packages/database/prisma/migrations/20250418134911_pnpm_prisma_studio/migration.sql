-- AlterTable
ALTER TABLE "tro-ly-ao"."Document" ADD COLUMN     "fileSize" INTEGER;

-- CreateTable
CREATE TABLE "ql-dao-tao"."PrerequisiteSubject" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "curriculumVersionSubjectId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,

    CONSTRAINT "PrerequisiteSubject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-dao-tao"."CoRequisiteSubject" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "curriculumVersionSubjectId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,

    CONSTRAINT "CoRequisiteSubject_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."PrerequisiteSubject" ADD CONSTRAINT "PrerequisiteSubject_curriculumVersionSubjectId_fkey" FOREIGN KEY ("curriculumVersionSubjectId") REFERENCES "ql-dao-tao"."CurriculumVersionSubject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."PrerequisiteSubject" ADD CONSTRAINT "PrerequisiteSubject_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "ql-dao-tao"."Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."CoRequisiteSubject" ADD CONSTRAINT "CoRequisiteSubject_curriculumVersionSubjectId_fkey" FOREIGN KEY ("curriculumVersionSubjectId") REFERENCES "ql-dao-tao"."CurriculumVersionSubject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."CoRequisiteSubject" ADD CONSTRAINT "CoRequisiteSubject_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "ql-dao-tao"."Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
