-- Nhắc trước buổi học dùng lại bảng Notification (không tạo bảng mới).
-- Phần DDL dưới đây sinh bằng `prisma migrate diff` từ schema.prisma (do ZModel generate), không sửa tay.

-- AlterEnum
ALTER TYPE "ql-danh-muc"."NotificationType" ADD VALUE 'CLASS_REMINDER';

-- AlterTable
ALTER TABLE "ql-danh-muc"."Notification" ADD COLUMN     "pushExpiresAt" TIMESTAMPTZ(6),
ADD COLUMN     "reminderData" JSONB,
ADD COLUMN     "targetDeviceId" TEXT;

-- CreateIndex
CREATE INDEX "Notification_type_publishedAt_idx" ON "ql-danh-muc"."Notification"("type", "publishedAt");

-- CreateIndex
CREATE INDEX "Notification_targetDeviceId_idx" ON "ql-danh-muc"."Notification"("targetDeviceId");

-- Bổ sung viết tay (Prisma schema không biểu diễn được CHECK):
-- So sánh qua ::text vì giá trị enum mới chưa dùng được trong cùng transaction.
-- CLASS_REMINDER: bắt buộc thiết bị/hạn push/snapshot, không gửi tất cả, không gắn giảng viên.
-- Loại khác: không mang trường riêng của nhắc học. "Đúng một sinh viên nhận" do service StudentPortal kiểm tra.
ALTER TABLE "ql-danh-muc"."Notification"
  DROP CONSTRAINT IF EXISTS "Notification_class_reminder_check";

ALTER TABLE "ql-danh-muc"."Notification"
  ADD CONSTRAINT "Notification_class_reminder_check" CHECK (
    CASE
      WHEN "type"::text = 'CLASS_REMINDER' THEN
        "targetDeviceId" IS NOT NULL
        AND "pushExpiresAt" IS NOT NULL
        AND "reminderData" IS NOT NULL
        AND "targetAll" = false
        AND "lecturerId" IS NULL
      ELSE
        "targetDeviceId" IS NULL
        AND "pushExpiresAt" IS NULL
        AND "reminderData" IS NULL
    END
  ) NOT VALID;

ALTER TABLE "ql-danh-muc"."Notification"
  VALIDATE CONSTRAINT "Notification_class_reminder_check";
