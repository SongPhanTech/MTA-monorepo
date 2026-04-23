-- name: BackupsServiceGetActiveBackupsByDatabaseID :many
SELECT * FROM backups
WHERE database_id = @database_id
  AND is_active = TRUE
ORDER BY created_at DESC;
