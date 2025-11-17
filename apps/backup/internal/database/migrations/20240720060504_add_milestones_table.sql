-- +goose Up
-- +goose StatementBegin
CREATE TABLE IF NOT EXISTS milestones (
  id UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  cron_expression TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);
drop trigger if exists milestones_change_updated_at on milestones;
CREATE TRIGGER milestones_change_updated_at
BEFORE UPDATE ON milestones FOR EACH ROW EXECUTE FUNCTION change_updated_at();
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP TABLE IF EXISTS milestones;
-- +goose StatementEnd
