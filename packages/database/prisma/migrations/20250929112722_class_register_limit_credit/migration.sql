/*
  Warnings:

  - You are about to drop the column `maxCredit` on the `ClassRegisterSession` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "ql-dao-tao"."ClassRegisterSession" DROP COLUMN "maxCredit",
ADD COLUMN     "tuitionPerCredit" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "ql-dao-tao"."ClassRegisterSessionCredit" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "classRegisterSessionId" TEXT NOT NULL,
    "minCredit" INTEGER NOT NULL DEFAULT 0,
    "maxCredit" INTEGER NOT NULL DEFAULT 25,

    CONSTRAINT "ClassRegisterSessionCredit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ClassRegisterSessionCredit_code_key" ON "ql-dao-tao"."ClassRegisterSessionCredit"("code");

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."ClassRegisterSessionCredit" ADD CONSTRAINT "ClassRegisterSessionCredit_classRegisterSessionId_fkey" FOREIGN KEY ("classRegisterSessionId") REFERENCES "ql-dao-tao"."ClassRegisterSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
