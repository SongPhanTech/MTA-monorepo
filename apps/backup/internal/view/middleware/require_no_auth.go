package middleware

import (
	"github.com/labstack/echo/v4"
)

func (m *Middleware) RequireNoAuth(next echo.HandlerFunc) echo.HandlerFunc {
	return func(c echo.Context) error {
		return next(c)
	}
}
