#!/usr/bin/env bash
# Ghi đè public."DM_DonVi" trên mta_core_db bằng mta."DM_DonVi" của mta_internet.
# Bỏ qua sGhiChu và sTKBUCode (core không có hai cột này).
#
# Chạy trong mạng nội bộ, máy có psql và mở được cổng 5432 của PostgreSQL.
#
#   export PGHOST=103.172.78.68
#   export PGPORT=5432
#   export PGUSER=admin
#   export PGPASSWORD='<mật khẩu trong packages/database/.env>'
#   # Dòng Unknown (c812e484-...) đang để trống sMa. Core bắt buộc có mã.
#   # Bỏ comment nếu muốn gán mã cũ của core trước khi ghi:
#   # export UNKNOWN_SMA='__Unknown_c812e484'
#   ./packages/database/scripts/sync-dm-donvi-internet-to-core.sh
#
# Script hỏi YES trước khi xóa dữ liệu core. Backup file hiện có:
#   packages/database/scripts/backups/DM_DonVi_mta_core_db_20261020_211746.sql

set -euo pipefail

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
UNKNOWN_SMA="${UNKNOWN_SMA:-}"

CSV="$(mktemp "${TMPDIR:-/tmp}/dm_donvi_internet.XXXXXX.csv")"
trap 'rm -f "$CSV"' EXIT

echo "Nguồn: ${SRC_DB} @ ${PGHOST}  schema mta.DM_DonVi"
echo "Đích:  ${DST_DB} @ ${PGHOST}  schema public.DM_DonVi"
echo "Bỏ qua cột: sGhiChu, sTKBUCode"
echo
echo "Thao tác này xóa toàn bộ DM_DonVi đang có trên core rồi thay bằng dữ liệu internet."
printf 'Gõ YES để tiếp tục: '
read -r confirm
if [[ "$(printf '%s' "$confirm" | tr '[:upper:]' '[:lower:]')" != "yes" ]]; then
  echo "Đã hủy."
  exit 1
fi

psql -d "$SRC_DB" -v ON_ERROR_STOP=1 -c "\copy (
  SELECT
    \"Id\", \"sMa\", \"sTen\", \"sParentId\", \"sTruongDonVi\", \"sTenVietTat\",
    \"sChucNangNhiemVu\", \"sDiaChi\", \"iNhomDonVi\", \"iCapDonVi\", \"iLoaiDonVi\",
    \"iSTT\", \"bActive\", \"bDeleted\", \"bSystem\", \"iDictionaryKey\", \"sCode\",
    \"sNguoiTao\", \"sNguoiSua\", \"dNgayTao\", \"dNgaySua\", \"sThietBiTao\", \"sThietBiSua\"
  FROM mta.\"DM_DonVi\"
  ORDER BY \"Id\"
) TO '$CSV' WITH (FORMAT csv, HEADER true)"

SRC_ROWS="$(psql -d "$SRC_DB" -At -c 'SELECT count(*) FROM mta."DM_DonVi";')"
echo "Đã xuất ${SRC_ROWS} dòng từ internet."

{
  cat <<'SQL'
BEGIN;
SET TIME ZONE 'Asia/Ho_Chi_Minh';

CREATE TEMP TABLE stg_dm_donvi (LIKE public."DM_DonVi" INCLUDING DEFAULTS);
ALTER TABLE stg_dm_donvi ALTER COLUMN "sMa" DROP NOT NULL;
ALTER TABLE stg_dm_donvi ALTER COLUMN "dNgayTao" TYPE timestamp without time zone;
ALTER TABLE stg_dm_donvi ALTER COLUMN "dNgaySua" TYPE timestamp without time zone;

COPY stg_dm_donvi FROM STDIN WITH (FORMAT csv, HEADER true);
SQL
  cat "$CSV"
  printf '\\.\n'
  cat <<'SQL'

UPDATE stg_dm_donvi
SET "sMa" = NULLIF(:'unknown_sma', '')
WHERE "Id" = 'c812e484-a21b-4ed9-9b6e-3b138a30825a'
  AND "sMa" IS NULL
  AND NULLIF(:'unknown_sma', '') IS NOT NULL;

SELECT set_config('sync.expected_rows', :'expected_rows', true);

DO $$
DECLARE
  missing text;
  n integer;
  expected integer := current_setting('sync.expected_rows')::integer;
BEGIN
  SELECT string_agg(format('%s | %s', "Id", COALESCE("sTen", '')), E'\n')
  INTO missing
  FROM stg_dm_donvi
  WHERE "sMa" IS NULL;

  IF missing IS NOT NULL THEN
    RAISE EXCEPTION E'sMa đang trống, core không nhận. Đặt UNKNOWN_SMA rồi chạy lại:\n%', missing;
  END IF;

  SELECT count(*) INTO n FROM stg_dm_donvi;
  IF n <> expected THEN
    RAISE EXCEPTION 'Staging có % dòng, nguồn có % dòng', n, expected;
  END IF;
END
$$;

TRUNCATE TABLE public."DM_DonVi";

INSERT INTO public."DM_DonVi" (
  "Id", "sMa", "sTen", "sParentId", "sTruongDonVi", "sTenVietTat",
  "sChucNangNhiemVu", "sDiaChi", "iNhomDonVi", "iCapDonVi", "iLoaiDonVi",
  "iSTT", "bActive", "bDeleted", "bSystem", "iDictionaryKey", "sCode",
  "sNguoiTao", "sNguoiSua", "dNgayTao", "dNgaySua", "sThietBiTao", "sThietBiSua"
)
SELECT
  "Id", "sMa", "sTen", "sParentId", "sTruongDonVi", "sTenVietTat",
  "sChucNangNhiemVu", "sDiaChi", "iNhomDonVi", "iCapDonVi", "iLoaiDonVi",
  "iSTT", "bActive", "bDeleted", "bSystem", "iDictionaryKey", "sCode",
  "sNguoiTao", "sNguoiSua",
  "dNgayTao"::timestamptz,
  "dNgaySua"::timestamptz,
  "sThietBiTao", "sThietBiSua"
FROM stg_dm_donvi;

DO $$
DECLARE
  n integer;
  expected integer := current_setting('sync.expected_rows')::integer;
BEGIN
  SELECT count(*) INTO n FROM public."DM_DonVi";
  IF n <> expected THEN
    RAISE EXCEPTION 'Sau ghi đè còn % dòng, dự kiến %', n, expected;
  END IF;
END
$$;

COMMIT;
SQL
} | psql -d "$DST_DB" -v ON_ERROR_STOP=1 \
  -v "unknown_sma=${UNKNOWN_SMA}" \
  -v "expected_rows=${SRC_ROWS}"

echo "Đã ghi đè public.DM_DonVi trên ${DST_DB}: ${SRC_ROWS} dòng."
