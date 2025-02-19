package auth

import (
	"context"

	"github.com/eduardolat/pgbackweb/internal/database/dbgen"
)

func (s *Service) GetUserSessions(
	ctx context.Context, userID string,
) ([]dbgen.Session, error) {
	return s.dbgen.AuthServiceGetUserSessions(ctx, userID)
}
