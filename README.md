# Auto Goon

A tiled slideshow web app for displaying images and videos in a customisable grid layout. Content can be sourced from a local directory or from Reddit subreddits. Runs entirely client-side — no backend, no uploads.

---

## Features

- **Local file browsing** — recursively scans a selected directory for images and videos
- **Reddit integration** — fetches images, galleries, and embedded media from subreddits
- **Tiled grid layout** — arranges slides in configurable rows, scaled proportionally to fill the screen
- **Video splitting** — automatically chunks videos longer than a set duration into multiple slides without modifying the original files
- **Round Robin mode** — alternates content between subreddits evenly instead of mixing everything together
- **Profile system** — save and load named Reddit subreddit configurations; includes built-in presets
- **Background customisation** — set a custom background colour or image (fit/fill modes)
- **Volume control** — interactive slider that adjusts all playing videos simultaneously

## Supported File Formats

| Type | Formats |
|---|---|
| Images | jpg, jpeg, png, gif, bmp, webp, svg, tiff |
| Video | mp4, webm, ogg, mov, avi, mkv, flv, wmv, 3gp |

## Architecture

Pure vanilla JavaScript (ES6 modules) — no framework or build tooling.

| File | Role |
|---|---|
| `script.js` | Core slideshow engine — slide loop, transitions, grid management |
| `localFiles.js` | Directory scanning, image/video metadata, slide batching |
| `reddit.js` | Reddit API fetching, pagination, gallery/embed parsing |
| `reddit_presets.js` | Built-in subreddit profile collections |
| `settings.js` | localStorage-backed settings and profile UI |
| `tooltip.js` | Help tooltip logic |

External dependencies:
- **[HLS.js](https://github.com/video-dev/hls.js/)** — HTTP Live Streaming video support (loaded from CDN)

## Integrity

All processing happens locally in your browser. No files are uploaded to the internet. The only outbound network activity is loading HLS.js from CDN, and fetching Reddit content when using Reddit mode.

## Disclaimer

There are probably bugs.
