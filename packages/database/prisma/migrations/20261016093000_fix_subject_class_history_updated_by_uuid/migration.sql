-- updatedById is uuid. The trigger stored the session user id as text,
-- so SubjectClass updates that change score deadlines failed with SQLSTATE 42804.
CREATE OR REPLACE FUNCTION "ql-dao-tao".log_subject_class_changes()
RETURNS TRIGGER AS $$
DECLARE
  v_updated_by_id UUID;
BEGIN
  BEGIN
    v_updated_by_id := NULLIF(btrim(current_setting('app.updated_by_id', true)), '')::uuid;
  EXCEPTION
    WHEN others THEN
      v_updated_by_id := NULL;
  END;

  IF (NEW."scoreDeadLineStart" IS DISTINCT FROM OLD."scoreDeadLineStart")
     OR (NEW."scoreDeadline" IS DISTINCT FROM OLD."scoreDeadline")
     OR (NEW."examScoreDeadline" IS DISTINCT FROM OLD."examScoreDeadline")
     OR (NEW."isLockScore" IS DISTINCT FROM OLD."isLockScore")
     OR (NEW."isLockExamScore" IS DISTINCT FROM OLD."isLockExamScore")
     OR (NEW."scoreSubmitted" IS DISTINCT FROM OLD."scoreSubmitted")
     OR (NEW."scoreChecked" IS DISTINCT FROM OLD."scoreChecked") THEN

    INSERT INTO "ql-dao-tao"."SubjectClassHistory" (
      "id",
      "subjectClassId",
      "scoreDeadLineStart",
      "scoreDeadline",
      "examScoreDeadline",
      "isLockScore",
      "isLockExamScore",
      "scoreSubmitted",
      "scoreChecked",
      "updatedById",
      "createdAt",
      "updatedAt"
    )
    VALUES (
      gen_random_uuid(),
      NEW."id",
      NEW."scoreDeadLineStart",
      NEW."scoreDeadline",
      NEW."examScoreDeadline",
      NEW."isLockScore",
      NEW."isLockExamScore",
      NEW."scoreSubmitted",
      NEW."scoreChecked",
      v_updated_by_id,
      NOW(),
      NOW()
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
