# Alur — visual explainer engine

**Alur** renders JSON diagrams in articles and in the playground. It is plain
HTML/CSS/JS with no build step.

- Engine: `js/alur/`
- Styles: `css/alur.css`
- Playground: `preview.html`
- Markdown block: ` ```alur ` (rendered by `js/markdown.js` + `js/read.js`)

## Quick start

```bash
cd imoon07.github.io
python3 -m http.server 8000
# http://localhost:8000/preview.html
```

The playground redraws automatically. It can switch modules, pick templates,
edit the scene, draw a free-form canvas, and insert logos.

## Spec format

```alur
{
  "module": "flow",
  "title": "Request path",
  "cable": "solid",
  "motion": "flow",
  "speed": 1,
  "columns": [["client"], ["proxy"], ["app1", "app2"], ["db"]],
  "nodes": {
    "client": { "label": "Client", "sub": "browser", "color": "blue" },
    "proxy":  { "label": "Proxy",  "sub": "edge",    "color": "cyan" }
  },
  "edges": [
    { "from": "client", "to": "proxy", "label": "TLS" },
    { "from": "proxy", "to": "app1", "cable": "comet", "motion": "comet" }
  ]
}
```

### Flow keys

| Key | Meaning |
| --- | --- |
| `module` | `flow`, or any registered module id. |
| `title` | Accessible SVG name. |
| `columns` | Left-to-right lanes; each lane is an array of node ids. |
| `nodes` | `id -> { label, sub?, color?, logo?, logos?, logoSize?, logoPos? }`. |
| `edges` | `{ from, to, cable?, motion?, color?, label?, duration?, count? }`. |
| `cable` | Default cable style for all edges. |
| `motion` | Default motion for all edges. |
| `speed` | `1` normal, `0.5` half, `2` double. |
| `vertical` | `true` stacks lanes top-to-bottom. |
| `width`, `height` | ViewBox size (default `860 × 440`). |

Colours are palette names (`blue`, `green`, `amber`, `red`, `purple`, `cyan`,
`pink`, `lime`, `slate`, `white`) or any CSS colour.

### Reverse proxy

`module: "reverse-proxy"` draws client → edge → N backends.

| Key | Meaning |
| --- | --- |
| `backends` | `1..8`, default `3`. |
| `nodes` | `client`, `proxy`, `backend1..N`. |
| `speed` | Animation multiplier. |

## Modules

| id | What it renders |
| --- | --- |
| `canvas` | Free-form editor: manual x/y nodes, shapes, drawings, cables. |
| `flow` | Layered nodes with per-edge cable/motion and logos. |
| `reverse-proxy` | One front, many backends. |
| `chart` | 29 chart types. |
| `pipeline` | Ordered stages with moving items. |
| `graph` | Nodes, edges, and an animated BFS frontier. |

Register a new module:

```js
Alur.register({
  id: 'my-module',
  title: 'My module',
  blurb: 'One line.',
  mount: function (host, spec, env) {
    var svg = AlurKit.svgRoot(host, { w: 860, h: 440, label: spec.title });
    // draw with AlurKit / AlurCables / AlurMotions
    return { destroy: function () {} };
  }
});
```

Add `js/alur/modules/<id>.js`, include it in `preview.html` and `read.html`, and
use `"module": "my-module"`.

## Cable styles

| id | Look | Use for |
| --- | --- | --- |
| `solid` | Plain line | Default flow. |
| `dashed` | Static dashes | Boundaries, optional paths. |
| `dotted` | Fine dots | Loose coupling. |
| `dash` | Long dashes | Fast transfer. |
| `double` | Two-layer tube | Pipe/channel. |
| `glow` | Soft glow | Key path. |
| `neon` | Bright core + halo | Hero cable. |
| `ribbon` | Wide translucent band | High-volume flow. |
| `circuit` | 45° PCB trace | Hardware feel. |
| `bundle` | Three parallel cables | Redundant links. |
| `broken` | Static gaps | Severed link. |
| `relay` | Travelling bright segment | Reconnect / putus-nyambung. |
| `pulse` | Thickness pulse | Heartbeat/active link. |
| `beam` | Thick translucent beam | Spotlight/scan. |

```json
{ "from": "client", "to": "proxy", "cable": "neon", "color": "cyan" }
```

`bundle` accepts `colors: [...]` for per-cable colours.

## Motion effects

| id | What moves | Use for |
| --- | --- | --- |
| `flow` | One dot along the cable | Direction. |
| `flowMany` | Several staggered dots | Volume/traffic. |
| `dash` | Dashes march | Clocked data. |
| `draw` | Cable draws then erases | Request being built. |
| `comet` | Light tail along the cable | Highlighted packet. |
| `packets` | Box packets travel | Discrete messages. |
| `relay` | Segments light in turn | Reconnect. |
| `pulse` | Target node scales | Node doing work. |
| `breathe` | Target node opacity breathes | Waiting/idle. |
| `blink` | Target node hard-blinks | Alert/error. |
| `orbit` | Dot orbits target node | Polling/waiting. |
| `grow` | Target node grows from zero | Value appearing. |
| `spin` | Target node rotates | Loader/rotation. |

Node motions target the edge's `to` node; path motions follow the cable.
`prefers-reduced-motion: reduce` disables dots/packets and CSS animation.

## Logos

Logos load directly from GitHub:

```text
https://raw.githubusercontent.com/iMoon07/logo-svg/main/<category>/<file>.svg
```

The site does **not** ship `assets/logos/`. It only loads the generated
`js/logo-manifest.js` (575 entries), which contains the remote base URL. Logo
images need access to `raw.githubusercontent.com`.

```js
AlurLogos.resolve('stack:docker')
// { kind: 'file', href: 'https://raw.githubusercontent.com/iMoon07/logo-svg/main/stack/docker.svg' }
```

Node fields:

| Field | Meaning |
| --- | --- |
| `logo` | One id, e.g. `stack:docker`. |
| `logos` | Several ids, drawn in a row. |
| `logoSize` | Box size in px (default `18`; `13` for a row). |
| `logoPos` | `left`, `right`, `top`, `bottom`. |

Bare unique names (`docker`), sprite ids (`i-si-nginx`), paths and absolute URLs
are also accepted.

### Local logo test

The default is remote GitHub. For an offline/local test, put the logo files at
`imoon07.github.io/assets/logos/` (copy or symlink from
`ai-tools/assets/logos/`) and open:

```text
preview.html?localLogos=1
```

`localLogos=1` only changes the base URL; the manifest is unchanged.

### Regenerate the manifest

The generator lives outside the site:

```bash
python3 /home/moon/Projects/ai-tools/tools/build_logo_manifest.py \
  --site /home/moon/Projects/imoon07.github.io \
  --logo-dir /home/moon/Projects/logo
