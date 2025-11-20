package auth

import (
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"strings"

	"github.com/labstack/echo/v4"
)

const (
	sessionCookieName = "x-token-system"
)

type JWTPayload struct {
	Exp               int      `json:"exp"`
	Iat               int      `json:"iat"`
	AuthTime          int      `json:"auth_time"`
	Jti               string   `json:"jti"`
	Iss               string   `json:"iss"`
	Aud               []string `json:"aud"`
	Sub               string   `json:"sub"`
	Typ               string   `json:"typ"`
	Azp               string   `json:"azp"`
	Sid               string   `json:"sid"`
	Acr               string   `json:"acr"`
	AllowedOrigins    []string `json:"allowed-origins"`
	Scope             string   `json:"scope"`
	SDMNhanVienID     string   `json:"sDM_NhanVienId"`
	EmailVerified     bool     `json:"email_verified"`
	ITwoFASkipCount   int      `json:"iTwoFASkipCount"`
	SDMDonViID        string   `json:"sDM_DonViId"`
	Name              string   `json:"name"`
	PreferredUsername string   `json:"preferred_username"`
	GivenName         string   `json:"given_name"`
	FamilyName        string   `json:"family_name"`
	Email             string   `json:"email"`
}

func (s *Service) SetSessionCookie(c echo.Context, token string) {
	cookie := http.Cookie{
		Name:     sessionCookieName,
		Value:    token,
		MaxAge:   int(maxSessionAge.Seconds()),
		HttpOnly: true,
		Path:     "/",
	}
	c.SetCookie(&cookie)
}

func (s *Service) ClearSessionCookie(c echo.Context) {
	cookie := http.Cookie{
		Name:     sessionCookieName,
		Value:    "",
		MaxAge:   -1,
		HttpOnly: true,
		Path:     "/",
	}
	c.SetCookie(&cookie)
}

func DecodeJWTNoVerify(token string) (JWTPayload, error) {
	parts := strings.Split(token, ".")
	if len(parts) != 3 {
		return JWTPayload{}, fmt.Errorf("invalid token format")
	}

	payload, err := base64.RawURLEncoding.DecodeString(parts[1])
	if err != nil {
		return JWTPayload{}, err
	}

	var payloadData JWTPayload
	if err := json.Unmarshal(payload, &payloadData); err != nil {
		return JWTPayload{}, err
	}

	return payloadData, nil
}

func (s *Service) GetUserFromSessionCookie(c echo.Context) (
	bool, JWTPayload, error,
) {
	cookie, err := c.Cookie(sessionCookieName)
	if err != nil && errors.Is(err, http.ErrNoCookie) {
		return false, JWTPayload{}, nil
	}
	if err != nil {
		return false, JWTPayload{}, err
	}

	if cookie.Value == "" {
		return false, JWTPayload{}, nil
	}

	payload, err := DecodeJWTNoVerify(cookie.Value)
	if err != nil {
		return false, JWTPayload{}, err
	}

	return true, payload, nil
}
