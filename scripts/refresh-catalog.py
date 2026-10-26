"""Import AI Pulse Georgia and refresh GitHub facts without replacing editorial notes.

Usage: GH_TOKEN=... python scripts/refresh-catalog.py
Also supports GITHUB_TOKEN or an authenticated GitHub CLI. Standard library only.
"""
import copy
import datetime as dt
import hashlib
import json
import os
import pathlib
import re
import subprocess
import sys
import urllib.error
import urllib.parse
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parent.parent
UPSTREAM = 'tornikebolokadze1-cyber/awesome-ai-pulse-georgia'
CATALOG = ROOT / 'dist/catalog.json'

CATEGORY_DETAILS = {
 'coding': ('Coding Agents & AI IDEs', 'Coding assistants, AI editors, terminal agents, and autonomous software-development tools.'),
 'orchestration': ('Agent Orchestration', 'Coordinate agent teams, parallel sessions, and multi-agent workspaces.'),
 'plugins': ('Skills, Plugins & Methodologies', 'Reusable agent skills, plugin collections, and structured development methods.'),
 'codeintel': ('Code Intelligence & Context', 'Understand repositories through code graphs, semantic search, and documentation context.'),
 'tokens': ('Tokens, Cost & LLM Gateways', 'Compress context, monitor model spending, and route requests between providers.'),
 'frameworks': ('Agent Frameworks & SDKs', 'Libraries and SDKs for building and running your own AI agents.'),
 'mcp': ('MCP, Protocols & Integrations', 'Connect agents to external tools and services through MCP and related protocols.'),
 'scraping': ('Web, Browser & Computer Use', 'Web search, scraping, browser automation, and desktop or mobile computer use.'),
 'memory': ('Memory, RAG & Documents', 'Persistent memory, retrieval, vector storage, and document processing.'),
 'agentinfra': ('Agent Infra: Sandboxes, Evals & Observability', 'Isolated execution, agent evaluation, tracing, and operational monitoring.'),
 'security': ('AI Security', 'AI-assisted security research, code auditing, and defenses for AI systems.'),
 'infra': ('Inference & Models', 'Model inference engines, local model serving, training tools, and open models.'),
 'workflow': ('No-Code & Workflow Builders', 'Visual automation platforms, workflow builders, and their agent integrations.'),
 'assistants': ('AI Assistants & Chat UIs', 'Personal assistants, persistent bots, and interfaces for cloud or local models.'),
 'business': ('Business & Work Agents', 'Tools for office work, product management, marketing, CRM, and business analysis.'),
 'research': ('Research & Education', 'Research assistants, learning tools, scientific workflows, and knowledge resources.'),
 'finance': ('Finance AI', 'Financial research, trading-agent infrastructure, financial data, and models.'),
 'design': ('Design, UI & Diagrams', 'Interface design, visual feedback, diagramming, and creative-development tools.'),
 'media': ('Media Generation', 'Image and video generation, programmatic editing, and agent-led media production.'),
 'voice': ('Voice & Speech', 'Speech recognition, dictation, text-to-speech, and voice-agent tooling.'),
 'resources': ('Resources & Learning', 'Curated collections, practical guides, courses, and reference material.'),
}
LEGACY = {'Coding':'plugins','Design':'design','Video & audio':'media','Research':'research','Automation':'scraping','Marketing':'business','Productivity':'business','Writing':'business','Finance':'finance','Security':'security','Developer resources':'resources','Models & sensing':'infra'}
OVERRIDES = {'levanis-design/repohub':'codeintel','elie222/rakazo':'assistants','open-less/openless':'voice','jamiepine/voicebox':'voice','openbmb/voxcpm':'voice','cheaper-inference/omniroute':'tokens','tashfeenahmed/freellmapi':'tokens'}

def clean(text):
    """Drop emoji presentation, while retaining ordinary Unicode names and text."""
    text = re.sub('[\U0001F000-\U0001FAFF\u2300-\u23FF\u2600-\u27BF\u2B00-\u2BFF\uFE0F\u200D\u20E3]', '', text or '')
    return re.sub(r'\s+', ' ', text).strip()

