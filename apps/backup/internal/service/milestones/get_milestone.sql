-- name: MilestonesServiceGetMilestone :one
SELECT * FROM milestones
WHERE id = @id;
