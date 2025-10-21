DROP FUNCTION IF EXISTS update_fullname();
CREATE FUNCTION update_fullname() RETURNS TRIGGER AS $$
BEGIN
  NEW.fullname := NEW."lastName" || ' ' || NEW."firstName";
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER fullname_trigger
BEFORE INSERT OR UPDATE ON "ql-nguoi-dung"."UserProfile"
FOR EACH ROW EXECUTE FUNCTION update_fullname();