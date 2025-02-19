package auth

import (
	"context"
)

func (s *Service) DeleteAllUserSessions(
	ctx context.Context, userID string,
) error {
	return s.dbgen.AuthServiceDeleteAllUserSessions(ctx, userID)
}
