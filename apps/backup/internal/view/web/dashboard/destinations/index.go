package destinations

import (
	"net/http"

	"github.com/eduardolat/pgbackweb/internal/config"
	"github.com/eduardolat/pgbackweb/internal/logger"
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
	env, err := config.GetEnv()
	if err != nil {
		logger.FatalError("error getting environment variables", logger.KV{"error": err})
	}
	content := []nodx.Node{
		nodx.Div(
			nodx.Class("flex justify-between items-start space-x-2"),
			nodx.Div(
				component.H1Text("Đích đến lưu trữ"),
				component.PText(`
					Tại đây, bạn có thể quản lý các đích lưu trữ của mình. Bạn có thể bỏ qua việc tạo đích lưu trữ nếu muốn sử dụng bộ nhớ cục bộ cho các bản sao lưu.
				`),
			),
			nodx.Div(
				nodx.Class("flex-none"),
				createDestinationButton(),
			),
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
								nodx.Th(component.SpanText("Tên bucket")),
								nodx.Th(component.SpanText("Endpoint")),
								nodx.Th(component.SpanText("Region")),
								nodx.Th(component.SpanText("Access key")),
								nodx.Th(component.SpanText("Secret key")),
								nodx.Th(component.SpanText("Ngày tạo")),
							),
						),
						nodx.Tbody(
							component.SkeletonTr(8),
							htmx.HxGet(env.PBW_PREFIX+"/dashboard/destinations/list?page=1"),
							htmx.HxTrigger("load"),
						),
					),
				),
			},
		}),
	}

	return layout.Dashboard(reqCtx, layout.DashboardParams{
		Title: "Đích đến lưu trữ",
		Body:  content,
	})
}
