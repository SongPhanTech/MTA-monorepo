package backups

import (
	"fmt"
	"net/http"

	"github.com/eduardolat/pgbackweb/internal/config"
	"github.com/eduardolat/pgbackweb/internal/database/dbgen"
	"github.com/eduardolat/pgbackweb/internal/logger"
	"github.com/eduardolat/pgbackweb/internal/service/backups"
	"github.com/eduardolat/pgbackweb/internal/util/echoutil"
	"github.com/eduardolat/pgbackweb/internal/util/paginateutil"
	"github.com/eduardolat/pgbackweb/internal/util/timeutil"
	"github.com/eduardolat/pgbackweb/internal/validate"
	"github.com/eduardolat/pgbackweb/internal/view/web/component"
	"github.com/eduardolat/pgbackweb/internal/view/web/respondhtmx"
	"github.com/labstack/echo/v4"
	nodx "github.com/nodxdev/nodxgo"
	htmx "github.com/nodxdev/nodxgo-htmx"
	lucide "github.com/nodxdev/nodxgo-lucide"
)

func (h *handlers) listBackupsHandler(c echo.Context) error {
	ctx := c.Request().Context()

	var formData struct {
		Page int `query:"page" validate:"required,min=1"`
	}
	if err := c.Bind(&formData); err != nil {
		return respondhtmx.ToastError(c, err.Error())
	}
	if err := validate.Struct(&formData); err != nil {
		return respondhtmx.ToastError(c, err.Error())
	}

	pagination, backups, err := h.servs.BackupsService.PaginateBackups(
		ctx, backups.PaginateBackupsParams{
			Page:  formData.Page,
			Limit: 20,
		},
	)

	milestones, err := h.servs.MilestonesService.GetAllMilestones(ctx)
	if err != nil {
		return respondhtmx.ToastError(c, err.Error())
	}

	return echoutil.RenderNodx(
		c, http.StatusOK, listBackups(pagination, backups, milestones),
	)
}

func listBackups(
	pagination paginateutil.PaginateResponse,
	backups []dbgen.BackupsServicePaginateBackupsRow,
	milestones []dbgen.Milestone,
) nodx.Node {
	if len(backups) < 1 {
		return component.EmptyResultsTr(component.EmptyResultsParams{
			Title:    "Không có nhiệm vụ sao lưu",
			Subtitle: "Hãy tạo một nhiệm vụ sao lưu mới",
		})
	}

	yesNoSpan := func(b bool) nodx.Node {
		if b {
			return component.SpanText("Có")
		}
		return component.SpanText("Không")
	}
	env, err := config.GetEnv()
	if err != nil {
		logger.FatalError("error getting environment variables", logger.KV{"error": err})
	}

	trs := []nodx.Node{}
	for _, backup := range backups {

		milestoneName := backup.CronExpression
		for _, m := range milestones {
			if m.CronExpression == backup.CronExpression {
				milestoneName = m.Name
				break
			}
		}

		trs = append(trs, nodx.Tr(
			nodx.Td(component.OptionsDropdown(
				component.OptionsDropdownA(
					nodx.Class("btn btn-sm btn-ghost btn-square"),
					nodx.Href(
						fmt.Sprintf(env.PBW_PREFIX+"/dashboard/executions?backup=%s", backup.ID),
					),
					lucide.List(),
					component.SpanText("Xem lịch sử thực thi"),
				),
				manualRunbutton(backup.ID),
				editBackupButton(backup, milestones),
				duplicateBackupButton(backup.ID),
				deleteBackupButton(backup.ID),
			)),
			nodx.Td(
				nodx.Div(
					nodx.Class("flex items-center space-x-2"),
					component.IsActivePing(backup.IsActive),
					component.SpanText(backup.Name),
				),
			),
			nodx.Td(component.SpanText(backup.DatabaseName)),
			nodx.Td(component.PrettyDestinationName(
				backup.IsLocal, backup.DestinationName,
			)),
			nodx.Td(
				nodx.Class("font-mono"),
				nodx.Div(
					nodx.Class("flex flex-col items-start text-xs"),
					component.SpanText(milestoneName),
					component.SpanText(backup.TimeZone),
				),
			),
			nodx.Td(
				nodx.If(
					backup.RetentionDays == 0,
					lucide.Infinity(),
				),
				nodx.If(
					backup.RetentionDays > 0,
					component.SpanText(fmt.Sprintf("%d ngày", backup.RetentionDays)),
				),
			),
			nodx.Td(yesNoSpan(backup.IsActive)),
			// nodx.Td(yesNoSpan(backup.OptSchemaOnly)),
			// nodx.Td(yesNoSpan(backup.OptClean)),
			// nodx.Td(yesNoSpan(backup.OptIfExists)),
			// nodx.Td(yesNoSpan(backup.OptCreate)),
			// nodx.Td(yesNoSpan(backup.OptNoComments)),
			nodx.Td(component.SpanText(
				backup.CreatedAt.Local().Format(timeutil.LayoutYYYYMMDDHHMMSSPretty),
			)),
		))
	}

	if pagination.HasNextPage {
		trs = append(trs, nodx.Tr(
			htmx.HxGet(fmt.Sprintf(
				env.PBW_PREFIX+"/dashboard/backups/list?page=%d", pagination.NextPage,
			)),
			htmx.HxTrigger("intersect once"),
			htmx.HxSwap("afterend"),
		))
	}

	return component.RenderableGroup(trs)
}
