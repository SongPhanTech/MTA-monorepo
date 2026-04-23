package layout

import (
	"fmt"

	"github.com/eduardolat/pgbackweb/internal/config"
	"github.com/eduardolat/pgbackweb/internal/logger"
	nodx "github.com/nodxdev/nodxgo"
	alpine "github.com/nodxdev/nodxgo-alpine"
	htmx "github.com/nodxdev/nodxgo-htmx"
	lucide "github.com/nodxdev/nodxgo-lucide"
)

func dashboardAside() nodx.Node {
	env, err := config.GetEnv()
	if err != nil {
		logger.FatalError("error getting environment variables", logger.KV{"error": err})
	}
	return nodx.Aside(
		nodx.Id("dashboard-aside"),
		nodx.ClassMap{
			"flex-none h-[100dvh] bg-base-300 shadow-sm p-4": true,
			"overflow-y-auto overflow-x-hidden":              true,
		},
		nodx.Div(
			nodx.Class("mt-2 space-y-2"),
			dashboardAsideItem(
				lucide.LayoutDashboard,
				"Tóm tắt",
				env.PBW_PREFIX+"/dashboard",
				true,
			),
			dashboardAsideItem(
				lucide.Database,
				"Cơ sở dữ liệu",
				env.PBW_PREFIX+"/dashboard/databases",
				false,
			),
			dashboardAsideItem(
				lucide.HardDrive,
				"Đích đến sao lưu",
				env.PBW_PREFIX+"/dashboard/destinations",
				false,
			),
			dashboardAsideItem(
				lucide.DatabaseBackup,
				"Sao lưu dữ liệu",
				env.PBW_PREFIX+"/dashboard/backups",
				false,
			),
			dashboardAsideItem(
				lucide.Clock,
				"Mốc sao lưu",
				env.PBW_PREFIX+"/dashboard/milestones",
				false,
			),
			dashboardAsideItem(
				lucide.List,
				"Sao lưu tự động",
				env.PBW_PREFIX+"/dashboard/executions/auto",
				false,
			),
			dashboardAsideItem(
				lucide.MousePointerClick,
				"Sao lưu thủ công",
				env.PBW_PREFIX+"/dashboard/executions/manual",
				false,
			),
			dashboardAsideItem(
				lucide.ArchiveRestore,
				"Khôi phục",
				env.PBW_PREFIX+"/dashboard/restorations",
				false,
			),
			// dashboardAsideItem(
			// 	lucide.Webhook,
			// 	"Webhooks",
			// 	"/dashboard/webhooks",
			// 	false,
			// ),
			// dashboardAsideItem(
			// 	lucide.User,
			// 	"Hồ sơ",
			// 	"/dashboard/profile",
			// 	false,
			// ),
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
