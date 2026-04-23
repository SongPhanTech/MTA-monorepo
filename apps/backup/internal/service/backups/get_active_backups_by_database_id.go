package backups

import (
	"context"

	"github.com/eduardolat/pgbackweb/internal/database/dbgen"
	"github.com/google/uuid"
)

func (s *Service) GetActiveBackupsByDatabaseID(
	ctx context.Context, databaseID uuid.UUID,
) ([]dbgen.Backup, error) {
	return s.dbgen.BackupsServiceGetActiveBackupsByDatabaseID(ctx, databaseID)
}
