package milestones

import (
	"context"
	"fmt"

	"github.com/eduardolat/pgbackweb/internal/database/dbgen"
	"github.com/eduardolat/pgbackweb/internal/validate"
)

func (s *Service) CreateMilestone(
	ctx context.Context, params dbgen.MilestonesServiceCreateMilestoneParams,
) (dbgen.Milestone, error) {
	if !validate.CronExpression(params.CronExpression) {
		return dbgen.Milestone{}, fmt.Errorf("invalid cron expression")
	}

	milestone, err := s.dbgen.MilestonesServiceCreateMilestone(ctx, params)
	if err != nil {
		return milestone, err
	}

	return milestone, nil
}
