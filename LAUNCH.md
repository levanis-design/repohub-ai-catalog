# Review and launch

## Ready to review

- Confirm the name, visual direction, initial project selection, and task categories.
- Try search, combined filters, saving projects, comparing options, exports, and workflows.
- Check the original-source setup, cost, platform, and license notes for projects you know well.
- Decide whether to retain the two disclosed author projects.

## Before the public launch

1. Approve a public destination: a new GitHub repository and GitHub Pages, or public Sites hosting.
2. Choose licenses for the original code and editorial dataset; this draft does not invent a grant.
3. Confirm requirements against original setup docs, prioritizing the six “Start here” projects. Replace uncertain fields with verified requirements and evidence links.
4. Perform a visual and keyboard pass in desktop and mobile browsers. Browser UI automation was unavailable in the build session, so responsive source checks and DOM interaction tests do not substitute for that pass.
5. Keep the review labels honest. Only document real installation and workflow tests after completing them.
6. Remove the `noindex,nofollow` metadata and the “Private review draft” notice only after approval to launch publicly.
7. Set the final canonical URL, social preview image, sitemap, and robots.txt for the chosen host.
8. Connect “Suggest a project” to the new repository's issue form if desired. The draft currently downloads a Markdown suggestion and sends nothing.

## Maintenance

- Keep one source of truth in `dist/catalog.json`.
- Refresh GitHub metadata through a server-side or GitHub Actions job. Never put an API token in browser code.
- Propose changes for review when projects are renamed, archived, removed, or materially change licensing.
- Record documentation checks separately from installation tests.
- Start with a weekly metadata review and monthly editorial review; no schedule or automation is enabled in this draft.
- Direct RepoHub app import is a future integration. Exported JSON is portable data, not a claim of current app compatibility.

