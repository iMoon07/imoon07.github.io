/* Alur module: reverse-proxy — satu depan, banyak belakang.
   Single front, many backends. TLS termination, routing, caching, and
   load-balancing all at the edge layer.

   Spec:
   {
     "module": "reverse-proxy",
     "title": "...",
     "backends": 3,                 // 1..8, default 3
     "nodes": {
       "client":  { "label": "Client", "logo": "stack:github" },
       "proxy":   { "label": "Reverse Proxy", "logo": "stack:nginx" },
       "backend1":{ "label": "Backend 1", "logo": "programming:nodejs" }
     }
   } */
(function (global) {
    'use strict';

    var kit = global.AlurKit;
    var cables = global.AlurCables;
    var motions = global.AlurMotions;

    function card(parent, x, y, w, h, label, sub, color, cls, logo, logoSize) {
        var g = kit.g(parent, 'alur-node ' + (cls || ''));
        g.setAttribute('transform', 'translate(' + x + ' ' + y + ')');
        var inner = kit.g(g, 'alur-node-inner');
        kit.rect(inner, 0, 0, w, h, 'alur-node-box', { rx: 12 });
        kit.rect(inner, 0, 0, 4, h, 'alur-node-accent', { fill: color, rx: 2 });
        var size = logoSize || 24;
        if (logo) {
            kit.icon(inner, logo, 18, h / 2 - size / 2, size);
        } else {
            kit.circle(inner, 24, h / 2, 10, 'alur-node-icon', { fill: color, opacity: 0.18 });
            kit.circle(inner, 24, h / 2, 4, 'alur-node-icon-dot', { fill: color });
        }
        var tx = logo ? 50 : 42;
        kit.text(inner, tx, h / 2 - (sub ? 4 : -4), label, 'alur-node-label');
        if (sub) kit.text(inner, tx, h / 2 + 12, sub, 'alur-node-sub');
        return g;
    }

    function mount(host, spec, env) {
        var W = spec.width || 880;
        var H = spec.height || 430;
        var speed = spec.speed || 1;
        var svg = kit.svgRoot(host, { w: W, h: H, label: spec.title || 'Reverse proxy' });
        var edgeLayer = kit.g(svg, 'alur-layer-edges');
        var nodeLayer = kit.g(svg, 'alur-layer-nodes');
        var palette = (env && env.palette) || kit.palette;
        var nodes = spec.nodes || {};
        var stops = [];

        var count = Math.max(1, Math.min(8, spec.backends || spec.backendCount || 3));
        var colors = [palette.green, palette.amber, palette.purple, palette.blue,
            palette.cyan, palette.red, palette.lime, palette.pink];

        var client = { x: 26, y: H / 2 - 36, w: 150, h: 72 };
        var proxy = { x: 330, y: H / 2 - 64, w: 190, h: 128 };

        var top = 34;
        var bottom = H - 64;
        var slot = (bottom - top) / count;
        var bh = Math.max(40, Math.min(68, slot - 12));
        var backends = [];
        for (var i = 0; i < count; i++) {
            backends.push({
                x: 672,
                y: top + slot * i + (slot - bh) / 2,
                w: 170,
                h: bh,
                name: 'backend-' + (i + 1),
                color: colors[i % colors.length],
                node: nodes['backend' + (i + 1)] || {}
            });
        }

        /* Kabel masuk: client -> proxy. Ingress cable. */
        var dIn = kit.curve(client.x + client.w, client.y + client.h / 2, proxy.x, proxy.y + proxy.h / 2);
        var inCable = cables.draw(edgeLayer, dIn, { style: 'neon', color: palette.cyan, width: 3 });
        stops.push(motions.apply('packets', edgeLayer, inCable, null, {
            color: palette.cyan, duration: 2600 / speed, count: 5
        }));

        /* Kabel keluar: proxy -> tiap backend, warna beda, bundle. Egress cables. */
        backends.forEach(function (b, i) {
            var d = kit.curve(proxy.x + proxy.w, proxy.y + proxy.h / 2, b.x, b.y + b.h / 2);
            var cable = cables.draw(edgeLayer, d, {
                style: i === 1 ? 'bundle' : 'ribbon',
                color: b.color,
                width: 3
            });
            stops.push(motions.apply('flowMany', edgeLayer, cable, null, {
                color: b.color, duration: 2400 / speed, count: 3
            }));
        });

        /* Kabel balik: backend -> proxy, putus-nyambung (relay). Return path. */
        var returnY = H - 22;
        backends.forEach(function (b) {
            var d = 'M ' + (b.x + b.w / 2) + ' ' + (b.y + b.h) +
                ' L ' + (b.x + b.w / 2) + ' ' + returnY +
                ' L ' + (proxy.x + proxy.w / 2) + ' ' + returnY +
                ' L ' + (proxy.x + proxy.w / 2) + ' ' + (proxy.y + proxy.h);
            var cable = cables.draw(edgeLayer, d, { style: 'relay', color: palette.slate, width: 2 });
            stops.push(motions.apply('relay', edgeLayer, cable, null, {
                color: palette.slate, duration: 3000 / speed
            }));
        });

        /* Simpul. Nodes. */
        var clientNode = nodes.client || {};
        var proxyNode = nodes.proxy || {};
        card(nodeLayer, client.x, client.y, client.w, client.h,
            clientNode.label || 'Client', clientNode.sub || 'browser',
            clientNode.color ? kit.color(clientNode.color) : palette.blue, '',
            clientNode.logo, clientNode.logoSize);
        card(nodeLayer, proxy.x, proxy.y, proxy.w, proxy.h,
            proxyNode.label || 'Reverse Proxy', proxyNode.sub || 'edge layer',
            proxyNode.color ? kit.color(proxyNode.color) : palette.cyan, '',
            proxyNode.logo, proxyNode.logoSize);
        backends.forEach(function (b, i) {
            var g = card(nodeLayer, b.x, b.y, b.w, b.h,
                b.node.label || b.name, b.node.sub || 'upstream',
                b.node.color ? kit.color(b.node.color) : b.color, '',
                b.node.logo, b.node.logoSize);
            g.setAttribute('data-backend', String(i));
        });

        /* Label peran di bawah proxy. Role labels. */
        kit.text(nodeLayer, proxy.x + 12, proxy.y + proxy.h - 14, 'TLS', 'alur-chip', { fill: palette.cyan });
        kit.text(nodeLayer, proxy.x + 62, proxy.y + proxy.h - 14, 'cache', 'alur-chip', { fill: palette.amber });
        kit.text(nodeLayer, proxy.x + 118, proxy.y + proxy.h - 14, 'LB', 'alur-chip', { fill: palette.green });

        /* Round-robin: backend aktif bergiliran. Active backend cycles. */
        var active = 0;
        var timer = setInterval(function () {
            if (env && env.reduced) return;
            active = (active + 1) % backends.length;
            backends.forEach(function (b, i) {
                var node = nodeLayer.querySelector('[data-backend="' + i + '"]');
                if (!node) return;
                if (i === active) node.classList.add('is-active');
                else node.classList.remove('is-active');
            });
        }, 1400 / speed);

        return {
            destroy: function () {
                clearInterval(timer);
                stops.forEach(function (s) { try { s(); } catch (e) {} });
                if (svg.parentNode) svg.parentNode.removeChild(svg);
            }
        };
    }

    Alur.register({
        id: 'reverse-proxy',
        title: 'Reverse Proxy',
        blurb: 'One front, many backends; TLS, cache, and load-balancing at the edge.',
        mount: mount
    });
})(window);