#!/usr/bin/env bash
# Xóa bản ghi DM_DonVi trùng mã VÀ trùng tên, nhưng không có dữ liệu phát sinh.
#
# Giữ:
#   - dòng đang được môn học, hồ sơ, lớp, đơn vị con hoặc bảng liên quan trỏ tới
#   - một dòng nếu cả nhóm không có dữ liệu (ưu tiên dòng chưa xóa mềm, rồi Id nhỏ nhất)
#   - mọi mã trùng nhưng khác tên
#
# Chỉ xóa cứng trên mta_internet.mta."DM_DonVi".
# mta_core_db không bị sửa. Sau khi xóa, chạy sync-dm-donvi-internet-to-core.sh để ghi đè core.
#
#   export PGHOST=103.172.78.68
#   export PGPORT=5432
#   export PGUSER=admin
#   export PGPASSWORD='<mật khẩu trong packages/database/.env>'
#   ./packages/database/scripts/delete-duplicate-dm-donvi.sh           # chỉ xem
#   ./packages/database/scripts/delete-duplicate-dm-donvi.sh --apply   # xóa sau khi gõ YES

set -euo pipefail

APPLY=0
if [[ "${1:-}" == "--apply" ]]; then
  APPLY=1
elif [[ -n "${1:-}" ]]; then
  echo "Tham số không hợp lệ: $1" >&2
  echo "Dùng: $0 [--apply]" >&2
  exit 1
fi

: "${PGHOST:?Đặt PGHOST, ví dụ 103.172.78.68}"
: "${PGUSER:?Đặt PGUSER}"
: "${PGPASSWORD:?Đặt PGPASSWORD bằng mật khẩu trong packages/database/.env}"
if [[ "$PGPASSWORD" == "..." ]]; then
  echo "PGPASSWORD vẫn là dấu ba chấm trong ví dụ." >&2
  echo "Lấy mật khẩu trong packages/database/.env, chuỗi DATABASE_URL, giữa admin: và @." >&2
  exit 1
fi
export PGHOST PGPORT="${PGPORT:-5432}" PGUSER PGPASSWORD

SRC_DB="${SRC_DB:-mta_internet}"
DST_DB="${DST_DB:-mta_core_db}"

WORKDIR="$(mktemp -d "${TMPDIR:-/tmp}/dm-donvi-dups.XXXXXX")"
trap 'rm -rf "$WORKDIR"' EXIT

# Khóa ngoại đã biết. Thêm sParentId và DM_NhanVien.sDM_DonViId dù không có FK.
sort > "$WORKDIR/known-fks.txt" <<'EOF'
mta._DM_DonViToSurveyObjectType.A
ql-dao-tao.Curriculum.managementOrganizationId
ql-dao-tao.FixedClass.managementOrganizationId
ql-dao-tao.GuestTeachingPayment.hiringOrgId
ql-dao-tao.LecturerHistory.organizationId
ql-dao-tao.ResearchProject.organizationId
ql-dao-tao.Staff.organizationId
ql-dao-tao.StaffHistory.organizationId
ql-dao-tao.Subject.managementOrganizationId
ql-dao-tao.SubjectVersion.managementOrganizationId
ql-dao-tao.ThesisProject.organizationId
ql-dao-tao.TrainingField.organizationId
ql-dao-tao.TrainingMajor.organizationId
ql-dao-tao.TrainingMajor.secondOrganizationId
ql-dao-tao.TrainingMajor.thirdOrganizationId
ql-nguoi-dung.UserProfile.sDM_DonViId
EOF

psql -d "$SRC_DB" -v ON_ERROR_STOP=1 -At -F '.' <<'SQL' | sort > "$WORKDIR/live-fks.txt"
SELECT n.nspname, c.relname, a.attname
FROM pg_constraint fk
JOIN pg_class c ON c.oid = fk.conrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
JOIN LATERAL unnest(fk.conkey) WITH ORDINALITY AS ck(attnum, ord) ON true
JOIN pg_attribute a ON a.attrelid = c.oid AND a.attnum = ck.attnum
WHERE fk.contype = 'f'
  AND fk.confrelid = 'mta."DM_DonVi"'::regclass
ORDER BY 1, 2, 3;
SQL

unknown="$(comm -13 "$WORKDIR/known-fks.txt" "$WORKDIR/live-fks.txt" || true)"
if [[ -n "$unknown" ]]; then
  echo "Có khóa ngoại mới tới DM_DonVi mà script chưa kiểm tra:" >&2
  echo "$unknown" >&2
  echo "Dừng để không xóa nhầm dòng đang được bảng mới trỏ tới." >&2
  exit 1
fi

