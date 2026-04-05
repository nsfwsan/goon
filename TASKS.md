# Tasks

Tracked work items for Auto Goon.

## In Progress

### Build E621.net Integration

Add e621.net as a content source alongside the existing Reddit integration, following the same `nextSlides()` contract used by `localFiles.js` and `reddit.js`.

#### API Summary

| Detail | Value |
|---|---|
| Base URL | `https://e621.net` |
| Posts endpoint | `GET /posts.json` |
| Response format | JSON |
| Rate limit | Hard cap: 2 req/s — best practice: 1 req/s (503 on breach) |
| User-Agent | **Required.** Custom string only — e.g. `Auto Goon/1.0 (by username on e621)`. Impersonating a browser UA results in a block. |

#### Request Parameters (`/posts.json`)

| Parameter | Notes |
|---|---|
| `tags` | Space-separated tag query. Max **6 tags** per request. Supports metatags like `order:score`, `rating:s`, `type:video`. |
| `limit` | Results per page. Max **320**. |
| `page` | Page number for pagination. Also accepts `a{id}` (after ID) and `b{id}` (before ID) for cursor-based pagination. |

#### Authentication

- Read-only access (browsing posts) does **not** require authentication.
- Authenticated requests use **HTTP Basic Auth**: username + API key (generated in e621 account settings).
- Required only for write operations (voting, flagging, etc.) — not needed for this feature.
- Explicit login unlocks access to user-specific content filters and higher-rated content.

#### Post Response Fields (relevant subset)

| Field | Description |
|---|---|
| `id` | Post ID — use for cursor pagination (`a{id}`) |
| `file.url` | Direct URL to the full-resolution file |
| `file.ext` | File extension: `jpg`, `png`, `gif`, `webp`, `mp4`, `webm` |
| `file.width` / `file.height` | Dimensions in pixels |
| `preview.url` | Thumbnail URL |
| `sample.url` | Medium-resolution sample |
| `rating` | `s` (safe), `q` (questionable), `e` (explicit) |
| `tags` | Object of tag arrays by category (general, species, character, etc.) |
| `md5` | File hash — useful for deduplication |

#### Supported File Types (for this app)

- Images: `jpg`, `png`, `gif`, `webp`
- Video: `mp4`, `webm`
- Skip: `swf` (Flash — deprecated)

#### Implementation Notes

