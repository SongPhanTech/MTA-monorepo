package milestones

import (
	"context"

	"github.com/eduardolat/pgbackweb/internal/database/dbgen"
)

func (s *Service) GetAllMilestones(
	ctx context.Context,
) ([]dbgen.Milestone, error) {
	return s.dbgen.MilestonesServiceGetAllMilestones(ctx)
}
