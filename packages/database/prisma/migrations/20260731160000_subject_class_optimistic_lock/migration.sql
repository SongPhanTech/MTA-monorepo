-- Chống overselling khi đăng ký học (race condition sĩ số):
-- 1) enrolledCount: sĩ số denormalized, cập nhật atomic cùng transaction đăng ký/hủy
-- 2) version: optimistic-locking version, tăng mỗi lần cập nhật sĩ số
ALTER TABLE "ql-dao-tao"."SubjectClass"
  ADD COLUMN IF NOT EXISTS "enrolledCount" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "version" INTEGER NOT NULL DEFAULT 0;

-- Backfill sĩ số hiện tại từ StudentSubjectScore (nguồn dữ liệu ghi danh hiện hành)
UPDATE "ql-dao-tao"."SubjectClass" sc
SET "enrolledCount" = sub.cnt
FROM (
  SELECT "subjectClassId", COUNT(*)::int AS cnt
  FROM "ql-dao-tao"."StudentSubjectScore"
  WHERE "subjectClassId" IS NOT NULL
  GROUP BY "subjectClassId"
) sub
WHERE sc.id = sub."subjectClassId";
