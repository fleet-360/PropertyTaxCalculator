# BlogsManager Template - Full Project Plan

## Overview
Semi-WordPress blog management system built with Next.js.
A reusable template for building SEO-optimized blog systems for clients.
Includes: public blog pages (SSR for SEO) + admin panel with Elementor-style block editor.

---

## Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Framework | **Next.js 14+ (App Router)** | SSR/SSG for SEO, API routes, file-based routing |
| Database | **MongoDB + Mongoose** | Flexible schema for block-based content |
| Styling | **MUI (Material UI)** | Rich component library, theming system, professional look out of the box |
| Editor | **Custom Block Editor** (built from scratch) | Elementor-like experience, no heavy dependencies |
| Language | **TypeScript** | Type safety, better DX |
| Auth | **Simple password-based admin auth** | JWT + middleware, easy to extend later |

---

## Database Schema

### Post Model
```
{
  title: String (required)
  slug: String (unique, auto-generated from title, editable)
  excerpt: String (short description for listings)
  content: {
    blocks: [Block] (Elementor-style blocks)
    rawHtml: String (optional raw HTML override)
  }
  featuredImage: String (URL)
  author: String
  category: String
  tags: [String]
  status: "draft" | "published" | "archived"
  publishedAt: Date
  seo: {
    metaTitle: String
    metaDescription: String
    metaKeywords: [String]
    canonicalUrl: String
    ogTitle: String
    ogDescription: String
    ogImage: String
    twitterCard: "summary" | "summary_large_image"
    noIndex: Boolean
    noFollow: Boolean
    jsonLd: Object (structured data)
  }
  createdAt: Date
  updatedAt: Date
}
```

### Block Types (content.blocks)
```
{
  id: String (unique per block)
  type: "heading" | "paragraph" | "image" | "video" | "html" |
        "quote" | "list" | "divider" | "button" | "spacer" | "columns"
  data: {
    // Per type - see Block Editor section below
  }
  order: Number
}
```

### Settings Model (site-wide)
```
{
  siteName: String
  siteDescription: String
  defaultAuthor: String
  postsPerPage: Number
  defaultOgImage: String
  googleAnalyticsId: String
  customHeadCode: String (for scripts/pixels)
  customCss: String
}
```

---

## Project Structure

```
blogsManagerTemplate/
├── src/
│   ├── app/
│   │   ├── (blog)/                    # Public blog routes (SSR)
│   │   │   ├── page.tsx               # Blog listing page
│   │   │   ├── [slug]/
│   │   │   │   └── page.tsx           # Single post page
│   │   │   └── category/[category]/
│   │   │       └── page.tsx           # Posts by category
│   │   │
│   │   ├── admin/                     # Admin panel
│   │   │   ├── layout.tsx             # Admin layout with sidebar
│   │   │   ├── page.tsx               # Dashboard
│   │   │   ├── login/
│   │   │   │   └── page.tsx           # Admin login
│   │   │   ├── posts/
│   │   │   │   ├── page.tsx           # Posts list (table view)
│   │   │   │   ├── new/
│   │   │   │   │   └── page.tsx       # Create post
│   │   │   │   └── [id]/
│   │   │   │       └── edit/
│   │   │   │           └── page.tsx   # Edit post
│   │   │   └── settings/
│   │   │       └── page.tsx           # Site settings
│   │   │
│   │   ├── api/                       # API Routes
│   │   │   ├── auth/
│   │   │   │   └── login/route.ts
│   │   │   ├── posts/
│   │   │   │   ├── route.ts           # GET all, POST new
│   │   │   │   ├── [id]/
│   │   │   │   │   ├── route.ts       # GET one, PUT update, DELETE
│   │   │   │   │   └── duplicate/
│   │   │   │   │       └── route.ts   # POST duplicate
│   │   │   └── settings/
│   │   │       └── route.ts           # GET/PUT settings
│   │   │
│   │   ├── sitemap.ts                 # Dynamic sitemap.xml
│   │   ├── robots.ts                  # robots.txt
│   │   └── layout.tsx                 # Root layout
│   │
│   ├── components/
│   │   ├── blog/                      # Public blog components
│   │   │   ├── PostCard.tsx           # Post card for listing
│   │   │   ├── PostContent.tsx        # Renders blocks to HTML
│   │   │   ├── TableOfContents.tsx    # Auto-generated TOC
│   │   │   ├── ShareButtons.tsx       # Social share
│   │   │   └── Pagination.tsx
│   │   │
│   │   ├── admin/                     # Admin components
│   │   │   ├── Sidebar.tsx
│   │   │   ├── PostsTable.tsx
│   │   │   ├── StatusBadge.tsx
│   │   │   └── SearchBar.tsx
│   │   │
│   │   └── editor/                    # Block Editor (Elementor-like)
│   │       ├── BlockEditor.tsx        # Main editor component
│   │       ├── BlockToolbar.tsx       # Add block buttons
│   │       ├── BlockWrapper.tsx       # Drag, delete, reorder wrapper
│   │       ├── SeoPanel.tsx           # SEO settings panel
│   │       ├── InlineToolbar.tsx      # Bold/Italic/Link toolbar
│   │       └── blocks/
│   │           ├── HeadingBlock.tsx   # H1-H6
│   │           ├── ParagraphBlock.tsx # Rich text paragraph
│   │           ├── ImageBlock.tsx     # Image via URL
│   │           ├── VideoBlock.tsx     # Video embed via URL
│   │           ├── HtmlBlock.tsx      # Raw HTML
│   │           ├── QuoteBlock.tsx     # Blockquote
│   │           ├── ListBlock.tsx      # Ordered/Unordered list
│   │           ├── DividerBlock.tsx   # Horizontal rule
│   │           ├── ButtonBlock.tsx    # CTA button
│   │           ├── SpacerBlock.tsx    # Vertical spacing
│   │           └── ColumnsBlock.tsx   # 2-3 column layout
│   │
│   ├── lib/
│   │   ├── mongodb.ts                # MongoDB connection
│   │   ├── models/
│   │   │   ├── Post.ts
│   │   │   └── Settings.ts
│   │   ├── auth.ts                   # JWT helpers
│   │   └── seo.ts                    # SEO helpers (generateMetadata)
│   │
│   ├── theme/
│   │   └── theme.ts                  # MUI theme configuration
│   │
│   └── styles/
│       └── globals.css               # Global styles + MUI overrides
│
├── public/
│   └── fonts/                        # Local fonts if needed
│
├── .env.local                        # Environment variables
├── next.config.js
├── tsconfig.json
└── package.json
```

