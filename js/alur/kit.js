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

    /* ---------------------------------------------------------------- panah
       Ujung panah mengikuti matematika Excalidraw (packages/element/src/bounds.ts:
       getArrowheadPoints + getArrowheadSize + getArrowheadAngle). Bukan hiasan:
       panah "arrow" Excalidraw adalah V terbuka (dua garis), bukan segitiga
       terisi, dan panjangnya 25 unit dengan sudut buka 20°, mengecil mengikuti
       panjang segmen terakhir.

       Arrowheads follow Excalidraw's own maths (getArrowheadPoints,
       getArrowheadSize, getArrowheadAngle). Not decoration: Excalidraw's "arrow"
       is an open V of two strokes, not a filled triangle, 25 units long with a
       20° opening, shrinking with the last segment. */
    var ARROW_SIZE = 25;          /* getArrowheadSize("arrow") */
    var ARROW_ANGLE = 20;         /* ARROW_ARROWHEAD_ANGLE */
    var ARROW_WIDEST_ANGLE = 30;  /* ARROW_ARROWHEAD_WIDEST_ANGLE */
    var ARROW_WIDEST_SIZE = 10;   /* ARROW_ARROWHEAD_WIDEST_SIZE */

    function arrowSize(type) {
        if (type === 'triangle') return 25;
        if (type === 'diamond') return 12;
        if (type === 'circle' || type === 'dot') return 15;
        if (type === 'bar') return 25;
        return ARROW_SIZE;
    }

    /* Sudut buka: makin kecil ukuran, makin lebar bukaannya (sama seperti
       Excalidraw supaya panah pendek tidak menyempit jadi garis).
       Opening angle: the smaller the size, the wider the V (as in Excalidraw,
       so a short arrow does not collapse into the line). */
    function arrowAngle(size, full) {
        var shrink = clamp((full - size) / (full - ARROW_WIDEST_SIZE), 0, 1);
        return ARROW_ANGLE + (ARROW_WIDEST_ANGLE - ARROW_ANGLE) * shrink;
    }

    /* tip: titik ujung. from: titik acuan arah (segmen sebelumnya).
       type: arrow (default) | triangle | circle | dot | diamond | bar | none
       Kembalikan elemen yang sudah digambar, atau null bila type === 'none'.
       Draws the head and returns the element, or null for type 'none'. */
    /* Geometri murni: menghasilkan deskripsi bentuk tanpa menyentuh DOM, jadi
       bisa dipakai untuk membuat head baru maupun memperbarui head yang sudah
       ada (saat node digeser). Ini yang membuat panah tidak perlu
       disembunyikan lalu digambar ulang.

       Pure geometry: returns a shape description without touching the DOM, so
       the same maths can create a head or move an existing one (while a node is
       dragged). That is why an arrow no longer has to be hidden and redrawn. */
    function arrowGeom(tip, from, type, opts) {
        if (!tip || !from) return null;
        var kind = type || 'arrow';
        if (kind === 'none') return null;
        var o = opts || {};
        var ang = Math.atan2(tip[1] - from[1], tip[0] - from[0]);
        var segLen = Math.sqrt(Math.pow(tip[0] - from[0], 2) + Math.pow(tip[1] - from[1], 2));
        var full = arrowSize(kind);
        var size = Math.min(full, segLen * (kind === 'diamond' ? 0.25 : 0.5));
        var sw = o.width || 2.4;

        if (kind === 'circle' || kind === 'dot') {
            return {
                kind: 'circle', tip: tip,
                cx: tip[0], cy: tip[1],
                r: Math.max(2, (size + sw - 2) / 2),
                fill: o.color, stroke: 'none'
            };
        }

        if (kind === 'bar') {
            var bx = Math.cos(ang + Math.PI / 2) * size / 2;
            var by = Math.sin(ang + Math.PI / 2) * size / 2;
            return {
                kind: 'path', tip: tip,
                d: 'M ' + (tip[0] - bx) + ' ' + (tip[1] - by) +
                   ' L ' + (tip[0] + bx) + ' ' + (tip[1] + by),
                fill: 'none', stroke: o.color, width: sw, cap: 'round'
            };
        }

        if (kind === 'diamond' || kind === 'diamond_outline') {
            var dx = Math.cos(ang), dy = Math.sin(ang);
            var backX = tip[0] - dx * size, backY = tip[1] - dy * size;
            var midX = tip[0] - dx * size / 2, midY = tip[1] - dy * size / 2;
            var wx = Math.cos(ang + Math.PI / 2) * size * 0.5;
            var wy = Math.sin(ang + Math.PI / 2) * size * 0.5;
            var outline = kind === 'diamond_outline' || o.outline;
            return {
                kind: 'path', tip: tip,
                d: 'M ' + tip[0] + ' ' + tip[1] +
                   ' L ' + (midX + wx) + ' ' + (midY + wy) +
                   ' L ' + backX + ' ' + backY +
                   ' L ' + (midX - wx) + ' ' + (midY - wy) + ' Z',
                fill: outline ? 'none' : o.color,
                stroke: outline ? o.color : 'none',
                width: outline ? sw : 0,
                join: outline ? 'round' : null
            };
        }

        var openAngle = (arrowAngle(size, full) * Math.PI) / 180;
        var bx2 = tip[0] - Math.cos(ang) * size;
        var by2 = tip[1] - Math.sin(ang) * size;
        var halfBase = size * Math.tan(openAngle);
        var perpX = Math.cos(ang + Math.PI / 2);
        var perpY = Math.sin(ang + Math.PI / 2);
        var leftX = bx2 + perpX * halfBase;
        var leftY = by2 + perpY * halfBase;
        var rightX = bx2 - perpX * halfBase;
        var rightY = by2 - perpY * halfBase;

        if (kind === 'triangle') {
            return {
                kind: 'path', tip: tip,
                d: 'M ' + tip[0] + ' ' + tip[1] +
                   ' L ' + leftX + ' ' + leftY +
                   ' L ' + rightX + ' ' + rightY + ' Z',
                fill: o.color, stroke: 'none'
            };
        }

        /* arrow: dua garis terbuka, ujung membulat, tanpa isian. */
        return {
            kind: 'path', tip: tip,
            d: 'M ' + leftX + ' ' + leftY + ' L ' + tip[0] + ' ' + tip[1] +
               ' L ' + rightX + ' ' + rightY,
            fill: 'none', stroke: o.color, width: sw, cap: 'round', join: 'round'
        };
    }

    function applyArrow(el, geom) {
        if (!el || !geom) return el;
        if (geom.kind === 'circle') {
            el.setAttribute('cx', geom.cx);
            el.setAttribute('cy', geom.cy);
            el.setAttribute('r', geom.r);
            el.setAttribute('fill', geom.fill || 'none');
            el.setAttribute('stroke', geom.stroke || 'none');
        } else {
            el.setAttribute('d', geom.d);
            el.setAttribute('fill', geom.fill || 'none');
            if (geom.stroke && geom.stroke !== 'none') {
                el.setAttribute('stroke', geom.stroke);
                el.setAttribute('stroke-width', geom.width || 2);
            }
            if (geom.cap) el.setAttribute('stroke-linecap', geom.cap);
            if (geom.join) el.setAttribute('stroke-linejoin', geom.join);
        }
        return el;
    }

    function arrowHead(parent, tip, from, type, color, opts) {
        var geom = arrowGeom(tip, from, type, Object.assign({ color: color }, opts || {}));
        if (!geom) return null;
        var o = opts || {};
        if (geom.kind === 'circle') {
            var c = circle(parent, geom.cx, geom.cy, geom.r, 'alur-edge-head', {
                fill: geom.fill, stroke: 'none'
            });
            c.setAttribute('data-arrow-kind', 'circle');
            return c;
        }
        var el = path(parent, geom.d, 'alur-edge-head', {
            fill: geom.fill,
            stroke: geom.stroke === 'none' ? null : geom.stroke,
            'stroke-width': geom.width || 2,
            'stroke-linecap': geom.cap || null,
            'stroke-linejoin': geom.join || null
        });
        el.setAttribute('data-arrow-kind', 'path');
        return el;
    }

    /* Perbarui head yang sudah ada (dipakai saat node digeser). Mengembalikan
       false kalau elemen tidak bisa diperbarui, supaya pemanggil bisa menggambar
       ulang.
       Move an existing head (used while a node is dragged). Returns false when the
       element cannot be updated, so the caller can redraw instead. */
    function arrowInto(el, tip, from, type, color, opts) {
        if (!el || el.getAttribute('data-arrow-kind') === 'circle') {
            /* bulat: pindahkan pusatnya, tidak ada d */
            var g0 = arrowGeom(tip, from, type, Object.assign({ color: color }, opts || {}));
            if (!g0 || g0.kind !== 'circle') return false;
            el.setAttribute('cx', g0.cx);
            el.setAttribute('cy', g0.cy);
            el.setAttribute('r', g0.r);
            return true;
        }
        var g = arrowGeom(tip, from, type, Object.assign({ color: color }, opts || {}));
        if (!g || g.kind === 'circle') return false;
        applyArrow(el, g);
        return true;
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
        arrowHead: arrowHead,
        arrowInto: arrowInto,
        arrowGeom: arrowGeom,
        arrowSize: arrowSize,
        svgRoot: svgRoot,
        ensureSprite: ensureSprite,
        icon: icon,
        iconRow: iconRow
    };
})(window);