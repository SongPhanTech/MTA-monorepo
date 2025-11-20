package milestones

import (
	"context"
	"fmt"

	"github.com/eduardolat/pgbackweb/internal/database/dbgen"
	"github.com/eduardolat/pgbackweb/internal/validate"
)

func (s *Service) UpdateMilestone(
	ctx context.Context, params dbgen.MilestonesServiceUpdateMilestoneParams,
) (dbgen.Milestone, error) {
	if !validate.CronExpression(params.CronExpression.String) {
		return dbgen.Milestone{}, fmt.Errorf("invalid cron expression")
	}

	milestone, err := s.dbgen.MilestonesServiceUpdateMilestone(ctx, params)
	if err != nil {
		return milestone, err
	}

	return milestone, nil
}
