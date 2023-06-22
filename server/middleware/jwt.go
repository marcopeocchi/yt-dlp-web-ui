package middlewares

import (
	"fmt"
	"os"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
	"github.com/marcopeocchi/yt-dlp-web-ui/server/config"
)

const (
	TOKEN_COOKIE_NAME = "jwt"
)

var Authenticated = func(c *fiber.Ctx) error {
	if !config.Instance().GetConfig().RequireAuth {
		return c.Next()
	}

	cookie := c.Cookies(TOKEN_COOKIE_NAME)

	if cookie == "" {
		return c.Status(fiber.StatusUnauthorized).SendString("invalid token")
	}

	token, _ := jwt.Parse(cookie, func(t *jwt.Token) (interface{}, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", t.Header["alg"])
		}
		return []byte(os.Getenv("JWTSECRET")), nil
	})

	if claims, ok := token.Claims.(jwt.MapClaims); ok && token.Valid {
		expiresAt, err := time.Parse(time.RFC3339, claims["expiresAt"].(string))

		if err != nil {
			return c.SendStatus(fiber.StatusInternalServerError)
		}

		if time.Now().After(expiresAt) {
			return c.Status(fiber.StatusBadRequest).SendString("expired token")
		}
	} else {
		return c.Status(fiber.StatusUnauthorized).SendString("invalid token")
	}

	return c.Next()
}
