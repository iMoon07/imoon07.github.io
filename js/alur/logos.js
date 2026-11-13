/* Alur — logo catalogue (iMoon07/logo-svg).
   Logos load directly from iMoon07/logo-svg on raw.githubusercontent.com.
   Any logo can be used as node.logo / node.logos / stage.logo.
   For local testing: open draw.html?localLogos=1 (requires local assets/logos).

   AlurLogos.resolve("stack:docker")
     -> { kind:"file", href:"https://raw.githubusercontent.com/iMoon07/logo-svg/main/stack/docker.svg" }
   AlurLogos.resolve("i-si-nginx")    -> { kind:"sprite", ref:"#i-si-nginx" }
   AlurLogos.resolve("assets/x.svg")  -> { kind:"file", href:"assets/x.svg" } */
(function (global) {
    'use strict';

    var REMOTE_BASE = 'https://raw.githubusercontent.com/iMoon07/logo-svg/main/';
    var LOCAL_BASE = 'assets/logos/';
    var data = global.ALUR_LOGO_MANIFEST || { base: REMOTE_BASE, logos: [] };
    var localTest = false;
    try {
      localTest = /(?:\?|&)localLogos=1(?:&|$)/.test(global.location.search) ||
        global.localStorage.getItem('alur.localLogos') === '1';
    } catch (err) {}
    var base = localTest ? LOCAL_BASE : (data.base || REMOTE_BASE);
    var byId = Object.create(null);
    var byName = Object.create(null);

    data.logos.forEach(function (entry) {
        byId[entry.id] = entry;
        if (!byName[entry.name]) byName[entry.name] = [];
        byName[entry.name].push(entry);
    });

    var PATH_RE = /^(https?:)?\/\//i;
    var FILE_RE = /\.(svg|png|jpe?g|gif|webp|avif)$/i;

    function isPath(id) {
        return PATH_RE.test(id) || id.charAt(0) === '/' || FILE_RE.test(id);
    }

    function isSprite(id) {
        return /^i-/.test(id);
    }

    function entry(id) {
        return byId[id] || null;
    }

    function resolve(id) {
        if (!id) return null;
        if (isPath(id)) return { kind: 'file', href: id };
        var hit = byId[id];
        if (hit) return { kind: 'file', href: base + hit.file, entry: hit };
        var named = byName[id];
        if (named && named.length === 1) {
            hit = named[0];
            return { kind: 'file', href: base + hit.file, entry: hit };
        }
        if (isSprite(id)) return { kind: 'sprite', ref: '#' + id };
        /* Fallback terakhir: anggap id sprite (kompatibel dengan topology). */
        return { kind: 'sprite', ref: '#' + id };
    }

    function isDark(id) {
        var hit = entry(id);
        if (hit) return !!hit.dark;
        var named = byName[id];
        return !!(named && named.length === 1 && named[0].dark);
    }

    function url(id) {
        var res = resolve(id);
        return res && res.kind === 'file' ? res.href : null;
    }

    function categories() {
        return (data.categories || []).map(function (cat) {
            return {
                id: cat,
                label: cat.charAt(0).toUpperCase() + cat.slice(1),
                count: data.logos.filter(function (e) { return e.category === cat; }).length
            };
        });
    }

    function list(cat) {
        return data.logos.filter(function (e) { return !cat || cat === 'all' || e.category === cat; });
    }

    function search(query, cat) {
        var tokens = String(query || '').toLowerCase().trim().split(/\s+/).filter(Boolean);
        return list(cat).filter(function (e) {
            for (var i = 0; i < tokens.length; i++) {
                if (e.search.indexOf(tokens[i]) === -1) return false;
            }
            return true;
        });
    }

    function random(cat) {
        var pool = list(cat);
        return pool.length ? pool[Math.floor(Math.random() * pool.length)] : null;
    }

    global.AlurLogos = {
        base: base,
        data: data,
        total: data.logos.length,
        entry: entry,
        resolve: resolve,
        isDark: isDark,
        url: url,
        categories: categories,
        list: list,
        search: search,
        random: random
    };
})(window);