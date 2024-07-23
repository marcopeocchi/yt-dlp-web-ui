package openid

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"time"

	"github.com/coreos/go-oidc"
	"github.com/google/uuid"
	"github.com/marcopeocchi/yt-dlp-web-ui/server/config"
	"golang.org/x/oauth2"
)

type OAuth2SuccessResponse struct {
	OAuth2Token    *oauth2.Token
	OAuth2RawToken string
	IDTokenClaims  *json.RawMessage
}

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
		Path:     "/",
		Secure:   r.TLS != nil,
		Expires:  time.Now().Add(time.Hour * 24 * 30),
	})

	http.SetCookie(w, &http.Cookie{
		Name:     "nonce",
		Value:    nonce,
		HttpOnly: true,
		Path:     "/",
		Secure:   r.TLS != nil,
		Expires:  time.Now().Add(time.Hour * 24 * 30),
	})

	http.Redirect(w, r, oauth2Config.AuthCodeURL(state, oidc.Nonce(nonce)), http.StatusFound)
}

func doAuthentification(r *http.Request) (*OAuth2SuccessResponse, error) {
	state, err := r.Cookie("state")
	if err != nil {
		return nil, err
	}

	if r.URL.Query().Get("state") != state.Value {
		return nil, errors.New("auth state does not match")
	}

	oauth2Token, err := oauth2Config.Exchange(r.Context(), r.URL.Query().Get("code"))
	if err != nil {
		return nil, err
	}

	rawToken, ok := oauth2Token.Extra("id_token").(string)
	if !ok {
		return nil, errors.New("openid field \"id_token\" not found in oauth2 token")
	}

	idToken, err := verifier.Verify(r.Context(), rawToken)
	if err != nil {
		return nil, err
	}

	nonce, err := r.Cookie("nonce")
	if err != nil {
		return nil, err
	}

	if idToken.Nonce != nonce.Value {
		return nil, errors.New("auth nonce does not match")
	}

	// redact
	oauth2Token.AccessToken = ""

	res := OAuth2SuccessResponse{
		oauth2Token,
		rawToken,
		&json.RawMessage{},
	}

	if err := idToken.Claims(&res.IDTokenClaims); err != nil {
		return nil, err
	}

	return &res, nil
}

func SingIn(w http.ResponseWriter, r *http.Request) {
	res, err := doAuthentification(r)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	http.SetCookie(w, &http.Cookie{
		Name:     "oid-token",
		Value:    res.OAuth2RawToken,
		HttpOnly: true,
		Path:     "/",
		Secure:   r.TLS != nil,
		Expires:  time.Now().Add(time.Hour * 24 * 30),
	})

	// if err := json.NewEncoder(w).Encode(res); err != nil {
	// 	http.Error(w, err.Error(), http.StatusInternalServerError)
	// 	return
	// }

	fmt.Fprintf(w, "Login succesfully, you may now close this window and refresh yt-dlp-webui.")
}

func Logout(w http.ResponseWriter, r *http.Request) {
	http.SetCookie(w, &http.Cookie{
		Name:     "oid-token",
		HttpOnly: true,
		Path:     "/",
		Secure:   r.TLS != nil,
		Expires:  time.Now(),
	})

	http.SetCookie(w, &http.Cookie{
		Name:     "state",
		HttpOnly: true,
		Path:     "/",
		Secure:   r.TLS != nil,
		Expires:  time.Now(),
	})

	http.SetCookie(w, &http.Cookie{
		Name:     "nonce",
		HttpOnly: true,
		Path:     "/",
		Secure:   r.TLS != nil,
		Expires:  time.Now(),
	})
}
