/* Alur kit — SVG helpers, palette, path builders, easing.
   Dipakai semua modul supaya gaya dan geometri konsisten.
   Shared by every module so style and geometry stay consistent. */
(function (global) {
    'use strict';

    var NS = 'http://www.w3.org/2000/svg';

    function el(tag, attrs, parent) {
        var node = document.createElementNS(NS, tag);
        if (attrs) {
            Object.keys(attrs).forEach(function (k) {
                if (attrs[k] === null || attrs[k] === undefined) return;
                node.setAttribute(k, attrs[k]);
            });
        }
        if (parent) parent.appendChild(node);
        return node;
    }

    function g(parent, cls) {
        return el('g', { class: cls || null }, parent);
    }

    function path(parent, d, cls, extra) {
        var attrs = { d: d, class: cls || null };
        if (extra) Object.keys(extra).forEach(function (k) { attrs[k] = extra[k]; });
        return el('path', attrs, parent);
    }

    function rect(parent, x, y, w, h, cls, extra) {
        var attrs = { x: x, y: y, width: w, height: h, class: cls || null };
        if (extra) Object.keys(extra).forEach(function (k) { attrs[k] = extra[k]; });
        return el('rect', attrs, parent);
    }

    function circle(parent, cx, cy, r, cls, extra) {
        var attrs = { cx: cx, cy: cy, r: r, class: cls || null };
        if (extra) Object.keys(extra).forEach(function (k) { attrs[k] = extra[k]; });
        return el('circle', attrs, parent);
    }

    function text(parent, x, y, str, cls, extra) {
        var attrs = { x: x, y: y, class: cls || null };
        if (extra) Object.keys(extra).forEach(function (k) { attrs[k] = extra[k]; });
        var node = el('text', attrs, parent);
        node.textContent = str;
        return node;
    }

    /* Palette: satu sumber warna untuk kabel, node, dan aksen.
       One colour source for cables, nodes, and accents. */
    var palette = {
        blue: '#58a6ff',
        green: '#3fb950',
        amber: '#d29922',
        red: '#f85149',
        purple: '#bc8cff',
        cyan: '#39d0d8',
        pink: '#f778ba',
        lime: '#a5d64a',
        slate: '#8b949e',
        white: '#e6edf3'
    };

    function color(name) {
        if (!name) return palette.blue;
        if (palette[name]) return palette[name];
        return name;
    }

    /* Path builders ------------------------------------------------------- */

    function line(x1, y1, x2, y2) {
        return 'M ' + x1 + ' ' + y1 + ' L ' + x2 + ' ' + y2;
    }

    /* Orthogonal step: horizontal, vertical, horizontal. */
    function orth(x1, y1, x2, y2, midX) {
        var mx = midX === undefined ? (x1 + x2) / 2 : midX;
        return 'M ' + x1 + ' ' + y1 + ' L ' + mx + ' ' + y1 + ' L ' + mx + ' ' + y2 + ' L ' + x2 + ' ' + y2;
    }

    /* Smooth S-curve between two points. */
    function curve(x1, y1, x2, y2) {
        var dy = (y2 - y1) * 0.5;
        return 'M ' + x1 + ' ' + y1 + ' C ' + x1 + ' ' + (y1 + dy) + ', ' + x2 + ' ' + (y2 - dy) + ', ' + x2 + ' ' + y2;
    }

    /* Right-angle circuit trace with 45° corners (PCB look). */
    function circuit(x1, y1, x2, y2) {
        var dx = x2 - x1;
        var dy = y2 - y1;
        var cut = Math.min(Math.abs(dx), Math.abs(dy)) * 0.5;
        var sx = dx >= 0 ? 1 : -1;
        var sy = dy >= 0 ? 1 : -1;
        return 'M ' + x1 + ' ' + y1 +
            ' L ' + (x1 + dx - sx * cut) + ' ' + y1 +
            ' L ' + x2 + ' ' + (y1 + dy - sy * cut) +
            ' L ' + x2 + ' ' + y2;
    }

    /* Arc above the straight line. */
    function arc(x1, y1, x2, y2, lift) {
        var mx = (x1 + x2) / 2;
        var my = (y1 + y2) / 2 - (lift || 40);
        return 'M ' + x1 + ' ' + y1 + ' Q ' + mx + ' ' + my + ' ' + x2 + ' ' + y2;
    }

    /* Zig-zag between two points. */
    function zigzag(x1, y1, x2, y2, teeth, amp) {
        var n = teeth || 6;
        var a = amp || 8;
        var dx = (x2 - x1) / n;
        var dy = (y2 - y1) / n;
        var d = 'M ' + x1 + ' ' + y1;
        for (var i = 1; i < n; i++) {
            var off = (i % 2 ? a : -a);
            d += ' L ' + (x1 + dx * i + off) + ' ' + (y1 + dy * i);
        }
        return d + ' L ' + x2 + ' ' + y2;
    }

    /* Easing -------------------------------------------------------------- */
    var ease = {
        linear: function (t) { return t; },
        inOut: function (t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; },
        out: function (t) { return 1 - Math.pow(1 - t, 3); },
        in: function (t) { return t * t * t; }
    };

    function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

    /* Full background grid for every module. Minor lines every 22 units,
       major lines every 110. The rect matches the current viewBox; the canvas
       editor moves it while panning/zooming. */
    var gridUid = 0;
    function grid(svg, opts) {
        if (!svg || svg.querySelector('.alur-canvas-grid')) return;
        var o = opts || {};
        var minor = o.minor || 22;
        var major = o.major || 110;
        var id = 'alur-grid-' + (++gridUid);
        var defs = el('defs', {}, svg);
        var pat = el('pattern', {
            id: id, width: major, height: major, patternUnits: 'userSpaceOnUse'
        }, defs);
        var minorD = '';
        var majorD = 'M 0 0 H ' + major + ' M 0 0 V ' + major;
        for (var x = 0; x <= major; x += minor) minorD += 'M ' + x + ' 0 V ' + major + ' ';
        for (var y = 0; y <= major; y += minor) minorD += 'M 0 ' + y + ' H ' + major + ' ';
        path(pat, minorD, 'alur-grid-minor', {
            fill: 'none', stroke: '#3d4652', 'stroke-width': 0.7, opacity: 0.38
        });
        path(pat, majorD, 'alur-grid-major', {
            fill: 'none', stroke: '#4a5568', 'stroke-width': 1, opacity: 0.5
        });
        /* Cover exactly the current viewBox. The canvas editor updates this
           rect while panning/zooming; other modules never move their viewBox. */
        var vb = svg.viewBox && svg.viewBox.baseVal;
        var gx = vb && vb.width ? vb.x : 0;
        var gy = vb && vb.height ? vb.y : 0;
        var gw = vb && vb.width ? vb.width : 900;
        var gh = vb && vb.height ? vb.height : 520;
        var r = rect(svg, gx, gy, gw, gh, 'alur-canvas-grid', {
            fill: 'url(#' + id + ')'
        });
        svg.insertBefore(r, svg.firstChild);
    }

    function svgRoot(host, opts) {
        var o = opts || {};
        var node = el('svg', {
            class: 'alur-svg',
            viewBox: '0 0 ' + (o.w || 640) + ' ' + (o.h || 360),
            preserveAspectRatio: 'xMidYMid meet',
            role: 'img',
            'aria-label': o.label || 'Alur diagram'
        }, host);
        return node;
    }

    /* Sprite logo (dipakai bersama dengan topology). Logo sprite shared with
       the topology renderer: inject once, reference symbols by id. */
    function ensureSprite() {
        if (!global.TOPOLOGY_SPRITE) return;
        if (document.getElementById('topology-sprite')) return;
        var holder = document.createElement('div');
        holder.id = 'topology-sprite';
        holder.setAttribute('aria-hidden', 'true');
        holder.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden';
        holder.innerHTML = global.TOPOLOGY_SPRITE;
        document.body.insertBefore(holder, document.body.firstChild);
    }

    function icon(parent, id, x, y, size, opts) {
        var logos = global.AlurLogos;
        var res = logos && logos.resolve(id);
        /* Logo berkas (587 logo iMoon07/logo-svg) dirender sebagai <image>;
           logo sprite (i-si-*) tetap pakai <use>. */
        if (res && res.kind === 'file') {
            var g = el('g', { class: 'alur-logo' }, parent);
            el('image', {
                href: res.href,
                x: x, y: y, width: size, height: size,
                preserveAspectRatio: 'xMidYMid meet',
                class: 'alur-logo-img'
            }, g);
            return g;
        }
        ensureSprite();
        var ref = id.charAt(0) === '#' ? id : '#' + id;
        return el('use', { href: ref, x: x, y: y, width: size, height: size }, parent);
    }

    function iconRow(parent, ids, x, y, size, gap) {
        var n = ids.length;
        var total = n * size + (n - 1) * (gap || 4);
        var cx = x - total / 2;
        ids.forEach(function (id) {
            icon(parent, id, cx, y, size);
            cx += size + (gap || 4);
        });
    }

    global.AlurKit = {
        NS: NS,
        el: el,
        g: g,
        path: path,
        rect: rect,
        circle: circle,
        text: text,
        palette: palette,
        color: color,
        line: line,
        orth: orth,
        curve: curve,
        circuit: circuit,
        arc: arc,
        zigzag: zigzag,
        ease: ease,
        clamp: clamp,
        grid: grid,
        svgRoot: svgRoot,
        ensureSprite: ensureSprite,
        icon: icon,
        iconRow: iconRow
    };
})(window);