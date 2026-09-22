import requests
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.config import settings
from app.models.oauth import GoogleOAuthToken

# Official Google Meet & OAuth 2.0 endpoints
GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo"
GOOGLE_MEET_API_SPACES_URL = "https://meet.googleapis.com/v2/spaces"

# Required OAuth Scopes for Google Meet Space creation
GOOGLE_MEET_SCOPES = [
    "https://www.googleapis.com/auth/meetings.space.created",
    "openid",
    "email",
    "profile"
]

class GoogleMeetService:
    @staticmethod
    def is_configured() -> bool:
        """Check if Google OAuth credentials have been provided in backend config."""
        return bool(settings.GOOGLE_CLIENT_ID and settings.GOOGLE_CLIENT_SECRET)

    @staticmethod
    def get_authorization_url(user_id: int) -> str:
        """Generate Google OAuth 2.0 authorization URL requesting Meet space creation scopes."""
        if not GoogleMeetService.is_configured():
            raise HTTPException(
                status_code=400,
                detail="Google OAuth credentials (GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET) are not configured in backend/.env."
            )

        params = {
            "client_id": settings.GOOGLE_CLIENT_ID,
            "redirect_uri": settings.GOOGLE_REDIRECT_URI,
            "response_type": "code",
            "scope": " ".join(GOOGLE_MEET_SCOPES),
            "access_type": "offline",  # Crucial to receive a refresh_token
            "prompt": "consent",      # Ensure refresh_token is re-issued
            "state": str(user_id)
        }

        req = requests.Request("GET", GOOGLE_AUTH_URL, params=params)
        prepared = req.prepare()
        return prepared.url

    @staticmethod
    def exchange_code_for_tokens(code: str) -> Dict[str, Any]:
        """Exchange one-time authorization code for Google access and refresh tokens."""
        if not GoogleMeetService.is_configured():
            raise HTTPException(
                status_code=400,
                detail="Google OAuth credentials are not configured in backend/.env."
            )

        payload = {
            "client_id": settings.GOOGLE_CLIENT_ID,
            "client_secret": settings.GOOGLE_CLIENT_SECRET,
            "code": code,
            "grant_type": "authorization_code",
            "redirect_uri": settings.GOOGLE_REDIRECT_URI
        }

        resp = requests.post(GOOGLE_TOKEN_URL, data=payload, timeout=15)
        if not resp.ok:
            err_data = resp.json() if resp.headers.get("content-type", "").startswith("application/json") else {}
            err_msg = err_data.get("error_description") or err_data.get("error") or resp.text
            raise HTTPException(status_code=400, detail=f"Google OAuth token exchange failed: {err_msg}")

        return resp.json()

    @staticmethod
    def get_google_user_email(access_token: str) -> Optional[str]:
        """Fetch email address associated with the Google access token."""
        try:
            resp = requests.get(
                GOOGLE_USERINFO_URL,
                headers={"Authorization": f"Bearer {access_token}"},
                timeout=10
            )
            if resp.ok:
                return resp.json().get("email")
        except Exception:
            pass
        return None

    @staticmethod
    def get_valid_access_token(user_id: int, db: Session) -> str:
        """
        Fetch valid Google OAuth access token for user.
        If token is near expiration, refresh it using refresh_token.
        """
        token_record = db.query(GoogleOAuthToken).filter(GoogleOAuthToken.user_id == user_id).first()
        if not token_record:
            raise HTTPException(
                status_code=400,
                detail="Google account not connected. Please connect your Google account to create real Google Meet sessions."
            )

        # Check if token is expired or will expire in next 90 seconds
        now = datetime.utcnow()
        if token_record.expires_at and (token_record.expires_at - now).total_seconds() < 90:
            if not token_record.refresh_token:
                raise HTTPException(
                    status_code=401,
                    detail="Google authorization expired. Please reconnect your Google account to grant Meet permissions."
                )

            # Refresh the token
            refresh_payload = {
                "client_id": settings.GOOGLE_CLIENT_ID,
                "client_secret": settings.GOOGLE_CLIENT_SECRET,
                "refresh_token": token_record.refresh_token,
                "grant_type": "refresh_token"
            }

            resp = requests.post(GOOGLE_TOKEN_URL, data=refresh_payload, timeout=15)
            if not resp.ok:
                raise HTTPException(
                    status_code=401,
                    detail="Failed to refresh Google OAuth token. The connection may have been revoked. Please reconnect your Google account."
                )

            data = resp.json()
            new_access_token = data.get("access_token")
            expires_in = data.get("expires_in", 3600)

            token_record.access_token = new_access_token
            token_record.expires_at = datetime.utcnow() + timedelta(seconds=expires_in)
            if data.get("refresh_token"):
                token_record.refresh_token = data.get("refresh_token")

            db.commit()
            return new_access_token

        return token_record.access_token

    @staticmethod
    def create_meeting_space(access_token: str) -> Dict[str, str]:
        """
        Call Google Meet REST API v2 to create an authorized meeting space.
        Endpoint: POST https://meet.googleapis.com/v2/spaces
        Returns: { meeting_url, meeting_code, space_name }
        """
        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json"
        }

        # Google Meet API v2 expects empty body or config parameters
        body = {
            "config": {
                "accessType": "OPEN"
            }
        }

        resp = requests.post(GOOGLE_MEET_API_SPACES_URL, headers=headers, json=body, timeout=20)
        
        if not resp.ok:
            err_data = resp.json() if resp.headers.get("content-type", "").startswith("application/json") else {}
            err_msg = err_data.get("error", {}).get("message") or resp.text
            status = resp.status_code
            if status == 401:
                raise HTTPException(status_code=401, detail="Google Meet authorization expired or invalid scope. Please reconnect your Google account.")
            elif status == 403:
                raise HTTPException(status_code=403, detail=f"Google Meet API error (403 Forbidden): Ensure the Google Meet API is enabled in your Google Cloud Console. {err_msg}")
            else:
                raise HTTPException(status_code=400, detail=f"Failed to create Google Meet space: {err_msg}")

        space_data = resp.json()
        meeting_uri = space_data.get("meetingUri")
        meeting_code = space_data.get("meetingCode")
        space_name = space_data.get("name")

        if not meeting_uri:
            raise HTTPException(status_code=500, detail="Google Meet API did not return a valid meetingUri.")

        return {
            "meeting_url": meeting_uri,
            "meeting_code": meeting_code or (meeting_uri.split("/")[-1] if "/" in meeting_uri else ""),
            "space_name": space_name or ""
        }
