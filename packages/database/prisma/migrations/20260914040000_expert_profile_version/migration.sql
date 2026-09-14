-- Migrate ExpertProfile -> Expert + ExpertProfileVersion
-- Giữ nguyên id Expert (= id ExpertProfile cũ).
-- Version đầu: id = 'v_' || expertId (ổn định để remap FK).

BEGIN;

-- 0) Guard: đã migrate thì bỏ qua
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'ql-dao-tao' AND table_name = 'Expert'
  ) THEN
    RAISE EXCEPTION 'Migration already applied: ql-dao-tao.Expert exists';
  END IF;
END $$;

-- 1) Đổi tên bảng identity
ALTER TABLE "ql-dao-tao"."ExpertProfile" RENAME TO "Expert";

ALTER INDEX IF EXISTS "ql-dao-tao"."ExpertProfile_pkey" RENAME TO "Expert_pkey";
ALTER INDEX IF EXISTS "ql-dao-tao"."ExpertProfile_code_key" RENAME TO "Expert_code_key";
ALTER INDEX IF EXISTS "ql-dao-tao"."ExpertProfile_lecturerId_key" RENAME TO "Expert_lecturerId_key";

ALTER TABLE "ql-dao-tao"."Expert" RENAME CONSTRAINT "ExpertProfile_lecturerId_fkey" TO "Expert_lecturerId_fkey";

-- Drop FKs học hàm/học vị (sẽ chuyển sang Version)
ALTER TABLE "ql-dao-tao"."Expert" DROP CONSTRAINT IF EXISTS "ExpertProfile_academicDegreeTypeId_fkey";
ALTER TABLE "ql-dao-tao"."Expert" DROP CONSTRAINT IF EXISTS "ExpertProfile_academicRankTypeId_fkey";

-- 2) Đổi tên bảng join M2M
ALTER TABLE "ql-dao-tao"."_ExpertProfileToTrainingMajor" RENAME TO "_ExpertToTrainingMajor";
ALTER TABLE "ql-dao-tao"."_ExpertProfileToSubjectClass" RENAME TO "_ExpertToSubjectClass";

ALTER INDEX IF EXISTS "ql-dao-tao"."_ExpertProfileToTrainingMajor_AB_pkey" RENAME TO "_ExpertToTrainingMajor_AB_pkey";
ALTER INDEX IF EXISTS "ql-dao-tao"."_ExpertProfileToSubjectClass_AB_pkey" RENAME TO "_ExpertToSubjectClass_AB_pkey";
ALTER INDEX IF EXISTS "ql-dao-tao"."_ExpertProfileToTrainingMajor_B_index" RENAME TO "_ExpertToTrainingMajor_B_index";
ALTER INDEX IF EXISTS "ql-dao-tao"."_ExpertProfileToSubjectClass_B_index" RENAME TO "_ExpertToSubjectClass_B_index";

ALTER TABLE "ql-dao-tao"."_ExpertToTrainingMajor"
  DROP CONSTRAINT IF EXISTS "_ExpertProfileToTrainingMajor_A_fkey",
  DROP CONSTRAINT IF EXISTS "_ExpertProfileToTrainingMajor_B_fkey";
ALTER TABLE "ql-dao-tao"."_ExpertToSubjectClass"
  DROP CONSTRAINT IF EXISTS "_ExpertProfileToSubjectClass_A_fkey",
  DROP CONSTRAINT IF EXISTS "_ExpertProfileToSubjectClass_B_fkey";

ALTER TABLE "ql-dao-tao"."_ExpertToTrainingMajor"
  ADD CONSTRAINT "_ExpertToTrainingMajor_A_fkey"
    FOREIGN KEY ("A") REFERENCES "ql-dao-tao"."Expert"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "_ExpertToTrainingMajor_B_fkey"
    FOREIGN KEY ("B") REFERENCES "ql-dao-tao"."TrainingMajor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ql-dao-tao"."_ExpertToSubjectClass"
  ADD CONSTRAINT "_ExpertToSubjectClass_A_fkey"
    FOREIGN KEY ("A") REFERENCES "ql-dao-tao"."Expert"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "_ExpertToSubjectClass_B_fkey"
    FOREIGN KEY ("B") REFERENCES "ql-dao-tao"."SubjectClass"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 3) Remap CouncilMember.expertId FK -> Expert (tên bảng mới)
