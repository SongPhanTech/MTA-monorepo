# Load test đăng ký học (k6)

Mục tiêu G5: ramp **0 → 100 → 300 → 500 VU**, không overbook, p95 `class-register` ≤ 3s, 5xx thấp.

## Chuẩn bị

1. Cài [k6](https://grafana.com/docs/k6/latest/set-up/install-k6/).
2. Deploy portal với pool/Postgres đã cấu hình (`deploy/mta-online/be`).
3. Lấy `SESSION_ID`, `CURRICULUM_VERSION_ID`, vài `SUBJECT_CLASS_IDS` còn chỗ.
4. Token đăng nhập SV (Bearer) hoặc cookie session.

## Cấu hình server trước khi test

```bash
# Trên server ~/mta-app/be
# .env đã có POSTGRES_MAX_CONNECTIONS=300
# .env.be-portal có DATABASE_POOL_SIZE=40

docker compose up -d postgres
# restart postgres để áp dụng max_connections nếu vừa sửa .env
docker compose up -d --force-recreate postgres
docker compose up -d mta-be-portal

# Load test dùng 1 AUTH_TOKEN → dễ dính 429 rate-limit. Tạm tắt hoặc tăng max:
# REDIS_RATE_LIMIT_ENABLED=false
# hoặc REDIS_RL_REGISTER_MAX=1000 / REDIS_RL_READ_MAX=5000

# (tuỳ chọn) scale 2 instance
docker compose -f docker-compose.yml -f docker-compose.portal-scale.yml up -d
# Nginx: bật server 127.0.0.1:3046 trong upstream mta_be_portal
```

Kiểm tra connection:

```sql
SHOW max_connections;
SELECT count(*) FROM pg_stat_activity WHERE datname = current_database();
```

## Chạy test

```bash
# Smoke 10 VU / 30s
k6 run \
  -e BASE_URL=http://127.0.0.1:3044/api \
  -e AUTH_TOKEN="$TOKEN" \
  -e SESSION_ID="$SESSION_ID" \
  -e CURRICULUM_VERSION_ID="$CV_ID" \
  -e SUBJECT_CLASS_IDS="id1,id2,id3" \
  scripts/load-test/class-register/k6-class-register.js

# Chỉ đọc danh sách lớp
k6 run -e MODE=read -e BASE_URL=... -e SESSION_ID=... -e CURRICULUM_VERSION_ID=... \
  scripts/load-test/class-register/k6-class-register.js

# Ramp tới 500
k6 run -e RAMP=true -e VUS_MAX=500 \
  -e BASE_URL=https://mta.swantech.vn/api/portal \
  -e AUTH_TOKEN="$TOKEN" \
  -e SESSION_ID="$SESSION_ID" \
  -e CURRICULUM_VERSION_ID="$CV_ID" \
  -e SUBJECT_CLASS_IDS="id1,id2,id3,id4,id5" \
  scripts/load-test/class-register/k6-class-register.js
```

## Tiêu chí đạt

| Metric | Mục tiêu |
|--------|----------|
| Overbook sĩ số (DB) | = 0 |
| 5xx / `errors` | < 5% |
| p95 `class_register_duration` | ≤ 3000 ms |
| Pool exhausted / too many clients | ≈ 0 |

Sau test, đối soát:

```sql
SELECT "subjectClassId", count(*) 
FROM "ql-dao-tao"."StudentSubjectScore"
WHERE "subjectClassId" IN (...)
GROUP BY 1;
-- so với SubjectClass.maxStudent
```
