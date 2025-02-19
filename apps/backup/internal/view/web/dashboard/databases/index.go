package databases

import (
	"net/http"

	"github.com/eduardolat/pgbackweb/internal/util/echoutil"
	"github.com/eduardolat/pgbackweb/internal/view/reqctx"
	"github.com/eduardolat/pgbackweb/internal/view/web/component"
	"github.com/eduardolat/pgbackweb/internal/view/web/layout"
	"github.com/labstack/echo/v4"
	nodx "github.com/nodxdev/nodxgo"
	htmx "github.com/nodxdev/nodxgo-htmx"
)

func (h *handlers) indexPageHandler(c echo.Context) error {
	reqCtx := reqctx.GetCtx(c)
	return echoutil.RenderNodx(c, http.StatusOK, indexPage(reqCtx))
}

func indexPage(reqCtx reqctx.Ctx) nodx.Node {
	content := []nodx.Node{
		nodx.Div(
			nodx.Class("flex justify-between items-start"),
			component.H1Text("Cơ sở dữ liệu"),
			createDatabaseButton(),
		),
		component.CardBox(component.CardBoxParams{
			Class: "mt-4",
			Children: []nodx.Node{
				nodx.Div(
					nodx.Class("overflow-x-auto"),
					nodx.Table(
						nodx.Class("table text-nowrap"),
						nodx.Thead(
							nodx.Tr(
								nodx.Th(nodx.Class("w-1")),
								nodx.Th(component.SpanText("Tên")),
								nodx.Th(component.SpanText("Phiên bản")),
								nodx.Th(component.SpanText("Chuỗi kết nối")),
								nodx.Th(component.SpanText("Ngày tạo")),
							),
						),
						nodx.Tbody(
							component.SkeletonTr(8),
							htmx.HxGet("/dashboard/databases/list?page=1"),
							htmx.HxTrigger("load"),
						),
					),
				),
			},
		}),
	}

	return layout.Dashboard(reqCtx, layout.DashboardParams{
		Title: "Cơ sở dữ liệu",
		Body:  content,
	})
}