---

## Block Editor - Detailed Design

### HTML Tag Control (SEO)
The admin has full control over the semantic HTML tags used in every block.
This is critical for SEO — search engines rely on proper tag hierarchy.

| Block | Tag Control |
|-------|-------------|
| **Heading** | Admin selects exact tag: `<h1>` through `<h6>` — enforces SEO hierarchy |
| **Paragraph** | Renders as `<p>`, option to wrap in `<section>` or `<article>` |
| **Image** | Admin controls `alt`, `title`, `loading` (lazy/eager), wraps in `<figure>` + `<figcaption>` |
| **Video** | Proper `<iframe>` with `title` attribute for accessibility/SEO |
| **List** | Admin chooses `<ul>` vs `<ol>`, items are `<li>` |
| **Quote** | Uses `<blockquote>` with optional `<cite>` |
| **Button** | Admin chooses `<a>` vs `<button>`, controls `rel` (nofollow/sponsored/ugc) |

**SEO Tag Validation:**
- Warning if no `<h1>` exists in post
- Warning if heading hierarchy is broken (e.g., H1 → H3 without H2)
- Warning if images lack alt text
- All links: admin can set `rel="nofollow"`, `target="_blank"`, `title`

### Available Blocks

| Block | Options |
|-------|---------|
| **Heading** | H1-H6 (admin picks exact tag), text, alignment (left/center/right), color |
| **Paragraph** | Rich text with bold/italic/underline/link, alignment, font size, wrapper tag |
| **Image** | URL, alt text, title attr, caption, width, alignment, link, loading strategy |
| **Video** | URL (YouTube/Vimeo/direct), autoplay, caption, iframe title |
| **HTML** | Raw HTML textarea with syntax highlighting |
| **Quote** | Quote text, author, style (simple/bordered) |
| **List** | Ordered/Unordered, items array |
| **Divider** | Style (solid/dashed/dotted), color, width |
| **Button** | Text, URL, style (filled/outline), color, size, target |
| **Spacer** | Height in pixels |
| **Columns** | 2-3 columns, each column contains nested blocks |

### Editor Features
- **Drag & Drop** reordering of blocks (using native drag events)
- **Inline toolbar** - select text -> bold/italic/underline/link popup
- **Block toolbar** - appears on hover, has: move up/down, duplicate block, delete block
- **Add block** button between each block with block type selector
- **Live preview** - toggle between edit and preview modes
- **HTML mode** - toggle to see/edit the full raw HTML output
- **Undo/Redo** support
- **Auto-save** draft every 30 seconds

---

## SEO Features

### Per-Post SEO
- Custom meta title (with character counter, recommended 50-60 chars)
- Meta description (with character counter, recommended 150-160 chars)
- Custom slug / URL
- Canonical URL
- Open Graph: title, description, image
- Twitter Card type selection
- noindex/nofollow toggles
- JSON-LD structured data (BlogPosting schema, auto-generated)
- SEO score/checklist (basic analysis)
- **HTML tag hierarchy validation** (warns about H1 missing, broken hierarchy)
- **Link rel control** — per link: nofollow / sponsored / ugc
- **Image SEO** — alt text required indicator, title attribute, lazy loading control
- **Semantic structure preview** — shows the tag outline of the post (H1 > H2 > H3...)

