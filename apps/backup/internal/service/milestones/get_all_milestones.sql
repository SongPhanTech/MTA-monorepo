-- name: MilestonesServiceGetAllMilestones :many
SELECT * FROM milestones
ORDER BY created_at DESC;
