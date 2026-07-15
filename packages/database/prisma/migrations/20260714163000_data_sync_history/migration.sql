-- CreateEnum
CREATE TYPE "ql-dao-tao"."DataSyncType" AS ENUM ('IMPORT', 'EXPORT');

-- CreateEnum
CREATE TYPE "ql-dao-tao"."DataSyncStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED');

-- CreateTable
CREATE TABLE "ql-dao-tao"."DataSyncHistory" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" UUID,
    "type" "ql-dao-tao"."DataSyncType" NOT NULL,
    "status" "ql-dao-tao"."DataSyncStatus" NOT NULL DEFAULT 'PENDING',
    "sessionName" TEXT NOT NULL,
    "classRegisterSessionId" TEXT,
    "fileName" TEXT,
    "fileVersion" TEXT,
    "sourceExportedAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "recordCounts" JSONB,
    "performedById" UUID,

    CONSTRAINT "DataSyncHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DataSyncHistory_code_key" ON "ql-dao-tao"."DataSyncHistory"("code");

-- CreateIndex
CREATE INDEX "DataSyncHistory_classRegisterSessionId_idx" ON "ql-dao-tao"."DataSyncHistory"("classRegisterSessionId");

-- CreateIndex
CREATE INDEX "DataSyncHistory_type_idx" ON "ql-dao-tao"."DataSyncHistory"("type");

-- CreateIndex
CREATE INDEX "DataSyncHistory_status_idx" ON "ql-dao-tao"."DataSyncHistory"("status");

-- CreateIndex
CREATE INDEX "DataSyncHistory_createdAt_idx" ON "ql-dao-tao"."DataSyncHistory"("createdAt");

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."DataSyncHistory" ADD CONSTRAINT "DataSyncHistory_classRegisterSessionId_fkey" FOREIGN KEY ("classRegisterSessionId") REFERENCES "ql-dao-tao"."ClassRegisterSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."DataSyncHistory" ADD CONSTRAINT "DataSyncHistory_performedById_fkey" FOREIGN KEY ("performedById") REFERENCES "ql-nguoi-dung"."UserProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
