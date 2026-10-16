-- Original CHAT recipient, stored on the row so Student.userProfileId can still change.
-- auth().mock is request-only; the column stays null and is omitted from CRUD output.
ALTER TABLE "ql-danh-muc"."Notification"
  ADD COLUMN "recipientProfileId" UUID;

CREATE INDEX "Notification_recipientProfileId_idx"
  ON "ql-danh-muc"."Notification" ("recipientProfileId");

ALTER TABLE "ql-danh-muc"."Notification"
  ADD CONSTRAINT "Notification_chat_recipient_chk"
  CHECK (
    (type::text = 'CHAT' AND "recipientProfileId" IS NOT NULL)
    OR (type::text <> 'CHAT' AND "recipientProfileId" IS NULL)
  );

ALTER TABLE "ql-nguoi-dung"."UserProfile"
  ADD COLUMN "mock" BOOLEAN;