def root_repo(url):
    parts = urllib.parse.urlparse(url)
    path = parts.path.strip('/').split('/')
    return '/'.join(path[:2]) if parts.netloc.lower() == 'github.com' and len(path) >= 2 else None

def parse_upstream(readme, snapshot):
    """README is authoritative; the generated snapshot supplies English category names."""
    by_heading = {c['georgian']: c['slug'] for c in snapshot['categories']}
    rows, category = [], None
    for line in readme.splitlines():
        if line.startswith('## '):
            heading = clean(line[3:])
            category = by_heading.get(heading)
        if category and line.startswith('| ['):
            match = re.match(r'^\| \[([^\]]+)\]\((\S+?)\) \| ([^|]+) \| (.+) \|\s*$', line)
            if match:
                name, url, stars, _ = match.groups()
                rows.append({'name':clean(name),'url':url,'categorySlug':category,'resource':stars.strip() in ('Guide','Gist'),'resourceType':stars.strip()})
    if len(rows) < 100 or len({r['categorySlug'] for r in rows}) < 15:
        raise RuntimeError('Unexpected upstream README format; nothing was written.')
    return rows

def normalize_facts(raw):
    return {'repo':raw['nameWithOwner'],'stars':raw['stargazerCount'],'forks':raw['forkCount'],
        'isFork':raw['isFork'],'archived':raw['isArchived'],'disabled':raw['isDisabled'],
        'updated':raw['pushedAt'][:10], 'license':(raw.get('licenseInfo') or {}).get('spdxId'),
        'description':clean(raw.get('description'))}

