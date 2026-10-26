'use strict';

const icons = {
  grid: '<rect x="3" y="3" width="7" height="7" rx="1.3"/><rect x="14" y="3" width="7" height="7" rx="1.3"/><rect x="3" y="14" width="7" height="7" rx="1.3"/><rect x="14" y="14" width="7" height="7" rx="1.3"/>',
  bookmark: '<path d="M6 4h12v17l-6-4-6 4z"/>',
  workflow: '<rect x="3" y="3" width="6" height="6" rx="1"/><rect x="15" y="15" width="6" height="6" rx="1"/><path d="M6 9v9h9M9 6h9v9"/>',
  book: '<path d="M12 5v16M3 4c4-1 7 0 9 2 2-2 5-3 9-2v15c-4-1-7 0-9 2-2-2-5-3-9-2z"/>',
  search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4.5 4.5"/>',
  download: '<path d="M12 3v12m-4-4 4 4 4-4M4 16v5h16v-5"/>',
  filter: '<path d="M4 6h16M7 12h10M10 18h4"/><circle cx="8" cy="6" r="2" fill="white"/><circle cx="16" cy="12" r="2" fill="white"/>',
  arrow: '<path d="M5 12h14m-5-5 5 5-5 5"/>',
  external: '<path d="M14 3h7v7m0-7L10 14M10 4H4v16h16v-6"/>',
  star: '<path d="m12 3 2.8 5.8 6.4.9-4.6 4.5 1.1 6.4-5.7-3-5.7 3 1.1-6.4-4.6-4.5 6.4-.9z"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  circleCheck: '<circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/>',
  compare: '<path d="M8 3v18M16 3v18M4 8h8m0 8h8"/>',
  key: '<circle cx="8" cy="8" r="4"/><path d="m11 11 9 9m-3-3 3-3m-6 0 3-3"/>',
  monitor: '<rect x="3" y="4" width="18" height="13" rx="1.5"/><path d="M8 21h8m-4-4v4"/>',
  close: '<path d="m6 6 12 12M18 6 6 18"/>',
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  copy: '<rect x="8" y="8" width="12" height="13" rx="1"/><path d="M16 8V3H3v13h5"/>'
};
const icon = name => `<svg viewBox="0 0 24 24" aria-hidden="true">${icons[name] || icons.grid}</svg>`;
const $ = id => document.getElementById(id);
const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const formatStars = value => value >= 1000 ? `${(value / 1000).toFixed(1).replace(/\.0$/, '')}k` : String(value);
const readStorage = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } };
const storedSaved = readStorage('repohub-catalog-saved-v1', []);
const state = {
  projects: [], screen: 'catalog', collection: 'all', category: '', query: '', platform: '', runtime: '',
  noApi: false, noGpu: false, readmeOnly: false, sort: 'curated', limit: 12,
  saved: new Set(Array.isArray(storedSaved) ? storedSaved.filter(x => typeof x === 'string') : []), compare: new Set()
};
let toastTimeout;
let detailOpener;
const taskNames = {
  Coding: 'Write & understand code', Design: 'Design an interface', 'Video & audio': 'Create video & audio',
  Research: 'Research & learn', Automation: 'Automate a task', Marketing: 'Market a product',
  Productivity: 'Work more effectively', Writing: 'Write & edit', Finance: 'Explore financial AI', Security: 'Review security'
};
const workflows = [
  { id:'website', title:'Build a considered website', summary:'Go from a clear brief to a working interface, then review the design and the implementation separately.', tools:['garrytan/gstack','pbakaus/impeccable','benjitaylor/agentation'], outcome:'A working page, an annotated review, and a list of changes you can verify.',
    steps:[['Define the job.','Write the audience, the one action the page should support, the content, and a measurable definition of done. Use gstack to question the plan before building.'],['Build and critique.','Work in a separate project branch with your coding assistant. Use Impeccable to review hierarchy, typography, accessibility, and responsive behavior.'],['Make feedback precise.','If your project uses React, add Agentation in development and annotate the actual elements you want changed. Test the revised page on desktop and mobile.']],
    caveat:'Requires a coding assistant. Agentation needs React 18+ and has a restricted license. These tools do not automatically verify every accessibility requirement.' },
  { id:'research', title:'Research a topic with traceable sources', summary:'Combine recent discussions with original sources, then turn the findings into an answer you can check.', tools:['mvanhorn/last30days-skill','Panniantong/Agent-Reach','hardikpandya/stop-slop'], outcome:'A concise briefing with source links, publication dates, uncertainties, and a clear separation of evidence and opinion.',
    steps:[['Ask a bounded question.','Specify your topic, audience, time window, and what a useful answer would change. Use Last 30 Days to gather recent discussions.'],['Check the originals.','Use Agent Reach where supported to read the linked material. Verify important claims against original documentation or primary sources, and keep the links.'],['Synthesize and edit.','Write the answer with its evidence and uncertainty attached. Use Stop Slop as an editorial pass, then check that editing has preserved the meaning and citations.']],
    caveat:'Platform access and provider costs vary. Recent social discussion can be unrepresentative; an agent-generated summary still needs source checking.' },
  { id:'video', title:'Turn a product into a short launch video', summary:'Start with a real product moment and a small script. Make the video around what the product actually does.', tools:['heygen-com/hyperframes','latent-spaces/brag','jamiepine/voicebox'], outcome:'A short product demonstration with a reviewed script, deliberate pacing, and an export ready to watch.',
    steps:[['Choose one story.','Write the audience, the problem, the product moment, and the final action. Capture real footage or screenshots; remove private data.'],['Compose the first cut.','Use Brag for an initial project-to-video workflow, or compose directly in HyperFrames for more control over layout and timing. Check the current setup docs before installing.'],['Add sound and inspect the export.','If useful, create narration in Voicebox using a voice you have permission to use. Review the final rendered video for legibility, timing, audio levels, and factual claims.']],
    caveat:'Media services can add API costs and model downloads. Hardware needs vary. Check licenses for every image, voice, music track, and font used.' }
];

