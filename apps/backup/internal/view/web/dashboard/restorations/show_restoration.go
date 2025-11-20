package restorations

import (
	"encoding/json"
	"strconv"

	"github.com/eduardolat/pgbackweb/internal/database/dbgen"
	"github.com/eduardolat/pgbackweb/internal/util/timeutil"
	"github.com/eduardolat/pgbackweb/internal/view/web/component"
	nodx "github.com/nodxdev/nodxgo"
	lucide "github.com/nodxdev/nodxgo-lucide"
)

type MessageRestoration struct {
	Schema  string `json:"schema"`
	Table   string `json:"table"`
	Records int    `json:"records"`
}

func showRestorationButton(
	restoration dbgen.RestorationsServicePaginateRestorationsRow,
) nodx.Node {

	var messageNode nodx.Node = component.SpanText("Khôi phục thành công")
	var messageRestoration []MessageRestoration
	err := json.Unmarshal([]byte(restoration.Message.String), &messageRestoration)
	if err == nil {
		rows := []nodx.Node{}
		for _, mr := range messageRestoration {
			rows = append(rows, nodx.Tr(
				nodx.Td(component.SpanText(mr.Schema)),
				nodx.Td(component.SpanText(mr.Table)),
				nodx.Td(component.SpanText(strconv.Itoa(mr.Records))),
			))
		}
		messageNode = nodx.Table(
			nodx.Class("table text-nowrap"),
			nodx.Thead(
				nodx.Tr(
					nodx.Th(component.SpanText("Phân hệ")),
					nodx.Th(component.SpanText("Bảng dữ liệu")),
					nodx.Th(component.SpanText("Số bản ghi")),
				),
			),
			nodx.Tbody(
				component.RenderableGroup(rows),
			),
		)
	}

	mo := component.Modal(component.ModalParams{
		Title:     "Chi tiết khôi phục",
		Size:      component.SizeLg,
		ClassName: "w-[70vw]",
		Content: []nodx.Node{
			nodx.Div(
				nodx.Class("overflow-x-auto"),
				nodx.Table(
					nodx.Class("table [&_th]:text-nowrap"),
					nodx.Tr(
						nodx.Th(component.SpanText("ID")),
						nodx.Td(component.SpanText(restoration.ID.String())),
					),
					nodx.Tr(
						nodx.Th(component.SpanText("Trạng thái")),
						nodx.Td(component.StatusBadge(restoration.Status)),
					),
					nodx.Tr(
						nodx.Th(component.SpanText("Sao lưu")),
						nodx.Td(component.SpanText(restoration.BackupName)),
					),
					nodx.Tr(
						nodx.Th(component.SpanText("Cơ sở dữ liệu")),
						nodx.Td(component.SpanText(func() string {
							if restoration.DatabaseName.Valid {
								return restoration.DatabaseName.String
							}
							return "Cơ sở dữ liệu khác"
						}())),
					),
					nodx.Tr(
						nodx.Th(component.SpanText("Thời gian bắt đầu")),
						nodx.Td(component.SpanText(
							restoration.StartedAt.Local().Format(timeutil.LayoutYYYYMMDDHHMMSSPretty),
						)),
					),
					nodx.If(
						restoration.FinishedAt.Valid,
						nodx.Tr(
							nodx.Th(component.SpanText("Thời gian kết thúc")),
							nodx.Td(component.SpanText(
								restoration.FinishedAt.Time.Local().Format(timeutil.LayoutYYYYMMDDHHMMSSPretty),
							)),
						),
					),
					nodx.If(
						restoration.FinishedAt.Valid,
						nodx.Tr(
							nodx.Th(component.SpanText("Tổng thời gian")),
							nodx.Td(component.SpanText(
								restoration.FinishedAt.Time.Sub(restoration.StartedAt).String(),
							)),
						),
					),
				),
				nodx.If(
					restoration.Message.Valid,
					nodx.Div(
						messageNode,
					),
				),
			),
		},
	})

	button := nodx.Button(
		mo.OpenerAttr,
		nodx.Class("btn btn-square btn-sm btn-ghost"),
		lucide.Eye(),
	)

	return nodx.Div(
		nodx.Class("inline-block tooltip tooltip-right"),
		nodx.Data("tip", "Xem chi tiết"),
		mo.HTML,
		button,
	)
}
