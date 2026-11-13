/* Alur module: canvas — kanvas bebas (free-form editor).
   Node diletakkan manual (x, y), boleh berbentuk kotak, pill, lingkaran,
   atau tanpa kotak. Kabel + motion tetap memakai katalog yang sama.

   Spec:
   {
     "module": "canvas",
     "title": "My canvas",
     "grid": true,                 // latar grid di belakang semua
     "width": 900, "height": 520,
     "cable": "solid", "motion": "flow", "speed": 1,
     "selected": "n1",             // opsional: id node terpilih
     "nodes": {
       "n1": {
         "x": 120, "y": 90, "w": 160, "h": 60,
         "shape": "box",            // box | pill | circle | plain | none
         "label": "Box", "sub": "text",
         "color": "blue",
         "logo": "stack:docker", "logoSize": 18, "logoPos": "left"
       }
     },
     "edges": [
       { "from": "n1", "to": "n2", "cable": "neon", "motion": "comet" }
     ]
   } */
(function (global) {
    'use strict';

    var kit = global.AlurKit;
    var cables = global.AlurCables;
    var motions = global.AlurMotions;
    var uid = 0;

    function selectedIds(spec) {
        var s = spec.selected;
        if (Array.isArray(s)) return s.slice();
        return s ? [s] : [];
    }

    function drawNode(parent, n, selected) {
        if (n.shape === 'module' && n.module) {
            return drawModuleNode(parent, n, selected);
        }
        var w = n.w || 160;
        var h = n.h || 60;
        var color = kit.color(n.color);
        var shape = n.shape || 'box';
        var fill = (n.fill && n.fill !== 'transparent') ? kit.color(n.fill) : 'transparent';
        var fillStyle = n.fillStyle || (fill === 'transparent' ? 'solid' : 'hachure');
        var fillPaint = fill;
        if (fill !== 'transparent' && fillStyle !== 'solid') {
            var fillId = 'alur-fill-' + (++uid);
            var fillDefs = kit.el('defs', {}, parent);
            var fillPat = kit.el('pattern', {
                id: fillId, width: 8, height: 8, patternUnits: 'userSpaceOnUse'
            }, fillDefs);
            kit.el('path', {
                d: 'M 0 8 L 8 0', stroke: fill, 'stroke-width': 1.1, fill: 'none'
            }, fillPat);
            if (fillStyle === 'cross-hatch') {
                kit.el('path', {
                    d: 'M 0 0 L 8 8', stroke: fill, 'stroke-width': 1.1, fill: 'none'
                }, fillPat);
            }
            fillPaint = 'url(#' + fillId + ')';
        }
        var sw = n.strokeWidth || 1.5;
        var dash = n.strokeStyle === 'dashed' ? '7 5' :
            (n.strokeStyle === 'dotted' ? '2 4' : '');
        var style = 'fill:' + fillPaint + ';stroke:' + color + ';stroke-width:' + sw + ';' +
            (dash ? 'stroke-dasharray:' + dash + ';' : '');
        var rough = n.sloppiness && n.sloppiness !== 'architect';
        var g = kit.g(parent, 'alur-node alur-canvas-node' + (selected ? ' is-selected' : ''));
        g.setAttribute('transform', 'translate(' + (n.x || 0) + ' ' + (n.y || 0) + ')');
        g.setAttribute('data-node-id', n.id);
        if (n.opacity != null) g.setAttribute('opacity', n.opacity);
        var inner = kit.g(g, 'alur-node-inner');

        if (shape === 'circle') {
            var r = Math.max(18, Math.min(w, h) / 2 - 2);
            kit.circle(inner, w / 2, h / 2, r, 'alur-node-box', {
                stroke: color, fill: fillPaint, 'stroke-width': sw,
                'stroke-dasharray': dash || null, style: style
            });
            if (rough) {
                kit.circle(inner, w / 2, h / 2, r, 'alur-node-rough', {
                    fill: 'none', stroke: color, 'stroke-width': Math.max(0.6, sw * 0.55),
                    opacity: 0.42,
                    transform: 'rotate(-0.5 ' + (w / 2) + ' ' + (h / 2) + ')'
                });
            }
        } else if (shape === 'diamond') {
            var dd = 'M ' + (w / 2) + ' 0 L ' + w + ' ' + (h / 2) +
                ' L ' + (w / 2) + ' ' + h + ' L 0 ' + (h / 2) + ' Z';
            kit.path(inner, dd, 'alur-node-box', {
                stroke: color, fill: fillPaint, 'stroke-width': sw,
                'stroke-dasharray': dash || null, style: style
            });
            if (rough) {
                kit.path(inner, dd, 'alur-node-rough', {
                    fill: 'none', stroke: color, 'stroke-width': Math.max(0.6, sw * 0.55),
                    opacity: 0.42,
                    transform: 'rotate(-0.45 ' + (w / 2) + ' ' + (h / 2) + ')'
                });
            }
        } else if (shape !== 'plain' && shape !== 'none') {
            var rx = shape === 'pill' ? h / 2 : (n.edge === 'round' ? Math.min(14, h / 2) : 0);
            kit.rect(inner, 0, 0, w, h, 'alur-node-box', {
                rx: rx, stroke: color, fill: fillPaint, 'stroke-width': sw,
                'stroke-dasharray': dash || null, style: style
            });
            if (rough) {
                kit.rect(inner, 0, 0, w, h, 'alur-node-rough', {
                    rx: rx, fill: 'none', stroke: color,
                    'stroke-width': Math.max(0.6, sw * 0.55), opacity: 0.42,
                    transform: 'rotate(-0.35 ' + (w / 2) + ' ' + (h / 2) + ')'
                });
            }
        }

        var ids = (n.logos && n.logos.length) ? n.logos : (n.logo ? [n.logo] : []);
        var size = Math.max(10, Math.min(w, h) * (ids.length > 1 ? 0.24 : 0.34));
        var cx = w / 2;
        var cy = h / 2;
        if (ids.length) {
            if (ids.length > 1) {
                kit.iconRow(inner, ids, cx, cy - size / 2, size, 2);
            } else {
                kit.icon(inner, ids[0], cx - size / 2, cy - size / 2, size);
            }
        }

        var align = n.textAlign || (ids.length || shape === 'circle' ? 'center' : 'left');
        var anchor = align === 'center' ? 'middle' : (align === 'right' ? 'end' : 'start');
        var labelX = ids.length || shape === 'circle' ? cx :
            (align === 'center' ? w / 2 : (align === 'right' ? w - 8 : (shape === 'plain' ? 8 : 12)));
        var labelY = ids.length ? (h - 8) : (shape === 'circle' ? h - 12 : (shape === 'plain' ? 20 : 23));
        var size = n.fontSize || (shape === 'plain' ? 16 : 13);
        var lineHeight = Math.max(1, n.lineHeight || 1.35);
        var weight = n.fontWeight || (n.bold ? 700 : 400);
        var fontStyle = n.fontStyle || (n.italic ? 'italic' : 'normal');
        var label = kit.text(inner, labelX, labelY, '', 'alur-node-label', {
            'text-anchor': anchor,
            'font-size': size,
            'font-family': n.fontFamily || 'Excalifont, sans-serif',
            'font-weight': weight,
            'font-style': fontStyle,
            fill: kit.color(n.color || '#e6edf3')
        });
        String(n.label || '').split('\n').forEach(function (line, i) {
            var span = kit.el('tspan', {
                x: labelX,
                y: labelY + i * size * lineHeight
            }, label);
            span.textContent = line;
        });
        if (n.sub) {
            kit.text(inner, labelX, labelY + size * lineHeight + 2, n.sub, 'alur-node-sub', { 'text-anchor': anchor });
        }
        return g;
    }

    function drawModuleNode(parent, n, selected) {
        var w = n.w || 360;
        var h = n.h || 240;
        var title = n.label || '';
        var top = title ? 18 : 0;
        var g = kit.g(parent, 'alur-node alur-canvas-node alur-module-node' +
            (selected ? ' is-selected' : ''));
        g.setAttribute('transform', 'translate(' + (n.x || 0) + ' ' + (n.y || 0) + ')');
        g.setAttribute('data-node-id', n.id);
        if (n.opacity != null) g.setAttribute('opacity', n.opacity);
        var inner = kit.g(g, 'alur-node-inner');
        /* Flat node: no card, no close button. The module content is the node. */
        kit.rect(inner, 0, top, w, Math.max(1, h - top), 'alur-node-box alur-module-box', {
            fill: 'none', stroke: 'none', 'pointer-events': 'all'
        });
        if (title) {
            kit.text(inner, 0, 12, title, 'alur-node-label alur-module-title', {
                'font-size': 12, 'text-anchor': 'start'
            });
        }
        var fo = kit.el('foreignObject', {
            x: 0, y: top, width: Math.max(12, w), height: Math.max(12, h - top),
            'class': 'alur-module-fo'
        }, inner);
        var div = document.createElementNS('http://www.w3.org/1999/xhtml', 'div');
        div.className = 'alur-module-embed';
        div.setAttribute('data-module', n.module);
        div.setAttribute('data-spec', JSON.stringify(n.moduleSpec || { module: n.module }));
        fo.appendChild(div);
        return g;
    }

    function arrowHeadAt(layer, tip, from, type, color, specIndex) {
        if (!tip || !from || type === 'none') return;
        var ang = Math.atan2(tip[1] - from[1], tip[0] - from[0]);
        var len = type === 'triangle' ? 13 : 9;
        var spread = type === 'triangle' ? 7 : 4.5;
        var x1 = tip[0] - len * Math.cos(ang) + spread * Math.sin(ang);
        var y1 = tip[1] - len * Math.sin(ang) - spread * Math.cos(ang);
        var x2 = tip[0] - len * Math.cos(ang) - spread * Math.sin(ang);
        var y2 = tip[1] - len * Math.sin(ang) + spread * Math.cos(ang);
        var attrs = { fill: color, stroke: 'none', 'data-edge': String(specIndex) };
        if (type === 'circle') {
            kit.circle(layer, tip[0], tip[1], 4, 'alur-edge-head', attrs);
        } else if (type === 'diamond') {
            kit.path(layer,
                'M ' + tip[0] + ' ' + (tip[1] - 6) +
                ' L ' + (tip[0] + 6) + ' ' + tip[1] +
                ' L ' + tip[0] + ' ' + (tip[1] + 6) +
                ' L ' + (tip[0] - 6) + ' ' + tip[1] + ' Z',
                'alur-edge-head', attrs);
        } else if (type === 'bar') {
            kit.path(layer,
                'M ' + x1 + ' ' + y1 + ' L ' + x2 + ' ' + y2,
                'alur-edge-head', { stroke: color, 'stroke-width': 2, fill: 'none', 'data-edge': String(specIndex) });
        } else {
            kit.path(layer,
                'M ' + tip[0] + ' ' + tip[1] + ' L ' + x1 + ' ' + y1 +
                ' L ' + x2 + ' ' + y2 + ' Z',
                'alur-edge-head', attrs);
        }
    }

    function smoothPath(pts) {
        if (!pts || pts.length < 3) {
            var d0 = 'M ' + pts[0][0] + ' ' + pts[0][1];
            for (var j = 1; j < pts.length; j++) d0 += ' L ' + pts[j][0] + ' ' + pts[j][1];
            return d0;
        }
        var d = 'M ' + pts[0][0] + ' ' + pts[0][1];
        for (var i = 0; i < pts.length - 1; i++) {
            var p0 = pts[i - 1] || pts[i];
            var p1 = pts[i];
            var p2 = pts[i + 1];
            var p3 = pts[i + 2] || p2;
            var c1x = p1[0] + (p2[0] - p0[0]) / 6;
            var c1y = p1[1] + (p2[1] - p0[1]) / 6;
            var c2x = p2[0] - (p3[0] - p1[0]) / 6;
            var c2y = p2[1] - (p3[1] - p1[1]) / 6;
            d += ' C ' + c1x + ' ' + c1y + ', ' + c2x + ' ' + c2y + ', ' + p2[0] + ' ' + p2[1];
        }
        return d;
    }

    function freeEdgePath(e) {
        var pts = e && e.points;
        if (!pts || pts.length < 2) return '';
        if (e.curved) return smoothPath(pts);
        var d = 'M ' + pts[0][0] + ' ' + pts[0][1];
        for (var i = 1; i < pts.length; i++) d += ' L ' + pts[i][0] + ' ' + pts[i][1];
        return d;
    }

    function nodeVisualBounds(n) {
        var w = n.w || 160;
        var h = n.h || 60;
        var x = n.x || 0;
        var y = n.y || 0;
        var minX = x, minY = y, maxX = x + w, maxY = y + h;
        var ids = (n.logos && n.logos.length) ? n.logos : (n.logo ? [n.logo] : []);
        if (ids.length) {
            /* Same logo metrics as drawNode(): centered row, 24% / 34% of the
               node's short side. If a logo is larger than the box, the hit
               target and the cable end follow the visible pixels, not the box. */
            var size = Math.max(10, Math.min(w, h) * (ids.length > 1 ? 0.24 : 0.34));
            var total = ids.length * size + (ids.length - 1) * 2;
            var left = x + (w - total) / 2;
            var top = y + (h - size) / 2;
            minX = Math.min(minX, left);
            minY = Math.min(minY, top);
            maxX = Math.max(maxX, left + total);
            maxY = Math.max(maxY, top + size);
        }
        return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
    }

    function nodeBoundaryPoint(n, towardX, towardY) {
        var b = nodeVisualBounds(n);
        var w = b.w;
        var h = b.h;
        var cx = b.x + w / 2;
        var cy = b.y + h / 2;
        var dx = towardX - cx;
        var dy = towardY - cy;
        if (!dx && !dy) return [cx, cy];
        var pad = 1;
        var hw = Math.max(1, w / 2 - pad);
        var hh = Math.max(1, h / 2 - pad);
        var shape = n.shape || 'box';
        var t;
        if (shape === 'circle') {
            var rx = Math.max(1, hw);
            var ry = Math.max(1, hh);
            t = 1 / Math.sqrt((dx * dx) / (rx * rx) + (dy * dy) / (ry * ry));
        } else if (shape === 'diamond') {
            t = 1 / (Math.abs(dx) / hw + Math.abs(dy) / hh);
        } else {
            /* Box / pill / plain / module. For rounded shapes, intersect the
               ray with the rounded rectangle so the head sits on the visible
               border instead of floating at the bounding box corner. */
            var radius = shape === 'pill' ? Math.min(hw, hh) :
                (n.edge === 'round' ? Math.min(14, hh) : 0);
            t = Math.min(hw / Math.max(0.001, Math.abs(dx)),
                         hh / Math.max(0.001, Math.abs(dy)));
            if (radius > 0) {
                var px = dx * t;
                var py = dy * t;
                if (Math.abs(px) > hw - radius && Math.abs(py) > hh - radius) {
                    var ccx = (px < 0 ? -1 : 1) * (hw - radius);
                    var ccy = (py < 0 ? -1 : 1) * (hh - radius);
                    var len = Math.sqrt(dx * dx + dy * dy);
                    var ux = dx / len;
                    var uy = dy / len;
                    var bq = ux * ccx + uy * ccy;
                    var cq = ccx * ccx + ccy * ccy - radius * radius;
                    var disc = bq * bq - cq;
                    if (disc >= 0) {
                        var tc = bq + Math.sqrt(disc);
                        if (tc > 0) t = tc / len;
                    }
                }
            }
        }
        return [cx + dx * t, cy + dy * t];
    }

    function edgeEnds(e, nodes) {
        if (e.points && e.points.length >= 2) {
            return { points: e.points, free: true };
        }
        var a = nodes[e.from];
        var b = nodes[e.to];
        if (!a || !b) return null;
        var ab = nodeVisualBounds(a);
        var bb = nodeVisualBounds(b);
        var ac = [ab.x + ab.w / 2, ab.y + ab.h / 2];
        var bc = [bb.x + bb.w / 2, bb.y + bb.h / 2];
        return {
            points: [
                nodeBoundaryPoint(a, bc[0], bc[1]),
                nodeBoundaryPoint(b, ac[0], ac[1])
            ],
            free: false
        };
    }

    function mount(host, spec, env) {
        var W = spec.width || 900;
        var H = spec.height || 520;
        var svg = kit.svgRoot(host, { w: W, h: H, label: spec.title || 'Alur canvas' });
        var zoom = Math.max(0.35, Math.min(3, spec.zoom || 1));
        svg.setAttribute('viewBox',
            (spec.panX || 0) + ' ' + (spec.panY || 0) + ' ' + (W / zoom) + ' ' + (H / zoom));
        var palette = (env && env.palette) || kit.palette;
        var speed = spec.speed || 1;
        var stops = [];

        var drawLayer = kit.g(svg, 'alur-layer-draw');
        (spec.drawings || []).forEach(function (dr) {
            var dash = dr.strokeStyle === 'dashed' ? '7 5' :
                (dr.strokeStyle === 'dotted' ? '2 4' : '');
            var p = kit.path(drawLayer, dr.d, 'alur-drawing' + (spec.selectedDrawing === dr.id ? ' is-selected' : ''), {
                stroke: kit.color(dr.color || '#e6edf3'),
                'stroke-width': dr.width || 2,
                'stroke-dasharray': dash || null,
                opacity: dr.opacity == null ? 1 : dr.opacity,
                fill: 'none',
                'stroke-linecap': 'round',
                'stroke-linejoin': 'round'
            });
            if (dr.id) p.setAttribute('data-drawing', dr.id);
        });

        var edgeLayer = kit.g(svg, 'alur-layer-edges');
        var pointLayer = kit.g(svg, 'alur-layer-points');
        var nodeLayer = kit.g(svg, 'alur-layer-nodes');
        var nodes = spec.nodes || {};
        var nodeEls = {};
        var selected = selectedIds(spec);
        var primary = selected.length ? selected[selected.length - 1] : null;

        Object.keys(nodes).forEach(function (id) {
            nodes[id].id = id;
            nodeEls[id] = drawNode(nodeLayer, nodes[id], selected.indexOf(id) >= 0);
        });

        var embeddedModules = [];
        Object.keys(nodes).forEach(function (id) {
            if (!nodes[id] || nodes[id].shape !== 'module' || !nodes[id].module) return;
            var holder = nodeEls[id] && nodeEls[id].querySelector
                ? nodeEls[id].querySelector('.alur-module-embed') : null;
            if (!holder) return;
            try {
                var rec = global.Alur.mount(holder);
                if (rec) embeddedModules.push(rec);
                var embeddedCaption = holder.querySelector('.alur-caption');
                if (embeddedCaption && embeddedCaption.parentNode) embeddedCaption.parentNode.removeChild(embeddedCaption);
            } catch (err) {
                holder.innerHTML = '<p class="alur-error">Module error</p>';
            }
        });

        /* Sembunyikan kabel di dalam node supaya tidak menimpa label/logo.
           Node tetap transparan; hanya bagian kabel yang masuk area node yang
           di-clip oleh mask. */
        var edgeMaskId = 'alur-edge-mask-' + (++uid);
        var maskDefs = kit.el('defs', {}, svg);
        var edgeMask = kit.el('mask', {
            id: edgeMaskId, maskUnits: 'userSpaceOnUse',
            x: 0, y: 0, width: W, height: H
        }, maskDefs);
        kit.rect(edgeMask, 0, 0, W, H, '', { fill: '#fff' });
        Object.keys(nodes).forEach(function (id) {
            var n = nodes[id];
            var w = n.w || 160;
            var h = n.h || 60;
            var shape = n.shape || 'box';
            if (shape === 'circle') {
                kit.circle(edgeMask, (n.x || 0) + w / 2, (n.y || 0) + h / 2,
                    Math.max(18, Math.min(w, h) / 2 - 2), '', { fill: '#000' });
            } else if (shape === 'diamond') {
                var dd = 'M ' + (n.x || 0) + ' ' + ((n.y || 0) + h / 2) +
                    ' L ' + ((n.x || 0) + w) + ' ' + ((n.y || 0) + h / 2) +
                    ' L ' + ((n.x || 0) + w / 2) + ' ' + ((n.y || 0) + h) +
                    ' L ' + (n.x || 0) + ' ' + ((n.y || 0) + h / 2) + ' Z';
                kit.path(edgeMask, dd, '', { fill: '#000' });
            } else {
                var rx = shape === 'pill' ? h / 2 : (n.edge === 'round' ? Math.min(14, h / 2) : 0);
                kit.rect(edgeMask, n.x || 0, n.y || 0, w, h, '', {
                    rx: rx, fill: '#000'
                });
            }
        });
        edgeLayer.setAttribute('mask', 'url(#' + edgeMaskId + ')');

        /* Pegangan resize untuk node terpilih. Resize handles. */
        var handleLayer = kit.g(svg, 'alur-layer-handles');
        var sel = primary && nodes[primary];
        if (sel) {
            var sw = sel.w || 160, sh = sel.h || 60;
            var sx = sel.x || 0, sy = sel.y || 0;
            [['nw', 0, 0], ['n', sw / 2, 0], ['ne', sw, 0], ['e', sw, sh / 2],
             ['se', sw, sh], ['s', sw / 2, sh], ['sw', 0, sh], ['w', 0, sh / 2]
            ].forEach(function (h) {
                var r = kit.rect(handleLayer, sx + h[1] - 4, sy + h[2] - 4, 8, 8, 'alur-handle', {
                    'data-handle': h[0],
                    'data-node-id': sel.id
                });
                r.setAttribute('stroke-width', '1.5');
            });
        }

        (spec.edges || []).forEach(function (e, i) {
            var color = e.color || spec.color || palette.blue;
            var ends = edgeEnds(e, nodes);
            if (!ends) return;
            var d = e.points && e.points.length >= 2
                ? freeEdgePath(e)
                : kit.curve(ends.points[0][0], ends.points[0][1], ends.points[1][0], ends.points[1][1]);
            var cable = cables.draw(edgeLayer, d, {
                style: e.strokeStyle || e.cable || spec.cable || 'solid',
                color: color,
                width: e.width || 2.4
            });
            if (cable.group && e.opacity != null) cable.group.setAttribute('opacity', e.opacity);
            if (cable.main) {
                cable.main.setAttribute('data-edge', String(i));
                cable.main.classList.add('alur-canvas-edge');
                if (spec.selectedEdge === i) cable.main.classList.add('is-selected');
                if ((e.from && selected.indexOf(e.from) >= 0) ||
                    (e.to && selected.indexOf(e.to) >= 0)) {
                    cable.main.classList.add('is-linked');
                }
            }
            var type = e.arrowType || 'arrow';
            var endOn = e.arrowEnd !== undefined ? e.arrowEnd :
                (e.points && e.points.length >= 2 ? true : !!(e.from && e.to));
            if (e.arrowStart) arrowHeadAt(edgeLayer, ends.points[0], ends.points[1], type, color, i);
            if (endOn) {
                var last = ends.points[ends.points.length - 1];
                var prev = ends.points[ends.points.length - 2];
                arrowHeadAt(edgeLayer, last, prev, type, color, i);
            }
            if (e.points && spec.selectedEdge === i) {
                e.points.forEach(function (pt, pi) {
                    var h = kit.circle(pointLayer, pt[0], pt[1], 4.5, 'alur-edge-point' +
                        (pi === 0 || pi === e.points.length - 1 ? ' is-end' : ''), {
                        'data-edge': String(i),
                        'data-edge-point': String(pi)
                    });
                    h.setAttribute('stroke-width', '1.4');
                });
                if (e.points.length === 2) {
                    var mid = [
                        (e.points[0][0] + e.points[1][0]) / 2,
                        (e.points[0][1] + e.points[1][1]) / 2
                    ];
                    var mh = kit.circle(pointLayer, mid[0], mid[1], 4.5,
                        'alur-edge-point is-mid', {
                            'data-edge': String(i),
                            'data-edge-mid': String(i)
                        });
                    mh.setAttribute('stroke-width', '1.4');
                }
            }
            if (e.from && e.to && nodeEls[e.to]) {
                stops.push(motions.apply(e.motion || spec.motion || 'flow', edgeLayer, cable,
                    nodeEls[e.to], {
                        color: color,
                        duration: (e.duration || 2600) / speed,
                        count: e.count || 3
                    }));
            }
        });

        return {
            destroy: function () {
                embeddedModules.forEach(function (rec) {
                    try { global.Alur.destroy(rec); } catch (err) {}
                });
                stops.forEach(function (s) { try { s(); } catch (err) {} });
                if (svg.parentNode) svg.parentNode.removeChild(svg);
            }
        };
    }

    Alur.register({
        id: 'canvas',
        title: 'Canvas',
        blurb: 'Free-form nodes you place yourself; box, pill, circle, or no box.',
        mount: mount
    });
})(window);