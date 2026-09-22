from datetime import datetime, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import HTMLResponse, RedirectResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app import models
from app.models.oauth import GoogleOAuthToken
from app.api.deps import get_current_user
from app.services.google_meet_service import GoogleMeetService
from app.config import settings

router = APIRouter(prefix="/auth/google", tags=["Google OAuth"])

@router.get("/status")
def get_google_auth_status(
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Check if the current recruiter has linked an authorized Google Account."""
    token = db.query(GoogleOAuthToken).filter(GoogleOAuthToken.user_id == user.id).first()
    configured = GoogleMeetService.is_configured()

    if not token:
        return {
            "connected": False,
            "configured": configured,
            "email": None,
            "expiresAt": None
        }

    return {
        "connected": True,
        "configured": configured,
        "email": token.google_email,
        "expiresAt": token.expires_at.isoformat() if token.expires_at else None
    }

@router.get("/authorize")
def get_google_authorize_url(
    user: models.User = Depends(get_current_user)
):
    """Generate the official Google OAuth 2.0 authorization URL."""
    if user.role not in ["ADMIN", "RECRUITER", "HIRING_MANAGER"]:
        raise HTTPException(status_code=403, detail="Only hiring staff can connect Google Meet integration.")

    auth_url = GoogleMeetService.get_authorization_url(user.id)
    return {
        "success": True,
        "authorizationUrl": auth_url
    }

@router.get("/callback")
def google_oauth_callback(
    code: Optional[str] = Query(None),
    state: Optional[str] = Query(None),
    error: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """
    Google OAuth 2.0 callback handler.
    Exchanges code for tokens, saves to PostgreSQL, and notifies the client.
    """
    if error:
        return HTMLResponse(
            content=f"""
            <!DOCTYPE html>
            <html>
            <body style="font-family: sans-serif; text-align: center; padding: 40px; background: #0b0f19; color: #f87171;">
              <h2>Google Authorization Denied</h2>
              <p>{error}</p>
              <button onclick="window.close()" style="margin-top: 20px; padding: 10px 20px; background: #374151; color: white; border: none; border-radius: 8px; cursor: pointer;">Close Window</button>
            </body>
            </html>
            """,
            status_code=400
        )

    if not code or not state:
        raise HTTPException(status_code=400, detail="Missing required code or state parameter.")

    try:
        user_id = int(state)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid state parameter.")

    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    # Exchange code for tokens
    tokens = GoogleMeetService.exchange_code_for_tokens(code)
    access_token = tokens.get("access_token")
    refresh_token = tokens.get("refresh_token")
    expires_in = tokens.get("expires_in", 3600)
    scope = tokens.get("scope", "")

    # Fetch Google account email
    google_email = GoogleMeetService.get_google_user_email(access_token)

    # Save or update GoogleOAuthToken in PostgreSQL
    token_record = db.query(GoogleOAuthToken).filter(GoogleOAuthToken.user_id == user.id).first()
    expires_at = datetime.utcnow() + timedelta(seconds=expires_in)

    if token_record:
        token_record.access_token = access_token
        if refresh_token:
            token_record.refresh_token = refresh_token
        token_record.expires_at = expires_at
        token_record.scope = scope
        if google_email:
            token_record.google_email = google_email
        token_record.updated_at = datetime.utcnow()
    else:
        token_record = GoogleOAuthToken(
            user_id=user.id,
            google_email=google_email,
            access_token=access_token,
            refresh_token=refresh_token,
            expires_at=expires_at,
            scope=scope
        )
        db.add(token_record)

    db.commit()

    # Render postMessage response to close popup and notify React frontend
    return HTMLResponse(content=f"""
    <!DOCTYPE html>
    <html>
    <head>
      <title>Google Account Connected | Uptrix</title>
      <style>
        body {{
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background: #0E1528;
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100vh;
          margin: 0;
          text-align: center;
        }}
        .card {{
          background: #151D33;
          border: 1px solid #233055;
          padding: 32px 40px;
          border-radius: 20px;
          box-shadow: 0 20px 40px rgba(0,0,0,0.5);
          max-width: 360px;
        }}
        .check {{
          width: 50px;
          height: 50px;
          background: rgba(16, 185, 129, 0.2);
          border: 1px solid rgba(16, 185, 129, 0.4);
          color: #10B981;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          margin: 0 auto 16px;
        }}
        h2 {{ margin: 0 0 8px; font-size: 18px; }}
        p {{ font-size: 13px; color: #94A3B8; margin: 0; }}
      </style>
    </head>
    <body>
      <div class="card">
        <div class="check">✓</div>
        <h2>Google Meet Connected!</h2>
        <p>Your Google account has been authorized. This window will close automatically...</p>
      </div>
      <script>
        if (window.opener) {{
          window.opener.postMessage({{ type: 'GOOGLE_OAUTH_SUCCESS', email: '{google_email or ""}' }}, '*');
          setTimeout(function() {{ window.close(); }}, 1200);
        }} else {{
          setTimeout(function() {{ window.location.href = '{settings.FRONTEND_URL}/interviews?google_connected=true'; }}, 1200);
        }}
      </script>
    </body>
    </html>
    """)

@router.delete("/disconnect")
def disconnect_google_oauth(
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Disconnect and delete the recruiter's Google OAuth credentials from PostgreSQL."""
    token = db.query(GoogleOAuthToken).filter(GoogleOAuthToken.user_id == user.id).first()
    if token:
        db.delete(token)
        db.commit()

    return {
        "success": True,
        "message": "Google Account disconnected successfully."
    }
