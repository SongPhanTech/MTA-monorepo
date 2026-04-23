-- +goose Up
-- +goose StatementBegin
ALTER TABLE executions ADD COLUMN is_manual BOOLEAN NOT NULL DEFAULT FALSE;
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
ALTER TABLE executions DROP COLUMN is_manual;
-- +goose StatementEnd
