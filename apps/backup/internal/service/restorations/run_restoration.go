package restorations

import (
	"context"
	"database/sql"
	"fmt"
	"time"

	"github.com/eduardolat/pgbackweb/internal/database/dbgen"
	"github.com/eduardolat/pgbackweb/internal/logger"
	"github.com/google/uuid"
)

// RunRestoration runs a backup restoration
func (s *Service) RunRestoration(
	ctx context.Context,
	executionID uuid.UUID,
	databaseID uuid.NullUUID,
	connString string,
) error {
	updateRes := func(params dbgen.RestorationsServiceUpdateRestorationParams) error {
		_, err := s.dbgen.RestorationsServiceUpdateRestoration(
			ctx, params,
		)
		return err
	}

	logError := func(err error) {
		dbID := "empty"
		if databaseID.Valid {
			dbID = databaseID.UUID.String()
		}
		logger.Error("error running restoration", logger.KV{
			"execution_id": executionID.String(),
			"database_id":  dbID,
			"error":        err.Error(),
		})
	}

	res, err := s.CreateRestoration(ctx, dbgen.RestorationsServiceCreateRestorationParams{
		ExecutionID: executionID,
		DatabaseID:  databaseID,
		Status:      "running",
	})
	if err != nil {
		logError(err)
		return err
	}

	if !databaseID.Valid && connString == "" {
		err := fmt.Errorf("database_id or connection_string must be provided")
		logError(err)
		return updateRes(dbgen.RestorationsServiceUpdateRestorationParams{
			ID:         res.ID,
			Status:     sql.NullString{Valid: true, String: "failed"},
			Message:    sql.NullString{Valid: true, String: err.Error()},
			FinishedAt: sql.NullTime{Valid: true, Time: time.Now()},
		})
	}

	execution, err := s.executionsService.GetExecution(ctx, executionID)
	if err != nil {
		logError(err)
		return updateRes(dbgen.RestorationsServiceUpdateRestorationParams{
			ID:         res.ID,
			Status:     sql.NullString{Valid: true, String: "failed"},
			Message:    sql.NullString{Valid: true, String: err.Error()},
			FinishedAt: sql.NullTime{Valid: true, Time: time.Now()},
		})
	}

	if execution.Status != "success" || !execution.Path.Valid {
		err := fmt.Errorf("backup execution must be successful")
		logError(err)
		return updateRes(dbgen.RestorationsServiceUpdateRestorationParams{
			ID:         res.ID,
			Status:     sql.NullString{Valid: true, String: "failed"},
			Message:    sql.NullString{Valid: true, String: err.Error()},
			FinishedAt: sql.NullTime{Valid: true, Time: time.Now()},
		})
	}

	if databaseID.Valid {
		db, err := s.databasesService.GetDatabase(ctx, databaseID.UUID)
		if err != nil {
			logError(err)
			return updateRes(dbgen.RestorationsServiceUpdateRestorationParams{
				ID:         res.ID,
				Status:     sql.NullString{Valid: true, String: "failed"},
				Message:    sql.NullString{Valid: true, String: err.Error()},
				FinishedAt: sql.NullTime{Valid: true, Time: time.Now()},
			})
		}
		connString = db.DecryptedConnectionString

		// Tự động sao lưu cơ sở dữ liệu đích trước khi phục hồi
		activeBackups, err := s.backupsService.GetActiveBackupsByDatabaseID(ctx, databaseID.UUID)
		if err != nil {
			logger.Error("không thể lấy danh sách sao lưu trước khi phục hồi", logger.KV{
				"database_id": databaseID.UUID.String(),
				"error":       err.Error(),
			})
		} else if len(activeBackups) > 0 {
			preBackupID := activeBackups[0].ID
			logger.Info("đang sao lưu cơ sở dữ liệu trước khi phục hồi", logger.KV{
				"backup_id":   preBackupID.String(),
				"database_id": databaseID.UUID.String(),
			})
			if err := s.executionsService.RunManualExecution(ctx, preBackupID); err != nil {
				logger.Error("sao lưu trước khi phục hồi thất bại, vẫn tiếp tục phục hồi", logger.KV{
					"backup_id": preBackupID.String(),
					"error":     err.Error(),
				})
			}
		} else {
			logger.Info("không tìm thấy cấu hình sao lưu đang hoạt động cho cơ sở dữ liệu đích, bỏ qua bước sao lưu trước", logger.KV{
				"database_id": databaseID.UUID.String(),
			})
		}
	}

	pgVersion, err := s.ints.PGClient.ParseVersion(execution.DatabasePgVersion)
	if err != nil {
		logError(err)
		return updateRes(dbgen.RestorationsServiceUpdateRestorationParams{
			ID:         res.ID,
			Status:     sql.NullString{Valid: true, String: "failed"},
			Message:    sql.NullString{Valid: true, String: err.Error()},
			FinishedAt: sql.NullTime{Valid: true, Time: time.Now()},
		})
	}

	err = s.ints.PGClient.Test(pgVersion, connString)
	if err != nil {
		logError(err)
		return updateRes(dbgen.RestorationsServiceUpdateRestorationParams{
			ID:         res.ID,
			Status:     sql.NullString{Valid: true, String: "failed"},
			Message:    sql.NullString{Valid: true, String: err.Error()},
			FinishedAt: sql.NullTime{Valid: true, Time: time.Now()},
		})
	}

	isLocal, zipURLOrPath, err := s.executionsService.GetExecutionDownloadLinkOrPath(
		ctx, executionID,
	)
	if err != nil {
		logError(err)
		return updateRes(dbgen.RestorationsServiceUpdateRestorationParams{
			ID:         res.ID,
			Status:     sql.NullString{Valid: true, String: "failed"},
			Message:    sql.NullString{Valid: true, String: err.Error()},
			FinishedAt: sql.NullTime{Valid: true, Time: time.Now()},
		})
	}

	outCmd := ""

	err, outCmd = s.ints.PGClient.RestoreZip(
		pgVersion, connString, isLocal, zipURLOrPath,
	)
	if err != nil {
		logError(err)
		return updateRes(dbgen.RestorationsServiceUpdateRestorationParams{
			ID:         res.ID,
			Status:     sql.NullString{Valid: true, String: "failed"},
			Message:    sql.NullString{Valid: true, String: err.Error()},
			FinishedAt: sql.NullTime{Valid: true, Time: time.Now()},
		})
	}

	logger.Info("backup restored successfully", logger.KV{
		"restoration_id": res.ID.String(),
		"execution_id":   executionID.String(),
	})
	return updateRes(dbgen.RestorationsServiceUpdateRestorationParams{
		ID:         res.ID,
		Status:     sql.NullString{Valid: true, String: "success"},
		Message:    sql.NullString{Valid: true, String: outCmd},
		FinishedAt: sql.NullTime{Valid: true, Time: time.Now()},
	})
}
