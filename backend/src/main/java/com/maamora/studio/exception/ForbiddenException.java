package com.maamora.studio.exception;

/**
 * The caller is authenticated (their JWT is valid) but isn't allowed to
 * perform this specific action — e.g. a plain MEMBER trying to kick/ban/
 * promote, or a non-owner trying to delete the brand. Mapped to HTTP 403.
 *
 * This is deliberately distinct from UnauthorizedException (HTTP 401), which
 * the frontend treats as "your session is invalid" and reacts to by clearing
 * the token and forcing a redirect to /login. A permission error on a
 * perfectly valid, currently-logged-in session should never do that — it
 * should just show the error message in place. Mixing the two up is exactly
 * what caused the Settings → Members page to log a non-owner/non-admin
 * member straight back out to the login screen instead of just hiding the
 * moderator-only actions.
 */
public class ForbiddenException extends RuntimeException {
    public ForbiddenException(String message) {
        super(message);
    }
}
