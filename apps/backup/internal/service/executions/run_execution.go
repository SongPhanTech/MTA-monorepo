package executions

import (
	"bufio"
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"regexp"
	"strings"
	"time"

	"github.com/eduardolat/pgbackweb/internal/database/dbgen"
	"github.com/eduardolat/pgbackweb/internal/integration/postgres"
	"github.com/eduardolat/pgbackweb/internal/logger"
	"github.com/eduardolat/pgbackweb/internal/util/strutil"
	"github.com/eduardolat/pgbackweb/internal/util/timeutil"
	"github.com/google/uuid"
)

// RunExecution runs an automatic (scheduled) backup execution
func (s *Service) RunExecution(ctx context.Context, backupID uuid.UUID) error {
	return s.runExecutionInternal(ctx, backupID, false)
}

// RunManualExecution runs a manually triggered backup execution
func (s *Service) RunManualExecution(ctx context.Context, backupID uuid.UUID) error {
	return s.runExecutionInternal(ctx, backupID, true)
}

// runExecutionInternal runs a backup execution
func (s *Service) runExecutionInternal(ctx context.Context, backupID uuid.UUID, isManual bool) error {
	updateExec := func(params dbgen.ExecutionsServiceUpdateExecutionParams) error {
		if params.Status.String == "success" {
			s.webhooksService.RunExecutionSuccess(backupID)
		}

		if params.Status.String == "failed" {
			s.webhooksService.RunExecutionFailed(backupID)
		}

		_, err := s.dbgen.ExecutionsServiceUpdateExecution(
			ctx, params,
		)
		return err
	}

	logError := func(err error) {
		logger.Error("error running backup", logger.KV{
			"backup_id": backupID.String(),
			"error":     err.Error(),
		})
	}

	back, err := s.dbgen.ExecutionsServiceGetBackupData(
		ctx, dbgen.ExecutionsServiceGetBackupDataParams{
			BackupID:      backupID,
			EncryptionKey: s.env.PBW_ENCRYPTION_KEY,
		},
	)
	if err != nil {
		logError(err)
		return err
	}

	ex, err := s.CreateExecution(ctx, dbgen.ExecutionsServiceCreateExecutionParams{
		BackupID: backupID,
		Status:   "running",
		IsManual: isManual,
	})
	if err != nil {
		logError(err)
		return err
	}

	if !back.BackupIsLocal {
		err = s.ints.StorageClient.S3Test(
			back.DecryptedDestinationAccessKey, back.DecryptedDestinationSecretKey,
			back.DestinationRegion.String, back.DestinationEndpoint.String,
			back.DestinationBucketName.String,
		)
		if err != nil {
			logError(err)
			return updateExec(dbgen.ExecutionsServiceUpdateExecutionParams{
				ID:         ex.ID,
				Status:     sql.NullString{Valid: true, String: "failed"},
				Message:    sql.NullString{Valid: true, String: err.Error()},
				FinishedAt: sql.NullTime{Valid: true, Time: time.Now()},
			})
		}
	}

	pgVersion, err := s.ints.PGClient.ParseVersion(back.DatabasePgVersion)
	if err != nil {
		logError(err)
		return updateExec(dbgen.ExecutionsServiceUpdateExecutionParams{
			ID:         ex.ID,
			Status:     sql.NullString{Valid: true, String: "failed"},
			Message:    sql.NullString{Valid: true, String: err.Error()},
			FinishedAt: sql.NullTime{Valid: true, Time: time.Now()},
		})
	}

	err = s.ints.PGClient.Test(pgVersion, back.DecryptedDatabaseConnectionString)
	if err != nil {
		logError(err)
		return updateExec(dbgen.ExecutionsServiceUpdateExecutionParams{
			ID:         ex.ID,
			Status:     sql.NullString{Valid: true, String: "failed"},
			Message:    sql.NullString{Valid: true, String: err.Error()},
			FinishedAt: sql.NullTime{Valid: true, Time: time.Now()},
		})
	}

	dumpReader := s.ints.PGClient.DumpZip(
		pgVersion, back.DecryptedDatabaseConnectionString, postgres.DumpParams{
			DataOnly:   back.BackupOptDataOnly,
			SchemaOnly: back.BackupOptSchemaOnly,
			Clean:      back.BackupOptClean,
			IfExists:   back.BackupOptIfExists,
			Create:     back.BackupOptCreate,
			NoComments: back.BackupOptNoComments,
		},
	)

	date := time.Now().Format(timeutil.LayoutSlashYYYYMMDD)
	file := fmt.Sprintf(
		"dump-%s-%s.zip",
		time.Now().Format(timeutil.LayoutYYYYMMDDHHMMSS),
		uuid.NewString(),
	)
	path := strutil.CreatePath(false, back.BackupDestDir, date, file)
	fileSize := int64(0)

	if back.BackupIsLocal {
		fileSize, err = s.ints.StorageClient.LocalUpload(path, dumpReader)
		if err != nil {
			logError(err)
			return updateExec(dbgen.ExecutionsServiceUpdateExecutionParams{
				ID:         ex.ID,
				Status:     sql.NullString{Valid: true, String: "failed"},
				Message:    sql.NullString{Valid: true, String: err.Error()},
				Path:       sql.NullString{Valid: true, String: path},
				FinishedAt: sql.NullTime{Valid: true, Time: time.Now()},
			})
		}
	}

	if !back.BackupIsLocal {
		fileSize, err = s.ints.StorageClient.S3Upload(
			back.DecryptedDestinationAccessKey, back.DecryptedDestinationSecretKey,
			back.DestinationRegion.String, back.DestinationEndpoint.String,
			back.DestinationBucketName.String, path, dumpReader,
		)
		if err != nil {
			logError(err)
			return updateExec(dbgen.ExecutionsServiceUpdateExecutionParams{
				ID:         ex.ID,
				Status:     sql.NullString{Valid: true, String: "failed"},
				Message:    sql.NullString{Valid: true, String: err.Error()},
				Path:       sql.NullString{Valid: true, String: path},
				FinishedAt: sql.NullTime{Valid: true, Time: time.Now()},
			})
		}
	}

	reCopyStart := regexp.MustCompile(`(?i)^COPY\s+"?([a-zA-Z0-9_-]+)"?\."?([a-zA-Z0-9_-]+)"?`)
	scanner := bufio.NewScanner(dumpReader)

	type CopyInfo struct {
		Schema  string `json:"schema"`
		Table   string `json:"table"`
		Records int    `json:"records"`
	}
	var result []CopyInfo

	var schema, table string
	var count int
	inCopy := false

	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())
		logger.Info("read line", logger.KV{
			"backup_id": backupID.String(),
			"line":      line,
		})
		if line == "" {
			continue
		}
		if matches := reCopyStart.FindStringSubmatch(line); len(matches) > 2 {
			// Nếu đang trong khối cũ thì lưu lại
			if inCopy {
				result = append(result, CopyInfo{schema, table, count})
				count = 0
			}
			schema = matches[1]
			table = matches[2]
			inCopy = true
			continue
		}

		if line == `\.` {
			// Kết thúc một COPY
			if inCopy {
				result = append(result, CopyInfo{schema, table, count})
				inCopy = false
				count = 0
			}
			continue
		}

		if inCopy {
			count++
		}
	}

	// In kết quả JSON
	out, _ := json.MarshalIndent(result, "", "  ")
	logger.Info("backup created successfully", logger.KV{
		"backup_id":    backupID.String(),
		"execution_id": ex.ID.String(),
		"copy_info":    string(out),
	})
	return updateExec(dbgen.ExecutionsServiceUpdateExecutionParams{
		ID:         ex.ID,
		Status:     sql.NullString{Valid: true, String: "success"},
		Message:    sql.NullString{Valid: true, String: "Tạo bản sao lưu thành công"},
		Path:       sql.NullString{Valid: true, String: path},
		FinishedAt: sql.NullTime{Valid: true, Time: time.Now()},
		FileSize:   sql.NullInt64{Valid: true, Int64: fileSize},
	})
}
