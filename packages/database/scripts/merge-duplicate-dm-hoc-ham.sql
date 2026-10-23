-- Gộp bản ghi trùng danh mục mta."DM_HocHam" (GS / PGS mỗi loại 2 dòng).
-- Chiến lược:
--   1. Giữ id đang được dùng nhiều hơn.
--   2. UPDATE mọi FK từ id bỏ → id giữ.
--   3. GuestTeachingRate có unique (configId, academicRankTypeId, academicDegreeTypeId, isForeign):
--      nếu đã có dòng id-giữ thì xóa dòng id-bỏ, tránh vi phạm unique.
--   4. Soft-delete dòng danh mục bị bỏ (bDeleted = true, bActive = false).
--      Không hard-delete để còn đối chiếu.
--
-- Chạy:
--   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f packages/database/scripts/merge-duplicate-dm-hoc-ham.sql
--
-- Id giữ lại (đã kiểm tra trên mta_internet, 2026-10-22):
--   GS  3c25ec04-b803-4e9b-baa8-7e76c70647ea  (HocHam 3, UserProfile 3, Expert 61)
--   PGS f82a9379-3c4c-49cc-af38-ba3f485a418a  (HocHam 30, UserProfile 31, Expert 474)

BEGIN;

CREATE TEMP TABLE dm_hoc_ham_merge (
  discard_id uuid PRIMARY KEY,
  keep_id    uuid NOT NULL,
  code       text NOT NULL
);

INSERT INTO dm_hoc_ham_merge (discard_id, keep_id, code) VALUES
  ('04205a06-eb0b-48bf-92e0-abe5f50c2d76', '3c25ec04-b803-4e9b-baa8-7e76c70647ea', 'GS'),
  ('4b8f5799-8752-4395-a1c6-f38021625faf', 'f82a9379-3c4c-49cc-af38-ba3f485a418a', 'PGS');

-- GuestTeachingRate: xóa dòng id-bỏ nếu đã có dòng id-giữ cùng unique key.
DELETE FROM "ql-dao-tao"."GuestTeachingRate" g
USING dm_hoc_ham_merge m
WHERE g."academicRankTypeId" = m.discard_id
  AND EXISTS (
    SELECT 1
    FROM "ql-dao-tao"."GuestTeachingRate" k
    WHERE k."academicRankTypeId" = m.keep_id
      AND k."configId" = g."configId"
      AND k."isForeign" = g."isForeign"
      AND k."academicDegreeTypeId" IS NOT DISTINCT FROM g."academicDegreeTypeId"
  );

UPDATE "ql-dao-tao"."GuestTeachingRate" g
SET "academicRankTypeId" = m.keep_id
FROM dm_hoc_ham_merge m
WHERE g."academicRankTypeId" = m.discard_id;

UPDATE "ql-dao-tao"."ExpertProfileVersion" e
SET "academicRankTypeId" = m.keep_id
FROM dm_hoc_ham_merge m
WHERE e."academicRankTypeId" = m.discard_id;

UPDATE "ql-ho-so"."HocHam" h
SET "academicRankTypeId" = m.keep_id
FROM dm_hoc_ham_merge m
WHERE h."academicRankTypeId" = m.discard_id;

UPDATE "ql-nguoi-dung"."UserProfile" p
SET "academicRankTypeId" = m.keep_id
FROM dm_hoc_ham_merge m
WHERE p."academicRankTypeId" = m.discard_id;

UPDATE mta."DM_HocHam" d
SET
  "bDeleted" = true,
  "bActive" = false,
  "sGhiChu" = CONCAT_WS(
    ' | ',
    NULLIF("sGhiChu", ''),
    CONCAT('merged into ', m.keep_id::text, ' on 2026-10-22')
  ),
  "dNgaySua" = NOW()
FROM dm_hoc_ham_merge m
WHERE d."Id" = m.discard_id;

-- Kiểm tra không còn FK trỏ id-bỏ, và danh mục active không còn trùng sMa.
DO $$
DECLARE
  leftover int;
  dup_active int;
BEGIN
  SELECT COUNT(*) INTO leftover FROM (
    SELECT 1 FROM "ql-dao-tao"."GuestTeachingRate" g
      JOIN dm_hoc_ham_merge m ON g."academicRankTypeId" = m.discard_id
    UNION ALL
    SELECT 1 FROM "ql-dao-tao"."ExpertProfileVersion" e
      JOIN dm_hoc_ham_merge m ON e."academicRankTypeId" = m.discard_id
    UNION ALL
    SELECT 1 FROM "ql-ho-so"."HocHam" h
      JOIN dm_hoc_ham_merge m ON h."academicRankTypeId" = m.discard_id
    UNION ALL
    SELECT 1 FROM "ql-nguoi-dung"."UserProfile" p
      JOIN dm_hoc_ham_merge m ON p."academicRankTypeId" = m.discard_id
  ) s;

  IF leftover > 0 THEN
    RAISE EXCEPTION 'Still % rows pointing at discarded DM_HocHam ids', leftover;
  END IF;

  SELECT COUNT(*) INTO dup_active FROM (
    SELECT "sMa"
    FROM mta."DM_HocHam"
    WHERE COALESCE("bDeleted", false) = false
    GROUP BY "sMa"
    HAVING COUNT(*) > 1
  ) s;

  IF dup_active > 0 THEN
    RAISE EXCEPTION 'Active DM_HocHam still has duplicate sMa';
  END IF;
END $$;

COMMIT;
