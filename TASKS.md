# Tasks

Tracked work items for Auto Goon.

## Backlog

### `E6-FAV` — E621 "My Favourites" Mode

Add a "My Favourites" button to the E621 form that starts a slideshow of the logged-in user's saved posts, instead of a tag search.

#### Background

The e621 API exposes favourites via `GET /favorites.json?user_id={id}` (authenticated). This is distinct from the tag search endpoint (`/posts.json`) and requires a valid login. Other account features — followed tags, personal feed/home page — have no public API equivalent and cannot be accessed this way.

#### Scope

- The button should appear on the E621 form, replacing or supplementing the submit button when credentials are entered
- Requires the user to be logged in (username + API key); if credentials are absent, show a message directing the user to fill them in
- Fetches from `GET /favorites.json?user_id={id}` with the same `Authorization: Basic` header used in `loadNextPage()`
- Pagination uses the same `page=b{id}` cursor pattern as the posts endpoint
- Response shape is the same as `/posts.json` — `{ posts: [...] }` — so the existing slide-mapping logic in `loadNextPage()` can be reused

#### Implementation Notes

- Need to resolve the logged-in user's numeric `user_id` from their username — the endpoint `GET /users/{username}.json` returns the user object including `id`; fetch this once at start and cache it
- Add `<button id="e621Favourites">My Favourites</button>` to the E621 form in `index.html`, alongside the existing submit button row
- In `e621.js`, add `startE621Favourites()`: fetches the user ID, sets a module flag to switch `loadNextPage()` to use the favourites endpoint instead of the tags endpoint, then proceeds identically to `startE621()`
- Wire `#e621Favourites` to `openE621Favourites()` in `script.js` (mirrors `openE621()` but calls `startE621Favourites()`)
- If the user ID fetch fails (bad credentials, network error), surface a clear error via the existing `showError()` helper

### `RD-UP` — Reddit Upvoted Posts Feed (Investigate)

Display a slideshow sourced from the logged-in user's Reddit upvoted posts via `GET /user/{username}/upvoted.json`.

#### Feasibility

The endpoint exists and works, but requires Reddit OAuth — a significant step up from the current anonymous JSON API approach used in `reddit.js`.

**Auth flow (implicit grant — browser-only, no backend needed):**
1. User is redirected to Reddit's authorization page (requires a registered Reddit app `client_id` from reddit.com/prefs/apps)
2. Reddit redirects back to the app with an access token in the URL fragment
3. Token is attached as `Authorization: Bearer {token}` on requests to `oauth.reddit.com`

**Scope required:** `history` + `identity` (to resolve the username)

**Limitations:**
- Requires the user to register a Reddit app themselves to obtain a `client_id` — adds setup friction
- Implicit grant tokens expire after 1 hour with no refresh token; user must re-authenticate each session
- The existing Reddit integration uses `old.reddit.com` with no auth — OAuth is a different code path entirely

#### Implementation Notes

- Add a "My Upvotes" button to the Reddit form, visible only when OAuth credentials are configured
- On click: redirect to `https://www.reddit.com/api/v1/authorize?client_id=...&response_type=token&scope=identity history&redirect_uri=...`
- On return: parse `#access_token=` from the URL fragment, store in `sessionStorage` (not `localStorage` — tokens expire)
- Fetch `https://oauth.reddit.com/user/{username}/upvoted.json` with the Bearer token; response shape is identical to the existing Reddit JSON API so `reddit.js` parsing logic can be reused
- The `redirect_uri` must exactly match what was registered in the Reddit app — this works for GitHub Pages but not `file://`

#### Verdict

Feasible but non-trivial. Best approached after the core Reddit and E621 integrations are stable.

## Done

### `RG` — Integrate RedGifs

Full integration delivered across `redgifs.js`, `index.html`, `script.js`, and `style.css`. Anonymous Bearer token auth via `GET /v2/auth/temporary`; tag search using `?tags=` parameter with order and page-number pagination. Videos are served as `<iframe src="https://www.redgifs.com/ifr/{id}">` to work around `media.redgifs.com` CORS restrictions on the video CDN. Back button and loading animation shared with all other sources.

### `LOAD-ANIM` — Port Loading Animation to All Sources

Bucket animation now plays during the API call for Reddit, E621, and RedGifs sources. `animateBucket()` gained an optional `fillFraction` parameter (network sources pass `0.5`; local folder load unchanged). Animation is started before `start*()` is awaited so it's visible during the network request, and cleared on both success and failure.

### `SL-BACK` — Add Back Button to Slideshow

Fixed-position `← Back` button in the top-left corner of the slideshow view. Invisible by default, fades in on hover (`opacity` transition). Clicking it calls `stopSlideShow()` which cancels all active timers via a module-level `activeTimers` Set, destroys HLS instances, disposes blob URLs, clears the bucket animation interval, hides the load container, and restores the welcome screen.

### `UI-RESIZE` — Auto Resize UI Depending on Browser Size

10 `clamp()` / `min()` values applied across `style.css` and `tooltip.css`. Buttons, forms, decorative images, settings dialog, and tooltip all scale continuously from 360px to 1920px. Zero new media queries — existing portrait/landscape overrides preserved unchanged.

### `E6` — Build E621.net Integration

Full integration delivered across `e621.js`, `index.html`, `script.js`, and `style.css`. Covers tag search, sort, rating filters, optional account login with localStorage persistence, cursor-based pagination, rate limiting, video slide support, form styling parity, and CORS error surfacing.

### `MENU-BACK` — Add Back Button to Menu Screens

`← Back` button added to the top of `#redditForm` and `#e621Form`. `showWelcome()` in `script.js` reverses the form-show logic. Field values are preserved automatically.
