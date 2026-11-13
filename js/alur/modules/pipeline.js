/* Alur module: pipeline — tahapan berurutan dengan item yang melaju.
   Ordered stages with items moving through. Covers producer/consumer,
   CPU scheduling, CDN cache layers, request pipelines.

   Spec:
   {
     "module": "pipeline",
     "title": "Request pipeline",
     "stages": [{"label":"Client"}, {"label":"Edge"}, {"label":"App"}, {"label":"DB"}],
     "items": 4,
     "color": "cyan"
   } */
(function (global) {
    'use strict';

    var kit = global.AlurKit;
    var cables = global.AlurCables;
    var motions = global.AlurMotions;

    function mount(host, spec, env) {
        var W = spec.width || 880;
        var H = spec.height || 220;
        var svg = kit.svgRoot(host, { w: W, h: H, label: spec.title || 'Alur pipeline' });
        var edgeLayer = kit.g(svg, 'alur-layer-edges');
        var nodeLayer = kit.g(svg, 'alur-layer-nodes');
        var stages = spec.stages || [];
        var n = Math.max(1, stages.length);
        var stops = [];
        var palette = (env && env.palette) || kit.palette;

        var cw = 150, ch = 66;
        var gap = n > 1 ? (W - 40 - n * cw) / (n - 1) : 0;
        gap = Math.max(24, gap);
        var totalW = n * cw + (n - 1) * gap;
        var x0 = (W - totalW) / 2;
        var y = (H - ch) / 2;
        var color = kit.color(spec.color || 'cyan');
        var speed = spec.speed || 1;

        var boxes = [];
        stages.forEach(function (s, i) {
            var x = x0 + i * (cw + gap);
            boxes.push({ x: x, y: y, w: cw, h: ch, label: s.label || ('Stage ' + (i + 1)) });
            var g = kit.g(nodeLayer, 'alur-node alur-pipeline-stage');
            g.setAttribute('transform', 'translate(' + x + ' ' + y + ')');
            var inner = kit.g(g, 'alur-node-inner');
            kit.rect(inner, 0, 0, cw, ch, 'alur-node-box', { rx: 12 });
            kit.rect(inner, 0, 0, 4, ch, 'alur-node-accent', { fill: color, rx: 2 });
            if (s.logos && s.logos.length) {
                var lsize = s.logoSize || 18;
                var ltotal = s.logos.length * lsize + (s.logos.length - 1) * 3;
                kit.iconRow(inner, s.logos, cw / 2, 14, lsize, 3);
            } else if (s.logo) {
                var psize = s.logoSize || 24;
                kit.icon(inner, s.logo, cw / 2 - psize / 2, 12, psize);
            } else kit.circle(inner, cw / 2, 22, 8, 'alur-node-icon', { fill: color, opacity: 0.2 });
            kit.text(inner, cw / 2, ch - 12, boxes[i].label, 'alur-node-label', { 'text-anchor': 'middle' });
            s.el = g;
            s.inner = inner;
        });

        for (var i = 0; i < boxes.length - 1; i++) {
            var a = boxes[i], b = boxes[i + 1];
            var d = kit.line(a.x + a.w, a.y + a.h / 2, b.x, b.y + b.h / 2);
            var cable = cables.draw(edgeLayer, d, {
                style: spec.cable || 'solid',
                color: color,
                width: 2
            });
            stops.push(motions.apply(spec.motion || 'packets', edgeLayer, cable,
                stages[i + 1] ? stages[i + 1].inner : null, {
                    color: color,
                    duration: 2200 / speed,
                    count: spec.items || 4
                }));
        }

        /* Tahap aktif bergiliran. Active stage cycles. */
        var active = -1;
        var timer = setInterval(function () {
            if (env && env.reduced) return;
            active = (active + 1) % n;
            stages.forEach(function (s, i) {
                if (!s.el) return;
                if (i === active) s.el.classList.add('is-active');
                else s.el.classList.remove('is-active');
            });
        }, 900 / speed);
        if (stages[0] && stages[0].el) stages[0].el.classList.add('is-active');

        return {
            destroy: function () {
                clearInterval(timer);
                stops.forEach(function (s) { try { s(); } catch (e) {} });
                if (svg.parentNode) svg.parentNode.removeChild(svg);
            }
        };
    }

    Alur.register({
        id: 'pipeline',
        title: 'Pipeline',
        blurb: 'Ordered stages with moving items; covers pipelines, queues, and cache layers.',
        mount: mount
    });
})(window);