# Id cần xóa: trùng sMa + sTen, không bị tham chiếu, không phải bản được giữ.
psql -d "$SRC_DB" -v ON_ERROR_STOP=1 -At -F '|' <<'SQL' > "$WORKDIR/delete.tsv"
WITH ref_ids AS (
  SELECT DISTINCT id
  FROM (
    SELECT "sDM_DonViId" AS id FROM mta."DM_NhanVien" WHERE "sDM_DonViId" IS NOT NULL
    UNION ALL SELECT "sDM_DonViId" FROM "ql-nguoi-dung"."UserProfile" WHERE "sDM_DonViId" IS NOT NULL
    UNION ALL SELECT "organizationId" FROM "ql-dao-tao"."Staff" WHERE "organizationId" IS NOT NULL
    UNION ALL SELECT "organizationId" FROM "ql-dao-tao"."StaffHistory" WHERE "organizationId" IS NOT NULL
    UNION ALL SELECT "organizationId" FROM "ql-dao-tao"."LecturerHistory" WHERE "organizationId" IS NOT NULL
    UNION ALL SELECT "managementOrganizationId" FROM "ql-dao-tao"."FixedClass" WHERE "managementOrganizationId" IS NOT NULL
    UNION ALL SELECT "managementOrganizationId" FROM "ql-dao-tao"."Curriculum" WHERE "managementOrganizationId" IS NOT NULL
    UNION ALL SELECT "managementOrganizationId" FROM "ql-dao-tao"."Subject" WHERE "managementOrganizationId" IS NOT NULL
    UNION ALL SELECT "managementOrganizationId" FROM "ql-dao-tao"."SubjectVersion" WHERE "managementOrganizationId" IS NOT NULL
    UNION ALL SELECT "organizationId" FROM "ql-dao-tao"."TrainingField" WHERE "organizationId" IS NOT NULL
    UNION ALL SELECT "organizationId" FROM "ql-dao-tao"."TrainingMajor" WHERE "organizationId" IS NOT NULL
    UNION ALL SELECT "secondOrganizationId" FROM "ql-dao-tao"."TrainingMajor" WHERE "secondOrganizationId" IS NOT NULL
    UNION ALL SELECT "thirdOrganizationId" FROM "ql-dao-tao"."TrainingMajor" WHERE "thirdOrganizationId" IS NOT NULL
    UNION ALL SELECT "organizationId" FROM "ql-dao-tao"."ResearchProject" WHERE "organizationId" IS NOT NULL
    UNION ALL SELECT "organizationId" FROM "ql-dao-tao"."ThesisProject" WHERE "organizationId" IS NOT NULL
    UNION ALL SELECT "hiringOrgId" FROM "ql-dao-tao"."GuestTeachingPayment" WHERE "hiringOrgId" IS NOT NULL
    UNION ALL SELECT "A" FROM mta."_DM_DonViToSurveyObjectType" WHERE "A" IS NOT NULL
    UNION ALL SELECT "sParentId" FROM mta."DM_DonVi" WHERE "sParentId" IS NOT NULL
  ) s
),
base AS (
  SELECT
    "Id",
    btrim("sMa") AS sma,
    btrim(COALESCE("sTen", '')) AS sten,
    "bDeleted"
  FROM mta."DM_DonVi"
  WHERE "sMa" IS NOT NULL AND btrim("sMa") <> ''
),
same_codes AS (
  SELECT sma
  FROM base
  GROUP BY sma
  HAVING count(*) > 1
     AND count(DISTINCT sten) = 1
),
marked AS (
  SELECT
    b."Id",
    b.sma,
    b.sten,
    EXISTS (SELECT 1 FROM ref_ids r WHERE r.id = b."Id") AS has_data,
    row_number() OVER (
      PARTITION BY b.sma
      ORDER BY
        EXISTS (SELECT 1 FROM ref_ids r WHERE r.id = b."Id") DESC,
        b."bDeleted" ASC NULLS FIRST,
        b."Id"
    ) AS rn
  FROM base b
  JOIN same_codes s ON s.sma = b.sma
)
SELECT "Id"::text, sma, sten
FROM marked
WHERE NOT has_data AND rn > 1
ORDER BY sma, "Id";
SQL

# Mã trùng nhưng khác tên: chỉ báo, không xóa.
psql -d "$SRC_DB" -v ON_ERROR_STOP=1 -At -F '|' <<'SQL' > "$WORKDIR/different-name.tsv"
WITH base AS (
  SELECT btrim("sMa") AS sma, btrim(COALESCE("sTen", '')) AS sten
  FROM mta."DM_DonVi"
  WHERE "sMa" IS NOT NULL AND btrim("sMa") <> ''
)
SELECT sma, string_agg(DISTINCT sten, ' | ' ORDER BY sten)
FROM base
GROUP BY sma
HAVING count(*) > 1
   AND count(DISTINCT sten) > 1
