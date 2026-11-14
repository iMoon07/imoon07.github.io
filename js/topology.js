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

    /* Logo file dari katalog Alur (587 logo). The topology sprite only covers
       Lucide/Simple Icons; file logos resolve through AlurLogos. */
    function logoFile(name) {
        const logos = window.AlurLogos;
        const res = logos && logos.resolve ? logos.resolve(name) : null;
        return res && res.kind === 'file' ? res.href : null;
    }

    function fileIconEl(name) {
        const href = logoFile(name);
        if (!href) return null;
        const svg = svgEl('svg', { class: 'topo-icon topo-icon--file' });
        svg.setAttribute('aria-hidden', 'true');
        const img = svgEl('image');
        img.setAttribute('href', href);
        img.setAttribute('x', '0');
        img.setAttribute('y', '0');
        img.setAttribute('width', '100%');
        img.setAttribute('height', '100%');
        img.setAttribute('preserveAspectRatio', 'xMidYMid meet');
        svg.appendChild(img);
        return svg;
    }

    /* Ikon sebagai elemen (bukan string HTML) supaya tiap logo bisa dibungkus
       tautan sendiri. Icon as an element so each logo can carry its own link. */
    function iconEl(name) {
        const file = fileIconEl(name);
        if (file) return file;
        const svg = svgEl('svg', { class: 'topo-icon' });
        svg.setAttribute('aria-hidden', 'true');
        const use = svgEl('use');
        use.setAttribute('href', '#i-' + name);
        svg.appendChild(use);
        return svg;
    }

    /* Tautan eksternal dibuka di tab baru; jangkar dalam halaman (#...) tetap
       di tab yang sama. External links open in a new tab; in-page anchors stay. */
    function linkAttrs(a, href) {
        a.href = href;
        if (/^https?:/i.test(href)) {
            a.target = '_blank';
            a.rel = 'noopener noreferrer';
        }
    }

    function icon(name) {
        const href = logoFile(name);
        if (href) {
            const safe = href.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
            return '<svg class="topo-icon topo-icon--file" aria-hidden="true">' +
                '<image href="' + safe + '" x="0" y="0" width="100%" height="100%" ' +
                'preserveAspectRatio="xMidYMid meet"></image></svg>';
        }
        return '<svg class="topo-icon" aria-hidden="true"><use href="#i-' + name + '"></use></svg>';
    }

    /* Satu simpul dari sintaks ringkas. One node from compact syntax.
       `icons` menerima string, [ikon, href], atau {ikon, href, label}. */
    function nodeSpec(v) {
        if (!Array.isArray(v)) return v;
        const n = { label: v[0], sub: v[1] || '' };
        if (Array.isArray(v[2])) n.icons = v[2];
        else n.icon = v[2];
        n.kind = v[3] || 'process';
        if (v[4]) n.href = v[4];
        if (v[5]) n.live = v[5];
        return n;
    }

    /* Satu entri ikon -> daftar logo + tautan. String yang cocok dengan kunci
       di spec.components dibuka jadi komponen (label + logo + href); string lain
       tetap id sprite; [ikon, href] tetap logo tanpa teks. A string that names a
       component in spec.components resolves to a labelled component; any other
       string is a sprite id, and [icon, href] stays a bare logo. */
    function iconItems(data, spec) {
        const comps = (spec && spec.components) || {};
        const raw = data.icons && data.icons.length
            ? data.icons
            : [data.icon || KIND_ICON[data.kind] || 'circle-dot'];
        const out = [];
        raw.forEach(it => {
            if (typeof it === 'string') {
                if (Object.prototype.hasOwnProperty.call(comps, it)) {
                    const c = comps[it];
                    const label = Array.isArray(c) ? (c[0] || '') : (c.label || '');
                    const logo = Array.isArray(c) ? c[1] : c.icon;
                    const href = Array.isArray(c) ? c[2] : c.href;
                    (Array.isArray(logo) ? logo : [logo]).filter(Boolean).forEach(x => {
                        out.push({ icon: x, href: href || null, label: label, key: it });
                    });
                    return;
                }
                out.push({ icon: it, href: null, label: '', key: null });
                return;
            }
            if (Array.isArray(it)) {
                const href = it[1] || null;
                (Array.isArray(it[0]) ? it[0] : [it[0]]).filter(Boolean).forEach(x => {
                    out.push({ icon: x, href: href, label: it[2] || '', key: null });
                });
                return;
            }
            if (it && typeof it === 'object') {
                (Array.isArray(it.icon) ? it.icon : [it.icon]).filter(Boolean).forEach(x => {
                    out.push({ icon: x, href: it.href || null, label: it.label || '', key: it.key || null });
                });
            }
        });
        return out;
    }

    /* Penghitung id panah unik per diagram. Unique arrow-id counter per diagram. */
    render.seq = 0;

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
            nodes[id] = nodeSpec(out.nodes[id]);
        });
        out.nodes = nodes;

        if (out.root) out.root = nodeSpec(out.root);

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
        if (spec.dense) root.classList.add('topo--dense');
        if (spec.uniform) root.classList.add('topo--uniform');
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
        if (spec.caption) {
            const cap = document.createElement(spec.captionHref ? 'a' : 'div');
            cap.className = 'topo-caption';
            if (spec.captionHref) linkAttrs(cap, spec.captionHref);
            cap.textContent = spec.caption;
            stage.appendChild(cap);
        }
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

        /* Bangun satu simpul. Bila `href` ada, seluruh kartu jadi tautan; bila
           tiap logo punya href sendiri, simpul jadi div dan tiap logo dibungkus
           tautan agar bisa diklik terpisah. Build one node: the whole card is a
           link when only `href` is set; when each logo has its own href the card
           becomes a div and every logo is wrapped in its own anchor. */
        function buildNode(id, data) {
            const items = iconItems(data, spec);
            const hasIconHref = items.some(it => it.href);
            const wrap = !!data.href && !hasIconHref;
            const el = document.createElement(wrap ? 'a' : 'div');
            el.className = 'topo-node topo-node--' + (data.kind || 'process');
            if (data.live) {
                el.classList.add('topo-node--live');
                if (data.live === 'cook') el.classList.add('topo-node--cook');
            }
            if (wrap) linkAttrs(el, data.href);
            el.dataset.node = id;
            const multi = items.length > 1;
            if (multi) el.classList.add('topo-node--multi');

            const iconRow = document.createElement('span');
            iconRow.className = 'topo-node-icon' + (multi ? ' topo-node-icon--multi' : '');
            items.forEach(it => {
                let node = iconEl(it.icon);
                if (it.href) {
                    const a = document.createElement('a');
                    a.className = 'topo-node-icon-link';
                    linkAttrs(a, it.href);
                    a.title = it.label || it.icon;
                    a.setAttribute('aria-label', it.label || it.icon);
                    a.appendChild(node);
                    node = a;
                }
                iconRow.appendChild(node);
            });
            el.appendChild(iconRow);

            const body = document.createElement('span');
            body.className = 'topo-node-body';
            const label = document.createElement('span');
            label.className = 'topo-node-label';
            label.textContent = data.label;
            if (!wrap && data.href) {
                const a = document.createElement('a');
                a.className = 'topo-node-label-link';
                linkAttrs(a, data.href);
                a.appendChild(label);
                body.appendChild(a);
            } else {
                body.appendChild(label);
            }
            if (data.sub) {
                const sub = document.createElement('span');
                sub.className = 'topo-node-sub';
                sub.textContent = data.sub;
                body.appendChild(sub);
            }
            /* Nama komponen sebagai teks kecil yang bisa diklik. Bila label
               komponen sama dengan judul simpul, tidak diulang. Component names
               as small clickable text; a label equal to the node title is not
               repeated. */
            const parts = [];
            const seen = new Set();
            items.forEach(it => {
                if (!it.label || !it.key) return;
                if (it.label.toLowerCase() === String(data.label || '').toLowerCase()) return;
                if (seen.has(it.key)) return;
                seen.add(it.key);
                parts.push(it);
            });
            if (parts.length) {
                const row = document.createElement('span');
                row.className = 'topo-parts';
                parts.forEach(it => {
                    const a = document.createElement('a');
                    a.className = 'topo-part';
                    a.textContent = it.label;
                    if (it.href) linkAttrs(a, it.href);
                    row.appendChild(a);
                });
                body.appendChild(row);
            }
            el.appendChild(body);
            return el;
        }

        /* Simpul induk opsional di atas seluruh kolom, lengkap dengan kabel ke
           tiap kolom. Optional root above every column, wired down to each one. */
        if (spec.root) {
            const rootRow = document.createElement('div');
            rootRow.className = 'topo-root-row';
            const rootEl = buildNode('__root__', spec.root);
            rootEl.classList.add('topo-root-node');
            rootRow.appendChild(rootEl);
            canvas.insertBefore(rootRow, columns);
            nodeEls.set('__root__', rootEl);
        }

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

                const el = buildNode(id, data);
                colEl.appendChild(el);
                nodeEls.set(id, el);
            });
            columns.appendChild(colEl);
        });

        /* ------------------------------------------------------------ geometry */

        function rectOf(el) {
            const cr = canvas.getBoundingClientRect();
            const r = el.getBoundingClientRect();
            /* CSS zoom scales getBoundingClientRect() but not the SVG viewBox.
               Convert back to the canvas coordinate system so edges land on
               the nodes at every zoom level. */
            const zoom = canvas.offsetWidth ? cr.width / canvas.offsetWidth : 1;
            const x = (r.left - cr.left) / zoom;
            const y = (r.top - cr.top) / zoom;
            const w = r.width / zoom;
            const h = r.height / zoom;
            return {
                x: x,
                y: y,
                w: w,
                h: h,
                cx: x + w / 2,
                cy: y + h / 2
            };
        }

        let edgeSeq = 0;
        let backBase = 0;
        let backLaneX = 0;
        function addPath(d, cls, marker) {
            const id = 'topo-e-' + (++edgeSeq);
            const attrs = { d: d, class: cls, id: id };
            if (marker) {
                const arrowId = marker === 'back' ? arrowBack : arrowFlow;
                attrs['marker-end'] = 'url(#' + arrowId + ')';
            }
            const p = svgEl('path', attrs);
            gEdges.appendChild(p);
            return p;
        }

        /* Titik aliran: sebutir dot yang berjalan sepanjang edge untuk
           menunjukkan arah proses. Mengikuti path, bukan dash-offset.
           Flow dot: a dot that travels along the edge to show direction. */
        function addFlowDot(pathEl, kind) {
            if (!pathEl || !pathEl.id) return;
            /* Satu titik per path; sapuan akhir di draw() memastikan tidak ada
               edge yang tertinggal tanpa animasi. One dot per path; the final
               sweep in draw() guarantees no edge is left unanimated. */
            if (pathEl.dataset && pathEl.dataset.flow === '1') return;
            if (pathEl.dataset) pathEl.dataset.flow = '1';
            const color = kind === 'back' ? '#3fb950' : '#58a6ff';
            const g = svgEl('g', { class: 'topo-dot' });
            /* Halo tipis supaya titik terbaca di kabel panjang tanpa filter.
               A soft halo keeps the dot readable on long cables without a filter. */
            g.appendChild(svgEl('circle', {
                r: '8',
                fill: color,
                opacity: '0.2'
            }));
            g.appendChild(svgEl('circle', {
                r: '3.6',
                fill: color
            }));
            /* Durasi mengikuti panjang path dengan kecepatan tetap, jadi semua
               titik bergerak dengan laju yang sama di seluruh diagram.
               Duration follows path length at a constant speed, so every dot
               moves at the same rate across the diagram. */
            let len = 0;
            try { len = pathEl.getTotalLength(); } catch (err) { len = 0; }
            const dur = Math.max(0.6, Math.min(6, len / 55)).toFixed(2) + 's';
            const anim = svgEl('animateMotion', {
                path: pathEl.getAttribute('d'),
                dur: dur,
                repeatCount: 'indefinite',
                rotate: 'auto',
                calcMode: 'linear'
            });
            g.appendChild(anim);
            /* Muncul dan hilang halus di ujung path supaya titik tidak terlihat
               seperti benda yang tiba-tiba nongol. Fade in/out at both ends. */
            const fade = svgEl('animate', {
                attributeName: 'opacity',
                values: '0;1;1;0',
                keyTimes: '0;0.15;0.85;1',
                dur: dur,
                repeatCount: 'indefinite'
            });
            g.appendChild(fade);
            gEdges.appendChild(g);
        }

        function addBadge(x, y, text, color) {
            const tone = color || '#58a6ff';
            const g = svgEl('g');
            const bg = svgEl('circle', {
                cx: x, cy: y, r: 9,
                fill: 'none',
                stroke: tone,
                'stroke-width': '1.5'
            });
            /* Cakram belakang menutup kabel yang lewat di belakang angka.
               The backing disc hides any cable running behind the number. */
            bg.style.fill = 'var(--topo-bg, #111827)';
            g.appendChild(bg);
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
            const leftward = (t.x + t.w) <= (s.x + s.w);
            const gap = leftward ? (s.x - (t.x + t.w)) : (t.x - (s.x + s.w));
            /* Two neighbouring cards get a clean U-turn below them. A long
               return across the whole canvas is reserved for non-adjacent
               columns, where it really has to cross other cards. */
            const adjacent = Math.abs(s.cy - t.cy) < Math.max(20, Math.min(s.h, t.h) / 2)
                && gap >= -2 && gap < 80;
            if (adjacent) {
                /* The old hairpin squeezed the two lanes into a 4px slot and
                   looked like a scribble. A U below both cards is readable at
                   any width: down from the source, across, then up into the
                   target. */
                const sy = s.y + s.h;
                const ty = t.y + t.h;
                const dip = Math.max(sy, ty) + 18 + depth;
                const sx = s.cx;
                const tx = t.cx;
                const dir = tx < sx ? -1 : 1;
                const r = Math.min(10, Math.abs(sx - tx) / 2);
                return {
                    d: 'M ' + sx + ' ' + sy +
                        ' L ' + sx + ' ' + (dip - r) +
                        ' Q ' + sx + ' ' + dip + ' ' + (sx + dir * r) + ' ' + dip +
                        ' L ' + (tx - dir * r) + ' ' + dip +
                        ' Q ' + tx + ' ' + dip + ' ' + tx + ' ' + (dip - r) +
                        ' L ' + tx + ' ' + ty,
                    bx: (sx + tx) / 2,
                    by: dip
                };
            }
            const laneS = leftward ? s.x - 8 : s.x + s.w + 8;
            const laneT = leftward ? t.x + t.w + 8 : t.x - 8;
            const d = 'M ' + (leftward ? s.x : s.x + s.w) + ' ' + s.cy +
                ' L ' + laneS + ' ' + s.cy +
                ' L ' + laneS + ' ' + (backBase || (Math.max(s.y + s.h, t.y + t.h) + 16)) + depth +
                ' L ' + laneT + ' ' + (backBase || (Math.max(s.y + s.h, t.y + t.h) + 16)) + depth +
                ' L ' + laneT + ' ' + t.cy +
                ' L ' + (leftward ? t.x + t.w : t.x) + ' ' + t.cy;
            return {
                d: d,
                bx: (laneS + laneT) / 2,
                by: (backBase || (Math.max(s.y + s.h, t.y + t.h) + 16)) + depth
            };
        }

        function forwardV(s, t, off) {
            const dx = off || 0;
            const x1 = s.cx + dx, y1 = s.y + s.h, x2 = t.cx + dx, y2 = t.y;
            const dy = Math.max(24, (y2 - y1) / 2);
            return 'M ' + x1 + ' ' + y1 + ' C ' + x1 + ' ' + (y1 + dy) + ', ' + x2 + ' ' + (y2 - dy) + ', ' + x2 + ' ' + y2;
        }

        /* Jalur balik vertikal. Bila tujuan tepat di atas sumber (satu kolom,
           bersisihan), kabel sejajar kabel maju: keluar dari tepi atas sumber,
           naik lurus, masuk ke tepi bawah tujuan. Bila simpul lain menghalangi,
           pakai gutter kanan bersama.
           Vertical return. When the target sits directly above the source in the
           same column, the cable mirrors the forward cable: it leaves the
           source's top edge, climbs straight, and enters the target's bottom
           edge. When other nodes block the way, it uses the shared right
           gutter. */
        function backCable(s, t, depth) {
            /* Compare centres, not exact edges: labels make cards a few pixels
               wider or narrower, and a 4px difference must not send the return
               cable around the whole canvas. */
            const sameCol = Math.abs(s.cx - t.cx) < 14 && Math.abs(s.w - t.w) < 28;
            /* Jarak antar simpul vertikal adalah gap flex (~44px), jadi ambang
               "bersisihan" harus melewati gap itu tetapi tetap menolak simpul
               yang terpisah satu simpul lain (~88px+). The vertical flex gap is
               ~44px, so the adjacency threshold must clear that gap while still
               rejecting nodes separated by another node. */
            const adjacent = sameCol && Math.abs(s.y - (t.y + t.h)) < 60;
            if (adjacent) {
                /* Dua kabel (maju + balik) ditaruh simetris mengapit garis
                   tengah simpul, bukan menempel ke satu sisi. The forward and
                   return cables straddle the node's centre line. */
                const x = s.cx + 13;
                const y1 = s.y;
                const y2 = t.y + t.h;
                return {
                    d: 'M ' + x + ' ' + y1 + ' L ' + x + ' ' + y2,
                    bx: x + 15,
                    by: (y1 + y2) / 2
                };
            }
            const lane = (backLaneX || (s.x + s.w + 18)) + depth * 12;
            return {
                d: 'M ' + (s.x + s.w) + ' ' + s.cy +
                    ' L ' + lane + ' ' + s.cy +
                    ' L ' + lane + ' ' + t.cy +
                    ' L ' + (t.x + t.w) + ' ' + t.cy,
                bx: lane + 15,
                by: (s.cy + t.cy) / 2
            };
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
        /* Trunk tidak boleh keluar kanvas walau grid mepet tepi. Keep the trunk
           inside the canvas even when the grid touches the edge. */
        function clampX(x) {
            const W = canvas.offsetWidth || 0;
            if (!W) return x;
            return Math.max(4, Math.min(W - 4, x));
        }

        function busOutGridV(fromId, toIds) {
            const g = gridInfo(toIds);
            if (!g) { busOutV(fromId, toIds.map(id => ({ to: id }))); return; }
            const s = rectOf(nodeEls.get(fromId));
            const headerY = g.top - 12;
            /* Trunk di sisi luar kolom pertama dan terakhir supaya bus header
               simetris terhadap kanvas. Outer trunks keep the header bus
               symmetric around the canvas. */
            const trunks = g.cols.map((c, i) => clampX(i === 0 ? c.x - 14 : c.right + 14));
            const minT = Math.min.apply(null, trunks);
            const maxT = Math.max.apply(null, trunks);
            const spine = addPath('M ' + s.cx + ' ' + (s.y + s.h) + ' L ' + s.cx + ' ' + headerY, 'topo-edge--bus');
            addFlowDot(spine, 'flow');
            addPath('M ' + minT + ' ' + headerY + ' L ' + maxT + ' ' + headerY, 'topo-edge--bus');
            g.cols.forEach((c, i) => {
                const leftSide = i === 0;
                const maxCy = Math.max.apply(null, c.rects.map(r => r.cy));
                const trunk = addPath('M ' + trunks[i] + ' ' + headerY + ' L ' + trunks[i] + ' ' + maxCy, 'topo-edge--bus');
                if (i === 0 || i === g.cols.length - 1) addFlowDot(trunk, 'flow');
                c.rects.forEach((r, ri) => {
                    const x1 = leftSide ? r.x : r.x + r.w;
                    const p = addPath('M ' + x1 + ' ' + r.cy + ' L ' + trunks[i] + ' ' + r.cy,
                        'topo-edge--flow', 'flow');
                    if (ri === 0) addFlowDot(p, 'flow');
                });
            });
        }

        function busInGridV(toId, fromIds) {
            const g = gridInfo(fromIds);
            if (!g) { busInV(toId, fromIds.map(id => ({ from: id }))); return; }
            const t = rectOf(nodeEls.get(toId));
            const footY = g.bottom + 12;
            const trunks = g.cols.map((c, i) => clampX(i === 0 ? c.x - 14 : c.right + 14));
            const minT = Math.min.apply(null, trunks);
            const maxT = Math.max.apply(null, trunks);
            g.cols.forEach((c, i) => {
                const leftSide = i === 0;
                const minCy = Math.min.apply(null, c.rects.map(r => r.cy));
                c.rects.forEach((r, ri) => {
                    const x1 = leftSide ? r.x : r.x + r.w;
                    const p = addPath('M ' + x1 + ' ' + r.cy + ' L ' + trunks[i] + ' ' + r.cy,
                        'topo-edge--flow');
                    if (ri === 0) addFlowDot(p, 'flow');
                });
                const trunk = addPath('M ' + trunks[i] + ' ' + minCy + ' L ' + trunks[i] + ' ' + footY, 'topo-edge--bus');
                if (i === 0 || i === g.cols.length - 1) addFlowDot(trunk, 'flow');
            });
            addPath('M ' + minT + ' ' + footY + ' L ' + maxT + ' ' + footY, 'topo-edge--bus');
            /* Turun dari tengah bus ke tepi atas simpul tujuan. Drop from the
               middle of the foot bus into the target's top edge. */
            const drop = addPath('M ' + t.cx + ' ' + footY + ' L ' + t.cx + ' ' + t.y, 'topo-edge--flow', 'flow');
            addFlowDot(drop, 'flow');
        }

        /* Kabel induk: satu simpul di atas, satu bus mendatar, lalu satu kabel
           turun ke tiap kolom. Di layar sempit kolom berbaris, jadi kabel
           induk turun di gutter kiri lalu masuk ke tiap baris. Root wire: one
           node above, one horizontal bus, then a drop to each column. On narrow
           screens the columns wrap, so the root drops down the left gutter and
           enters each row. */
        function busOutRoot(fromId, toIds) {
            const s = rectOf(nodeEls.get(fromId));
            const targets = toIds.map(id => rectOf(nodeEls.get(id)));
            const narrow = root.classList.contains('topo--narrow');
            const busY = s.y + s.h + 16;

            if (narrow) {
                /* Gutter kiri: 8px di luar tepi kolom paling kiri. Left gutter:
                   8px outside the leftmost column edge. */
                const lane = Math.max(4, Math.min.apply(null, targets.map(t => t.x)) - 8);
                const ys = targets.map(t => t.cy);
                const maxY = Math.max.apply(null, ys);
                const lead = addPath('M ' + s.cx + ' ' + (s.y + s.h) +
                    ' L ' + s.cx + ' ' + busY + ' L ' + lane + ' ' + busY, 'topo-edge--bus');
                addFlowDot(lead, 'flow');
                const trunk = addPath('M ' + lane + ' ' + busY + ' L ' + lane + ' ' + maxY, 'topo-edge--bus');
                addFlowDot(trunk, 'flow');
                targets.forEach(t => {
                    const p = addPath('M ' + lane + ' ' + t.cy + ' L ' + t.x + ' ' + t.cy,
                        'topo-edge--flow', 'flow');
                    if (t.cy < maxY - 4) addFlowDot(p, 'flow');
                });
                return;
            }

            const xs = targets.map(t => t.cx);
            const minX = Math.min.apply(null, xs);
            const maxX = Math.max.apply(null, xs);
            const spine = addPath('M ' + s.cx + ' ' + (s.y + s.h) + ' L ' + s.cx + ' ' + busY, 'topo-edge--bus');
            addFlowDot(spine, 'flow');
            addPath('M ' + minX + ' ' + busY + ' L ' + maxX + ' ' + busY, 'topo-edge--bus');
            targets.forEach(t => {
                const p = addPath('M ' + t.cx + ' ' + busY + ' L ' + t.cx + ' ' + t.y, 'topo-edge--flow', 'flow');
                addFlowDot(p, 'flow');
            });
        }

        /* Perlu gutter kanan? Hanya bila ada edge balik yang tidak bisa naik
           lurus karena simpul lain menghalangi. Needs the right gutter only
           when a return edge cannot climb straight because another node sits
           between the two. */
        function needsBackGutter() {
            const edges = spec.edges || [];
            for (let i = 0; i < edges.length; i++) {
                const e = edges[i];
                if (!e.back) continue;
                const s = nodeEls.get(e.from);
                const t = nodeEls.get(e.to);
                if (!s || !t) return true;
                const sr = rectOf(s), tr = rectOf(t);
                const sameCol = Math.abs(sr.cx - tr.cx) < 14 && Math.abs(sr.w - tr.w) < 28;
                const adjacent = sameCol && Math.abs(sr.y - (tr.y + tr.h)) < 60;
                if (!adjacent) return true;
            }
            return false;
        }

        function draw() {
            clear(gGroups);
            clear(gEdges);
            clear(gBadges);

            const vertical = root.classList.contains('topo--vertical')
                || root.classList.contains('topo--narrow');
            const edgeList = spec.edges || [];
            const gallery = edgeList.length === 0 && (spec.groups || []).length > 1;

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

            /* Mode vertikal: gutter kanan hanya bila ada balikan yang tidak
               bisa naik lurus (simpul lain menghalangi). Vertical mode: the
               right gutter is reserved only when a return edge cannot climb
               straight because another node blocks it. */
            if (vertical && backCount && needsBackGutter()) {
                columns.style.paddingRight = '34px';
            } else {
                columns.style.paddingRight = '';
            }

            /* Posisi lane balik: 18px di kanan simpul paling kanan. Return lane
               sits 18px right of the rightmost node. */
            backLaneX = 0;
            if (vertical && backCount && needsBackGutter()) {
                let maxRight = 0;
                nodeEls.forEach(function (n) {
                    const r = rectOf(n);
                    if (r.x + r.w > maxRight) maxRight = r.x + r.w;
                });
                backLaneX = Math.round(maxRight + 18);
            }

            /* Sisakan strip atas untuk header bus grid dan label grup.
               Reserve a top strip for grid bus headers and group labels. */
            columns.style.paddingTop = '34px';

            const W = canvas.offsetWidth;
            const H = canvas.offsetHeight;
            svg.setAttribute('width', W);
            svg.setAttribute('height', H);
            svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);

            (spec.groups || []).forEach((group, groupIndex) => {
                const rects = group.nodes.map(id => nodeEls.get(id)).filter(Boolean).map(rectOf);
                if (!rects.length) return;
                const x = Math.min.apply(null, rects.map(r => r.x));
                const top = Math.min.apply(null, rects.map(r => r.y));
                /* On narrow screens the groups stack, so each label must sit
                   above its own group, not all on the same top row. */
                const labelY = vertical ? Math.max(10, top - 6) : 12;
                const iconY = labelY - 10;
                let labelX = x;
                if (group.icon) {
                    const use = svgEl('use', {
                        href: '#i-' + group.icon,
                        x: x, y: iconY, width: 12, height: 12,
                        class: 'topo-group-icon'
                    });
                    gGroups.appendChild(use);
                    labelX = x + 17;
                }
                const label = svgEl('text', {
                    class: 'topo-group-label',
                    x: labelX, y: labelY
                });
                label.textContent = gallery ? (groupIndex + 1) + ' · ' + group.label : group.label;
                gGroups.appendChild(label);
            });

            const edges = edgeList;
            const hasRootEdges = edges.some(function (e) {
                return e.from === '__root__' || e.to === '__root__';
            });
            const covered = new Set();

            /* Satu simpul yang bercabang ke banyak simpul di dalam satu grid
               (atau sebaliknya) digambar sebagai satu bus, bukan N kurva.
               N kurva dari satu induk saling menembus kartu di baris tengah,
               jadi kabel tampak "terbang" menembus kotak dan teks.
               One node branching into a whole grid (or the reverse) is drawn as
               one bus, not N curves: N curves from one parent cross the cards
               in the middle rows, so the cables look like they fly through
               boxes and text. */
            function fanGroups() {
                const groups = spec.groups || [];
                const labelled = ids => groups.some(gr =>
                    ids.some(id => gr.nodes.indexOf(id) >= 0));
                const out = [];
                const byFrom = new Map();
                const byTo = new Map();
                edgeList.forEach((e, i) => {
                    if (e.back || e.style === 'back') return;
                    if (!byFrom.has(e.from)) byFrom.set(e.from, []);
                    byFrom.get(e.from).push({ e: e, i: i });
                    if (!byTo.has(e.to)) byTo.set(e.to, []);
                    byTo.get(e.to).push({ e: e, i: i });
                });
                /* Jangan rebut edge yang sudah dipakai bus lain. Do not claim an
                   edge that another bus already uses. */
                const free = list => list.filter(x => !covered.has(x.i));
                byFrom.forEach((list, from) => {
                    const items = free(list);
                    if (items.length < 3) return;
                    const ids = items.map(x => x.e.to);
                    const g = gridInfo(ids);
                    if (!g || labelled(ids)) return;
                    const s = rectOf(nodeEls.get(from));
                    if (!s) return;
                    const above = s.y + s.h <= g.top - 4;
                    const left = s.x + s.w <= g.left - 4;
                    if (vertical && !above) return;
                    if (!vertical && !left) return;
                    items.forEach(x => covered.add(x.i));
                    out.push({
                        kind: 'out', from: from, ids: ids, ids2: items,
                        vertical: vertical
                    });
                });
                byTo.forEach((list, to) => {
                    const items = free(list);
                    if (items.length < 3) return;
                    const ids = items.map(x => x.e.from);
                    const g = gridInfo(ids);
                    if (!g || labelled(ids)) return;
                    const t = rectOf(nodeEls.get(to));
                    if (!t) return;
                    const below = t.y >= g.bottom + 4;
                    const right = t.x >= g.right + 4;
                    if (vertical && !below) return;
                    if (!vertical && !right) return;
                    items.forEach(x => covered.add(x.i));
                    out.push({
                        kind: 'in', to: to, ids: ids, ids2: items,
                        vertical: vertical
                    });
                });
                return out;
            }

            fanGroups().forEach(function (bus) {
                if (bus.vertical) {
                    if (bus.kind === 'out') busOutGridV(bus.from, bus.ids);
                    else busInGridV(bus.to, bus.ids);
                } else {
                    if (bus.kind === 'out') busOutGrid(bus.from, bus.ids);
                    else busInGrid(bus.to, bus.ids);
                }
            });

            /* Root bus only when the spec did not spell out a root edge.
               Explicit __root__ edges are drawn as ordinary direct edges so
               rootWires:false means "do not auto-bus", not "delete the root". */
            if (spec.root && spec.rootWires !== false && !hasRootEdges && nodeEls.has('__root__')) {
                const rootIds = (spec.columns || [])
                    .map(c => c.nodes && c.nodes[0])
                    .filter(id => id && nodeEls.has(id));
                if (rootIds.length) busOutRoot('__root__', rootIds);
            }

            let backIndex = 0;
            edges.forEach((e, i) => {
                const s = nodeEls.get(e.from);
                const t = nodeEls.get(e.to);
                if (!s || !t) return;

                const sr = rectOf(s), tr = rectOf(t);
                const isBack = e.back || e.style === 'back';
                let depth = 0;
                let backGeom = null;

                /* Root edges are vertical by definition: the root sits above the
                   columns, so a side-to-side cable would cut across the canvas.
                   Root edges are vertical by definition: the root sits above the
                   columns, so a side-to-side cable would cut across the canvas. */
                if (e.from === '__root__' && tr.y > sr.y + sr.h) {
                    const midY = (sr.y + sr.h + tr.y) / 2;
                    const p = addPath(
                        'M ' + sr.cx + ' ' + (sr.y + sr.h) +
                        ' C ' + sr.cx + ' ' + midY +
                        ' , ' + tr.cx + ' ' + midY +
                        ' , ' + tr.cx + ' ' + tr.y,
                        'topo-edge--flow', 'flow');
                    addFlowDot(p, 'flow');
                    if (e.badge && spec.badges !== false) {
                        addBadge((sr.cx + tr.cx) / 2, midY, e.badge, '#58a6ff');
                    }
                    return;
                }

                if (!covered.has(i)) {
                    if (isBack) {
                        depth = vertical ? backIndex : backIndex * 14;
                        if (vertical) {
                            /* Kabel balik: sejajar kabel maju bila bersisihan,
                               atau gutter kanan bila terhalang simpul lain.
                               Return cable: parallel to the forward cable when
                               adjacent, or the right gutter when blocked. */
                            backGeom = backCable(sr, tr, depth);
                            const p = addPath(backGeom.d, 'topo-edge--back', 'back');
                            addFlowDot(p, 'back');
                        } else {
                            backGeom = backH(sr, tr, depth);
                            const p = addPath(backGeom.d,
                                'topo-edge--back', 'back');
                            addFlowDot(p, 'back');
                        }
                        backIndex++;
                    } else {
                        /* Bila ada edge balik untuk pasangan yang sama, kabel
                           maju digeser ke kiri supaya sepasang kabel seimbang
                           di sekitar garis tengah. If a return edge exists for
                           the same pair, the forward cable shifts left so the
                           pair is balanced around the centre line. */
                        const twinBack = edges.some(o =>
                            o !== e && o.from === e.to && o.to === e.from &&
                            (o.back || o.style === 'back'));
                        const p = addPath(
                            vertical ? forwardV(sr, tr, twinBack ? -13 : 0) : forwardH(sr, tr),
                            'topo-edge--flow', 'flow');
                        addFlowDot(p, 'flow');
                    }
                }

                if (e.badge && spec.badges !== false) {
                    const tone = isBack ? '#3fb950' : '#58a6ff';
                    if (vertical) {
                        if (isBack) {
                            /* Angka ditaruh di sisi kabel, bukan menempel di
                               atasnya, supaya garis tidak memotong digit.
                               Badges sit beside the cable so the line never
                               cuts through the number. */
                            const bx = backGeom ? backGeom.bx : (backLaneX || sr.x + sr.w + 18) + 15;
                            const by = backGeom ? backGeom.by : (sr.cy + tr.cy) / 2;
                            addBadge(bx, by, e.badge, tone);
                        } else {
                            /* Badge maju di kiri kabel, badge balik di kanan,
                               supaya kedua angka tidak berdesakan. Forward
                               badge on the left, return badge on the right. */
                            addBadge((sr.cx + tr.cx) / 2 - 16, (sr.y + sr.h + tr.y) / 2, e.badge, tone);
                        }
                    } else {
                        if (isBack) {
                            if (backGeom) {
                                addBadge(backGeom.bx, backGeom.by, e.badge, tone);
                            } else {
                                addBadge((sr.x + sr.w + tr.x) / 2,
                                    Math.max(sr.y + sr.h, tr.y + tr.h) + depth,
                                    e.badge, tone);
                            }
                        } else {
                            addBadge((sr.x + sr.w + tr.x) / 2, (sr.cy + tr.cy) / 2, e.badge, tone);
                        }
                    }
                }
            });

            /* Sapuan akhir: setiap path yang belum punya titik diberi satu, jadi
               semua koneksi bergerak dengan efek dan arah yang sama. Final
               sweep: give every path without a dot one, so all connections
               animate with the same effect and direction. */
            Array.prototype.forEach.call(gEdges.querySelectorAll('path'), function (p) {
                if (p.dataset && p.dataset.flow === '1') return;
                const back = (p.getAttribute('class') || '').indexOf('topo-edge--back') >= 0;
                addFlowDot(p, back ? 'back' : 'flow');
            });
        }

        function relayout() {
            const forced = root.classList.contains('topo--vertical');
            /* Narrow hanya soal lebar, bukan arah alur: diagram vertikal di
               layar lebar tetap memakai grid penuh. Narrow is about width only,
               not flow direction: a vertical diagram on a wide screen keeps its
               full grid. */
            const narrow = root.clientWidth > 0 && root.clientWidth < NARROW_MIN;
            root.classList.toggle('topo--narrow', narrow);

            if (forced || narrow) {
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