def merge(data, rows, facts, date, revision, checked_at):
    """Pure merge. Preserve IDs, saved-collection compatibility, and original editorial notes."""
    result = copy.deepcopy(data)
    projects = result['projects']
    existing = {p['repo'].lower():p for p in projects if not p.get('isResource')}
    resources = {p['url']:p for p in projects if p.get('isResource')}
    matched = set()
    for p in projects:
        key = p['repo'].lower()
        slug = OVERRIDES.get(key) or LEGACY.get(p['category'])
        if slug: p['category'] = CATEGORY_DETAILS[slug][0]
        p['upstreamListed'] = False

    for row in rows:
        path = root_repo(row['url'])
        resource = row['resource'] or not path
        raw = facts.get(path.lower()) if path else None
        canonical = raw['repo'] if raw else path
        if resource:
            p = resources.get(row['url'])
            if not p:
                is_guide = row['resourceType'] == 'Guide'
                summary = ('A practical guide to using Claude with HyperFrames for agent-assisted video creation.' if is_guide else 'Andrej Karpathy’s conceptual notes on using an LLM to build and maintain a personal Markdown wiki.')
                p = dict(id='resource--'+hashlib.sha256(row['url'].encode()).hexdigest()[:16],repo=path or 'karpathy/llm-maintained-wiki',name=row['name'],url=row['url'],summary=summary,isResource=True,resourceType=row['resourceType'],platforms=['See docs'],execution=row['resourceType'],api='Varies',gpu='Varies',bestFor='Reading the original guide and exploring its ideas.',limitation='A reference resource, not a separately installable agent. Follow the original source and its terms.',stars=None,updated='',license='See original resource',review='Reference imported',reviewedAt=date,experimental=False,authorProject=False,featured=False)
                projects.append(p);resources[row['url']]=p
        else:
            p = existing.get((canonical or path).lower()) or existing.get(path.lower())
            if not p:
                summary = raw['description'] if raw and raw['description'] else f"{row['name']} is listed in the upstream {CATEGORY_DETAILS[row['categorySlug']][0]} collection. Read its original documentation for details."
                letters=[c for c in summary if c.isalpha()]
                english=not letters or sum(c.isascii() for c in letters)/len(letters)>=0.55
                if not english:summary=f"{row['name']} is part of the upstream {CATEGORY_DETAILS[row['categorySlug']][0]} collection. Read the original documentation for features and setup."
                p = dict(id=(canonical or path).lower().replace('/','--'),repo=canonical or path,name=row['name'],url='https://github.com/'+(canonical or path),summary=summary,summarySource='GitHub metadata' if raw and raw['description'] and english else 'Source listing',platforms=['See docs'],execution='See docs',api='Varies',gpu='Varies',bestFor=CATEGORY_DETAILS[row['categorySlug']][1],limitation='Imported from AI Pulse Georgia. Setup, platform support, costs, and behavior have not been independently verified by this catalog.',stars=None,updated='',license='See repository',review='Metadata reviewed' if raw else 'Metadata pending',reviewedAt=date,experimental=False,authorProject=False,featured=False)
                projects.append(p);existing[(canonical or path).lower()]=p
        p.update(category=CATEGORY_DETAILS[row['categorySlug']][0],upstreamListed=True)
        source = {'repository':UPSTREAM,'url':row['url'],'revision':revision}
        p.setdefault('sources',[])
        p['sources']=[s for s in p['sources'] if not(s.get('repository')==UPSTREAM and s.get('url')==row['url'])]+[source]
        matched.add(row['url'])

    # Resolve live canonical names and metadata for all repositories, including favorites.
    unique, urls = [], set()
    for p in projects:
        if not p.get('isResource'):
            f = facts.get(p['repo'].lower())
            if f:
                if f['repo'].lower()!=p['repo'].lower():p.setdefault('aliases',[]).append(p['repo'])
                p.update(repo=f['repo'],url='https://github.com/'+f['repo'],stars=f['stars'],forks=f['forks'],isFork=f['isFork'],archived=f['archived'],disabled=f['disabled'],updated=f['updated'],metadataCheckedAt=date,metadataStatus='available')
                if f['license'] and f['license']!='NOASSERTION':p['license']=f['license']
                if p.get('summarySource')=='GitHub metadata' and f['description']:
                    letters=[c for c in f['description'] if c.isalpha()]
                    if not letters or sum(c.isascii() for c in letters)/len(letters)>=0.55:p['summary']=f['description']
                    else:
                        p['summary']=f"{p['name']} is part of the upstream {p['category']} collection. Read the original documentation for features and setup."
                        p['summarySource']='Source listing'
            else:
                p['metadataStatus']='unavailable'
                p['metadataNote']='GitHub did not return this public repository. Previous facts are retained; check its source before use.'
        p['name']=clean(p['name']);p['summary']=clean(p['summary'])
        if p['url'].lower() in urls:
            # Canonical renames may collapse aliases; combine provenance without duplicating a repo.
            target=next(q for q in unique if q['url'].lower()==p['url'].lower())
            target['upstreamListed'] |= p.get('upstreamListed',False)
            for s in p.get('sources',[]):
                if s not in target.setdefault('sources',[]):target['sources'].append(s)
            continue
        urls.add(p['url'].lower());unique.append(p)
    result['projects']=unique
    categories = [dict(name=name,description=description) for name,description in CATEGORY_DETAILS.values() if any(p['category']==name for p in unique)]
    known={c['name'] for c in categories}
    for p in unique:
        if p['category'] not in known:categories.append(dict(name=p['category'],description='Additional projects from the curator’s collection.'));known.add(p['category'])
    result.update(version=3,categories=categories,metadataRefreshedAt=checked_at,metadataRefreshedDate=date,
        upstream={'repository':UPSTREAM,'url':'https://github.com/'+UPSTREAM,'revision':revision,'license':'CC0-1.0','checkedAt':checked_at,'listedEntries':len(rows),'coveredEntries':len(matched),'sourceUrls':sorted(matched)})
    return result

def request(url, token, body=None, raw=False):
    headers={'User-Agent':'RepoHub-Catalog-Refresh','Accept':'application/vnd.github+json','Authorization':'Bearer '+token}
    req=urllib.request.Request(url,data=json.dumps(body).encode() if body else None,headers=headers)
    for attempt in range(3):
        try:
            with urllib.request.urlopen(req,timeout=60) as response:
                value=response.read().decode('utf-8');return value if raw else json.loads(value)
        except urllib.error.HTTPError as error:
            if error.code not in (429,500,502,503,504) or attempt==2:raise
            import time
            time.sleep(2**attempt)
    raise RuntimeError('GitHub request failed')

