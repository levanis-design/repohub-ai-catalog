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
  assert.equal(catalog.projects.length, 38);
  assert.equal(new Set(catalog.projects.map(p => p.id)).size, 38);
  for (const p of catalog.projects) {
    assert.match(p.url, /^https:\/\/github\.com\/[\w.-]+\/[\w.-]+$/);
    assert.equal(p.url, 'https://github.com/' + p.repo);
    assert.ok(['Metadata reviewed', 'README reviewed'].includes(p.review));
    assert.ok(Number.isInteger(p.stars) && p.stars >= 0);
    assert.ok(p.summary && p.limitation && p.bestFor);
    assert.equal(p.reviewedAt, '2026-10-25');
    if (p.repo.startsWith('levanis-design/')) { assert.equal(p.authorProject, true); assert.equal(p.experimental, true); }
  }
});

test('first load renders 12 real projects and source-derived counts', async t => {
  const a = await app(); t.after(a.cleanup);
  assert.equal(a.$('loading').hidden, true);
  assert.equal(a.w.document.querySelectorAll('.project-card').length, 12);
  assert.match(a.$('results-count').textContent, /38 projects/);
  assert.equal(a.w.document.querySelector('[data-nav=catalog]').getAttribute('aria-current'), 'page');
  assert.deepEqual(a.errors, []);
});

test('search matches all query words, supports an empty result, and resets', async t => {
  const a = await app(); t.after(a.cleanup);
  a.input('search', 'local portfolio');
  assert.match(a.$('results-count').textContent, /1 project/);
  assert.match(a.$('project-grid').textContent, /TradeDesk/);
  a.input('search', 'no-such-project-123');
  assert.equal(a.$('empty-state').hidden, false);
  a.$('empty-reset').click();
  assert.match(a.$('results-count').textContent, /38 projects/);
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
  assert.match(a.$('results-count').textContent, /10 projects/);
  a.$('clear-filters').click();
  a.w.document.querySelector('[data-collection=experimental]').click();
  assert.match(a.$('results-count').textContent, /5 projects/);
  assert.equal(a.w.document.querySelectorAll('.project-card .tag.experimental').length, 5);
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
  assert.match(a.$('detail-content').textContent, /Created by this catalog/);
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
  a.w.document.querySelector('[data-category=Finance]').click(); assert.match(a.$('results-count').textContent,/3 projects/);
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
