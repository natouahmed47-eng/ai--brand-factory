"""
Paddle Payment Integration - Sandbox
======================================
Endpoints helpers for subscription payments.

- create_checkout_session: creates a Paddle transaction, returns transaction ID
- verify_webhook_signature: validates incoming Paddle webhook
- process_webhook_event: updates workspace subscription in DB

Uses `requests` only (no SDK).
"""

import os
import hmac
import hashlib
import json
from datetime import datetime
from typing import Optional

import requests
from fastapi import HTTPException
from sqlalchemy import text


# ============================================
# CONFIG
# ============================================
PADDLE_ENV = os.getenv("PADDLE_ENVIRONMENT", "sandbox")
PADDLE_API_KEY = os.getenv("PADDLE_API_KEY", "")
PADDLE_WEBHOOK_SECRET = os.getenv("PADDLE_WEBHOOK_SECRET", "")
PADDLE_PRICE_ID_PRO = os.getenv("PADDLE_PRICE_ID_PRO", "")
PADDLE_PRICE_ID_BUSINESS = os.getenv("PADDLE_PRICE_ID_BUSINESS", "")

PADDLE_API_BASE = (
    "https://sandbox-api.paddle.com"
    if PADDLE_ENV == "sandbox"
    else "https://api.paddle.com"
)


# ============================================
# HELPERS
# ============================================
def _headers() -> dict:
    return {
        "Authorization": "Bearer " + PADDLE_API_KEY,
        "Content-Type": "application/json",
    }


def _get_price_id(plan: str) -> str:
    plan = (plan or "").lower()
    if plan == "pro":
        return PADDLE_PRICE_ID_PRO
    if plan == "business":
        return PADDLE_PRICE_ID_BUSINESS
    raise HTTPException(status_code=400, detail="Invalid plan")


# ============================================
# 1. CREATE CHECKOUT SESSION
# ============================================
def create_checkout_session(
    db,
    workspace_id: str,
    plan: str,
    customer_email: str,
) -> dict:
    """
    Creates a Paddle transaction and returns:
    { "transaction_id": "...", "checkout_url": "..." }
    """
    price_id = _get_price_id(plan)
    if not price_id:
        raise HTTPException(status_code=500, detail="Price ID not configured")

    # Look up existing paddle customer (optional)
    row = db.execute(
        text("SELECT paddle_customer_id FROM workspaces WHERE id = :wid"),
        {"wid": workspace_id},
    ).fetchone()
    paddle_customer_id = row[0] if row else None

    payload = {
        "items": [{"price_id": price_id, "quantity": 1}],
        "custom_data": {
            "workspace_id": str(workspace_id),
            "plan": plan,
        },
    }
    if paddle_customer_id:
        payload["customer_id"] = paddle_customer_id
    else:
        payload["customer"] = {"email": customer_email}

    try:
        res = requests.post(
            PADDLE_API_BASE + "/transactions",
            headers=_headers(),
            json=payload,
            timeout=20,
        )
    except requests.RequestException as e:
        raise HTTPException(status_code=502, detail="Paddle unreachable: " + str(e))

    if res.status_code >= 400:
        raise HTTPException(
            status_code=502,
            detail="Paddle error: " + res.text[:300],
        )

    data = res.json().get("data", {})
    return {
        "transaction_id": data.get("id"),
        "checkout_url": (data.get("checkout") or {}).get("url"),
    }


# ============================================
# 2. VERIFY WEBHOOK SIGNATURE
# ============================================
def verify_webhook_signature(raw_body: bytes, signature_header: str) -> bool:
    """
    Paddle-Signature header format:
        ts=1698888888;h1=abcdef...
    Signed payload: f"{ts}:{raw_body}"
    Algorithm: HMAC-SHA256 hex.
    """
    if not signature_header or not PADDLE_WEBHOOK_SECRET:
        return False

    try:
        parts = dict(
            p.split("=", 1) for p in signature_header.split(";") if "=" in p
        )
        ts = parts.get("ts", "")
        h1 = parts.get("h1", "")
    except Exception:
        return False

    if not ts or not h1:
        return False

    signed = (ts + ":").encode("utf-8") + raw_body
    expected = hmac.new(
        PADDLE_WEBHOOK_SECRET.encode("utf-8"),
        signed,
        hashlib.sha256,
    ).hexdigest()

    return hmac.compare_digest(expected, h1)


