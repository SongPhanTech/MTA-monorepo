#!/usr/bin/env bash
# Wrapper: tải prefix tai-lieu/ từ MinIO rồi zip (dùng Node + package minio trong monorepo).
#
# Console UI: http://192.168.100.138:9001  — API S3 thường là :9000
#
# Usage:
#   ./scripts/download-minio-tai-lieu.sh
#   ./scripts/download-minio-tai-lieu.sh --keep
#   OUT_DIR=~/Downloads ./scripts/download-minio-tai-lieu.sh
#
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
NODE_BIN="${NODE_BIN:-}"

if [[ -z "$NODE_BIN" ]]; then
  if command -v node >/dev/null 2>&1; then
    NODE_BIN="$(command -v node)"
  elif command -v bun >/dev/null 2>&1; then
    NODE_BIN="$(command -v bun)"
  else
    echo "Cần node hoặc bun." >&2
    exit 1
  fi
fi

exec "$NODE_BIN" "${SCRIPT_DIR}/download-minio-tai-lieu.mjs" "$@"
