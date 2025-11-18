package milestones

import (
	"net/http"

	"github.com/eduardolat/pgbackweb/internal/config"
	"github.com/eduardolat/pgbackweb/internal/database/dbgen"
	"github.com/eduardolat/pgbackweb/internal/logger"
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
		Name        string `form:"name" validate:"required"`
		Time        string `form:"time" validate:"required"`
		DayInterval int    `form:"day_interval" validate:"required"`
	}
	if err := c.Bind(&formData); err != nil {
		return respondhtmx.ToastError(c, err.Error())
	}
	if err := validate.Struct(&formData); err != nil {
		return respondhtmx.ToastError(c, err.Error())
	}
	cronExpr, err := toCron(formData.Time, formData.DayInterval)
	if err != nil {
		return respondhtmx.ToastError(c, err.Error())
	}
	_, err = h.servs.MilestonesService.CreateMilestone(
		ctx, dbgen.MilestonesServiceCreateMilestoneParams{
			Name:           formData.Name,
			CronExpression: cronExpr,
			IsActive:       true,
		},
	)
	if err != nil {
		return respondhtmx.ToastError(c, err.Error())
	}
	env, err := config.GetEnv()
	if err != nil {
		logger.FatalError("error getting environment variables", logger.KV{"error": err})
	}

	return respondhtmx.Redirect(c, env.PBW_PREFIX+"/dashboard/milestones")
}

func (h *handlers) createMilestoneFormHandler(c echo.Context) error {
	return echoutil.RenderNodx(
		c, http.StatusOK, createMilestoneForm(),
	)
}

func createMilestoneForm() nodx.Node {
	env, err := config.GetEnv()
	if err != nil {
		logger.FatalError("error getting environment variables", logger.KV{"error": err})
	}
	return nodx.FormEl(
		htmx.HxPost(env.PBW_PREFIX+"/dashboard/milestones"),
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

		nodx.Div(
			nodx.Class("flex gap-2"),
			component.InputControl(component.InputControlParams{
				Name:        "time",
				Label:       "Thời gian trong ngày",
				Placeholder: "08:00",
				Required:    true,
				Type:        component.InputTypeTime,
			}),
			component.InputControl(component.InputControlParams{
				Name:        "day_interval",
				Label:       "Tần suất sao lưu (ngày)",
				Placeholder: "30",
				Required:    true,
				Type:        component.InputTypeNumber,
			}),
		),

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
	env, err := config.GetEnv()
	if err != nil {
		logger.FatalError("error getting environment variables", logger.KV{"error": err})
	}
	mo := component.Modal(component.ModalParams{
		Size:  component.SizeLg,
		Title: "Tạo mốc thời gian",
		Content: []nodx.Node{
			nodx.Div(
				htmx.HxGet(env.PBW_PREFIX+"/dashboard/milestones/create-form"),
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
