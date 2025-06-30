-- CreateEnum
CREATE TYPE "ql-dao-tao"."TrainingObjectTypes" AS ENUM ('MILITARY', 'CIVILIAN');

-- AlterTable
ALTER TABLE "ql-dao-tao"."TrainingObjectType" ADD COLUMN     "type" "ql-dao-tao"."TrainingObjectTypes" NOT NULL DEFAULT 'MILITARY';
