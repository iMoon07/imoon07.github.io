/* =============================================================================
   TOPO — bahasa topologi ringkas
   Aturan: satu blok kata kunci "topology", lalu baris node dan baris kabel.
   Tidak ada angka, tidak ada koma, tidak ada tanda baca selain panah.

     topology Judul Diagram

       api   API Gateway   cloud
       db    Database      postgres

       api > db : SQL
       db  < api : Rows

   Node    : name  Label  ikon          (label boleh beberapa kata)
   Kabel   : from > a b c : label       (maju)
             from < a b c : label       (balik)
   Grup    : nama grup lalu baris yang menjorok ke dalam
             grup
               a  Satu  icon
               b  Dua   icon

   TOPO — compact topology language
   ============================================================================= */
(function (global) {
    'use strict';

    /* Ikon -> jenis simpul, supaya "kind" tidak perlu ditulis. */
    var ICON_KIND = {
        user: 'actor', customer: 'actor', people: 'actor',
        monitor: 'client', browser: 'client', 'app-window': 'client',
        database: 'database', warehouse: 'database', postgres: 'database',
        server: 'server', 'hard-drive': 'server', 'server-cog': 'server',
        'git-branch': 'choice', choice: 'choice',
        cloud: 'cloud', zap: 'process', layers: 'process',
        settings: 'process', globe: 'process', radio: 'process',
        lock: 'security', shield: 'security', package: 'process',
        network: 'network', workflow: 'process', 'si-docker': 'host'
    };

    /* Nama ikon yang dikenali: dari peta di atas, sprite Lucide/Simple Icons,
       dan katalog logo Alur. Dipakai untuk tahu token mana yang ikon. */
    var iconSet = null;
    function knownIcons() {
        if (iconSet) return iconSet;
        var set = Object.create(null);
        Object.keys(ICON_KIND).forEach(function (k) { set[k] = 1; });
        try {
            var sprite = global.TOPOLOGY_SPRITE || '';
            var re = /<symbol[^>]*id="i-([a-z0-9-]+)"/g, m;
            while ((m = re.exec(sprite))) set[m[1]] = 1;
        } catch (e) {}
        try {
            var man = global.ALUR_LOGO_MANIFEST;
            (man && man.logos ? man.logos : []).forEach(function (item) {
                if (!item) return;
                if (item.name) set[item.name] = 1;
                if (item.id) set[item.id] = 1;
                if (item.file) set[String(item.file).replace(/\.\w+$/, '').split('/').pop()] = 1;
            });
        } catch (e) {}
        iconSet = set;
        return set;
    }

    /* Sisakan nama ikon yang berupa string tidak kosong. */
    function cleanIcons(list) {
        var out = [];
        (list || []).forEach(function (x) {
            if (typeof x === 'string' && x.trim()) out.push(x.trim());
        });
        return out;
    }

    /* Bentuk node: editor memakai array [label, sub, icon, kind, href, icons],
       artikel memakai objek. nodeOf menyeragamkan keduanya. */
    function nodeOf(n) {
        if (Array.isArray(n)) {
            var icons = Array.isArray(n[5]) ? n[5] : (n[2] ? [n[2]] : []);
            return {
                label: typeof n[0] === 'string' ? n[0] : '',
                sub: typeof n[1] === 'string' ? n[1] : '',
                icon: typeof n[2] === 'string' ? n[2] : '',
                icons: cleanIcons(icons),
                kind: typeof n[3] === 'string' ? n[3] : '',
                href: typeof n[4] === 'string' ? n[4] : ''
            };
        }
        if (n && typeof n === 'object') {
            var ic = (n.icons && n.icons.length) ? n.icons : (n.icon ? [n.icon] : []);
            ic = cleanIcons(ic);
            return {
                label: typeof n.label === 'string' ? n.label : '',
                sub: typeof n.sub === 'string' ? n.sub : '',
                icon: typeof n.icon === 'string' ? n.icon : (ic[0] || ''),
                icons: ic,
                kind: typeof n.kind === 'string' ? n.kind : '',
                href: typeof n.href === 'string' ? n.href : ''
            };
        }
        return { label: '', sub: '', icon: '', icons: [], kind: '', href: '' };
    }

    function kindOf(icon) {
        return (icon && ICON_KIND[icon]) || 'process';
    }

    /* Baris node: name  Label  ikon [ikon...]
       Label adalah semua token kecuali barisan nama ikon di akhir. Jadi
       "mern MERN mongodb express react nodejs" -> label MERN, 4 ikon, dan
       "c Bare Metal hard-drive" -> label "Bare Metal", 1 ikon.

       A node line: the label is everything except a trailing run of known icon
       names, so multi-icon stacks work without extra punctuation. */
    function splitNode(tokens) {
        var id = tokens[0];
        var rest = tokens.slice(1);
        var icons = [];
        var known = knownIcons();
        while (rest.length > 1 && typeof rest[rest.length - 1] === 'string' &&
               known[rest[rest.length - 1]]) {
            icons.unshift(rest.pop());
        }
        if (!icons.length && rest.length === 1 && known[rest[0]]) {
            icons.push(rest.pop());
        }
        return { id: id, label: rest.join(' '), icons: icons, icon: icons[0] || '' };
    }

    /* Pecah satu baris jadi token, tapi pertahankan label di dalam tanda kutip
       sebagai satu token. */
    function tokenize(line) {
        var out = [], re = /"([^"]*)"|(\S+)/g, m;
        while ((m = re.exec(line))) out.push(m[1] !== undefined ? m[1] : m[2]);
        return out;
    }

    function parse(src) {
        var raw = String(src || '').replace(/\r\n?/g, '\n').split('\n');
        var lines = raw.map(function (l) { return l.replace(/\s+$/, ''); });

        var spec = { title: '', vertical: true, nodes: {}, columns: [], edges: [] };
        var legend = {};
        var errors = [];
        var colIndent = -1;
        var i = 0;

        function isWire(text) { return /^(\S+)\s*[<>]\s*/.test(text); }
        function indentOf(line) { return line.length - line.replace(/^\s+/, '').length; }
        function bare(text) { return /^\S+$/.test(text); }

        function addNode(id, label, icons) {
            var list = icons || [];
            var icon = list[0] || '';
            var n = spec.nodes[id];
            if (!n) {
                n = [label || id, '', icon, kindOf(icon), '', list];
                spec.nodes[id] = n;
            } else {
                var cur = nodeOf(n);
                if (label) n[0] = label;
                if (list.length) {
                    n[2] = icon;
                    n[3] = kindOf(icon);
                    n[5] = list;
                }
            }
            return id;
        }

        /* Satu baris node = satu kolom. Kolom adalah "baris" saat vertical,
           jadi rantai a > b > c tetap satu per satu. */
        function pushColumn(id) {
            spec.columns.push([id]);
        }

        while (i < lines.length) {
            var line = lines[i];
            var text = line.trim();
            i++;
            if (!text || text.charAt(0) === '#') continue;

            var indent = indentOf(line);

            if (/^topology\b/i.test(text) && !spec.title) {
                spec.title = text.replace(/^topology\b\s*/i, '').trim();
                continue;
            }
            if (/^(vertical|horizontal)$/i.test(text)) {
                spec.vertical = /^vertical$/i.test(text);
                continue;
            }

            var lm = /^(flow|back)\s+(.+)$/i.exec(text);
            if (lm) { legend[lm[1].toLowerCase()] = lm[2].trim(); continue; }

            /* Kabel: from > a b c : label */
            var w = /^(\S+)\s*([<>])\s*(.*)$/.exec(text);
            if (w) {
                var rest = w[3], label = '';
                var ci = rest.indexOf(' : ');
                if (ci > -1) { label = rest.slice(ci + 3).trim(); rest = rest.slice(0, ci); }
                var tos = tokenize(rest).filter(Boolean);
                var from = addNode(w[1], '', []);
                tos.forEach(function (t) {
                    addNode(t, '', []);
                    spec.edges.push({ from: from, to: t, label: label, back: w[2] === '<' });
                });
                continue;
            }

            var tokens = tokenize(text);

            /* Satu kata + diikuti baris menjorok = judul grup. */
            if (tokens.length === 1) {
                var hasChild = i < lines.length && lines[i].trim() &&
                    indentOf(lines[i]) > indent && !isWire(lines[i].trim());
                if (hasChild) {
                    var ids = [];
                    while (i < lines.length) {
                        var l2 = lines[i];
                        var t2 = l2.trim();
                        if (!t2 || t2.charAt(0) === '#') { i++; continue; }
                        if (indentOf(l2) <= indent || isWire(t2)) break;
                        var tk = tokenize(t2);
                        var nn = splitNode(tk);
                        addNode(nn.id, nn.label, nn.icons);
                        ids.push(nn.id);
                        i++;
                    }
                    if (ids.length) {
                        spec.columns.push(ids.length > 1
                            ? { label: tokens[0], nodes: ids }
                            : [ids[0]]);
                        colIndent = -1;
                    }
                    continue;
                }
            }

            var n = splitNode(tokens);
            addNode(n.id, n.label, n.icons);

            /* Baris yang lebih menjorok dari baris node sebelumnya ikut ke
               kolom yang sama. Jadi satu kolom bisa berisi beberapa node
               tanpa perlu judul grup:

                 mean  MEAN  si-mean
                   mern  MERN  mongodb express react nodejs

               Baris tanpa menjorok mulai kolom baru. */
            var lastCol = spec.columns[spec.columns.length - 1];
            if (colIndent >= 0 && indent > colIndent && lastCol &&
                Array.isArray(lastCol) && lastCol.length) {
                lastCol.push(n.id);
            } else {
                spec.columns.push([n.id]);
                colIndent = indent;
            }
        }

        /* Node tanpa kolom (mis. hanya muncul di kabel) tetap ditampilkan. */
        var placed = {};
        spec.columns.forEach(function (c) {
            (Array.isArray(c) ? c : c.nodes).forEach(function (id) { placed[id] = 1; });
        });
        Object.keys(spec.nodes).forEach(function (id) {
            if (!placed[id]) spec.columns.push([id]);
        });

        if (legend.flow || legend.back) spec.legend = legend;
        if (!spec.title) spec.title = 'Topology';
        if (!Object.keys(spec.nodes).length) errors.push('tidak ada node');
        if (errors.length) spec._errors = errors;
        return spec;
    }

    /* Balikkan ke teks, untuk tombol Copy dan untuk editor.

       Kolom jadi blok: baris pertama di indent 2, sisanya di indent 4.
       Tanpa judul grup, kolom tetap kelihatan dari menjoroknya. */
    function stringify(spec) {
        var out = ['topology ' + (spec.title || 'Topology')];
        var nodes = spec.nodes || {};
        var errors = spec._errors;

        function nodeLine(id, pad) {
            var raw = nodes[id];
            if (!raw) return null;
            var n = nodeOf(raw);
            var si = n.icons;
            var label = n.label && n.label !== id ? '  ' + n.label : '';
            if (!label && !si.length) return pad + id;
            return pad + id + label + (si.length ? '  ' + si.join(' ') : '');
        }

        (spec.columns || []).forEach(function (c) {
            var ids = Array.isArray(c) ? c : c.nodes;
            if (!ids || !ids.length) return;
            var titled = !Array.isArray(c) && c.label;
            if (titled) out.push('  ' + c.label);
            ids.forEach(function (id, k) {
                var line = nodeLine(id, (titled || k > 0) ? '    ' : '  ');
                if (line) out.push(line);
            });
        });

        (spec.edges || []).forEach(function (e) {
            var line = '  ' + e.from + (e.back ? ' < ' : ' > ') + e.to;
            if (e.label) line += ' : ' + e.label;
            out.push(line);
        });

        if (spec.legend && (spec.legend.flow || spec.legend.back)) {
            if (spec.legend.flow) out.push('flow ' + spec.legend.flow);
            if (spec.legend.back) out.push('back ' + spec.legend.back);
        }
        return out.join('\n');
    }

    global.Topo = { parse: parse, stringify: stringify, kindOf: kindOf, nodeOf: nodeOf };
})(window);