### Site-Wide SEO
- Dynamic `sitemap.xml` (auto-generated from published posts)
- `robots.txt` configuration
- Default OG image
- Google Analytics integration
- Custom head code injection

### SSR/SSG
- Blog pages rendered server-side for full SEO
- Dynamic `generateMetadata()` per page
- Proper heading hierarchy
- Semantic HTML (article, header, nav, etc.)
- Image alt texts
- Clean URL structure

---

## Admin Panel Features

### Dashboard
- Total posts count (published/draft/archived)
- Recent posts list
- Quick actions (new post, view blog)

### Posts Management (Table View)
- Sortable columns: title, status, category, date, author
- Search by title
- Filter by: status, category
- Bulk actions: delete, change status
- Quick actions per row: edit, duplicate, preview, delete
- Pagination

### Post Editor
- Title input
- Slug input (auto-generated, editable)
- Block editor (main area)
- Right sidebar:
  - Publish panel (status, date, save/publish buttons)
  - Category selector
  - Tags input
  - Featured image (URL input + preview)
  - Excerpt textarea
  - Author
- Bottom panel:
  - SEO settings (expandable)
  - SEO preview (Google snippet preview)

### Settings Page
- Site name & description
- Default author
- Posts per page
- Default OG image
- Google Analytics ID
- Custom CSS injection
- Custom head code

---

## Admin Authentication
- Simple JWT-based auth
- Admin credentials in `.env.local`
- Login page with username/password
- Middleware protection for `/admin/*` routes (except login)
- Token stored in httpOnly cookie
- Easy to replace with more complex auth later

---

## API Endpoints

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/auth/login` | Admin login |
| GET | `/api/posts` | Get posts (with pagination, filters, search) |
| POST | `/api/posts` | Create new post |
| GET | `/api/posts/[id]` | Get single post |
| PUT | `/api/posts/[id]` | Update post |
| DELETE | `/api/posts/[id]` | Delete post |
| POST | `/api/posts/[id]/duplicate` | Duplicate post |
| GET | `/api/settings` | Get site settings |
| PUT | `/api/settings` | Update settings |

---

## Design / UI Direction

### Public Blog
- Clean, minimal, fast-loading
- White background, good typography
- Responsive (mobile-first)
- Card-based post listing
- Easy to re-skin per client (MUI theme customization)

### Admin Panel
- Dark sidebar + white content area
- Professional, clean look
- Hebrew RTL support built-in (dir="auto")
- Responsive (works on tablet)

---

## Implementation Phases (Execution Order)

### Phase 1: Project Setup
1. Initialize Next.js 14 with TypeScript + MUI
2. Setup MongoDB connection + Mongoose models
3. Configure environment variables
4. Setup project structure

### Phase 2: API Layer
5. Build all API routes (CRUD + duplicate + settings)
6. Add authentication (JWT, middleware, login endpoint)

### Phase 3: Admin Panel
7. Admin layout (sidebar, navigation)
8. Login page
9. Dashboard page
10. Posts list page (table with search/filter/sort)
11. Settings page

### Phase 4: Block Editor
12. Core BlockEditor component + block state management
13. Implement all block types (heading, paragraph, image, video, html, quote, list, divider, button, spacer, columns)
14. Inline toolbar (bold/italic/underline/link)
15. Block toolbar (reorder, duplicate, delete)
16. Drag & drop reordering
17. Live preview mode
18. Auto-save

### Phase 5: Post Editor Page
19. Full post editor with block editor + sidebar panels
20. SEO panel with all fields + Google snippet preview
21. Category/tags/featured image/excerpt panels
22. Save/Publish/Draft flow

### Phase 6: Public Blog (SSR + SEO)
23. Blog listing page with pagination
24. Single post page (renders blocks to semantic HTML)
25. Category pages
26. generateMetadata for all pages
27. JSON-LD structured data
28. sitemap.xml + robots.txt

### Phase 7: Polish
29. Table of contents component
30. Share buttons
31. RTL support
32. Error handling & loading states
33. Final testing & QA

---

## Things You Didn't Mention But I'm Adding

1. **Auto-slug generation** - Title -> URL-friendly slug automatically
2. **SEO score checker** - Basic checklist (title length, description, image alt, etc.)
3. **Google snippet preview** - See how the post looks in Google results
4. **Table of Contents** - Auto-generated from headings
5. **Auto-save** - Don't lose work
6. **Post duplication** - One click to clone a post
7. **Draft/Published/Archived** statuses
8. **Settings model** - Site-wide configuration
9. **RTL support** - Important for Hebrew-speaking clients
10. **Custom CSS injection** - Per-site customization without code changes
11. **JSON-LD** - Structured data for rich Google results
12. **Category pages** - SEO-friendly category routing
13. **Responsive admin** - Works on tablets too
14. **Columns block** - Multi-column layouts like Elementor
15. **Export-ready** - Clean template, easy to clone and customize

---

## Environment Variables (.env.local)
```
MONGODB_URI=mongodb://localhost:27017/blogsManager
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
JWT_SECRET=your-secret-key-here
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```
