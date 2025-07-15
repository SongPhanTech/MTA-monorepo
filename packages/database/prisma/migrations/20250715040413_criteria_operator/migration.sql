/*
  Warnings:

  - The values [LE] on the enum `CriteriaOperator` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ql-dao-tao"."CriteriaOperator_new" AS ENUM ('GT', 'GTE', 'LT', 'LTE', 'EQ', 'IN');
ALTER TABLE "ql-dao-tao"."ScholarshipCriteria" ALTER COLUMN "operator" TYPE "ql-dao-tao"."CriteriaOperator_new" USING ("operator"::text::"ql-dao-tao"."CriteriaOperator_new");
ALTER TABLE "ql-dao-tao"."AcademicWarningRule" ALTER COLUMN "operator" TYPE "ql-dao-tao"."CriteriaOperator_new" USING ("operator"::text::"ql-dao-tao"."CriteriaOperator_new");
ALTER TABLE "ql-dao-tao"."AcademicActionCondition" ALTER COLUMN "operator" TYPE "ql-dao-tao"."CriteriaOperator_new" USING ("operator"::text::"ql-dao-tao"."CriteriaOperator_new");
ALTER TABLE "ql-dao-tao"."GraduationRankDowngradeCondition" ALTER COLUMN "operator" TYPE "ql-dao-tao"."CriteriaOperator_new" USING ("operator"::text::"ql-dao-tao"."CriteriaOperator_new");
ALTER TABLE "ql-dao-tao"."RankingCondition" ALTER COLUMN "operator" TYPE "ql-dao-tao"."CriteriaOperator_new" USING ("operator"::text::"ql-dao-tao"."CriteriaOperator_new");
ALTER TYPE "ql-dao-tao"."CriteriaOperator" RENAME TO "CriteriaOperator_old";
ALTER TYPE "ql-dao-tao"."CriteriaOperator_new" RENAME TO "CriteriaOperator";
DROP TYPE "ql-dao-tao"."CriteriaOperator_old";
COMMIT;
