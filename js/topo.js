/* =============================================================================
   TOPO — renderer diagram
   Satu renderer untuk editor dan artikel, jadi keduanya tidak mungkin beda.

   Spec kanonik: { title, vertical, columns, nodes, edges, legend }
     columns : [ "a" | ["a","b"] | { label:"grup", nodes:["a","b"] } ]
     nodes   : { id: { label, sub, icon, kind } }
     edges   : { from, to, label, back }

   Kabel digambar orthogonal (H/V), bukan garis diagonal. Setiap arah punya
   kanal sendiri supaya maju dan balik tidak saling menimpa.

   TOPO — diagram renderer. Wires are orthogonal (H/V), never diagonal, and each
   direction gets its own channel so forward and return paths never overlap.
   ============================================================================= */
(function (global) {
    'use strict';

    var SVG = 'http://www.w3.org/2000/svg';
    var FLOW = '#58a6ff';
    var BACK = '#3fb950';

    function el(tag, cls, text) {
        var n = document.createElement(tag);
        if (cls) n.className = cls;
        if (text != null) n.textContent = text;
        return n;
    }
    function svgEl(tag, attrs) {
        var n = document.createElementNS(SVG, tag);
        if (attrs) Object.keys(attrs).forEach(function (k) { n.setAttribute(k, attrs[k]); });
        return n;
    }
    function clear(node) { while (node.firstChild) node.removeChild(node.firstChild); }
    function r1(n) { return Math.round(n * 10) / 10; }

    /* Ikon: logo berkas bila ada di katalog, kalau tidak pakai sprite. */
    function iconNode(name) {
        /* Nama ikon yang bukan string (angka, objek, sisa data lama) jangan
           diteruskan ke resolver — jatuh ke ikon cadangan. */
        if (typeof name !== 'string') name = '';
        name = name.trim();
        var logos = global.AlurLogos;
        var res = logos && logos.resolve ? logos.resolve(name) : null;
        var file = res && res.kind === 'file' ? res.href : null;
        var svg = svgEl('svg', { class: 'tp-icon', 'aria-hidden': 'true' });
        if (file) {
            var img = svgEl('image');
            img.setAttribute('href', file);
            img.setAttribute('x', '0');
            img.setAttribute('y', '0');
            img.setAttribute('width', '100%');
            img.setAttribute('height', '100%');
            img.setAttribute('preserveAspectRatio', 'xMidYMid meet');
            svg.appendChild(img);
        } else {
            var use = svgEl('use');
            use.setAttribute('href', '#i-' + (name || 'circle-dot'));
            svg.appendChild(use);
        }
        return svg;
    }

    function ensureSprite() {
        if (!global.TOPOLOGY_SPRITE) return;
        if (document.getElementById('topo-sprite')) return;
        var holder = el('div');
        holder.id = 'topo-sprite';
        holder.setAttribute('aria-hidden', 'true');
        holder.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden';
        holder.innerHTML = global.TOPOLOGY_SPRITE;
        document.body.insertBefore(holder, document.body.firstChild);
    }

    /* Susun grid kolom. Kolom isi satu = tumpukan tunggal; grup = grid kecil. */
    function columnsOf(spec) {
        return (spec.columns || []).map(function (c) {
            if (Array.isArray(c)) return { label: '', nodes: c };
            return { label: c.label || '', nodes: c.nodes || [] };
        }).filter(function (c) { return c.nodes.length; });
    }

    function gridOf(col) {
        if (!col.nodes.length || col.label) return 0;
        if (col.nodes.length < 3) return 0;
        return Math.min(3, col.nodes.length);
    }

    function render(host, spec) {
        ensureSprite();
        host.innerHTML = '';
        host.classList.remove('tp--v', 'tp--h');
        host.classList.add('tp');
        host.classList.add(spec.vertical === false ? 'tp--h' : 'tp--v');

        var head = el('div', 'tp-head');
        if (spec.title) head.appendChild(el('h3', 'tp-title', spec.title));
        var nodeCount = Object.keys(spec.nodes || {}).length;
        var edgeCount = (spec.edges || []).length;
        head.appendChild(el('span', 'tp-count',
            nodeCount + (nodeCount === 1 ? ' node' : ' nodes') + ' · ' +
            edgeCount + (edgeCount === 1 ? ' edge' : ' edges')));
        host.appendChild(head);

        var board = el('div', 'tp-board');
        var wires = svgEl('svg', { class: 'tp-wires', 'aria-hidden': 'true' });
        var defs = svgEl('defs');
        defs.innerHTML =
            /* Warna diisi eksplisit: currentColor di dalam <defs> tidak mewarisi
               warna path, jadi panah balik akan ikut biru. */
            '<marker id="tp-ah" markerUnits="userSpaceOnUse" viewBox="0 0 10 10" ' +
            'refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto">' +
            '<path d="M 0 0 L 10 5 L 0 10 z" fill="' + FLOW + '"/></marker>' +
            '<marker id="tp-ah-b" markerUnits="userSpaceOnUse" viewBox="0 0 10 10" ' +
            'refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto">' +
            '<path d="M 0 0 L 10 5 L 0 10 z" fill="' + BACK + '"/></marker>';
        wires.appendChild(defs);
        var gWires = svgEl('g', { class: 'tp-wires-g' });
        var gLabels = svgEl('g', { class: 'tp-labels-g' });
        wires.appendChild(gWires);
        wires.appendChild(gLabels);
        board.appendChild(wires);

        var grid = el('div', 'tp-grid');
        board.appendChild(grid);

        var cols = columnsOf(spec);
        var nodeEls = {};

        cols.forEach(function (col) {
            var colEl = el('div', 'tp-col');
            if (col.label) colEl.appendChild(el('div', 'tp-group', col.label));
            var g = gridOf(col);
            if (g) {
                colEl.classList.add('tp-col--grid');
                colEl.style.setProperty('--tp-cols', String(g));
            }
            col.nodes.forEach(function (id) {
                var raw = (spec.nodes || {})[id];
                if (!raw) return;
                var n = (global.Topo && global.Topo.nodeOf) ? global.Topo.nodeOf(raw) : raw;
                var card = el('a', 'tp-node tp-node--' + (n.kind || 'process'));
                if (n.href) {
                    card.href = n.href;
                    if (/^https?:/i.test(n.href)) { card.target = '_blank'; card.rel = 'noopener noreferrer'; }
                } else {
                    card.removeAttribute('href');
                }
                card.dataset.node = id;
                var icons = (n.icons && n.icons.length) ? n.icons : (n.icon ? [n.icon] : []);
                if (icons.length > 1) {
                    var row = el('span', 'tp-icons');
                    icons.forEach(function (name) { row.appendChild(iconNode(name)); });
                    card.appendChild(row);
                } else if (icons.length) {
                    var tile = el('span', 'tp-icon-tile');
                    tile.appendChild(iconNode(icons[0]));
                    card.appendChild(tile);
                }
                var body = el('span', 'tp-node-body');
                body.appendChild(el('span', 'tp-node-label', n.label || id));
                if (n.sub) body.appendChild(el('span', 'tp-node-sub', n.sub));
                card.appendChild(body);
                colEl.appendChild(card);
                nodeEls[id] = card;
            });
            grid.appendChild(colEl);
        });

        host.appendChild(board);

        var legend = spec.legend || {};
        var foot = el('div', 'tp-foot');
        foot.appendChild(legendItem('', legend.flow || 'Request'));
        foot.appendChild(legendItem('tp-key--back', legend.back || 'Response'));
        host.appendChild(foot);

        function legendItem(cls, label) {
            var item = el('span', 'tp-key ' + cls);
            item.appendChild(el('i', 'tp-key-line'));
            item.appendChild(el('b', 'tp-key-label', label));
            return item;
        }

        var raf = global.requestAnimationFrame || function (f) { setTimeout(f, 16); };
        raf(function () { raf(function () { paint(); }); });

        function paint() {
            var boardBox = board.getBoundingClientRect();
            var W = board.clientWidth, H = board.clientHeight;
            if (!W || !H) return;
            wires.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
            wires.setAttribute('width', W);
            wires.setAttribute('height', H);
            clear(gWires);
            clear(gLabels);

            var pos = {};
            Object.keys(nodeEls).forEach(function (id) {
                var b = nodeEls[id].getBoundingClientRect();
                pos[id] = {
                    x: b.left - boardBox.left, y: b.top - boardBox.top,
                    w: b.width, h: b.height,
                    cx: b.left - boardBox.left + b.width / 2,
                    cy: b.top - boardBox.top + b.height / 2
                };
            });

            var vertical = spec.vertical !== false;

            /* Kumpulkan kabel yang bisa digambar, lalu hitung lane supaya kabel
               sejajar tidak saling menimpa. */
            var list = [];
            (spec.edges || []).forEach(function (e) {
                var a = pos[e.from], b = pos[e.to];
                if (!a || !b || a === b) return;
                list.push({ e: e, a: a, b: b });
            });

            var groups = {};
            list.forEach(function (x) {
                var key = [x.e.from, x.e.to, x.e.back ? 'b' : 'f'].join('|');
                (groups[key] = groups[key] || []).push(x);
            });
            Object.keys(groups).forEach(function (k) {
                var g = groups[k];
                g.forEach(function (x, i) { x.lane = i - (g.length - 1) / 2; });
            });

            list.forEach(function (x) {
                var color = x.e.back ? 'tp-wire--back' : 'tp-wire--flow';
                var geo = route(x.a, x.b, !!x.e.back, x.lane, vertical);
                if (!geo) return;

                var p = svgEl('path', { d: geo.d, class: 'tp-wire ' + color });
                p.setAttribute('marker-end', x.e.back ? 'url(#tp-ah-b)' : 'url(#tp-ah)');
                gWires.appendChild(p);

                if (x.e.label) label(geo.lx, geo.ly, x.e.label, color);
            });
        }

        /* Rute orthogonal. `lane` menggeser segmen sejajar; `vertical` menentukan
           arah utama. Semua koordinat relatif terhadap papan. */
        function route(a, b, back, lane, vertical) {
            var off = lane * 9;

            if (vertical) {
                var down = b.cy >= a.cy;
                var aEdge = down ? a.y + a.h : a.y;
                var bEdge = down ? b.y : b.y + b.h;
                var dir = down ? 1 : -1;

                /* Balik selalu lewat kanal samping: kalau dipaksa lurus, ia akan
                   menimpa kabel maju di celah yang sama. */
                if (back) {
                    /* Balik: keluar dari sisi kanan, naik/turun di kanal luar,
                       masuk lagi dari sisi kanan. Tidak pernah lewat tengah. */
                    var ch = Math.max(a.x + a.w, b.x + b.w) + 14 + off;
                    return {
                        d: 'M ' + r1(a.x + a.w) + ' ' + r1(a.cy) +
                           ' L ' + r1(ch) + ' ' + r1(a.cy) +
                           ' L ' + r1(ch) + ' ' + r1(b.cy) +
                           ' L ' + r1(b.x + b.w) + ' ' + r1(b.cy),
                        lx: ch, ly: (a.cy + b.cy) / 2
                    };
                }

                /* Maju sejajar: satu garis lurus di celah antar baris. */
                if (Math.abs(a.cx - b.cx) < 1.5) {
                    var xs = a.cx + off;
                    return {
                        d: 'M ' + r1(xs) + ' ' + r1(aEdge) + ' L ' + r1(xs) + ' ' + r1(bEdge),
                        lx: xs, ly: (aEdge + bEdge) / 2
                    };
                }

                /* Maju: turun dari bawah a, geser horizontal, masuk ke atas b. */
                var midY = (aEdge + bEdge) / 2 + dir * 0;
                return {
                    d: 'M ' + r1(a.cx) + ' ' + r1(aEdge) +
                       ' L ' + r1(a.cx) + ' ' + r1(midY) +
                       ' L ' + r1(b.cx) + ' ' + r1(midY) +
                       ' L ' + r1(b.cx) + ' ' + r1(bEdge),
                    lx: (a.cx + b.cx) / 2, ly: midY
                };
            }

            /* Horizontal: cermin dari versi vertikal. */
            var right = b.cx >= a.cx;
            var aEdgeH = right ? a.x + a.w : a.x;
            var bEdgeH = right ? b.x : b.x + b.w;

            if (back) {
                var chH = Math.max(a.y + a.h, b.y + b.h) + 14 + off;
                return {
                    d: 'M ' + r1(a.cx) + ' ' + r1(a.y + a.h) +
                       ' L ' + r1(a.cx) + ' ' + r1(chH) +
                       ' L ' + r1(b.cx) + ' ' + r1(chH) +
                       ' L ' + r1(b.cx) + ' ' + r1(b.y + b.h),
                    lx: (a.cx + b.cx) / 2, ly: chH
                };
            }

            if (Math.abs(a.cy - b.cy) < 1.5) {
                var yy = a.cy + off;
                return {
                    d: 'M ' + r1(aEdgeH) + ' ' + r1(yy) + ' L ' + r1(bEdgeH) + ' ' + r1(yy),
                    lx: (aEdgeH + bEdgeH) / 2, ly: yy
                };
            }

            var midX = (aEdgeH + bEdgeH) / 2;
            return {
                d: 'M ' + r1(aEdgeH) + ' ' + r1(a.cy) +
                   ' L ' + r1(midX) + ' ' + r1(a.cy) +
                   ' L ' + r1(midX) + ' ' + r1(b.cy) +
                   ' L ' + r1(bEdgeH) + ' ' + r1(b.cy),
                lx: midX, ly: (a.cy + b.cy) / 2
            };
        }

        function label(x, y, text, color) {
            var g = svgEl('g', { class: 'tp-wire-label ' + color });
            var r = svgEl('rect', { rx: 5, ry: 5, class: 'tp-wire-bg' });
            var t = svgEl('text', { 'text-anchor': 'middle', 'dominant-baseline': 'middle' });
            t.textContent = text;
            g.appendChild(r);
            g.appendChild(t);
            gLabels.appendChild(g);
            var w = Math.max(26, text.length * 6.2 + 12);
            r.setAttribute('x', r1(x - w / 2));
            r.setAttribute('y', r1(y - 9));
            r.setAttribute('width', r1(w));
            r.setAttribute('height', 18);
            t.setAttribute('x', r1(x));
            t.setAttribute('y', r1(y));
        }

        if (global.ResizeObserver) {
            var ro = new ResizeObserver(function () { paint(); });
            ro.observe(board);
        }
        global.addEventListener('resize', paint);
        if (document.fonts && document.fonts.ready) {
            document.fonts.ready.then(paint).catch(function () {});
        }
    }

    /* Blok ```topology: isinya sintaks TOPO, bukan JSON lagi. */
    function renderText(host, text) {
        var spec = (global.Topo && global.Topo.parse) ? global.Topo.parse(text) : null;
        if (!spec) { host.textContent = 'Diagram tidak valid.'; return; }
        host.__spec = spec;
        render(host, spec);
    }

    function init() {
        ensureSprite();
        var list = document.querySelectorAll('.topology[data-spec]');
        for (var i = 0; i < list.length; i++) {
            var host = list[i];
            if (host.dataset.rendered === '1') continue;
            host.dataset.rendered = '1';
            try { renderText(host, host.dataset.spec); }
            catch (err) { host.textContent = 'Diagram gagal dirender.'; }
        }
    }

    function paintHost(host) {
        if (!host || !host.__spec) return;
        render(host, host.__spec);
    }

    function relayout(host) {
        if (!host) return;
        var raf = global.requestAnimationFrame || function (f) { setTimeout(f, 16); };
        raf(function () { raf(function () { paintHost(host); }); });
    }

    global.Topo = global.Topo || {};
    global.Topo.render = render;
    global.Topo.paint = function (host) { render(host, host.__spec || {}); };
    global.Topo.setSpec = function (host, spec) { host.__spec = spec; };
    global.Topo._renderWithSpec = function (host, spec) { host.__spec = spec; render(host, spec); };
    global.Topo.init = init;
    global.Topo.renderText = renderText;
    global.Topo.relayout = relayout;
    global.Topo.columnsOf = columnsOf;
    global.Topo.gridOf = gridOf;
    global.Topo.iconNode = iconNode;

    /* Nama lama dipertahankan supaya pemanggil lama tidak pecah. */
    global.Topology = global.Topo;

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})(window);