def load_token():
    token=os.environ.get('GH_TOKEN') or os.environ.get('GITHUB_TOKEN')
    if not token:
        try:
            r=subprocess.run(['gh','auth','token'],capture_output=True,text=True,check=True)
            token=r.stdout.strip()
        except (OSError,subprocess.CalledProcessError):pass
    if not token:raise RuntimeError('Set GH_TOKEN/GITHUB_TOKEN or sign in with gh auth login. Public metadata refresh needs authenticated API access.')
    return token

def main():
    token=load_token()
    current=json.loads(CATALOG.read_text(encoding='utf-8'))
    commit=request('https://api.github.com/repos/'+UPSTREAM+'/commits/main',token)['sha']
    base='https://raw.githubusercontent.com/'+UPSTREAM+'/'+commit+'/'
    license_text=request(base+'LICENSE',token,raw=True)
    if 'CC0' not in license_text.upper():raise RuntimeError('Upstream collection license changed; review it before importing new content.')
    readme=request(base+'README.md',token,raw=True)
    snapshot=json.loads(request(base+'mcp/data/repos.json',token,raw=True))
    rows=parse_upstream(readme,snapshot)
    paths={p['repo'].lower() for p in current['projects'] if not p.get('isResource')}
    paths|={root_repo(r['url']).lower() for r in rows if root_repo(r['url'])}
    facts={}
    paths=sorted(paths)
    fields='nameWithOwner description stargazerCount forkCount isFork isArchived isDisabled pushedAt licenseInfo { spdxId }'
    for start in range(0,len(paths),40):
        batch=paths[start:start+40];parts=[]
        for i,path in enumerate(batch):
            owner,name=path.split('/')
            if not re.fullmatch(r'[\w.-]+',owner) or not re.fullmatch(r'[\w.-]+',name):raise RuntimeError('Invalid repository path')
            parts.append(f'r{i}: repository(owner:"{owner}",name:"{name}") {{ {fields} }}')
        reply=request('https://api.github.com/graphql',token,{'query':'query { '+' '.join(parts)+' }'})
        if any(e.get('type')!='NOT_FOUND' for e in reply.get('errors',[])):raise RuntimeError('GitHub GraphQL did not return a complete metadata batch; nothing was written.')
        if reply.get('data') is None:raise RuntimeError('GitHub metadata batch is missing; nothing was written.')
        for i,path in enumerate(batch):
            raw=reply['data'].get('r'+str(i));facts[path]=normalize_facts(raw) if raw else None
            if raw:facts[raw['nameWithOwner'].lower()]=facts[path]
        print(f'Checked metadata: {min(start+40,len(paths))}/{len(paths)}')
    now=dt.datetime.now(dt.timezone.utc)
    try:
        from zoneinfo import ZoneInfo
        date=now.astimezone(ZoneInfo('America/New_York')).date().isoformat()
    except Exception:date=dt.datetime.now().date().isoformat()
    merged=merge(current,rows,facts,date,commit,now.isoformat())
    if merged['upstream']['coveredEntries']!=len(rows):raise RuntimeError('Upstream coverage is incomplete; nothing was written.')
    temp=CATALOG.with_suffix('.json.tmp')
    temp.write_text(json.dumps(merged,ensure_ascii=False,indent=2)+'\n',encoding='utf-8');temp.replace(CATALOG)
    print(f"Catalog: {len(merged['projects'])} entries; {len(rows)}/{len(rows)} upstream entries covered; {sum(p.get('metadataStatus')=='unavailable' for p in merged['projects'])} unavailable repositories retained.")

if __name__=='__main__':
    try:main()
    except Exception as error:
        print('Refresh failed: '+str(error),file=sys.stderr);sys.exit(1)
