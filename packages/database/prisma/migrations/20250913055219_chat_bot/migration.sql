-- AlterTable
ALTER TABLE "tro-ly-ao"."Conversation" ADD COLUMN     "sessionId" TEXT;

-- CreateTable
CREATE TABLE "tro-ly-ao"."UserSession" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT,
    "email" TEXT,
    "phoneNumber" TEXT,

    CONSTRAINT "UserSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserSession_code_key" ON "tro-ly-ao"."UserSession"("code");

-- AddForeignKey
ALTER TABLE "tro-ly-ao"."Conversation" ADD CONSTRAINT "Conversation_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "tro-ly-ao"."UserSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;
