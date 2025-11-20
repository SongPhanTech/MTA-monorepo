package milestones

import (
	"database/sql"
	"strconv"

	"github.com/eduardolat/pgbackweb/internal/config"
	"github.com/eduardolat/pgbackweb/internal/database/dbgen"
	"github.com/eduardolat/pgbackweb/internal/logger"
	"github.com/eduardolat/pgbackweb/internal/validate"
	"github.com/eduardolat/pgbackweb/internal/view/web/component"
	"github.com/eduardolat/pgbackweb/internal/view/web/respondhtmx"
	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
	nodx "github.com/nodxdev/nodxgo"
	htmx "github.com/nodxdev/nodxgo-htmx"
	lucide "github.com/nodxdev/nodxgo-lucide"
)

func (h *handlers) editMilestoneHandler(c echo.Context) error {
	ctx := c.Request().Context()

	milestoneID, err := uuid.Parse(c.Param("milestoneID"))
	if err != nil {
		return respondhtmx.ToastError(c, err.Error())
	}

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
	_, err = h.servs.MilestonesService.UpdateMilestone(
		ctx, dbgen.MilestonesServiceUpdateMilestoneParams{
			ID:             milestoneID,
			Name:           sql.NullString{String: formData.Name, Valid: true},
			CronExpression: sql.NullString{String: cronExpr, Valid: true},
			IsActive:       sql.NullBool{Bool: true, Valid: true},
		},
	)
	if err != nil {
		return respondhtmx.ToastError(c, err.Error())
	}

	return respondhtmx.AlertWithRefresh(c, "Mốc thời gian đã được cập nhật thành công.")
}

func editMilestoneButton(milestone dbgen.Milestone) nodx.Node {

	time, dayInterval, err := CronToParams(milestone.CronExpression)
	if err != nil {
		time = "08:00"
		dayInterval = 30
	}
	env, err := config.GetEnv()
	if err != nil {
		logger.FatalError("error getting environment variables", logger.KV{"error": err})
	}
	mo := component.Modal(component.ModalParams{
		Size:  component.SizeLg,
		Title: "Chỉnh sửa mốc thời gian",
		Content: []nodx.Node{
			nodx.FormEl(
				htmx.HxPost(env.PBW_PREFIX+"/dashboard/milestones/"+milestone.ID.String()+"/edit"),
				htmx.HxDisabledELT("find button"),
				nodx.Class("space-y-2 text-base"),

				component.InputControl(component.InputControlParams{
					Name:        "name",
					Label:       "Tên",
					Placeholder: "Tên mốc thời gian",
					Required:    true,
					Type:        component.InputTypeText,
					Children: []nodx.Node{
						nodx.Value(milestone.Name),
					},
				}),

				nodx.Div(
					nodx.Class("flex gap-2"),
					component.InputControl(component.InputControlParams{
						Name:        "time",
						Label:       "Thời gian trong ngày",
						Placeholder: "08:00",
						Required:    true,
						Type:        component.InputTypeTime,
						Children: []nodx.Node{
							nodx.Value(time),
						},
					}),
					component.InputControl(component.InputControlParams{
						Name:        "day_interval",
						Label:       "Tần suất sao lưu (ngày)",
						Placeholder: "30",
						Required:    true,
						Type:        component.InputTypeNumber,
						Children: []nodx.Node{
							nodx.Value(strconv.Itoa(dayInterval)),
						},
					}),
				),
				nodx.Div(
					nodx.Class("flex justify-end items-center space-x-2 pt-2"),
					component.HxLoadingMd(),
					nodx.Button(
						nodx.Class("btn btn-primary"),
						nodx.Type("submit"),
						component.SpanText("Lưu"),
						lucide.Save(),
					),
				),
			),
		},
	})

	return nodx.Div(
		mo.HTML,
		component.OptionsDropdownButton(
			mo.OpenerAttr,
			lucide.Pencil(),
			component.SpanText("Chỉnh sửa"),
		),
	)
}
