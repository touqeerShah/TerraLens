import uuid
from typing import Any, Optional

from fastapi import BackgroundTasks, FastAPI, HTTPException
from pydantic import BaseModel, Field

from scraper import ScrapeRequest as ScraperRequest
from scraper import scrape_many, scrape_site

app = FastAPI(title="Generic Web Scraper API")

# In-memory job store (replace with Redis / DB in production)
jobs_store: dict[str, dict[str, Any]] = {}


class ApiScrapeRequest(BaseModel):
    url: str = Field(..., description="Target page URL")
    user_goal: str = Field(
        ...,
        description="High-level goal for the browsing agent",
        examples=[
            "Remove blockers, ignore login, apply search inputs if available, list filters, then scrape visible rental listings."
        ],
    )
    keyword: Optional[str] = Field(
        default=None,
        description="Optional search keyword to apply if the site has a search input",
    )
    location: Optional[str] = Field(
        default=None,
        description="Optional location input to apply if the site has a location field",
    )
    filters: dict[str, Any] = Field(
        default_factory=dict,
        description="Arbitrary filter values the agent should try to apply",
    )
    max_items: int = Field(default=50, ge=1, le=500)
    headless: bool = Field(default=True)
    proxy_server: Optional[str] = Field(
        default=None,
        description='Optional proxy server, e.g. "http://user:pass@host:port"',
    )
    retry: int = Field(default=2, ge=0, le=10)

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "url": "https://www.facebook.com/marketplace/category/propertyrentals",
                    "user_goal": "Remove blockers, ignore login, apply search inputs if available, list filters, then scrape visible property rental results.",
                    "keyword": "2 bedroom apartment",
                    "location": "New York",
                    "filters": {"price_max": "3000"},
                    "max_items": 40,
                    "headless": False,
                    "retry": 2,
                }
            ]
        }
    }


class ApiBulkScrapeRequest(BaseModel):
    jobs: list[ApiScrapeRequest]
    concurrency: int = Field(default=2, ge=1, le=20)


def to_scraper_request(req: ApiScrapeRequest) -> ScraperRequest:
    proxy = {"server": req.proxy_server} if req.proxy_server else None
    return ScraperRequest(
        url=req.url,
        user_goal=req.user_goal,
        keyword=req.keyword,
        location=req.location,
        filters=req.filters,
        max_items=req.max_items,
        headless=req.headless,
        retry=req.retry,
        proxy=proxy,
    )


@app.get("/")
def root():
    return {"status": "ok", "service": "Generic Web Scraper API"}


@app.post("/scrape")
async def scrape(req: ApiScrapeRequest, background_tasks: BackgroundTasks):
    """
    Start a scrape job in the background and return a job_id to poll later.
    """
    job_id = str(uuid.uuid4())
    jobs_store[job_id] = {
        "status": "running",
        "request": req.model_dump(),
        "result": None,
        "error": None,
    }

    async def run():
        try:
            scraper_req = to_scraper_request(req)
            result = await scrape_site(scraper_req)
            jobs_store[job_id] = {
                "status": "done",
                "request": req.model_dump(),
                "result": result,
                "error": None,
            }
        except Exception as e:
            jobs_store[job_id] = {
                "status": "failed",
                "request": req.model_dump(),
                "result": None,
                "error": str(e),
            }

    background_tasks.add_task(run)
    return {"job_id": job_id, "status": "running"}


@app.get("/scrape/{job_id}")
def get_job(job_id: str):
    """
    Poll job status and retrieve stored result.
    """
    job = jobs_store.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job


@app.post("/scrape/sync")
async def scrape_sync(req: ApiScrapeRequest):
    """
    Run a scrape synchronously and return the result directly.
    Useful for smaller jobs and debugging.
    """
    scraper_req = to_scraper_request(req)
    result = await scrape_site(scraper_req)
    return result


@app.post("/scrape/bulk")
async def scrape_bulk(req: ApiBulkScrapeRequest, background_tasks: BackgroundTasks):
    """
    Run multiple scrape jobs in parallel in the background.
    """
    job_id = str(uuid.uuid4())
    jobs_store[job_id] = {
        "status": "running",
        "request": req.model_dump(),
        "result": None,
        "error": None,
    }

    async def run():
        try:
            scraper_requests = [to_scraper_request(job) for job in req.jobs]
            results = await scrape_many(scraper_requests, concurrency=req.concurrency)

            jobs_store[job_id] = {
                "status": "done",
                "request": req.model_dump(),
                "result": results,
                "error": None,
            }
        except Exception as e:
            jobs_store[job_id] = {
                "status": "failed",
                "request": req.model_dump(),
                "result": None,
                "error": str(e),
            }

    background_tasks.add_task(run)
    return {"job_id": job_id, "status": "running"}


@app.get("/jobs")
def list_jobs():
    """
    Small helper endpoint to inspect all in-memory jobs.
    """
    return {
        "count": len(jobs_store),
        "jobs": jobs_store,
    }