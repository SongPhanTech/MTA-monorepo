package databases

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

func (h *handlers) editDatabaseHandler(c echo.Context) error {
	ctx := c.Request().Context()

	databaseID, err := uuid.Parse(c.Param("databaseID"))
	if err != nil {
		return respondhtmx.ToastError(c, err.Error())
	}

	var formData createDatabaseDTO
	if err := c.Bind(&formData); err != nil {
		return respondhtmx.ToastError(c, err.Error())
	}
	if err := validate.Struct(&formData); err != nil {
		return respondhtmx.ToastError(c, err.Error())
	}

	_, err = h.servs.DatabasesService.UpdateDatabase(
		ctx, dbgen.DatabasesServiceUpdateDatabaseParams{
			ID:               databaseID,
			Name:             sql.NullString{String: formData.Name, Valid: true},
			PgVersion:        sql.NullString{String: formData.Version, Valid: true},
			ConnectionString: sql.NullString{String: formData.ConnectionString, Valid: true},
		},
	)
	if err != nil {
		return respondhtmx.ToastError(c, err.Error())
	}

	return respondhtmx.AlertWithRefresh(c, "Database updated")
}

func editDatabaseButton(
	database dbgen.DatabasesServicePaginateDatabasesRow,
) nodx.Node {
	idPref := "edit-database-" + database.ID.String()
	formID := idPref + "-form"
	btnClass := idPref + "-btn"
	loadingID := idPref + "-loading"

	htmxAttributes := func(url string) nodx.Node {
		return nodx.Group(
			htmx.HxPost(url),
			htmx.HxInclude("#"+formID),
			htmx.HxDisabledELT("."+btnClass),
			htmx.HxIndicator("#"+loadingID),
			htmx.HxValidate("true"),
		)
	}

	mo := component.Modal(component.ModalParams{
		Size:  component.SizeMd,
		Title: "Edit database",
		Content: []nodx.Node{
			nodx.FormEl(
				nodx.Id(formID),
				nodx.Class("space-y-2"),

				component.InputControl(component.InputControlParams{
					Name:        "name",
					Label:       "Tên cơ sở dữ liệu",
					Placeholder: "Cơ sở dữ liệu 1",
					Required:    true,
					Type:        component.InputTypeText,
					HelpText:    "Tên để dễ dàng nhận diện cơ sở dữ liệu",
					Children: []nodx.Node{
						nodx.Value(database.Name),
					},
				}),

				component.SelectControl(component.SelectControlParams{
					Name:        "version",
					Placeholder: "Chọn phiên bản",
					Required:    true,
					HelpText:    "Phiên bản PostgreSQL mà bạn muốn sử dụng",
					Children: []nodx.Node{
						component.PGVersionSelectOptions(sql.NullString{
							Valid:  true,
							String: database.PgVersion,
						}),
					},
				}),

				component.InputControl(component.InputControlParams{
					Name:        "connection_string",
					Label:       "Chuỗi kết nối",
					Placeholder: "postgresql://user:password@localhost:5432/mydb",
					Required:    true,
					Type:        component.InputTypeText,
					HelpText:    "Một chuỗi kết nối PostgreSQL hợp lệ, bao gồm tên cơ sở dữ liệu. Chuỗi này sẽ được lưu trữ an toàn bằng cách sử dụng mã hóa PGP.",
					Children: []nodx.Node{
						nodx.Value(database.DecryptedConnectionString),
					},
				}),
			),

			nodx.Div(
				nodx.Class("flex justify-between items-center pt-4"),
				nodx.Div(
					nodx.Button(
						htmxAttributes("/dashboard/databases/test"),
						nodx.ClassMap{
							btnClass:                      true,
							"btn btn-neutral btn-outline": true,
						},
						nodx.Type("button"),
						component.SpanText("Kiểm tra kết nối"),
						lucide.DatabaseZap(),
					),
				),
				nodx.Div(
					nodx.Class("flex justify-end items-center space-x-2"),
					component.HxLoadingMd(loadingID),
					nodx.Button(
						htmxAttributes("/dashboard/databases/"+database.ID.String()+"/edit"),
						nodx.ClassMap{
							btnClass:          true,
							"btn btn-primary": true,
						},
						nodx.Type("button"),
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
