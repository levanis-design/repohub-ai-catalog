const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM, VirtualConsole } = require('jsdom');
const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'dist/index.html'), 'utf8');
const source = fs.readFileSync(path.join(root, 'dist/app.js'), 'utf8');
const catalog = JSON.parse(fs.readFileSync(path.join(root, 'dist/catalog.json'), 'utf8'));

async function app(options = {}) {
  const errors = [], downloads = [];
  const console = new VirtualConsole();
  console.on('error', e => errors.push(e));
  const dom = new JSDOM(html, { url: options.url || 'http://localhost:4178/', runScripts: 'outside-only', pretendToBeVisual: true, virtualConsole: console });
  const w = dom.window;
  w.fetch = async () => ({ ok: true, json: async () => structuredClone(options.data || catalog) });
  w.scrollTo = () => {};
  w.HTMLElement.prototype.scrollIntoView = () => {};
  w.HTMLDialogElement.prototype.showModal = function () { this.open = true; };
  w.HTMLDialogElement.prototype.close = function () { this.open = false; this.dispatchEvent(new w.Event('close')); };
  w.Blob = Blob;
  w.URL.createObjectURL = blob => { downloads.push(blob); return 'blob:test'; };
  w.URL.revokeObjectURL = () => {};
  w.document.addEventListener('click', e => { if (e.target.closest('a[download]')) e.preventDefault(); });
  if (options.saved) w.localStorage.setItem('repohub-catalog-saved-v1', options.saved);
  w.eval(source);
  await new Promise(resolve => setImmediate(resolve));
  const $ = id => w.document.getElementById(id);
  const input = (id, value) => { $(id).value = value; $(id).dispatchEvent(new w.Event('input', { bubbles: true })); };
  const change = (id, value) => { if (typeof value === 'boolean') $(id).checked = value; else $(id).value = value; $(id).dispatchEvent(new w.Event('change', { bubbles: true })); };
  return { dom, w, $, input, change, errors, downloads, cleanup: () => w.close() };
}

test('dataset: unique real source links, honest review levels, and author disclosures', () => {
  assert.ok(catalog.projects.length >= 62);
  assert.equal(new Set(catalog.projects.map(p => p.id)).size, catalog.projects.length);
  const repos=catalog.projects.filter(p=>!p.isResource);
  assert.equal(new Set(repos.map(p => p.repo.toLowerCase())).size, repos.length);
  for (const p of catalog.projects) {
    if(!p.isResource){assert.match(p.url, /^https:\/\/github\.com\/[\w.-]+\/[\w.-]+$/);assert.equal(p.url, 'https://github.com/' + p.repo);}
    assert.ok(['Metadata reviewed', 'README reviewed','Reference imported','Metadata pending'].includes(p.review));
    assert.ok(p.isResource || p.metadataStatus==='unavailable' ? p.stars===null || Number.isInteger(p.stars) : Number.isInteger(p.stars) && p.stars >= 0);
    assert.ok(p.summary && p.limitation && p.bestFor);
    assert.match(p.reviewedAt, /^\d{4}-\d{2}-\d{2}$/);
    if (p.repo.startsWith('levanis-design/')) { assert.equal(p.authorProject, true); assert.equal(p.experimental, true); }
  }
});

test('first load renders 12 real projects and source-derived counts', async t => {
  const a = await app(); t.after(a.cleanup);
  assert.equal(a.$('loading').hidden, true);
  assert.equal(a.w.document.querySelectorAll('.project-card').length, 12);
  assert.match(a.$('results-count').textContent, new RegExp(catalog.projects.length+' projects'));
  assert.equal(a.w.document.querySelector('[data-nav=catalog]').getAttribute('aria-current'), 'page');
  assert.deepEqual(a.errors, []);
});

test('search matches all query words, supports an empty result, and resets', async t => {
  const a = await app(); t.after(a.cleanup);
  a.input('search', 'levanis-design/tradedesk portfolio');
  assert.match(a.$('results-count').textContent, /1 project/);
  assert.match(a.$('project-grid').textContent, /TradeDesk/);
  a.input('search', 'no-such-project-123');
  assert.equal(a.$('empty-state').hidden, false);
  a.$('empty-reset').click();
  assert.match(a.$('results-count').textContent, new RegExp(catalog.projects.length+' projects'));
});

test('platform, runtime, API, and GPU filters combine correctly', async t => {
  const a = await app(); t.after(a.cleanup);
  a.change('platform', 'Windows'); a.change('runtime', 'Local app');
  a.change('no-api', true); a.change('no-gpu', true);
  assert.match(a.$('project-grid').textContent, /TradeDesk/);
  assert.equal(a.w.document.querySelectorAll('.project-card').length, 1);
  assert.equal(a.w.document.querySelectorAll('.filter-chip').length, 4);
  a.w.document.querySelector('[data-remove-filter=runtime]').click();
  assert.equal(a.$('runtime').value, '');
});

