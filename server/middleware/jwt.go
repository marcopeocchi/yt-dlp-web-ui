package middlewares

import (
	"fmt"
	"net/http"
	"os"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/marcopeocchi/yt-dlp-web-ui/server/config"
	"github.com/marcopeocchi/yt-dlp-web-ui/server/utils"
)

func Authenticated(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if !config.Instance().GetConfig().RequireAuth {
			next.ServeHTTP(w, r)
			return
		}

		cookie, err := r.Cookie(utils.TOKEN_COOKIE_NAME)

		if err != nil {
			http.Error(w, "invalid token", http.StatusBadRequest)
			return
		}

		if cookie == nil {
			http.Error(w, "invalid token", http.StatusBadRequest)
			return
		}

		token, _ := jwt.Parse(cookie.Value, func(t *jwt.Token) (interface{}, error) {
			if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, fmt.Errorf("unexpected signing method: %v", t.Header["alg"])
			}
			return []byte(os.Getenv("JWT_SECRET")), nil
		})

		if claims, ok := token.Claims.(jwt.MapClaims); ok && token.Valid {
			expiresAt, err := time.Parse(time.RFC3339, claims["expiresAt"].(string))

			if err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}

			if time.Now().After(expiresAt) {
				http.Error(w, "token expired", http.StatusBadRequest)
				return
			}
		} else {
			http.Error(w, "invalid token", http.StatusBadRequest)
			return
		}

		next.ServeHTTP(w, r)
	})
}
