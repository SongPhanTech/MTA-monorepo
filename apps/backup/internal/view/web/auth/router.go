package auth

import (
	"github.com/eduardolat/pgbackweb/internal/service"
	"github.com/eduardolat/pgbackweb/internal/view/middleware"
	"github.com/labstack/echo/v4"
)

type handlers struct {
	servs *service.Service
}

func MountRouter(
	parent *echo.Group, mids *middleware.Middleware, servs *service.Service,
) {
	h := handlers{servs: servs}

	requireNoAuth := parent.Group("", mids.RequireNoAuth)

	requireNoAuth.GET("/create-first-user", h.createFirstUserPageHandler)
	requireNoAuth.POST("/create-first-user", h.createFirstUserHandler)

}