test('README evidence filter and experimental collection show the intended records', async t => {
  const a = await app(); t.after(a.cleanup);
  a.change('readme-only', true);
  assert.equal(a.w.document.querySelectorAll('.project-card').length,12);
  assert.match(a.$('results-count').textContent, /16 projects/);
  a.$('clear-filters').click();
  a.w.document.querySelector('[data-collection=experimental]').click();
  const expected=catalog.projects.filter(p=>p.experimental).length;
  assert.match(a.$('results-count').textContent, new RegExp(expected+' projects'));
  assert.equal(a.w.document.querySelectorAll('.project-card .tag.experimental').length,Math.min(12,expected));
});

test('saving persists in local storage and saved collection can be emptied', async t => {
  const a = await app(); t.after(a.cleanup);
  const id = a.w.document.querySelector('[data-save]').dataset.save;
  a.w.document.querySelector('[data-save]').click();
  assert.deepEqual(JSON.parse(a.w.localStorage.getItem('repohub-catalog-saved-v1')), [id]);
  a.w.location.hash = 'saved';
  await new Promise(resolve => a.w.setTimeout(resolve, 0));
  assert.equal(a.w.document.querySelectorAll('.project-card').length, 1);
  a.w.document.querySelector('#project-grid [data-save]').click();
  assert.equal(a.$('empty-state').hidden, false);
  assert.match(a.$('empty-state').textContent, /Your collection starts here/);
});

test('comparison caps at three projects and uses selected project requirements', async t => {
  const a = await app(); t.after(a.cleanup);
  for (let i=0; i<4; i++) a.w.document.querySelectorAll('[data-compare]')[i].click();
  assert.match(a.$('compare-count').textContent, /3 of 3/);
  assert.match(a.$('toast').textContent, /up to 3/);
  a.$('compare-open').click();
  assert.equal(a.$('compare-dialog').open, true);
  assert.equal(a.w.document.querySelectorAll('.comparison-table thead th').length, 4);
  assert.match(a.$('comparison-content').textContent, /API \/ account/);
  a.$('compare-dialog').close(); a.$('compare-clear').click();
  assert.equal(a.$('compare-tray').hidden, true);
});

test('details contain source-specific limitations, real clone command, and no fake tested claim', async t => {
  const a = await app(); t.after(a.cleanup);
  a.input('search', 'TradeDesk'); a.w.document.querySelector('[data-detail]').click();
  assert.equal(a.$('detail-dialog').open, true);
  assert.match(a.$('detail-content').textContent, /Maintained by this catalog/);
  assert.match(a.$('detail-content').textContent, /not been tested/);
  assert.match(a.$('detail-content').textContent, /git clone https:\/\/github.com\/levanis-design\/TradeDesk.git/);
});

test('export downloads precisely the current filtered result as JSON and CSV', async t => {
  const a = await app(); t.after(a.cleanup);
  a.input('search', 'TradeDesk'); a.$('export-button').click(); a.$('export-json').click();
  const data = JSON.parse(await a.downloads[0].text());
  assert.equal(data.projects.length, 1); assert.equal(data.projects[0].name, 'TradeDesk');
  assert.equal(data.schemaVersion, 1);
  a.$('export-button').click(); a.$('export-csv').click();
  const csv=await a.downloads[1].text(); assert.match(csv,/TradeDesk/); assert.equal(csv.split('\r\n').length,2);
});

test('star sorting, pagination, category selection, and URL query initialization work', async t => {
  const a = await app(); t.after(a.cleanup);
  a.change('sort', 'stars');
  const expected=[...catalog.projects].sort((a,b)=>b.stars-a.stars)[0];
  assert.equal(a.w.document.querySelector('.project-card').dataset.project, expected.id);
  a.$('load-more').click(); assert.equal(a.w.document.querySelectorAll('.project-card').length,24);
  a.w.document.querySelector('[data-category="Finance AI"]').click(); assert.match(a.$('results-count').textContent,new RegExp(catalog.projects.filter(p=>p.category==='Finance AI').length+' projects'));
  const b=await app({url:'http://localhost:4178/?q=hyperframes'});t.after(b.cleanup);
  assert.equal(b.$('search').value,'hyperframes');assert.match(b.$('project-grid').textContent,/HyperFrames/);
});

test('untrusted text renders as text, and malformed saved storage does not crash', async t => {
  const data=structuredClone(catalog);data.projects[0].summary='<img src=x onerror="alert(1)">';
  const a=await app({data,saved:'{"bad":"shape"}'});t.after(a.cleanup);
  assert.equal(a.w.document.querySelector('#project-grid img'),null);
  assert.match(a.$('project-grid').textContent,/<img/);
  assert.deepEqual(a.errors,[]);
});

test('workflows, mobile navigation, and suggestion download are functional', async t => {
  const a=await app();t.after(a.cleanup);
  assert.equal(a.w.document.querySelectorAll('.workflow-card').length,3);
  a.$('menu-toggle').click();assert.equal(a.$('menu-toggle').getAttribute('aria-expanded'),'true');
  a.$('suggest-button').click();a.$('suggest-url').value='https://github.com/owner/project';a.$('suggest-reason').value='A useful example.';
  a.$('suggest-form').dispatchEvent(new a.w.Event('submit',{bubbles:true,cancelable:true}));
  assert.match(await a.downloads[0].text(),/A useful example/);
  assert.equal(a.$('suggest-dialog').open,false);
});

