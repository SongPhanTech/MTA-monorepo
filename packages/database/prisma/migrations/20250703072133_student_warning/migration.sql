-- AlterTable
ALTER TABLE "ql-dao-tao"."Student" ADD COLUMN     "academicWarningLevel" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "disciplinaryWarningLevel" INTEGER NOT NULL DEFAULT 0;