- Mirror the structure of `reddit.js`: export `startE621()` and `nextE621Slides()`.
- Use cursor-based pagination (`a{id}`) rather than page numbers to avoid duplicates across fetches.
- Respect the 1 req/s sustained rate limit — add a delay between paginated fetches.
- Set a descriptive `User-Agent` header on every request (required; plain `fetch()` in browsers sends no custom UA — may need a CORS proxy or the app to note this limitation).
- Filter out `swf` posts before returning slides.
- Tags input, sort order, and rating filter should be configurable (similar to Reddit's subreddit/sort/time fields).

#### References

- [E621 OpenAPI Spec](https://e621.wiki/)
- [ZestyAPI — JS wrapper](https://github.com/re621/ZestyAPI)
- [DonovanDMC/E621 — TS wrapper](https://github.com/DonovanDMC/E621)

#### Implementation Plan

- [x] **1. Create `e621.js`** — Core module mirroring `reddit.js`
  - `startE621()`: reads tags/sort/rating from the form, initialises slide buffer, fetches first page
  - `loadNextPage()`: fetches `/posts.json`, maps posts to slide objects (`{type, format, url, width, height}`), paginates via `b{id}` cursor; enforces 1 req/s delay between calls
  - `nextE621Slides()`: same contract as `nextRedditSlides(remainingWidth, height, isEmpty)` — returns slides fitting the row
  - `initE621()`: binds form element references
  - Filter: skip `swf`; treat `jpg/png/gif/webp` as `format: 'image'`, `mp4/webm` as `format: 'video'`

- [x] **2. Add E621 form to `index.html`**
  - "From E621" button alongside existing "Pick folder" and "From reddit" buttons
  - E621 form (hidden by default, shown on button click) containing:
    - Tags text input (space-separated)
    - Sort dropdown: `score`, `id` (newest), `favcount`
    - Rating checkbox group: Safe / Questionable / Explicit
    - Username and API key fields (optional — for authenticated access)
    - Submit button

- [ ] **3. Account login (optional authentication)**
  - Username + API key fields in the E621 form (API key generated at e621.net account settings, never the account password)
  - Store credentials in `localStorage` under a dedicated key so they persist across sessions
  - `initE621()` reads stored credentials on load and pre-fills the fields
  - When credentials are present, attach them as an `Authorization: Basic {base64(user:apikey)}` header on every `fetch()` call in `loadNextPage()`
  - Authenticated requests lift anonymous rate limits and apply the account's tag blacklist
  - Add a "Clear saved login" button that wipes credentials from `localStorage`

- [x] **4. Wire up `script.js`**
  - Import `startE621`, `nextE621Slides`, `initE621` from `./e621.js`
  - Add `openE621()` function — mirrors `openReddit()`: calls `startE621()`, sets `slidesFetcher = nextE621Slides`, starts slideshow rows
  - Add `showE621Form()` — mirrors `showRedditForm()`
  - Bind "From E621" button and form submit in `window.onload`
  - Call `initE621()` in `window.onload`

- [x] **4. Handle video slides from E621**
  - E621 video posts (`mp4`/`webm`) return a direct `file.url` — slide object uses `{format: 'video', url: ...}`, which `script.js` already handles via `vidDiv.src = slide.url`
  - Verify `scaledWidth` is set correctly from `file.width`/`file.height` before returning slides

- [x] **5. Match E621 form styling to Reddit form**
  - Inspect `style.css` for any rules scoped to `#redditForm` or its children and apply equivalent rules to `#e621Form`
  - Verify the "From E621" button matches the appearance of "From reddit" and "Pick folder" (already shares `class="titleContent browse noForm"` so should inherit automatically — confirm visually)
  - Verify form layout (label/input rows, spacing, submit button) is consistent with the Reddit form
  - Verify the "Clear saved login" button and rating checkboxes are styled consistently with existing form controls

- [ ] **6. Verify CORS and connectivity**
  - Confirm `e621.net/posts.json` responds with CORS headers permitting browser `fetch()` calls
  - Confirm browser's default `User-Agent` is acceptable (the custom UA rule targets automated scripts, not browsers making direct requests)
  - Document any CORS limitations in a code comment if issues arise

## Backlog


### Add Back Button to Slideshow

Add a back button to the slideshow view that returns the user to the welcome screen. The button lives in the top-left corner, hidden by default, and fades in on hover.

#### Scope

- The slideshow is shown by hiding `#welcome` and displaying `#slideshow-grid`
- A back button needs to sit above the grid (`z-index` above slides), visible only on hover
- Returning to the welcome screen must cleanly stop the current slideshow — slides, timers, and HLS sources all need disposing

#### Implementation Notes

- Add a `<button id="slideshowBack">← Back</button>` to `index.html`, positioned `fixed` top-left, above the slideshow grid (`z-index: 4`)
- Style in `style.css`: `opacity: 0` by default, `opacity: 1` on `#slideshowBack:hover`; use `transition: opacity 0.2s` for a smooth fade; give it enough padding to be an easy hover target
- In `script.js`, add a `stopSlideShow()` function that:
  - Clears all active slide timers (currently managed as local `timeout` vars inside `startSlideShow` closures — may need a module-level registry to track them)
  - Destroys all HLS instances in `hlsSources` and clears the object
  - Revokes all Blob URLs on current slide elements (`disposeResources` already does this per-element — call it on each slide)
  - Empties all `.slideshow-row` elements
  - Resets `inProgress = false` and `slidesFetcher = null`
  - Hides `#slideshow-grid`, shows `#welcome`, restores `#menu-tip`
  - Restores `.titleContent` and `.noForm` elements
- Bind `#slideshowBack` to `stopSlideShow()` in `window.onload`
- Hide `#slideshowBack` when on the welcome screen; show it when the slideshow starts (mirror how `#menu-tip` is hidden in `openReddit`/`openE621`/`openDir2`)

#### Complexity Note

The timer cleanup is the hardest part — `timeout` variables are currently scoped inside `startSlideShow` closures with no external reference. This will likely require a module-level `Set` or array to register active timeouts so `stopSlideShow()` can cancel them all.

### Auto Resize UI Depending on Browser Size

Ensure the welcome screen and forms scale gracefully across all browser sizes and orientations, beyond the existing portrait phone breakpoint.

#### Scope

- Welcome screen buttons and form controls currently use fixed `px` font sizes and widths that may feel too small on large displays or break on narrow desktop windows
- The existing portrait media query (`orientation: portrait` and `max-width: 1000px`) handles phones but not intermediate sizes (small desktop windows, tablets in landscape, etc.)
- The E621 and Reddit forms have a fixed `width: 300px` which may be too narrow or too wide depending on viewport

#### Implementation Notes

- Audit all fixed `px` sizes in `style.css` for the welcome screen and form elements; convert to `vw`/`vh`/`rem`/`%` where appropriate
- Consider replacing the single portrait breakpoint with a fluid approach (e.g. `clamp()` for font sizes) so the UI scales continuously rather than snapping
- The slideshow grid itself already scales correctly — focus on the welcome/form layer only
- Test at common viewport widths: 360px (phone), 768px (tablet), 1280px (desktop), 1920px (large desktop)

## Done

### Add Back Button to Menu Screens

`← Back` button added to the top of `#redditForm` and `#e621Form`. `showWelcome()` in `script.js` reverses the form-show logic. Field values are preserved automatically.
