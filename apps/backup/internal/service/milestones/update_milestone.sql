-- name: MilestonesServiceUpdateMilestone :one
UPDATE milestones
SET
  name = COALESCE(sqlc.narg('name'), @name),
  cron_expression = COALESCE(sqlc.narg('cron_expression'), cron_expression),
  is_active = COALESCE(sqlc.narg('is_active'), is_active)
WHERE id = @id
RETURNING *;
