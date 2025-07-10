-- AlterTable
ALTER TABLE "ql-dao-tao"."AcademicActionCondition" ADD COLUMN     "invert" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "ql-dao-tao"."AcademicWarningRule" ADD COLUMN     "invert" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "ql-dao-tao"."GraduationRankDowngradeCondition" ADD COLUMN     "invert" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "tuple" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "ql-dao-tao"."RankingCondition" ADD COLUMN     "invert" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "tuple" TEXT[] DEFAULT ARRAY[]::TEXT[];
