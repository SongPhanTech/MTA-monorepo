package middleware

import (
	"encoding/json"
	"io/ioutil"
	"net/http"
	"time"

	"github.com/eduardolat/pgbackweb/internal/config"
	"github.com/eduardolat/pgbackweb/internal/database/dbgen"
	"github.com/eduardolat/pgbackweb/internal/logger"
	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
	htmx "github.com/nodxdev/nodxgo-htmx"
)

type Session struct {
	User struct {
		Name         string `json:"name"`
		Email        string `json:"email"`
		UserID       string `json:"user_id"`
		Username     string `json:"username"`
		AccessToken  string `json:"access_token"`
		RefreshToken string `json:"refresh_token"`
		GivenName    string `json:"given_name"`
	} `json:"user"`
	Expires time.Time `json:"expires"`
}

func (m *Middleware) RequireNoAuth(next echo.HandlerFunc) echo.HandlerFunc {
	return func(c echo.Context) error {
		env, err := config.GetEnv()
		if err != nil {
			panic(err)
		}
		req, err := http.NewRequest(http.MethodGet, env.PBW_AUTH_URL, nil)
		if err != nil {
			logger.Error("failed to create request", logger.KV{
				"error": err,
			})
		}
		for _, cookie := range c.Cookies() {
			req.AddCookie(cookie)
		}
		spaceClient := http.Client{
			Timeout: time.Second * 2, // Timeout after 2 seconds
		}
		res, err := spaceClient.Do(req)
		if err != nil {
			logger.Error("failed to create space client", logger.KV{
				"error": err,
			})
		}
		body, err := ioutil.ReadAll(res.Body)
		if err != nil {
			logger.Error("failed to read response body", logger.KV{
				"error": err,
			})
		}
		var s *Session
		json.Unmarshal(body, &s)
		defer res.Body.Close()
		logger.Info("response", logger.KV{
			"result": s,
		})

		var user dbgen.User
		user, err = m.servs.UsersService.GetUserByEmail(c.Request().Context(), s.User.Email)

		if err != nil {
			user, err = m.servs.UsersService.CreateUser(c.Request().Context(), dbgen.UsersServiceCreateUserParams{
				Name:     s.User.Name,
				Email:    s.User.Email,
				Password: "password",
				ID:       s.User.UserID,
			})

			if err != nil {
				logger.Error("failed to create user", logger.KV{
					"error": err,
				})
			}
		}
		logger.Info("User", logger.KV{
			"user": user,
		})

		session, err := m.dbgen.AuthServiceLoginCreateSession(
			c.Request().Context(), dbgen.AuthServiceLoginCreateSessionParams{
				UserID:        user.ID,
				Ip:            c.RealIP(),
				UserAgent:     c.Request().UserAgent(),
				Token:         uuid.NewString(),
				EncryptionKey: m.env.PBW_ENCRYPTION_KEY,
			},
		)
		if err != nil {
			logger.Error("failed to create session", logger.KV{
				"error": err,
			})
		}
		m.servs.AuthService.SetSessionCookie(c, session.DecryptedToken)
		htmx.ServerSetRedirect(c.Response().Header(), "/dashboard")
		return c.Redirect(http.StatusFound, "/dashboard")
	}
}
