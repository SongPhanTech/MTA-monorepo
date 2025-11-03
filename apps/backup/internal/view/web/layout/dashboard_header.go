package layout

import (
	nodx "github.com/nodxdev/nodxgo"
	htmx "github.com/nodxdev/nodxgo-htmx"
)

func dashboardHeader() nodx.Node {
	return nodx.Header(
		nodx.ClassMap{
			"sticky top-0 z-50":                 true,
			"space-x-4 p-4 min-w-max":           true,
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
				htmx.HxGet("/dashboard/health-button"),
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
