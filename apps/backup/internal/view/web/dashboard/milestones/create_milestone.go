package milestones

import (
	"net/http"

	"github.com/eduardolat/pgbackweb/internal/database/dbgen"
	"github.com/eduardolat/pgbackweb/internal/util/echoutil"
	"github.com/eduardolat/pgbackweb/internal/validate"
	"github.com/eduardolat/pgbackweb/internal/view/web/component"
	"github.com/eduardolat/pgbackweb/internal/view/web/respondhtmx"
	"github.com/labstack/echo/v4"
	nodx "github.com/nodxdev/nodxgo"
	alpine "github.com/nodxdev/nodxgo-alpine"
	htmx "github.com/nodxdev/nodxgo-htmx"
	lucide "github.com/nodxdev/nodxgo-lucide"
)

func (h *handlers) createMilestoneHandler(c echo.Context) error {
	ctx := c.Request().Context()

	var formData struct {
		Name           string `form:"name" validate:"required"`
		CronExpression string `form:"cron_expression" validate:"required"`
	}
	if err := c.Bind(&formData); err != nil {
		return respondhtmx.ToastError(c, err.Error())
	}
	if err := validate.Struct(&formData); err != nil {
		return respondhtmx.ToastError(c, err.Error())
	}

	_, err := h.servs.MilestonesService.CreateMilestone(
		ctx, dbgen.MilestonesServiceCreateMilestoneParams{
			Name:           formData.Name,
			CronExpression: formData.CronExpression,
			IsActive:       true,
		},
	)
	if err != nil {
		return respondhtmx.ToastError(c, err.Error())
	}

	return respondhtmx.Redirect(c, "/dashboard/milestones")
}

func (h *handlers) createMilestoneFormHandler(c echo.Context) error {
	return echoutil.RenderNodx(
		c, http.StatusOK, createMilestoneForm(),
	)
}

func createMilestoneForm() nodx.Node {

	return nodx.FormEl(
		htmx.HxPost("/dashboard/milestones"),
		htmx.HxDisabledELT("find button"),
		nodx.Class("space-y-2 text-base"),

		alpine.XData(`{
			is_local: "false",
		}`),

		component.InputControl(component.InputControlParams{
			Name:        "name",
			Label:       "Tên",
			Placeholder: "Tên mốc thời gian",
			Required:    true,
			Type:        component.InputTypeText,
		}),

		component.InputControl(component.InputControlParams{
			Name:               "cron_expression",
			Label:              "Cron expression",
			Placeholder:        "* * * * *",
			Required:           true,
			Type:               component.InputTypeText,
			HelpText:           "Biểu thức cron để lập lịch sao lưu",
			Pattern:            `^\S+\s+\S+\s+\S+\s+\S+\s+\S+$`,
			HelpButtonChildren: cronExpressionHelp(),
		}),

		nodx.Div(
			nodx.Class("flex justify-end items-center space-x-2 pt-2"),
			component.HxLoadingMd(),
			nodx.Button(
				nodx.Class("btn btn-primary"),
				nodx.Type("submit"),
				component.SpanText("Tạo mốc thời gian"),
				lucide.Save(),
			),
		),
	)
}

func createMilestonesButton() nodx.Node {
	mo := component.Modal(component.ModalParams{
		Size:  component.SizeLg,
		Title: "Tạo mốc thời gian",
		Content: []nodx.Node{
			nodx.Div(
				htmx.HxGet("/dashboard/milestones/create-form"),
				htmx.HxSwap("outerHTML"),
				htmx.HxTrigger("intersect once"),
				nodx.Class("p-10 flex justify-center"),
				component.HxLoadingMd(),
			),
		},
	})

	button := nodx.Button(
		mo.OpenerAttr,
		nodx.Class("btn btn-primary"),
		component.SpanText("Tạo mốc thời gian"),
		lucide.Plus(),
	)

	return nodx.Div(
		nodx.Class("inline-block"),
		mo.HTML,
		button,
	)
}
