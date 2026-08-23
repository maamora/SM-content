# Meta OAuth setup for STUDIO

This guide enables the existing STUDIO connection flow for **Facebook Pages and linked Instagram professional accounts**. It does not contain or require committing an App Secret.

## 1. Prepare the Meta app

Create or open the app in the [Meta for Developers dashboard](https://developers.facebook.com/apps/). Add the Facebook Login product available in the dashboard; Meta may label the current business-oriented option **Facebook Login for Business**. If Instagram publishing is required, also add the Instagram API configuration that uses Facebook login.

Copy the app’s **App ID** and **App Secret** from the app’s basic settings. Keep the secret server-only. STUDIO’s browser code never receives it; the backend exchanges the authorization code server-side.

> STUDIO requests `pages_show_list`, `pages_read_engagement`, `pages_manage_posts`, `instagram_basic`, and `instagram_content_publish`. The connected Facebook user must be able to manage the selected Facebook Page. For Instagram publishing, the Instagram account must be a professional account linked to that Page.[1]

## 2. Register the callback URL exactly

In the Facebook Login product settings, add the exact backend callback to **Valid OAuth Redirect URIs**. The value must exactly equal `META_REDIRECT_URI`, including protocol, hostname, port, path, and absence/presence of a trailing slash.[2]

| Environment | Valid OAuth Redirect URI | `META_REDIRECT_URI` |
|---|---|---|
| Local development | `http://localhost:8080/api/social/callback/meta` | `http://localhost:8080/api/social/callback/meta` |
| Production | `https://api.example.com/api/social/callback/meta` | `https://api.example.com/api/social/callback/meta` |

The frontend URL is **not** the Meta callback. Meta returns to the backend callback first; STUDIO then redirects the browser to the frontend Social page.

## 3. Set the backend environment values

In `backend/.env`, add the values below. Do not quote, commit, share, or paste the App Secret into chat or source control.

```dotenv
META_APP_ID=your_meta_app_id
META_APP_SECRET=your_meta_app_secret
META_REDIRECT_URI=http://localhost:8080/api/social/callback/meta
META_GRAPH_VERSION=v26.0

# Must point to the running Next.js client for the final OAuth redirect.
FRONTEND_URL=http://localhost:3000
```

For production, replace both URLs with the deployed HTTPS origins. Restart the backend after every environment change.

## 4. Development and access requirements

While the Meta app is in development mode, add the person performing the connection as an app role user in the Meta dashboard. For a production app that serves people who do not have an app role, request the appropriate Meta access level and complete any required review or business verification.[1]

The person connecting STUDIO must select a Facebook Page they can manage. If they need Instagram delivery, its Instagram professional account must be linked to the same Page.[1]

## 5. Verify STUDIO before connecting an account

Start the backend, then run this in PowerShell from the repository’s `backend` folder:

```powershell
Invoke-RestMethod http://localhost:8080/api/system/capabilities |
  ConvertTo-Json -Depth 10
```

Confirm that `metaOAuth` is `true`. If it is `false`, the backend did not receive a non-empty `META_APP_ID` and `META_APP_SECRET`; re-check the `.env` location, spelling, and backend restart.

Then sign into STUDIO, open **Social**, and select **Connect** for Meta. STUDIO first checks the server capability. When configured, it opens the Meta consent flow; after success, the backend returns to the Social page and creates an active connection record.

## Common failures

| Symptom | Likely cause | Fix |
|---|---|---|
| “Meta / Instagram + Facebook needs server configuration” | One or both Meta variables are empty, or the backend was not restarted. | Set both server variables and restart. |
| Meta shows a redirect mismatch | Dashboard URI and `META_REDIRECT_URI` differ by host, port, protocol, or path. | Copy the exact same URI into both places. |
| “No Facebook Page was available” | Connected person has no manageable Page, or the necessary Page access was not granted. | Connect with a Page administrator or grant the appropriate Page task/access. |
| Facebook connects but Instagram is unavailable | The Instagram account is not a professional account linked to the selected Page. | Convert/link the account in Meta Business settings, then reconnect. |

## References

[1]: https://developers.facebook.com/documentation/instagram-platform/overview "Meta: Instagram Platform overview"
[2]: https://developers.facebook.com/documentation/facebook-login/guides/advanced/manual-flow "Meta: Manually build a Facebook Login flow"
