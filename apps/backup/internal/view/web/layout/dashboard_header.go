package layout

import (
	"github.com/eduardolat/pgbackweb/internal/config"
	"github.com/eduardolat/pgbackweb/internal/logger"
	nodx "github.com/nodxdev/nodxgo"
	htmx "github.com/nodxdev/nodxgo-htmx"
)

func dashboardHeader() nodx.Node {
	env, err := config.GetEnv()
	if err != nil {
		logger.FatalError("error getting environment variables", logger.KV{"error": err})
	}
	return nodx.Header(
		nodx.ClassMap{
			"sticky top-0 z-50":                 true,
			"space-x-2 p-2 min-w-max":           true,
			"w-[full] bg-base-200 shadow-sm":    true,
			"flex items-center justify-between": true,
		},
		nodx.Div(
			nodx.Class("flex justify-start items-center space-x-2"),
			// dashboardHeaderUpdates(),
		),
		nodx.Div(
			nodx.Class("flex justify-end items-center space-x-2"),
			nodx.Div(
				htmx.HxGet(env.PBW_PREFIX+"/dashboard/health-button"),
				htmx.HxSwap("outerHTML"),
				htmx.HxTrigger("load once"),
			),
		),
		nodx.Div(
			nodx.Class("flex justify-start items-center space-x-2"),
			// dashboardHeaderUpdates(),
		),
		// nodx.Button(
		// 	htmx.HxPost("/auth/logout"),
		// 	htmx.HxDisabledELT("this"),
		// 	nodx.Class("btn btn-ghost btn-neutral"),
		// 	component.SpanText("Đăng xuất"),
		// 	lucide.LogOut(),
		// ),
	)
}
