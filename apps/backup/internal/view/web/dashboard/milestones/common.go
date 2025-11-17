package milestones

import (
	"github.com/eduardolat/pgbackweb/internal/view/web/component"
	nodx "github.com/nodxdev/nodxgo"
	lucide "github.com/nodxdev/nodxgo-lucide"
)

func cronExpressionHelp() []nodx.Node {
	return []nodx.Node{
		component.PText(`
			Biểu thức cron là một chuỗi được sử dụng để xác định lịch trình chạy tác vụ trong các hệ điều hành giống Unix. Nó bao gồm năm trường đại diện cho phút, giờ, ngày trong tháng, tháng và ngày trong tuần. Biểu thức cron cho phép lập lịch chính xác cho các tác vụ định kỳ.
		`),

		nodx.Div(
			nodx.Class("mt-4 flex justify-end items-center space-x-1"),
			nodx.A(
				nodx.Href("https://en.wikipedia.org/wiki/Cron"),
				nodx.Target("_blank"),
				nodx.Class("btn btn-ghost"),
				component.SpanText("Xem thêm trên Wikipedia"),
				lucide.ExternalLink(),
			),
			nodx.A(
				nodx.Href("https://crontab.guru/examples.html"),
				nodx.Target("_blank"),
				nodx.Class("btn btn-ghost"),
				component.SpanText("Xem ví dụ"),
				lucide.ExternalLink(),
			),
		),
	}
}
