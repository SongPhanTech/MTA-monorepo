package view

import (
	"github.com/eduardolat/pgbackweb/internal/config"
	"github.com/eduardolat/pgbackweb/internal/database/dbgen"
	"github.com/eduardolat/pgbackweb/internal/service"
	"github.com/eduardolat/pgbackweb/internal/view/api"
	"github.com/eduardolat/pgbackweb/internal/view/middleware"
	"github.com/eduardolat/pgbackweb/internal/view/static"
	"github.com/eduardolat/pgbackweb/internal/view/web"
	"github.com/labstack/echo/v4"
)

func MountRouter(app *echo.Echo, servs *service.Service, dbgen *dbgen.Queries, env config.Env) {
	mids := middleware.New(servs, dbgen, env)

	// browserCache := mids.NewBrowserCacheMiddleware(
	// 	middleware.BrowserCacheMiddlewareConfig{
	// 		CacheDuration: time.Hour * 24 * 30,
	// 		ExcludedFiles: []string{"/robots.txt"},
	// 	},
	// )

	prefixGroup := app.Group(env.PBW_PREFIX)

	// prefixGroup.Use(browserCache)
	prefixGroup.StaticFS("/", static.StaticFs)
	// app.Group("", browserCache).StaticFS("", static.StaticFs)

	// apiGroup := app.Group(env.PBW_PREFIX + "/api")
	apiGroup := prefixGroup.Group("/api")
	api.MountRouter(apiGroup, mids, servs)

	// webGroup := app.Group(env.PBW_PREFIX, mids.InjectReqctx)
	webGroup := prefixGroup.Group("", mids.InjectReqctx)
	web.MountRouter(webGroup, mids, servs)
}
