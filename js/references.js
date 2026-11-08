/* References hub: left nav, breadcrumb, pager, command search (Ctrl+K), mobile drawers. */
(function () {
  'use strict';
  var modules = Array.isArray(window.REFERENCE_MODULES) ? window.REFERENCE_MODULES.slice() : [];
  if (!modules.length) return;

  var nav = document.getElementById('docs-nav');
  var navMobile = document.getElementById('docs-nav-mobile');
  var filter = document.getElementById('docs-search');
  var titleEl = document.getElementById('article-title');
  try { if ('scrollRestoration' in history) history.scrollRestoration = 'manual'; } catch(_){}
  var docsLayout = document.getElementById('docs-layout');
  if (docsLayout) docsLayout.id = 'article-layout';
  (function setDocsOffset(){ var b=document.querySelector('.docs-topbar'); if(b){ var h=Math.round(b.getBoundingClientRect().height); if(h>0) document.documentElement.style.setProperty('--sticky-offset', h+'px'); } })();
  window.addEventListener('resize', function(){ var b=document.querySelector('.docs-topbar'); if(b){ var h=Math.round(b.getBoundingClientRect().height); if(h>0) document.documentElement.style.setProperty('--sticky-offset', h+'px'); } }, { passive:true });

  var byId = {};
  modules.forEach(function (m) { byId[m.id] = m; });
  var contentCache = {};
  var textCache = {};
  // id terkunci (manifest). Default baca EN dulu; ?lang=... (id, en, dll) auto-resolve ke <id>-<lang>.md.
  var LANG = (new URLSearchParams(window.location.search).get('lang') || 'en').toLowerCase();
  var isFile = window.location.protocol === 'file:';

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]; }); }

  function langVariant(src, lang) {
    if (!src || !lang || !/\.md$/i.test(src)) return src;
    // <id>.md -> <id>-en.md ; <id>-xx.md -> <id>-<lang>.md (ganti suffix bahasa, src asli aman)
    return src.replace(/(?:-[a-z]{2})?\.md$/i, '-' + lang + '.md');
  }
  function sourceCandidates(m) {
    var raw = m && m.src && /^https?:\/\//i.test(m.src) ? m.src : (m && m.src ? m.src : '');
    var local = m && m.file ? m.file : '';
    var out = [];
    function push(x){ if (x && out.indexOf(x) < 0) out.push(x); }
    var pref = (LANG || 'en').toLowerCase();
    var langs = [pref, pref !== 'en' ? 'en' : null, pref !== 'id' ? 'id' : null].filter(Boolean).filter(function(v,i,a){return a.indexOf(v)===i;});
    function addSource(u){ if(!u) return; langs.forEach(function(l){ push(langVariant(u,l)); }); push(u); }
    if (isFile) { addSource(local); addSource(raw); }
    else { addSource(raw); addSource(local); }
    if (raw && !/^https?:\/\//i.test(raw)) addSource(raw);
    return out;
  }
  function pickPrimary(m) {
    var c = sourceCandidates(m);
    return c.length ? c[0] : '';
  }

  function currentId() {
    var p = new URLSearchParams(window.location.search);
    var id = (p.get('ref') || '').trim();
    if (id && byId[id]) return id;
    var doc = p.get('doc') || '';
    for (var i = 0; i < modules.length; i++) {
      if (modules[i].src === doc || modules[i].file === doc) return modules[i].id;
      var c = sourceCandidates(modules[i]); for (var j=0;j<c.length;j++) if (c[j]===doc) return modules[i].id;
    }
    var m = doc.match(/(?:docs\/references\/|\/References\/)([a-z0-9._-]+?)(?:-[a-z]{2})?\.md$/i);
    if (m && byId[m[1]]) return m[1];
    return 'index';
  }

  function moduleSource(m) { return pickPrimary(m); }
  function moduleUrl(id) {
    var m = byId[id] || byId.index;
    var url = 'references.html?ref=' + encodeURIComponent(m.id) + '&doc=' + encodeURIComponent(moduleSource(m));
    if (LANG && LANG !== 'id') url += '&lang=' + encodeURIComponent(LANG);
    return url;
  }

  function grouped(list) {
    var order = ['Start', 'Core', 'Dev', 'Infra', 'Security'];
    var map = {};
    list.forEach(function (m) { var g = m.group || 'Other'; (map[g] = map[g] || []).push(m); });
    var keys = order.filter(function (g) { return map[g]; }).concat(Object.keys(map).filter(function (g) { return order.indexOf(g) < 0; }).sort());
    return keys.map(function (g) { return { group: g, items: map[g] }; });
  }

  function renderNav(query) {
    var q = String(query || '').toLowerCase().trim();
    var active = currentId();
    var list = q ? modules.filter(function (m) { return (m.title + ' ' + m.group).toLowerCase().indexOf(q) !== -1; }) : modules;
    var html = grouped(list).map(function (g) {
      return '<section class="docs-nav-group"><h3>' + esc(g.group) + '</h3><ul class="docs-nav-list">' +
        g.items.map(function (m) {
          var on = m.id === active;
          return '<li><a class="docs-nav-link' + (on ? ' is-active' : '') + '" href="' + moduleUrl(m.id) + '" data-ref="' + esc(m.id) + '"' + (on ? ' aria-current="page"' : '') + '>' + esc(m.title) + '</a></li>';
        }).join('') + '</ul></section>';
    }).join('') || '<p class="docs-command-empty">No materials found.</p>';
    if (nav) nav.innerHTML = html;
    if (navMobile) navMobile.innerHTML = html;
    [nav, navMobile].forEach(function (root) {
      if (!root) return;
      root.querySelectorAll('a[data-ref]').forEach(function (a) {
        a.addEventListener('click', function (e) {
          if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
          e.preventDefault();
          load(a.getAttribute('data-ref'));
          closeNavDrawer();
        });
      });
    });
  }

  function renderBreadcrumb(id) {
    var m = byId[id] || byId.index;
    var bc = document.getElementById('docs-breadcrumb');
    if (!bc) return;
    bc.innerHTML = '<a href="' + moduleUrl('index') + '" data-ref="index">References</a><span class="sep" aria-hidden="true">/</span><span>' + esc(m.group) + '</span><span class="sep" aria-hidden="true">/</span><span aria-current="page">' + esc(m.title) + '</span>';
    bc.querySelectorAll('a[data-ref]').forEach(function (a) {
      a.addEventListener('click', function (e) { e.preventDefault(); load(a.getAttribute('data-ref')); });
    });
  }

  function renderPager(id) {
    var pager = document.getElementById('docs-pager');
    if (!pager) return;
    var idx = -1;
    modules.forEach(function (m, i) { if (m.id === id) idx = i; });
    if (idx < 0) { pager.hidden = true; return; }
    var prev = modules[idx - 1];
    var next = modules[idx + 1];
    var total = modules.length;
    var page = idx + 1;
    pager.hidden = !(prev || next);
    pager.className = 'docs-pager related-nav';
    pager.innerHTML =
      '<a class="related-nav-btn docs-nav-btn related-nav-prev' + (prev ? '' : ' is-disabled') + '" ' + (prev ? 'href="' + moduleUrl(prev.id) + '" data-ref="' + esc(prev.id) + '"' : 'aria-disabled="true" tabindex="-1"') + ' aria-label="Previous">' +
        '<span class="related-nav-label">Previous</span>' +
        '<svg class="related-nav-arrow" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>' +
      '</a>' +
      '<span class="related-nav-info" aria-label="Page ' + page + ' of ' + total + '">' + page + ' / ' + total + '</span>' +
      '<a class="related-nav-btn docs-nav-btn related-nav-next' + (next ? '' : ' is-disabled') + '" ' + (next ? 'href="' + moduleUrl(next.id) + '" data-ref="' + esc(next.id) + '"' : 'aria-disabled="true" tabindex="-1"') + ' aria-label="Next">' +
        '<svg class="related-nav-arrow" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg>' +
        '<span class="related-nav-label">Next</span>' +
      '</a>';
    pager.querySelectorAll('a[data-ref]').forEach(function (a) {
      a.addEventListener('click', function (e) { e.preventDefault(); load(a.getAttribute('data-ref')); });
    });
  }

  function applyMeta(id) {
    var m = byId[id] || byId.index;
    if (titleEl) titleEl.textContent = m.title;
    document.title = m.title + ' - References - iMoon07';
    renderBreadcrumb(m.id);
    renderPager(m.id);
  }

  function load(id, opts) {
    var m = byId[id] || byId.index;
    applyMeta(m.id);
    history.replaceState(null, '', moduleUrl(m.id));
    renderNav(filter ? filter.value : '');
    window.__referenceDoc = { src: moduleSource(m), file: m.file, fallback: m.file, title: m.title, id: m.id };
    window.dispatchEvent(new CustomEvent('references:load', { detail: window.__referenceDoc }));
    if (!(opts && opts.keepScroll === true)) {
      window.scrollTo({ top: 0, behavior: 'auto' });
    }
  }

  // Mobile drawers
  var drawer = document.getElementById('docs-nav-drawer');
  var toggle = document.getElementById('docs-nav-toggle');
  var closeBtn = document.getElementById('docs-nav-close');
  function openNavDrawer() { if (!drawer) return; drawer.hidden = false; if (toggle) toggle.setAttribute('aria-expanded', 'true'); }
  function closeNavDrawer() { if (!drawer) return; drawer.hidden = true; if (toggle) toggle.setAttribute('aria-expanded', 'false'); }
  if (toggle) toggle.addEventListener('click', function () { drawer && drawer.hidden ? openNavDrawer() : closeNavDrawer(); });
  if (closeBtn) closeBtn.addEventListener('click', closeNavDrawer);
  if (drawer) drawer.addEventListener('click', function (e) { if (e.target && e.target.hasAttribute('data-close-docs-nav')) closeNavDrawer(); });
  if (drawer) drawer.querySelectorAll('.docs-drawer-nav a').forEach(function(a){ a.addEventListener('click', closeNavDrawer); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeNavDrawer(); });
  if (filter) filter.addEventListener('input', function () { renderNav(filter.value); });

  // ===== Instant Docs Search (Ctrl+K) — Docs only; indexes real Markdown once =====
  var INDEX = { docs: [], ready: false, loading: false, partial: 0, built: 0, _p: null };
  var cmd = document.getElementById('docs-command');
  var cmdInput = document.getElementById('docs-command-input');
  var cmdResults = document.getElementById('docs-command-results');
  var cmdStatus = document.getElementById('docs-command-status');
  var cmdFoot = document.getElementById('docs-command-foot-text');
  var cmdClear = document.getElementById('docs-command-clear');
  var cmdOpeners = [document.getElementById('docs-search-trigger'), document.getElementById('docs-search-open')].filter(Boolean);
  var cmdActive = -1, cmdQuery = '', cmdTimer = 0, cmdLastFocus = null, cmdLastItems = [];

  function slugifyText(text){ // MUST match read.js slugify for anchor navigation
    return String(text||'').toLowerCase().trim().replace(/[^\p{L}\p{N}\s-]/gu,'').replace(/\s+/g,'-').replace(/-+/g,'-').slice(0,80) || 'section';
  }
  function fold(s){
    try { return String(s||'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase(); } catch(_){ return String(s||'').toLowerCase(); }
  }
  function normQ(s){ return fold(s).replace(/[^\p{L}\p{N}\s+#.\-_]/gu,' ').replace(/\s+/g,' ').trim(); }
  function escRx(s){ return String(s).replace(/[.*+?^${}()|[\]\\]/g,'\\$&'); }
  function detectLang(text, src){
    var m = String(src||'').match(/-([a-z]{2})\.md$/i);
    var hint = m ? m[1].toLowerCase() : '';
    var t = String(text||'');
    var idHits = (t.match(/\b(yang|dan|untuk|dengan|atau|adalah|pada|dari|cara|tidak|bisa|dapat|contoh|bagian|referensi|standar|keamanan|jaringan|data|sistem)\b/gi)||[]).length;
    var enHits = (t.match(/\b(the|and|for|with|this|that|from|are|can|use|using|reference|security|network|data|system|guide|standard)\b/gi)||[]).length;
    if (enHits >= idHits && enHits > 2) return 'en';
    if (idHits > enHits && idHits > 2) return 'id';
    return hint || 'unknown';
  }
  function parseFrontmatter(md){
    var meta = { title:'', tags:[], lang:'' };
    var m = String(md||'').match(/^---\s*\n([\s\S]*?)\n---\s*\n?/);
    if (!m) return { meta: meta, body: String(md||'') };
    var fm = m[1], body = String(md||'').slice(m[0].length);
    var t = fm.match(/^\s*title\s*:\s*(.+)$/mi); if (t) meta.title = t[1].replace(/^['"]|['"]$/g,'').trim();
    var l = fm.match(/^\s*lang(?:uage)?\s*:\s*(.+)$/mi); if (l) meta.lang = l[1].replace(/^['"]|['"]$/g,'').trim().toLowerCase().slice(0,8);
    return { meta: meta, body: body };
  }
  function stripMd(s){
    return String(s||'').replace(/```[\s\S]*?```/g,' ').replace(/`[^`]*`/g,' ').replace(/!\[[^\]]*\]\([^)]+\)/g,' ').replace(/\[([^\]]+)\]\([^)]+\)/g,'$1').replace(/[*_~>#|]+/g,' ').replace(/\s+/g,' ').trim();
  }
  function extractDoc(m, raw, srcUsed){
    var fm = parseFrontmatter(raw||'');
    var body = fm.body || '';
    var h1m = body.match(/^#\s+(.+)$/m);
    var title = (fm.meta.title || (h1m ? h1m[1].trim() : '') || m.title || m.id).trim();
    var lang = fm.meta.lang || detectLang(body, srcUsed || m.src || m.file);
    var headings = [], blocks = [], used = {};
    body.split(/\n/).forEach(function(line){
      var hm = line.match(/^(#{1,6})\s+(.+?)\s*#*\s*$/);
      if (!hm) return;
      var level = hm[1].length, text = stripMd(hm[2]); if (!text) return;
      var id = slugifyText(text), c=1, base=id; while(used[id]){ c++; id=base+'-'+c; } used[id]=1;
      headings.push({ level: level, text: text, id: id });
      blocks.push({ kind:'heading', text: text, anchor: id, label: 'Heading' });
    });
    body.replace(/```([\w-]*)\n([\s\S]*?)```/g, function(_, langName, code){
      var ct = String(code||'').replace(/\s+/g,' ').trim().slice(0,500);
      if (ct) blocks.push({ kind:'code', text: ct, label: 'Code', anchor: '' });
      return '';
    });
    body.split(/\n\s*\n/).forEach(function(b){
      var t = b.trim(); if(!t || /^#{1,6}\s/.test(t) || /^```/.test(t)) return;
      var bt = stripMd(t); if (bt) blocks.push({ kind:'content', text: bt, label: 'Content', anchor: '' });
    });
    var full = stripMd(body);
    if (full) blocks.push({ kind:'content', text: full.slice(0, 8000), label: 'Content', anchor: '' });
    var hay = fold([title, m.group||'', headings.map(function(h){return h.text;}).join(' '), blocks.map(function(b){return b.text;}).join(' ')].join(' '));
    return { id:m.id, ref:m, title:title, group:m.group||'References', lang:lang||'unknown', headings:headings, blocks:blocks, hay:hay, srcUsed:srcUsed||'' };
  }

  function fetchText(url){
    if (!url) return Promise.reject();
    if (textCache[url]) return Promise.resolve(textCache[url]);
    return fetch(url, { cache: 'no-store' }).then(function(r){ if(!r.ok) throw 0; return r.text(); })
      .catch(function(){
        return new Promise(function(res, rej){ try{ var x=new XMLHttpRequest(); x.open('GET',url,true); x.timeout=12000; x.onload=function(){ if((x.status>=200&&x.status<300)||x.responseText) res(x.responseText); else rej(); }; x.onerror=function(){ x.responseText?res(x.responseText):rej(); }; x.ontimeout=rej; x.send(); }catch(e){ rej(e);} });
      }).then(function(t){ textCache[url]=String(t||''); return textCache[url]; });
  }
  function fetchDocRecord(m){
    var cands = sourceCandidates(m);
    var i=0;
    function next(){ if(i>=cands.length) return Promise.reject(); var u=cands[i++]; return fetchText(u).then(function(t){ return extractDoc(m,t,u); }).catch(next); }
    return next();
  }
  function ensureIndex(progress){
    if (INDEX.ready) return Promise.resolve(INDEX.docs);
    if (INDEX.loading && INDEX._p) return INDEX._p;
    INDEX.loading = true; INDEX.partial = 0; INDEX.docs = [];
    var list = modules.slice(), out = [], i = 0, n = list.length;
    INDEX._p = new Promise(function(resolve){
      function step(){
        if (i >= n) {
          INDEX.docs = out; INDEX.ready = true; INDEX.loading = false; INDEX.built = Date.now();
          if (progress) progress(n,n); resolve(out); return;
        }
        var batch = list.slice(i, i + 4); i += batch.length;
        Promise.all(batch.map(function(m){ return fetchDocRecord(m).then(function(d){ out.push(d); }).catch(function(){ INDEX.partial++; }); })).then(function(){
          if (progress) progress(Math.min(i,n), n);
          // re-run live query as index grows
          if (cmd && !cmd.hidden && cmdInput && cmdInput.value.trim()) renderResults(cmdInput.value);
          setTimeout(step, 0);
        });
      }
      step();
    });
    return INDEX._p;
  }

  function lev1(a,b){ // tiny typo tolerance for short/medium tokens
    a=String(a||''); b=String(b||''); var la=a.length, lb=b.length, d=la-lb; if(d>1||d<-1) return false; if(a===b) return true;
    var i=0,j=0,miss=0; while(i<la&&j<lb){ if(a[i]===b[j]){i++;j++;} else { miss++; if(miss>1) return false; if(la>lb)i++; else if(lb>la)j++; else {i++;j++;} } }
    return true;
  }
  function tokenScore(hay, q){
    if (!q) return 0;
    if (hay.indexOf(q) !== -1) return q.length >= 4 ? 8 : 6;
    var words = hay.split(/[^a-z0-9]+/);
    for (var i=0;i<words.length;i++){
      var w=words[i]; if(!w) continue;
      if (w.indexOf(q)===0) return q.length>=3 ? 5 : 3;
      if (q.length>=4 && w.length>=4 && lev1(q,w)) return 3;
    }
    return 0;
  }
  function excerpt(text, q){
    var t=String(text||'').replace(/\s+/g,' ').trim(); if(!t) return '';
    var f=fold(t), qf=normQ(q).split(/\s+/)[0]||''; var i=qf?f.indexOf(qf):-1;
    if(i<0) return t.slice(0,150)+(t.length>150?'…':'');
    var s=Math.max(0,i-55), e=Math.min(t.length,i+110);
    return (s>0?'…':'')+t.slice(s,e)+(e<t.length?'…':'');
  }
  function hi(text, q){
    var raw=String(text||''); var s=esc(raw);
    var terms=normQ(q).split(/\s+/).filter(function(t){return t.length>0;}).sort(function(a,b){return b.length-a.length;}).slice(0,5);
    terms.forEach(function(t){ try{ s=s.replace(new RegExp('('+escRx(t)+')','ig'), '<mark>$1</mark>'); }catch(_){} });
    return s;
  }
  function searchDocs(raw){
    var q = normQ(raw);
    if (!q) return [];
    var terms = q.split(/\s+/).filter(Boolean);
    var out = [];
    INDEX.docs.forEach(function(d){
      var best = null;
      function consider(kind, label, text, anchor, base){
        var s = base;
        terms.forEach(function(t){ s += tokenScore(fold(text), t) + Math.floor(tokenScore(d.hay, t)/3); });
        if (s <= base) return;
        if (kind==='title') s += 14; else if (kind==='heading') s += 9; else if (kind==='code') s += 4; else s += 5;
        if (!best || s > best.score) best = { score:s, kind:kind, label:label, text:text, anchor:anchor||'' };
      }
      consider('title','Title', d.title, '', 0);
      consider('category','Category', d.group + ' › ' + d.title, '', 0);
      d.headings.forEach(function(h){ consider('heading','Heading', h.text, h.id, 0); });
      d.blocks.forEach(function(b){ if(b.kind==='code') consider('code','Code', b.text, '', 0); else if(b.kind==='content') consider('content','Content', b.text, '', 0); });
      if (best) out.push({ doc:d, hit:best });
    });
    out.sort(function(a,b){ return b.hit.score-a.hit.score || a.doc.title.localeCompare(b.doc.title); });
    return out.slice(0, 30);
  }

  function openResult(item){
    closeCommand();
    var d=item.doc, hash=item.hit && item.hit.anchor ? '#'+item.hit.anchor : '';
    if (currentId() === d.id) {
      if (hash) {
        var hid = item.hit.anchor;
        var el = document.getElementById(hid);
        if (el) { try{ history.replaceState(null,'', moduleUrl(d.id)+hash); }catch(_){} el.scrollIntoView({behavior:'smooth',block:'start'}); }
        else { try { window.__docPendingHash = hid; } catch(_){} window.dispatchEvent(new CustomEvent('references:load',{detail:Object.assign({},window.__referenceDoc||{},{id:d.id,src:moduleSource(d.ref),file:d.ref.file,fallback:d.ref.file,title:d.title,hash:hid})})); }
      }
    } else {
      try { window.__docPendingHash = item.hit.anchor || ''; } catch(_){}
      load(d.id, { hash: item.hit.anchor || '' });
    }
  }

  // extend load() to accept heading hash
  var _loadOrig = load;
  load = function(id, opts){
    var m = byId[id] || byId.index;
    applyMeta(m.id);
    var hash = (opts && opts.hash) ? '#'+opts.hash : '';
    history.replaceState(null,'', moduleUrl(m.id) + hash);
    renderNav(filter ? filter.value : '');
    window.__referenceDoc = { src: moduleSource(m), file: m.file, fallback: m.file, title: m.title, id: m.id, hash: (opts&&opts.hash)||'' };
    window.dispatchEvent(new CustomEvent('references:load', { detail: window.__referenceDoc }));
    if (!(opts && (opts.keepScroll===true || opts.hash))) window.scrollTo({ top: 0, behavior: 'auto' });
  };

  function setStatus(msg, kind){ if(!cmdStatus) return; cmdStatus.textContent=msg||''; cmdStatus.className='docs-command-status'+(kind?' is-'+kind:''); }

  function renderResults(query, opts){
    if (!cmdResults) return;
    var keepActive = !!(opts && opts.keepActive);
    var q = String(query == null ? (cmdInput ? cmdInput.value : cmdQuery) : query);
    cmdQuery = q;
    if (cmdClear) cmdClear.hidden = !q.trim();
    if (!q.trim()) {
      cmdActive = -1; cmdLastItems = [];
      var hint = INDEX.ready ? ('Search ' + INDEX.docs.length + ' docs') : 'Preparing search index…';
      setStatus(hint, INDEX.loading ? 'loading' : '');
      cmdResults.innerHTML = '<div class="docs-command-hint">Type to search titles, headings, content, and code across iMoon07 Docs.</div>';
      if (cmdFoot) cmdFoot.textContent = 'Ctrl/Cmd+K · Docs only';
      return;
    }
    if (!INDEX.ready) { setStatus('Indexing docs…', 'loading'); ensureIndex(); }
    var items = searchDocs(q);
    cmdLastItems = items;
    if (!keepActive || cmdActive < 0 || cmdActive >= items.length) cmdActive = items.length ? 0 : -1;
    if (!items.length) {
      setStatus(INDEX.ready ? 'No matches found.' : 'Indexing docs…', INDEX.ready ? '' : 'loading');
      cmdResults.innerHTML = '<div class="docs-command-empty">' + (INDEX.ready ? 'No results for “'+esc(q)+'”.' : 'Searching as docs index…') + '</div>';
      if (cmdFoot) cmdFoot.textContent = 'Docs only';
      return;
    }
    setStatus(items.length + ' result' + (items.length>1?'s':'') + (INDEX.loading && !INDEX.ready ? ' · indexing…' : ''), (INDEX.loading && !INDEX.ready) ? 'loading' : '');
    if (cmdFoot) cmdFoot.textContent = items.length + ' results · ↑↓ Enter Esc';
    cmdResults.innerHTML = items.map(function(it,i){
      var d=it.doc, h=it.hit, ex=excerpt(h.text||d.title, q);
      var loc = h.kind==='heading' ? esc(d.title)+' › '+esc(h.text) : esc(d.group)+' › '+esc(d.title);
      return '<button type="button" class="docs-command-item'+(i===cmdActive?' is-active':'')+'" role="option" data-i="'+i+'" aria-selected="'+(i===cmdActive)+'">'
        + '<span class="main"><span class="top"><span class="badge">'+esc(h.label)+'</span><span class="loc">'+hi(loc,q)+'</span></span>'
        + '<span class="title">'+hi(h.kind==='title'?d.title:(h.kind==='heading'?h.text:d.title),q)+'</span>'
        + (ex?'<span class="snippet">'+hi(ex,q)+'</span>':'')+'</span></button>';
    }).join('');
    cmdResults.querySelectorAll('.docs-command-item').forEach(function(btn){
      btn.addEventListener('click', function(){ var idx=+btn.getAttribute('data-i'); if(cmdLastItems[idx]) openResult(cmdLastItems[idx]); });
      btn.addEventListener('mousemove', function(){ var idx=+btn.getAttribute('data-i'); if(idx!==cmdActive){ cmdActive=idx; cmdResults.querySelectorAll('.docs-command-item').forEach(function(x,j){ var on=j===idx; x.classList.toggle('is-active',on); x.setAttribute('aria-selected', on?'true':'false'); }); } });
    });
  }

  function openCommand(){
    if(!cmd) return; cmdLastFocus=document.activeElement;
    cmd.hidden=false; cmd.setAttribute('aria-hidden','false'); cmd.classList.add('is-open');
    if(cmdInput){ if(!cmdInput.value && cmdQuery) cmdInput.value=cmdQuery; cmdInput.focus(); try{cmdInput.select();}catch(_){} }
    renderResults(cmdInput?cmdInput.value:'');
    if(!INDEX.ready && !INDEX.loading) ensureIndex();
  }
  function closeCommand(){
    if(!cmd||cmd.hidden) return; cmd.hidden=true; cmd.setAttribute('aria-hidden','true'); cmd.classList.remove('is-open'); cmdActive=-1;
    try{ if(cmdLastFocus && cmdLastFocus.focus) cmdLastFocus.focus(); }catch(_){}
  }

  cmdOpeners.forEach(function(b){ b.addEventListener('click', function(e){ e.preventDefault(); openCommand(); }); });
  if (cmd) cmd.addEventListener('click', function(e){ if(e.target && e.target.hasAttribute('data-close-command')) closeCommand(); });
  if (cmdClear) cmdClear.addEventListener('click', function(){ if(cmdInput){ cmdInput.value=''; cmdInput.focus(); } renderResults(''); });
  if (cmdInput) {
    cmdInput.addEventListener('input', function(){ clearTimeout(cmdTimer); cmdTimer=setTimeout(function(){ renderResults(cmdInput.value); }, 40); });
    cmdInput.addEventListener('keydown', function(e){
      if (e.key==='ArrowDown'){ e.preventDefault(); if(cmdLastItems.length){ cmdActive=Math.min(cmdLastItems.length-1,(cmdActive<0?0:cmdActive+1)); renderResults(cmdInput.value,{keepActive:true}); var a=cmdResults&&cmdResults.querySelectorAll('.docs-command-item')[cmdActive]; if(a) a.scrollIntoView({block:'nearest'});} }
      else if (e.key==='ArrowUp'){ e.preventDefault(); if(cmdLastItems.length){ cmdActive=Math.max(0,cmdActive-1); renderResults(cmdInput.value,{keepActive:true}); var b=cmdResults&&cmdResults.querySelectorAll('.docs-command-item')[cmdActive]; if(b) b.scrollIntoView({block:'nearest'});} }
      else if (e.key==='Enter'){ e.preventDefault(); if(cmdActive>=0 && cmdLastItems[cmdActive]) openResult(cmdLastItems[cmdActive]); else if(cmdLastItems[0]) openResult(cmdLastItems[0]); }
      else if (e.key==='Escape'){ e.preventDefault(); if(cmdInput.value){ cmdInput.value=''; renderResults(''); } else closeCommand(); }
    });
  }
  document.addEventListener('keydown', function(e){
    var key=e.key||'';
    if ((e.ctrlKey||e.metaKey) && key.toLowerCase()==='k'){ e.preventDefault(); cmd && !cmd.hidden ? closeCommand() : openCommand(); }
    else if (key==='Escape' && cmd && !cmd.hidden){ e.preventDefault(); closeCommand(); }
  });

  renderNav('');
  applyMeta(currentId());
})();