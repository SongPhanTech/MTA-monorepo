-- Mã người chỉ còn UserProfile.code.
-- Drop Lecturer.code / Student.code / Staff.code.

ALTER TABLE "ql-dao-tao"."Lecturer" DROP CONSTRAINT IF EXISTS "Lecturer_code_key";
ALTER TABLE "ql-dao-tao"."Student" DROP CONSTRAINT IF EXISTS "Student_code_key";
ALTER TABLE "ql-dao-tao"."Staff" DROP CONSTRAINT IF EXISTS "Staff_code_key";

DROP INDEX IF EXISTS "ql-dao-tao"."Lecturer_code_key";
DROP INDEX IF EXISTS "ql-dao-tao"."Student_code_key";
DROP INDEX IF EXISTS "ql-dao-tao"."Staff_code_key";

ALTER TABLE "ql-dao-tao"."Lecturer" DROP COLUMN IF EXISTS "code";
ALTER TABLE "ql-dao-tao"."Student" DROP COLUMN IF EXISTS "code";
ALTER TABLE "ql-dao-tao"."Staff" DROP COLUMN IF EXISTS "code";
