# d4rkc0de — club website

The d4rkc0de (cybersecurity club, IIIT Delhi) website. Built with Next.js 16 (App Router), React 19, TypeScript, and Tailwind CSS v4.

The landing page renders the hero text (`root@d4rkc0de:~#` / *a single vulnerability is all it takes.*) onto a canvas — either as ASCII glyphs or as normal text — and runs 14 live post-processing effects over it (vignette, scan lines, CRT curvature, chromatic aberration, bloom, character bloom, film grain, glitch, RGB split, blur, halftone, pixelate, film dust, color overlay), each with a toggle + intensity slider.

## Run it

Requires [Node.js](https://nodejs.org) 20+ and npm.

```bash
npm install   # install dependencies
npm run dev   # start dev server at http://localhost:3000
```

Open http://localhost:3000 in your browser.

## Other commands

```bash
npm run build   # production build (outputs to .next/)
npm start       # serve the production build
npm run lint    # run ESLint
```

## Pages

| Route      | Description          |
| ---------- | -------------------- |
| `/`        | Landing page         |
| `/about`   | About / members      |
| `/events`  | Past events          |
| `/join`    | Join the club        |

## Troubleshooting

- **Hero looks blank?** Hard refresh with `Ctrl+Shift+R` (some Chrome tabs cache a stale canvas). If it persists, restart `npm run dev`.
- **Port 3000 already in use?** Run `npm run dev -- -p 3001` and open http://localhost:3001.
