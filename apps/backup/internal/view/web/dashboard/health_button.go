package dashboard

import (
	"fmt"
	"net/http"

	"github.com/eduardolat/pgbackweb/internal/database/dbgen"
	"github.com/eduardolat/pgbackweb/internal/service"
	"github.com/eduardolat/pgbackweb/internal/util/echoutil"
	"github.com/eduardolat/pgbackweb/internal/view/web/component"
	"github.com/eduardolat/pgbackweb/internal/view/web/respondhtmx"
	"github.com/labstack/echo/v4"
	nodx "github.com/nodxdev/nodxgo"
)

func healthButtonHandler(servs *service.Service) echo.HandlerFunc {
	return func(c echo.Context) error {
		ctx := c.Request().Context()

		databasesQty, err := servs.DatabasesService.GetDatabasesQty(ctx)
		if err != nil {
			return respondhtmx.ToastError(c, err.Error())
		}
		destinationsQty, err := servs.DestinationsService.GetDestinationsQty(ctx)
		if err != nil {
			return respondhtmx.ToastError(c, err.Error())
		}

		return echoutil.RenderNodx(c, http.StatusOK, healthButton(
			databasesQty, destinationsQty,
		))
	}
}

func healthButton(
	databasesQty dbgen.DatabasesServiceGetDatabasesQtyRow,
	destinationsQty dbgen.DestinationsServiceGetDestinationsQtyRow,
) nodx.Node {
	isHealthy := true

	if databasesQty.Unhealthy > 0 {
		isHealthy = false
	}
	if destinationsQty.Unhealthy > 0 {
		isHealthy = false
	}

	pingColor := component.ColorSuccess
	if !isHealthy {
		pingColor = component.ColorError
	}

	mo := component.Modal(component.ModalParams{
		Size:  component.SizeMd,
		Title: "Tình trạng",
		Content: []nodx.Node{
			component.PText(`
				Việc kiểm tra tình trạng của cả cơ sở dữ liệu và đích đến sẽ tự động chạy mỗi 10 phút, khi phần mềm khởi động và khi bạn nhấp vào nút "Kiểm tra kết nối" trên từng tài nguyên. Bạn có thể xem thêm thông tin chi tiết và thông báo lỗi bằng cách nhấp vào nút kiểm tra tình trạng cho từng tài nguyên.
			`),
			nodx.Table(
				nodx.Class("table mt-2"),
				nodx.Thead(
					nodx.Tr(
						nodx.Th(component.SpanText("Tài nguyên")),
						nodx.Th(component.SpanText("Tổng số")),
						nodx.Th(component.SpanText("Bình thường")),
						nodx.Th(component.SpanText("Có vấn đề")),
					),
				),
				nodx.Tbody(
					nodx.Tr(
						nodx.Td(component.SpanText("Cơ sở dữ liệu")),
						nodx.Td(component.SpanText(fmt.Sprintf("%d", databasesQty.All))),
						nodx.Td(component.SpanText(fmt.Sprintf("%d", databasesQty.Healthy))),
						nodx.Td(component.SpanText(fmt.Sprintf("%d", databasesQty.Unhealthy))),
					),
					nodx.Tr(
						nodx.Td(component.SpanText("Đích đến lưu trữ")),
						nodx.Td(component.SpanText(fmt.Sprintf("%d", destinationsQty.All))),
						nodx.Td(component.SpanText(fmt.Sprintf("%d", destinationsQty.Healthy))),
						nodx.Td(component.SpanText(fmt.Sprintf("%d", destinationsQty.Unhealthy))),
					),
				),
			),
		},
	})

	return nodx.Div(
		nodx.Class("inline-block"),
		mo.HTML,
		nodx.Button(
			mo.OpenerAttr,
			nodx.Class("btn btn-ghost btn-neutral"),
			component.SpanText("Kiểm tra tình trạng"),
			component.Ping(pingColor),
		),
	)
}
