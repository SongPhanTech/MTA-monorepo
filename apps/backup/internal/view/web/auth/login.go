package auth

import (
	"net/http"

	"github.com/eduardolat/pgbackweb/internal/config"
	"github.com/eduardolat/pgbackweb/internal/logger"
	"github.com/eduardolat/pgbackweb/internal/util/echoutil"
	"github.com/eduardolat/pgbackweb/internal/validate"
	"github.com/eduardolat/pgbackweb/internal/view/web/component"
	"github.com/eduardolat/pgbackweb/internal/view/web/layout"
	"github.com/eduardolat/pgbackweb/internal/view/web/respondhtmx"
	"github.com/labstack/echo/v4"
	nodx "github.com/nodxdev/nodxgo"
	htmx "github.com/nodxdev/nodxgo-htmx"
	lucide "github.com/nodxdev/nodxgo-lucide"
)

func (h *handlers) loginPageHandler(c echo.Context) error {
	ctx := c.Request().Context()
	usersQty, err := h.servs.UsersService.GetUsersQty(ctx)
	if err != nil {
		logger.Error("failed to get users qty", logger.KV{
			"ip":    c.RealIP(),
			"ua":    c.Request().UserAgent(),
			"error": err,
		})
		return c.String(http.StatusInternalServerError, "Internal server error")
	}
	if usersQty == 0 {
		return c.Redirect(http.StatusFound, "/auth/create-first-user")
	}

	return echoutil.RenderNodx(c, http.StatusOK, loginPage())
}

func loginPage() nodx.Node {
	env, err := config.GetEnv()
	if err != nil {
		logger.FatalError("error getting environment variables", logger.KV{"error": err})
	}
	content := []nodx.Node{
		component.H1Text("Đăng nhập"),

		nodx.FormEl(
			htmx.HxPost(env.PBW_PREFIX+"/auth/login"),
			htmx.HxDisabledELT("find button"),
			nodx.Class("mt-4 space-y-2"),
			component.InputControl(component.InputControlParams{
				Name:         "username",
				Label:        "Tên đăng nhập",
				Placeholder:  "Nhập tên đăng nhập",
				Required:     true,
				Type:         component.InputTypeText,
				AutoComplete: "username",
			}),
			component.InputControl(component.InputControlParams{
				Name:         "password",
				Label:        "Mật khẩu",
				Placeholder:  "******",
				Required:     true,
				Type:         component.InputTypePassword,
				AutoComplete: "current-password",
			}),
			nodx.Div(
				nodx.Class("pt-2 flex justify-end items-center space-x-2"),
				component.HxLoadingMd(),
				nodx.Button(
					nodx.Class("btn btn-primary"),
					nodx.Type("submit"),
					component.SpanText("Đăng nhập"),
					lucide.LogIn(),
				),
			),
		),
	}

	return layout.Auth(layout.AuthParams{
		Title: "Đăng nhập",
		Body:  content,
	})
}

func (h *handlers) loginHandler(c echo.Context) error {
	ctx := c.Request().Context()
	env, err := config.GetEnv()
	if err != nil {
		logger.FatalError("error getting environment variables", logger.KV{"error": err})
	}
	var formData struct {
		Username string `form:"username" validate:"required"`
		Password string `form:"password" validate:"required,max=50"`
	}
	if err := c.Bind(&formData); err != nil {
		return respondhtmx.ToastError(c, err.Error())
	}
	if err := validate.Struct(&formData); err != nil {
		return respondhtmx.ToastError(c, err.Error())
	}

	session, err := h.servs.AuthService.Login(
		ctx, formData.Username, formData.Password, c.RealIP(), c.Request().UserAgent(),
	)
	if err != nil {
		logger.Error("login failed", logger.KV{
			"username": formData.Username,
			"ip":       c.RealIP(),
			"ua":       c.Request().UserAgent(),
			"err":      err,
		})
		return respondhtmx.ToastError(c, "Đăng nhập thất bại")
	}

	h.servs.AuthService.SetSessionCookie(c, session.DecryptedToken)
	return respondhtmx.Redirect(c, env.PBW_PREFIX+"/dashboard")
}
