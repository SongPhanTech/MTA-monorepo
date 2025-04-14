/*
  Warnings:

  - The `status` column on the `Document` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `FAQ` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `Prompt` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "tro-ly-ao"."DocumentStatus" AS ENUM ('PENDING', 'APPROVE', 'DENY');

-- AlterTable
ALTER TABLE "tro-ly-ao"."Document" ADD COLUMN     "fileType" TEXT,
DROP COLUMN "status",
ADD COLUMN     "status" "tro-ly-ao"."DocumentStatus" NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "tro-ly-ao"."FAQ" DROP COLUMN "status",
ADD COLUMN     "status" "tro-ly-ao"."DocumentStatus" NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "tro-ly-ao"."Prompt" DROP COLUMN "status",
ADD COLUMN     "status" "tro-ly-ao"."DocumentStatus" NOT NULL DEFAULT 'PENDING';

-- DropEnum
DROP TYPE "tro-ly-ao"."Status";
