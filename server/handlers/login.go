package handlers

import (
	"net/http"
	"os"
	"time"

	"github.com/goccy/go-json"
	"github.com/golang-jwt/jwt/v5"
	"github.com/marcopeocchi/yt-dlp-web-ui/server/config"
)

type LoginRequest struct {
	Secret string `json:"secret"`
}

func Login(w http.ResponseWriter, r *http.Request) {
	req := new(LoginRequest)
	err := json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	if config.Instance().GetConfig().RPCSecret != req.Secret {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	expiresAt := time.Now().Add(time.Hour * 24 * 30)

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"expiresAt": expiresAt,
	})

	tokenString, err := token.SignedString([]byte(os.Getenv("JWT_SECRET")))
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	cookie := &http.Cookie{
		Name:     TOKEN_COOKIE_NAME,
		HttpOnly: true,
		Secure:   false,
		Expires:  expiresAt, // 30 days
		Value:    tokenString,
		Path:     "/",
	}

	http.SetCookie(w, cookie)
}

func Logout(w http.ResponseWriter, r *http.Request) {
	cookie := &http.Cookie{
		Name:     TOKEN_COOKIE_NAME,
		HttpOnly: true,
		Secure:   false,
		Expires:  time.Now(),
		Value:    "",
		Path:     "/",
	}

	http.SetCookie(w, cookie)
}
