package milestones

import (
	"context"

	"github.com/eduardolat/pgbackweb/internal/database/dbgen"
	"github.com/google/uuid"
)

func (s *Service) GetMilestone(
	ctx context.Context, id uuid.UUID,
) (dbgen.Milestone, error) {
	return s.dbgen.MilestonesServiceGetMilestone(ctx, id)
}
