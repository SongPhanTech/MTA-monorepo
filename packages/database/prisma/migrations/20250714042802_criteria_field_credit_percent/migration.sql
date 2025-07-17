/*
  Warnings:

  - The values [SEMESTER_FAILED_CREDITS_PERCENT] on the enum `CriteriaField` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ql-dao-tao"."CriteriaField_new" AS ENUM ('SEMESTER_GPA', 'YEARLY_GPA', 'CUMULATIVE_GPA', 'ENTRY_SCORE', 'COURSE_GRADE_LOWEST', 'GRADUATION_COURSE_GRADE_LOWEST', 'SEMESTER_REGISTERED_CREDITS', 'SEMESTER_PASSED_CREDITS', 'SEMESTER_FAILED_CREDITS', 'YEAR_FAILED_CREDITS', 'FAILED_CREDITS_PERCENT', 'CUMULATIVE_PASSED_CREDITS', 'CUMULATIVE_DEBT_CREDITS', 'CUMULATIVE_PROGRESS_PERCENT', 'ACADEMIC_WARNING_LEVEL', 'DISCIPLINARY_WARNING_LEVEL', 'REPEAT_YEAR_COUNT', 'SUSPENSION_COUNT', 'CONDUCT_SCORE', 'HAS_PASSED_FOREIGN_LANGUAGE', 'HAS_REGISTERED_FOR_SEMESTER', 'IS_PRIORITY_STUDENT', 'IS_CLASS_MONITOR_OR_LEADER', 'IS_STUDY_DURATION_EXCEEDED', 'IS_DEBT_SUBJECT_CONSECUTIVE', 'HAS_IMPROVEMENT_REGISTRATION');
ALTER TABLE "ql-dao-tao"."ScholarshipCriteria" ALTER COLUMN "field" TYPE "ql-dao-tao"."CriteriaField_new" USING ("field"::text::"ql-dao-tao"."CriteriaField_new");
ALTER TABLE "ql-dao-tao"."AcademicWarningRule" ALTER COLUMN "field" TYPE "ql-dao-tao"."CriteriaField_new" USING ("field"::text::"ql-dao-tao"."CriteriaField_new");
ALTER TABLE "ql-dao-tao"."AcademicActionCondition" ALTER COLUMN "field" TYPE "ql-dao-tao"."CriteriaField_new" USING ("field"::text::"ql-dao-tao"."CriteriaField_new");
ALTER TABLE "ql-dao-tao"."GraduationRankDowngradeCondition" ALTER COLUMN "field" TYPE "ql-dao-tao"."CriteriaField_new" USING ("field"::text::"ql-dao-tao"."CriteriaField_new");
ALTER TABLE "ql-dao-tao"."RankingCondition" ALTER COLUMN "field" TYPE "ql-dao-tao"."CriteriaField_new" USING ("field"::text::"ql-dao-tao"."CriteriaField_new");
ALTER TYPE "ql-dao-tao"."CriteriaField" RENAME TO "CriteriaField_old";
ALTER TYPE "ql-dao-tao"."CriteriaField_new" RENAME TO "CriteriaField";
DROP TYPE "ql-dao-tao"."CriteriaField_old";
COMMIT;