# ============================================
# 3. PROCESS WEBHOOK EVENT
# ============================================
def _to_naive_dt(iso_str: Optional[str]) -> Optional[datetime]:
    if not iso_str:
        return None
    try:
        s = iso_str.replace("Z", "+00:00")
        dt = datetime.fromisoformat(s)
        return dt.replace(tzinfo=None)
    except Exception:
        return None


def process_webhook_event(db, event: dict) -> dict:
    """
    Handles Paddle webhook events and updates workspace row.
    Returns { "handled": bool, "event_type": str }
    """
    event_type = event.get("event_type", "")
    data = event.get("data", {}) or {}

    # Extract workspace_id from custom_data (set at checkout)
    custom = data.get("custom_data") or {}
    workspace_id = custom.get("workspace_id")

    # For subscription events, workspace may be in data.custom_data directly
    if not workspace_id:
        sub_custom = (data.get("custom_data") or {})
        workspace_id = sub_custom.get("workspace_id")

    if not workspace_id:
        return {"handled": False, "event_type": event_type, "reason": "no workspace_id"}

    # Common fields
    paddle_customer_id = data.get("customer_id") or (data.get("customer") or {}).get("id")
    paddle_subscription_id = data.get("subscription_id") or data.get("id")
    status = data.get("status")

    # Map Paddle statuses -> internal statuses
    status_map = {
        "active": "active",
        "trialing": "active",
        "past_due": "past_due",
        "canceled": "canceled",
        "paused": "canceled",
    }
    internal_status = status_map.get(status, status)

    # Period end
    period = data.get("current_billing_period") or {}
    ends_at = _to_naive_dt(period.get("ends_at"))

    # Canceled events: use canceled_at
    if event_type == "subscription.canceled":
        internal_status = "canceled"
        ends_at = _to_naive_dt(data.get("canceled_at")) or ends_at

    # Update workspace
    try:
        db.execute(
            text(
                """
                UPDATE workspaces
                SET paddle_customer_id = COALESCE(:cid, paddle_customer_id),
                    paddle_subscription_id = COALESCE(:sid, paddle_subscription_id),
                    subscription_status = :status,
                    subscription_ends_at = :ends_at,
                    plan = CASE
                        WHEN :status = 'active' AND :plan <> '' THEN :plan
                        WHEN :status = 'canceled' THEN 'Free'
                        ELSE plan
                    END
                WHERE id = :wid
                """
            ),
            {
                "cid": paddle_customer_id,
                "sid": paddle_subscription_id,
                "status": internal_status,
                "ends_at": ends_at,
                "plan": (custom.get("plan") or "").lower(),
                "wid": workspace_id,
            },
        )
        db.commit()
    except Exception as e:
        db.rollback()
        return {"handled": False, "event_type": event_type, "reason": str(e)}

    return {"handled": True, "event_type": event_type}


# ============================================
# 4. GET SUBSCRIPTION STATUS
# ============================================
def get_subscription(db, workspace_id: str) -> dict:
    row = db.execute(
        text(
            """
            SELECT plan, subscription_status, subscription_ends_at,
                   paddle_customer_id, paddle_subscription_id
            FROM workspaces WHERE id = :wid
            """
        ),
        {"wid": workspace_id},
    ).fetchone()

    if not row:
        raise HTTPException(status_code=404, detail="Workspace not found")

    return {
        "plan": row[0],
        "status": row[1] or "none",
        "ends_at": row[2].isoformat() if row[2] else None,
        "paddle_customer_id": row[3],
        "paddle_subscription_id": row[4],
    }
