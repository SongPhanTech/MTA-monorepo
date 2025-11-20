package milestones

import (
	"context"

	"github.com/google/uuid"
)

func (s *Service) DeleteMilestone(
	ctx context.Context, id uuid.UUID,
) error {
	return s.dbgen.MilestonesServiceDeleteMilestone(ctx, id)
}
