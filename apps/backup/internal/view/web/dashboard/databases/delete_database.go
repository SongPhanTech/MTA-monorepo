package databases

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

func (h *handlers) deleteDatabaseHandler(c echo.Context) error {
	ctx := c.Request().Context()

	databaseID, err := uuid.Parse(c.Param("databaseID"))
	if err != nil {
		return respondhtmx.ToastError(c, err.Error())
	}

	if err = h.servs.DatabasesService.DeleteDatabase(ctx, databaseID); err != nil {
		return respondhtmx.ToastError(c, err.Error())
	}

	return respondhtmx.Refresh(c)
}

func deleteDatabaseButton(databaseID uuid.UUID) nodx.Node {
	env, err := config.GetEnv()
	if err != nil {
		logger.FatalError("error getting environment variables", logger.KV{"error": err})
	}
	return component.OptionsDropdownButton(
		htmx.HxDelete(env.PBW_PREFIX+"/dashboard/databases/"+databaseID.String()),
		htmx.HxConfirm("Are you sure you want to delete this database?"),
		lucide.Trash(),
		component.SpanText("Delete database"),
	)
}