ALTER TABLE "ql-dao-tao"."CouncilMember" DROP CONSTRAINT IF EXISTS "CouncilMember_expertId_fkey";
ALTER TABLE "ql-dao-tao"."CouncilMember"
  ADD CONSTRAINT "CouncilMember_expertId_fkey"
    FOREIGN KEY ("expertId") REFERENCES "ql-dao-tao"."Expert"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- 4) Tạo ExpertProfileVersion
CREATE TABLE "ql-dao-tao"."ExpertProfileVersion" (
  "id" TEXT NOT NULL,
  "code" TEXT,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "description" TEXT,
  "deletedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdBy" UUID,
  "expertId" TEXT NOT NULL,
  "name" TEXT,
  "academicDegreeTypeId" UUID,
  "academicRankTypeId" UUID,
  "organization" TEXT,
  "position" TEXT,
  "specialization" TEXT,
  "workplace" TEXT,
  "inAcademy" BOOLEAN NOT NULL DEFAULT true,
  "phone" TEXT,
  "email" TEXT,
  "bankAccountNumber" TEXT,
  "bankName" TEXT,
  "projectExpert" BOOLEAN NOT NULL DEFAULT false,
  "thesisExpert" BOOLEAN NOT NULL DEFAULT false,
  "eligiblePresident" BOOLEAN NOT NULL DEFAULT false,
  "eligibleSecretary" BOOLEAN NOT NULL DEFAULT false,
  "validFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "validTo" TIMESTAMP(3),
  CONSTRAINT "ExpertProfileVersion_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ExpertProfileVersion_code_key" ON "ql-dao-tao"."ExpertProfileVersion"("code");
CREATE INDEX "ExpertProfileVersion_expertId_validFrom_idx" ON "ql-dao-tao"."ExpertProfileVersion"("expertId", "validFrom");

ALTER TABLE "ql-dao-tao"."ExpertProfileVersion"
  ADD CONSTRAINT "ExpertProfileVersion_expertId_fkey"
    FOREIGN KEY ("expertId") REFERENCES "ql-dao-tao"."Expert"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "ExpertProfileVersion_academicDegreeTypeId_fkey"
    FOREIGN KEY ("academicDegreeTypeId") REFERENCES "mta"."DM_HocVi"("Id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "ExpertProfileVersion_academicRankTypeId_fkey"
    FOREIGN KEY ("academicRankTypeId") REFERENCES "mta"."DM_HocHam"("Id") ON DELETE SET NULL ON UPDATE CASCADE;

-- 5) Backfill version đầu từ cột hồ sơ trên Expert
INSERT INTO "ql-dao-tao"."ExpertProfileVersion" (
  "id",
  "code",
  "active",
  "description",
  "deletedAt",
  "createdAt",
  "updatedAt",
  "createdBy",
  "expertId",
  "name",
  "academicDegreeTypeId",
  "academicRankTypeId",
  "organization",
  "position",
  "specialization",
  "workplace",
  "inAcademy",
  "phone",
  "email",
  "bankAccountNumber",
  "bankName",
  "projectExpert",
  "thesisExpert",
  "eligiblePresident",
  "eligibleSecretary",
  "validFrom",
  "validTo"
)
SELECT
  'v_' || e."id",
  NULL,
  e."active",
  e."description",
  e."deletedAt",
  e."createdAt",
  e."updatedAt",
  e."createdBy",
  e."id",
  e."name",
  e."academicDegreeTypeId",
  e."academicRankTypeId",
  e."organization",
  e."position",
  e."specialization",
  e."workplace",
  (e."lecturerId" IS NOT NULL),
  e."phone",
  e."email",
  e."bankAccountNumber",
  e."bankName",
  e."projectExpert",
  e."thesisExpert",
  e."eligiblePresident",
  e."eligibleSecretary",
  COALESCE(e."createdAt", CURRENT_TIMESTAMP),
  NULL
FROM "ql-dao-tao"."Expert" e;

-- 6) currentVersionId trên Expert
ALTER TABLE "ql-dao-tao"."Expert" ADD COLUMN "currentVersionId" TEXT;
UPDATE "ql-dao-tao"."Expert" SET "currentVersionId" = 'v_' || "id";
CREATE UNIQUE INDEX "Expert_currentVersionId_key" ON "ql-dao-tao"."Expert"("currentVersionId");
ALTER TABLE "ql-dao-tao"."Expert"
  ADD CONSTRAINT "Expert_currentVersionId_fkey"
    FOREIGN KEY ("currentVersionId") REFERENCES "ql-dao-tao"."ExpertProfileVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- 7) Drop cột hồ sơ khỏi Expert (đã chuyển sang Version)
