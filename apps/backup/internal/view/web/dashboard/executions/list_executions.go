package executions

import (
	"database/sql"
	"fmt"
	"net/http"

	"github.com/eduardolat/pgbackweb/internal/config"
	"github.com/eduardolat/pgbackweb/internal/database/dbgen"
	"github.com/eduardolat/pgbackweb/internal/logger"
	"github.com/eduardolat/pgbackweb/internal/service/executions"
	"github.com/eduardolat/pgbackweb/internal/util/echoutil"
	"github.com/eduardolat/pgbackweb/internal/util/paginateutil"
	"github.com/eduardolat/pgbackweb/internal/util/strutil"
	"github.com/eduardolat/pgbackweb/internal/util/timeutil"
	"github.com/eduardolat/pgbackweb/internal/validate"
	"github.com/eduardolat/pgbackweb/internal/view/web/component"
	"github.com/eduardolat/pgbackweb/internal/view/web/respondhtmx"
	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
	nodx "github.com/nodxdev/nodxgo"
	htmx "github.com/nodxdev/nodxgo-htmx"
)

type listExecsQueryData struct {
	Database    uuid.UUID `query:"database" validate:"omitempty,uuid"`
	Destination uuid.UUID `query:"destination" validate:"omitempty,uuid"`
	Backup      uuid.UUID `query:"backup" validate:"omitempty,uuid"`
	// is_manual: "" = all, "true" = manual only, "false" = auto only
	IsManual string `query:"is_manual" validate:"omitempty,oneof=true false"`
	Page     int    `query:"page" validate:"required,min=1"`
}

func (h *handlers) listExecutionsHandler(c echo.Context) error {
	ctx := c.Request().Context()

	var queryData listExecsQueryData
	if err := c.Bind(&queryData); err != nil {
		return respondhtmx.ToastError(c, err.Error())
	}
	if err := validate.Struct(&queryData); err != nil {
		return respondhtmx.ToastError(c, err.Error())
	}

	pagination, executions, err := h.servs.ExecutionsService.PaginateExecutions(
		ctx, executions.PaginateExecutionsParams{
			DatabaseFilter: uuid.NullUUID{
				UUID: queryData.Database, Valid: queryData.Database != uuid.Nil,
			},
			DestinationFilter: uuid.NullUUID{
				UUID: queryData.Destination, Valid: queryData.Destination != uuid.Nil,
			},
			BackupFilter: uuid.NullUUID{
				UUID: queryData.Backup, Valid: queryData.Backup != uuid.Nil,
			},
			IsManualFilter: func() sql.NullBool {
				if queryData.IsManual == "true" {
					return sql.NullBool{Bool: true, Valid: true}
				}
				if queryData.IsManual == "false" {
					return sql.NullBool{Bool: false, Valid: true}
				}
				return sql.NullBool{}
			}(),
			Page:  queryData.Page,
			Limit: 20,
		},
	)
	if err != nil {
		return respondhtmx.ToastError(c, err.Error())
	}

	return echoutil.RenderNodx(
		c, http.StatusOK, listExecutions(queryData, pagination, executions),
	)
}

func listExecutions(
	queryData listExecsQueryData,
	pagination paginateutil.PaginateResponse,
	executions []dbgen.ExecutionsServicePaginateExecutionsRow,
) nodx.Node {
	if len(executions) < 1 {
		return component.EmptyResultsTr(component.EmptyResultsParams{
			Title:    "Không có lệnh thực thi nào",
			Subtitle: "",
		})
	}
	env, err := config.GetEnv()
	if err != nil {
		logger.FatalError("error getting environment variables", logger.KV{"error": err})
	}
	trs := []nodx.Node{}
	for _, execution := range executions {
		trs = append(trs, nodx.Tr(
			nodx.Td(component.OptionsDropdown(
				showExecutionButton(execution),
				restoreExecutionButton(execution),
			)),
			nodx.Td(component.StatusBadge(execution.Status)),
			nodx.Td(component.SpanText(execution.BackupName)),
			nodx.Td(component.SpanText(execution.DatabaseName)),
			nodx.Td(component.PrettyDestinationName(
				execution.BackupIsLocal, execution.DestinationName,
			)),
			nodx.Td(component.SpanText(
				execution.StartedAt.Local().Format(timeutil.LayoutYYYYMMDDHHMMSSPretty),
			)),
			nodx.Td(
				nodx.If(
					execution.FinishedAt.Valid,
					component.SpanText(
						execution.FinishedAt.Time.Local().Format(timeutil.LayoutYYYYMMDDHHMMSSPretty),
					),
				),
			),
			nodx.Td(
				nodx.If(
					execution.FinishedAt.Valid,
					component.SpanText(
						execution.FinishedAt.Time.Sub(execution.StartedAt).String(),
					),
				),
			),
			nodx.Td(
				nodx.If(
					execution.FileSize.Valid,
					component.PrettyFileSize(execution.FileSize),
				),
			),
		))
	}

	if pagination.HasNextPage {
		trs = append(trs, nodx.Tr(
			htmx.HxGet(func() string {
				url := env.PBW_PREFIX + "/dashboard/executions/list"
				url = strutil.AddQueryParamToUrl(url, "page", fmt.Sprintf("%d", pagination.NextPage))
				if queryData.Database != uuid.Nil {
					url = strutil.AddQueryParamToUrl(url, "database", queryData.Database.String())
				}
				if queryData.Destination != uuid.Nil {
					url = strutil.AddQueryParamToUrl(url, "destination", queryData.Destination.String())
				}
				if queryData.Backup != uuid.Nil {
					url = strutil.AddQueryParamToUrl(url, "backup", queryData.Backup.String())
				}
				if queryData.IsManual != "" {
					url = strutil.AddQueryParamToUrl(url, "is_manual", queryData.IsManual)
				}
				return url
			}()),
			htmx.HxTrigger("intersect once"),
			htmx.HxSwap("afterend"),
		))
	}

	return component.RenderableGroup(trs)
}
