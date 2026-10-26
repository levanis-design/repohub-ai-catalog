# Publication and maintenance

The catalog includes the curator's original list and the complete AI Pulse Georgia collection, deduplicated by canonical repository and retaining separate guide links. See `dist/catalog.json` for current counts, source revision, and refresh time.

## Publication

- GitHub repository: https://github.com/levanis-design/repohub-ai-catalog
- Static website: https://levanis-design.github.io/repohub-ai-catalog/
- Original code and editorial text are MIT licensed; third-party projects retain their own terms.
- Main-branch pushes validate the source and deploy `dist/` through GitHub Pages.
- The original Sites review deployment retains its owner-private audience.

## Follow-up improvements

1. Confirm requirements against original setup docs, prioritizing the six “Start here” projects. Keep uncertain fields marked `See docs` or `Varies` until verified.
2. Perform visual and keyboard review in desktop and mobile browsers. DOM interaction tests do not substitute for that pass.
3. Only document installation and workflow evidence after completing the actual work.
4. Consider a dedicated social-preview image and self-hosted fonts.
5. Agree a supported file format before implementing direct RepoHub app import. Current exports are portable lists, not an app integration.

## Maintenance

- Keep one source of truth in `dist/catalog.json`; regenerate README with `node scripts/build-readme.cjs`.
- Preserve seed-list provenance and aliases in `dist/coverage.json`.
- Refresh GitHub metadata through a server-side or GitHub Actions job. Never put an API token in browser code.
- Propose changes for review when projects are renamed, archived, removed, or materially change licensing.
- Record documentation checks separately from installation tests.
- The Refresh catalog workflow runs daily at 10:17 UTC and supports manual dispatch. Editorial review remains separate from automated metadata checks.
- Direct RepoHub app import is a future integration. Exported JSON is portable data, not a claim of current app compatibility.

