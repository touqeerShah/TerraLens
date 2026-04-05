from __future__ import annotations

from models.observations import PageObservation


COOKIE_HINTS = [
    "accept cookies",
    "accept all",
    "cookie policy",
    "allow cookies",
    "consent",
]

LOGIN_HINTS = [
    "log in",
    "login",
    "sign in",
    "signin",
]

SUBSCRIPTION_HINTS = [
    "subscribe",
    "join newsletter",
    "enter your email",
    "start free trial",
]

LOCATION_HINTS = [
    "choose your region",
    "select location",
    "delivery location",
    "country/region",
]


def detect_blockers(observation: PageObservation) -> list[dict]:
    blockers: list[dict] = []

    body_lower = observation.body_text.lower()

    if any(h in body_lower for h in COOKIE_HINTS):
        blockers.append(
            {
                "type": "cookie_consent",
                "severity": "medium",
                "reason": "Cookie or consent text detected in body.",
            }
        )

    if any(h in body_lower for h in LOGIN_HINTS):
        blockers.append(
            {
                "type": "login_gate",
                "severity": "high",
                "reason": "Login-related text detected.",
            }
        )

    if any(h in body_lower for h in SUBSCRIPTION_HINTS):
        blockers.append(
            {
                "type": "subscription_modal",
                "severity": "medium",
                "reason": "Subscription or newsletter prompt detected.",
            }
        )

    if any(h in body_lower for h in LOCATION_HINTS):
        blockers.append(
            {
                "type": "location_prompt",
                "severity": "low",
                "reason": "Location or region prompt detected.",
            }
        )

    for dialog in observation.dialogs:
        text = (dialog.get("text") or "").lower()

        if any(h in text for h in COOKIE_HINTS):
            blockers.append(
                {
                    "type": "cookie_dialog",
                    "severity": "medium",
                    "reason": "Cookie dialog text detected inside modal/dialog.",
                    "dialog": dialog,
                }
            )

        if any(h in text for h in LOGIN_HINTS):
            blockers.append(
                {
                    "type": "login_dialog",
                    "severity": "high",
                    "reason": "Login dialog detected.",
                    "dialog": dialog,
                }
            )

    return blockers
