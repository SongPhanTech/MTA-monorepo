-- Remove duplicate ClassRegisterLogs (keep the earliest by createdAt)
DELETE FROM "ql-dao-tao"."ClassRegisterLogs"
WHERE id IN (
  SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER (
      PARTITION BY "classRegisterSessionId", "studentId", "subjectClassId"
      ORDER BY "createdAt" ASC
    ) AS rn
    FROM "ql-dao-tao"."ClassRegisterLogs"
  ) sub
  WHERE rn > 1
);

-- Unique constraint: one log per (session, student, subjectClass)
CREATE UNIQUE INDEX "ClassRegisterLogs_session_student_subjectClass_key"
ON "ql-dao-tao"."ClassRegisterLogs" ("classRegisterSessionId", "studentId", "subjectClassId");

-- Performance indexes for common queries
CREATE INDEX IF NOT EXISTS "ClassRegisterLogs_subjectClassId_idx"
ON "ql-dao-tao"."ClassRegisterLogs" ("subjectClassId");

CREATE INDEX IF NOT EXISTS "ClassRegisterLogs_studentId_idx"
ON "ql-dao-tao"."ClassRegisterLogs" ("studentId");
