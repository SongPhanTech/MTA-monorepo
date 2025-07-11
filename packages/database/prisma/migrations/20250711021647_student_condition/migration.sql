-- AlterTable
ALTER TABLE "ql-dao-tao"."Student" ADD COLUMN     "ITCertificationPass" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "expelled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "foreignLangPass" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "militaryTrainingPass" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "strengthTrainingPass" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "suspended" BOOLEAN NOT NULL DEFAULT false;
