from __future__ import annotations

from models.plans import PlannerDecision


DANGEROUS_TEXT_HINTS = [
    "log in",
    "login",
    "sign in",
    "signin",
    "sign up",
    "signup",
    "register",
    "create account",
    "checkout",
    "buy now",
    "purchase",
    "pay now",
    "subscribe",
    "start trial",
    "join now",
    "continue with google",
    "continue with facebook",
]

SAFE_ACTION_TYPES = {
    "wait",
    "click",
    "fill_search",
    "select_filter",
    "click_pagination",
}


def normalize_text(value: str | None) -> str:
    return (value or "").strip().lower()


def target_text(plan: PlannerDecision) -> str:
    if not plan.target:
        return ""
    return " ".join(
        filter(
            None,
            [
                normalize_text(plan.target.text),
                normalize_text(plan.target.label),
                normalize_text(plan.target.placeholder),
                normalize_text(plan.target.css),
            ],
        )
    )


def is_action_type_allowed(plan: PlannerDecision) -> bool:
    return plan.action_type in SAFE_ACTION_TYPES


def is_target_obviously_dangerous(plan: PlannerDecision) -> bool:
    text = target_text(plan)
    if not text:
        return False
    return any(hint in text for hint in DANGEROUS_TEXT_HINTS)


def is_safe_action(plan: PlannerDecision) -> tuple[bool, str | None]:
    if not is_action_type_allowed(plan):
        return False, f"Unsupported or unsafe action type: {plan.action_type}"

    if is_target_obviously_dangerous(plan):
        return False, "Target appears related to login, payment, signup, or subscription flow."

    return True, None