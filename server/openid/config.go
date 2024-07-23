package openid

import (
	"context"

	"github.com/coreos/go-oidc"
	"github.com/marcopeocchi/yt-dlp-web-ui/server/config"
	"golang.org/x/oauth2"
)

func Configure() {
	if !config.Instance().UseOpenId {
		return
	}

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
