import { NextResponse } from "next/server";

const SKILL_YAML = `# SiamDive API Skill — for Claude / OpenClaw agents
# Download this file and place it in your agent's skill directory.
# Usage: give your agent an API Key from the SiamDive backoffice.

name: siamdive-api
version: "1.3"
description: |
  SiamDive REST API skill for managing a scuba diving trip booking platform.
  Covers dive trips, schedules, packages, courses, blogs, companies, and system settings.

notes:
  - All array fields (translations, videos, covers, etc.) default to [] if omitted — safe to send partial bodies.
  - translations items must include a valid "lang" field (en|th|cn|de|fr|ru|ko|ja); entries without lang are silently skipped.
  - PUT requests on /blogs/{id} and /courses/{id} return 404 if the record no longer exists (guard against stale IDs).
  - Blog slug is automatically suffixed with the lang code (e.g. "my-post-en", "my-post-th") to enforce uniqueness — you may send the same base slug for all languages.
  - status field is case-insensitive: "PUBLISHED" and "published" both work.

authentication:
  type: header
  key: X-API-Key
  value: "{{SIAMDIVE_API_KEY}}"  # replace with your actual API Key

base_url: "https://siamdive.com/api"

# ── Permission scopes ───────────────────────────────────────────────────────────
# Your API Key must have the corresponding permission(s) for each action.
# Format: <resource>.<action>  e.g. "daytrip.read", "blogs.write"
#
# Resources:
#   daytrip | snorkeling | land-tour | liveaboard | dive-resort | freedive
#   scuba-courses | freedive-courses
#   companies | service-areas
#   blogs | upload
#   display-rows | admins | api-keys

# ── Tools / Actions ─────────────────────────────────────────────────────────────

tools:

  # ── Boats / Trips ───────────────────────────────────────────────────────────

  - name: list_boats
    description: List boats/tours. Filter by type or company.
    permission: "<tripType>.read"
    method: GET
    path: /boats
    params:
      type:
        type: string
        enum: [DAYTRIP, SNORKELING, LAND_TOUR, LIVEABOARD, DIVE_RESORT, FREEDIVE, SCUBA_COURSES, FREEDIVE_COURSES]
        description: Filter by boat type
      companyId:
        type: string
        description: Filter by company ID

  - name: get_boat
    description: Get full details of a specific boat including schedules, packages, options and service areas.
    permission: "<tripType>.read"
    method: GET
    path: /boats/{id}

  - name: create_boat
    description: Create a new boat/tour listing.
    permission: "<tripType>.write"
    method: POST
    path: /boats
    body:
      name: string          # internal name
      type: string          # DAYTRIP | SNORKELING | LAND_TOUR | LIVEABOARD | DIVE_RESORT | FREEDIVE | SCUBA_COURSES | FREEDIVE_COURSES
      companyId: string?
      capacity: number?
      photos: string[]      # boat photos
      covers: string[]      # listing cover images
      status: string        # DRAFT | PUBLISHED
      featured: boolean?
      serviceAreaIds: string[]?
      translations:
        - lang: string      # en | th | cn | de | fr | ru | ko | ja
          title: string
          slug: string
          excerpt: string
          content: string
          keywords: string[]
      priceTiers:
        - tier: string      # ADULT | CHILD | DIVER | NON_DIVER
          regularPrice: number
          salePrice: number?
          agentPrice: number?
          costPrice: number?

  - name: update_boat
    description: Full update of a boat (replaces translations, videos, priceTiers, serviceAreas).
    permission: "<tripType>.write"
    method: PUT
    path: /boats/{id}

  - name: delete_boat
    description: Permanently delete a boat and all related data.
    permission: "<tripType>.delete"
    method: DELETE
    path: /boats/{id}

  # ── Boat Options ────────────────────────────────────────────────────────────

  - name: list_boat_options
    description: List add-on options for a boat.
    permission: "<tripType>.read"
    method: GET
    path: /boats/{id}/options

  - name: create_boat_option
    description: Add a new option/add-on to a boat.
    permission: "<tripType>.write"
    method: POST
    path: /boats/{id}/options
    body:
      price: number
      order: number?
      translations:
        - lang: string
          name: string
          description: string

  - name: update_boat_option
    description: Update a boat option.
    permission: "<tripType>.write"
    method: PUT
    path: /boats/{id}/options/{optionId}

  - name: delete_boat_option
    description: Delete a boat option.
    permission: "<tripType>.delete"
    method: DELETE
    path: /boats/{id}/options/{optionId}

  # ── Schedules ──────────────────────────────────────────────────────────────

  - name: list_schedules
    description: List schedules. Filter by boat.
    permission: "<tripType>.read"
    method: GET
    path: /schedules
    params:
      boatId:
        type: string
        description: Filter schedules by boat ID

  - name: get_schedule
    description: Get full schedule details with boat info, packages, and translations.
    permission: "<tripType>.read"
    method: GET
    path: /schedules/{id}

  - name: create_schedule
    description: Create a new schedule for a boat.
    permission: "<tripType>.write"
    method: POST
    path: /schedules
    body:
      boatId: string
      dateType: string      # single | recurring
      departureDate: string? # ISO date e.g. "2025-06-01"
      returnDate: string?
      weekDays: string[]    # ["MON","WED"] for recurring schedules
      totalSeats: number?
      status: string        # OPEN | FULL | DRAFT | CANCELLED | COMPLETED
      season: string?       # HIGH_SEASON | PEAK_SEASON | GREEN_SEASON
      translations:
        - lang: string
          title: string
          slug: string
          excerpt: string
          content: string
          itinerary: string
          keywords: string[]
      packages:
        - packageId: string
          availableSeats: number?  # null = unlimited
          isFull: boolean?         # true = package is fully booked

  - name: update_schedule
    description: Full update of a schedule (replaces translations and packages).
    permission: "<tripType>.write"
    method: PUT
    path: /schedules/{id}

  - name: delete_schedule
    description: Delete a schedule.
    permission: "<tripType>.delete"
    method: DELETE
    path: /schedules/{id}

  # ── Packages ───────────────────────────────────────────────────────────────

  - name: list_packages
    description: List packages. Filter by boat.
    permission: "<tripType>.read"
    method: GET
    path: /packages
    params:
      boatId:
        type: string

  - name: get_package
    description: Get full package details with boat info, price tiers, and season periods.
    permission: "<tripType>.read"
    method: GET
    path: /packages/{id}

  - name: create_package
    description: Create a new package for a boat.
    permission: "<tripType>.write"
    method: POST
    path: /packages
    body:
      boatId: string
      name: string          # internal name
      totalSeats: number?
      status: string        # DRAFT | PUBLISHED
      translations:
        - lang: string
          title: string
          slug: string
          excerpt: string
          content: string
          itinerary: string
          route: string
          keywords: string[]
      priceTiers:
        - tier: string      # DIVER | NON_DIVER | ADULT | CHILD
          regularPrice: number
          salePrice: number?
          agentPrice: number?
          costPrice: number?
      seasonPeriods:
        - season: string    # HIGH_SEASON | PEAK_SEASON | GREEN_SEASON | ALL_SEASON
          startDate: string # ISO date
          endDate: string

  - name: update_package
    description: Full update of a package (replaces translations, priceTiers, seasonPeriods).
    permission: "<tripType>.write"
    method: PUT
    path: /packages/{id}

  - name: delete_package
    description: Delete a package.
    permission: "<tripType>.delete"
    method: DELETE
    path: /packages/{id}

  # ── Schools ────────────────────────────────────────────────────────────────

  - name: list_schools
    description: List dive schools / dive centers.
    permission: "scuba-courses.read or freedive-courses.read"
    method: GET
    path: /schools

  - name: get_school
    description: Get school details including all courses.
    permission: "scuba-courses.read or freedive-courses.read"
    method: GET
    path: /schools/{id}

  - name: create_school
    description: Create a new dive school.
    permission: "scuba-courses.write or freedive-courses.write"
    method: POST
    path: /schools
    body:
      certBody: string      # PADI | SSI | NAUI | CMAS | SDI | TDI
      logo: string?
      phone: string?
      email: string?
      lineId: string?
      website: string?
      serviceArea: string?
      keywords: string[]?
      status: string        # ACTIVE | INACTIVE
      translations:
        - lang: string
          name: string
          description: string
          information: string

  - name: update_school
    description: Full update of a school (replaces translations).
    permission: "scuba-courses.write or freedive-courses.write"
    method: PUT
    path: /schools/{id}

  - name: delete_school
    description: Delete a school and all its courses.
    permission: "scuba-courses.delete or freedive-courses.delete"
    method: DELETE
    path: /schools/{id}

  # ── Courses ────────────────────────────────────────────────────────────────

  - name: list_courses
    description: List courses. Filter by school.
    permission: "scuba-courses.read or freedive-courses.read"
    method: GET
    path: /courses
    params:
      schoolId:
        type: string

  - name: get_course
    description: Get full course details with school info, translations, videos, and price.
    permission: "scuba-courses.read or freedive-courses.read"
    method: GET
    path: /courses/{id}

  - name: create_course
    description: Create a new dive course.
    permission: "scuba-courses.write or freedive-courses.write"
    method: POST
    path: /courses
    body:
      schoolId: string
      level: string?
      duration: number?     # days
      status: string        # DRAFT | PUBLISHED
      covers: string[]
      translations:
        - lang: string
          title: string
          slug: string
          excerpt: string
          content: string
          keywords: string[]
      price:
        regularPrice: number
        salePrice: number?
        agentPrice: number?
        costPrice: number?

  - name: update_course
    description: Full update of a course (replaces translations, videos, price).
    permission: "scuba-courses.write or freedive-courses.write"
    method: PUT
    path: /courses/{id}

  - name: delete_course
    description: Delete a course.
    permission: "scuba-courses.delete or freedive-courses.delete"
    method: DELETE
    path: /courses/{id}

  # ── Companies ──────────────────────────────────────────────────────────────

  - name: list_companies
    description: List all boat companies.
    permission: "companies.read"
    method: GET
    path: /companies

  - name: get_company
    description: Get company details with translations and boats.
    permission: "companies.read"
    method: GET
    path: /companies/{id}

  - name: create_company
    description: Create a new company.
    permission: "companies.write"
    method: POST
    path: /companies
    body:
      logo: string?
      phone: string?
      email: string?
      lineId: string?
      status: string        # ACTIVE | INACTIVE
      translations:
        - lang: string
          name: string
          description: string

  - name: update_company
    description: Full update of a company (replaces translations).
    permission: "companies.write"
    method: PUT
    path: /companies/{id}

  - name: delete_company
    description: Delete a company (boats become company-less).
    permission: "companies.delete"
    method: DELETE
    path: /companies/{id}

  # ── Service Areas ──────────────────────────────────────────────────────────

  - name: list_service_areas
    description: List all dive destinations / service areas.
    permission: "service-areas.read"
    method: GET
    path: /service-areas

  - name: get_service_area
    description: Get service area details with translations.
    permission: "service-areas.read"
    method: GET
    path: /service-areas/{id}

  - name: create_service_area
    description: Create a new dive destination / service area.
    permission: "service-areas.write"
    method: POST
    path: /service-areas
    body:
      translations:
        - lang: string
          name: string

  - name: update_service_area
    description: Full update of a service area (replaces translations).
    permission: "service-areas.write"
    method: PUT
    path: /service-areas/{id}

  - name: delete_service_area
    description: Delete a service area.
    permission: "service-areas.delete"
    method: DELETE
    path: /service-areas/{id}

  # ── Blogs ──────────────────────────────────────────────────────────────────

  - name: list_blogs
    description: List all blog articles with translations.
    permission: "blogs.read"
    method: GET
    path: /blogs

  - name: check_blog_topic
    description: Check if a blog topic already exists by searching title, slug, and keywords. Returns { exists: boolean, matches: [...] }.
    permission: "blogs.read"
    method: GET
    path: /blogs/check-topic
    params:
      q:
        type: string
        required: true
        description: Topic keyword(s) to search for (e.g. "richelieu rock", "koh tao diving")

  - name: get_blog
    description: Get a single blog post with full translations and videos.
    permission: "blogs.read"
    method: GET
    path: /blogs/{id}

  - name: create_blog
    description: Create a new blog post.
    permission: "blogs.write"
    method: POST
    path: /blogs
    body:
      status: string        # DRAFT | PUBLISHED
      covers: string[]
      translations:
        - lang: string      # en | th | cn | de | fr | ru | ko | ja
          title: string
          slug: string
          excerpt: string
          content: string   # HTML
          keywords: string[]
          ogTitle: string?        # Open Graph title (falls back to title if empty)
          ogDescription: string?  # Open Graph description
          ogImage: string?        # Open Graph image URL (1200×630px recommended)
      videos:
        - url: string
          name: string

  - name: update_blog
    description: Full update of a blog post (replaces translations and videos).
    permission: "blogs.write"
    method: PUT
    path: /blogs/{id}

  - name: delete_blog
    description: Delete a blog post.
    permission: "blogs.delete"
    method: DELETE
    path: /blogs/{id}

  # ── Upload ─────────────────────────────────────────────────────────────────

  - name: upload_media
    description: Upload an image file. Returns the public URL.
    permission: "upload.write"
    method: POST
    path: /upload
    content_type: multipart/form-data
    body:
      file: File            # image file (jpg, png, webp, gif)
    response:
      url: string           # public URL of uploaded image

  # ── Display Rows ───────────────────────────────────────────────────────────

  - name: list_display_rows
    description: Get all frontend display rows with items and translations.
    permission: "display-rows.read"
    method: GET
    path: /display-rows

  - name: create_display_row
    description: Create a new display row for the frontend homepage.
    permission: "display-rows.write"
    method: POST
    path: /display-rows
    body:
      topic: string         # internal name
      layout: string        # FULL | VERTICAL | HORIZONTAL
      itemType: string      # DAYTRIP | SNORKELING | LAND_TOUR | LIVEABOARD | DIVE_RESORT | FREEDIVE | SCUBA_COURSES | FREEDIVE_COURSES | BLOG
      active: boolean
      order: number?
      maxItems: number?     # null = show all
      translations:
        - lang: string
          title: string     # heading shown on frontend
          subtitle: string? # optional tagline
      items:
        - refId: string     # schedule.id | package.id | blog.id
          refType: string   # SCHEDULE | PACKAGE | BLOG
          order: number

  - name: update_display_row
    description: Full update of a display row (replaces translations and items).
    permission: "display-rows.write"
    method: PUT
    path: /display-rows/{id}

  - name: patch_display_row
    description: Partial update — toggle active state or change order.
    permission: "display-rows.write"
    method: PATCH
    path: /display-rows/{id}
    body:
      active: boolean?
      order: number?

  - name: delete_display_row
    description: Delete a display row.
    permission: "display-rows.delete"
    method: DELETE
    path: /display-rows/{id}

  # ── Site SEO ───────────────────────────────────────────────────────────────

  - name: list_site_seo
    description: Get SEO settings for all languages.
    permission: "settings.read"
    method: GET
    path: /site-seo

  - name: update_site_seo
    description: Upsert SEO settings for a specific language.
    permission: "settings.write"
    method: PUT
    path: /site-seo/{lang}
    body:
      title: string
      description: string
      keywords: string[]
      ogTitle: string
      ogDescription: string
      ogImage: string       # URL (1200×630px recommended)

  # ── Admins ─────────────────────────────────────────────────────────────────

  - name: list_admins
    description: List all admin accounts.
    permission: "admins.read"
    method: GET
    path: /admins

  - name: get_admin
    description: Get a single admin account.
    permission: "admins.read"
    method: GET
    path: /admins/{id}

  - name: create_admin
    description: Create a new admin account.
    permission: "admins.write"
    method: POST
    path: /admins
    body:
      email: string
      password: string
      name: string
      role: string          # SUPER_ADMIN | ADMIN | EDITOR
      permissions: string[] # granular permission keys for EDITOR role

  - name: update_admin
    description: Update admin details (partial — only supplied fields are updated).
    permission: "admins.write"
    method: PUT
    path: /admins/{id}
    body:
      name: string?
      email: string?
      password: string?
      role: string?
      permissions: string[]?
      active: boolean?

  - name: delete_admin
    description: Delete an admin account.
    permission: "admins.delete"
    method: DELETE
    path: /admins/{id}

  # ── API Keys ───────────────────────────────────────────────────────────────

  - name: list_api_keys
    description: List all API keys (prefix only, never full key).
    permission: "api-keys.read"
    method: GET
    path: /api-keys

  - name: create_api_key
    description: Create a new API key. The full key is returned ONCE and never stored.
    permission: "api-keys.write"
    method: POST
    path: /api-keys
    body:
      name: string
      permissions: string[] # e.g. ["blogs.read", "blogs.write"]
      expiresAt: string?    # ISO date, null = no expiry
    response:
      key: string           # full key — save it now, shown only once

  - name: update_api_key
    description: Update API key metadata (name, permissions, expiry).
    permission: "api-keys.write"
    method: PATCH
    path: /api-keys/{id}

  - name: delete_api_key
    description: Revoke and delete an API key.
    permission: "api-keys.delete"
    method: DELETE
    path: /api-keys/{id}

# ── Example usage ────────────────────────────────────────────────────────────
examples:
  - description: "Get all published liveaboard boats"
    request: "GET /boats?type=LIVEABOARD"

  - description: "Get full details of a single boat"
    request: "GET /boats/clxxxxxxxxxxxxx"

  - description: "Get schedules for a specific boat"
    request: "GET /schedules?boatId=clxxx..."

  - description: "Create a blog post with OG tags"
    request: |
      POST /blogs
      {
        "status": "PUBLISHED",
        "covers": ["https://siamdive.com/uploads/blog-cover.jpg"],
        "translations": [{
          "lang": "en",
          "title": "Best Dive Sites in Koh Tao",
          "slug": "best-dive-sites-koh-tao",
          "excerpt": "Discover the top spots...",
          "content": "<p>Full article content here...</p>",
          "keywords": ["koh tao", "dive sites", "scuba"],
          "ogTitle": "Best Dive Sites in Koh Tao — SiamDive",
          "ogDescription": "Discover the top dive sites in Koh Tao...",
          "ogImage": "https://siamdive.com/uploads/og-koh-tao.jpg"
        }]
      }

  - description: "Upload an image"
    request: |
      POST /upload
      Content-Type: multipart/form-data
      [file: image.jpg]
      → { "url": "https://siamdive.com/uploads/abc123.jpg" }

  - description: "Update SEO for English homepage"
    request: |
      PUT /site-seo/en
      {
        "title": "SiamDive — Dive Trips Thailand",
        "description": "Book scuba diving day trips and liveaboards in Thailand",
        "keywords": ["scuba diving thailand", "koh tao", "similan islands"],
        "ogTitle": "SiamDive — Dive Trips Thailand",
        "ogDescription": "Book scuba diving day trips and liveaboards in Thailand",
        "ogImage": "https://siamdive.com/uploads/og-home.jpg"
      }
`;

export async function GET() {
  return new NextResponse(SKILL_YAML, {
    headers: {
      "Content-Type": "application/yaml",
      "Content-Disposition": 'attachment; filename="siamdive-skill.yaml"',
      "Cache-Control": "no-store",
    },
  });
}
