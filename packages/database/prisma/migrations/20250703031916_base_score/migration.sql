-- AlterTable
ALTER TABLE "ql-dao-tao"."AcademicRankingConvert"
RENAME COLUMN "type" TO "baseScore";

-- AlterTable
ALTER TABLE "ql-dao-tao"."StudentSemesterResult"
RENAME COLUMN "baseType" TO "baseScore";

-- AlterTable
ALTER TABLE "ql-dao-tao"."StudentYearResult"
RENAME COLUMN "baseType" TO "baseScore";

-- AlterTable
ALTER TABLE "ql-dao-tao"."TrainingObjectType" ADD COLUMN     "baseScore" "ql-dao-tao"."AcademicRankingBaseType" NOT NULL DEFAULT 'Base4';
