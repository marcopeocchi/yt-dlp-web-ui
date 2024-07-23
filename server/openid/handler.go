package openid

import (
	"context"
	"encoding/json"
	"net/http"
	"time"

	"github.com/coreos/go-oidc"
	"github.com/google/uuid"
	"github.com/marcopeocchi/yt-dlp-web-ui/server/config"
	"golang.org/x/oauth2"
)

var (
	oauth2Config oauth2.Config
	verifier     *oidc.IDTokenVerifier
)

func Configure() {
	provider, err := oidc.NewProvider(context.Background(), config.Instance().OpenIdProviderURL)
	if err != nil {
		panic(err)
	}

	oauth2Config = oauth2.Config{
		ClientID:     config.Instance().OpenIdClientId,
		ClientSecret: config.Instance().OpenIdClientSecret,
		RedirectURL:  config.Instance().OpenIdRedirectURL,
		Endpoint:     provider.Endpoint(),
		Scopes:       []string{oidc.ScopeOpenID, "profile", "email"},
	}

	verifier = provider.Verifier(&oidc.Config{
		ClientID: config.Instance().OpenIdClientId,
	})
}

func Login(w http.ResponseWriter, r *http.Request) {
	var (
		state = uuid.NewString()
		nonce = uuid.NewString() // maybe something cryptographycally more seucre?
	)

	http.SetCookie(w, &http.Cookie{
		Name:     "state",
		Value:    state,
		HttpOnly: true,
		Secure:   r.TLS != nil,
		Expires:  time.Now().Add(time.Hour * 24 * 30),
	})

	http.SetCookie(w, &http.Cookie{
		Name:     "nonce",
		Value:    nonce,
		HttpOnly: true,
		Secure:   r.TLS != nil,
		Expires:  time.Now().Add(time.Hour * 24 * 30),
	})

	http.Redirect(w, r, oauth2Config.AuthCodeURL(state, oidc.Nonce(nonce)), http.StatusFound)
}

func SingIn(w http.ResponseWriter, r *http.Request) {
	state, err := r.Cookie("state")
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	if r.URL.Query().Get("state") != state.Value {
		http.Error(w, "auth state does not match", http.StatusBadRequest)
		return
	}

	oauth2Token, err := oauth2Config.Exchange(r.Context(), r.URL.Query().Get("code"))
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	rawToken, ok := oauth2Token.Extra("id_token").(string)
	if !ok {
		http.Error(w, "openid field \"id_token\" not found in oauth2 token", http.StatusBadRequest)
		return
	}

	idToken, err := verifier.Verify(r.Context(), rawToken)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	nonce, err := r.Cookie("nonce")
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	if idToken.Nonce != nonce.Value {
		http.Error(w, "auth nonce does not match", http.StatusBadRequest)
		return
	}

	// redact
	oauth2Token.AccessToken = ""

	res := struct {
		OAuth2Token   *oauth2.Token
		IDTokenClaims *json.RawMessage
	}{
		oauth2Token,
		&json.RawMessage{},
	}

	if err := idToken.Claims(&res.IDTokenClaims); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	if err := json.NewEncoder(w).Encode(res); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
}
