package backups

import (
	"context"

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

func (h *handlers) manualRunHandler(c echo.Context) error {
	backupID, err := uuid.Parse(c.Param("backupID"))
	if err != nil {
		return respondhtmx.ToastError(c, err.Error())
	}

	go func() {
		_ = h.servs.ExecutionsService.RunManualExecution(context.Background(), backupID)
	}()

	return respondhtmx.ToastSuccess(c, "Sao lưu đã được khởi động, kiểm tra lịch sử thực thi sao lưu để biết thêm chi tiết")
}

func manualRunbutton(backupID uuid.UUID) nodx.Node {
	env, err := config.GetEnv()
	if err != nil {
		logger.FatalError("error getting environment variables", logger.KV{"error": err})
	}
	return component.OptionsDropdownButton(
		htmx.HxPost(env.PBW_PREFIX+"/dashboard/backups/"+backupID.String()+"/run"),
		htmx.HxDisabledELT("this"),
		lucide.Zap(),
		component.SpanText("Chạy sao lưu ngay"),
	)
}
