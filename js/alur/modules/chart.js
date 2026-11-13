/* Alur module: chart — deret grafik sederhana dengan label dan sumbu.
   A family of charts (bar, hbar, line, area, donut, gauge, spark, kpi,
   stacked, scatter, waterfall, funnel).

   Spec:
   {
     "module": "chart",
     "type": "bar",
     "title": "Revenue",
     "labels": ["Jan", "Feb", "Mar"],
     "data": [10, 14, 18],            // or "series": [{name, data, color}]
     "color": "blue",
     "height": 320
   } */
(function (global) {
    'use strict';

    var kit = global.AlurKit;

    function niceMax(v) {
        if (v <= 0) return 1;
        var pow = Math.pow(10, Math.floor(Math.log10(v)));
        var n = v / pow;
        var step = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10;
        return step * pow;
    }

    function fmt(n) {
        if (Math.abs(n) >= 1000) return (n / 1000).toFixed(n % 1000 ? 1 : 0) + 'k';
        return String(Math.round(n * 10) / 10);
    }

    function seriesOf(spec) {
        if (spec.series && spec.series.length) {
            return spec.series.map(function (s) {
                return {
                    name: s.name || '',
                    data: s.data || [],
                    color: kit.color(s.color || spec.color || 'blue')
                };
            });
        }
        return [{
            name: spec.name || '',
            data: spec.data || [],
            color: kit.color(spec.color || 'blue')
        }];
    }

    function labelsOf(spec, n) {
        if (spec.labels && spec.labels.length) return spec.labels;
        var out = [];
        for (var i = 0; i < n; i++) out.push(String(i + 1));
        return out;
    }

    function mount(host, spec, env) {
        var W = spec.width || 860;
        var H = spec.height || 340;
        var svg = kit.svgRoot(host, { w: W, h: H, label: spec.title || 'Alur chart' });
        var layer = kit.g(svg, 'alur-chart');
        var palette = (env && env.palette) || kit.palette;
        var series = seriesOf(spec);
        var labels = labelsOf(spec, Math.max.apply(null, series.map(function (s) { return s.data.length; })));
        var padL = 52, padR = 20, padT = 28, padB = 42;
        var pw = W - padL - padR;
        var ph = H - padT - padB;
        var type = spec.type || 'bar';
        var base = padT + ph;
        var stops = [];

        function grid(max, ticks) {
            for (var i = 0; i <= ticks; i++) {
                var y = padT + ph - (ph * i / ticks);
                kit.line(layer, padL, y, padL + pw, y, 'alur-grid-line', { 'stroke-dasharray': '2 5' });
                kit.text(layer, padL - 8, y + 3, fmt(max * i / ticks), 'alur-axis-num', { 'text-anchor': 'end' });
            }
        }

        function xAt(i, n) { return padL + (pw * (i + 0.5) / n); }

        if (type === 'bar') {
            var vals = series[0].data;
            var max = niceMax(Math.max.apply(null, vals));
            grid(max, 4);
            var step = pw / vals.length;
            var bw = Math.min(46, step * 0.58);
            vals.forEach(function (v, i) {
                var h = (v / max) * ph;
                var x = xAt(i, vals.length) - bw / 2;
                var r = kit.rect(layer, x, base - h, bw, h, 'alur-bar', {
                    fill: series[0].color, rx: 4,
                    'data-tip': (labels[i] || '') + ' · ' + fmt(v)
                });
                kit.text(layer, x + bw / 2, base - h - 7, fmt(v), 'alur-bar-value', { 'text-anchor': 'middle' });
                kit.text(layer, x + bw / 2, base + 16, labels[i] || '', 'alur-axis-label', { 'text-anchor': 'middle' });
                if (spec.motion !== 'none') {
                    var a = r.animate(
                        [{ transform: 'scaleY(0.02)' }, { transform: 'scaleY(1)' }],
                        { duration: 900, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'both', transformOrigin: 'bottom' }
                    );
                    stops.push(function () { a.cancel(); });
                }
            });
        } else if (type === 'hbar') {
            var hv = series[0].data;
            var hmax = niceMax(Math.max.apply(null, hv));
            var hstep = ph / hv.length;
            var bh = Math.min(26, hstep * 0.6);
            hv.forEach(function (v, i) {
                var y = padT + hstep * (i + 0.5);
                var w = (v / hmax) * pw;
                kit.rect(layer, padL, y - bh / 2, w, bh, 'alur-bar', {
                    fill: series[0].color, rx: 4,
                    'data-tip': (labels[i] || '') + ' · ' + fmt(v)
                });
                kit.text(layer, padL - 8, y + 3, labels[i] || '', 'alur-axis-label', { 'text-anchor': 'end' });
                kit.text(layer, padL + w + 7, y + 3, fmt(v), 'alur-bar-value');
            });
        } else if (type === 'line' || type === 'spark' || type === 'area') {
            var lmax = 0, lmin = 0;
            series.forEach(function (s) {
                s.data.forEach(function (v) { if (v > lmax) lmax = v; if (v < lmin) lmin = v; });
            });
            var top = niceMax(lmax);
            var lo = Math.min(0, lmin);
            var span = (top - lo) || 1;
            if (type !== 'spark') grid(top, 4);
            series.forEach(function (s) {
                var pts = s.data.map(function (v, i) {
                    return [padL + pw * (i + 0.5) / s.data.length, padT + ph - ((v - lo) / span) * ph];
                });
                var d = pts.map(function (p, i) { return (i ? 'L ' : 'M ') + p[0] + ' ' + p[1]; }).join(' ');
                if (type === 'area') {
                    var ad = d + ' L ' + pts[pts.length - 1][0] + ' ' + base + ' L ' + pts[0][0] + ' ' + base + ' Z';
                    kit.path(layer, ad, 'alur-area', { fill: s.color, opacity: 0.22 });
                }
                kit.path(layer, d, 'alur-line', { stroke: s.color });
                pts.forEach(function (p, i) {
                    var dotTip = (s.name ? s.name + ' · ' : '') +
                        (labels[i] || '') + ' · ' + fmt(s.data[i]);
                    kit.circle(layer, p[0], p[1], 16, 'alur-hit', {
                        fill: 'transparent', 'data-tip': dotTip,
                        'data-color': s.color
                    });
                    kit.circle(layer, p[0], p[1], 3.2, 'alur-line-dot', {
                        fill: s.color, 'data-tip': dotTip
                    });
                });
                if (type !== 'spark') {
                    labels.forEach(function (lb, i) {
                        if (i % Math.ceil(labels.length / 8) === 0) {
                            kit.text(layer, xAt(i, labels.length), base + 16, lb, 'alur-axis-label', { 'text-anchor': 'middle' });
                        }
                    });
                }
            });
        } else if (type === 'stacked') {
            var smax = 0;
            var n = labels.length;
            for (var i = 0; i < n; i++) {
                var tot = 0;
                series.forEach(function (s) { tot += s.data[i] || 0; });
                if (tot > smax) smax = tot;
            }
            var top2 = niceMax(smax);
            grid(top2, 4);
            var sstep = pw / n;
            var sbw = Math.min(52, sstep * 0.58);
            for (var si = 0; si < n; si++) {
                var acc = 0;
                series.forEach(function (s) {
                    var v = s.data[si] || 0;
                    var h = (v / top2) * ph;
                    var y = base - ((acc + v) / top2) * ph;
                    kit.rect(layer, xAt(si, n) - sbw / 2, y, sbw, h, 'alur-bar-seg', {
                        fill: s.color,
                        'data-tip': (labels[si] || '') + ' · ' +
                            (s.name ? s.name + ' · ' : '') + fmt(v)
                    });
                    acc += v;
                });
                kit.text(layer, xAt(si, n), base + 16, labels[si] || '', 'alur-axis-label', { 'text-anchor': 'middle' });
            }
        } else if (type === 'donut') {
            var dv = series[0].data;
            var total = dv.reduce(function (a, b) { return a + b; }, 0) || 1;
            var cx = W / 2, cy = H / 2, r = Math.min(W, H) / 2 - 30;
            var c = 2 * Math.PI * r;
            var off = 0;
            var segs = [];
            kit.circle(layer, cx, cy, r, 'alur-donut-track', {
                fill: 'none', stroke: '#21262d', 'stroke-width': 24
            });
            dv.forEach(function (v, i) {
                var len = c * v / total;
                var gap = Math.min(6, len * 0.1);
                var draw = Math.max(0.5, len - gap);
                var col = kit.color((spec.colors && spec.colors[i]) || spec.color || 'blue');
                if (i > 0) col = kit.color((spec.colors && spec.colors[i]) || palette[Object.keys(palette)[i % 10]]);
                var seg = kit.circle(layer, cx, cy, r, 'alur-donut-seg', {
                    fill: 'none', stroke: col, 'stroke-width': 24,
                    'stroke-dasharray': draw + ' ' + (c - draw),
                    'stroke-dashoffset': -(off + gap / 2),
                    transform: 'rotate(-90 ' + cx + ' ' + cy + ')',
                    'data-tip': (labels[i] || '') + ' · ' + fmt(v) +
                        ' · ' + Math.round(v / total * 100) + '%',
                    'data-index': i
                });
                segs.push({
                    el: seg, label: labels[i] || '', value: v,
                    pct: Math.round(v / total * 100), color: col
                });
                off += len;
            });
            var totalEl = kit.text(layer, cx, cy - 2, fmt(total), 'alur-donut-total', { 'text-anchor': 'middle' });
            var labelEl = kit.text(layer, cx, cy + 18, spec.centerLabel || 'total', 'alur-donut-label', { 'text-anchor': 'middle' });
            var pinned = null;
            function setCenter(seg) {
                if (seg) {
                    totalEl.textContent = fmt(seg.value);
                    labelEl.textContent = seg.label + ' · ' + seg.pct + '%';
                } else {
                    totalEl.textContent = fmt(total);
                    labelEl.textContent = spec.centerLabel || 'total';
                }
            }
            segs.forEach(function (s) {
                s.el.addEventListener('pointerenter', function () { if (pinned === null) setCenter(s); });
                s.el.addEventListener('pointerdown', function () { pinned = s; setCenter(s); });
                s.el.addEventListener('pointerleave', function () {
                    if (pinned === null) setCenter(null);
                });
            });
            svg.addEventListener('pointerdown', function (ev) {
                var onSeg = ev.target && ev.target.closest &&
                    ev.target.closest('.alur-donut-seg');
                if (!onSeg) { pinned = null; setCenter(null); }
            });
            labels.slice(0, dv.length).forEach(function (lb, i) {
                var s = segs[i];
                var ly = 24 + i * 18;
                var sw = kit.rect(layer, 20, ly - 7, 9, 9, 'alur-legend-swatch', {
                    fill: s ? s.color : series[0].color, rx: 2, 'data-index': i
                });
                var tx = kit.text(layer, 35, ly + 1, lb, 'alur-legend-label');
                var vv = kit.text(layer, W - 20, ly + 1,
                    fmt(s ? s.value : 0) + ' · ' + (s ? s.pct : 0) + '%',
                    'alur-legend-value', { 'text-anchor': 'end' });
                function activate() {
                    setCenter(s);
                    if (s) s.el.classList.add('is-hover');
                }
                function deactivate() {
                    if (pinned !== null) return;
                    setCenter(null);
                    if (s) s.el.classList.remove('is-hover');
                }
                [sw, tx, vv].forEach(function (el) {
                    el.style.cursor = 'pointer';
                    el.addEventListener('pointerenter', activate);
                    el.addEventListener('pointerleave', deactivate);
                    el.addEventListener('pointerdown', function () { pinned = s; activate(); });
                });
            });
        } else if (type === 'gauge') {
            var gv = series[0].data[0] || 0;
            var gmax = spec.max || 100;
            var pct = Math.max(0, Math.min(1, gv / gmax));
            var gcx = W / 2, gcy = H / 2 + 20, gr = Math.max(40, Math.min(W / 2 - 40, H / 2 - 20));
            var half = Math.PI * gr;
            kit.circle(layer, gcx, gcy, gr, 'alur-gauge-track', {
                fill: 'none', stroke: '#30363d', 'stroke-width': 14,
                'stroke-dasharray': half + ' ' + half,
                transform: 'rotate(180 ' + gcx + ' ' + gcy + ')'
            });
            kit.circle(layer, gcx, gcy, gr, 'alur-gauge-fill', {
                fill: 'none', stroke: kit.color(spec.color || 'cyan'), 'stroke-width': 14,
                'stroke-dasharray': (half * pct) + ' ' + half,
                transform: 'rotate(180 ' + gcx + ' ' + gcy + ')',
                'stroke-linecap': 'round'
            });
            kit.text(layer, gcx, gcy - 18, fmt(gv) + (spec.unit || '%'), 'alur-gauge-value', { 'text-anchor': 'middle' });
            kit.text(layer, gcx, gcy + 4, spec.label || '', 'alur-gauge-label', { 'text-anchor': 'middle' });
        } else if (type === 'scatter') {
            var pts = series[0].data;
            var xs = pts.map(function (p) { return p[0]; });
            var ys = pts.map(function (p) { return p[1]; });
            var xmax = niceMax(Math.max.apply(null, xs));
            var ymax = niceMax(Math.max.apply(null, ys));
            grid(ymax, 4);
            pts.forEach(function (p) {
                var px = padL + (p[0] / xmax) * pw;
                var py = base - (p[1] / ymax) * ph;
                var scTip = '(' + fmt(p[0]) + ', ' + fmt(p[1]) + ')';
                kit.circle(layer, px, py, 16, 'alur-hit', {
                    fill: 'transparent', 'data-tip': scTip,
                    'data-color': series[0].color
                });
                kit.circle(layer, px, py, 5, 'alur-scatter-dot', {
                    fill: series[0].color, opacity: 0.85, 'data-tip': scTip
                });
            });
            kit.text(layer, padL + pw / 2, base + 30, spec.xLabel || 'x', 'alur-axis-title', { 'text-anchor': 'middle' });
            kit.text(layer, 14, padT + ph / 2, spec.yLabel || 'y', 'alur-axis-title', { 'text-anchor': 'middle', transform: 'rotate(-90 14 ' + (padT + ph / 2) + ')' });
        } else if (type === 'waterfall') {
            var wv = series[0].data;
            var running = 0;
            var wmax = 0, wmin = 0;
            wv.forEach(function (v) { running += v; if (running > wmax) wmax = running; if (running < wmin) wmin = running; });
            var wtop = niceMax(wmax - Math.min(0, wmin));
            grid(wtop, 4);
            var wstep = pw / wv.length;
            var wbw = Math.min(46, wstep * 0.58);
            running = 0;
            wv.forEach(function (v, i) {
                var start = running;
                var end = running + v;
                var y1 = base - (Math.max(start, end) / wtop) * ph;
                var h = (Math.abs(v) / wtop) * ph;
                kit.rect(layer, xAt(i, wv.length) - wbw / 2, y1, wbw, h, 'alur-bar', {
                    fill: v >= 0 ? palette.green : palette.red, rx: 3,
                    'data-tip': (labels[i] || '') + ' · ' + (v >= 0 ? '+' : '') + fmt(v)
                });
                kit.text(layer, xAt(i, wv.length), base + 16, labels[i] || '', 'alur-axis-label', { 'text-anchor': 'middle' });
                running = end;
            });
        } else if (type === 'funnel') {
            var fv = series[0].data;
            var fmax = Math.max.apply(null, fv);
            var fstep = ph / fv.length;
            fv.forEach(function (v, i) {
                var wTop = (v / fmax) * pw;
                var wBot = (fv[i + 1] !== undefined ? fv[i + 1] : v * 0.85) / fmax * pw;
                var y = padT + i * fstep;
                var d = 'M ' + (padL + pw / 2 - wTop / 2) + ' ' + y +
                    ' L ' + (padL + pw / 2 + wTop / 2) + ' ' + y +
                    ' L ' + (padL + pw / 2 + wBot / 2) + ' ' + (y + fstep) +
                    ' L ' + (padL + pw / 2 - wBot / 2) + ' ' + (y + fstep) + ' Z';
                kit.path(layer, d, 'alur-funnel-seg', {
                    fill: kit.color((spec.colors && spec.colors[i]) || spec.color || 'blue'),
                    opacity: 0.9 - i * 0.06,
                    'data-tip': (labels[i] || '') + ' · ' + fmt(v)
                });
                kit.text(layer, padL + pw / 2, y + fstep / 2 + 4, fmt(v), 'alur-funnel-value', { 'text-anchor': 'middle' });
                kit.text(layer, padL + pw + 4, y + fstep / 2 + 4, labels[i] || '', 'alur-axis-label');
            });
        } else if (type === 'bell') {
            var bMu = spec.mean || 0, bSigma = spec.sigma || 1;
            var bMarker = spec.marker === undefined ? bMu : spec.marker;
            var bMin = bMu - 4 * bSigma, bMax = bMu + 4 * bSigma;
            var bPts = [];
            for (var bi = 0; bi <= 60; bi++) {
                var bx = bMin + (bMax - bMin) * bi / 60;
                var by = Math.exp(-0.5 * Math.pow((bx - bMu) / bSigma, 2));
                bPts.push([padL + pw * bi / 60, base - by * ph * 0.9]);
            }
            var bPath = bPts.map(function (p, i) { return (i ? 'L ' : 'M ') + p[0] + ' ' + p[1]; }).join(' ');
            kit.path(layer, bPath, 'alur-line', { stroke: series[0].color });
            var bmx = padL + pw * ((bMarker - bMin) / (bMax - bMin));
            kit.line(layer, bmx, padT, bmx, base, 'alur-marker-line');
            kit.text(layer, bmx, padT - 6, spec.markerLabel || '', 'alur-axis-label', { 'text-anchor': 'middle' });
        } else if (type === 'histogram') {
            var hBins = spec.bins || 8;
            var hData = series[0].data;
            var hMin = Math.min.apply(null, hData), hMax = Math.max.apply(null, hData);
            var hCounts = [];
            for (var hi = 0; hi < hBins; hi++) hCounts.push(0);
            hData.forEach(function (v) {
                var idx = Math.min(hBins - 1, Math.floor((v - hMin) / ((hMax - hMin) || 1) * hBins));
                hCounts[idx]++;
            });
            var hPeak = niceMax(Math.max.apply(null, hCounts));
            grid(hPeak, 4);
            var hStep = pw / hBins;
            hCounts.forEach(function (c, i) {
                var h = (c / hPeak) * ph;
                var lo2 = hMin + (hMax - hMin) * i / hBins;
                var hi2 = hMin + (hMax - hMin) * (i + 1) / hBins;
                kit.rect(layer, padL + hStep * i + 2, base - h, hStep - 4, h, 'alur-bar', {
                    fill: series[0].color, rx: 2,
                    'data-tip': fmt(lo2) + '–' + fmt(hi2) + ' · ' + c
                });
            });
        } else if (type === 'stackedArea') {
            var sMax = 0;
            for (var si2 = 0; si2 < labels.length; si2++) {
                var sTot = 0;
                series.forEach(function (s) { sTot += s.data[si2] || 0; });
                if (sTot > sMax) sMax = sTot;
            }
            var sTop = niceMax(sMax);
            grid(sTop, 4);
            var sAcc = labels.map(function () { return 0; });
            series.forEach(function (s) {
                var topPts = [], botPts = [];
                s.data.forEach(function (v, i) {
                    var y0 = base - (sAcc[i] / sTop) * ph;
                    sAcc[i] += v;
                    var y1 = base - (sAcc[i] / sTop) * ph;
                    var xx = padL + pw * (i + 0.5) / s.data.length;
                    topPts.push([xx, y1]);
                    botPts.push([xx, y0]);
                });
                var areaD = topPts.map(function (p, i) { return (i ? 'L ' : 'M ') + p[0] + ' ' + p[1]; }).join(' ') +
                    ' ' + botPts.slice().reverse().map(function (p) { return 'L ' + p[0] + ' ' + p[1]; }).join(' ') + ' Z';
                kit.path(layer, areaD, 'alur-area', {
                    fill: s.color, opacity: 0.55,
                    'data-tip': (s.name ? s.name + ' · ' : '') +
                        (labels[0] || '') + ' … ' + (labels[labels.length - 1] || '')
                });
            });
        } else if (type === 'treemap') {
            var tVals = series[0].data;
            var tTotal = tVals.reduce(function (a, b) { return a + b; }, 0) || 1;
            var tx = padL, ty = padT, tw = pw, th = ph;
            tVals.forEach(function (v, i) {
                var frac = v / tTotal;
                var col = kit.color((spec.colors && spec.colors[i]) || (i % 2 ? 'green' : 'blue'));
                var cw2 = tw * frac;
                kit.rect(layer, tx, ty, Math.max(2, cw2 - 3), th, 'alur-treemap-cell', {
                    fill: col, rx: 4, opacity: 0.85,
                    'data-tip': (labels[i] || '') + ' · ' + fmt(v)
                });
                if (cw2 > 46) {
                    kit.text(layer, tx + 8, ty + 18, labels[i] || '', 'alur-treemap-label');
                }
                tx += cw2;
                tw = Math.max(0, tw - cw2);
            });
        } else if (type === 'box') {
            var bxs = spec.boxes || [];
            var bMax2 = 0;
            bxs.forEach(function (b) { if (b.max > bMax2) bMax2 = b.max; });
            var bTop = niceMax(bMax2);
            grid(bTop, 4);
            var bStep2 = ph / Math.max(1, bxs.length);
            bxs.forEach(function (b, i) {
                var y = padT + bStep2 * (i + 0.5);
                var x1 = padL + (b.min / bTop) * pw;
                var x2 = padL + (b.max / bTop) * pw;
                var xq1 = padL + (b.q1 / bTop) * pw;
                var xq3 = padL + (b.q3 / bTop) * pw;
                var xm = padL + (b.median / bTop) * pw;
                kit.line(layer, x1, y, x2, y, 'alur-box-whisker');
                kit.rect(layer, xq1, y - 11, Math.max(2, xq3 - xq1), 22, 'alur-box-range', {
                    fill: series[0].color, opacity: 0.25, rx: 3,
                    'data-tip': (b.label || '') + ' · min ' + fmt(b.min) +
                        ' · q1 ' + fmt(b.q1) + ' · med ' + fmt(b.median) +
                        ' · q3 ' + fmt(b.q3) + ' · max ' + fmt(b.max)
                });
                kit.line(layer, xm, y - 11, xm, y + 11, 'alur-box-median');
                kit.text(layer, padL - 8, y + 3, b.label || '', 'alur-axis-label', { 'text-anchor': 'end' });
            });
        } else if (type === 'range') {
            var rItems = spec.items || [];
            var rMax = 0;
            rItems.forEach(function (it) { if (it.to > rMax) rMax = it.to; });
            var rTop = niceMax(rMax);
            grid(rTop, 4);
            var rStep = ph / Math.max(1, rItems.length);
            rItems.forEach(function (it, i) {
                var y = padT + rStep * (i + 0.5);
                var x1 = padL + (it.from / rTop) * pw;
                var x2 = padL + (it.to / rTop) * pw;
                kit.line(layer, x1, y, x2, y, 'alur-range-line', {
                    stroke: series[0].color, 'stroke-width': 6,
                    'data-tip': (it.label || '') + ' · ' + fmt(it.from) + '–' + fmt(it.to)
                });
                kit.circle(layer, x2, y, 5, 'alur-range-dot', {
                    fill: series[0].color,
                    'data-tip': (it.label || '') + ' · ' + fmt(it.to)
                });
                kit.text(layer, padL - 8, y + 3, it.label || '', 'alur-axis-label', { 'text-anchor': 'end' });
            });
        } else if (type === 'density') {
            grid(1, 4);
            series.forEach(function (s) {
                var pts = s.data.map(function (v, i) { return [padL + pw * (i + 0.5) / s.data.length, base - v * ph]; });
                var d = pts.map(function (p, i) { return (i ? 'L ' : 'M ') + p[0] + ' ' + p[1]; }).join(' ');
                kit.path(layer, d, 'alur-line', { stroke: s.color });
            });
        } else if (type === 'slope') {
            var slItems = spec.items || [];
            var slMax = 0;
            slItems.forEach(function (it) { if (it.before > slMax) slMax = it.before; if (it.after > slMax) slMax = it.after; });
            var slTop = niceMax(slMax);
            grid(slTop, 4);
            var slX1 = padL + pw * 0.3, slX2 = padL + pw * 0.7;
            slItems.forEach(function (it) {
                var y1 = base - (it.before / slTop) * ph;
                var y2 = base - (it.after / slTop) * ph;
                kit.line(layer, slX1, y1, slX2, y2, 'alur-slope-line', { stroke: series[0].color });
                kit.circle(layer, slX1, y1, 4, 'alur-line-dot', { fill: palette.blue });
                kit.circle(layer, slX2, y2, 4, 'alur-line-dot', { fill: palette.green });
                kit.text(layer, slX1 - 8, y1 + 3, it.label || '', 'alur-axis-label', { 'text-anchor': 'end' });
            });
        } else if (type === 'combo') {
            var cVals = spec.bars || series[0].data;
            var cMax = niceMax(Math.max.apply(null, cVals));
            grid(cMax, 4);
            var cStep = pw / cVals.length;
            cVals.forEach(function (v, i) {
                var h = (v / cMax) * ph;
                kit.rect(layer, xAt(i, cVals.length) - Math.min(20, cStep * 0.28), base - h, Math.min(40, cStep * 0.56), h, 'alur-bar', {
                    fill: series[0].color, rx: 3, opacity: 0.7,
                    'data-tip': (labels[i] || '') + ' · ' + fmt(v)
                });
                kit.text(layer, xAt(i, cVals.length), base + 16, labels[i] || '', 'alur-axis-label', { 'text-anchor': 'middle' });
            });
            var cLine = spec.line || [];
            var cTop = niceMax(Math.max.apply(null, cLine.concat([1])));
            var cPts = cLine.map(function (v, i) { return [xAt(i, cLine.length), base - (v / cTop) * ph]; });
            if (cPts.length) kit.path(layer, cPts.map(function (p, i) { return (i ? 'L ' : 'M ') + p[0] + ' ' + p[1]; }).join(' '), 'alur-line', { stroke: palette.amber });
        } else if (type === 'timeline') {
            var tEvents = spec.events || [];
            var tY = padT + ph / 2;
            kit.line(layer, padL, tY, padL + pw, tY, 'alur-timeline-line');
            tEvents.forEach(function (ev, i) {
                var x = padL + pw * (ev.at !== undefined ? ev.at : (i / Math.max(1, tEvents.length - 1)));
                kit.circle(layer, x, tY, 5, 'alur-timeline-dot', {
                    fill: series[0].color,
                    'data-tip': ev.label || ''
                });
                kit.text(layer, x, tY - 12, ev.label || '', 'alur-axis-label', { 'text-anchor': 'middle' });
            });
        } else if (type === 'bubble') {
            var buPts = series[0].data;
            var buX = niceMax(Math.max.apply(null, buPts.map(function (p) { return p[0]; })));
            var buY = niceMax(Math.max.apply(null, buPts.map(function (p) { return p[1]; })));
            var buR = Math.max.apply(null, buPts.map(function (p) { return p[2] || 1; }));
            grid(buY, 4);
            buPts.forEach(function (p) {
                var buRad = 4 + ((p[2] || 1) / buR) * 14;
                var buTip = '(' + fmt(p[0]) + ', ' + fmt(p[1]) + ') · ' + fmt(p[2] || 1);
                kit.circle(layer, padL + (p[0] / buX) * pw, base - (p[1] / buY) * ph,
                    Math.max(16, buRad + 6), 'alur-hit', {
                        fill: 'transparent', 'data-tip': buTip,
                        'data-color': series[0].color
                    });
                kit.circle(layer, padL + (p[0] / buX) * pw, base - (p[1] / buY) * ph, buRad, 'alur-bubble', {
                    fill: series[0].color, opacity: 0.45, 'data-tip': buTip
                });
            });
        } else if (type === 'dumbbell') {
            var dItems = spec.items || [];
            var dMax = 0;
            dItems.forEach(function (it) { if (it.a > dMax) dMax = it.a; if (it.b > dMax) dMax = it.b; });
            var dTop = niceMax(dMax);
            grid(dTop, 4);
            var dStep = ph / Math.max(1, dItems.length);
            dItems.forEach(function (it, i) {
                var y = padT + dStep * (i + 0.5);
                var xa = padL + (it.a / dTop) * pw;
                var xb = padL + (it.b / dTop) * pw;
                kit.line(layer, xa, y, xb, y, 'alur-dumbbell-line', { stroke: palette.slate, 'stroke-width': 3 });
                kit.circle(layer, xa, y, 5, 'alur-dumbbell-dot', {
                    fill: palette.blue,
                    'data-tip': (it.label || '') + ' · ' + fmt(it.a)
                });
                kit.circle(layer, xb, y, 5, 'alur-dumbbell-dot', {
                    fill: palette.green,
                    'data-tip': (it.label || '') + ' · ' + fmt(it.b)
                });
                kit.text(layer, padL - 8, y + 3, it.label || '', 'alur-axis-label', { 'text-anchor': 'end' });
            });
        } else if (type === 'quadrant') {
            var qPts = series[0].data;
            var qX = niceMax(Math.max.apply(null, qPts.map(function (p) { return p[0]; })));
            var qY = niceMax(Math.max.apply(null, qPts.map(function (p) { return p[1]; })));
            grid(qY, 4);
            kit.line(layer, padL + pw / 2, padT, padL + pw / 2, base, 'alur-quad-line');
            kit.line(layer, padL, padT + ph / 2, padL + pw, padT + ph / 2, 'alur-quad-line');
            qPts.forEach(function (p) {
                kit.circle(layer, padL + (p[0] / qX) * pw, base - (p[1] / qY) * ph, 5, 'alur-bubble', {
                    fill: series[0].color, opacity: 0.85,
                    'data-tip': '(' + fmt(p[0]) + ', ' + fmt(p[1]) + ')'
                });
            });
            kit.text(layer, padL + 6, padT + 12, spec.q2 || '', 'alur-axis-label');
            kit.text(layer, padL + pw - 6, padT + 12, spec.q1 || '', 'alur-axis-label', { 'text-anchor': 'end' });
            kit.text(layer, padL + 6, base - 6, spec.q3 || '', 'alur-axis-label');
            kit.text(layer, padL + pw - 6, base - 6, spec.q4 || '', 'alur-axis-label', { 'text-anchor': 'end' });
        } else if (type === 'process') {
            var pSteps = spec.steps || [];
            var pN = Math.max(1, pSteps.length);
            var pStep = pw / pN;
            var pY = padT + ph / 2;
            pSteps.forEach(function (s, i) {
                var x = padL + pStep * (i + 0.5);
                kit.circle(layer, x, pY, 18, 'alur-process-dot', {
                    fill: series[0].color, opacity: 0.2,
                    'data-tip': typeof s === 'string' ? s : (s.label || '')
                });
                kit.text(layer, x, pY + 4, String(i + 1), 'alur-process-num', { 'text-anchor': 'middle' });
                kit.text(layer, x, pY + 36, typeof s === 'string' ? s : s.label, 'alur-axis-label', { 'text-anchor': 'middle' });
                if (i < pN - 1) kit.line(layer, x + 18, pY, x + pStep - 18, pY, 'alur-process-arrow');
            });
        } else if (type === 'cycle') {
            var cySteps = spec.steps || [];
            var cyN = Math.max(1, cySteps.length);
            var cyCx = W / 2, cyCy = H / 2, cyR = Math.min(W, H) / 2 - 54;
            kit.circle(layer, cyCx, cyCy, cyR, 'alur-cycle-guide', { fill: 'none', stroke: '#30363d', 'stroke-dasharray': '3 6' });
            cySteps.forEach(function (s, i) {
                var ang = -Math.PI / 2 + i * 2 * Math.PI / cyN;
                var x = cyCx + cyR * Math.cos(ang), y = cyCy + cyR * Math.sin(ang);
                kit.circle(layer, x, y, 22, 'alur-cycle-node', {
                    fill: '#161b22', stroke: series[0].color, 'stroke-width': 2,
                    'data-tip': typeof s === 'string' ? s : (s.label || '')
                });
                kit.text(layer, x, y + 4, String(i + 1), 'alur-cycle-num', { 'text-anchor': 'middle' });
                kit.text(layer, x, y + 38, typeof s === 'string' ? s : s.label, 'alur-axis-label', { 'text-anchor': 'middle' });
            });
        } else if (type === 'progress') {
            var prItems = spec.items || [];
            var prStep = ph / Math.max(1, prItems.length);
            prItems.forEach(function (it, i) {
                var y = padT + prStep * i + prStep * 0.2;
                kit.text(layer, padL, y + 10, it.label || '', 'alur-axis-label');
                var x = padL + 120, w = pw - 130, acc = 0;
                (it.parts || []).forEach(function (p) {
                    var segW = w * (p.value / 100);
                    kit.rect(layer, x + acc, y, Math.max(1, segW - 2), 16, 'alur-progress-seg', {
                        fill: p.color || series[0].color, rx: 3,
                        'data-tip': (it.label || '') + ' · ' + (p.label || '') + ' · ' + fmt(p.value) + '%'
                    });
                    acc += segW;
                });
            });
        } else if (type === 'table') {
            var tCols = spec.columns || [];
            var tRows = spec.rows || [];
            var tCW = pw / Math.max(1, tCols.length);
            var tRH = ph / Math.max(1, tRows.length + 1);
            tCols.forEach(function (c, i) {
                kit.text(layer, padL + tCW * i + tCW / 2, padT + tRH / 2, c, 'alur-table-head', { 'text-anchor': 'middle' });
            });
            tRows.forEach(function (row, ri) {
                row.forEach(function (cell, ci) {
                    kit.text(layer, padL + tCW * ci + tCW / 2, padT + tRH * (ri + 1) + tRH / 2, String(cell), 'alur-table-cell', { 'text-anchor': 'middle' });
                });
                kit.line(layer, padL, padT + tRH * (ri + 2), padL + pw, padT + tRH * (ri + 2), 'alur-table-line');
            });
        } else {
            /* kpi: angka besar + label + delta. */

            var kv = series[0].data[0] || 0;
            kit.text(layer, W / 2, H / 2 - 6, fmt(kv), 'alur-kpi-value', { 'text-anchor': 'middle' });
            kit.text(layer, W / 2, H / 2 + 20, spec.label || '', 'alur-kpi-label', { 'text-anchor': 'middle' });
            if (spec.delta !== undefined) {
                kit.text(layer, W / 2, H / 2 + 44, spec.delta, 'alur-kpi-delta', { 'text-anchor': 'middle' });
            }
        }

        /* Grafana-style hover: the mark under the pointer lights up and a
           small tooltip follows it. One tooltip per chart. */
        function wireHover() {
            var tipEl = document.createElement('div');
            tipEl.className = 'alur-chart-tip';
            tipEl.hidden = true;
            host.appendChild(tipEl);
            var active = null;

            function hide() {
                if (active) active.classList.remove('is-hover');
                active = null;
                tipEl.hidden = true;
            }

            function place(t) {
                var hr = host.getBoundingClientRect();
                var r = t.getBoundingClientRect();
                var text = t.getAttribute('data-tip') || '';
                var stroke = t.getAttribute('stroke');
                var fill = t.getAttribute('fill');
                var color = t.getAttribute('data-color') ||
                    ((stroke && stroke !== 'none') ? stroke :
                        ((fill && fill !== 'none') ? fill : ''));
                tipEl.textContent = '';
                if (color) {
                    var dot = document.createElement('i');
                    dot.className = 'alur-chart-tip-dot';
                    dot.style.background = color;
                    tipEl.appendChild(dot);
                }
                tipEl.appendChild(document.createTextNode(text));
                tipEl.hidden = false;
                var tw = tipEl.offsetWidth;
                var th = tipEl.offsetHeight;
                var x = r.left - hr.left + r.width / 2;
                var left = Math.max(tw / 2 + 4, Math.min(hr.width - tw / 2 - 4, x));
                var above = (r.top - hr.top) >= th + 10;
                tipEl.setAttribute('data-place', above ? 'above' : 'below');
                tipEl.style.left = left + 'px';
                tipEl.style.top = (above ? r.top - hr.top : r.bottom - hr.top) + 'px';
            }

            svg.addEventListener('pointermove', function (ev) {
                var t = ev.target && ev.target.closest ? ev.target.closest('[data-tip]') : null;
                if (!t || !svg.contains(t)) { hide(); return; }
                if (active && active !== t) active.classList.remove('is-hover');
                active = t;
                t.classList.add('is-hover');
                place(t);
            });
            svg.addEventListener('pointerdown', function (ev) {
                var t = ev.target && ev.target.closest ? ev.target.closest('[data-tip]') : null;
                if (!t || !svg.contains(t)) { hide(); return; }
                if (active && active !== t) active.classList.remove('is-hover');
                active = t;
                t.classList.add('is-hover');
                place(t);
            });
            svg.addEventListener('pointerleave', function (ev) {
                if (ev.pointerType === 'mouse') hide();
            });
            svg.addEventListener('pointercancel', hide);
            return { destroy: hide };
        }

        var hover = wireHover();

        return {
            destroy: function () {
                if (hover) hover.destroy();
                stops.forEach(function (s) { try { s(); } catch (e) {} });
                if (svg.parentNode) svg.parentNode.removeChild(svg);
            }
        };
    }

    Alur.register({
        id: 'chart',
        title: 'Chart',
        blurb: 'Bar, hbar, line, area, donut, gauge, spark, kpi, stacked, scatter, waterfall, funnel.',
        mount: mount
    });
})(window);