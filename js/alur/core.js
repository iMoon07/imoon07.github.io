/* Alur — visual explainer engine (sandbox build).
   Registry + mount + lifecycle. No framework, no build step.

   Setiap modul visual mendaftarkan diri lewat Alur.register({...}).
   Every visual module registers itself through Alur.register({...}).

   Modul menerima (host, spec, env) dan mengembalikan objek dengan
   destroy() opsional. A module receives (host, spec, env) and returns an
   object with an optional destroy(). */
(function (global) {
    'use strict';

    var registry = new Map();
    var live = new Set();
    var reduceQuery = global.matchMedia ? global.matchMedia('(prefers-reduced-motion: reduce)') : null;

    function reduced() {
        return !!(reduceQuery && reduceQuery.matches);
    }

    function register(def) {
        if (!def || !def.id) throw new Error('[alur] module needs an id');
        registry.set(def.id, def);
        return def;
    }

    function get(id) {
        return registry.get(id);
    }

    function list() {
        return Array.from(registry.values());
    }

    function parseSpec(el) {
        var raw = el.getAttribute('data-spec');
        if (!raw) return {};
        try {
            return JSON.parse(raw);
        } catch (err) {
            console.error('[alur] invalid JSON spec', err);
            return {};
        }
    }

    function makeHost(el) {
        var host = document.createElement('div');
        host.className = 'alur-host';
        el.appendChild(host);
        return host;
    }

    var CAPTIONS = {
        flow: 'How to read: left → right. Each column is a layer; arrows are requests, and the return path is the response.',
        'reverse-proxy': 'How to read: client → proxy → backends. The proxy terminates TLS and routes each request.',
        pipeline: 'How to read: stages run in order; each stage passes its output to the next.',
        graph: 'How to read: nodes are points and edges are links; the highlighted node is the active frontier.',
        chart: 'How to read: each mark is one value and the axis shows scale. Hover or tap a mark for its label and value.',
        canvas: 'How to read: boxes are components and arrows are flow. Drag a node to rearrange.'
    };

    function isMonthLabels(labels) {
        return !!(labels && labels.length && /^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i.test(String(labels[0])));
    }

    function chartCaption(spec) {
        var type = spec.type || 'bar';
        var cat = isMonthLabels(spec.labels) ? 'month' : 'category';
        var unit = spec.unit ? ' (' + spec.unit + ')' : '';
        if (type === 'bar') {
            return 'How to read: the vertical axis on the left is the scale; the faint horizontal lines are the scale marks; the axis along the bottom is the ' + cat +
                '. Each bar is one ' + cat + unit + '; a taller bar means a larger value. The number on top is the exact value. Hover or tap a bar for details.';
        }
        if (type === 'hbar') {
            return 'How to read: the horizontal axis is the scale; the faint vertical lines are the scale marks; the list on the left is the ' + cat +
                '. Each bar is one item' + unit + '; a longer bar means a larger value. The number at the end is the exact value.';
        }
        if (type === 'line' || type === 'area' || type === 'spark') {
            return 'How to read: the vertical axis on the left is the scale; the faint horizontal lines are the scale marks; the axis along the bottom is the ' + cat +
                '. Each dot is one value; the line connects the dots. A higher dot means a larger value. Hover or tap a dot for the exact value.';
        }
        if (type === 'stacked') {
            return 'How to read: each column is one ' + cat + '; each colored segment is a series. The total height is the sum of the segments. Hover or tap a segment for its value.';
        }
        if (type === 'donut') {
            return 'How to read: the circle is the whole (100%). Each slice is one category; the legend names the slices. Hover or tap a slice for its value and percent.';
        }
        if (type === 'gauge') {
            return 'How to read: the arc is the scale; the filled part is the value. The number in the center is the current value.';
        }
        if (type === 'scatter') {
            return 'How to read: each dot is one observation. The horizontal axis is x; the vertical axis is y. Hover or tap a dot for its values.';
        }
        if (type === 'waterfall') {
            return 'How to read: each bar is a step; its height is the change. Bars above the line are gains; bars below are losses. The last bar is the total.';
        }
        if (type === 'funnel') {
            return 'How to read: each band is a stage. The width is the count; a narrower band means fewer items remain.';
        }
        if (type === 'box') {
            return 'How to read: each box is a range. The line inside is the median; the whiskers reach the minimum and maximum.';
        }
        if (type === 'histogram') {
            return 'How to read: each bar is a bin; the height is the count of values in that bin.';
        }
        if (type === 'treemap') {
            return 'How to read: each rectangle is one value; the area is proportional to the value.';
        }
        if (type === 'stackedArea') {
            return 'How to read: each colored band is a series; the total height is the sum of the bands.';
        }
        if (type === 'range') {
            return 'How to read: each bar spans a range; the end caps are the minimum and maximum.';
        }
        if (type === 'dumbbell') {
            return 'How to read: each line connects two values; the dots at the ends are the two values.';
        }
        if (type === 'quadrant') {
            return 'How to read: the two lines split the chart into four quadrants; each dot is one item.';
        }
        if (type === 'slope') {
            return 'How to read: each line connects two points; the slope shows the change between them.';
        }
        if (type === 'timeline') {
            return 'How to read: the horizontal line is time; the markers are events.';
        }
        if (type === 'process') {
            return 'How to read: each box is a step; the arrows show the order.';
        }
        if (type === 'cycle') {
            return 'How to read: each node is a step; the arrows show the cycle.';
        }
        if (type === 'table') {
            return 'How to read: each row is a record; each column is a field.';
        }
        if (type === 'progress') {
            return 'How to read: each bar is a percentage; the filled part is the value.';
        }
        if (type === 'kpi') {
            return 'How to read: the big number is the value; the label says what it measures.';
        }
        return CAPTIONS.chart;
    }

    function captionText(spec) {
        if (spec.caption) return spec.caption;
        if (spec.note) return spec.note;
        if (spec.module === 'chart') return chartCaption(spec);
        return CAPTIONS[spec.module] || '';
    }

    function mount(el) {
        var spec = parseSpec(el);
        var id = el.getAttribute('data-module') || spec.module;
        var def = registry.get(id);
        if (!def) {
            el.innerHTML = '<p class="alur-error">Unknown module: ' + String(id) + '</p>';
            return null;
        }
        var host = makeHost(el);
        var env = {
            reduced: reduced(),
            palette: global.AlurKit ? global.AlurKit.palette : null,
            kit: global.AlurKit,
            cables: global.AlurCables,
            motions: global.AlurMotions
        };
        var inst;
        try {
            inst = def.mount(host, spec, env);
        } catch (err) {
            console.error('[alur] mount failed for ' + id, err);
            host.innerHTML = '<p class="alur-error">Render error: ' + String(err.message || err) + '</p>';
            return null;
        }
        /* Every module gets the same full-page grid unless the spec opts out.
           The canvas editor used to own this; now it is a shared layer. */
        if (spec.grid !== false && global.AlurKit && global.AlurKit.grid) {
            var svg = host.querySelector('svg');
            if (svg) global.AlurKit.grid(svg);
        }
        var record = { el: el, host: host, def: def, inst: inst || {}, spec: spec };
        var caption = captionText(spec);
        if (caption) {
            var capEl = document.createElement('div');
            capEl.className = 'alur-caption';
            capEl.textContent = caption;
            host.appendChild(capEl);
        }
        if (spec.title) el.setAttribute('data-title', spec.title);
        else el.removeAttribute('data-title');
        el.__alur = record;
        live.add(record);
        return record;
    }

    function destroy(record) {
        if (!record) return;
        try {
            if (record.inst && typeof record.inst.destroy === 'function') record.inst.destroy();
        } catch (err) {
            console.error('[alur] destroy failed', err);
        }
        record.el.removeAttribute('data-ready');
        if (record.host && record.host.parentNode) record.host.parentNode.removeChild(record.host);
        live.delete(record);
    }

    function init(root) {
        var scope = root || document;
        Array.prototype.forEach.call(scope.querySelectorAll('.alur:not([data-ready])'), function (el) {
            el.setAttribute('data-ready', '1');
            mount(el);
        });
    }

    function refresh() {
        /* Snapshot dulu: mount() menambah record baru ke live, dan forEach
           yang sama akan mengunjunginya tanpa henti. Snapshot avoids that. */
        Array.from(live).forEach(function (record) {
            destroy(record);
            mount(record.el);
        });
    }

    /* Re-render every live instance (used by the playground). */
    function renderAll() {
        refresh();
    }

    global.Alur = {
        register: register,
        get: get,
        list: list,
        mount: mount,
        destroy: destroy,
        init: init,
        refresh: refresh,
        renderAll: renderAll,
        reduced: reduced,
        instances: function () { return Array.from(live); }
    };
})(window);