# SiamDive API Manual

Version: 1.3 — Updated: 2026-04-05

## Authentication

All endpoints require one of:
- **Session cookie** (backoffice users logged in via NextAuth)
- **API Key header**: `X-API-Key: <key>`

API Keys are created in the backoffice under Settings → API Keys. Each key has granular permissions.

---

## Base URL

```
https://siamdive.com/api
```

---

## Permission Scopes

| Scope | Description |
|---|---|
| `daytrip.read/write/delete` | Day trip boats |
| `snorkeling.read/write/delete` | Snorkeling boats |
| `land-tour.read/write/delete` | Land tour boats |
| `liveaboard.read/write/delete` | Liveaboard boats |
| `dive-resort.read/write/delete` | Dive resort boats |
| `freedive.read/write/delete` | Freediving boats |
| `scuba-courses.read/write/delete` | SCUBA courses |
| `freedive-courses.read/write/delete` | Freedive courses |
| `companies.read/write/delete` | Boat companies |
| `service-areas.read/write/delete` | Dive destinations |
| `blogs.read/write/delete` | Blog posts |
| `upload.write` | File upload |
| `display-rows.read/write/delete` | Homepage display rows |
| `settings.read/write` | Site SEO settings |
| `admins.read/write/delete` | Admin accounts |
| `api-keys.read/write/delete` | API Keys |

---

## Important Notes

- All **array fields** (`translations`, `videos`, `covers`, etc.) default to `[]` if omitted — safe to send partial bodies.
- `translations` items **must include a valid `lang`** field (`en|th|cn|de|fr|ru|ko|ja`); items without `lang` are silently skipped.
- **PUT** requests return `404` if the record no longer exists — guard against stale IDs.
- **Blog slug** is auto-suffixed with lang code (e.g. `"my-post"` → `"my-post-en"`, `"my-post-th"`) — you may send the same base slug for all languages.
- **status** is case-insensitive: `"PUBLISHED"` and `"published"` both work.
- Supported languages: `en` `th` `cn` `de` `fr` `ru` `ko` `ja`

---

## Boats / Trips

### GET /boats
List boats. Filter by type or company.

**Query params:**
- `type` — `DAYTRIP | SNORKELING | LAND_TOUR | LIVEABOARD | DIVE_RESORT | FREEDIVE | SCUBA_COURSES | FREEDIVE_COURSES`
- `companyId` — filter by company ID

**Permission:** `<tripType>.read`

---

### GET /boats/{id}
Get full boat details including schedules, packages, options, service areas.

**Permission:** `<tripType>.read`

---

### POST /boats
Create a new boat/tour.

**Permission:** `<tripType>.write`

```json
{
  "name": "string",
  "type": "DAYTRIP",
  "companyId": "string?",
  "capacity": 30,
  "photos": ["url"],
  "covers": ["url"],
  "status": "DRAFT",
  "featured": false,
  "serviceAreaIds": ["id"],
  "translations": [
    {
      "lang": "en",
      "title": "string",
      "slug": "string",
      "excerpt": "string",
      "content": "string",
      "keywords": ["keyword"]
    }
  ],
  "priceTiers": [
    {
      "tier": "ADULT",
      "regularPrice": 2500,
      "salePrice": null,
      "agentPrice": null,
      "costPrice": null
    }
  ]
}
```

---

### PUT /boats/{id}
Full update — replaces translations, videos, priceTiers, serviceAreas.

**Permission:** `<tripType>.write`

---

### DELETE /boats/{id}
Delete boat and all related data.

**Permission:** `<tripType>.delete`

---

## Boat Options

### GET /boats/{id}/options
List add-on options for a boat.

### POST /boats/{id}/options
```json
{
  "price": 500,
  "order": 1,
  "translations": [
    { "lang": "en", "name": "Equipment rental", "description": "Full scuba gear" }
  ]
}
```

### PUT /boats/{id}/options/{optionId}
Update a boat option.

### DELETE /boats/{id}/options/{optionId}
Delete a boat option.

---

## Schedules

### GET /schedules
List schedules. Filter by `?boatId=`.

### GET /schedules/{id}
Full schedule with boat info, packages, translations.

### POST /schedules
**Permission:** `<tripType>.write`

```json
{
  "boatId": "string",
  "dateType": "single",
  "departureDate": "2025-06-01",
  "returnDate": "2025-06-01",
  "weekDays": [],
  "status": "OPEN",
  "season": "HIGH_SEASON",
  "translations": [
    {
      "lang": "en",
      "title": "string",
      "slug": "string",
      "excerpt": "string",
      "content": "string",
      "itinerary": "string",
      "keywords": []
    }
  ],
  "packages": [
    {
      "packageId": "string",
      "availableSeats": null,
      "isFull": false
    }
  ]
}
```

