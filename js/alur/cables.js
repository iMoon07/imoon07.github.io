/* Alur cables — kabel & edge.
   Satu fungsi menggambar, banyak gaya. Semua gaya menerima path yang sama,
   jadi bentuk (garis, kurva, ortho) terpisah dari tampilan (solid, neon,
   bundle, putus-nyambung).

   One draw function, many styles. Every style accepts the same path, so the
   shape (line, curve, ortho) is separate from the look (solid, neon, bundle,
   broken-relay). */
(function (global) {
    'use strict';

    var kit = global.AlurKit;

    /* Gaya kabel. Setiap entri boleh punya:
       - cls: kelas CSS utama
       - under: gaya lapisan bawah (glow/neon)
       - bundle: jumlah kabel paralel
       - dash: pola stroke-dasharray bawaan
       Each entry may define cls, under, bundle, and dash. */
    var styles = {
        solid:   { cls: 'solid' },
        dashed:  { cls: 'dashed', dash: '8 7' },
        dotted:  { cls: 'dotted', dash: '1.5 6' },
        dash:    { cls: 'dash', dash: '14 6' },
        double:  { cls: 'double', under: 'double' },
        glow:    { cls: 'glow', under: 'glow' },
        neon:    { cls: 'neon', under: 'neon' },
        ribbon:  { cls: 'ribbon', width: 7 },
        circuit: { cls: 'circuit' },
        bundle:  { cls: 'bundle', bundle: 3 },
        broken:  { cls: 'broken', dash: '12 9' },
        relay:   { cls: 'relay', dash: '12 9' },
        pulse:   { cls: 'pulse' },
        beam:    { cls: 'beam', width: 10 }
    };

    function styleOf(name) {
        if (!name) return styles.solid;
        if (styles[name]) return styles[name];
        return { cls: name };
    }

    function make(parent, d, opts) {
        var o = opts || {};
        var style = styleOf(o.style);
        var group = kit.g(parent, 'alur-cable-group');
        var paths = [];
        var main = null;

        /* Lapisan bawah untuk glow/neon/double: satu path lebih tebal &
           redup, lalu path utama di atasnya. Underlay for glow/neon/double:
           one thicker, dimmer path, then the main path on top. */
        if (style.under) {
            var under = kit.path(group, d, 'alur-cable alur-cable--' + style.under, {
                stroke: kit.color(o.color)
            });
            paths.push(under);
        }

        if (style.bundle) {
            var n = style.bundle;
            var spread = o.spread === undefined ? 4 : o.spread;
            for (var i = 0; i < n; i++) {
                var off = (i - (n - 1) / 2) * spread;
                var c = o.colors ? o.colors[i % o.colors.length] : kit.color(o.color);
                var p = kit.path(group, d, 'alur-cable alur-cable--' + style.cls, {
                    stroke: c,
                    transform: 'translate(' + off + ' ' + off + ')'
                });
                paths.push(p);
                if (i === (n - 1) >> 1) main = p;
            }
        } else {
            main = kit.path(group, d, 'alur-cable alur-cable--' + style.cls, {
                stroke: kit.color(o.color)
            });
            if (style.dash) main.setAttribute('stroke-dasharray', style.dash);
            paths.push(main);
        }

        if (!main) main = paths[0];
        if (o.width || style.width) {
            paths.forEach(function (p) { p.setAttribute('stroke-width', o.width || style.width); });
        }
        if (o.label) {
            var mid = midPoint(d);
            var label = kit.text(group, mid[0], mid[1] - 6, o.label, 'alur-cable-label', {
                fill: kit.color(o.color)
            });
            paths.push(label);
        }
        return { group: group, main: main, paths: paths, style: style, d: d };
    }

    /* Perkiraan titik tengah dari path "M x y L ..." atau "M ... C ...". */
    function midPoint(d) {
        var nums = (d.match(/-?\d+(\.\d+)?/g) || []).map(Number);
        if (nums.length < 4) return [0, 0];
        /* Ambil sepertiga tengah sebagai titik label. */
        var i = Math.max(0, Math.floor(nums.length / 2 / 2) * 2);
        return [nums[i], nums[i + 1]];
    }

    /* Barrow of named presets for the docs / playground. */
    var catalog = [
        { id: 'solid', label: 'Solid', note: 'Garis utuh, paling tenang. Plain line.' },
        { id: 'dashed', label: 'Dashed', note: 'Garis putus-putus statis. Static dashes.' },
        { id: 'dotted', label: 'Dotted', note: 'Titik-titik halus. Fine dots.' },
        { id: 'dash', label: 'Dash', note: 'Putus panjang, ritme cepat. Long dashes.' },
        { id: 'double', label: 'Double', note: 'Dua lapis, terlihat seperti pipa. Tube look.' },
        { id: 'glow', label: 'Glow', note: 'Pendar lembut di tepi. Soft edge glow.' },
        { id: 'neon', label: 'Neon', note: 'Inti terang + halo blur. Bright core + halo.' },
        { id: 'ribbon', label: 'Ribbon', note: 'Pita lebar bergradasi. Wide gradient band.' },
        { id: 'circuit', label: 'Circuit', note: 'Sudut 45°, jalur PCB. 45° PCB trace.' },
        { id: 'bundle', label: 'Bundle', note: 'Tiga kabel paralel warna beda. Three parallel cables.' },
        { id: 'broken', label: 'Broken', note: 'Retak statis, seperti sambungan putus. Static break.' },
        { id: 'relay', label: 'Relay', note: 'Segmen menyala bergiliran: putus-nyambung. Segments light in turn.' },
        { id: 'pulse', label: 'Pulse', note: 'Denyut ketebalan. Thickness pulse.' },
        { id: 'beam', label: 'Beam', note: 'Sorotan tebal transparan. Thick translucent beam.' }
    ];

    global.AlurCables = {
        styles: styles,
        catalog: catalog,
        draw: make,
        styleOf: styleOf
    };
})(window);