---
name: moltbook
description: Read and write to MoltBook journal/notebook system
homepage: https://github.com/zapabob/clawdbot
metadata:
  {
    "openclaw":
      {
        "emoji": "📓",
        "os": ["darwin", "linux", "win32"],
        "requires": { "env": ["MOLTBOOK_API_URL", "MOLTBOOK_API_KEY"] },
        "install": [],
      },
  }
---

# MoltBook

Use MoltBook API to read and write journal entries, notes, and books.

## Configuration

Set these environment variables:

- `MOLTBOOK_API_URL` - Base URL for MoltBook API (default: http://localhost:3000)
- `MOLTBOOK_API_KEY` - API key for authentication

## Common Commands

Write a journal entry:

```bash
export MOLTBOOK_API_URL="http://localhost:3000"
export MOLTBOOK_API_KEY="your-api-key"
curl -X POST "$MOLTBOOK_API_URL/api/entries" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $MOLTBOOK_API_KEY" \
  -d '{"title": "Daily Note", "content": "Today I learned...", "tags": ["journal"]}'
```

Read entries:

```bash
curl "$MOLTBOOK_API_URL/api/entries?limit=10" \
  -H "Authorization: Bearer $MOLTBOOK_API_KEY"
```

Search entries:

```bash
curl "$MOLTBOOK_API_URL/api/search?q=keyword" \
  -H "Authorization: Bearer $MOLTBOOK_API_KEY"
```

## API Endpoints

- `GET /api/entries` - List entries (query params: `limit`, `offset`, `tag`)
- `POST /api/entries` - Create new entry
- `GET /api/entries/:id` - Get single entry
- `PUT /api/entries/:id` - Update entry
- `DELETE /api/entries/:id` - Delete entry
- `GET /api/search?q=query` - Search entries

## Notes

- All write operations require authentication
- Entries support markdown content
- Tags can be added to organize entries
