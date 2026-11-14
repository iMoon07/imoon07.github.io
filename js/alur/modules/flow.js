/* Alur module: flow — diagram alur berlapis dengan kabel & motion.
   Layered flow diagram with cables and motion.

   Spec:
   {
     "module": "flow",
     "title": "Request path",
     "cable": "comet",          // default cable style
     "motion": "flow",          // default motion
     "speed": 1,                // 0.5 slow, 2 fast
     "columns": [["client"], ["proxy"], ["app1", "app2"], ["db"]],
     "nodes": {
       "client": { "label": "Client", "sub": "browser", "color": "blue" }
     },
     "edges": [
       { "from": "client", "to": "proxy", "label": "TLS" }
     ]
   } */
(function (global) {
    'use strict';

    var kit = global.AlurKit;
    var cables = global.AlurCables;
    var motions = global.AlurMotions;

    var NODE_W = 156;
    var NODE_H = 56;
    var GAP_X = 54;
    var GAP_Y = 22;

    function layout(spec, W, H) {
        var cols = spec.columns || [];
        var pad = 34;
        var boxes = {};
        var colX = [];
        var i, j;

        if (spec.vertical) {
            var rowH = NODE_H;
            var gapY = cols.length > 1 ? (H - pad * 2 - cols.length * rowH) / (cols.length - 1) : 0;
            for (i = 0; i < cols.length; i++) {
                var row = cols[i] || [];
                var totalW = row.length * NODE_W + Math.max(0, row.length - 1) * 18;
                var x0 = (W - totalW) / 2;
                for (j = 0; j < row.length; j++) {
                    boxes[row[j]] = {
                        x: x0 + j * (NODE_W + 18),
                        y: pad + i * (rowH + gapY),
                        w: NODE_W, h: rowH, col: i
                    };
                }
            }
            return { boxes: boxes, vertical: true };
        }

        var gapX = cols.length > 1 ? (W - pad * 2 - cols.length * NODE_W) / (cols.length - 1) : 0;
        for (i = 0; i < cols.length; i++) {
            colX[i] = pad + i * (NODE_W + gapX);
            var col = cols[i] || [];
            var colH = col.length * NODE_H + Math.max(0, col.length - 1) * GAP_Y;
            var y0 = (H - colH) / 2;
            for (j = 0; j < col.length; j++) {
                boxes[col[j]] = {
                    x: colX[i],
                    y: y0 + j * (NODE_H + GAP_Y),
                    w: NODE_W, h: NODE_H, col: i
                };
            }
        }
        return { boxes: boxes, vertical: false };
    }

    function edgePath(a, b, vertical) {
        if (vertical) {
            if (Math.abs(a.x - b.x) < 2) {
                return kit.line(a.x + a.w / 2, a.y + a.h, b.x + b.w / 2, b.y);
            }
            var midY = (a.y + a.h + b.y) / 2;
            return 'M ' + (a.x + a.w / 2) + ' ' + (a.y + a.h) +
                ' L ' + (a.x + a.w / 2) + ' ' + midY +
                ' L ' + (b.x + b.w / 2) + ' ' + midY +
                ' L ' + (b.x + b.w / 2) + ' ' + b.y;
        }
        if (Math.abs(a.y - b.y) < 2 && a.x < b.x) {
            return kit.line(a.x + a.w, a.y + a.h / 2, b.x, b.y + b.h / 2);
        }
        var midX = (a.x + a.w + b.x) / 2;
        return 'M ' + (a.x + a.w) + ' ' + (a.y + a.h / 2) +
            ' L ' + midX + ' ' + (a.y + a.h / 2) +
            ' L ' + midX + ' ' + (b.y + b.h / 2) +
            ' L ' + b.x + ' ' + (b.y + b.h / 2);
    }

    function edgeEnd(a, b, vertical) {
        if (vertical) {
            return {
                tip: [b.x + b.w / 2, b.y],
                from: [b.x + b.w / 2, b.y + 10]
            };
        }
        var fromX = b.x < a.x ? b.x + 10 : b.x - 10;
        return {
            tip: [b.x, b.y + b.h / 2],
            from: [fromX, b.y + b.h / 2]
        };
    }

    /* Sama dengan panah Excalidraw: V terbuka, bukan segitiga terisi.
       Same as an Excalidraw arrow: an open V, not a filled triangle. */
    function arrowHead(layer, end, color) {
        if (!end) return;
        return kit.arrowHead(layer, end.tip, end.from, 'arrow', color, { width: 2 });
    }

    function drawNode(parent, box, node, palette) {
        var color = kit.color(node.color);
        var g = kit.g(parent, 'alur-node');
        g.setAttribute('transform', 'translate(' + box.x + ' ' + box.y + ')');
        /* Isi simpul di grup dalam: transform motion tidak menimpa translate.
           Node content lives in an inner group so motion transforms do not
           override the translate. */
        var inner = kit.g(g, 'alur-node-inner');
        kit.rect(inner, 0, 0, box.w, box.h, 'alur-node-box', { rx: 11 });
        kit.rect(inner, 0, 0, 4, box.h, 'alur-node-accent', { fill: color, rx: 2 });

        /* Logo: node.logo / node.logos (587 logo lokal), ukuran & posisi bebas.
           Logo placement: left | right | top | bottom, plus logoSize. */
        var ids = (node.logos && node.logos.length) ? node.logos
            : (node.logo ? [node.logo] : []);
        var pos = node.logoPos || 'left';
        var size = node.logoSize || (ids.length > 1 ? 20 : 28);
        var labelX = 58, labelY1 = 23, labelY2 = 39;
        var labelAnchor = 'start';
        var total;

        if (ids.length) {
            if (pos === 'right') {
                if (ids.length > 1) {
                    total = ids.length * size + (ids.length - 1) * 2;
                    kit.iconRow(inner, ids, box.w - 10 - total / 2, box.h / 2 - size / 2, size, 2);
                } else {
                    kit.icon(inner, ids[0], box.w - 10 - size, box.h / 2 - size / 2, size);
                }
                labelX = 16;
            } else if (pos === 'top' || pos === 'bottom') {
                var ly = pos === 'top' ? 5 : box.h - 5 - size;
                if (ids.length > 1) {
                    total = ids.length * size + (ids.length - 1) * 2;
                    kit.iconRow(inner, ids, box.w / 2, ly, size, 2);
                } else {
                    kit.icon(inner, ids[0], box.w / 2 - size / 2, ly, size);
                }
                labelX = box.w / 2;
                labelAnchor = 'middle';
                if (pos === 'top') {
                    labelY1 = 40;
                    labelY2 = 52;
                } else {
                    labelY1 = box.h - size - 22;
                    labelY2 = box.h - size - 10;
                }
            } else if (ids.length > 1) {
                total = ids.length * size + (ids.length - 1) * 2;
                kit.iconRow(inner, ids, 10 + total / 2, box.h / 2 - size / 2, size, 2);
            } else {
                kit.icon(inner, ids[0], 19, box.h / 2 - size / 2, size);
            }
        } else {
            kit.circle(inner, 26, box.h / 2, 11, 'alur-node-icon', { fill: color, opacity: 0.18 });
            kit.circle(inner, 26, box.h / 2, 4.5, 'alur-node-icon-dot', { fill: color });
        }

        kit.text(inner, labelX, labelY1, node.label || '', 'alur-node-label', { 'text-anchor': labelAnchor });
        if (node.sub) kit.text(inner, labelX, labelY2, node.sub, 'alur-node-sub', { 'text-anchor': labelAnchor });
        return g;
    }

    function mount(host, spec, env) {
        var W = spec.width || 860;
        var H = spec.height || 440;
        var svg = kit.svgRoot(host, { w: W, h: H, label: spec.title || 'Alur flow' });
        var layerEdges = kit.g(svg, 'alur-layer-edges');
        var layerNodes = kit.g(svg, 'alur-layer-nodes');

        var lay = layout(spec, W, H);
        var boxes = lay.boxes;
        var palette = (env && env.palette) || kit.palette;
        var speed = spec.speed || 1;
        var stops = [];
        /* Compact edge syntax: ["from", "to"] or ["from", "to", "label"].
           The object form stays supported for per-edge cable/motion. */
        var edges = (spec.edges || []).map(function (e) {
            if (!Array.isArray(e)) return e;
            var out = { from: e[0], to: e[1] };
            if (e.length > 2 && e[2] != null && e[2] !== '') {
                if (typeof e[2] === 'object') {
                    Object.keys(e[2]).forEach(function (k) { out[k] = e[2][k]; });
                } else {
                    out.label = String(e[2]);
                }
            }
            if (e[3] && typeof e[3] === 'object') {
                Object.keys(e[3]).forEach(function (k) { out[k] = e[3][k]; });
            }
            return out;
        });
        var nodeEls = {};

        /* Simpul digambar dulu supaya motion bisa menunjuk simpul tujuan.
           Nodes are drawn first so node-based motion can target them. */
        Object.keys(boxes).forEach(function (id) {
            var node = (spec.nodes && spec.nodes[id]) || { label: id };
            nodeEls[id] = drawNode(layerNodes, boxes[id], node, palette);
        });

        edges.forEach(function (e) {
            var a = boxes[e.from];
            var b = boxes[e.to];
            if (!a || !b) return;
            var d = edgePath(a, b, lay.vertical);
            var cable = cables.draw(layerEdges, d, {
                style: e.cable || spec.cable || 'solid',
                color: e.color || spec.color || 'blue',
                width: e.width || spec.width,
                label: e.label
            });
            arrowHead(layerEdges, edgeEnd(a, b, lay.vertical),
                kit.color(e.color || spec.color || 'blue'));
            var motion = e.motion || spec.motion || 'flow';
            if (motion && motion !== 'none') {
                var stop = motions.apply(motion, layerEdges, cable, nodeEls[e.to] || null, {
                    color: kit.color(e.color || spec.color || 'blue'),
                    duration: (e.duration || spec.duration || 3200) / speed,
                    count: e.count || spec.count
                });
                stops.push(stop);
            }
        });

        return {
            destroy: function () {
                stops.forEach(function (s) { try { s(); } catch (e) {} });
                if (svg.parentNode) svg.parentNode.removeChild(svg);
            }
        };
    }

    Alur.register({
        id: 'flow',
        title: 'Flow',
        blurb: 'Layered flow with many cable styles and motion.',
        mount: mount
    });
})(window);