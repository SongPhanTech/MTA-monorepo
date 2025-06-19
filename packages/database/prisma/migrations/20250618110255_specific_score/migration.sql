-- AlterTable
ALTER TABLE "ql-dao-tao"."StudentSubjectScore" ADD COLUMN     "exempted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "withdrew" BOOLEAN NOT NULL DEFAULT false;
