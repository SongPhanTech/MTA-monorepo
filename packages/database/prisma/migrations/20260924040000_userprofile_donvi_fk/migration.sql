-- FK + index: UserProfile.sDM_DonViId → DM_DonVi.Id
-- Cột sDM_DonViId đã tồn tại; chỉ gắn quan hệ.

CREATE INDEX IF NOT EXISTS "UserProfile_sDM_DonViId_idx"
  ON "ql-nguoi-dung"."UserProfile" ("sDM_DonViId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_schema = 'ql-nguoi-dung'
      AND table_name = 'UserProfile'
      AND constraint_name = 'UserProfile_sDM_DonViId_fkey'
  ) THEN
    ALTER TABLE "ql-nguoi-dung"."UserProfile"
      ADD CONSTRAINT "UserProfile_sDM_DonViId_fkey"
      FOREIGN KEY ("sDM_DonViId") REFERENCES mta."DM_DonVi"("Id")
      ON DELETE SET NULL
      ON UPDATE CASCADE;
  END IF;
END $$;
