/* =============================================================================
   TOPOLOGI / TOPOLOGY DIAGRAMS
   Renderer diagram topologi statis untuk artikel. Membaca spesifikasi JSON dari
   atribut data-spec pada blok ```topology / ```diagram, lalu membangun layout
   responsif dan garis SVG. Diagram tidak memiliki panel, zoom, atau pan: ia diam
   di tempatnya mengikuti lebar kolom artikel.

   Static topology renderer for articles. Reads a JSON spec from the data-spec
   attribute of a ```topology / ```diagram block, then builds a responsive layout
   and SVG edges. No panel, zoom, or pan: the diagram sits still at the article
   column width.
   ============================================================================= */

(function () {
    'use strict';

    const SVG_NS = 'http://www.w3.org/2000/svg';
    const NARROW_MIN = 600;

    /* Ikon bawaan per jenis simpul; dipakai bila `icon` tidak diisi.
       Default icon per node kind; used when `icon` is omitted. */
    const KIND_ICON = {
        actor: 'user', client: 'monitor', process: 'cpu', store: 'database',
        choice: 'git-branch', out: 'app-window', tech: 'code', host: 'server',
        computer: 'monitor', server: 'server', database: 'database',
        cloud: 'cloud', security: 'shield', network: 'network'
    };

    function svgEl(tag, attrs) {
        const el = document.createElementNS(SVG_NS, tag);
        if (attrs) {
            Object.keys(attrs).forEach(k => el.setAttribute(k, attrs[k]));
        }
        return el;
    }

    function icon(name) {
        return '<svg class="topo-icon" aria-hidden="true"><use href="#i-' + name + '"></use></svg>';
    }

    /* Penghitung id panah unik per diagram. Unique arrow-id counter per diagram. */
    render.seq = 0;

    function esc(value) {
        return String(value == null ? '' : value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function ensureSprite() {
        if (!window.TOPOLOGY_SPRITE) return;
        if (document.getElementById('topology-sprite')) return;
        const holder = document.createElement('div');
        holder.id = 'topology-sprite';
        holder.setAttribute('aria-hidden', 'true');
        holder.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden';
        holder.innerHTML = window.TOPOLOGY_SPRITE;
        document.body.insertBefore(holder, document.body.firstChild);
    }

    /* Normalisasi sintaks ringkas -> bentuk kanonik. Compact syntax -> canonical.
       Menerima array untuk columns/nodes/edges, objek untuk legend, dan array
       untuk facilities/groups. Accepts arrays for columns/nodes/edges, an object
       for legend, and compact arrays for facilities/groups. */
    function normalize(spec) {
        const out = Object.assign({}, spec);

        if (Array.isArray(out.columns)) {
            out.columns = out.columns.map(c => Array.isArray(c) ? { nodes: c } : c);
        }
        if (out.grid && Array.isArray(out.columns)) {
            out.columns.forEach(c => { if (!c.grid) c.grid = out.grid; });
        }

        const nodes = {};
        Object.keys(out.nodes || {}).forEach(id => {
            const v = out.nodes[id];
            if (Array.isArray(v)) {
                const n = { label: v[0], sub: v[1] || '' };
                if (Array.isArray(v[2])) n.icons = v[2];
                else n.icon = v[2];
                n.kind = v[3] || 'process';
                if (v[4]) n.href = v[4];
                if (v[5]) n.live = v[5];
                nodes[id] = n;
            } else {
                nodes[id] = v;
            }
        });
        out.nodes = nodes;

        if (Array.isArray(out.edges)) {
            out.edges = out.edges.map(e => Array.isArray(e)
                ? { from: e[0], to: e[1], badge: e[2], back: e[3] }
                : e);
        }
        if (Array.isArray(out.back)) {
            out.edges = (out.edges || []).concat(out.back.map(e => Array.isArray(e)
                ? { from: e[0], to: e[1], badge: e[2], back: true }
                : Object.assign({ back: true }, e)));
            delete out.back;
        }

        if (out.legend && !Array.isArray(out.legend)) {
            out.legend = Object.keys(out.legend).map(k => ({ type: k, label: out.legend[k] }));
        }

        if (Array.isArray(out.facilities) && typeof out.facilities[0] === 'string') {
            out.facilitiesLabel = out.facilities[0];
            out.facilities = out.facilities.slice(1).map(f => Array.isArray(f)
                ? { icon: f[0], label: f[1] }
                : f);
        }

        if (Array.isArray(out.groups)) {
            out.groups = out.groups.map(g => Array.isArray(g)
                ? { label: g[0], nodes: g[1], icon: g[2] }
                : g);
        }

        return out;
    }

    function render(root, spec) {
        spec = normalize(spec);
        ensureSprite();

        root.innerHTML = '';
        root.classList.add('topo');
        if (spec.vertical) root.classList.add('topo--vertical');
        root.setAttribute('role', 'group');
        root.setAttribute('aria-label', spec.title || 'Diagram topologi');

        const stage = document.createElement('div');
        stage.className = 'topo-stage';

        const canvas = document.createElement('div');
        canvas.className = 'topo-canvas';

        const svg = svgEl('svg', { class: 'topo-svg' });

        /* Anak panah: satu set per diagram (id unik) supaya beberapa diagram
           di halaman yang sama tidak bentrok. Arrowheads: one set per diagram
           (unique ids) so several diagrams on a page never clash. */
        const arrowFlow = 'topo-arrow-flow-' + (++render.seq);
        const arrowBack = 'topo-arrow-back-' + (++render.seq);
        const defs = svgEl('defs');
        /* Anak panah berukuran tetap (userSpaceOnUse) supaya selalu terbaca,
           tidak mengecil mengikuti ketebalan garis. Fixed-size arrowheads. */
        const arrow = (id, fill) =>
            '<marker id="' + id + '" markerUnits="userSpaceOnUse" viewBox="0 0 10 10" ' +
            'refX="10" refY="5" markerWidth="10" markerHeight="10" orient="auto-start-reverse">' +
            '<path d="M 0 0 L 10 5 L 0 10 z" fill="' + fill + '"></path></marker>';
        defs.innerHTML =
            arrow(arrowFlow, '#58a6ff') +
            arrow(arrowBack, '#3fb950');
        svg.appendChild(defs);

        const gGroups = svgEl('g');
        const gEdges = svgEl('g');
        const gBadges = svgEl('g');
        svg.appendChild(gGroups);
        svg.appendChild(gEdges);
        svg.appendChild(gBadges);

        const columns = document.createElement('div');
        columns.className = 'topo-columns';

        canvas.appendChild(svg);
        canvas.appendChild(columns);
        stage.appendChild(canvas);

        /* Footer: legenda arah + fasilitas/tempat. Footer: direction legend and
           facilities/place chips. Rendered outside the scaled canvas so the text
           stays readable. */
        const footer = document.createElement('div');
        footer.className = 'topo-footer';

        if (spec.legend && spec.legend.length) {
            const row = document.createElement('div');
            row.className = 'topo-legend';
            spec.legend.forEach(item => {
                const span = document.createElement('span');
                span.className = 'topo-legend-item';
                const swatch = document.createElement('i');
                swatch.className = 'topo-swatch topo-swatch--' + (item.type || 'flow');
                span.appendChild(swatch);
                span.appendChild(document.createTextNode(item.label || ''));
                row.appendChild(span);
            });
            footer.appendChild(row);
        }

        if (spec.facilities && spec.facilities.length) {
            const row = document.createElement('div');
            row.className = 'topo-facilities';
            if (spec.facilitiesLabel) {
                const head = document.createElement('span');
                head.className = 'topo-facilities-label';
                head.textContent = spec.facilitiesLabel;
                row.appendChild(head);
            }
            spec.facilities.forEach(item => {
                const chip = document.createElement('span');
                chip.className = 'topo-facility';
                if (item.icon) chip.innerHTML = icon(item.icon);
                const text = document.createElement('span');
                text.textContent = item.label || '';
                chip.appendChild(text);
                row.appendChild(chip);
            });
            footer.appendChild(row);
        }

        if (footer.childElementCount) stage.appendChild(footer);

        root.appendChild(stage);

        const nodeEls = new Map();

        spec.columns.forEach(col => {
            const colEl = document.createElement('div');
            colEl.className = 'topo-col';
            if (col.grid && col.nodes.length > 1) {
                colEl.dataset.grid = String(col.grid);
            }
            col.nodes.forEach(id => {
                const data = spec.nodes[id];
                if (!data) return;

                /* Sel hantu: hanya mengisi grid, tidak digambar. Ghost cell:
                   reserves a grid slot but is not drawn. */
                if (data.hidden) {
                    const ghost = document.createElement('div');
                    ghost.className = 'topo-node topo-node--ghost';
                    ghost.setAttribute('aria-hidden', 'true');
                    colEl.appendChild(ghost);
                    return;
                }

                const el = document.createElement(data.href ? 'a' : 'div');
                el.className = 'topo-node topo-node--' + (data.kind || 'process');
                if (data.live) {
                    el.classList.add('topo-node--live');
                    if (data.live === 'cook') el.classList.add('topo-node--cook');
                }
                if (data.href) {
                    el.href = data.href;
                    el.target = '_blank';
                    el.rel = 'noopener noreferrer';
                }
                el.dataset.node = id;
                const iconList = data.icons && data.icons.length
                    ? data.icons
                    : [data.icon || KIND_ICON[data.kind] || 'circle-dot'];
                const multi = iconList.length > 1;
                if (multi) el.classList.add('topo-node--multi');
                el.innerHTML =
                    '<span class="topo-node-icon' + (multi ? ' topo-node-icon--multi' : '') + '">' +
                        iconList.map(icon).join('') +
                    '</span>' +
                    '<span class="topo-node-body">' +
                        '<span class="topo-node-label">' + esc(data.label) + '</span>' +
                        (data.sub ? '<span class="topo-node-sub">' + esc(data.sub) + '</span>' : '') +
                    '</span>';
                colEl.appendChild(el);
                nodeEls.set(id, el);
            });
            columns.appendChild(colEl);
        });

        /* ------------------------------------------------------------ geometry */

        function rectOf(el) {
            const cr = canvas.getBoundingClientRect();
            const r = el.getBoundingClientRect();
            return {
                x: r.left - cr.left,
                y: r.top - cr.top,
                w: r.width,
                h: r.height,
                cx: r.left - cr.left + r.width / 2,
                cy: r.top - cr.top + r.height / 2
            };
        }

        let edgeSeq = 0;
        let backBase = 0;
        function addPath(d, cls, marker) {
            const id = 'topo-e-' + (++edgeSeq);
            const attrs = { d: d, class: cls, id: id };
            if (marker) attrs['marker-end'] = 'url(#topo-arrow-' + marker + ')';
            const p = svgEl('path', attrs);
            gEdges.appendChild(p);
            return p;
        }

        /* Titik aliran: sebutir dot yang berjalan sepanjang edge untuk
           menunjukkan arah proses. Mengikuti path, bukan dash-offset.
           Flow dot: a dot that travels along the edge to show direction. */
        function addFlowDot(pathEl, kind) {
            if (!pathEl || !pathEl.id) return;
            const dot = svgEl('circle', {
                r: '2.4',
                class: 'topo-dot topo-dot--' + kind,
                fill: kind === 'back' ? '#3fb950' : '#58a6ff'
            });
            /* Durasi mengikuti panjang path supaya kecepatan titik konsisten
               dan terukur di semua diagram. Duration scales with path length so
               the dot speed is consistent and measurable across diagrams. */
            let len = 0;
            try { len = pathEl.getTotalLength(); } catch (err) { len = 0; }
            const dur = Math.max(0.9, Math.min(3.2, len / 55)).toFixed(2) + 's';
            const anim = svgEl('animateMotion', {
                path: pathEl.getAttribute('d'),
                dur: dur,
                repeatCount: 'indefinite',
                rotate: 'auto',
                calcMode: 'linear'
            });
            dot.appendChild(anim);
            /* Muncul dan hilang halus di ujung path supaya titik tidak terlihat
               seperti benda yang tiba-tiba nongol. Fade in/out at both ends. */
            const fade = svgEl('animate', {
                attributeName: 'opacity',
                values: '0;1;1;0',
                keyTimes: '0;0.15;0.85;1',
                dur: dur,
                repeatCount: 'indefinite'
            });
            dot.appendChild(fade);
            gEdges.appendChild(dot);
        }

        function addBadge(x, y, text, color) {
            const tone = color || '#58a6ff';
            const g = svgEl('g');
            g.appendChild(svgEl('circle', {
                cx: x, cy: y, r: 9,
                fill: 'none',
                stroke: tone,
                'stroke-width': '1.5'
            }));
            const t = svgEl('text', {
                x: x, y: y + 3.5,
                'text-anchor': 'middle',
                'font-size': '10',
                'font-weight': '700',
                fill: tone
            });
            t.textContent = text;
            g.appendChild(t);
            gBadges.appendChild(g);
        }

        function clear(node) {
            while (node.firstChild) node.removeChild(node.firstChild);
        }

        function forwardH(s, t) {
            const x1 = s.x + s.w, y1 = s.cy, x2 = t.x, y2 = t.cy;
            const dx = Math.max(6, (x2 - x1) / 2);
            return 'M ' + x1 + ' ' + y1 + ' C ' + (x1 + dx) + ' ' + y1 + ', ' + (x2 - dx) + ' ' + y2 + ', ' + x2 + ' ' + y2;
        }

        /* Jalur balik horizontal: keluar dari sisi kanan, turun di celah, lalu
           masuk ke sisi kanan tujuan. Tidak menembus simpul di bawah sumber.
           Horizontal return path: exit the right side, drop in the gap, and
           enter the target's right side; never through nodes below the source. */
        function backH(s, t, depth) {
            const dip = (backBase || (Math.max(s.y + s.h, t.y + t.h) + 16)) + depth;
            const leftward = (t.x + t.w) <= (s.x + s.w);
            const laneS = leftward ? s.x - 8 : s.x + s.w + 8;
            const laneT = leftward ? t.x + t.w + 8 : t.x - 8;
            return 'M ' + (leftward ? s.x : s.x + s.w) + ' ' + s.cy +
                ' L ' + laneS + ' ' + s.cy +
                ' L ' + laneS + ' ' + dip +
                ' L ' + laneT + ' ' + dip +
                ' L ' + laneT + ' ' + t.cy +
                ' L ' + (leftward ? t.x + t.w : t.x) + ' ' + t.cy;
        }

        function forwardV(s, t) {
            const x1 = s.cx, y1 = s.y + s.h, x2 = t.cx, y2 = t.y;
            const dy = Math.max(24, (y2 - y1) / 2);
            return 'M ' + x1 + ' ' + y1 + ' C ' + x1 + ' ' + (y1 + dy) + ', ' + x2 + ' ' + (y2 - dy) + ', ' + x2 + ' ' + y2;
        }

        function backV(s, t, depth) {
            /* Jalur balik vertikal: keluar dari sisi kiri, naik di jalur khusus
               di luar simpul, lalu masuk ke sisi kiri tujuan. Tidak melintasi
               teks simpul. Vertical return path: exit the left edge, climb a
               dedicated lane outside the nodes, and enter the target's left. */
            const lane = 14 + depth;
            const x1 = s.x, y1 = s.y + 6;
            const x2 = t.x, y2 = t.y + t.h - 6;
            return 'M ' + x1 + ' ' + y1 +
                ' C ' + (x1 - lane) + ' ' + (y1 - 10) + ', ' +
                      (x2 - lane) + ' ' + (y2 + 10) + ', ' +
                      x2 + ' ' + y2;
        }

        function busOutH(fromId, edges) {
            const s = rectOf(nodeEls.get(fromId));
            const targets = edges.map(e => rectOf(nodeEls.get(e.to)));
            const trunkX = s.x + s.w + 14;
            addPath('M ' + (s.x + s.w) + ' ' + s.cy + ' L ' + trunkX + ' ' + s.cy, 'topo-edge--bus');
            const ys = targets.map(t => t.cy);
            addPath('M ' + trunkX + ' ' + Math.min.apply(null, ys) + ' L ' + trunkX + ' ' + Math.max.apply(null, ys), 'topo-edge--bus');
            targets.forEach(t => {
                const p = addPath('M ' + trunkX + ' ' + t.cy + ' L ' + t.x + ' ' + t.cy, 'topo-edge--flow', 'flow');
                if (targets.length <= 8) addFlowDot(p, 'flow');
            });
        }

        function busInH(toId, edges) {
            const t = rectOf(nodeEls.get(toId));
            const sources = edges.map(e => rectOf(nodeEls.get(e.from)));
            const trunkX = t.x - 14;
            sources.forEach(s => {
                const p = addPath('M ' + (s.x + s.w) + ' ' + s.cy + ' L ' + trunkX + ' ' + s.cy, 'topo-edge--flow');
                if (sources.length <= 8) addFlowDot(p, 'flow');
            });
            const ys = sources.map(s => s.cy);
            addPath('M ' + trunkX + ' ' + Math.min.apply(null, ys) + ' L ' + trunkX + ' ' + Math.max.apply(null, ys), 'topo-edge--bus');
            addPath('M ' + trunkX + ' ' + t.cy + ' L ' + t.x + ' ' + t.cy, 'topo-edge--flow', 'flow');
        }

        function busOutV(fromId, edges) {
            const s = rectOf(nodeEls.get(fromId));
            const targets = edges.map(e => rectOf(nodeEls.get(e.to)));
            const trunkY = s.y + s.h + 14;
            addPath('M ' + s.cx + ' ' + (s.y + s.h) + ' L ' + s.cx + ' ' + trunkY, 'topo-edge--bus');
            const xs = targets.map(t => t.cx);
            addPath('M ' + Math.min.apply(null, xs) + ' ' + trunkY + ' L ' + Math.max.apply(null, xs) + ' ' + trunkY, 'topo-edge--bus');
            targets.forEach(t => {
                const p = addPath('M ' + t.cx + ' ' + trunkY + ' L ' + t.cx + ' ' + t.y, 'topo-edge--flow', 'flow');
                if (targets.length <= 8) addFlowDot(p, 'flow');
            });
        }

        function busInV(toId, edges) {
            const t = rectOf(nodeEls.get(toId));
            const sources = edges.map(e => rectOf(nodeEls.get(e.from)));
            const trunkY = t.y - 14;
            sources.forEach(s => {
                const p = addPath('M ' + s.cx + ' ' + (s.y + s.h) + ' L ' + s.cx + ' ' + trunkY, 'topo-edge--flow');
                if (sources.length <= 8) addFlowDot(p, 'flow');
            });
            const xs = sources.map(s => s.cx);
            addPath('M ' + Math.min.apply(null, xs) + ' ' + trunkY + ' L ' + Math.max.apply(null, xs) + ' ' + trunkY, 'topo-edge--bus');
            addPath('M ' + t.cx + ' ' + trunkY + ' L ' + t.cx + ' ' + t.y, 'topo-edge--flow', 'flow');
        }

        /* Ringkasan grid: apakah semua simpul berada di satu kolom grid?
           Grid summary: are all nodes inside a single grid column? */
        function gridInfo(ids) {
            const nodes = ids.map(id => nodeEls.get(id)).filter(Boolean);
            if (nodes.length < 2) return null;
            const col = nodes[0].parentElement;
            if (!col || !col.dataset || !col.dataset.grid) return null;
            if (!nodes.every(n => n.parentElement === col)) return null;
            const rects = nodes.map(rectOf);
            /* Kelompokkan per kolom (x). Satu trunk per kolom, jadi simpul di
               kolom ke-2/3 tetap tersambung tanpa garis menembus simpul lain.
               Group by column (x): one trunk per column, so nodes in the 2nd/3rd
               column still connect without lines crossing other nodes. */
            const map = new Map();
            rects.forEach(r => {
                const k = Math.round(r.x);
                if (!map.has(k)) map.set(k, []);
                map.get(k).push(r);
            });
            const cols = Array.from(map.keys()).sort((a, b) => a - b).map(x => {
                const rs = map.get(x);
                return {
                    x: x,
                    right: Math.max.apply(null, rs.map(r => r.x + r.w)),
                    rects: rs
                };
            });
            return {
                rects: rects,
                left: Math.min.apply(null, rects.map(r => r.x)),
                right: Math.max.apply(null, rects.map(r => r.x + r.w)),
                top: Math.min.apply(null, rects.map(r => r.y)),
                bottom: Math.max.apply(null, rects.map(r => r.y + r.h)),
                rows: Array.from(new Set(rects.map(r => Math.round(r.cy)))).sort((a, b) => a - b),
                cols: cols
            };
        }

        /* Fan-out ke grid multi-kolom: satu header di atas grid, satu trunk
           per kolom, dan satu stub berujung panah ke tiap simpul. Simpul di
           kolom ke-2/3 tidak dilewati garis simpul lain.
           Fan-out to a multi-column grid: a header above the grid, one trunk per
           column, and one arrowed stub per node. Nodes in later columns are not
           crossed by other nodes' lines. */
        function busOutGrid(fromId, toIds) {
            const g = gridInfo(toIds);
            if (!g) { busOutH(fromId, toIds.map(id => ({ to: id }))); return; }
            const s = rectOf(nodeEls.get(fromId));
            const headerY = g.top - 16;
            const trunks = g.cols.map(c => c.x - 14);

            if (s.x + s.w > trunks[0] - 4) { busOutH(fromId, toIds.map(id => ({ to: id }))); return; }
            /* Induk menyambung ke trunk kolom pertama; trunk itu naik ke header.
               The parent joins the first column's trunk; that trunk rises to the header. */
            addPath('M ' + (s.x + s.w) + ' ' + s.cy + ' L ' + trunks[0] + ' ' + s.cy, 'topo-edge--bus');
            addPath('M ' + trunks[0] + ' ' + headerY + ' L ' + trunks[trunks.length - 1] + ' ' + headerY, 'topo-edge--bus');

            g.cols.forEach((c, i) => {
                const maxCy = Math.max.apply(null, c.rects.map(r => r.cy));
                addPath('M ' + trunks[i] + ' ' + headerY + ' L ' + trunks[i] + ' ' + maxCy, 'topo-edge--bus');
                c.rects.forEach((r, ri) => {
                    const p = addPath('M ' + trunks[i] + ' ' + r.cy + ' L ' + r.x + ' ' + r.cy,
                        'topo-edge--flow', 'flow');
                    if (ri === 0) addFlowDot(p, 'flow');
                });
            });
        }

        /* Fan-in dari grid multi-kolom: stub dari tiap simpul ke trunk kolomnya,
           trunk naik ke header, lalu satu anak panah ke simpul tujuan.
           Fan-in from a multi-column grid: stubs to each column's trunk, trunks
           up to a header, then a single arrow into the target. */
        function busInGrid(toId, fromIds) {
            const g = gridInfo(fromIds);
            if (!g) { busInH(toId, fromIds.map(id => ({ from: id }))); return; }
            const t = rectOf(nodeEls.get(toId));
            const headerY = g.top - 16;
            const trunks = g.cols.map(c => c.right + 14);

            g.cols.forEach((c, i) => {
                const maxCy = Math.max.apply(null, c.rects.map(r => r.cy));
                c.rects.forEach((r, ri) => {
                    const p = addPath('M ' + (r.x + r.w) + ' ' + r.cy + ' L ' + trunks[i] + ' ' + r.cy,
                        'topo-edge--flow');
                    if (ri === 0) addFlowDot(p, 'flow');
                });
                addPath('M ' + trunks[i] + ' ' + headerY + ' L ' + trunks[i] + ' ' + maxCy, 'topo-edge--bus');
            });
            addPath('M ' + trunks[0] + ' ' + headerY + ' L ' + trunks[trunks.length - 1] + ' ' + headerY, 'topo-edge--bus');
            /* Sambungan terakhir ke simpul tujuan, dengan anak panah. */
            const last = trunks[trunks.length - 1];
            const lastMax = Math.max.apply(null, g.cols[g.cols.length - 1].rects.map(r => r.cy));
            if (t.cy > lastMax) addPath('M ' + last + ' ' + lastMax + ' L ' + last + ' ' + t.cy, 'topo-edge--bus');
            if (t.cy < headerY) addPath('M ' + last + ' ' + headerY + ' L ' + last + ' ' + t.cy, 'topo-edge--bus');
            addPath('M ' + last + ' ' + t.cy + ' L ' + t.x + ' ' + t.cy, 'topo-edge--flow', 'flow');
        }

        /* Versi sempit: induk di atas grid dan tujuan di bawah grid, jadi bus
           berjalan mendatar di atas/di bawah grid lalu turun per kolom. Narrow
           mode: parent above and target below the grid, so the bus runs
           horizontally above/below the grid and drops per column. */
        function busOutGridV(fromId, toIds) {
            const g = gridInfo(toIds);
            if (!g) { busOutV(fromId, toIds.map(id => ({ to: id }))); return; }
            const s = rectOf(nodeEls.get(fromId));
            const headerY = g.top - 10;
            const trunks = g.cols.map(c => c.x - 14);
            const last = trunks[trunks.length - 1];
            addPath('M ' + s.cx + ' ' + (s.y + s.h) + ' L ' + s.cx + ' ' + headerY, 'topo-edge--bus');
            addPath('M ' + trunks[0] + ' ' + headerY + ' L ' + last + ' ' + headerY, 'topo-edge--bus');
            g.cols.forEach((c, i) => {
                const maxCy = Math.max.apply(null, c.rects.map(r => r.cy));
                addPath('M ' + trunks[i] + ' ' + headerY + ' L ' + trunks[i] + ' ' + maxCy, 'topo-edge--bus');
                c.rects.forEach((r, ri) => {
                    const p = addPath('M ' + trunks[i] + ' ' + r.cy + ' L ' + r.x + ' ' + r.cy,
                        'topo-edge--flow', 'flow');
                    if (ri === 0) addFlowDot(p, 'flow');
                });
            });
        }

        function busInGridV(toId, fromIds) {
            const g = gridInfo(fromIds);
            if (!g) { busInV(toId, fromIds.map(id => ({ from: id }))); return; }
            const t = rectOf(nodeEls.get(toId));
            const footY = g.bottom + 10;
            const trunks = g.cols.map(c => c.right + 14);
            g.cols.forEach((c, i) => {
                const minCy = Math.min.apply(null, c.rects.map(r => r.cy));
                const maxCy = Math.max.apply(null, c.rects.map(r => r.cy));
                c.rects.forEach((r, ri) => {
                    const p = addPath('M ' + (r.x + r.w) + ' ' + r.cy + ' L ' + trunks[i] + ' ' + r.cy,
                        'topo-edge--flow');
                    if (ri === 0) addFlowDot(p, 'flow');
                });
                addPath('M ' + trunks[i] + ' ' + minCy + ' L ' + trunks[i] + ' ' + footY, 'topo-edge--bus');
            });
            addPath('M ' + trunks[0] + ' ' + footY + ' L ' + trunks[trunks.length - 1] + ' ' + footY, 'topo-edge--bus');
            /* Turun ke tepi atas simpul tujuan. Drop into the target's top edge. */
            addPath('M ' + t.cx + ' ' + footY + ' L ' + t.cx + ' ' + t.y, 'topo-edge--flow', 'flow');
        }

        function draw() {
            clear(gGroups);
            clear(gEdges);
            clear(gBadges);

            const vertical = root.classList.contains('topo--narrow');

            /* Sisakan ruang untuk garis balik (back edge) yang melengkung ke
               bawah pada layout horizontal, supaya tidak menimpa paragraf.
               Reserve room for back edges that dip below on the horizontal
               layout so they do not overlap the following paragraph. */
            let backCount = 0;
            (spec.edges || []).forEach(function (e) { if (e.back) backCount++; });
            if (!vertical && backCount) {
                /* Baseline semua garis balik ada di bawah simpul terendah, jadi
                   jalur balik tidak menembus simpul lain di kolom yang sama.
                   Every return path runs below the lowest node, so it never
                   crosses nodes stacked under its source. */
                let maxBottom = 0;
                nodeEls.forEach(function (n) {
                    const r = rectOf(n);
                    if (r.y + r.h > maxBottom) maxBottom = r.y + r.h;
                });
                backBase = maxBottom + 16;
                columns.style.paddingBottom = (16 + (backCount - 1) * 14 + 14) + 'px';
            } else {
                backBase = 0;
                columns.style.paddingBottom = '';
            }

            /* Sisakan strip atas untuk header bus grid dan label grup.
               Reserve a top strip for grid bus headers and group labels. */
            columns.style.paddingTop = '34px';

            const W = canvas.offsetWidth;
            const H = canvas.offsetHeight;
            svg.setAttribute('width', W);
            svg.setAttribute('height', H);
            svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);

            (spec.groups || []).forEach(group => {
                const rects = group.nodes.map(id => nodeEls.get(id)).filter(Boolean).map(rectOf);
                if (!rects.length) return;
                const x = Math.min.apply(null, rects.map(r => r.x));
                let labelX = x;
                if (group.icon) {
                    const use = svgEl('use', {
                        href: '#i-' + group.icon,
                        x: x, y: 2, width: 12, height: 12,
                        class: 'topo-group-icon'
                    });
                    gGroups.appendChild(use);
                    labelX = x + 17;
                }
                const label = svgEl('text', {
                    class: 'topo-group-label',
                    x: labelX, y: 12
                });
                label.textContent = group.label;
                gGroups.appendChild(label);
            });

            const edges = spec.edges || [];
            const outGroups = new Map();
            const inGroups = new Map();
            const covered = new Set();

            edges.forEach((e, i) => {
                if (e.back || e.style === 'back') return;
                if (!outGroups.has(e.from)) outGroups.set(e.from, []);
                outGroups.get(e.from).push(i);
                if (!inGroups.has(e.to)) inGroups.set(e.to, []);
                inGroups.get(e.to).push(i);
            });

            outGroups.forEach((list, fromId) => {
                if (list.length < 2) return;
                list.forEach(i => covered.add(i));
                const objs = list.map(i => edges[i]);
                const toIds = objs.map(e => e.to);
                if (gridInfo(toIds)) (vertical ? busOutGridV : busOutGrid)(fromId, toIds);
                else if (vertical) busOutV(fromId, objs);
                else busOutH(fromId, objs);
            });

            inGroups.forEach((list, toId) => {
                if (list.length < 2) return;
                list.forEach(i => covered.add(i));
                const objs = list.map(i => edges[i]);
                const fromIds = objs.map(e => e.from);
                if (gridInfo(fromIds)) (vertical ? busInGridV : busInGrid)(toId, fromIds);
                else if (vertical) busInV(toId, objs);
                else busInH(toId, objs);
            });

            let backIndex = 0;
            edges.forEach((e, i) => {
                const s = nodeEls.get(e.from);
                const t = nodeEls.get(e.to);
                if (!s || !t) return;

                const sr = rectOf(s), tr = rectOf(t);
                let depth = 0;

                if (!covered.has(i)) {
                    const isBack = e.back || e.style === 'back';
                    if (isBack) {
                        depth = vertical ? backIndex * 16 : backIndex * 14;
                        const p = addPath(vertical ? backV(sr, tr, depth) : backH(sr, tr, depth),
                            'topo-edge--back', 'back');
                        addFlowDot(p, 'back');
                        backIndex++;
                    } else if (e.style === 'link') {
                        addPath(vertical ? forwardV(sr, tr) : forwardH(sr, tr),
                            'topo-edge--flow', 'flow');
                    } else {
                        const p = addPath(vertical ? forwardV(sr, tr) : forwardH(sr, tr),
                            'topo-edge--flow', 'flow');
                        addFlowDot(p, 'flow');
                    }
                }

                if (e.badge) {
                    const isBack = e.back || e.style === 'back';
                    const tone = isBack ? '#3fb950' : '#58a6ff';
                    if (vertical) {
                        if (isBack) {
                            addBadge(Math.min(sr.x, tr.x) - (14 + depth) / 2 - 2,
                                (sr.y + tr.y + tr.h) / 2, e.badge, tone);
                        } else {
                            addBadge((sr.cx + tr.cx) / 2 + 16, (sr.y + sr.h + tr.y) / 2, e.badge, tone);
                        }
                    } else {
                        if (isBack) {
                            addBadge((sr.x + sr.w + tr.x) / 2, Math.max(sr.y + sr.h, tr.y + tr.h) + depth, e.badge, tone);
                        } else {
                            addBadge((sr.x + sr.w + tr.x) / 2, (sr.cy + tr.cy) / 2, e.badge, tone);
                        }
                    }
                }
            });
        }

        function relayout() {
            const forced = root.classList.contains('topo--vertical');
            const narrow = forced || (root.clientWidth > 0 && root.clientWidth < NARROW_MIN);
            root.classList.toggle('topo--narrow', narrow);

            if (narrow) {
                canvas.style.zoom = '1';
                canvas.style.width = '100%';
                canvas.style.margin = '0';
                draw();
                return;
            }

            canvas.style.width = 'max-content';
            canvas.style.margin = '0 auto';
            canvas.style.zoom = '1';
            draw();

            const natural = canvas.offsetWidth;
            const avail = root.clientWidth || stage.clientWidth;
            const scale = Math.min(1, avail / natural);
            canvas.style.zoom = String(scale);
            draw();
        }

        relayout();

        let resizeTimer = null;
        let lastWidth = -1;
        function schedule() {
            const w = Math.round(root.clientWidth);
            if (w === lastWidth) return;
            lastWidth = w;
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(relayout, 120);
        }

        window.addEventListener('resize', schedule);
        if (typeof ResizeObserver !== 'undefined') {
            const ro = new ResizeObserver(schedule);
            ro.observe(root);
        }
        if (document.fonts && document.fonts.ready) {
            document.fonts.ready.then(() => relayout()).catch(() => {});
        }
    }

    function init() {
        ensureSprite();
        document.querySelectorAll('.topology[data-spec]').forEach(el => {
            if (el.dataset.rendered === '1') return;
            el.dataset.rendered = '1';
            let spec;
            try {
                spec = JSON.parse(el.dataset.spec);
            } catch (err) {
                el.textContent = 'Diagram tidak valid.';
                return;
            }
            try {
                render(el, spec);
            } catch (err) {
                el.textContent = 'Diagram gagal dirender.';
            }
        });
    }

    window.Topology = {
        init: init,
        render: function (el, spec) { render(el, spec); }
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();