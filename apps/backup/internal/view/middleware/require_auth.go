package middleware

import (
	"net/http"

	"github.com/eduardolat/pgbackweb/internal/view/reqctx"
	"github.com/labstack/echo/v4"
	htmx "github.com/nodxdev/nodxgo-htmx"
)

func (m *Middleware) RequireAuth(next echo.HandlerFunc) echo.HandlerFunc {
	return func(c echo.Context) error {
		reqCtx := reqctx.GetCtx(c)
		if reqCtx.IsAuthed {
			return next(c)
		}
		htmx.ServerSetRedirect(c.Response().Header(), "/auth/login")
		return c.Redirect(http.StatusFound, "/auth/login")
	}
}
