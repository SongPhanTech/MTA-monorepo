package milestones

import (
	"fmt"
	"net/http"

	"github.com/eduardolat/pgbackweb/internal/database/dbgen"
	"github.com/eduardolat/pgbackweb/internal/service/milestones"
	"github.com/eduardolat/pgbackweb/internal/util/echoutil"
	"github.com/eduardolat/pgbackweb/internal/util/paginateutil"
	"github.com/eduardolat/pgbackweb/internal/util/timeutil"
	"github.com/eduardolat/pgbackweb/internal/validate"
	"github.com/eduardolat/pgbackweb/internal/view/web/component"
	"github.com/eduardolat/pgbackweb/internal/view/web/respondhtmx"
	"github.com/labstack/echo/v4"
	nodx "github.com/nodxdev/nodxgo"
	htmx "github.com/nodxdev/nodxgo-htmx"
)

func (h *handlers) listMilestonesHandler(c echo.Context) error {
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

	pagination, milestones, err := h.servs.MilestonesService.PaginateMilestones(
		ctx, milestones.PaginateMilestonesParams{
			Page:  formData.Page,
			Limit: 20,
		},
	)
	if err != nil {
		return respondhtmx.ToastError(c, err.Error())
	}

	return echoutil.RenderNodx(
		c, http.StatusOK, listMilestones(pagination, milestones),
	)
}

func listMilestones(
	pagination paginateutil.PaginateResponse,
	milestones []dbgen.Milestone,
) nodx.Node {
	if len(milestones) < 1 {
		return component.EmptyResultsTr(component.EmptyResultsParams{
			Title:    "Không có mốc sao lưu nào được tìm thấy",
			Subtitle: "Hãy tạo một mốc sao lưu mới để bắt đầu.",
		})
	}

	trs := []nodx.Node{}
	for _, milestone := range milestones {
		trs = append(trs, nodx.Tr(
			nodx.Td(component.OptionsDropdown(
				editMilestoneButton(milestone),
				deleteMilestoneButton(milestone.ID),
			)),
			nodx.Td(
				nodx.Div(
					nodx.Class("flex items-center space-x-2"),
					component.SpanText(milestone.Name),
				),
			),
			nodx.Td(
				nodx.Class("font-mono"),
				nodx.Div(
					nodx.Class("flex flex-col items-start text-xs"),
					component.SpanText(milestone.CronExpression),
				),
			),
			nodx.Td(component.SpanText(
				milestone.CreatedAt.Local().Format(timeutil.LayoutYYYYMMDDHHMMSSPretty),
			)),
		))
	}

	if pagination.HasNextPage {
		trs = append(trs, nodx.Tr(
			htmx.HxGet(fmt.Sprintf(
				"/dashboard/milestones/list?page=%d", pagination.NextPage,
			)),
			htmx.HxTrigger("intersect once"),
			htmx.HxSwap("afterend"),
		))
	}

	return component.RenderableGroup(trs)
}
