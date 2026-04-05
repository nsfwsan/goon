# CLAUDE.md

Guidelines and context for working on this project.

## Project Overview

**Auto Goon** is a client-side tiled slideshow web app. No build step, no backend, no framework — pure vanilla JavaScript (ES6 modules) opened directly in a browser or served statically via GitHub Pages.

Hosted at: `goon.jhosan.top` (GitHub Pages, CNAME configured)

## Architecture

All logic lives in flat JS modules at the repo root. There is no bundler, transpiler, or package manager.

| File | Role |
|---|---|
| `index.html` | UI structure — welcome screen, settings dialog, slideshow grid |
| `script.js` | Core engine — slide loop, transitions, grid management, HLS handling |
| `localFiles.js` | Local directory scanning, image/video metadata, slide batching |
| `reddit.js` | Reddit JSON API fetching, pagination, gallery/embed parsing, round-robin |
| `reddit_presets.js` | Built-in named subreddit profile presets |
| `settings.js` | localStorage-backed settings and Reddit profile UI |
| `tooltip.js` | Help tooltip behaviour |
| `style.css` / `tooltip.css` | Styling |
| `resources/` | Static assets (arrows, loading indicators, title graphic) |

External dependency: **HLS.js** loaded from CDN (no local install).

## Coding Conventions

- **Vanilla JS only** — no frameworks, no npm packages, no bundler. Keep it that way.
- **ES6 modules** — use `import`/`export`. All script tags in `index.html` use `type="module"`.
- **No build step** — files are served/opened as-is. Avoid anything that requires compilation.
- **localStorage** for all persistence — settings and Reddit profiles are stored there.
- **Memory management matters** — revoke Blob URLs with `URL.revokeObjectURL()` and clean up HLS instances when slides are removed.

## Key Behaviours to Preserve

- Video splitting creates virtual slide chunks from a single file handle; it does **not** copy or modify files.
- Slides scale proportionally by height to fill available horizontal space.
- The slideshow loop in `script.js` lazily loads new slides as space becomes available — avoid breaking this lazy-loading contract.
- Reddit fetching is paginated; `after` cursors must be threaded correctly across calls.

## Deployment

Push to `main` — GitHub Pages serves the repo root automatically. No CI, no build pipeline.

## Tasks

See [TASKS.md](TASKS.md) for tracked work items.
