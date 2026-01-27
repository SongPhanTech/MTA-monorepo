-- 1. Create function within the specific schema
CREATE OR REPLACE FUNCTION "ql-dao-tao".clamp_final_score()
RETURNS TRIGGER AS $$
BEGIN
    -- Functional logic: check and cap
    IF NEW."finalScore" > 10 THEN
        NEW."finalScore" := 10;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Bind trigger to the table
CREATE TRIGGER trg_clamp_final_score
BEFORE INSERT OR UPDATE ON "ql-dao-tao"."StudentSubjectScore"
FOR EACH ROW
EXECUTE FUNCTION "ql-dao-tao".clamp_final_score();