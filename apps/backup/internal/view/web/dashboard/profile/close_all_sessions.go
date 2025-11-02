package profile

import (
	"github.com/eduardolat/pgbackweb/internal/database/dbgen"
	"github.com/eduardolat/pgbackweb/internal/util/timeutil"
	"github.com/eduardolat/pgbackweb/internal/view/web/component"
	nodx "github.com/nodxdev/nodxgo"
	htmx "github.com/nodxdev/nodxgo-htmx"
	lucide "github.com/nodxdev/nodxgo-lucide"
)

func closeAllSessionsForm(sessions []dbgen.Session) nodx.Node {
	return component.CardBox(component.CardBoxParams{
		Children: []nodx.Node{
			component.H2Text("Đóng tất cả các phiên"),
			component.PText("Điều này sẽ đăng xuất bạn khỏi tất cả các thiết bị bao gồm cả thiết bị này."),
			nodx.Button(
				htmx.HxPost("/auth/logout-all"),
				htmx.HxDisabledELT("this"),
				htmx.HxConfirm("Bạn có chắc chắn muốn đóng tất cả các phiên của mình không?"),
				nodx.Class("mt-2 btn btn-error"),
				component.SpanText("Đóng tất cả các phiên"),
				lucide.LogOut(),
			),

			nodx.Div(nodx.Class("divider")),

			component.H2Text("Các phiên đang hoạt động"),
			component.PText("Tất cả các phiên đều mở trong tối đa 12 giờ."),
			nodx.Div(
				nodx.Class("overflow-x-auto"),
				nodx.Table(
					nodx.Class("table"),
					nodx.Thead(
						nodx.Tr(
							nodx.Th(component.SpanText("Thời gian đăng nhập")),
							nodx.Th(component.SpanText("Địa chỉ IP")),
							nodx.Th(component.SpanText("User agent")),
						),
					),
					nodx.Tbody(
						nodx.Map(sessions, func(session dbgen.Session) nodx.Node {
							return nodx.Tr(
								nodx.Td(component.SpanText(
									session.CreatedAt.Local().Format(timeutil.LayoutYYYYMMDDHHMMSSPretty),
								)),
								nodx.Td(component.SpanText(session.Ip)),
								nodx.Td(component.SpanText(session.UserAgent)),
							)
						}),
					),
				),
			),
		},
	})
}