test('all original repositories and both added projects are covered exactly once', () => {
  const coverage=JSON.parse(fs.readFileSync(path.join(root,'dist/coverage.json'),'utf8'));
  const known=new Set(catalog.projects.flatMap(p=>[p.repo,...(p.aliases||[])]).map(repo=>repo.toLowerCase()));
  assert.equal(coverage.repositories.length,60);
  assert.equal(coverage.additionalRepositories.length,2);
  for(const r of coverage.repositories) assert.ok(known.has(r.canonical.toLowerCase()),r.submitted+' is missing');
  for(const repo of coverage.additionalRepositories) assert.ok(known.has(repo.toLowerCase()),repo+' is missing');
  for(const alias of [...coverage.websiteAliases,...coverage.nestedSkillLinks]) assert.ok(known.has(alias.repository.toLowerCase()));
});

test('all categories and runtime types are reachable, and supporting resources are labeled', async t => {
  const a=await app();t.after(a.cleanup);
  for(const category of new Set(catalog.projects.map(p=>p.category))) assert.ok([...a.w.document.querySelectorAll('[data-category]')].some(b=>b.dataset.category===category),category+' filter is missing');
  for(const runtime of new Set(catalog.projects.map(p=>p.execution))) assert.ok([...a.$('runtime').options].some(o=>o.value===runtime),runtime+' filter is missing');
  a.input('search','MangoDisk');assert.match(a.$('project-grid').textContent,/Related resource/);
  a.input('search','Osiris');assert.match(a.$('project-grid').textContent,/Fork/);
});

test('GitHub suggestion opens a prefilled issue without submitting it', async t => {
  const a=await app();t.after(a.cleanup);let opened;
  a.w.open=url=>{opened=new URL(url);};
  a.$('suggest-url').value='https://github.com/owner/project';a.$('suggest-reason').value='Useful for research.';
  const event=new a.w.Event('submit',{bubbles:true,cancelable:true});
  Object.defineProperty(event,'submitter',{value:{value:'github'}});
  a.$('suggest-form').dispatchEvent(event);
  assert.equal(opened.origin,'https://github.com');
  assert.equal(opened.pathname,'/levanis-design/repohub-ai-catalog/issues/new');
  assert.match(opened.searchParams.get('body'),/Useful for research/);
  assert.equal(a.downloads.length,0);
});

test('all upstream entries have provenance and no duplicate source URL', () => {
  const upstream=catalog.upstream;
  assert.ok(upstream.listedEntries>=100);
  assert.equal(upstream.coveredEntries,upstream.listedEntries);
  const represented=new Set(catalog.projects.flatMap(p=>(p.sources||[]).filter(s=>s.repository===upstream.repository).map(s=>s.url)));
  for(const url of upstream.sourceUrls) assert.ok(represented.has(url),'Missing upstream entry: '+url);
  assert.equal(new Set(catalog.projects.map(p=>p.url.toLowerCase())).size,catalog.projects.length);
});

test('reference guides render safely and do not offer invalid clone commands', async t => {
  const a=await app();t.after(a.cleanup);
  const resource=catalog.projects.find(p=>p.isResource);
  a.input('search',resource.name);
  const trigger=a.w.document.querySelector(`[data-detail="${resource.id}"]`);
  assert.ok(trigger);trigger.click();
  assert.match(a.$('detail-content').textContent,/reference link/i);
  assert.doesNotMatch(a.$('detail-content').textContent,/git clone/);
  assert.deepEqual(a.errors,[]);
});

test('README separates repository stars and keeps the category overview at two columns', () => {
  const readme=fs.readFileSync(path.join(root,'README.md'),'utf8');
  assert.match(readme,/dist\/assets\/repohub-cover.png/);
  assert.match(readme,/\| Category \| What you will find \|/);
  const repositoryHeader='| Repository | Stars | What it helps with |';
  assert.equal(readme.split(repositoryHeader).length-1,catalog.categories.length);
  let columns=2;
  for(const line of readme.split('\n')) {
    if(!line.startsWith('|')) { columns=2;continue; }
    if(line===repositoryHeader)columns=3;
    assert.equal((line.match(/(?<!\\)\|/g)||[]).length,columns+1,line.slice(0,80));
    if(columns===3 && line.startsWith('| ['))assert.doesNotMatch(line.split(' | ')[0],/<br>|<sub>/);
  }
  // Text-only trademark/copyright symbols are not emoji decoration.
  assert.doesNotMatch(readme,/(?![©®™])\p{Extended_Pictographic}/u);
});

test('refresh dates come from data rather than a fixed label', async t => {
  const data=structuredClone(catalog);data.metadataRefreshedDate='2026-11-02';
  const a=await app({data});t.after(a.cleanup);
  assert.match(a.$('freshness-date').textContent,/November 2, 2026/);
});