ORDER BY sma;
SQL

cut -d '|' -f 1 "$WORKDIR/delete.tsv" > "$WORKDIR/candidate-ids.txt"

# Bỏ những Id core vẫn đang được nhân viên / vị trí / mức truy cập trỏ tới.
{
  cat <<'SQL'
CREATE TEMP TABLE cand (id uuid PRIMARY KEY);
COPY cand (id) FROM STDIN;
SQL
  cat "$WORKDIR/candidate-ids.txt"
  printf '\\.\n'
  cat <<'SQL'
SELECT c.id::text
FROM cand c
WHERE (
    to_regclass('public."DM_NhanVien"') IS NOT NULL
    AND EXISTS (SELECT 1 FROM public."DM_NhanVien" n WHERE n."sDM_DonViId" = c.id)
  )
  OR (
    to_regclass('public."DM_ViTriCongViec_DonViCT"') IS NOT NULL
    AND EXISTS (SELECT 1 FROM public."DM_ViTriCongViec_DonViCT" v WHERE v."sDM_DonViId" = c.id)
  )
  OR (
    to_regclass('public."MucTruyCapDuLieu"') IS NOT NULL
    AND EXISTS (SELECT 1 FROM public."MucTruyCapDuLieu" m WHERE m."sDM_DonViId" = c.id)
  );
SQL
} | psql -d "$DST_DB" -q -v ON_ERROR_STOP=1 -At > "$WORKDIR/blocked-by-core.txt"

if [[ -s "$WORKDIR/blocked-by-core.txt" ]]; then
  grep -F -v -f "$WORKDIR/blocked-by-core.txt" "$WORKDIR/delete.tsv" > "$WORKDIR/delete-ok.tsv" || true
else
  cp "$WORKDIR/delete.tsv" "$WORKDIR/delete-ok.tsv"
fi

delete_count="$(grep -c . "$WORKDIR/delete-ok.tsv" || true)"
blocked_count="$(grep -c . "$WORKDIR/blocked-by-core.txt" || true)"
diff_count="$(grep -c . "$WORKDIR/different-name.tsv" || true)"

echo "Chỉ xóa trên ${SRC_DB} @ ${PGHOST}. ${DST_DB} không đổi."
echo "Sẽ xóa ${delete_count} dòng trùng mã và trùng tên, không có dữ liệu phát sinh."
echo "Bỏ qua ${diff_count} mã trùng nhưng khác tên."
if [[ "$blocked_count" -gt 0 ]]; then
  echo "Giữ ${blocked_count} dòng vì mta_core_db vẫn đang trỏ tới (nhân viên, vị trí hoặc mức truy cập)."
fi
echo

if [[ "$diff_count" -gt 0 ]]; then
  echo "Mã khác tên, không xóa:"
  while IFS='|' read -r sma names; do
    printf '  %s  %s\n' "$sma" "$names"
  done < "$WORKDIR/different-name.tsv"
  echo
fi

if [[ "$delete_count" -eq 0 ]]; then
  echo "Không có dòng nào để xóa."
  exit 0
fi

echo "Dòng sẽ xóa:"
printf '%s\n' "sMa | sTen | Id"
while IFS='|' read -r id sma sten; do
  printf '%s | %s | %s\n' "$sma" "$sten" "$id"
done < "$WORKDIR/delete-ok.tsv"
echo

if [[ "$APPLY" -ne 1 ]]; then
  echo "Chưa xóa. Chạy lại với --apply để xóa trên ${SRC_DB}."
  exit 0
fi

echo "Thao tác này xóa cứng ${delete_count} dòng trên ${SRC_DB}. ${DST_DB} không đổi."
printf 'Gõ YES để tiếp tục: '
read -r confirm
if [[ "$(printf '%s' "$confirm" | tr '[:upper:]' '[:lower:]')" != "yes" ]]; then
  echo "Đã hủy."
  exit 1
fi

# Chỉ lấy cột Id để nạp vào PostgreSQL.
cut -d '|' -f 1 "$WORKDIR/delete-ok.tsv" > "$WORKDIR/delete-ids.txt"

