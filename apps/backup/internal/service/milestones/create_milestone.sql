-- name: MilestonesServiceCreateMilestone :one
INSERT INTO milestones  (
   name, cron_expression, is_active
)
VALUES (
  @name, @cron_expression, @is_active
)
RETURNING *;
