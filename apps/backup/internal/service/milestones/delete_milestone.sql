-- name: MilestonesServiceDeleteMilestone :exec
DELETE FROM milestones
WHERE id = @id;
