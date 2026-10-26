const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const data = JSON.parse(fs.readFileSync(path.join(root, 'dist/catalog.json'), 'utf8'));
const projects = data.projects;
const categories = data.categories?.map(c=>c.name) || [...new Set(projects.map(p => p.category))].sort();
const categoryDetails = new Map((data.categories || []).map(c=>[c.name,c.description]));
const repositories=projects.filter(p=>!p.isResource).length;
const references=projects.length-repositories;
const refreshed=data.metadataRefreshedDate || data.reviewedAt;
const formatDate=value=>new Date(value+'T12:00:00Z').toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric',timeZone:'America/New_York'});
const slug = text => text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const cell = text => String(text).replace(/\|/g, '\\|').replace(/[\r\n]+/g, ' ');
const readmes = projects.filter(p => p.review === 'README reviewed').length;
const intro = `[![RepoHub — explore, organize, and run your repositories](dist/assets/repohub-cover.png)](https://github.com/levanis-design/RepoHub)

# RepoHub AI Catalog

A practical English directory of AI tools, agent skills, models, and supporting resources, curated by Levani Sidiani. Find something useful, understand what it needs, and build a collection you can return to.

**[Explore the searchable catalog](https://levanis-design.github.io/repohub-ai-catalog/)** · [Suggest a project](https://github.com/levanis-design/repohub-ai-catalog/issues/new) · [Contribute](CONTRIBUTING.md) · [Download the dataset](dist/catalog.json)

**${repositories} repositories · ${references} reference guides · ${categories.length} categories · Metadata refreshed ${formatDate(refreshed)}**

Includes the complete [AI Pulse Georgia collection](https://github.com/tornikebolokadze1-cyber/awesome-ai-pulse-georgia), merged with the curator's favorites, TradeDesk, and RepoHub. All ${data.upstream?.listedEntries || 0} upstream entries are represented. Duplicate and renamed repositories are consolidated, while guides retain their original links. [Seed coverage](dist/coverage.json) and [upstream provenance](dist/catalog.json) record the source lists.

The cover shows the [RepoHub desktop app](https://github.com/levanis-design/RepoHub), the catalog's companion project.

## Categories

| Category | What you will find |
|---|---|
${categories.map(c=>`| [${cell(c)}](#category-${slug(c)}) | ${cell(categoryDetails.get(c)||'Additional projects from the curator’s collection.')} |`).join('\n')}

## Find a useful starting point

| Goal | Suggested starting points |
|---|---|
| Build and review a website | [gstack](https://github.com/garrytan/gstack), [Impeccable](https://github.com/pbakaus/impeccable), [Agentation](https://github.com/benjitaylor/agentation) |
| Research a current topic | [Last 30 Days](https://github.com/mvanhorn/last30days-skill), [Agent Reach](https://github.com/Panniantong/Agent-Reach) |
| Make a product video | [HyperFrames](https://github.com/heygen-com/hyperframes), [Brag](https://github.com/latent-spaces/brag), [Voicebox](https://github.com/jamiepine/voicebox) |
| Review a website's search visibility | [Claude SEO](https://github.com/AgriciDaniel/claude-seo), [Qiaomu SEO](https://github.com/joeseesun/qiaomu-seo) |
| Understand an unfamiliar repository | [Understand Anything](https://github.com/Egonex-AI/Understand-Anything), [RepoHub](https://github.com/levanis-design/RepoHub) |

These are editorial starting points, not claims of completed installation or workflow testing. The website includes three suggested workflows with steps and limitations.

## What the labels mean

- **Metadata reviewed:** the original GitHub description and repository facts were checked.
- **README reviewed:** the original project documentation was also read. ${readmes} projects have this label. Other repositories are metadata-reviewed; reference guides are marked separately.
- **Experimental:** early-stage, small-adoption, or limited-history projects. This is not a quality score.
- **Related resource:** supporting software or research material that is not primarily an AI agent.
- **Curator project:** a repository maintained by this catalog's curator. Osiris is also explicitly identified as an upstream fork.

No project is currently labeled **Installation tested** or **Workflow tested**. Future testing labels require an environment, date, result, and limitations. Popularity is a dated snapshot, not evidence of quality. Requirements marked **See docs** or **Varies** need confirmation in the original setup guide.

## Complete collection

${categories.map(c => `[${c}](#category-${slug(c)})`).join(' · ')}
`;
const sections = categories.map(category => {
  const rows = projects.filter(p => p.category === category).sort((a,b) => a.name.localeCompare(b.name)).map(p => {
    const labels = [p.isResource && p.resourceType, p.review, p.experimental && 'Experimental', p.relatedResource && 'Related resource', p.authorProject && 'Curator project', p.isFork && 'Fork'].filter(Boolean).join('; ');
    const popularity=p.isResource?'—':(p.metadataStatus==='unavailable'?'Unavailable':p.stars.toLocaleString('en-US'));
    return `| [${cell(p.name)}](${p.url}) | ${popularity} | ${cell(p.summary)}<br><sub>${labels}${p.archived?'; Archived':''}</sub> |`;
  });
  return `\n<a id="category-${slug(category)}"></a>\n\n### ${category}\n\n| Repository | Stars | What it helps with |\n|---|---:|---|\n${rows.join('\n')}\n`;
}).join('');
const end = `
## Use the website

Search by task or keyword; filter by category, operating system, runtime, API requirements, GPU requirements, and review evidence. Save projects in your browser, compare up to three, and export the current collection as JSON or CSV. No account is required.

Suggestions can open a prefilled GitHub issue for you to review and submit, or download as Markdown. No suggestion is submitted automatically. Direct import into the RepoHub desktop app is a future integration; export is portable data, not a claim of current app compatibility.

## Run locally

The application is buildless static HTML, CSS, JavaScript, and JSON. Python 3 can serve it without any dependency installation:

\`\`\`powershell
python -m http.server 4178 --bind 127.0.0.1 --directory dist
\`\`\`

Open http://127.0.0.1:4178. Serve through HTTP rather than opening the HTML as a local file, because the app loads its JSON dataset with fetch.

For development checks, use Node.js 22+:

\`\`\`powershell
npm ci --ignore-scripts
npm run check
npm test
node scripts/build-readme.cjs --check
\`\`\`

After editing the dataset, run \`node scripts/build-readme.cjs\` to update this list. GitHub Actions validates changes and publishes \`dist/\` to GitHub Pages on pushes to \`main\`.

## Keep the collection up to date

The **Refresh catalog** workflow runs daily and can be started anytime from [Actions](https://github.com/levanis-design/repohub-ai-catalog/actions/workflows/refresh.yml) with **Run workflow**. It imports new upstream entries, resolves renamed repositories, refreshes star counts, fork counts, archived status, update dates, and license metadata, regenerates this README, runs validation, and publishes the updated website.

Existing editorial notes and review evidence are preserved. Deleted or inaccessible repositories retain their previous facts and are marked unavailable; temporary API failures stop the refresh before any data is written. Refreshing metadata does not claim that software was installed or tested. Projects removed upstream remain in this catalog until editorial review.

To refresh locally, sign in with GitHub CLI or set \`GH_TOKEN\` / \`GITHUB_TOKEN\`, then run:

\`\`\`powershell
python scripts/refresh-catalog.py
node scripts/build-readme.cjs
\`\`\`

The refresh uses batched GitHub GraphQL requests. Tokens stay in the workflow environment or your local session; they are never included in the public dataset or browser code.

## Project structure

| Path | Purpose |
|---|---|
| \`dist/catalog.json\` | The single source of truth for projects, requirements, and review notes |
| \`dist/coverage.json\` | Original seed repositories and normalized aliases |
| \`dist/index.html\`, \`styles.css\`, \`app.js\` | Accessible, responsive catalog interface |
| \`scripts/build-readme.cjs\` | Generates this README from the catalog |
| \`scripts/refresh-catalog.py\` | Imports upstream and refreshes live GitHub metadata in batches |
| \`scripts/catalog.test.cjs\` | Data integrity and DOM interaction tests |
| \`.github/workflows/pages.yml\` | Validation and static-site deployment |

## Independence and credits

The [Awesome AI Pulse Georgia](https://github.com/tornikebolokadze1-cyber/awesome-ai-pulse-georgia) collection is imported with source revision and original links preserved; its collection is CC0-1.0. New entries use English descriptions from current GitHub metadata where available. Existing editorial summaries and limitations are preserved. This is an independent catalog; no affiliation is implied.

TradeDesk, RepoHub, MeetNotes, and the Osiris fork are curator-maintained repositories, disclosed and marked Experimental. Inclusion does not mean independent validation. This catalog has no paid placement or affiliate links.

## Privacy and limitations

Saved projects stay in browser local storage. There is no analytics, cloud sync, or account system. Fonts load from Google Fonts. Opening a project or a prefilled suggestion takes you to GitHub. Provider charges, privacy policies, platform support, and model requirements can change; check original documentation before installation.

The listed tools have not been installed or workflow-tested by this catalog. The catalog's own behavior is covered by automated DOM tests; visual desktop/mobile review remains a separate check. See [REVIEW.md](REVIEW.md).

## License

[MIT](LICENSE) for this catalog's original code and editorial text. Linked repositories, fonts, trademarks, and other third-party materials retain their own licenses and rights. Restricted or unconfirmed project licenses are identified in the dataset and detail views.
`;
const expected = intro + sections + end;
const file = path.join(root, 'README.md');
if (process.argv.includes('--check')) {
  if (fs.readFileSync(file, 'utf8').replace(/\r\n/g,'\n') !== expected) { console.error('README is out of date. Run node scripts/build-readme.cjs'); process.exit(1); }
  console.log(`README matches ${projects.length} projects in ${categories.length} categories.`);
} else { fs.writeFileSync(file, expected); console.log(`Generated README with ${projects.length} projects.`); }
