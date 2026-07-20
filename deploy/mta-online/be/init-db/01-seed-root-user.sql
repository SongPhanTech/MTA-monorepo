-- Seed tối thiểu: 1 UserProfile "root"
-- để be-ql-dao-tao / be-model không crash khi findFirstOrThrow.
--
-- Chạy trên server (Postgres đã migrate schema):
--   docker exec -i postgres psql -U root -d mta < init-db/01-seed-root-user.sql
--
-- Hoặc one-liner:
--   docker exec -i postgres psql -U root -d mta -c "..."

INSERT INTO "ql-nguoi-dung"."UserProfile" (
  id,
  code,
  active,
  "idCardNumber",
  fullname,
  "firstName",
  "lastName",
  "bLaNguoiDung",
  "bSystem",
  "createdAt",
  "updatedAt"
)
SELECT
  '00000000-0000-4000-8000-000000000001'::uuid,
  'root',
  true,
  '000000000001',
  'Root System',
  'Root',
  'System',
  true,
  true,
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1
  FROM "ql-nguoi-dung"."UserProfile"
  WHERE code = 'root'
     OR "idCardNumber" = '000000000001'
     OR id = '00000000-0000-4000-8000-000000000001'::uuid
);
