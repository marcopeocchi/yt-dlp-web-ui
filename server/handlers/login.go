package handlers

import (
	"encoding/json"
	"net/http"
	"os"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/marcopeocchi/yt-dlp-web-ui/server/config"
	"github.com/marcopeocchi/yt-dlp-web-ui/server/utils"
)

type LoginRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

func Login(w http.ResponseWriter, r *http.Request) {
	req := new(LoginRequest)
	err := json.NewDecoder(r.Body).Decode(req)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	var (
		username = config.Instance().Username
		password = config.Instance().Password
	)

	if username != req.Username || password != req.Password {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	expiresAt := time.Now().Add(time.Hour * 24 * 30)

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"expiresAt": expiresAt,
		"username":  req.Username,
	})

	tokenString, err := token.SignedString([]byte(os.Getenv("JWT_SECRET")))
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	cookie := &http.Cookie{
		Name:     utils.TOKEN_COOKIE_NAME,
		HttpOnly: true,
		Secure:   false,
		Expires:  expiresAt, // 30 days
		Value:    tokenString,
		Path:     "/",
	}

	http.SetCookie(w, cookie)

	if err := json.NewEncoder(w).Encode("ok"); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
}

func Logout(w http.ResponseWriter, r *http.Request) {
	cookie := &http.Cookie{
		Name:     utils.TOKEN_COOKIE_NAME,
		HttpOnly: true,
		Secure:   false,
		Expires:  time.Now(),
		Value:    "",
		Path:     "/",
	}

	http.SetCookie(w, cookie)
}