function toast(message) {
  clearTimeout(toastTimeout); $('toast').textContent = message; $('toast').hidden = false;
  toastTimeout = setTimeout(() => { $('toast').hidden = true; }, 3400);
}
function persistSaved() {
  try { localStorage.setItem('repohub-catalog-saved-v1', JSON.stringify([...state.saved])); }
  catch { toast('Saved for this visit. Browser storage is unavailable.'); }
}
function getProject(id) { return state.projects.find(p => p.id === id); }
function closeMenu() { $('sidebar').classList.remove('open'); $('menu-toggle').setAttribute('aria-expanded','false'); $('menu-toggle').setAttribute('aria-label','Open navigation'); }
function navigate(screen) { location.hash = screen; if (state.screen === screen) renderScreen(); closeMenu(); }
function hasFilters() { return !!(state.query || state.category || state.platform || state.runtime || state.noApi || state.noGpu || state.readmeOnly || state.collection !== 'all'); }
function resetFilters() {
  Object.assign(state, {query:'',category:'',platform:'',runtime:'',noApi:false,noGpu:false,readmeOnly:false,collection:'all',limit:12});
  syncFilters(); renderCatalog();
}
function syncFilters() {
  for (const [id,key] of [['search','query'],['platform','platform'],['runtime','runtime'],['sort','sort']]) $(id).value=state[key];
  for (const [id,key] of [['no-api','noApi'],['no-gpu','noGpu'],['readme-only','readmeOnly']]) $(id).checked=state[key];
  if (state.noApi || state.noGpu || state.readmeOnly) { $('extra-filters').hidden=false; $('more-filters').setAttribute('aria-expanded','true'); }
}
function getFiltered() {
  const terms = state.query.toLowerCase().trim().split(/\s+/).filter(Boolean);
  const list = state.projects.filter(p => {
    if (state.screen === 'saved' && !state.saved.has(p.id)) return false;
    if (state.collection === 'featured' && !p.featured) return false;
    if (state.collection === 'experimental' && !p.experimental) return false;
    if (state.category && p.category !== state.category) return false;
    if (state.platform && !p.platforms.includes(state.platform)) return false;
    if (state.runtime && p.execution !== state.runtime) return false;
    if (state.noApi && p.api !== 'No') return false;
    if (state.noGpu && !['No','Optional'].includes(p.gpu)) return false;
    if (state.readmeOnly && p.review !== 'README reviewed') return false;
    const haystack = `${p.name} ${p.repo} ${p.category} ${p.summary} ${p.bestFor} ${p.execution} ${p.platforms.join(' ')}`.toLowerCase();
    return terms.every(term => haystack.includes(term));
  });
  if (state.sort==='stars') list.sort((a,b)=>b.stars-a.stars);
  if (state.sort==='name') list.sort((a,b)=>a.name.localeCompare(b.name));
  if (state.sort==='updated') list.sort((a,b)=>b.updated.localeCompare(a.updated));
  if (state.sort==='curated') list.sort((a,b)=>Number(b.featured)-Number(a.featured) || Number(a.experimental)-Number(b.experimental));
  return list;
}
function renderCard(p) {
  const saved=state.saved.has(p.id), compared=state.compare.has(p.id);
  const os=p.platforms.includes('Windows') ? 'Windows' : p.platforms[0];
  return `<article class="project-card" data-project="${escapeHTML(p.id)}">
    <div class="card-top"><span class="project-avatar" aria-hidden="true">${escapeHTML(p.name.replace(/[^a-zA-Z]/g,'').slice(0,2))}</span><div class="project-identity"><h2><button class="project-name" data-detail="${escapeHTML(p.id)}">${escapeHTML(p.name)}</button></h2><span class="project-owner">${escapeHTML(p.repo.split('/')[0])}</span></div><button class="icon-button ${saved?'is-saved':''}" data-save="${escapeHTML(p.id)}" aria-label="${saved?'Remove':'Save'} ${escapeHTML(p.name)}${saved?' from collection':''}" aria-pressed="${saved}">${icon('bookmark')}</button></div>
    <p class="card-description">${escapeHTML(p.summary)}</p>
    <div class="card-tags"><span class="tag">${escapeHTML(p.category)}</span><span class="tag">${escapeHTML(p.execution)}</span>${p.experimental?'<span class="tag experimental">Experimental</span>':''}${p.authorProject?'<span class="tag author">By the curator</span>':''}</div>
    <div class="requirements"><span>${icon('monitor')}${escapeHTML(os)}${p.platforms.length>1?' +'+(p.platforms.length-1):''}</span><span>${icon('key')}${p.api==='No'?'No API key':p.api==='Required'?'API / account required':p.api==='Optional'?'API optional':'API varies'}</span></div>
    <div class="card-meta"><span class="review-mark">${icon(p.review==='README reviewed'?'circleCheck':'book')}${escapeHTML(p.review)}</span><span class="stars" title="${p.stars.toLocaleString()} GitHub stars, checked October 25, 2026">${icon('star')}${formatStars(p.stars)}</span></div>
    <div class="card-footer"><button class="detail-link" data-detail="${escapeHTML(p.id)}">View details ${icon('arrow')}</button><button class="compare-toggle" data-compare="${escapeHTML(p.id)}" aria-pressed="${compared}" aria-label="${compared?'Remove':'Add'} ${escapeHTML(p.name)} ${compared?'from':'to'} comparison">${icon(compared?'check':'compare')}${compared?'Selected':'Compare'}</button></div>
  </article>`;
}
function renderCategories() {
  const counts=state.projects.reduce((acc,p)=>(acc[p.category]=(acc[p.category]||0)+1,acc),{});
  $('category-nav').innerHTML=Object.entries(taskNames).filter(([key])=>counts[key]).map(([key,label])=>`<button data-category="${escapeHTML(key)}" class="${state.category===key?'active':''}" aria-pressed="${state.category===key}"><span>${escapeHTML(label)}</span><span>${counts[key]}</span></button>`).join('');
}
function renderCatalog() {
  const list=getFiltered(), saved=state.screen==='saved';
  $('catalog-title').textContent=saved?'Your saved collection.':'Find your next useful tool.';
  $('catalog-intro').textContent=saved?'A shortlist to come back to. Saved in this browser, without an account.':'AI tools and agent skills, with the details that matter before you install.';
  $('project-summary').textContent=`${saved?state.projects.filter(p=>state.saved.has(p.id)).length:state.projects.length} projects · ${new Set(state.projects.map(p=>p.category)).size} categories`;
  $('all-count').textContent=saved?state.projects.filter(p=>state.saved.has(p.id)).length:state.projects.length;
  $('workflow-banner').hidden=saved;
  $('results-count').textContent=`${list.length} ${list.length===1?'project':'projects'}${hasFilters()?' match':' to explore'}`;
  $('clear-filters').hidden=!hasFilters();
  $('project-grid').innerHTML=list.slice(0,state.limit).map(renderCard).join('');
  $('empty-state').hidden=list.length>0;
  $('empty-state').querySelector('h2').textContent=saved && !state.saved.size?'Your collection starts here.':'No projects match yet.';
  $('empty-state').querySelector('p').textContent=saved && !state.saved.size?'Save a project from the catalog to keep it here.':'Try a broader search or remove a filter.';
  $('empty-reset').textContent=saved && !state.saved.size?'Explore the catalog':'Reset filters';
  $('load-more').hidden=list.length<=state.limit;
  $('shown-count').textContent=list.length?`Showing ${Math.min(state.limit,list.length)} of ${list.length} projects`:'';
  document.querySelectorAll('[data-collection]').forEach(b=>{const active=b.dataset.collection===state.collection;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});
  const chips=[];
  if(state.category) chips.push(['category',state.category]);
  if(state.platform) chips.push(['platform',state.platform]);
  if(state.runtime) chips.push(['runtime',state.runtime]);
  if(state.noApi) chips.push(['noApi','No API key']);
  if(state.noGpu) chips.push(['noGpu','No mandatory GPU']);
  if(state.readmeOnly) chips.push(['readmeOnly','README reviewed']);
  $('active-filters').innerHTML=chips.map(([key,value])=>`<button class="filter-chip" data-remove-filter="${key}" aria-label="Remove ${escapeHTML(value)} filter">${escapeHTML(value)} <span aria-hidden="true">×</span></button>`).join('');
  renderCategories(); renderCompareTray();
}
function renderCompareTray() {
  $('compare-tray').hidden=state.compare.size===0;
  $('compare-count').textContent=`${state.compare.size} of 3 selected`;
  $('compare-names').textContent=[...state.compare].map(id=>getProject(id)?.name).filter(Boolean).join(' · ');
  $('compare-open').disabled=state.compare.size<2;
}
function renderScreen() {
  state.screen=['catalog','saved','workflows','about'].includes(location.hash.slice(1))?location.hash.slice(1):'catalog';
  $('catalog-screen').hidden=!['catalog','saved'].includes(state.screen);
  $('workflows-screen').hidden=state.screen!=='workflows';
  $('about-screen').hidden=state.screen!=='about';
  $('breadcrumb-current').textContent={catalog:'Explore',saved:'Saved collection',workflows:'Starter workflows',about:'How we review'}[state.screen];
  document.querySelectorAll('[data-nav]').forEach(a=>{const active=a.dataset.nav===state.screen;a.classList.toggle('active',active);if(active)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});
  if(['catalog','saved'].includes(state.screen))renderCatalog();
  closeMenu();
}
function toggleSave(id) {
  const p=getProject(id); if(!p)return;
  state.saved.has(id)?state.saved.delete(id):state.saved.add(id);persistSaved();
  const isSaved=state.saved.has(id);
  toast(isSaved?`${p.name} saved to your collection.`:`${p.name} removed from your collection.`);
  renderCatalog();
  if($('detail-dialog').open) document.querySelectorAll('#detail-dialog [data-save]').forEach(b=>{b.innerHTML=icon('bookmark')+(isSaved?' Saved':' Save project');b.setAttribute('aria-pressed',String(isSaved));});
}
function toggleCompare(id) {
  if(state.compare.has(id))state.compare.delete(id);
  else {if(state.compare.size>=3){toast('Compare up to 3 projects. Remove one to add another.');return;}state.compare.add(id);}
  renderCatalog();
}
function openDetail(id, opener) {
  const p=getProject(id); if(!p)return;
  detailOpener=opener;
  const paid=p.api==='No'?'No API key is required for the described local workflow. Hardware, electricity, and optional services still have costs.':p.api==='Required'?'A model API key or supported assistant account is required. Provider subscriptions and usage charges are separate from the project’s source-code license.':'Some workflows can run without a paid API; optional providers, services, and model downloads may add costs. Check the project’s current documentation.';
  $('detail-content').innerHTML=`<div class="dialog-top"><div class="detail-heading"><span class="project-avatar" aria-hidden="true">${escapeHTML(p.name.replace(/[^a-zA-Z]/g,'').slice(0,2))}</span><div><h2 id="detail-title">${escapeHTML(p.name)}</h2><span class="project-owner">${escapeHTML(p.repo)}</span></div></div><button class="icon-button close-dialog" aria-label="Close project details">${icon('close')}</button></div>
    <p class="detail-summary">${escapeHTML(p.summary)}</p><div class="card-tags"><span class="tag">${escapeHTML(p.category)}</span>${p.experimental?'<span class="tag experimental">Experimental</span>':''}${p.authorProject?'<span class="tag author">Created by this catalog’s curator</span>':''}</div>
    <dl class="detail-facts"><div><dt>Platform</dt><dd>${escapeHTML(p.platforms.join(', '))}</dd></div><div><dt>Runtime</dt><dd>${escapeHTML(p.execution)}</dd></div><div><dt>API / account</dt><dd>${escapeHTML(p.api)}</dd></div><div><dt>GPU</dt><dd>${escapeHTML(p.gpu)}</dd></div><div><dt>License</dt><dd>${escapeHTML(p.license)}</dd></div><div><dt>GitHub stars</dt><dd>${p.stars.toLocaleString()} · Oct 25 snapshot</dd></div></dl>
    <div class="detail-section"><h3>Useful for</h3><p>${escapeHTML(p.bestFor)}</p></div><div class="detail-section"><h3>What to know before installing</h3><p>${escapeHTML(p.limitation)}</p></div><div class="detail-section"><h3>Cost and requirements</h3><p>${escapeHTML(paid)}</p></div>
    <div class="evidence-box"><strong>${icon('book')} ${escapeHTML(p.review)} · October 25, 2026</strong><p>${p.review==='README reviewed'?'The original README and GitHub metadata were checked.':'The project’s GitHub description and metadata were checked.'} Installation and real workflows have not been tested by this catalog. Platform and API fields are editorial guidance; “See docs” and “Varies” mean the requirement is unconfirmed or depends on the configuration.</p></div>
    <div class="detail-actions"><a class="button primary" href="${escapeHTML(p.url)}#readme" target="_blank" rel="noopener noreferrer">Read setup documentation ${icon('external')}</a><button class="button secondary" data-save="${escapeHTML(p.id)}" aria-pressed="${state.saved.has(p.id)}">${icon('bookmark')} ${state.saved.has(p.id)?'Saved':'Save project'}</button></div>
    <div class="detail-section"><h3>Get the source</h3><p>Cloning downloads the code. Follow its setup guide before running it.</p><div class="clone-command"><code>git clone ${escapeHTML(p.url)}.git</code><button class="icon-button" data-copy="${escapeHTML('git clone '+p.url+'.git')}" aria-label="Copy clone command">${icon('copy')}</button></div></div><p class="small-note">Repository last pushed: ${escapeHTML(p.updated)}. This is not a security audit or an endorsement of performance claims.</p>`;
  $('detail-dialog').showModal();
}
function openComparison() {
  const projects=[...state.compare].map(getProject).filter(Boolean);
  if(projects.length<2)return;
  const fields=[['Best for',p=>p.bestFor],['Runtime',p=>p.execution],['Platforms',p=>p.platforms.join(', ')],['API / account',p=>p.api],['GPU',p=>p.gpu],['License',p=>p.license],['Review evidence',p=>p.review+' · Oct 25, 2026'],['Popularity snapshot',p=>p.stars.toLocaleString()+' stars'],['Limitations',p=>p.limitation]];
  $('comparison-content').innerHTML=`<table class="comparison-table"><caption class="sr-only">Requirements and review evidence for selected projects</caption><thead><tr><th scope="col">Compare</th>${projects.map(p=>`<th scope="col">${escapeHTML(p.name)}</th>`).join('')}</tr></thead><tbody>${fields.map(([label,fn])=>`<tr><th scope="row">${label}</th>${projects.map(p=>`<td>${escapeHTML(fn(p))}</td>`).join('')}</tr>`).join('')}<tr><th scope="row">Source</th>${projects.map(p=>`<td><a class="text-button" href="${escapeHTML(p.url)}" target="_blank" rel="noopener noreferrer">Open repository ↗</a></td>`).join('')}</tr></tbody></table>`;
  $('compare-dialog').showModal();
}
function renderWorkflows() {
  $('workflows-screen').innerHTML=`<h1>Start with a goal.</h1><p class="workflow-page-intro">Three suggested paths from a useful question to a finished result. These are editorial guides, not workflows tested by this catalog.</p><div class="workflow-list">${workflows.map(w=>`<article id="workflow-${w.id}" class="workflow-card"><header><h2>${w.title}</h2><span class="tag">Suggested · Not tested here</span></header><p>${w.summary}</p><div class="workflow-tools">${w.tools.map(repo=>{const p=state.projects.find(p=>p.repo.toLowerCase()===repo.toLowerCase());return p?`<button data-detail="${p.id}">${escapeHTML(p.name)} ${icon('arrow')}</button>`:'';}).join('')}</div><ol>${w.steps.map(([title,text])=>`<li><strong>${title}</strong> ${text}</li>`).join('')}</ol><p><strong>What you’ll have:</strong> ${w.outcome}</p><p class="workflow-caution">${w.caveat}</p></article>`).join('')}</div>`;
}
function renderAbout() {
  const count=state.projects.length, reads=state.projects.filter(p=>p.review==='README reviewed').length;
  $('about-screen').innerHTML=`<div class="about-content"><h1>A useful collection, with honest evidence.</h1><p class="about-lead">RepoHub AI Catalog is an independent English-language guide to AI tools and agent skills, curated by Levani Sidiani. The aim is to help you choose something useful and understand what it takes to run it.</p>
    <section class="about-section"><h2>What has actually been reviewed?</h2><p>This draft contains ${count} real projects. ${reads} have had their original README reviewed; the remaining ${count-reads} have had their GitHub description and metadata reviewed. All records were checked on October 25, 2026.</p><dl class="review-levels"><div><dt>Metadata reviewed</dt><dd>We checked the original GitHub description and repository facts. This is a starting point, not verification of the software’s behavior.</dd></div><div><dt>README reviewed</dt><dd>We also read the original project documentation to understand its purpose, requirements, and limitations.</dd></div><div><dt>Installation tested</dt><dd>Reserved for a documented installation on a named operating system, with a date and result. No project has this label yet.</dd></div><div><dt>Workflow tested</dt><dd>Reserved for a real task completed and recorded with its inputs, environment, and limitations. No project has this label yet.</dd></div></dl></section>
    <section class="about-section"><h2>How projects are selected</h2><ul><li>A clear use case related to AI tools, agent skills, or the infrastructure around them.</li><li>An original repository and documentation that explain what the project does.</li><li>A useful distinction from the alternatives, with costs and license restrictions visible.</li><li>No minimum star count. Smaller projects can appear as Experimental; popularity is shown separately.</li><li>Project descriptions are independently written. Author claims and untested requirements are not treated as measured results.</li></ul></section>
    <section class="about-section"><h2>Author projects and independence</h2><p>TradeDesk and RepoHub are created by this catalog’s curator. Both are disclosed as author projects and marked Experimental. Inclusion is not a claim of independent validation. This draft has no paid placement or affiliate links.</p></section>
    <section class="about-section"><h2>Sources and freshness</h2><p>Each project links to its original repository. Star counts and update dates are a dated snapshot, not a live feed. API, GPU, platform, and cost notes are guidance based on available documentation and can change. Always read the current setup guide and license.</p></section>
    <section class="about-section"><h2>What stays on your device</h2><p>Saved projects are stored in this browser’s local storage. There is no account, cloud sync, or analytics in the draft. JSON and CSV export download a file to your device. Suggesting a project prepares a Markdown file and does not send it anywhere. Fonts are served by Google Fonts.</p></section>
    <div class="about-callout"><strong>Built alongside RepoHub.</strong><p>The catalog helps you discover and compare projects. The RepoHub desktop app manages repositories and developer tools. Export is available here; a direct import connection to the app is a future feature.</p><a class="text-button" href="https://github.com/levanis-design/RepoHub" target="_blank" rel="noopener noreferrer">Explore RepoHub ↗</a></div>
    <section class="about-section"><h2>Credit where it’s due</h2><p>Inspired by <a class="text-button" href="https://github.com/tornikebolokadze1-cyber/awesome-ai-pulse-georgia" target="_blank" rel="noopener noreferrer">AI Pulse Georgia</a> and the maintainers who share their work. This is an independent project, with no affiliation implied. The listed projects retain their own licenses and trademarks.</p></section></div>`;
}
function downloadFile(filename, content, type) {
  const blob=new Blob([content],{type}), url=URL.createObjectURL(blob), a=document.createElement('a');
  a.href=url;a.download=filename;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function exportCollection(format) {
  const projects=getFiltered();
  if(!projects.length){toast('There are no projects to export.');return;}
  if(format==='json') downloadFile('repohub-collection.json',JSON.stringify({schemaVersion:1,exportedAt:new Date().toISOString(),catalogReviewedAt:'2026-10-25',projects},null,2),'application/json');
  else {
    const fields=['name','repo','url','category','execution','platforms','api','gpu','license','review','reviewedAt','summary','limitation'];
    const cell=value=>{let s=Array.isArray(value)?value.join('; '):String(value??'');if(/^[=+@-]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"';};
    const csv=[fields.map(cell).join(','),...projects.map(p=>fields.map(f=>cell(p[f])).join(','))].join('\r\n');
    downloadFile('repohub-collection.csv','\ufeff'+csv,'text/csv;charset=utf-8');
  }
  $('export-dialog').close();toast(`Exported ${projects.length} projects as ${format.toUpperCase()}.`);
}
async function copyText(value) {
  try { await navigator.clipboard.writeText(value);toast('Copied to clipboard.'); }
  catch {toast('Clipboard is unavailable. Select and copy the visible command.');}
}
function setupEvents() {
  document.addEventListener('click',event=>{
    const b=event.target.closest('button,a');if(!b)return;
    if(b.dataset.detail){openDetail(b.dataset.detail,b);return;}
    if(b.dataset.save){toggleSave(b.dataset.save);return;}
    if(b.dataset.compare){toggleCompare(b.dataset.compare);return;}
    if(b.dataset.copy){copyText(b.dataset.copy);return;}
    if(b.classList.contains('close-dialog')){b.closest('dialog').close();return;}
    if(b.dataset.category){state.category=state.category===b.dataset.category?'':b.dataset.category;state.limit=12;if(state.screen!=='catalog')navigate('catalog');else renderCatalog();closeMenu();return;}
    if(b.dataset.collection){state.collection=b.dataset.collection;state.limit=12;renderCatalog();return;}
    if(b.dataset.removeFilter){const key=b.dataset.removeFilter;state[key]=typeof state[key]==='boolean'?false:'';syncFilters();state.limit=12;renderCatalog();return;}
    if(b.dataset.go){navigate(b.dataset.go);return;}
    if(b.dataset.workflow){navigate('workflows');requestAnimationFrame(()=>$('workflow-'+b.dataset.workflow)?.scrollIntoView({behavior:'smooth',block:'start'}));}
  });
  $('search').addEventListener('input',()=>{state.query=$('search').value;state.limit=12;renderCatalog();});
  for(const [id,key] of [['platform','platform'],['runtime','runtime'],['sort','sort']]) $(id).addEventListener('change',()=>{state[key]=$(id).value;state.limit=12;renderCatalog();});
  for(const [id,key] of [['no-api','noApi'],['no-gpu','noGpu'],['readme-only','readmeOnly']]) $(id).addEventListener('change',()=>{state[key]=$(id).checked;state.limit=12;renderCatalog();});
  $('filter-form').addEventListener('submit',e=>e.preventDefault());
  $('more-filters').addEventListener('click',()=>{const open=$('extra-filters').hidden;$('extra-filters').hidden=!open;$('more-filters').setAttribute('aria-expanded',String(open));});
  $('clear-filters').addEventListener('click',resetFilters);
  $('empty-reset').addEventListener('click',()=>{if(state.screen==='saved'&&!state.saved.size){resetFilters();navigate('catalog');}else resetFilters();});
  $('load-more').addEventListener('click',()=>{state.limit+=12;renderCatalog();});
  $('compare-clear').addEventListener('click',()=>{state.compare.clear();renderCatalog();});
  $('compare-open').addEventListener('click',openComparison);
  $('export-button').addEventListener('click',()=>{const count=getFiltered().length;$('export-description').textContent=`Download ${count} ${count===1?'project':'projects'} from ${state.screen==='saved'?'your saved collection':'the current filtered results'}, including requirements, source links, and review notes.`;$('export-json').disabled=!count;$('export-csv').disabled=!count;$('export-dialog').showModal();});
  $('export-json').addEventListener('click',()=>exportCollection('json'));
  $('export-csv').addEventListener('click',()=>exportCollection('csv'));
  $('suggest-button').addEventListener('click',()=>$('suggest-dialog').showModal());
  $('suggest-form').addEventListener('submit',e=>{e.preventDefault();const url=$('suggest-url').value.trim(), reason=$('suggest-reason').value.trim();if(!/^https:\/\/github\.com\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+\/?$/.test(url)||!reason){toast('Enter a GitHub repository and a reason.');return;}downloadFile('project-suggestion.md',`# Project suggestion\n\nRepository: ${url}\n\n## Why it is useful\n\n${reason}\n\nInvolved in project: ${$('suggest-author').checked?'Yes':'No'}\n`,'text/markdown');$('suggest-dialog').close();toast('Suggestion downloaded. Nothing was sent automatically.');});
  $('menu-toggle').addEventListener('click',()=>{const open=$('sidebar').classList.toggle('open');$('menu-toggle').setAttribute('aria-expanded',String(open));$('menu-toggle').setAttribute('aria-label',open?'Close navigation':'Open navigation');});
  document.addEventListener('click',e=>{if(window.innerWidth<=850&&!e.target.closest('#sidebar,.mobile-header'))closeMenu();});
  document.addEventListener('keydown',e=>{if(e.key==='/'&&!e.ctrlKey&&!e.metaKey&&!document.querySelector('dialog[open]')&&!['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName)){e.preventDefault();if(!['catalog','saved'].includes(state.screen))navigate('catalog');$('search').focus();}if(e.key==='Escape')closeMenu();});
  document.querySelectorAll('dialog').forEach(dialog=>dialog.addEventListener('click',e=>{if(e.target===dialog){const rect=dialog.getBoundingClientRect();if(e.clientX<rect.left||e.clientX>rect.right||e.clientY<rect.top||e.clientY>rect.bottom)dialog.close();}}));
  $('detail-dialog').addEventListener('close',()=>{if(detailOpener?.isConnected)detailOpener.focus();});
  window.addEventListener('hashchange',()=>{renderScreen();window.scrollTo(0,0);});
}
async function init() {
  $('menu-toggle').innerHTML=icon('menu');$('search-icon').innerHTML=icon('search');$('workflow-symbol').innerHTML=icon('workflow');$('empty-icon').innerHTML=icon('search');
  $('export-button').innerHTML=icon('download')+' Export collection';$('more-filters').innerHTML=icon('filter')+' Filters';
  document.querySelectorAll('.close-dialog').forEach(b=>b.innerHTML=icon('close'));
  const nav=[['catalog','grid','Explore catalog'],['saved','bookmark','Saved collection'],['workflows','workflow','Starter workflows'],['about','book','How we review']];
  nav.forEach(([key,glyph,label])=>document.querySelector(`[data-nav="${key}"]`).innerHTML=icon(glyph)+label);
  try {
    const response=await fetch('catalog.json');if(!response.ok)throw new Error('Catalog request failed');
    const data=await response.json();if(!Array.isArray(data.projects)||!data.projects.length)throw new Error('Catalog is empty');
    state.projects=data.projects;
    const params=new URLSearchParams(location.search);state.query=params.get('q')||'';const category=params.get('category');if(Object.hasOwn(taskNames,category))state.category=category;
    state.saved=new Set([...state.saved].filter(id=>getProject(id)));
    setupEvents();renderWorkflows();renderAbout();syncFilters();$('loading').hidden=true;renderScreen();
  } catch(error) {
    console.error(error);$('loading').innerHTML='<h1>The catalog couldn’t load.</h1><p>Check your connection, then reload the page. Your saved collection remains in this browser.</p><button class="button secondary" id="retry-load">Try again</button>';$('retry-load').addEventListener('click',()=>location.reload());
  }
}
init();
