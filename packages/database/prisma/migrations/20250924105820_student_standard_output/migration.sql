-- AlterTable
ALTER TABLE "ql-dao-tao"."StudentSemesterResult" ADD COLUMN     "computerSkillPass" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "foreignLangPass" SET DEFAULT false;
