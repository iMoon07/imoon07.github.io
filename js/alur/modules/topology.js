/* Alur module: topology — renderer topologi artikel sebagai blok di dalam kanvas.
   Kenapa ada: sintaks ```topology dan ```draw sebelumnya dipisah. Yang satu
   digambar oleh topology.js (layout otomatis, DOM + SVG), yang lain oleh modul
   Alur (koordinat absolut). Modul ini membungkus topology.js sebagai modul Alur
   biasa, jadi engine-nya satu dan blok ```topology bisa hidup di dalam kanvas
   draw.html tanpa diduplikasi.

   Why: ```topology and ```draw were separate engines. This wraps topology.js as
   an ordinary Alur module, so one engine serves both and a ```topology block can
   live inside the draw.html canvas.

   Spec: sama dengan blok ```topology, plus:
   {
     "module": "topology",
     "grid": true,        // latar grid; false = transparan
     "title": "...",
     "vertical": true,
     "columns": [["A"], ["B"]],
     "nodes": { "A": ["Label", "sub", "icon", "kind", "https://…"] },
     "edges": [["A", "B"], ["B", "A", "", true]]
   }
   Grid memakai CSS (bukan SVG) karena node topology adalah DOM: grid SVG akan
   berada di atas kartu. Grid is CSS, not SVG, because topology nodes are DOM:
   an SVG grid would sit above the cards. */
(function (global) {
    'use strict';

    var GRID_MINOR = 22;
    var GRID_MAJOR = 110;

    function gridStyle(spec) {
        if (spec.grid === false) return '';
        var m = GRID_MINOR + 'px ' + GRID_MINOR + 'px';
        var M = GRID_MAJOR + 'px ' + GRID_MAJOR + 'px';
        var minor = 'linear-gradient(to right, rgba(74,86,104,.34) 1px, transparent 1px), ' +
            'linear-gradient(to bottom, rgba(74,86,104,.34) 1px, transparent 1px)';
        var major = 'linear-gradient(to right, rgba(74,86,104,.5) 1px, transparent 1px), ' +
            'linear-gradient(to bottom, rgba(74,86,104,.5) 1px, transparent 1px)';
        return minor + ', ' + major;
    }

    function gridSize(spec) {
        if (spec.grid === false) return '';
        return GRID_MINOR + 'px ' + GRID_MINOR + 'px, ' +
            GRID_MINOR + 'px ' + GRID_MINOR + 'px, ' +
            GRID_MAJOR + 'px ' + GRID_MAJOR + 'px, ' +
            GRID_MAJOR + 'px ' + GRID_MAJOR + 'px';
    }

    global.Alur.register({
        id: 'topology',
        label: 'Topology',

        mount: function (host, spec, env) {
            var holder = document.createElement('div');
            holder.className = 'alur-topology';
            if (spec.grid !== false) holder.classList.add('is-grid');
            holder.style.backgroundImage = gridStyle(spec);
            holder.style.backgroundSize = gridSize(spec);
            host.appendChild(holder);

            if (!global.Topology || typeof global.Topology.render !== 'function') {
                holder.innerHTML = '<p class="alur-error">Topology engine not loaded</p>';
                return { destroy: function () {} };
            }

            /* spec diberi ke topology apa adanya: module/title/grid adalah
               properti Alur, sisanya (columns/nodes/edges) milik topology.
               Pass the spec through: module/title/grid belong to Alur, the rest
               (columns/nodes/edges) belongs to topology. */
            var el = document.createElement('div');
            holder.appendChild(el);
            try {
                global.Topology.render(el, spec);
            } catch (err) {
                holder.innerHTML = '<p class="alur-error">Render error: ' +
                    String(err && err.message ? err.message : err) + '</p>';
                return { destroy: function () {} };
            }

            return {
                destroy: function () {
                    if (holder.parentNode) holder.parentNode.removeChild(holder);
                }
            };
        }
    });
})(window);