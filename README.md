# Lusion mirror (private, study only)

A copy of the **built** https://lusion.co site (Lusion Ltd, Bristol), mirrored on 2026-11-14 to study how its
WebGL effects are made. It runs fully offline from `site/`.

> **Keep this repo private.** All code, 3D models, textures, video, audio, fonts, logos, text and the client case
> studies belong to Lusion and their clients. Don't deploy it, don't publish it, don't reuse the assets. My own
> public site built with these techniques is a separate, original project: `vana-studio`.

## Run it

```powershell
. ..\use-node.ps1             # portable Node from the parent folder (or any Node 18+)
node scripts/serve.mjs        # http://localhost:4179/
```

Use the bundled server, or any static server that maps `/about` → `about/index.html`.
`node scripts/serve.mjs 4179 --fill` downloads any file that is still missing from the original while you browse
(and logs `filled ...`). The whole mirror was checked this way: home, about, projects and all 19 project pages.

## What it is

- **Astro** static pages (`site/index.html`, `site/about/`, `site/projects/`, `site/projects/<slug>/`) with one
  1.25 MB hoisted bundle `site/_astro/hoisted.CUO_IjfL.js`: three.js r158 + Lusion's own engine (scroll manager,
  page manager, post-processing, audio, every scene). Styles in `site/_astro/about.CNa9RfUh.css`.
- Assets come from their CDN `lusion.dev` on the live site. The bundle only uses the CDN when the hostname is
  `lusion.co` (`CDN_PATH`), so here everything loads from `site/assets/` with the same paths.
- 410 files, 155 MB: 54 `.buf` geometry/animation files (their own binary mesh format), 238 `.webp` textures and
  project images, 28 `.mp4` (reel + project videos), 16 `.ogg` sounds, Aeonik / IBM Plex Mono / LusionMono fonts.

## Where things are (in `src-readable/hoisted.js`, Prettier-formatted, ~50k lines)

`src-readable/` is for reading and searching only; the site loads `site/_astro/*`. Line numbers are approximate.

| Line | Class | What |
|---|---|---|
| 24756 | `CDN_PATH` | asset base URL switch |
| 27758–28027 | `HomeBalloons*` | the home hero: physics clump of plastic "cross" pieces (`assets/models/home/cross.buf`) |
| 29732 | `HomeHeroSection` | hero card, headline, scroll-to-explore row |
| 31846 | `HomeReelSection` | "Play reel" card and video |
| 32605–32995 | `ProjectItem`, `HomeFeaturedSection` | featured work grid with depth-map hover (`home.webp` + `home_depth.webp`) |
| 33379–37007 | `Goal*Tunnel*` | the end-of-page tunnel sequence: black/white tunnels, astronaut, glass, stickers |
| 36083 | `FooterSection` | footer |
| 37926 | `Header` | header, menu, sound toggle |
| 37505–39144 | `ProjectDetails*`, `ProjectPage` | project case-study pages |
| 39425–41026 | `AboutHero*` | about hero: terrain, rocks, particles, fog, halo, bending "LUSION" letters, astronaut |
| 41705 | `WhoSubsectionTeam` | team cards (`assets/team/*.buf` + `team.json`) |
| 42375–44308 | `AboutClient/Award/CapabilitySection` | about page sections |
| 46811 | `PageManager` | page transitions without reloads |
| 47042–47331 | `ScrollPane`, `ScrollManager` | virtual (wheel-driven) scrolling |
| 47387–47565 | `Postprocessing`, `Smaa` | post-processing chain + SMAA anti-aliasing |

## Changes from the original

- Google Analytics tag (`G-W2XC5XK9QJ`, theirs) removed from every page so local visits don't report to them.
- Nothing else is edited.

## Scripts

| Script | What |
|---|---|
| `scripts/serve.mjs` | zero-dependency static server, optional `--fill` |
| `scripts/download.mjs urls.txt` | downloads a list of `lusion.co` / `lusion.dev` URLs into `site/` (skips existing files, rejects Netlify's HTML fallback for missing files) |
