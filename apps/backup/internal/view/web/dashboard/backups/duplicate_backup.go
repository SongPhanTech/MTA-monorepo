package backups

import (
	"github.com/eduardolat/pgbackweb/internal/config"
	"github.com/eduardolat/pgbackweb/internal/logger"
	"github.com/eduardolat/pgbackweb/internal/view/web/component"
	"github.com/eduardolat/pgbackweb/internal/view/web/respondhtmx"
	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
	nodx "github.com/nodxdev/nodxgo"
	htmx "github.com/nodxdev/nodxgo-htmx"
	lucide "github.com/nodxdev/nodxgo-lucide"
)

func (h *handlers) duplicateBackupHandler(c echo.Context) error {
	ctx := c.Request().Context()

	backupID, err := uuid.Parse(c.Param("backupID"))
	if err != nil {
		return respondhtmx.ToastError(c, err.Error())
	}

	if _, err = h.servs.BackupsService.DuplicateBackup(ctx, backupID); err != nil {
		return respondhtmx.ToastError(c, err.Error())
	}

	return respondhtmx.Refresh(c)
}

func duplicateBackupButton(backupID uuid.UUID) nodx.Node {
	env, err := config.GetEnv()
	if err != nil {
		logger.FatalError("error getting environment variables", logger.KV{"error": err})
	}
	return component.OptionsDropdownButton(
		htmx.HxPost(env.PBW_PREFIX+"/dashboard/backups/"+backupID.String()+"/duplicate"),
		htmx.HxConfirm("Bạn có chắc chắn muốn nhân bản nhiệm vụ sao lưu này không?"),
		lucide.CopyPlus(),
		component.SpanText("Nhân bản nhiệm vụ sao lưu"),
	)
}
