-- name: ExecutionsServiceCreateExecution :one
INSERT INTO executions (backup_id, status, message, path, is_manual)
VALUES (@backup_id, @status, @message, @path, @is_manual)
RETURNING *;
