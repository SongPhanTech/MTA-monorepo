package milestones

import (
	"database/sql"

	"github.com/eduardolat/pgbackweb/internal/database/dbgen"
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
		Name           string `form:"name" validate:"required"`
		CronExpression string `form:"cron_expression" validate:"required"`
	}
	if err := c.Bind(&formData); err != nil {
		return respondhtmx.ToastError(c, err.Error())
	}
	if err := validate.Struct(&formData); err != nil {
		return respondhtmx.ToastError(c, err.Error())
	}

	_, err = h.servs.MilestonesService.UpdateMilestone(
		ctx, dbgen.MilestonesServiceUpdateMilestoneParams{
			ID:             milestoneID,
			Name:           sql.NullString{String: formData.Name, Valid: true},
			CronExpression: sql.NullString{String: formData.CronExpression, Valid: true},
			IsActive:       sql.NullBool{Bool: true, Valid: true},
		},
	)
	if err != nil {
		return respondhtmx.ToastError(c, err.Error())
	}

	return respondhtmx.AlertWithRefresh(c, "Mốc thời gian đã được cập nhật thành công.")
}

func editMilestoneButton(milestone dbgen.Milestone) nodx.Node {
	mo := component.Modal(component.ModalParams{
		Size:  component.SizeLg,
		Title: "Chỉnh sửa mốc thời gian",
		Content: []nodx.Node{
			nodx.FormEl(
				htmx.HxPost("/dashboard/milestones/"+milestone.ID.String()+"/edit"),
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

				component.InputControl(component.InputControlParams{
					Name:        "cron_expression",
					Label:       "Cron expression",
					Placeholder: "* * * * *",
					Required:    true,
					Type:        component.InputTypeText,
					HelpText:    "Biểu thức cron để lập lịch sao lưu",
					Pattern:     `^\S+\s+\S+\s+\S+\s+\S+\s+\S+$`,
					Children: []nodx.Node{
						nodx.Value(milestone.CronExpression),
					},
					HelpButtonChildren: cronExpressionHelp(),
				}),

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