{
  cat <<'SQL'
BEGIN;
CREATE TEMP TABLE del_ids (id uuid PRIMARY KEY);
COPY del_ids (id) FROM STDIN;
SQL
  cat "$WORKDIR/delete-ids.txt"
  printf '\\.\n'
  cat <<'SQL'
WITH ref_ids AS (
  SELECT DISTINCT id
  FROM (
    SELECT "sDM_DonViId" AS id FROM mta."DM_NhanVien" WHERE "sDM_DonViId" IS NOT NULL
    UNION ALL SELECT "sDM_DonViId" FROM "ql-nguoi-dung"."UserProfile" WHERE "sDM_DonViId" IS NOT NULL
    UNION ALL SELECT "organizationId" FROM "ql-dao-tao"."Staff" WHERE "organizationId" IS NOT NULL
    UNION ALL SELECT "organizationId" FROM "ql-dao-tao"."StaffHistory" WHERE "organizationId" IS NOT NULL
    UNION ALL SELECT "organizationId" FROM "ql-dao-tao"."LecturerHistory" WHERE "organizationId" IS NOT NULL
    UNION ALL SELECT "managementOrganizationId" FROM "ql-dao-tao"."FixedClass" WHERE "managementOrganizationId" IS NOT NULL
    UNION ALL SELECT "managementOrganizationId" FROM "ql-dao-tao"."Curriculum" WHERE "managementOrganizationId" IS NOT NULL
    UNION ALL SELECT "managementOrganizationId" FROM "ql-dao-tao"."Subject" WHERE "managementOrganizationId" IS NOT NULL
    UNION ALL SELECT "managementOrganizationId" FROM "ql-dao-tao"."SubjectVersion" WHERE "managementOrganizationId" IS NOT NULL
    UNION ALL SELECT "organizationId" FROM "ql-dao-tao"."TrainingField" WHERE "organizationId" IS NOT NULL
    UNION ALL SELECT "organizationId" FROM "ql-dao-tao"."TrainingMajor" WHERE "organizationId" IS NOT NULL
    UNION ALL SELECT "secondOrganizationId" FROM "ql-dao-tao"."TrainingMajor" WHERE "secondOrganizationId" IS NOT NULL
    UNION ALL SELECT "thirdOrganizationId" FROM "ql-dao-tao"."TrainingMajor" WHERE "thirdOrganizationId" IS NOT NULL
    UNION ALL SELECT "organizationId" FROM "ql-dao-tao"."ResearchProject" WHERE "organizationId" IS NOT NULL
    UNION ALL SELECT "organizationId" FROM "ql-dao-tao"."ThesisProject" WHERE "organizationId" IS NOT NULL
    UNION ALL SELECT "hiringOrgId" FROM "ql-dao-tao"."GuestTeachingPayment" WHERE "hiringOrgId" IS NOT NULL
    UNION ALL SELECT "A" FROM mta."_DM_DonViToSurveyObjectType" WHERE "A" IS NOT NULL
    UNION ALL SELECT "sParentId" FROM mta."DM_DonVi" WHERE "sParentId" IS NOT NULL
  ) s
),
removed AS (
  DELETE FROM mta."DM_DonVi" d
  WHERE d."Id" IN (SELECT id FROM del_ids)
    AND NOT EXISTS (SELECT 1 FROM ref_ids r WHERE r.id = d."Id")
  RETURNING d."Id"
)
SELECT "Id"::text FROM removed;
COMMIT;
SQL
} | psql -d "$SRC_DB" -q -v ON_ERROR_STOP=1 -At > "$WORKDIR/deleted-internet.txt"

# Bỏ dòng lệnh COMMIT/BEGIN nếu psql in lẫn. Chỉ giữ uuid.
grep -E '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' "$WORKDIR/deleted-internet.txt" > "$WORKDIR/deleted-ids.txt" || true
internet_deleted="$(grep -c . "$WORKDIR/deleted-ids.txt" || true)"

if [[ "$internet_deleted" -eq 0 ]]; then
  echo "Không xóa được dòng nào trên ${SRC_DB}."
  exit 1
fi

echo "Đã xóa trên ${SRC_DB}: ${internet_deleted} dòng. ${DST_DB} không đổi."
if [[ "$internet_deleted" -ne "$delete_count" ]]; then
  echo "Xóa ít hơn danh sách vì một số dòng vừa phát sinh tham chiếu. Các dòng đó được giữ."
fi
echo "Chạy sync-dm-donvi-internet-to-core.sh khi muốn ghi danh sách này sang core."

# export PGHOST=103.172.78.68
# export PGPORT=5432
# export PGUSER=admin
# export PGPASSWORD='123456654321'
# export UNKNOWN_SMA='__Unknown_c812e484'
# ./packages/database/scripts/sync-dm-donvi-internet-to-core.sh


# export PGHOST=103.172.78.68
# export PGPORT=5432
# export PGUSER=admin
# export PGPASSWORD='<mật khẩu trong packages/database/.env>'
# ./packages/database/scripts/delete-duplicate-dm-donvi.sh --apply