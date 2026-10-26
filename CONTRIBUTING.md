# Contributing

Suggest a project by opening an issue or pull request. Include its original repository, what it helps with, setup and cost requirements, and any relationship you have with the project.

## Inclusion

- Useful AI tools, agent skills, models, and supporting developer or research resources are welcome.
- There is no minimum star count. Popularity is a dated snapshot, not a quality score.
- Mark related non-AI resources with `relatedResource: true` and explain their supporting use.
- Disclose curator projects with `authorProject: true`, and upstream forks with `isFork: true`.
- Preserve licensing restrictions and known limitations. Do not repeat unverified performance claims as facts.
- Smaller or early-stage projects can be marked Experimental. This is a maturity signal, not a quality verdict.

## Updating the catalog

1. Edit `dist/catalog.json`, the source of truth. Use one canonical, case-insensitive owner/repository identity.
2. Give the entry an original English summary, useful-for explanation, and limitation. Use `See docs` or `Varies` for unconfirmed requirements.
3. Use `Metadata reviewed` after checking the original GitHub metadata, or `README reviewed` after reading the original documentation. Record the date.
4. Never claim installation or workflow testing without a recorded environment, result, and limitations.
5. Run `npm ci --ignore-scripts`, `npm run check`, and `npm test`.
6. Run `node scripts/build-readme.cjs` to regenerate the README list.

`dist/coverage.json` records the seed collection and aliases. Additions beyond the seed list do not need to modify that provenance record.

## Refresh upstream and GitHub facts

Use **Actions → Refresh catalog → Run workflow** for a one-click update. The same workflow runs daily at 10:17 UTC. It fetches the current AI Pulse Georgia README and pinned source revision, imports new entries, and uses authenticated GraphQL batches to refresh GitHub facts for all repositories.

For a local refresh, sign in with GitHub CLI or set `GH_TOKEN` / `GITHUB_TOKEN`, then run `python scripts/refresh-catalog.py` and `node scripts/build-readme.cjs`. Python 3.10+ is sufficient; no additional Python packages are required.

The refresh preserves original editorial notes, limitations, review dates, and saved-collection IDs. It does not automatically delete missing repositories or projects removed upstream. Review the unavailable and archived markers before deciding on removals. Reference guides stay distinct from repositories and do not acquire fake stars or clone commands.

Metadata refresh is not README review, installation testing, or a workflow benchmark. Do not promote review evidence simply because the automated job ran.

Pull requests are checked automatically. Changes merged to `main` publish the static website through GitHub Pages.