ALTER TABLE "ql-dao-tao"."Expert"
  DROP COLUMN IF EXISTS "name",
  DROP COLUMN IF EXISTS "academicDegreeTypeId",
  DROP COLUMN IF EXISTS "academicRankTypeId",
  DROP COLUMN IF EXISTS "organization",
  DROP COLUMN IF EXISTS "position",
  DROP COLUMN IF EXISTS "specialization",
  DROP COLUMN IF EXISTS "workplace",
  DROP COLUMN IF EXISTS "phone",
  DROP COLUMN IF EXISTS "email",
  DROP COLUMN IF EXISTS "bankAccountNumber",
  DROP COLUMN IF EXISTS "bankName",
  DROP COLUMN IF EXISTS "projectExpert",
  DROP COLUMN IF EXISTS "thesisExpert",
  DROP COLUMN IF EXISTS "eligiblePresident",
  DROP COLUMN IF EXISTS "eligibleSecretary";

-- 8) ThesisProject: supervisor/co/third -> Version
ALTER TABLE "ql-dao-tao"."ThesisProject" DROP CONSTRAINT IF EXISTS "ThesisProject_supervisorId_fkey";
ALTER TABLE "ql-dao-tao"."ThesisProject" DROP CONSTRAINT IF EXISTS "ThesisProject_coSupervisorId_fkey";
ALTER TABLE "ql-dao-tao"."ThesisProject" DROP CONSTRAINT IF EXISTS "ThesisProject_thirdSupervisorId_fkey";

ALTER TABLE "ql-dao-tao"."ThesisProject"
  ADD COLUMN "supervisorVersionId" TEXT,
  ADD COLUMN "coSupervisorVersionId" TEXT,
  ADD COLUMN "thirdSupervisorVersionId" TEXT;

UPDATE "ql-dao-tao"."ThesisProject"
SET
  "supervisorVersionId" = CASE WHEN "supervisorId" IS NULL THEN NULL ELSE 'v_' || "supervisorId" END,
  "coSupervisorVersionId" = CASE WHEN "coSupervisorId" IS NULL THEN NULL ELSE 'v_' || "coSupervisorId" END,
  "thirdSupervisorVersionId" = CASE WHEN "thirdSupervisorId" IS NULL THEN NULL ELSE 'v_' || "thirdSupervisorId" END;

ALTER TABLE "ql-dao-tao"."ThesisProject"
  DROP COLUMN "supervisorId",
  DROP COLUMN "coSupervisorId",
  DROP COLUMN "thirdSupervisorId";

ALTER TABLE "ql-dao-tao"."ThesisProject"
  ADD CONSTRAINT "ThesisProject_supervisorVersionId_fkey"
    FOREIGN KEY ("supervisorVersionId") REFERENCES "ql-dao-tao"."ExpertProfileVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "ThesisProject_coSupervisorVersionId_fkey"
    FOREIGN KEY ("coSupervisorVersionId") REFERENCES "ql-dao-tao"."ExpertProfileVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "ThesisProject_thirdSupervisorVersionId_fkey"
    FOREIGN KEY ("thirdSupervisorVersionId") REFERENCES "ql-dao-tao"."ExpertProfileVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- 9) StudentResearchTopic
ALTER TABLE "ql-dao-tao"."StudentResearchTopic" DROP CONSTRAINT IF EXISTS "StudentResearchTopic_supervisorId_fkey";
ALTER TABLE "ql-dao-tao"."StudentResearchTopic" DROP CONSTRAINT IF EXISTS "StudentResearchTopic_coSupervisorId_fkey";
ALTER TABLE "ql-dao-tao"."StudentResearchTopic" DROP CONSTRAINT IF EXISTS "StudentResearchTopic_thirdSupervisorId_fkey";