`dateType`: `single | recurring`  
`season`: `HIGH_SEASON | PEAK_SEASON | GREEN_SEASON`  
`status`: `OPEN | FULL | DRAFT | CANCELLED | COMPLETED`

### PUT /schedules/{id}
Full update (replaces translations and packages).

### DELETE /schedules/{id}
Delete schedule.

---

## Packages

### GET /packages
List packages. Filter by `?boatId=`.

### GET /packages/{id}
Full package with price tiers and season periods.

### POST /packages
**Permission:** `<tripType>.write`

```json
{
  "boatId": "string",
  "name": "Diver Package",
  "totalSeats": null,
  "status": "DRAFT",
  "translations": [
    {
      "lang": "en",
      "title": "string",
      "slug": "string",
      "excerpt": "string",
      "content": "string",
      "itinerary": "string",
      "route": "string",
      "keywords": []
    }
  ],
  "priceTiers": [
    {
      "tier": "DIVER",
      "regularPrice": 2500,
      "salePrice": null,
      "agentPrice": null,
      "costPrice": null
    }
  ],
  "seasonPeriods": [
    {
      "season": "HIGH_SEASON",
      "startDate": "2025-11-01",
      "endDate": "2025-04-30"
    }
  ]
}
```

`tier`: `DIVER | NON_DIVER | ADULT | CHILD`  
`season`: `HIGH_SEASON | PEAK_SEASON | GREEN_SEASON | ALL_SEASON`

### PUT /packages/{id}
Full update (replaces translations, priceTiers, seasonPeriods).

### DELETE /packages/{id}
Delete package.

---

## Schools

### GET /schools
List dive schools.

### GET /schools/{id}
School details with all courses.

### POST /schools
**Permission:** `scuba-courses.write` or `freedive-courses.write`

```json
{
  "certBody": "PADI",
  "logo": "url?",
  "phone": "string?",
  "email": "string?",
  "lineId": "string?",
  "website": "string?",
  "serviceArea": "string?",
  "keywords": [],
  "status": "ACTIVE",
  "translations": [
    { "lang": "en", "name": "string", "description": "string", "information": "string" }
  ]
}
```

`certBody`: `PADI | SSI | NAUI | CMAS | SDI | TDI`

### PUT /schools/{id}
Full update (replaces translations).

### DELETE /schools/{id}
Delete school and all courses.

---

## Courses

### GET /courses
List courses. Filter by `?schoolId=`.

### GET /courses/{id}
Full course with school info, translations, videos, price.

### POST /courses
**Permission:** `scuba-courses.write` or `freedive-courses.write`

```json
{
  "schoolId": "string",
  "level": "string?",
  "duration": 3,
  "status": "DRAFT",
  "covers": [],
  "translations": [
    {
      "lang": "en",
      "title": "string",
      "slug": "string",
      "excerpt": "string",
      "content": "string",
      "keywords": []
    }
  ],
  "videos": [
    { "url": "string", "name": "string" }
  ],
  "price": {
    "regularPrice": 15000,
    "salePrice": null,
    "agentPrice": null,
    "costPrice": null
  }
}
```

### PUT /courses/{id}
Full update (replaces translations, videos, price). Returns 404 if not found.

### DELETE /courses/{id}
Delete course.

---

## Companies

### GET /companies
List all boat companies.

### GET /companies/{id}
Company details with translations and boats.

### POST /companies
**Permission:** `companies.write`

```json
{
  "logo": "url?",
  "phone": "string?",
  "email": "string?",
  "lineId": "string?",
  "status": "ACTIVE",
  "translations": [
    { "lang": "en", "name": "string", "description": "string" }
  ]
}
```

### PUT /companies/{id}
Full update (replaces translations).

### DELETE /companies/{id}
Delete company (boats become company-less).

---

## Service Areas

### GET /service-areas
List all dive destinations.

### GET /service-areas/{id}
Service area with translations.

### POST /service-areas
**Permission:** `service-areas.write`

```json
{
  "translations": [
    { "lang": "en", "name": "Koh Tao" }
  ]
}
```

### PUT /service-areas/{id}
Full update.

### DELETE /service-areas/{id}
Delete service area.

---

## Blogs

### GET /blogs
List all blog posts with translations and videos.

**Permission:** `blogs.read`

