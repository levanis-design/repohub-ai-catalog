# RepoHub AI Catalog

A practical English directory of AI tools and agent skills, curated by Levani Sidiani. Discover projects by task, compare setup requirements, and save a useful collection.

**Review draft.** The private preview is for feedback. Public launch, the final project name, and a code/content license are still to be approved.

## What works

- 38 real projects with independently written English summaries and original-source links.
- Task, operating-system, runtime, API-key, GPU, and review-evidence filters.
- Curated, alphabetical, popularity, and recent-update sorting.
- Project detail dialogs with requirements, licensing notes, limitations, and source-clone commands.
- Saved collections in browser local storage, without an account.
- Side-by-side comparison of up to three projects.
- JSON and CSV export of the current filtered collection.
- Three suggested starter workflows: website building, research, and video production.
- Transparent review methodology, author-project disclosure, and source credits.
- A project-suggestion form that downloads a Markdown file. It does not submit data to a server.

## Preview locally

Requires Python 3 for the static server. No build or runtime package installation is needed.

```powershell
python -m http.server 4178 --bind 127.0.0.1 --directory dist
```

Open http://127.0.0.1:4178 in your browser. Serve through HTTP; opening `index.html` as a local file will prevent the JSON dataset from loading in some browsers.

## Validate

Node.js 20+ is recommended for development checks. The production site has no JavaScript dependencies.

```powershell
npm ci --ignore-scripts
npm run check
npm test
```

## Files

| File | Purpose |
|---|---|
| `dist/catalog.json` | Versioned source dataset, editorial notes, and dated evidence |
| `dist/index.html` | Accessible application shell and metadata |
| `dist/styles.css` | Responsive library interface |
| `dist/app.js` | Search, filters, collections, comparison, and export |
| `dist/mark.svg` | Original connected-repository mark |
| `scripts/catalog.test.cjs` | DOM behavior and data integrity checks |
| `LAUNCH.md` | Review checklist and public-launch instructions |

## Data contract

`catalog.json` has a `version`, a `reviewedAt` date, and a `projects` array. Each project stores a unique `id`, canonical `repo`, task `category`, English `summary`, original-source `url`, platform/runtime/API/GPU guidance, license note, limitations, and evidence level. Popularity is a dated snapshot, not a quality rating.

Only use `README reviewed` after reading the original project documentation. Future `Installation tested` and `Workflow tested` labels need a recorded environment, date, result, and limitations. No project in this draft claims either kind of test.

Source-code availability does not imply unrestricted use. Restricted and unconfirmed licenses are called out. Requirements marked `See docs` or `Varies` need confirmation in the original project documentation.

## Credits and independence

Inspired by [Awesome AI Pulse Georgia](https://github.com/tornikebolokadze1-cyber/awesome-ai-pulse-georgia). English editorial copy is independently written from original GitHub descriptions and documentation. No affiliation is implied. Every listed project retains its own license and trademarks.

TradeDesk and RepoHub are created by this catalog's curator and explicitly marked Experimental. No paid placement or affiliate links are included.

## Privacy

Saved projects stay in browser local storage. There is no analytics, account system, cloud sync, or server-side collection in this draft. Fonts load from Google Fonts. Export creates local files. Suggested-project files are not sent automatically.

## Hosting

The production payload is the buildless `dist/` folder. The current review deployment is owner-private through Sites. The same folder can later be hosted on GitHub Pages or another static host. Review `LAUNCH.md` before making it public.

