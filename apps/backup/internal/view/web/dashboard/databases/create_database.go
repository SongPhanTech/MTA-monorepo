package databases

import (
	"database/sql"

	"github.com/eduardolat/pgbackweb/internal/database/dbgen"
	"github.com/eduardolat/pgbackweb/internal/validate"
	"github.com/eduardolat/pgbackweb/internal/view/web/component"
	"github.com/eduardolat/pgbackweb/internal/view/web/respondhtmx"
	"github.com/labstack/echo/v4"
	nodx "github.com/nodxdev/nodxgo"
	htmx "github.com/nodxdev/nodxgo-htmx"
	lucide "github.com/nodxdev/nodxgo-lucide"
)

type createDatabaseDTO struct {
	Name             string `form:"name" validate:"required"`
	Version          string `form:"version" validate:"required"`
	ConnectionString string `form:"connection_string" validate:"required"`
}

func (h *handlers) createDatabaseHandler(c echo.Context) error {
	ctx := c.Request().Context()

	var formData createDatabaseDTO
	if err := c.Bind(&formData); err != nil {
		return respondhtmx.ToastError(c, err.Error())
	}
	if err := validate.Struct(&formData); err != nil {
		return respondhtmx.ToastError(c, err.Error())
	}

	_, err := h.servs.DatabasesService.CreateDatabase(
		ctx, dbgen.DatabasesServiceCreateDatabaseParams{
			Name:             formData.Name,
			PgVersion:        formData.Version,
			ConnectionString: formData.ConnectionString,
		},
	)
	if err != nil {
		return respondhtmx.ToastError(c, err.Error())
	}

	return respondhtmx.Redirect(c, "/dashboard/databases")
}

func createDatabaseButton() nodx.Node {
	htmxAttributes := func(url string) nodx.Node {
		return nodx.Group(
			htmx.HxPost(url),
			htmx.HxInclude("#add-database-form"),
			htmx.HxDisabledELT(".add-database-btn"),
			htmx.HxIndicator("#add-database-loading"),
			htmx.HxValidate("true"),
		)
	}

	mo := component.Modal(component.ModalParams{
		Size:  component.SizeMd,
		Title: "Thêm cơ sở dữ liệu",
		Content: []nodx.Node{
			nodx.FormEl(
				nodx.Id("add-database-form"),
				nodx.Class("space-y-2"),

				component.InputControl(component.InputControlParams{
					Name:        "name",
					Label:       "Tên cơ sở dữ liệu",
					Placeholder: "Cơ sở dữ liệu 1",
					Required:    true,
					Type:        component.InputTypeText,
					HelpText:    "Tên để dễ dàng nhận diện cơ sở dữ liệu",
				}),

				component.SelectControl(component.SelectControlParams{
					Name:        "version",
					Label:       "Phiên bản",
					Placeholder: "Chọn phiên bản",
					Required:    true,
					HelpText:    "Phiên bản PostgreSQL mà bạn muốn sử dụng",
					Children: []nodx.Node{
						component.PGVersionSelectOptions(sql.NullString{}),
					},
				}),

				component.InputControl(component.InputControlParams{
					Name:        "connection_string",
					Label:       "Chuỗi kết nối",
					Placeholder: "postgresql://user:password@localhost:5432/mydb",
					Required:    true,
					Type:        component.InputTypeText,
					HelpText:    "Chuỗi kết nối PostgreSQL hợp lệ, bao gồm tên cơ sở dữ liệu. Chuỗi này sẽ được lưu trữ an toàn bằng mã hóa PGP.",
				}),
			),

			nodx.Div(
				nodx.Class("flex justify-between items-center pt-4"),
				nodx.Div(
					nodx.Button(
						htmxAttributes("/dashboard/databases/test"),
						nodx.Class("add-database-btn btn btn-neutral btn-outline"),
						nodx.Type("button"),
						component.SpanText("Kiểm tra kết nối"),
						lucide.DatabaseZap(),
					),
				),
				nodx.Div(
					nodx.Class("flex justify-end items-center space-x-2"),
					component.HxLoadingMd("add-database-loading"),
					nodx.Button(
						htmxAttributes("/dashboard/databases"),
						nodx.Class("add-database-btn btn btn-primary"),
						nodx.Type("button"),
						component.SpanText("Thêm cơ sở dữ liệu"),
						lucide.Save(),
					),
				),
			),
		},
	})

	button := nodx.Button(
		mo.OpenerAttr,
		nodx.Class("btn btn-primary"),
		component.SpanText("Thêm cơ sở dữ liệu"),
		lucide.Plus(),
	)

	return nodx.Div(
		nodx.Class("inline-block"),
		mo.HTML,
		button,
	)
}
