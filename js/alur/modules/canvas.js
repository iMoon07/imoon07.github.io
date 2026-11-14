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

    function tableData(n) {
        var cols = (n.columns && n.columns.length) ? n.columns.slice() : ['Column 1', 'Column 2', 'Column 3'];
        var rows = (n.rows && n.rows.length) ? n.rows.map(function (r) { return r.slice(); }) : [
            ['', '', ''], ['', '', ''], ['', '', '']
        ];
        rows.forEach(function (r) {
            while (r.length < cols.length) r.push('');
            r.length = cols.length;
        });
        return { cols: cols, rows: rows };
    }

    /* Table nodes stay editable wherever they render: the editor and the
       reading page share this code, so readers can add rows and type too.
       Mutating the node object is enough — no host wiring required. */
    function mutateTable(n, action) {
        var d = tableData(n);
        if (action === 'add-row') {
            d.rows.push(new Array(d.cols.length).fill(''));
        } else if (action === 'del-row') {
            if (d.rows.length > 1) d.rows.pop();
        } else if (action === 'add-col') {
            d.cols.push('Column ' + (d.cols.length + 1));
            d.rows.forEach(function (row) { row.push(''); });
        } else if (action === 'del-col') {
            if (d.cols.length > 1) {
                d.cols.pop();
                d.rows.forEach(function (row) { row.pop(); });
            }
        }
        n.columns = d.cols;
        n.rows = d.rows;
        return d;
    }

    function writeCell(n, cell) {
        var d = tableData(n);
        var r = parseInt(cell.getAttribute('data-r'), 10);
        var c = parseInt(cell.getAttribute('data-c'), 10);
        if (r === -1) {
            if (d.cols[c] != null) d.cols[c] = cell.textContent;
        } else if (d.rows[r] && d.rows[r][c] != null) {
            d.rows[r][c] = cell.textContent;
        }
        n.columns = d.cols;
        n.rows = d.rows;
    }

    function fillTable(table, n) {
        var data = tableData(n);
        table.innerHTML = '';

        var thead = document.createElement('thead');
        var htr = document.createElement('tr');
        data.cols.forEach(function (label, c) {
            var th = document.createElement('th');
            th.setAttribute('contenteditable', 'true');
            th.setAttribute('spellcheck', 'false');
            th.setAttribute('data-table-node', n.id);
            th.setAttribute('data-r', '-1');
            th.setAttribute('data-c', String(c));
            th.textContent = label;
            htr.appendChild(th);
        });
        thead.appendChild(htr);
        table.appendChild(thead);

        var tbody = document.createElement('tbody');
        data.rows.forEach(function (row, r) {
            var tr = document.createElement('tr');
            data.cols.forEach(function (_, c) {
                var td = document.createElement('td');
                td.setAttribute('contenteditable', 'true');
                td.setAttribute('spellcheck', 'false');
                td.setAttribute('data-table-node', n.id);
                td.setAttribute('data-r', String(r));
                td.setAttribute('data-c', String(c));
                td.textContent = row[c] || '';
                tr.appendChild(td);
            });
            tbody.appendChild(tr);
        });
        table.appendChild(tbody);
        return data;
    }

    /* Table UI shared by the canvas node and the plain reading-page table.
       Both stay editable; only the chrome around them differs. */
    function buildTableUI(n, onChange) {
        var div = document.createElement('div');
        div.className = 'alur-table-wrap';
        if (n.id) div.setAttribute('data-table-node', n.id);

        var tools = document.createElement('div');
        tools.className = 'alur-table-tools';
        [['add-row', '+ Row'], ['del-row', '− Row'], ['add-col', '+ Col'], ['del-col', '− Col']].forEach(function (a) {
            var b = document.createElement('button');
            b.type = 'button';
            b.className = 'alur-table-tool';
            b.setAttribute('data-table-action', a[0]);
            b.textContent = a[1];
            tools.appendChild(b);
        });
        div.appendChild(tools);

        var scroll = document.createElement('div');
        scroll.className = 'alur-table-scroll';
        var table = document.createElement('table');
        table.className = 'alur-table';
        fillTable(table, n);
        scroll.appendChild(table);
        div.appendChild(scroll);

        div.addEventListener('click', function (ev) {
            var btn = ev.target.closest && ev.target.closest('[data-table-action]');
            if (!btn) return;
            ev.preventDefault();
            ev.stopPropagation();
            var action = btn.getAttribute('data-table-action');
            mutateTable(n, action);
            fillTable(table, n);
            if (onChange) onChange(action);
        });

        div.addEventListener('input', function (ev) {
            var cell = ev.target.closest && ev.target.closest('td[data-r], th[data-r]');
            if (!cell) return;
            writeCell(n, cell);
        });

        return { root: div, table: table };
    }

    function drawTableNode(parent, n, selected) {
        var w = n.w || 420;
        var h = n.h || 240;
        var g = kit.g(parent, 'alur-node alur-canvas-node alur-table-node' + (selected ? ' is-selected' : ''));
        g.setAttribute('transform', 'translate(' + (n.x || 0) + ' ' + (n.y || 0) + ')');
        g.setAttribute('data-node-id', n.id);
        if (n.opacity != null) g.setAttribute('opacity', n.opacity);
        var inner = kit.g(g, 'alur-node-inner');
        kit.rect(inner, 0, 0, w, h, 'alur-node-box alur-table-box', {
            rx: 8, fill: '#0c1117', stroke: kit.color(n.color || '#3d4652'), 'stroke-width': 1.2
        });
        var fo = kit.el('foreignObject', {
            x: 0, y: 0, width: Math.max(20, w), height: Math.max(20, h), class: 'alur-table-fo'
        }, inner);
        fo.appendChild(buildTableUI(n, function (action) {
            var svg = parent.ownerSVGElement;
            if (!svg || typeof global.CustomEvent !== 'function') return;
            try {
                svg.dispatchEvent(new global.CustomEvent('alur:table', {
                    bubbles: true,
                    detail: {
                        id: n.id,
                        action: action,
                        columns: (n.columns || []).slice(),
                        rows: (n.rows || []).map(function (r) { return r.slice(); })
                    }
                }));
            } catch (err) {}
        }).root);
        return g;
    }

    function drawNode(parent, n, selected) {
        if (n.shape === 'sticky') {
            return drawStickyNode(parent, n, selected);
        }
        if (n.shape === 'module' && n.module) {
            return drawModuleNode(parent, n, selected);
        }
        if (n.shape === 'chart') {
            return drawChartNode(parent, n, selected);
        }
        if (n.shape === 'table') {
            return drawTableNode(parent, n, selected);
        }
        if (n.shape === 'image' || n.src) {
            var iw = n.w || 160;
            var ih = n.h || 120;
            var ig = kit.g(parent, 'alur-node alur-canvas-node' + (selected ? ' is-selected' : ''));
            ig.setAttribute('transform', 'translate(' + (n.x || 0) + ' ' + (n.y || 0) + ')');
            ig.setAttribute('data-node-id', n.id);
            if (n.opacity != null) ig.setAttribute('opacity', n.opacity);
            var iinner = kit.g(ig, 'alur-node-inner');
            kit.el('image', {
                href: n.src,
                x: 0, y: 0, width: iw, height: ih,
                preserveAspectRatio: 'xMidYMid meet',
                class: 'alur-node-image'
            }, iinner);
            return ig;
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
        /* Hand-drawn: the ink line bows, so the outline is its own rough path and
           the exact element underneath only carries the fill. Architect (amp 0)
           stays a clean vector, like Excalidraw. */
        var sketch = kit.nodeRough(n);
        var g = kit.g(parent, 'alur-node alur-canvas-node' + (selected ? ' is-selected' : ''));
        /* Excalidraw rotates about the element centre, so the frame and the art
           turn together and only the bounding box stays axis-aligned. */
        var nodeT = 'translate(' + (n.x || 0) + ' ' + (n.y || 0) + ')';
        if (n.angle) {
            nodeT += ' rotate(' + n.angle + ' ' + (w / 2) + ' ' + (h / 2) + ')';
        }
        g.setAttribute('transform', nodeT);
        g.setAttribute('data-node-id', n.id);
        if (n.opacity != null) g.setAttribute('opacity', n.opacity);
        var inner = kit.g(g, 'alur-node-inner');

        /* The exact element: fill, plus the stroke only when the line is clean.
           Same geometry as the hit test (nodeBoundaryPoint) so arrows land on
           the edge either way. */
        function ink(attrs) {
            if (sketch) attrs.stroke = 'none';
            else attrs.stroke = color;
            attrs['stroke-width'] = sw;
            attrs['stroke-dasharray'] = dash || null;
            attrs.style = style;
            return attrs;
        }

        if (shape === 'circle') {
            /* A real ellipse: rx and ry come from the node box, so dragging the
               side handles stretches it lengthwise instead of staying a ball. */
            var erx = Math.max(10, w / 2 - 2);
            var ery = Math.max(10, h / 2 - 2);
            kit.el('ellipse', ink({
                cx: w / 2, cy: h / 2, rx: erx, ry: ery,
                class: 'alur-node-box'
            }), inner);
        } else if (shape === 'diamond') {
            var dd = 'M ' + (w / 2) + ' 0 L ' + w + ' ' + (h / 2) +
                ' L ' + (w / 2) + ' ' + h + ' L 0 ' + (h / 2) + ' Z';
            kit.path(inner, dd, 'alur-node-box', ink({}));
        } else if (shape !== 'plain' && shape !== 'none') {
            var rx = shape === 'pill' ? h / 2 : (n.edge === 'round' ? Math.min(14, h / 2) : 0);
            kit.rect(inner, 0, 0, w, h, 'alur-node-box', ink({ rx: rx }));
        }

        if (sketch) {
            /* Rough.js gives the outline, one or two passes (its own multi-stroke
               randomness), and the exact element above keeps the fill. The paths
               are cached, so a pan or a re-render never redraws the ink. */
            sketch.strokes.forEach(function (d) {
                kit.path(inner, d, 'alur-node-rough', {
                    fill: 'none', stroke: color,
                    'stroke-width': Math.max(0.7, sw),
                    'stroke-dasharray': dash || null,
                    'stroke-linecap': 'round', 'stroke-linejoin': 'round'
                });
            });
        }

        var ids = (n.logos && n.logos.length) ? n.logos : (n.logo ? [n.logo] : []);
        var hasLabel = String(n.label || '').trim() !== '' || String(n.sub || '').trim() !== '';
        var size = Math.max(10, Math.min(w, h) * (ids.length > 1 ? 0.24 : 0.34));
        var cx = w / 2;
        var cy = h / 2;
        if (ids.length) {
            var iy = (ids.length === 1 && hasLabel) ? (h * 0.34 - size / 2) : (cy - size / 2);
            if (ids.length > 1) {
                kit.iconRow(inner, ids, cx, iy, size, 2);
            } else {
                kit.icon(inner, ids[0], cx - size / 2, iy, size);
            }
        }

        var align = n.textAlign || (ids.length || shape === 'circle' ? 'center' : 'left');
        var anchor = align === 'center' ? 'middle' : (align === 'right' ? 'end' : 'start');
        var labelX = ids.length || shape === 'circle' ? cx :
            (align === 'center' ? w / 2 : (align === 'right' ? w - 8 : (shape === 'plain' ? 8 : 12)));
        var fontSize = n.fontSize || (shape === 'plain' ? 16 : 13);
        /* Text sits inside the shape, not below it: an ellipse centres its word
           the way Excalidraw does. */
        var labelY = ids.length ? (hasLabel ? Math.min(h - 8, h * 0.7 + fontSize * 0.35) : (h - 8))
            : (shape === 'circle'
                ? Math.min(h - 8, Math.max(h / 2 + fontSize * 0.35, h - 16))
                : (shape === 'plain' ? 20 : 23));
        var lineHeight = Math.max(1, n.lineHeight || 1.35);
        var weight = n.fontWeight || (n.bold ? 700 : 400);
        var fontStyle = n.fontStyle || (n.italic ? 'italic' : 'normal');
        var labelColor = n.color;
        if (!labelColor || labelColor === 'transparent') labelColor = n.isText ? 'inherit' : '#e6edf3';
        var labelAttrs = {
            'text-anchor': anchor,
            'font-size': fontSize,
            'font-family': n.fontFamily || 'Excalifont, sans-serif',
            'font-weight': weight,
            'font-style': fontStyle,
            fill: kit.color(labelColor)
        };
        if (n.textDecoration && n.textDecoration !== 'none') {
            labelAttrs['text-decoration'] = n.textDecoration;
        }
        var label = kit.text(inner, labelX, labelY, '', 'alur-node-label', labelAttrs);
        String(n.label || '').split('\n').forEach(function (line, i) {
            var span = kit.el('tspan', {
                x: labelX,
                y: labelY + i * fontSize * lineHeight
            }, label);
            span.textContent = line;
        });
        if (n.sub) {
            kit.text(inner, labelX, labelY + fontSize * lineHeight + 2, n.sub, 'alur-node-sub', { 'text-anchor': anchor, fill: kit.color(labelColor) });
        }
        return g;
    }

    /* Sticky note: a pad of paper, not a shape. Folded corner, soft drop
       shadow, and text that wraps inside the pad the way a real note does. */
    /* FNV-1a, same as kit.kitSeed: node ids are strings and Rough.js wants a
       uint32 so a note keeps its handwriting across re-renders. */
    function kitSeedLocal(str) {
        var s = String(str);
        var h = 2166136261 >>> 0;
        for (var i = 0; i < s.length; i++) {
            h ^= s.charCodeAt(i);
            h = Math.imul(h, 16777619) >>> 0;
        }
        return h >>> 0;
    }

    function drawStickyNode(parent, n, selected) {
        var w = n.w || 180;
        var h = n.h || 180;
        /* The note's ink is its text colour: outline, fold and type agree, and
           the sticky follows whatever ink the user picked instead of borrowing
           the node stroke colour (which used to leave a blue rim on yellow). */
        var ink = (n.textColor && n.textColor !== 'transparent') ? kit.color(n.textColor) : '#1f2328';
        var fill = (n.fill && n.fill !== 'transparent') ? kit.color(n.fill) : '#ffec99';
        var color = ink;
        var fold = Math.max(12, Math.min(30, Math.min(w, h) * 0.16));
        var g = kit.g(parent, 'alur-node alur-canvas-node alur-sticky-node' +
            (selected ? ' is-selected' : ''));
        g.setAttribute('transform', 'translate(' + (n.x || 0) + ' ' + (n.y || 0) + ')');
        g.setAttribute('data-node-id', n.id);
        if (n.opacity != null) g.setAttribute('opacity', n.opacity);
        var inner = kit.g(g, 'alur-node-inner');

        kit.rect(inner, 2.5, 3.5, w, h, 'alur-sticky-shadow', { rx: 2, fill: 'rgba(15, 23, 42, .30)' });

        var body = 'M 0 0 L ' + w + ' 0 L ' + w + ' ' + (h - fold) +
            ' L ' + (w - fold) + ' ' + h + ' L 0 ' + h + ' Z';
        /* A sticky can be hand-drawn too: the sloppiness control in the panel
           feeds this, so the setting is real rather than decorative. */
        var slop = kit.roughAmount(n.sloppiness);
        var sketch = slop ? kit.roughPath(body,
            typeof kit.nodeSeed(n) === 'string' ? kitSeedLocal(kit.nodeSeed(n)) : kit.nodeSeed(n),
            slop, Number(n.strokeWidth) || 2, w, h) : null;
        kit.path(inner, body, 'alur-node-box alur-sticky', {
            fill: fill, stroke: sketch ? 'none' : color, 'stroke-width': 1.2,
            'stroke-linejoin': 'round'
        });
        if (sketch) {
            sketch.strokes.forEach(function (d) {
                kit.path(inner, d, 'alur-node-rough', {
                    fill: 'none', stroke: color,
                    'stroke-width': Math.max(0.7, Number(n.strokeWidth) || 1.4),
                    'stroke-linejoin': 'round', 'stroke-linecap': 'round'
                });
            });
        }
        /* The dog-ear: a darker triangle where the corner folds up. */
        kit.path(inner, 'M ' + (w - fold) + ' ' + (h - fold) + ' L ' + w + ' ' + (h - fold) +
            ' L ' + (w - fold) + ' ' + h + ' Z', 'alur-sticky-fold', {
            fill: 'rgba(15, 23, 42, .16)', stroke: color, 'stroke-width': 0.9,
            'stroke-linejoin': 'round'
        });

        /* Word wrap to the pad width, then centre the block vertically. */
        var pad = Math.max(10, Math.min(w, h) * 0.1);
        var fontSize = Math.max(11, n.fontSize || 14);
        var lineHeight = Math.max(1.15, n.lineHeight || 1.32);
        var perLine = Math.max(4, Math.floor((w - pad * 2) / (fontSize * 0.54)));
        var lines = [];
        String(n.label || '').split('\n').forEach(function (para) {
            var words = para.split(/\s+/).filter(Boolean);
            if (!words.length) { lines.push(''); return; }
            var line = '';
            words.forEach(function (word) {
                var next = line ? line + ' ' + word : word;
                if (next.length > perLine && line) { lines.push(line); line = word; }
                else line = next;
            });
            if (line) lines.push(line);
        });
        if (!lines.length) lines = [''];
        var blockH = (lines.length - 1) * fontSize * lineHeight;
        var startY = Math.max(pad + fontSize * 0.85, (h - blockH) / 2 + fontSize * 0.35);
        var labelColor = n.textColor || '#1f2328';
        var anchor = 'middle';
        var labelX = w / 2;
        var weight = n.fontWeight || 500;
        var label = kit.text(inner, labelX, startY, '', 'alur-node-label alur-sticky-label', {
            'text-anchor': anchor,
            'font-size': fontSize,
            'font-family': n.fontFamily || 'Excalifont, sans-serif',
            'font-weight': weight,
            fill: kit.color(labelColor)
        });
        lines.forEach(function (line, i) {
            var span = kit.el('tspan', { x: labelX, y: startY + i * fontSize * lineHeight }, label);
            span.textContent = line;
        });
        return g;
    }

    /* A chart template becomes a flat node: the chart is the content, there is
       no card wrapper, and the normal node inspector edits it. */
    function drawChartNode(parent, n, selected) {
        var w = n.w || 440;
        var h = n.h || 300;
        var g = kit.g(parent, 'alur-node alur-canvas-node alur-chart-node' +
            (selected ? ' is-selected' : ''));
        g.setAttribute('transform', 'translate(' + (n.x || 0) + ' ' + (n.y || 0) + ')');
        g.setAttribute('data-node-id', n.id);
        if (n.opacity != null) g.setAttribute('opacity', n.opacity);
        var inner = kit.g(g, 'alur-node-inner');
        /* No card: no panel, no frame, no title bar. The chart is the object.
           A fully transparent rect only carries the pointer so the chart can be
           selected, moved and resized like any other node. */
        kit.rect(inner, 0, 0, w, h, 'alur-node-box alur-chart-box', {
            rx: 8, fill: '#0c1117', stroke: kit.color(n.color || 'blue'),
            'stroke-width': 1.2, 'pointer-events': 'all'
        });
        var fo = kit.el('foreignObject', {
            x: 0, y: 0, width: Math.max(12, w), height: Math.max(12, h),
            'class': 'alur-chart-fo'
        }, inner);
        var div = document.createElementNS('http://www.w3.org/1999/xhtml', 'div');
        div.className = 'alur-module-embed';
        div.setAttribute('data-module', 'chart');
        /* The canvas already paints one grid behind everything. The chart must
           not paint a second, differently scaled grid inside its own box. */
        var chartSpec = Object.assign({}, n.staticSpec || { module: 'chart' }, { grid: false });
        div.setAttribute('data-spec', JSON.stringify(chartSpec));
        fo.appendChild(div);
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

    /* Ujung panah memakai geometri Excalidraw lewat AlurKit.arrowHead, supaya
       bentuknya sama dengan panah tangan di Excalidraw: V terbuka, bukan
       segitiga terisi. "triangle" tetap disediakan untuk yang mau versi penuh.
       Heads come from AlurKit.arrowHead (Excalidraw maths) so the shape matches
       a hand-drawn Excalidraw arrow: an open V, not a filled triangle.
       "triangle" stays available for the filled look. */
    function arrowHeadAt(layer, tip, from, type, color, specIndex) {
        if (!tip || !from || type === 'none') return;
        var el = kit.arrowHead(layer, tip, from, type, color, { width: 2 });
        if (el && specIndex !== undefined) el.setAttribute('data-edge', String(specIndex));
    }

    /* Label at the middle of the cable — Excalidraw's arrow label: the words
       sit on the path, with a knockout box so the line does not run through
       them. The box is measured after the text is placed, so the label stays
       centred on the cable whatever it says. */
    function drawEdgeLabel(layer, pathEl, e, color, index) {
        var mid = null;
        try {
            var half = pathEl.getTotalLength() / 2;
            mid = pathEl.getPointAtLength(half);
        } catch (err) { return null; }
        if (!mid) return null;
        var fs = e.labelSize || 12;
        var lh = Math.max(1, e.labelLineHeight || 1.3);
        var weight = e.labelWeight || 600;
        var lines = String(e.label).split('\n');
        var anchor = e.labelAnchor || 'middle';
        var g = kit.g(layer, 'alur-edge-label');
        g.setAttribute('data-edge', String(index));
        var text = kit.text(g, mid.x, mid.y, '', 'alur-canvas-edge-label', {
            'text-anchor': anchor,
            'font-size': fs,
            'font-weight': weight,
            fill: kit.color(e.labelColor || color)
        });
        var top = -((lines.length - 1) * fs * lh) / 2;
        lines.forEach(function (line, i) {
            var span = kit.el('tspan', {
                x: mid.x,
                y: mid.y + top + i * fs * lh
            }, text);
            span.textContent = line;
        });
        var box = null;
        try { box = text.getBBox(); } catch (err) { return g; }
        if (box && box.width) {
            var padX = 4, padY = 2;
            var plate = kit.rect(g, box.x - padX, box.y - padY,
                box.width + padX * 2, box.height + padY * 2, 'alur-canvas-edge-label-bg', {
                    rx: 3
                });
            plate.style.fill = 'var(--bg, #0d1117)';
            /* The plate must not swallow the click meant for the cable: the
               glyphs and the box both belong to this edge. */
            plate.setAttribute('data-edge', String(index));
            g.insertBefore(plate, text);
        }
        return g;
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

    /* Batas dunia dari seluruh isi scene: node, kabel, dan coretan bebas.
       Dipakai untuk area mask (harus seluas isi) dan untuk membingkai
       diagram di halaman baca. */
    function sceneBounds(nodes, edges, drawings) {
        var x1 = Infinity, y1 = Infinity, x2 = -Infinity, y2 = -Infinity;
        function grow(x, y) {
            if (!isFinite(x) || !isFinite(y)) return;
            if (x < x1) x1 = x;
            if (y < y1) y1 = y;
            if (x > x2) x2 = x;
            if (y > y2) y2 = y;
        }
        function growBox(b) {
            grow(b.x, b.y);
            grow(b.x + b.w, b.y + b.h);
        }

        Object.keys(nodes || {}).forEach(function (id) {
            var n = nodes[id];
            if (!n) return;
            growBox(nodeVisualBounds(n));
        });

        (edges || []).forEach(function (e) {
            if (!e) return;
            if (e.points && e.points.length) {
                e.points.forEach(function (p) { grow(p[0], p[1]); });
                return;
            }
            var ends = edgeEnds(e, nodes || {});
            if (ends) ends.points.forEach(function (p) { grow(p[0], p[1]); });
        });

        /* Path coretan: ambil semua angka sebagai pasangan koordinat. */
        (drawings || []).forEach(function (dr) {
            var nums = String((dr && dr.d) || '').match(/-?\d+(?:\.\d+)?/g);
            if (!nums) return;
            for (var i = 0; i + 1 < nums.length; i += 2) grow(+nums[i], +nums[i + 1]);
        });

        if (!isFinite(x1) || !isFinite(y1)) return { x: 0, y: 0, w: 900, h: 520 };
        if (x2 <= x1) x2 = x1 + 1;
        if (y2 <= y1) y2 = y1 + 1;
        return { x: x1, y: y1, w: x2 - x1, h: y2 - y1 };
    }

    /* Orthogonal routing with rounded corners (Excalidraw's elbow arrow).
       A dogleg through the middle of the longer axis: two nodes side by side
       get a vertical jog, one above the other a horizontal one. */
    function orthoPath(pts, radius) {
        if (!pts || pts.length < 2) return '';
        var r = Math.max(0, Math.min(radius || 12, 40));
        var d = 'M ' + pts[0][0] + ' ' + pts[0][1];
        for (var i = 1; i < pts.length - 1; i++) {
            var p = pts[i];
            var prev = pts[i - 1];
            var next = pts[i + 1];
            var inLen = Math.sqrt(Math.pow(p[0] - prev[0], 2) + Math.pow(p[1] - prev[1], 2));
            var outLen = Math.sqrt(Math.pow(next[0] - p[0], 2) + Math.pow(next[1] - p[1], 2));
            var rr = Math.min(r, inLen / 2, outLen / 2);
            var inUx = inLen ? (p[0] - prev[0]) / inLen : 0;
            var inUy = inLen ? (p[1] - prev[1]) / inLen : 0;
            var outUx = outLen ? (next[0] - p[0]) / outLen : 0;
            var outUy = outLen ? (next[1] - p[1]) / outLen : 0;
            var ax = p[0] - inUx * rr;
            var ay = p[1] - inUy * rr;
            var bx = p[0] + outUx * rr;
            var by = p[1] + outUy * rr;
            d += ' L ' + r1(ax) + ' ' + r1(ay) +
                 ' Q ' + r1(p[0]) + ' ' + r1(p[1]) + ' ' + r1(bx) + ' ' + r1(by);
        }
        var last = pts[pts.length - 1];
        d += ' L ' + last[0] + ' ' + last[1];
        return d;
    }

    function r1(v) { return Math.round(v * 10) / 10; }

    function elbowD(a, b) {
        var dx = b[0] - a[0];
        var dy = b[1] - a[1];
        if (Math.abs(dx) >= Math.abs(dy)) {
            var mx = a[0] + dx / 2;
            return orthoPath([[a[0], a[1]], [mx, a[1]], [mx, b[1]], [b[0], b[1]]], 14);
        }
        var my = a[1] + dy / 2;
        return orthoPath([[a[0], a[1]], [a[0], my], [b[0], my], [b[0], b[1]]], 14);
    }

    function freeEdgePath(e) {
        var pts = e && e.points;
        if (!pts || pts.length < 2) return '';
        /* Dua titik + curved = lengkung yang sama dengan panah terikat node.
           smoothPath butuh 3 titik, jadi tanpa cabang ini panah jadi kaku. */
        if (e.elbow && pts.length === 2) return elbowD(pts[0], pts[1]);
        if (e.elbow) return orthoPath(pts, 14);
        if (e.curved && pts.length === 2) {
            return kit.curve(pts[0][0], pts[0][1], pts[1][0], pts[1][1]);
        }
        if (e.curved) return smoothPath(pts);
        var d = 'M ' + pts[0][0] + ' ' + pts[0][1];
        for (var i = 1; i < pts.length; i++) d += ' L ' + pts[i][0] + ' ' + pts[i][1];
        return d;
    }

    /* Midpoint of the *drawn* path, not of its bounding box: on an elbow the
       cable runs sideways, on a curve the belly is where the handle belongs.
       The path is already in the document when this runs, so the browser can
       measure it; the polyline walk is the fallback when it cannot. */
    function edgeMidPoint(path, pts) {
        if (path && typeof path.getTotalLength === 'function') {
            try {
                var total = path.getTotalLength();
                if (total > 0) {
                    var mp = path.getPointAtLength(total / 2);
                    if (mp) return [mp.x, mp.y];
                }
            } catch (err) { /* detached or zero-length: fall through */ }
        }
        var segs = [];
        var sum = 0;
        for (var i = 1; i < pts.length; i++) {
            var dx = pts[i][0] - pts[i - 1][0];
            var dy = pts[i][1] - pts[i - 1][1];
            var len = Math.sqrt(dx * dx + dy * dy);
            segs.push(len);
            sum += len;
        }
        var target = sum / 2;
        for (var j = 0; j < segs.length; j++) {
            if (target <= segs[j] || j === segs.length - 1) {
                var t = segs[j] ? target / segs[j] : 0;
                return [
                    pts[j][0] + (pts[j + 1][0] - pts[j][0]) * t,
                    pts[j][1] + (pts[j + 1][1] - pts[j][1]) * t
                ];
            }
            target -= segs[j];
        }
        return pts[Math.floor(pts.length / 2)].slice();
    }

    /* Three live handles on the selected arrow: start, middle, end. Each one is
       a <g> so the hit target (14 units) can be far larger than the dot (4.5)
       without a fat dot on screen; draw.html reads data-edge-point off the <g>. */
    function drawEdgeHandles(layer, path, e, ends, i) {
        if (!ends || !ends.points || ends.points.length < 2) return;
        var pts = ends.free
            ? ends.points
            : [ends.points[0], ends.points[ends.points.length - 1]];
        var mid = edgeMidPoint(path, pts);
        var marks = [
            { pt: pts[0], key: '0', cls: '' },
            { pt: mid, key: 'mid', cls: ' is-mid' },
            { pt: pts[pts.length - 1], key: String(pts.length - 1), cls: '' }
        ];
        /* A free arrow with extra bends keeps every bend grabbable, so the
           middle handle is one more point on the same wire. */
        if (ends.free && pts.length > 2) {
            var extra = [];
            for (var k = 1; k < pts.length - 1; k++) {
                if (Math.floor(pts.length / 2) === k) continue;
                extra.push({ pt: pts[k], key: String(k), cls: '' });
            }
            marks = marks.concat(extra);
        }
        marks.forEach(function (mk) {
            var g = kit.g(layer, 'alur-edge-handle' + mk.cls);
            g.setAttribute('transform',
                'translate(' + r1(mk.pt[0]) + ' ' + r1(mk.pt[1]) + ')');
            g.setAttribute('data-edge', String(i));
            g.setAttribute('data-edge-point', mk.key);
            kit.circle(g, 0, 0, 14, 'alur-edge-hit', null);
            var dot = kit.circle(g, 0, 0, 4.5, 'alur-edge-point', null);
            dot.setAttribute('stroke-width', '1.4');
        });
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

    /* A canvas that only holds tables renders as plain article tables: no
       artboard, no dark card, no blue frame — just the table, growing with the
       page when a reader adds rows. */
    function isTableOnly(spec) {
        var ids = Object.keys(spec.nodes || {});
        if (!ids.length) return false;
        if ((spec.edges || []).length || (spec.drawings || []).length) return false;
        return ids.every(function (id) {
            var n = spec.nodes[id];
            return n && n.shape === 'table';
        });
    }

    function mountTableOnly(host, spec) {
        var wrap = document.createElement('div');
        wrap.className = 'alur-tables';

        Object.keys(spec.nodes || {}).forEach(function (id) {
            var n = spec.nodes[id];
            if (!n) return;
            n.id = id;
            var ui = buildTableUI(n, function (action) {
                if (typeof global.CustomEvent !== 'function') return;
                try {
                    wrap.dispatchEvent(new global.CustomEvent('alur:table', {
                        bubbles: true,
                        detail: {
                            id: id,
                            action: action,
                            columns: (n.columns || []).slice(),
                            rows: (n.rows || []).map(function (r) { return r.slice(); })
                        }
                    }));
                } catch (err) {}
            });
            wrap.appendChild(ui.root);
        });

        host.appendChild(wrap);
        return {
            destroy: function () {
                if (wrap.parentNode) wrap.parentNode.removeChild(wrap);
            }
        };
    }

    function mount(host, spec, env) {
        /* The reading page renders a table-only spec as plain article tables.
           In the editor a table-only canvas is still a canvas: nodes must be
           selectable and resizable, so the artboard path is kept. */
        if (!(env && env.editor) && isTableOnly(spec)) return mountTableOnly(host, spec);
        var W = spec.width || 900;
        var H = spec.height || 520;
        var svg = kit.svgRoot(host, { w: W, h: H, label: spec.title || 'Alur canvas' });
        var zoom = Math.max(0.1, Math.min(1, spec.zoom || 1));
        var fit = !env || !env.editor;
        var vb = {
            x: spec.panX || 0,
            y: spec.panY || 0,
            w: W / zoom,
            h: H / zoom
        };
        svg.setAttribute('viewBox', vb.x + ' ' + vb.y + ' ' + vb.w + ' ' + vb.h);
        var palette = (env && env.palette) || kit.palette;
        var speed = spec.speed || 1;
        var stops = [];

        var drawLayer = kit.g(svg, 'alur-layer-draw');
        (spec.drawings || []).forEach(function (dr) {
            var dash = dr.strokeStyle === 'dashed' ? '7 5' :
                (dr.strokeStyle === 'dotted' ? '2 4' : '');
            var p = kit.path(drawLayer, dr.d, 'alur-drawing' + ((editing && spec.selectedDrawing === dr.id) ? ' is-selected' : ''), {
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
        /* Selection is editor state. A saved spec can carry "selected":
           the reading page must not paint a selection box around it. */
        var editing = !!(env && env.editor);
        var selected = editing ? selectedIds(spec) : [];
        var primary = selected.length ? selected[selected.length - 1] : null;

        Object.keys(nodes).forEach(function (id) {
            nodes[id].id = id;
            nodeEls[id] = drawNode(nodeLayer, nodes[id], selected.indexOf(id) >= 0);
        });

        /* Reading page only: shrink table boxes to their content, then frame
           the whole drawing so it fills the column. */
        function fitView() {
            Array.prototype.forEach.call(svg.querySelectorAll('.alur-table-node'), function (g) {
                var wrap = g.querySelector('.alur-table-wrap');
                var fo = g.querySelector('.alur-table-fo');
                var box = g.querySelector('.alur-table-box');
                if (!wrap || !fo) return;
                var tools = wrap.querySelector('.alur-table-tools');
                var table = wrap.querySelector('.alur-table');
                var h = Math.max(90, (tools ? tools.offsetHeight : 0) + (table ? table.offsetHeight : 0) + 2);
                fo.setAttribute('height', h);
                if (box) box.setAttribute('height', h);
            });

            /* Bingkai seluruh isi: node, kabel, arrowhead, dan coretan.
               nodeLayer saja tidak cukup — panah yang menjorok keluar akan
               terpotong oleh tepi viewBox. */
            /* Motion decorations (dots, comets, packets) live at the origin
               until the animation places them on the path. Measuring them
               would blow the frame up to the size of the world, so hide them
               while the content is measured. */
            var motion = svg.querySelectorAll(
                '.alur-dot, .alur-comet, .alur-packet, .alur-relay');
            Array.prototype.forEach.call(motion, function (el) {
                el.style.display = 'none';
            });
            var box = null;
            [drawLayer, edgeLayer, pointLayer, nodeLayer].forEach(function (layer) {
                if (!layer) return;
                var b = null;
                try { b = layer.getBBox(); } catch (err) { return; }
                if (!b || !b.width || !b.height) return;
                if (!box) {
                    box = { x: b.x, y: b.y, w: b.width, h: b.height };
                    return;
                }
                var x1 = Math.min(box.x, b.x);
                var y1 = Math.min(box.y, b.y);
                var x2 = Math.max(box.x + box.w, b.x + b.width);
                var y2 = Math.max(box.y + box.h, b.y + b.height);
                box = { x: x1, y: y1, w: x2 - x1, h: y2 - y1 };
            });
            Array.prototype.forEach.call(motion, function (el) {
                el.style.display = '';
            });
            if (!box || !box.w || !box.h) return;
            var pad = 24;
            svg.setAttribute('viewBox',
                (box.x - pad) + ' ' + (box.y - pad) + ' ' +
                (box.w + pad * 2) + ' ' + (box.h + pad * 2));
        }

        var embeddedModules = [];
        Object.keys(nodes).forEach(function (id) {
            var host = nodes[id];
            if (!host) return;
            if (host.shape !== 'module' && !(host.shape === 'chart' && host.staticSpec)) return;
            if (host.shape === 'module' && !host.module) return;
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

        /* Pembingkaian dilakukan di akhir: kabel & arrowhead harus sudah
           tergambar supaya ikut terhitung. Kalau dibingkai sebelum kabel
           digambar, ujung panah yang keluar dari gugus node terpotong. */

        /* Sembunyikan kabel di dalam node supaya tidak menimpa label/logo.
           Node tetap transparan; hanya bagian kabel yang masuk area node yang
           di-clip oleh mask.
           PENTING: area mask harus mencakup seluruh dunia, bukan cuma
           width/height. Kalau area mask dibatasi 0..W x 0..H, setiap kabel di
           luar kotak itu ikut hitam (invisible) — itulah "arrow ada batas
           canvas". Hitung dari isi scene, lalu beri bantalan besar. */
        var edgeMaskId = 'alur-edge-mask-' + (++uid);
        var maskDefs = kit.el('defs', {}, svg);
        var sceneBox = sceneBounds(nodes, spec.edges || [], spec.drawings || []);
        var maskPad = 4000;
        var maskX = Math.floor(sceneBox.x - maskPad);
        var maskY = Math.floor(sceneBox.y - maskPad);
        var maskW = Math.ceil(sceneBox.w + maskPad * 2);
        var maskH = Math.ceil(sceneBox.h + maskPad * 2);
        var edgeMask = kit.el('mask', {
            id: edgeMaskId, maskUnits: 'userSpaceOnUse',
            x: maskX, y: maskY, width: maskW, height: maskH
        }, maskDefs);
        kit.rect(edgeMask, maskX, maskY, maskW, maskH, '', { fill: '#fff' });
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
        var sel = editing && primary && nodes[primary];
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
                : (e.elbow
                    ? elbowD(ends.points[0], ends.points[1])
                    : kit.curve(ends.points[0][0], ends.points[0][1], ends.points[1][0], ends.points[1][1]));
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
            if (spec.selectedEdge === i) drawEdgeHandles(pointLayer, cable.main, e, ends, i);
            /* Centre label: where the arrow carries a word, that word rides the
               cable. Drawn before the motion layer so packets pass over it. */
            if (e.label && cable.main) drawEdgeLabel(edgeLayer, cable.main, e, color, i);
            if (e.from && e.to && nodeEls[e.to]) {
                stops.push(motions.apply(e.motion || spec.motion || 'flow', edgeLayer, cable,
                    nodeEls[e.to], {
                        color: color,
                        duration: (e.duration || 2600) / speed,
                        count: e.count || 3
                    }));
            }
        });

        if (fit) fitView();

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