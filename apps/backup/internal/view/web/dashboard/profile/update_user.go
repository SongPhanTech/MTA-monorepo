package profile

import (
	"database/sql"

	"github.com/eduardolat/pgbackweb/internal/database/dbgen"
	"github.com/eduardolat/pgbackweb/internal/validate"
	"github.com/eduardolat/pgbackweb/internal/view/reqctx"
	"github.com/eduardolat/pgbackweb/internal/view/web/component"
	"github.com/eduardolat/pgbackweb/internal/view/web/respondhtmx"
	"github.com/labstack/echo/v4"
	nodx "github.com/nodxdev/nodxgo"
	htmx "github.com/nodxdev/nodxgo-htmx"
	lucide "github.com/nodxdev/nodxgo-lucide"
)

func (h *handlers) updateUserHandler(c echo.Context) error {
	reqCtx := reqctx.GetCtx(c)
	ctx := c.Request().Context()

	var formData struct {
		Name                 string `form:"name" validate:"required"`
		Password             string `form:"password" validate:"omitempty,min=6,max=50"`
		PasswordConfirmation string `form:"password_confirmation" validate:"omitempty,eqfield=Password"`
	}
	if err := c.Bind(&formData); err != nil {
		return respondhtmx.ToastError(c, err.Error())
	}
	if err := validate.Struct(&formData); err != nil {
		return respondhtmx.ToastError(c, err.Error())
	}

	_, err := h.servs.UsersService.UpdateUser(ctx, dbgen.UsersServiceUpdateUserParams{
		ID:       reqCtx.User.ID,
		Name:     sql.NullString{String: formData.Name, Valid: true},
		Email:    sql.NullString{String: formData.Name, Valid: true},
		Password: sql.NullString{String: formData.Password, Valid: formData.Password != ""},
	})
	if err != nil {
		return respondhtmx.ToastError(c, err.Error())
	}

	return respondhtmx.ToastSuccess(c, "Profile updated")
}

func updateUserForm(user dbgen.User) nodx.Node {
	return component.CardBox(component.CardBoxParams{
		Children: []nodx.Node{
			nodx.FormEl(
				htmx.HxPost("/dashboard/profile"),
				htmx.HxDisabledELT("find button"),
				nodx.Class("space-y-2"),

				component.H2Text("Cập nhật hồ sơ"),

				component.InputControl(component.InputControlParams{
					Name:         "name",
					Label:        "Tên đăng nhập",
					Placeholder:  "Nhập tên đăng nhập",
					Required:     true,
					Type:         component.InputTypeText,
					AutoComplete: "name",
					Children: []nodx.Node{
						nodx.Value(user.Name),
					},
				}),

				component.InputControl(component.InputControlParams{
					Name:         "password",
					Label:        "Thay đổi mật khẩu",
					Placeholder:  "Mật khẩu mới",
					AutoComplete: "new-password",
					Type:         component.InputTypePassword,
					HelpText:     "Để trống nếu bạn không muốn thay đổi mật khẩu",
				}),

				component.InputControl(component.InputControlParams{
					Name:         "password_confirmation",
					Label:        "Xác nhận mật khẩu mới",
					Placeholder:  "Xác nhận mật khẩu mới",
					AutoComplete: "new-password",
					Type:         component.InputTypePassword,
				}),

				nodx.Div(
					nodx.Class("flex justify-end items-center space-x-2 pt-2"),
					component.HxLoadingMd(),
					nodx.Button(
						nodx.Class("btn btn-primary"),
						nodx.Type("submit"),
						component.SpanText("Lưu thay đổi"),
						lucide.Save(),
					),
				),
			),
		},
	})
}