### GET /blogs/{id}
Single blog with translations and videos.

### POST /blogs
**Permission:** `blogs.write`

```json
{
  "status": "DRAFT",
  "covers": ["url"],
  "translations": [
    {
      "lang": "en",
      "title": "string",
      "slug": "string",
      "excerpt": "string",
      "content": "<p>HTML content</p>",
      "keywords": ["keyword"],
      "ogTitle": "string?",
      "ogDescription": "string?",
      "ogImage": "url?"
    }
  ],
  "videos": [
    { "url": "string", "name": "string" }
  ]
}
```

**Rules:**
- `status`: `"published"` → `PUBLISHED`, anything else → `DRAFT`
- `videos` defaults to `[]` if omitted
- `translations` items without a valid `lang` are skipped

### PUT /blogs/{id}
Full update — replaces all translations and videos.

**Returns 404** if blog not found.

### DELETE /blogs/{id}
Delete blog post.

---

## Upload

### POST /upload
Upload an image. Returns public URL.

**Permission:** `upload.write`  
**Content-Type:** `multipart/form-data`

```
file: <image file>  # jpg, png, webp, gif
```

**Response:**
```json
{ "url": "https://siamdive.com/uploads/abc123.jpg" }
```

---

## Display Rows

### GET /display-rows
All homepage display rows with items and translations.

**Permission:** `display-rows.read`

### POST /display-rows
**Permission:** `display-rows.write`

```json
{
  "topic": "internal name",
  "layout": "FULL",
  "itemType": "DAYTRIP",
  "active": true,
  "order": 1,
  "maxItems": null,
  "translations": [
    { "lang": "en", "title": "Featured Trips", "subtitle": "Explore Thailand" }
  ],
  "items": [
    { "refId": "schedule_id", "refType": "SCHEDULE", "order": 0 }
  ]
}
```

`layout`: `FULL | VERTICAL | HORIZONTAL`  
`itemType`: `DAYTRIP | SNORKELING | LAND_TOUR | LIVEABOARD | DIVE_RESORT | FREEDIVE | SCUBA_COURSES | FREEDIVE_COURSES | BLOG`  
`refType`: `SCHEDULE | PACKAGE | BLOG`

### PUT /display-rows/{id}
Full update (replaces translations and items).

### PATCH /display-rows/{id}
Partial update.

```json
{ "active": true, "order": 2 }
```

### DELETE /display-rows/{id}
Delete display row.

---

## Site SEO

### GET /site-seo
SEO settings for all languages.

**Permission:** `settings.read`

### PUT /site-seo/{lang}
Upsert SEO for a language.

**Permission:** `settings.write`

```json
{
  "title": "SiamDive — Dive Trips Thailand",
  "description": "Book scuba diving day trips and liveaboards in Thailand",
  "keywords": ["scuba diving thailand", "koh tao"],
  "ogTitle": "SiamDive — Dive Trips Thailand",
  "ogDescription": "Book scuba diving day trips and liveaboards in Thailand",
  "ogImage": "https://siamdive.com/uploads/og-home.jpg"
}
```

---

## Admins

### GET /admins
List all admin accounts. **Permission:** `admins.read`

### GET /admins/{id}
Single admin account.

### POST /admins
**Permission:** `admins.write`

```json
{
  "email": "admin@example.com",
  "password": "string",
  "name": "string",
  "role": "ADMIN",
  "permissions": []
}
```

`role`: `SUPER_ADMIN | ADMIN | EDITOR`  
`permissions`: granular permission list for `EDITOR` role

### PUT /admins/{id}
Partial update (only provided fields updated).

```json
{
  "name": "string?",
  "email": "string?",
  "password": "string?",
  "role": "string?",
  "permissions": ["string"]?,
  "active": true
}
```

### DELETE /admins/{id}
Delete admin account.

---

## API Keys

### GET /api-keys
List all API keys (prefix only, never full key).

**Permission:** `api-keys.read`

### POST /api-keys
**Permission:** `api-keys.write`

```json
{
  "name": "string",
  "permissions": ["blogs.read", "blogs.write"],
  "expiresAt": "2026-12-31"
}
```

**Response:** includes `key` — full key shown **once only**, not stored.

### PATCH /api-keys/{id}
Update name, permissions, or expiry.

### DELETE /api-keys/{id}
Revoke and delete API key.

---

## Skill YAML

Download the OpenClaw/Claude agent skill definition:

```
GET /api/skill.yaml
```

Returns `siamdive-skill.yaml` ready to use with Claude agents or compatible AI tools.
