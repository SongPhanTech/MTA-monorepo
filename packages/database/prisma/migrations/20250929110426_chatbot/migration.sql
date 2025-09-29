-- DropForeignKey
ALTER TABLE "tro-ly-ao"."Conversation" DROP CONSTRAINT "Conversation_userId_fkey";

-- DropForeignKey
ALTER TABLE "tro-ly-ao"."Document" DROP CONSTRAINT "Document_approvedById_fkey";

-- DropForeignKey
ALTER TABLE "tro-ly-ao"."Document" DROP CONSTRAINT "Document_uploadedById_fkey";

-- DropForeignKey
ALTER TABLE "tro-ly-ao"."FAQ" DROP CONSTRAINT "FAQ_approvedById_fkey";

-- DropForeignKey
ALTER TABLE "tro-ly-ao"."FAQ" DROP CONSTRAINT "FAQ_uploadedById_fkey";

-- AlterTable
ALTER TABLE "tro-ly-ao"."Conversation" ALTER COLUMN "userId" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "tro-ly-ao"."Document" ALTER COLUMN "uploadedById" SET DATA TYPE TEXT,
ALTER COLUMN "approvedById" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "tro-ly-ao"."FAQ" ALTER COLUMN "uploadedById" SET DATA TYPE TEXT,
ALTER COLUMN "approvedById" SET DATA TYPE TEXT;

-- AddForeignKey
ALTER TABLE "tro-ly-ao"."Document" ADD CONSTRAINT "Document_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "ql-nguoi-dung"."UserProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tro-ly-ao"."Document" ADD CONSTRAINT "Document_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "ql-nguoi-dung"."UserProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tro-ly-ao"."FAQ" ADD CONSTRAINT "FAQ_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "ql-nguoi-dung"."UserProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tro-ly-ao"."FAQ" ADD CONSTRAINT "FAQ_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "ql-nguoi-dung"."UserProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tro-ly-ao"."Conversation" ADD CONSTRAINT "Conversation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "ql-nguoi-dung"."UserProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
