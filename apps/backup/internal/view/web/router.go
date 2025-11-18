package web

import (
	"net/http"

	"github.com/eduardolat/pgbackweb/internal/config"
	"github.com/eduardolat/pgbackweb/internal/logger"
	"github.com/eduardolat/pgbackweb/internal/service"
	"github.com/eduardolat/pgbackweb/internal/view/middleware"
	"github.com/eduardolat/pgbackweb/internal/view/reqctx"
	"github.com/eduardolat/pgbackweb/internal/view/web/dashboard"
	"github.com/labstack/echo/v4"
)

func MountRouter(
	parent *echo.Group, mids *middleware.Middleware, servs *service.Service,
) {
	// GET / -> Handle the root path redirects
	parent.GET("", func(c echo.Context) error {
		reqCtx := reqctx.GetCtx(c)
		env, err := config.GetEnv()
		if err != nil {
			logger.FatalError("error getting environment variables", logger.KV{"error": err})
		}
		if reqCtx.IsAuthed {
			return c.Redirect(http.StatusFound, env.PBW_PREFIX+"/dashboard")
		}
		return c.Redirect(http.StatusFound, env.PBW_PREFIX+"/unauthorized")
	})

	// authGroup := parent.Group("/auth")
	// auth.MountRouter(authGroup, mids, servs)

	dashboardGroup := parent.Group("/dashboard", mids.RequireAuth)
	dashboard.MountRouter(dashboardGroup, mids, servs)
}
