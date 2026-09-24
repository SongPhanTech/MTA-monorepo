-- Drop Lecturer.organization / organizationId.
-- Đơn vị quản lý GV lấy từ UserProfile.sDM_DonViId → DM_DonVi.

ALTER TABLE "ql-dao-tao"."Lecturer"
  DROP CONSTRAINT IF EXISTS "Lecturer_organizationId_fkey";

DROP INDEX IF EXISTS "ql-dao-tao"."Lecturer_organizationId_idx";

ALTER TABLE "ql-dao-tao"."Lecturer"
  DROP COLUMN IF EXISTS "organizationId";
