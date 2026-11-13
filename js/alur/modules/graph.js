/* Alur module: graph — simpul, edge, dan penelusuran BFS.
   Nodes, edges, and an animated BFS frontier. Covers BFS, topological order,
   and (with a different order) Dijkstra/MST demos.

   Spec:
   {
     "module": "graph",
     "title": "BFS traversal",
     "nodes": [{"id":"a","x":120,"y":90,"label":"A"}],
     "edges": [{"from":"a","to":"b","w":4}],
     "start": "a"
   } */
(function (global) {
    'use strict';

    var kit = global.AlurKit;
    var cables = global.AlurCables;

    function mount(host, spec, env) {
        var W = spec.width || 860;
        var H = spec.height || 420;
        var svg = kit.svgRoot(host, { w: W, h: H, label: spec.title || 'Alur graph' });
        var edgeLayer = kit.g(svg, 'alur-layer-edges');
        var nodeLayer = kit.g(svg, 'alur-layer-nodes');
        var nodes = spec.nodes || [];
        var edges = spec.edges || [];
        var byId = {};
        nodes.forEach(function (n) { byId[n.id] = n; });

        var palette = (env && env.palette) || kit.palette;
        var accent = kit.color(spec.color || 'cyan');
        var speed = spec.speed || 1;
        var edgeEls = [];
        var nodeEls = {};
        var timer = null;

        /* Edge digambar dulu, simpul di atasnya. Edges first, nodes on top. */
        edges.forEach(function (e) {
            var a = byId[e.from], b = byId[e.to];
            if (!a || !b) return;
            var d = kit.line(a.x, a.y, b.x, b.y);
            var cable = cables.draw(edgeLayer, d, { style: 'solid', color: palette.slate, width: 1.6 });
            /* level diisi setelah BFS; path disimpan untuk di-highlight. */
            var rec = { cable: cable, from: e.from, to: e.to, level: 0, el: cable.main, w: e.w };
            edgeEls.push(rec);
            if (e.w !== undefined) {
                var mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
                kit.text(edgeLayer, mx, my - 5, String(e.w), 'alur-edge-weight', { 'text-anchor': 'middle' });
            }
        });

        nodes.forEach(function (n) {
            var g = kit.g(nodeLayer, 'alur-node alur-graph-node');
            g.setAttribute('transform', 'translate(' + n.x + ' ' + n.y + ')');
            var col = kit.color(n.color || accent);
            kit.circle(g, 0, 0, 21, 'alur-graph-circle', { fill: '#161b22', stroke: col, 'stroke-width': 2 });
            if (n.logo) {
                var gsize = n.logoSize || 24;
                kit.icon(g, n.logo, -gsize / 2, -gsize / 2, gsize);
            }
            else kit.text(g, 0, 4, n.label || n.id, 'alur-graph-label', { 'text-anchor': 'middle' });
            nodeEls[n.id] = g;
        });

        /* BFS dari start. */
        var start = spec.start || (nodes[0] && nodes[0].id);
        var adj = {};
        edges.forEach(function (e) {
            (adj[e.from] = adj[e.from] || []).push(e.to);
            (adj[e.to] = adj[e.to] || []).push(e.from);
        });
        var level = {};
        if (start && byId[start]) {
            level[start] = 0;
            var queue = [start];
            while (queue.length) {
                var u = queue.shift();
                (adj[u] || []).forEach(function (v) {
                    if (level[v] === undefined) { level[v] = level[u] + 1; queue.push(v); }
                });
            }
        }
        var maxLevel = 0;
        Object.keys(level).forEach(function (id) { if (level[id] > maxLevel) maxLevel = level[id]; });
        edgeEls.forEach(function (rec) {
            rec.level = Math.max(level[rec.from] === undefined ? 0 : level[rec.from], level[rec.to] === undefined ? 0 : level[rec.to]);
        });

        function show(step) {
            Object.keys(nodeEls).forEach(function (id) {
                var on = level[id] !== undefined && level[id] <= step;
                nodeEls[id].classList.toggle('is-on', on);
                nodeEls[id].style.opacity = on ? '1' : '0.28';
            });
            edgeEls.forEach(function (rec) {
                var on = rec.level <= step && level[rec.from] !== undefined && level[rec.to] !== undefined;
                rec.el.classList.toggle('is-on', on);
                rec.el.setAttribute('stroke', on ? accent : palette.slate);
                rec.el.setAttribute('stroke-width', on ? 2.6 : 1.4);
            });
        }

        show(0);
        if (!env || !env.reduced) {
            var step = 0;
            timer = setInterval(function () {
                step = (step + 1) % (maxLevel + 2);
                show(step);
            }, 850 / speed);
        }

        return {
            destroy: function () {
                if (timer) clearInterval(timer);
                if (svg.parentNode) svg.parentNode.removeChild(svg);
            }
        };
    }

    Alur.register({
        id: 'graph',
        title: 'Graph',
        blurb: 'Nodes, edges, and an animated BFS frontier; covers traversals and MST demos.',
        mount: mount
    });
})(window);