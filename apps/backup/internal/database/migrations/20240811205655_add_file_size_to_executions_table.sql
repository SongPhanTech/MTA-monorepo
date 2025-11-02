-- +goose Up
-- +goose StatementBegin
ALTER TABLE executions ADD COLUMN IF NOT EXISTS file_size BIGINT NULL DEFAULT NULL;
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
ALTER TABLE executions DROP COLUMN IF EXISTS file_size;
-- +goose StatementEnd
