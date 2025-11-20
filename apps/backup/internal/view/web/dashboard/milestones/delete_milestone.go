package milestones

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

func (h *handlers) deleteMilestoneHandler(c echo.Context) error {
	ctx := c.Request().Context()

	milestoneID, err := uuid.Parse(c.Param("milestoneID"))
	if err != nil {
		return respondhtmx.ToastError(c, err.Error())
	}

	if err = h.servs.BackupsService.DeleteBackup(ctx, milestoneID); err != nil {
		return respondhtmx.ToastError(c, err.Error())
	}

	return respondhtmx.Refresh(c)
}

func deleteMilestoneButton(milestoneID uuid.UUID) nodx.Node {
	env, err := config.GetEnv()
	if err != nil {
		logger.FatalError("error getting environment variables", logger.KV{"error": err})
	}
	return component.OptionsDropdownButton(
		htmx.HxDelete(env.PBW_PREFIX+"/dashboard/milestones/"+milestoneID.String()),
		htmx.HxConfirm("Bạn có chắc chắn muốn xóa mốc thời gian này không?"),
		lucide.Trash(),
		component.SpanText("Xóa mốc thời gian"),
	)
}
