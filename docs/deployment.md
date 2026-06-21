# Deployment

The app is a static Vite build and can be deployed to GitHub Pages.

```bash
pnpm install
pnpm build
```

`vite.config.ts` uses `base: './'` so assets resolve under repository subpaths. GitHub Actions publishes `dist/` via `.github/workflows/pages.yml`.
