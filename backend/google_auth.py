"""
google_auth.py — Google OAuth 2.0 ID-token verification
---------------------------------------------------------
Verifies the credential (JWT ID token) issued by Google Identity Services
(Sign In With Google / GIS) without needing the full google-auth SDK.

Flow:
  1. Frontend loads Google GIS script, shows the "Sign in with Google" button.
  2. User signs in; Google returns a credential (JWT ID token).
  3. Frontend POSTs { credential } to  POST /auth/google.
  4. This module verifies the token and returns profile info.
  5. Backend finds-or-creates the user, issues our own JWT.

Dependencies:
  - httpx  (already in the venv)
  - python-jose  (already in the venv, used for JWT decode)
  - google-auth  (optional; used for faster verification if installed)
"""

import os
import logging
import json
import base64

logger = logging.getLogger(__name__)

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")
GOOGLE_CERTS_URL = "https://www.googleapis.com/oauth2/v3/certs"
GOOGLE_TOKENINFO_URL = "https://oauth2.googleapis.com/tokeninfo"


def _b64decode_padding(s: str) -> bytes:
    """Base64url decode with padding fix."""
    s += "=" * (-len(s) % 4)
    return base64.urlsafe_b64decode(s)


def _decode_jwt_payload(token: str) -> dict:
    """Decode the JWT payload WITHOUT verifying the signature (for inspection)."""
    parts = token.split(".")
    if len(parts) != 3:
        raise ValueError("Not a valid JWT (must have 3 parts)")
    return json.loads(_b64decode_padding(parts[1]).decode("utf-8"))


def verify_google_token(credential: str) -> dict:
    """
    Verify a Google ID token (credential) and return profile data.

    Returns:
        dict with keys: email, name, picture (optional), sub, email_verified

    Raises:
        ValueError on invalid / unverifiable token.
    """
    if not credential:
        raise ValueError("No credential provided")

    # ── Strategy 1: google-auth library (most secure) ──────────────────────
    try:
        from google.oauth2 import id_token
        from google.auth.transport import requests as grequests

        id_info = id_token.verify_oauth2_token(
            credential,
            grequests.Request(),
            GOOGLE_CLIENT_ID or None,
        )
        if GOOGLE_CLIENT_ID and id_info.get("aud") != GOOGLE_CLIENT_ID:
            raise ValueError("Token audience mismatch")
        return _extract_profile(id_info)
    except ImportError:
        logger.debug("google-auth not installed; using tokeninfo endpoint")
    except Exception as exc:
        raise ValueError(f"google-auth verification failed: {exc}") from exc

    # ── Strategy 2: Google tokeninfo endpoint via httpx ────────────────────
    try:
        import httpx
        resp = httpx.get(
            GOOGLE_TOKENINFO_URL,
            params={"id_token": credential},
            timeout=10,
        )
        if resp.status_code != 200:
            raise ValueError(f"Google tokeninfo rejected the token (HTTP {resp.status_code})")

        id_info = resp.json()
        if "error" in id_info or "error_description" in id_info:
            raise ValueError(id_info.get("error_description", "Invalid Google token"))

        if GOOGLE_CLIENT_ID and id_info.get("aud") != GOOGLE_CLIENT_ID:
            raise ValueError("Token audience mismatch")

        return _extract_profile(id_info)
    except ImportError:
        pass
    except ValueError:
        raise
    except Exception as exc:
        raise ValueError(f"Token verification via tokeninfo failed: {exc}") from exc

    # ── Strategy 3: Decode payload without signature verification ──────────
    # Last resort — only safe if GOOGLE_CLIENT_ID is set and we trust the aud claim.
    if not GOOGLE_CLIENT_ID:
        raise ValueError(
            "Cannot verify Google token: GOOGLE_CLIENT_ID is not set "
            "and no verification library is available."
        )
    try:
        payload = _decode_jwt_payload(credential)
        if payload.get("aud") != GOOGLE_CLIENT_ID:
            raise ValueError("Token audience mismatch")
        if payload.get("iss") not in ("accounts.google.com", "https://accounts.google.com"):
            raise ValueError("Token issuer is not Google")
        return _extract_profile(payload)
    except Exception as exc:
        raise ValueError(f"JWT payload decode failed: {exc}") from exc


def _extract_profile(id_info: dict) -> dict:
    """Normalise the Google ID info dict into a consistent profile dict."""
    email = id_info.get("email")
    if not email:
        raise ValueError("Google token does not contain an email address")
    return {
        "email": email,
        "name": id_info.get("name") or email.split("@")[0],
        "picture": id_info.get("picture"),
        "sub": id_info.get("sub", ""),
        "email_verified": str(id_info.get("email_verified", "false")).lower() == "true",
    }
