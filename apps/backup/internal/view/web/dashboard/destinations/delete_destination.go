package destinations

import (
	"github.com/eduardolat/pgbackweb/internal/view/web/component"
	"github.com/eduardolat/pgbackweb/internal/view/web/respondhtmx"
	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
	nodx "github.com/nodxdev/nodxgo"
	htmx "github.com/nodxdev/nodxgo-htmx"
	lucide "github.com/nodxdev/nodxgo-lucide"
)

func (h *handlers) deleteDestinationHandler(c echo.Context) error {
	ctx := c.Request().Context()

	destinationID, err := uuid.Parse(c.Param("destinationID"))
	if err != nil {
		return respondhtmx.ToastError(c, err.Error())
	}

	err = h.servs.DestinationsService.DeleteDestination(ctx, destinationID)
	if err != nil {
		return respondhtmx.ToastError(c, err.Error())
	}

	return respondhtmx.Refresh(c)
}

func deleteDestinationButton(destinationID uuid.UUID) nodx.Node {
	return component.OptionsDropdownButton(
		htmx.HxDelete("/dashboard/destinations/"+destinationID.String()),
		htmx.HxConfirm("Bạn có chắc chắn muốn xóa đích đến lưu trữ này không?"),
		lucide.Trash(),
		component.SpanText("Xóa đích đến lưu trữ"),
	)
}
