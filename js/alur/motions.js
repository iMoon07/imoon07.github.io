/* Alur motions — efek gerak data.
   Setiap efek menerima (parent, cable, node, opts) dan mengembalikan stop().
   Setiap efek punya nama dan dipakai lewat spec: "motion": "comet".

   Every effect receives (parent, cable, node, opts) and returns stop().
   Each effect has a name used in the spec: "motion": "comet". */
(function (global) {
    'use strict';

    var kit = global.AlurKit;
    var NS = kit.NS;
    var registry = {};

    function define(name, def) {
        registry[name] = def;
    }

    function reduced() {
        return !!(global.Alur && global.Alur.reduced && global.Alur.reduced());
    }

    function innerOf(node) {
        if (!node) return null;
        if (node.querySelector) return node.querySelector('.alur-node-inner') || node;
        return node;
    }

    function dur(opts, fallback) {
        return (opts && opts.duration) ? opts.duration : fallback;
    }

    /* Satu titik mengikuti path. One dot follows the path. */
    function dot(parent, pathEl, d, opts, cls, radius) {
        var o = opts || {};
        var node = kit.circle(parent, 0, 0, radius || o.radius || 3.5, cls || 'alur-dot', {
            fill: o.color || 'currentColor'
        });
        var anim = kit.el('animateMotion', {
            dur: dur(o, o.slow ? '6s' : '3.2s') + '',
            repeatCount: 'indefinite',
            path: d,
            rotate: 'auto',
            begin: o.begin || '0s'
        }, node);
        return { node: node, anim: anim };
    }

    define('flow', function (parent, cable, node, opts) {
        if (reduced()) return function () {};
        var made = dot(parent, cable.main, cable.d, opts, 'alur-dot alur-dot--flow');
        return function () { if (made.node.parentNode) made.node.parentNode.removeChild(made.node); };
    });

    define('flowMany', function (parent, cable, node, opts) {
        if (reduced()) return function () {};
        var o = opts || {};
        var n = o.count || 3;
        var span = parseFloat(dur(o, '3.2s')) || 3.2;
        var made = [];
        for (var i = 0; i < n; i++) {
            made.push(dot(parent, cable.main, cable.d, {
                duration: span + 's',
                begin: (-span * i / n).toFixed(2) + 's',
                color: o.color,
                radius: o.radius
            }, 'alur-dot alur-dot--flow'));
        }
        return function () {
            made.forEach(function (m) { if (m.node.parentNode) m.node.parentNode.removeChild(m.node); });
        };
    });

    define('dash', function (parent, cable, node, opts) {
        var paths = cable.paths.filter(function (p) { return p.tagName === 'path'; });
        var anims = paths.map(function (p) {
            var len = 200;
            try { len = p.getTotalLength(); } catch (e) {}
            p.setAttribute('stroke-dasharray', '10 12');
            var a = p.animate(
                [{ strokeDashoffset: 0 }, { strokeDashoffset: -22 }],
                { duration: dur(opts, 900), iterations: Infinity, easing: 'linear' }
            );
            return a;
        });
        return function () { anims.forEach(function (a) { a.cancel(); }); };
    });

    define('draw', function (parent, cable, node, opts) {
        var p = cable.main;
        var len = 300;
        try { len = p.getTotalLength(); } catch (e) {}
        p.setAttribute('stroke-dasharray', len + ' ' + len);
        var a = p.animate(
            [{ strokeDashoffset: len }, { strokeDashoffset: 0 }, { strokeDashoffset: 0 }, { strokeDashoffset: -len }],
            { duration: dur(opts, 4200), iterations: Infinity, easing: 'ease-in-out' }
        );
        return function () { a.cancel(); p.removeAttribute('stroke-dasharray'); };
    });

    define('comet', function (parent, cable, node, opts) {
        if (reduced()) return function () {};
        var p = cable.paths.filter(function (x) { return x.tagName === 'path'; })[0];
        var len = 300;
        try { len = p.getTotalLength(); } catch (e) {}
        var tail = kit.path(parent, cable.d, 'alur-comet', {
            stroke: (opts && opts.color) || 'currentColor',
            'stroke-width': 5,
            'stroke-linecap': 'round',
            'stroke-dasharray': '16 ' + (len + 16),
            style: 'filter: blur(3px)'
        });
        var a = tail.animate(
            [{ strokeDashoffset: 0 }, { strokeDashoffset: -(len + 16) }],
            { duration: dur(opts, 1800), iterations: Infinity, easing: 'linear' }
        );
        return function () { a.cancel(); if (tail.parentNode) tail.parentNode.removeChild(tail); };
    });

    define('packets', function (parent, cable, node, opts) {
        if (reduced()) return function () {};
        var o = opts || {};
        var n = o.count || 4;
        var span = parseFloat(dur(o, '3.6s')) || 3.6;
        var made = [];
        for (var i = 0; i < n; i++) {
            var r = kit.rect(parent, -5, -3, 10, 6, 'alur-packet', {
                fill: o.color || 'currentColor',
                rx: 1.5
            });
            var anim = kit.el('animateMotion', {
                dur: span + 's',
                repeatCount: 'indefinite',
                path: cable.d,
                rotate: 'auto',
                begin: (-span * i / n).toFixed(2) + 's'
            }, r);
            made.push(r);
        }
        return function () { made.forEach(function (r) { if (r.parentNode) r.parentNode.removeChild(r); }); };
    });

    define('relay', function (parent, cable, node, opts) {
        if (reduced()) return function () {};
        var p = cable.paths.filter(function (x) { return x.tagName === 'path'; })[0];
        var len = 300;
        try { len = p.getTotalLength(); } catch (e) {}
        var glow = kit.path(parent, cable.d, 'alur-relay', {
            stroke: (opts && opts.color) || 'currentColor',
            'stroke-width': 4,
            'stroke-linecap': 'round',
            'stroke-dasharray': '14 ' + (len + 14)
        });
        var a = glow.animate(
            [{ strokeDashoffset: 0 }, { strokeDashoffset: -(len + 14) }],
            { duration: dur(opts, 2200), iterations: Infinity, easing: 'linear' }
        );
        return function () { a.cancel(); if (glow.parentNode) glow.parentNode.removeChild(glow); };
    });

    define('pulse', function (parent, cable, node, opts) {
        if (!node) return function () {};
        var a = innerOf(node).animate(
            [{ transform: 'scale(1)' }, { transform: 'scale(1.06)' }, { transform: 'scale(1)' }],
            { duration: dur(opts, 1600), iterations: Infinity, easing: 'ease-in-out' }
        );
        return function () { a.cancel(); };
    });

    define('breathe', function (parent, cable, node, opts) {
        if (!node) return function () {};
        var a = innerOf(node).animate(
            [{ opacity: 0.55 }, { opacity: 1 }, { opacity: 0.55 }],
            { duration: dur(opts, 2600), iterations: Infinity, easing: 'ease-in-out' }
        );
        return function () { a.cancel(); };
    });

    define('blink', function (parent, cable, node, opts) {
        if (!node) return function () {};
        var a = innerOf(node).animate(
            [{ opacity: 1 }, { opacity: 0.15 }, { opacity: 1 }],
            { duration: dur(opts, 1100), iterations: Infinity, easing: 'steps(2, end)' }
        );
        return function () { a.cancel(); };
    });

    define('orbit', function (parent, cable, node, opts) {
        if (reduced()) return function () {};
        var o = opts || {};
        var b = (node && node.getBBox) ? node.getBBox() : { x: 0, y: 0, width: 40, height: 40 };
        /* getBBox() tidak termasuk translate; ambil translasi dari transform.
           getBBox() excludes the translate; read it from the transform. */
        var tx = 0, ty = 0;
        try {
            var m = node && node.transform && node.transform.baseVal.consolidate();
            if (m) { tx = m.matrix.e; ty = m.matrix.f; }
        } catch (e) {}
        var cx = tx + b.x + b.width / 2;
        var cy = ty + b.y + b.height / 2;
        var rx = b.width / 2 + 10;
        var ry = b.height / 2 + 8;
        var ring = kit.el('ellipse', {
            cx: cx, cy: cy, rx: rx, ry: ry, fill: 'none',
            stroke: o.color || 'currentColor', 'stroke-width': 1,
            'stroke-dasharray': '3 5', opacity: 0.6
        }, parent);
        var d = 'M ' + (cx - rx) + ' ' + cy +
            ' a ' + rx + ' ' + ry + ' 0 1 0 ' + (rx * 2) + ' 0' +
            ' a ' + rx + ' ' + ry + ' 0 1 0 ' + (-rx * 2) + ' 0';
        var made = dot(parent, null, d, { duration: dur(o, '4s'), color: o.color }, 'alur-dot');
        return function () {
            if (ring.parentNode) ring.parentNode.removeChild(ring);
            if (made.node.parentNode) made.node.parentNode.removeChild(made.node);
        };
    });

    define('grow', function (parent, cable, node, opts) {
        if (!node) return function () {};
        var a = innerOf(node).animate(
            [{ transform: 'scaleY(0.02)' }, { transform: 'scaleY(1)' }],
            { duration: dur(opts, 900), easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'both', transformOrigin: 'bottom' }
        );
        return function () { a.cancel(); };
    });

    define('spin', function (parent, cable, node, opts) {
        if (!node) return function () {};
        var a = innerOf(node).animate(
            [{ transform: 'rotate(0deg)' }, { transform: 'rotate(360deg)' }],
            { duration: dur(opts, 9000), iterations: Infinity, easing: 'linear' }
        );
        return function () { a.cancel(); };
    });

    var catalog = [
        { id: 'flow', label: 'Flow', note: 'Satu titik menyusuri kabel. One dot runs the cable.' },
        { id: 'flowMany', label: 'Flow ×N', note: 'Beberapa titik berbaris. Several staggered dots.' },
        { id: 'dash', label: 'Dash march', note: 'Garis putus berjalan. Marching dashes.' },
        { id: 'draw', label: 'Draw', note: 'Kabel tergambar lalu terhapus. Draw then erase.' },
        { id: 'comet', label: 'Comet', note: 'Ekor cahaya menyusuri kabel. Light tail runs the cable.' },
        { id: 'packets', label: 'Packets', note: 'Paket data kotak melaju. Box packets travel.' },
        { id: 'relay', label: 'Relay', note: 'Segmen menyala bergiliran. Segments light in turn.' },
        { id: 'pulse', label: 'Pulse', note: 'Simpul membesar-mengecil. Node scales in and out.' },
        { id: 'breathe', label: 'Breathe', note: 'Opasitas naik-turun. Opacity breathes.' },
        { id: 'blink', label: 'Blink', note: 'Kedip tegas. Hard blink.' },
        { id: 'orbit', label: 'Orbit', note: 'Titik mengorbit simpul. Dot orbits a node.' },
        { id: 'grow', label: 'Grow', note: 'Batang tumbuh dari nol. Bar grows from zero.' },
        { id: 'spin', label: 'Spin', note: 'Putar terus. Continuous rotation.' }
    ];

    global.AlurMotions = {
        define: define,
        get: function (name) { return registry[name]; },
        apply: function (name, parent, cable, node, opts) {
            var fn = registry[name];
            if (!fn) return function () {};
            return fn(parent, cable, node, opts || {});
        },
        catalog: catalog
    };
})(window);