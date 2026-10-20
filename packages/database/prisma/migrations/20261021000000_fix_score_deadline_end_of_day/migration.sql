-- Bulk deadline APIs stored end deadlines at 00:00 VN (examDate +/- N days)
-- or 00:00 UTC (= 07:00 VN). End deadlines must be 23:59:59.999 VN.
UPDATE "ql-dao-tao"."SubjectClass"
SET "scoreDeadline" = (((((("scoreDeadline" AT TIME ZONE 'UTC') AT TIME ZONE 'Asia/Ho_Chi_Minh')::date)::timestamp
      + INTERVAL '1 day' - INTERVAL '1 millisecond') AT TIME ZONE 'Asia/Ho_Chi_Minh') AT TIME ZONE 'UTC')
WHERE "scoreDeadline" IS NOT NULL
  AND ((("scoreDeadline" AT TIME ZONE 'UTC') AT TIME ZONE 'Asia/Ho_Chi_Minh')::time) IN ('00:00', '07:00');

UPDATE "ql-dao-tao"."SubjectClass"
SET "examScoreDeadline" = (((((("examScoreDeadline" AT TIME ZONE 'UTC') AT TIME ZONE 'Asia/Ho_Chi_Minh')::date)::timestamp
      + INTERVAL '1 day' - INTERVAL '1 millisecond') AT TIME ZONE 'Asia/Ho_Chi_Minh') AT TIME ZONE 'UTC')
WHERE "examScoreDeadline" IS NOT NULL
  AND ((("examScoreDeadline" AT TIME ZONE 'UTC') AT TIME ZONE 'Asia/Ho_Chi_Minh')::time) IN ('00:00', '07:00');

-- Start deadlines from the fixed-date path landed at 07:00 VN; they must be 00:00 VN.
UPDATE "ql-dao-tao"."SubjectClass"
SET "scoreDeadLineStart" = ((((("scoreDeadLineStart" AT TIME ZONE 'UTC') AT TIME ZONE 'Asia/Ho_Chi_Minh')::date)::timestamp
      AT TIME ZONE 'Asia/Ho_Chi_Minh') AT TIME ZONE 'UTC')
WHERE "scoreDeadLineStart" IS NOT NULL
  AND ((("scoreDeadLineStart" AT TIME ZONE 'UTC') AT TIME ZONE 'Asia/Ho_Chi_Minh')::time) = '07:00';