```

It writes only `js/logo-manifest.js` and always points at the remote GitHub base.

## Canvas editor

`canvas` is the free-form module. Nodes use scene coordinates; nothing is
auto-laid out.

```json
{
  "module": "canvas",
  "grid": true,
  "width": 900,
  "height": 520,
  "zoom": 1,
  "panX": 0,
  "panY": 0,
  "nodes": {
    "n1": {
      "x": 120, "y": 90, "w": 160, "h": 60,
      "shape": "box",
      "label": "Box", "sub": "text", "color": "blue",
      "logo": "stack:docker", "logoSize": 18, "logoPos": "left"
    }
  },
  "edges": [{ "from": "n1", "to": "n2", "cable": "neon", "motion": "comet" }],
  "drawings": [{ "id": "d1", "d": "M 10 10 L 80 40", "color": "#f778ba", "width": 3 }]
}
```

| Field | Meaning |
| --- | --- |
| `x/y`, `w/h` | Node position and size. |
| `shape` | `box`, `pill`, `circle`, `plain`. |
| `edges[]` | Same cable/motion fields as `flow`. |
| `drawings[]` | SVG path `d`, `color`, `width`. |
| `grid` | Dot grid (default `true`). |
| `zoom`, `panX`, `panY` | View transform. |
| `selected` | Node id or array of ids. |
| `selectedEdge`, `selectedDrawing` | Edge index or drawing id. |

### Tools

| Tool | Key | Action |
| --- | --- | --- |
| Select | `V` | Select, move, resize. |
| Box | `B` | Drag to draw a box. |
| Round | `R` | Rounded box. |
| Circle | `O` | Circle. |
| Text | `T` | Text object. |
| Arrow | `A` | Drag node-to-node to connect. |
| Draw | `D` | Freehand stroke. |
| Pan | `H` | Drag to pan; wheel pans; `Ctrl`+wheel zooms. |

### Editing

| Action | How |
| --- | --- |
| Multi-select | `Shift`-click, or marquee on empty canvas. |
| Move group | Drag any selected node. |
| Resize | Drag a handle on the primary selected node. |
| Snap | 8 px grid; hold `Alt` to bypass. |
| Nudge | Arrow keys; `Shift`+arrows = 10 px. |
| Duplicate | `Ctrl+D`. |
| Copy/paste | `Ctrl+C`, `Ctrl+V`. |
| Align | Inspector buttons. |
| Delete | `Delete` / `Backspace`. |
| Undo/redo | `Ctrl+Z`, `Ctrl+Shift+Z` / `Ctrl+Y`. |
| Shortcuts | `?`. |

### Workspace

`preview.html` is a full-viewport editor. Panels float above the canvas and can
be dragged by their header; their positions persist in `localStorage`. On phones
the panels become full-width drawers and the tool rail becomes a bottom bar.

- Top bar: title, counts, panel toggles, focus mode.
- Panels: Properties, Assets (logos), Layers, Scene.
- Command palette: `Ctrl+K`; `/` quick insert.
- Focus mode: `Ctrl+.`; `Esc` exits.
- Minimap follows the viewport.
- The canvas never resizes when a panel opens.

## Chart types

`chart` uses `"type"` plus `labels`/`data` or `series`.

| type | Key fields |
| --- | --- |
| `bar`, `hbar` | `labels`, `data` |
| `line`, `area`, `stackedArea` | `labels`, `series` / `data` |
| `stacked` | `labels`, `series` |
| `donut` | `labels`, `data`, `colors` |
| `gauge` | `data:[v]`, `max`, `unit` |
| `spark` | `data` |
| `kpi` | `data:[v]`, `label`, `delta` |
| `scatter`, `bubble` | `data:[[x,y],…]` / `[[x,y,r],…]` |
| `waterfall` | `labels`, `data` |
| `funnel` | `labels`, `data`, `colors` |
| `bell` | `mean`, `sigma`, `marker` |
| `histogram` | `data`, `bins` |
| `treemap` | `labels`, `data`, `colors` |
| `box` | `boxes:[{label,min,q1,median,q3,max}]` |
| `range` | `items:[{label,from,to}]` |
| `density` | `series` (0..1) |
| `slope` | `items:[{label,before,after}]` |
| `combo` | `labels`, `bars`, `line` |
| `timeline` | `events:[{label,at}]` |
| `dumbbell` | `items:[{label,a,b}]` |
| `quadrant` | `data:[[x,y],…]`, `q1..q4` |
| `process`, `cycle` | `steps:[…]` |
| `progress` | `items:[{label,parts:[{value,color}]}]` |
| `table` | `columns`, `rows` |

Example:

```alur
{
  "module": "chart",
  "type": "donut",
  "title": "Traffic mix",
  "labels": ["Web", "API", "DB"],
  "data": [55, 30, 15],
  "colors": ["blue", "green", "amber"]
}
```

## File layout

```text
imoon07.github.io/
  js/alur/
    core.js            registry, mount, destroy
    kit.js             SVG helpers, palette, paths, logo <image>
    logos.js           remote logo resolver
    cables.js          cable styles + catalog
    motions.js         motion effects + catalog
    modules/           canvas, flow, reverse-proxy, chart, pipeline, graph
  js/logo-manifest.js  generated remote manifest
  css/alur.css
  preview.html
  docs/alur-guide.md
```

Local-only generators live in `/home/moon/Projects/ai-tools/tools/`:

```text
ai-tools/tools/build_logo_manifest.py
ai-tools/tools/build_topology_icons.py
ai-tools/tools/icons/
ai-tools/assets/logos/       local logo checkout copy (not served by the site)
```

## Verification

```bash
node --check js/alur/core.js
node --check js/alur/kit.js
node --check js/alur/cables.js
node --check js/alur/motions.js
node --check js/alur/modules/canvas.js
node --check js/alur/modules/flow.js
node --check js/alur/modules/reverse-proxy.js
node --check js/alur/modules/chart.js
node --check js/alur/modules/pipeline.js
node --check js/alur/modules/graph.js
```

Then check `preview.html` at desktop and phone widths: cables/motions render,
flow has no overlaps, canvas selection/move/resize/undo works, panels fit and
scroll, and the logo grid loads from GitHub.