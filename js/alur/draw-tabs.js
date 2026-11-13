/* Alur draw tabs: turn ```draw-tabs JSON into a button bar plus one live preview.
   Every tab keeps its own Alur instance; switching tabs never re-renders the
   previous example. */
(function (global) {
    'use strict';

    function parse(raw) {
        try {
            return JSON.parse(raw);
        } catch (err) {
            console.error('[alur-tabs] invalid JSON', err);
            return [];
        }
    }

    function normalize(data) {
        var list = Array.isArray(data) ? data : (data && Array.isArray(data.items) ? data.items : []);
        return list.map(function (item, index) {
            if (!item) return null;
            var spec = item.spec && typeof item.spec === 'object'
                ? item.spec
                : (item.module ? item : null);
            if (!spec) return null;
            return {
                label: String(item.label || item.title || spec.title || 'Example ' + (index + 1)),
                spec: spec
            };
        }).filter(Boolean);
    }

    function makeTab(root, item, index, activate) {
        var id = 'alur-tab-' + (++makeTab.uid);
        var button = document.createElement('button');
        button.type = 'button';
        button.className = 'alur-tab';
        button.setAttribute('role', 'tab');
        button.setAttribute('aria-selected', index === 0 ? 'true' : 'false');
        button.setAttribute('aria-controls', id);
        button.id = id + '-btn';
        button.textContent = item.label;
        button.addEventListener('click', function () { activate(index); });
        button.addEventListener('keydown', function (ev) {
            if (ev.key !== 'ArrowRight' && ev.key !== 'ArrowLeft') return;
            ev.preventDefault();
            var dir = ev.key === 'ArrowRight' ? 1 : -1;
            activate((index + dir + makeTab.count) % makeTab.count, true);
        });
        return button;
    }

    function build(root) {
        var raw = root.getAttribute('data-draw-tabs');
        var items = normalize(parse(raw || ''));
        if (!items.length) {
            root.innerHTML = '<p class="alur-error">No draw examples</p>';
            return;
        }
        if (!global.Alur) {
            root.innerHTML = '<p class="alur-error">Alur engine not loaded</p>';
            return;
        }

        makeTab.count = items.length;
        var bar = document.createElement('div');
        bar.className = 'alur-tabs-bar';
        bar.setAttribute('role', 'tablist');
        bar.setAttribute('aria-label', 'Diagram examples');

        var panels = [];
        var buttons = [];
        var active = 0;

        items.forEach(function (item, index) {
            var panel = document.createElement('div');
            panel.className = 'alur-tab-panel';
            panel.id = 'alur-tab-panel-' + index;
            panel.setAttribute('role', 'tabpanel');
            panel.hidden = index !== 0;

            var holder = document.createElement('div');
            holder.className = 'alur draw';
            holder.setAttribute('data-spec', JSON.stringify(item.spec));
            panel.appendChild(holder);

            var button = makeTab(root, item, index, activate);
            button.setAttribute('aria-controls', panel.id);
            bar.appendChild(button);
            root.appendChild(panel);
            buttons.push(button);
            panels.push({ root: panel, holder: holder });
        });

        root.insertBefore(bar, root.firstChild);

        function activate(index, focus) {
            if (index < 0 || index >= items.length) return;
            active = index;
            buttons.forEach(function (b, i) {
                var on = i === index;
                b.classList.toggle('is-on', on);
                b.setAttribute('aria-selected', on ? 'true' : 'false');
                b.tabIndex = on ? 0 : -1;
            });
            panels.forEach(function (p, i) { p.root.hidden = i !== index; });
            var current = panels[index];
            if (current && !current.holder.__alur) {
                current.holder.setAttribute('data-ready', '1');
                global.Alur.mount(current.holder);
            }
            if (focus) buttons[index].focus();
        }

        buttons.forEach(function (b, i) { b.tabIndex = i === 0 ? 0 : -1; });
        activate(0);
    }

    function init(scope) {
        Array.prototype.forEach.call((scope || document).querySelectorAll('.alur-draw-tabs:not([data-ready])'), function (root) {
            root.setAttribute('data-ready', '1');
            build(root);
        });
    }

    global.AlurDrawTabs = { init: init };
})(window);
