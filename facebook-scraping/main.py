import asyncio
import json
import csv
from scraper import scrape_marketplace, scrape_many


def save_results(results: list, keyword: str, city: str):
    if not results:
        print("No results to save.")
        return

    slug = f"{keyword}_{city}".replace(" ", "_")

    with open(f"{slug}.json", "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2, ensure_ascii=False)
    print(f"Saved {slug}.json")

    fields = [
        "id",
        "title",
        "price",
        "currency",
        "location",
        "condition",
        "category",
        "url",
        "posted_at",
        "scraped_at",
    ]
    with open(f"{slug}.csv", "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fields, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(results)
    print(f"Saved {slug}.csv")

    print(f"\n--- Preview (first 3) ---")
    for item in results[:3]:
        print(
            f"  {item['title']} | {item['price']} {item['currency']} | {item['location']}"
        )


async def single_job():
    results = await scrape_marketplace(
        keyword="macbook",
        city="london",
        pages=3,  # scroll through 3 virtual pages
        items_per_page=20,  # ~20 listings per page
        headless=True,
        retry=2,
        proxy=None,  # {"server": "http://user:pass@host:port"}
    )
    save_results(results, "macbook", "london")


async def parallel_jobs():
    jobs = [
        {"keyword": "iphone", "city": "london", "pages": 3},
        {"keyword": "macbook", "city": "newyork", "pages": 2},
        {"keyword": "bicycle", "city": "sydney", "pages": 2},
    ]
    all_results = await scrape_many(jobs, concurrency=2)

    for key, results in all_results.items():
        keyword, city = key.split("::")
        save_results(results, keyword, city)


if __name__ == "__main__":
    # Choose one:
    asyncio.run(single_job())
    # asyncio.run(parallel_jobs())
