#!/usr/bin/env bash
# Tạo StudentSubjectScore còn thiếu từ ClassRegisterLogs (đưa SV vào lớp môn học).
#
# DB mặc định: postgres://admin:123456654321@192.168.100.132:5432/mta
# Chỉ xử lý log đăng ký hợp lệ (PENDING / SUCCESS) chưa có SSS tương ứng.
#
# Usage (trên server nội bộ):
#   cd /path/to/MTA-monorepo
#   ./scripts/sync-student-subject-score.sh --dry-run
#   ./scripts/sync-student-subject-score.sh
#   ./scripts/sync-student-subject-score.sh --session=cmse0eu6t0001sh3d0h9yfidl
#   ./scripts/sync-student-subject-score.sh --approved-only   # chỉ log SUCCESS
#
set -euo pipefail

DATABASE_URL="${DATABASE_URL:-postgres://admin:123456654321@192.168.100.132:5432/mta}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
SYNC_JS="${REPO_ROOT}/packages/database/scripts/sync-student-subject-score-from-registration.mjs"

EXTRA_ARGS=()
ONLY_APPROVED=false

for arg in "$@"; do
  case "$arg" in
    --approved-only)
      ONLY_APPROVED=true
      ;;
    --dry-run|--session=*|--batch=*|--limit=*)
      EXTRA_ARGS+=("$arg")
      ;;
    -h|--help)
      sed -n '2,14p' "$0"
      echo ""
      echo "Biến môi trường:"
      echo "  DATABASE_URL  (mặc định: postgres://admin:...@192.168.100.132:5432/mta)"
      exit 0
      ;;
    *)
      echo "Unknown option: $arg (dùng --help)"
      exit 1
      ;;
  esac
done

if [[ "$ONLY_APPROVED" == true ]]; then
  EXTRA_ARGS+=("--status=SUCCESS")
fi

if [[ ! -f "$SYNC_JS" ]]; then
  echo "Không tìm thấy: $SYNC_JS"
  exit 1
fi

if ! command -v bun >/dev/null 2>&1; then
  echo "Cần cài bun trên server."
  exit 1
fi

echo "=============================================="
echo " Đưa SV vào lớp môn học (ClassRegisterLogs → SSS)"
echo " DATABASE_URL=${DATABASE_URL}"
echo "=============================================="

cd "${REPO_ROOT}/packages/database"

DATABASE_URL="$DATABASE_URL" \
  bun scripts/sync-student-subject-score-from-registration.mjs \
    --mode=repair "${EXTRA_ARGS[@]}"

echo "Done."
