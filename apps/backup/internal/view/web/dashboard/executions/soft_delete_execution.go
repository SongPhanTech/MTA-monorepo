package executions

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

func (h *handlers) deleteExecutionHandler(c echo.Context) error {
	ctx := c.Request().Context()

	executionID, err := uuid.Parse(c.Param("executionID"))
	if err != nil {
		return respondhtmx.ToastError(c, err.Error())
	}

	err = h.servs.ExecutionsService.SoftDeleteExecution(ctx, executionID)
	if err != nil {
		return respondhtmx.ToastError(c, err.Error())
	}

	return respondhtmx.Refresh(c)
}

func deleteExecutionButton(executionID uuid.UUID) nodx.Node {
	env, err := config.GetEnv()
	if err != nil {
		logger.FatalError("error getting environment variables", logger.KV{"error": err})
	}
	return nodx.Button(
		htmx.HxDelete(env.PBW_PREFIX+"/dashboard/executions/"+executionID.String()),
		htmx.HxDisabledELT("this"),
		htmx.HxConfirm("Bạn có chắc chắn muốn xoá thực thi này không? Việc này sẽ xoá file backup khỏi đích đến và không thể khôi phục."),
		nodx.Class("btn btn-error btn-outline"),
		component.SpanText("Xoá"),
		lucide.Trash(),
	)
}
