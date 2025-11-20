package milestones

import (
	"context"

	"github.com/eduardolat/pgbackweb/internal/database/dbgen"
	"github.com/eduardolat/pgbackweb/internal/util/paginateutil"
)

type PaginateMilestonesParams struct {
	Page  int
	Limit int
}

func (s *Service) PaginateMilestones(
	ctx context.Context, params PaginateMilestonesParams,
) (paginateutil.PaginateResponse, []dbgen.Milestone, error) {
	page := max(params.Page, 1)
	limit := min(max(params.Limit, 1), 100)

	count, err := s.dbgen.MilestonesServicePaginateMilestonesCount(ctx)
	if err != nil {
		return paginateutil.PaginateResponse{}, nil, err
	}

	paginateParams := paginateutil.PaginateParams{
		Page:  page,
		Limit: limit,
	}
	offset := paginateutil.CreateOffsetFromParams(paginateParams)
	paginateResponse := paginateutil.CreatePaginateResponse(paginateParams, int(count))

	milestones, err := s.dbgen.MilestonesServicePaginateMilestones(
		ctx, dbgen.MilestonesServicePaginateMilestonesParams{
			Limit:  int32(params.Limit),
			Offset: int32(offset),
		},
	)
	if err != nil {
		return paginateutil.PaginateResponse{}, nil, err
	}

	return paginateResponse, milestones, nil
}
