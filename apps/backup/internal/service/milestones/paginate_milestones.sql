-- name: MilestonesServicePaginateMilestonesCount :one
SELECT COUNT(*) FROM milestones;

-- name: MilestonesServicePaginateMilestones :many
SELECT *
FROM milestones
ORDER BY created_at DESC
LIMIT sqlc.arg('limit') OFFSET sqlc.arg('offset');
