package layout

import (
	"fmt"

	nodx "github.com/nodxdev/nodxgo"
	alpine "github.com/nodxdev/nodxgo-alpine"
	htmx "github.com/nodxdev/nodxgo-htmx"
	lucide "github.com/nodxdev/nodxgo-lucide"
)

func dashboardAside() nodx.Node {
	return nodx.Aside(
		nodx.Id("dashboard-aside"),
		nodx.ClassMap{
			"flex-none h-[100dvh] bg-base-300 shadow-sm p-4": true,
			"overflow-y-auto overflow-x-hidden":              true,
		},
		nodx.Div(
			nodx.Class("mt-6 space-y-4"),
			dashboardAsideItem(
				lucide.LayoutDashboard,
				"Tóm tắt",
				"/dashboard",
				true,
			),
			dashboardAsideItem(
				lucide.Database,
				"Cơ sở dữ liệu",
				"/dashboard/databases",
				false,
			),
			dashboardAsideItem(
				lucide.HardDrive,
				"Đích đến sao lưu",
				"/dashboard/destinations",
				false,
			),
			dashboardAsideItem(
				lucide.DatabaseBackup,
				"Sao lưu dữ liệu",
				"/dashboard/backups",
				false,
			),
			dashboardAsideItem(
				lucide.List,
				"Lịch sử thực thi",
				"/dashboard/executions",
				false,
			),
			dashboardAsideItem(
				lucide.ArchiveRestore,
				"Khôi phục",
				"/dashboard/restorations",
				false,
			),
			dashboardAsideItem(
				lucide.Webhook,
				"Webhooks",
				"/dashboard/webhooks",
				false,
			),
		),
	)
}

func dashboardAsideItem(
	icon func(children ...nodx.Node) nodx.Node,
	text, link string, strict bool,
) nodx.Node {
	return nodx.A(
		alpine.XData(fmt.Sprintf("alpineDashboardAsideItem('%s', %t)", link, strict)),
		nodx.Class("block flex flex-col items-center justify-center group"),

		nodx.Href(link),
		htmx.HxBoost("true"),
		htmx.HxTarget("#dashboard-main"),
		htmx.HxSwap("transition:true show:unset"),

		nodx.Button(
			alpine.XBind("class", `{'btn-active': is_active}`),
			nodx.Class("btn btn-ghost btn-neutral btn-square group-hover:btn-active"),
			icon(nodx.Class("size-6")),
		),
		nodx.SpanEl(
			nodx.Class("text-xs"),
			nodx.Text(text),
		),
	)
}
