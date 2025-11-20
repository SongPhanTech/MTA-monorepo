package milestones

import (
	"context"

	"github.com/eduardolat/pgbackweb/internal/database/dbgen"
)

func (s *Service) GetMilestonesQty(
	ctx context.Context,
) (dbgen.MilestonesServiceGetMilestonesQtyRow, error) {
	return s.dbgen.MilestonesServiceGetMilestonesQty(ctx)
}
