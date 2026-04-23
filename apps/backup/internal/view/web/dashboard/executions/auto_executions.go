package executions

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

func (h *handlers) autoExecutionsPageHandler(c echo.Context) error {
	reqCtx := reqctx.GetCtx(c)
	return echoutil.RenderNodx(c, http.StatusOK, autoExecutionsPage(reqCtx))
}

func autoExecutionsPage(reqCtx reqctx.Ctx) nodx.Node {
	env, err := config.GetEnv()
	if err != nil {
		logger.FatalError("error getting environment variables", logger.KV{"error": err})
	}
	content := []nodx.Node{
		component.H2Text("Sao lưu tự động"),
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
								nodx.Th(component.SpanText("Trạng thái")),
								nodx.Th(component.SpanText("Sao lưu")),
								nodx.Th(component.SpanText("Cơ sở dữ liệu")),
								nodx.Th(component.SpanText("Đích lưu trữ")),
								nodx.Th(component.SpanText("Bắt đầu lúc")),
								nodx.Th(component.SpanText("Kết thúc lúc")),
								nodx.Th(component.SpanText("Thời gian thực thi")),
								nodx.Th(component.SpanText("Dung lượng")),
							),
						),
						nodx.Tbody(
							component.SkeletonTr(8),
							htmx.HxGet(env.PBW_PREFIX+"/dashboard/executions/list?page=1&is_manual=false"),
							htmx.HxTrigger("load"),
						),
					),
				),
			},
		}),
	}

	return layout.Dashboard(reqCtx, layout.DashboardParams{
		Title: "Sao lưu tự động",
		Body:  content,
	})
}
