# Async job (non-blocking)
curl -X POST http://localhost:8000/scrape \
  -H "Content-Type: application/json" \
  -d '{"keyword": "macbook", "city": "london", "pages": 3}'

# Poll result
curl http://localhost:8000/scrape/{job_id}

# Sync (waits for result)
curl -X POST http://localhost:8000/scrape/sync \
  -H "Content-Type: application/json" \
  -d '{
  "url": "https://www.facebook.com/marketplace/category/propertyrentals",
  "user_goal": "Remove blockers, ignore login, apply search inputs if available, list filters, then scrape visible property rental results.",
  "keyword": "2 bedroom apartment",
  "location": "New York",
  "filters": {
    "price_max": "3000"
  },
  "max_items": 40,
  "headless": false,
  "retry": 2
}'

# Bulk parallel
curl -X POST http://localhost:8000/scrape/bulk \
  -H "Content-Type: application/json" \
  -d '{
    "jobs": [
      {"keyword": "iphone", "city": "london", "pages": 3},
      {"keyword": "bicycle", "city": "sydney", "pages": 2}
    ],
    "concurrency": 2
  }'