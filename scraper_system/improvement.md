This is a well-designed architecture. The core loop is solid. Here are my thoughts and improvements:

---

## What's Already Great
- Max 3 actions then re-observe — prevents hallucination chains
- Compact planner packets — token efficient
- Two observation levels (A/B) — smart and cheap
- Explicit `DataLoadPlan` — much better than hidden heuristics

---

## Suggested Improvements

### 1. Add a Vision Layer (Big Speed Win)
Instead of only feeding text/DOM to the planner, add **screenshot-based observation** using a vision model. This lets the planner *see* the page like a human.

```python
# Use GPT-4o or Claude for vision
# Take screenshot → send to LLM → get compact observation back
# Much faster than DOM parsing for button/input detection
```

Best libraries:
- **Playwright** already has `page.screenshot()`
- Send to **Claude claude-sonnet-4-20250514** or **GPT-4o** with vision
- Returns structured observation without DOM parsing at all

---

### 2. Use Playwright's Built-in Waiting Smartly

Instead of fixed `wait_ms`, use smarter waits:

```python
# Instead of:
await page.wait_for_timeout(2000)

# Use:
await page.wait_for_load_state("networkidle")
await page.wait_for_selector(".listing-item", timeout=5000)
```

This alone can **cut loop time by 40-60%** because you're not over-waiting.

---

### 3. Parallel Network Interception

Right now you score network candidates after the fact. Instead, intercept in real time:

```python
async def intercept(route, request):
    if is_api_candidate(request.url):
        # score and store immediately
        await store_candidate(request)
    await route.continue_()

await page.route("**/*", intercept)
```

Libraries:
- Native **Playwright** route interception
- **mitmproxy** if you need deeper inspection

---

### 4. Add a Fast Pre-Planner (Rule-Based)

Before calling the LLM, run a cheap rule-based check:

```python
def fast_plan(observation):
    if observation.blockers:
        if "cookie" in observation.blockers[0]:
            return [click_action("Accept all")]
    if not observation.results_visible:
        if observation.search_inputs:
            return None  # needs LLM
    return None  # fallback to LLM
```

This handles **cookie dialogs, popups, login walls** without burning LLM tokens. Only call the LLM when the fast planner returns `None`.

---

### 5. Cache Planner Decisions

If the page state hash is the same as a previous loop, reuse the last plan:

```python
state_hash = hash(json.dumps(compact_packet, sort_keys=True))
if state_hash in plan_cache:
    return plan_cache[state_hash]
```

Avoids redundant LLM calls on slow pages that haven't changed yet.

---

### 6. Recommended Libraries

| Purpose | Library | Why |
|---|---|---|
| Browser automation | **Playwright** | Already using, best choice |
| LLM calls | **LiteLLM** | Switch between Claude/GPT/Gemini easily |
| Structured LLM output | **Instructor** | Forces valid Pydantic output from LLM |
| Async coordination | **asyncio + anyio** | Non-blocking loops |
| DOM parsing | **selectolax** | 10x faster than BeautifulSoup |
| Network inspection | **mitmproxy** | Deep API payload inspection |
| Caching | **diskcache** | Persist planner decisions across runs |
| Retry logic | **tenacity** | LLM and network retries |

---

### 7. Use `Instructor` for Reliable Planner Output

The biggest source of slowness in LLM agents is **bad JSON output and retries**. Instructor fixes this:

```python
import instructor
from anthropic import Anthropic

client = instructor.from_anthropic(Anthropic())

decision = client.messages.create(
    model="claude-sonnet-4-20250514",
    max_tokens=1000,
    messages=[{"role": "user", "content": compact_packet}],
    response_model=PlannerDecision  # your dataclass
)
# Always returns valid PlannerDecision, no JSON parsing errors
```

This eliminates retry loops from malformed LLM output.

---

### 8. Add a Confidence Score to Actions

Let the planner score its own confidence:

```python
@dataclass
class PlannedAction:
    action_type: str
    target: Optional[ActionTarget] = None
    value: Optional[str] = None
    confidence: float = 1.0  # 0.0 to 1.0
```

If confidence is below 0.6, take a screenshot and use vision to verify before executing. High confidence actions execute immediately.

---

## Revised Loop Architecture

```
observe (compact) 
    ↓
fast rule check → execute if obvious (cookie, popup)
    ↓
LLM planner (compact packet + Instructor)
    ↓
execute 1-3 actions
    ↓
wait_for_load_state (not fixed timeout)
    ↓
observe again
    ↓
repeat
```

---

## Priority Order for Next Steps

1. **Add Instructor** — immediate reliability win, no effort
2. **Replace fixed waits** with `wait_for_load_state` — big speed win
3. **Add fast pre-planner** — saves LLM tokens on obvious actions
4. **Add real-time network interception** — better API detection
5. **Add vision layer** — biggest quality improvement for complex pages

---

The architecture you have is already production-grade thinking. These additions would make it significantly faster and more reliable without changing the core design. Want me to help implement any specific part?