# STRANDED

A 3D island survival game: survive 50 nights after a plane crash. Built with TypeScript, Three.js and Vite. The full design is in [SPEC.md](SPEC.md).

## Quick start

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # type-check + production build into dist/
npm run preview    # serve the production build locally
```

Requires Node 20+ (developed on Node 24).

## Controls (implemented)

| Input | Action |
| --- | --- |
| W / Up, S / Down | Move forward / back |
| A / Left, D / Right | Turn the view (no strafing, per spec) |
| Mouse | Look (pointer lock) |
| Shift | Sprint |
| Esc | Pause (overlay with sensitivity slider) |
| Click, Q, E | Input is captured, but actions are not wired up yet |

Dev tip: open `/?hour=22` to start at 10pm and inspect the night look.

## Deployment

Pushing to `main` runs `.github/workflows/deploy.yml`, which builds and publishes `dist/` to GitHub Pages. One-time setup: repo Settings -> Pages -> Source: "GitHub Actions". `vite.config.ts` uses `base: './'` so it works under a repo sub-path.

## Docs

- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md): code layout, conventions, how to extend.
- [docs/ROADMAP.md](docs/ROADMAP.md): what is done, what is next (ordered by SPEC priorities), open questions.

## Status

Foundation complete: procedural island, forest, campfire placeholder, day/night cycle, first-person controls with collision, pause overlay. See the roadmap for next steps.
