# STUDIO OAuth provider findings — 2026-08-16

## Meta / Facebook Login and Instagram

Meta’s server-side OAuth flow requires the app’s `redirect_uri` to be registered under Facebook Login → Settings → Client OAuth Settings → Valid OAuth redirect URIs. Meta’s documentation also recommends a state value for CSRF protection and says the app secret must remain server-side. Instagram’s OAuth authorize endpoint similarly requires an exact redirect URI match against the app’s valid OAuth URI list and uses the `code` response type for authorization-code exchange. The Instagram documentation lists `instagram_business_basic` as a relevant business permission.

Sources: [Meta Facebook Login manual flow](https://developers.facebook.com/documentation/facebook-login/guides/advanced/manual-flow), [Instagram OAuth authorize](https://developers.facebook.com/documentation/instagram-platform/reference/oauth-authorize)

## TikTok Login Kit

TikTok’s official Login Kit web documentation is the provider reference for registering a web redirect URI and completing the authorization flow. The application should use the exact callback configured in the TikTok developer portal; the repository’s local callback is `http://localhost:8080/api/social/callback/tiktok`.

Source: [TikTok Login Kit for Web](https://developers.tiktok.com/doc/login-kit-web/)

## LinkedIn

LinkedIn’s current self-serve sign-in documentation describes OAuth 2.0 with OpenID Connect. The requested scopes are `openid`, `profile`, and `email`; the app may need to request the Sign In with LinkedIn using OpenID Connect product in the Developer Portal. The provider exposes authorization and token endpoints through its OpenID configuration, and ID tokens should be validated against the published metadata/JWKS.

Source: [LinkedIn Sign In with LinkedIn using OpenID Connect](https://learn.microsoft.com/en-us/linkedin/consumer/integrations/self-serve/sign-in-with-linkedin-v2)

## Repository callbacks

| Provider | Local callback configured by STUDIO |
| --- | --- |
| Meta | `http://localhost:8080/api/social/callback/meta` |
| TikTok | `http://localhost:8080/api/social/callback/tiktok` |
| LinkedIn | `http://localhost:8080/api/social/callback/linkedin` |
| X | `http://localhost:8080/api/social/callback/x` |

These URLs are configuration values, not proof that the corresponding integration is complete. The current backend reports OAuth capability only when the corresponding client ID/key and secret are present, and the product scope still documents social publishing as a boundary requiring provider-specific route completion and review.