ALTER TABLE "ql-dao-tao"."StudentResearchTopic"
  ADD COLUMN "supervisorVersionId" TEXT,
  ADD COLUMN "coSupervisorVersionId" TEXT,
  ADD COLUMN "thirdSupervisorVersionId" TEXT;

UPDATE "ql-dao-tao"."StudentResearchTopic"
SET
  "supervisorVersionId" = CASE WHEN "supervisorId" IS NULL THEN NULL ELSE 'v_' || "supervisorId" END,
  "coSupervisorVersionId" = CASE WHEN "coSupervisorId" IS NULL THEN NULL ELSE 'v_' || "coSupervisorId" END,
  "thirdSupervisorVersionId" = CASE WHEN "thirdSupervisorId" IS NULL THEN NULL ELSE 'v_' || "thirdSupervisorId" END;

ALTER TABLE "ql-dao-tao"."StudentResearchTopic"
  DROP COLUMN "supervisorId",
  DROP COLUMN "coSupervisorId",
  DROP COLUMN "thirdSupervisorId";

ALTER TABLE "ql-dao-tao"."StudentResearchTopic"
  ADD CONSTRAINT "StudentResearchTopic_supervisorVersionId_fkey"
    FOREIGN KEY ("supervisorVersionId") REFERENCES "ql-dao-tao"."ExpertProfileVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "StudentResearchTopic_coSupervisorVersionId_fkey"
    FOREIGN KEY ("coSupervisorVersionId") REFERENCES "ql-dao-tao"."ExpertProfileVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "StudentResearchTopic_thirdSupervisorVersionId_fkey"
    FOREIGN KEY ("thirdSupervisorVersionId") REFERENCES "ql-dao-tao"."ExpertProfileVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- 10) StudentInternship
ALTER TABLE "ql-dao-tao"."StudentInternship" DROP CONSTRAINT IF EXISTS "StudentInternship_supervisorId_fkey";
ALTER TABLE "ql-dao-tao"."StudentInternship" DROP CONSTRAINT IF EXISTS "StudentInternship_coSupervisorId_fkey";

ALTER TABLE "ql-dao-tao"."StudentInternship"
  ADD COLUMN "supervisorVersionId" TEXT,
  ADD COLUMN "coSupervisorVersionId" TEXT;

UPDATE "ql-dao-tao"."StudentInternship"
SET
  "supervisorVersionId" = CASE WHEN "supervisorId" IS NULL THEN NULL ELSE 'v_' || "supervisorId" END,
  "coSupervisorVersionId" = CASE WHEN "coSupervisorId" IS NULL THEN NULL ELSE 'v_' || "coSupervisorId" END;

ALTER TABLE "ql-dao-tao"."StudentInternship"
  DROP COLUMN "supervisorId",
  DROP COLUMN "coSupervisorId";

ALTER TABLE "ql-dao-tao"."StudentInternship"
  ADD CONSTRAINT "StudentInternship_supervisorVersionId_fkey"
    FOREIGN KEY ("supervisorVersionId") REFERENCES "ql-dao-tao"."ExpertProfileVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "StudentInternship_coSupervisorVersionId_fkey"
    FOREIGN KEY ("coSupervisorVersionId") REFERENCES "ql-dao-tao"."ExpertProfileVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- 11) CouncilMember: thêm expertProfileVersionId (giữ expertId identity)
ALTER TABLE "ql-dao-tao"."CouncilMember" ADD COLUMN "expertProfileVersionId" TEXT;

UPDATE "ql-dao-tao"."CouncilMember"
SET "expertProfileVersionId" = CASE WHEN "expertId" IS NULL THEN NULL ELSE 'v_' || "expertId" END;

ALTER TABLE "ql-dao-tao"."CouncilMember"
  ADD CONSTRAINT "CouncilMember_expertProfileVersionId_fkey"
    FOREIGN KEY ("expertProfileVersionId") REFERENCES "ql-dao-tao"."ExpertProfileVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

COMMIT;
