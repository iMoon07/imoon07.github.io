# Alur — visual explainer engine

**Alur** renders JSON diagrams in articles and in the playground. It is plain
HTML/CSS/JS with no build step.

- Engine: `js/alur/`
- Styles: `css/alur.css`
- Playground: `draw.html`
- Markdown block: ` ```draw ` (rendered by `js/markdown.js` + `js/read.js`)
- Tabbed gallery: ` ```draw-tabs ` (buttons switch between live `draw` previews)

## Quick start

```bash
cd imoon07.github.io
python3 -m http.server 8000
# http://localhost:8000/draw.html
```

The playground redraws automatically. It can switch modules, pick templates,
edit the scene, draw a free-form canvas, and insert logos.

## Spec format

```draw
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
    ["client", "proxy", "TLS"],
    ["proxy", "app1", "request", { "cable": "comet", "motion": "comet" }]
  ]
}
```

Edges accept a compact array form: `["from", "to"]`, `["from", "to", "label"]`,
or `["from", "to", "label", { cable, motion, color, ... }]`. The object form
`{ from, to, label, ... }` still works, so old specs keep rendering.

### Tabbed galleries

Use ` ```draw-tabs ` when a page has several chart/module examples. The block
takes an array of `{ label, spec }` objects and renders a button bar; only the
active preview is mounted. The markdown source stays readable, and the docs
and blog templates use the same syntax.

```draw-tabs
[
  { "label": "Bar", "spec": { "module": "chart", "type": "bar", "labels": ["A", "B"], "data": [3, 5] } },
  { "label": "Donut", "spec": { "module": "chart", "type": "donut", "labels": ["A", "B"], "data": [3, 5] } }
]
```

The Scene panel's **Template** menu includes the same examples as the chart
gallery, so the playground and the documentation expose the same catalog.

### Grid and non-grid

Every module gets the same full-page minor/major grid by default. Set
`"grid": false` in a spec to remove it. The Scene panel's **Grid background**
switch toggles the current scene without changing the module, and the setting
is kept when switching between flow, chart, pipeline, graph, canvas, and every
other page. Turning the grid off does not disable the canvas line or arrow
tools; they keep drawing and connecting normally.

### Flow keys

| Key | Meaning |
| --- | --- |
| `module` | `flow`, or any registered module id. |
| `title` | Accessible SVG name. |
| `columns` | Left-to-right lanes; each lane is an array of node ids. |
| `nodes` | `id -> { label, sub?, color?, logo?, logos?, logoSize?, logoPos? }`. |
| `edges` | `["from", "to", "label"?, options?]`, or `{ from, to, cable?, motion?, color?, label?, duration?, count? }`. |
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

Add `js/alur/modules/<id>.js`, include it in `draw.html` and `read.html`, and
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
["client", "proxy", { "cable": "neon", "color": "cyan" }]
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
`js/logo-manifest.js` (587 entries), which contains the remote base URL. Logo
images need access to `raw.githubusercontent.com`.

```js
AlurLogos.resolve('stack:docker')
// { kind: 'file', href: 'https://raw.githubusercontent.com/iMoon07/logo-svg/main/stack/docker.svg' }

AlurLogos.resolve('brand:figma')
// { kind: 'file', href: 'assets/brands/figma.svg' }
```

Common brand marks that are absent from the remote library ship in
`assets/brands/` and use the `brand:<name>` id.

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
draw.html?localLogos=1
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

### Tables

A table is a canvas node with `shape: "table"`. It is where tabular data lives
inside a visual: the same block you get from the **＋ Table** button in
`draw.html`.

```draw
{
  "module": "canvas",
  "title": "Editable table",
  "nodes": {
    "t1": {
      "id": "t1",
      "x": 20, "y": 20, "w": 700, "h": 260,
      "shape": "table",
      "color": "slate",
      "columns": ["Check", "Status", "Owner"],
      "rows": [
        ["TLS terminator", "pass", "edge"],
        ["WAF rules", "review", "sec"],
        ["Backup restore", "pass", "ops"]
      ]
    }
  },
  "edges": []
}
```

| Field | Meaning |
| --- | --- |
| `columns[]` | Header labels. |
| `rows[][]` | Cell text, one array per row. |
| `color` | Frame accent in the editor. |

The block is editable wherever it renders. Readers can type in any cell and use
`+ Row`, `− Row`, `+ Col`, `− Col`; the editor mirrors the same edits back into
`state.spec`, so the scene and the fence never disagree.

When a ` ```draw ` block holds **only** tables (no edges, no drawings), the
reading page drops the artboard and renders plain article tables: no dark card,
no blue frame, no inner scroll. A reader who adds rows makes the table grow with
the page.

```draw
{
  "module": "canvas",
  "grid": false,
  "nodes": {
    "t1": {
      "shape": "table",
      "columns": ["Tool", "Use"],
      "rows": [["Nginx", "edge"], ["Postgres", "data"]]
    }
  }
}
```

### Tools

| Tool | Key | Action |
| --- | --- | --- |
| Select | `V` | Select, move, resize. |
| Box | `B` | Drag to draw a box. |
| Round | `R` | Rounded box. |
| Circle | `O` | Circle. |
| Text | `T` | Text object. |
| Arrow | `A` | Click a source then a target, or drag node-to-node. |
| Line | `L` | Click a source then a target, drag node-to-node, or draw a free line. |
| Draw | `D` | Freehand stroke. |
| Pan | `H` | Drag to pan; wheel pans; `Ctrl`+wheel zooms. |

Edges attach to the visible shape border, including boxes, pills, circles,
diamonds, rounded boxes, and nodes carrying one or more logos. Node-to-node
edges get an arrowhead by default; free arrow strokes get heads at both ends.

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

`draw.html` is a full-viewport editor. Panels float above the canvas and can
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

### Chart gallery

Use the buttons to switch between every chart type. Each preview is the same
spec shown in the playground, so the documentation stays in sync with
`js/alur/modules/chart.js`.

```draw-tabs
[
  {
    "label": "Bar",
    "spec": {
      "module": "chart",
      "type": "bar",
      "title": "Bar",
      "labels": [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May"
      ],
      "data": [
        12,
        18,
        15,
        22,
        28
      ],
      "color": "blue"
    }
  },
  {
    "label": "Horizontal bar ranking",
    "spec": {
      "module": "chart",
      "type": "hbar",
      "title": "Horizontal bar ranking",
      "labels": [
        "Nginx",
        "Postgres",
        "Redis",
        "PHP",
        "Go"
      ],
      "data": [
        42,
        31,
        24,
        18,
        12
      ],
      "color": "cyan"
    }
  },
  {
    "label": "Multi-series line",
    "spec": {
      "module": "chart",
      "type": "line",
      "title": "Multi-series line",
      "labels": [
        "Mon",
        "Tue",
        "Wed",
        "Thu",
        "Fri"
      ],
      "series": [
        {
          "name": "web",
          "data": [
            12,
            18,
            15,
            22,
            28
          ],
          "color": "blue"
        },
        {
          "name": "api",
          "data": [
            8,
            11,
            14,
            12,
            18
          ],
          "color": "green"
        }
      ]
    }
  },
  {
    "label": "Area",
    "spec": {
      "module": "chart",
      "type": "area",
      "title": "Area",
      "labels": [
        "Mon",
        "Tue",
        "Wed",
        "Thu",
        "Fri"
      ],
      "data": [
        8,
        12,
        10,
        16,
        20
      ],
      "color": "cyan"
    }
  },
  {
    "label": "Stacked bar composition",
    "spec": {
      "module": "chart",
      "type": "stacked",
      "title": "Stacked bar composition",
      "labels": [
        "Mon",
        "Tue",
        "Wed",
        "Thu"
      ],
      "series": [
        {
          "name": "web",
          "data": [
            12,
            14,
            10,
            16
          ],
          "color": "blue"
        },
        {
          "name": "api",
          "data": [
            8,
            9,
            12,
            11
          ],
          "color": "green"
        },
        {
          "name": "job",
          "data": [
            5,
            6,
            4,
            7
          ],
          "color": "amber"
        }
      ]
    }
  },
  {
    "label": "Donut percent breakdown",
    "spec": {
      "module": "chart",
      "type": "donut",
      "title": "Donut percent breakdown",
      "labels": [
        "Web",
        "API",
        "DB",
        "Cache"
      ],
      "data": [
        38,
        27,
        21,
        14
      ],
      "colors": [
        "blue",
        "green",
        "amber",
        "purple"
      ],
      "centerLabel": "requests"
    }
  },
  {
    "label": "Single-value percent gauge",
    "spec": {
      "module": "chart",
      "type": "gauge",
      "title": "Single-value percent gauge",
      "data": [
        68
      ],
      "max": 100,
      "unit": "%",
      "label": "cache hit",
      "color": "cyan"
    }
  },
  {
    "label": "Spark line",
    "spec": {
      "module": "chart",
      "type": "spark",
      "title": "Spark line",
      "data": [
        3,
        5,
        4,
        7,
        6,
        9,
        8,
        11
      ],
      "color": "green"
    }
  },
  {
    "label": "KPI callout",
    "spec": {
      "module": "chart",
      "type": "kpi",
      "title": "KPI callout",
      "data": [
        128
      ],
      "label": "requests / sec",
      "delta": "+12.4%"
    }
  },
  {
    "label": "Scatter plot",
    "spec": {
      "module": "chart",
      "type": "scatter",
      "title": "Scatter plot",
      "data": [
        [
          3,
          5
        ],
        [
          5,
          8
        ],
        [
          8,
          7
        ],
        [
          11,
          12
        ],
        [
          14,
          13
        ],
        [
          17,
          18
        ],
        [
          20,
          17
        ]
      ],
      "color": "purple"
    }
  },
  {
    "label": "Waterfall",
    "spec": {
      "module": "chart",
      "type": "waterfall",
      "title": "Waterfall",
      "labels": [
        "Start",
        "Add",
        "Cache",
        "Drop",
        "End"
      ],
      "data": [
        40,
        18,
        12,
        -9,
        21
      ],
      "color": "blue"
    }
  },
  {
    "label": "Funnel conversion",
    "spec": {
      "module": "chart",
      "type": "funnel",
      "title": "Funnel conversion",
      "labels": [
        "Visit",
        "Signup",
        "Active",
        "Paid"
      ],
      "data": [
        100,
        62,
        38,
        17
      ],
      "colors": [
        "blue",
        "cyan",
        "green",
        "amber"
      ]
    }
  },
  {
    "label": "Bell curve with marker",
    "spec": {
      "module": "chart",
      "type": "bell",
      "title": "Bell curve with marker",
      "mean": 0,
      "sigma": 1,
      "marker": 0.6,
      "markerLabel": "p95",
      "color": "blue"
    }
  },
  {
    "label": "Histogram",
    "spec": {
      "module": "chart",
      "type": "histogram",
      "title": "Histogram",
      "bins": 8,
      "data": [
        1,
        2,
        2,
        3,
        3,
        3,
        4,
        4,
        4,
        5,
        5,
        6
      ],
      "color": "cyan"
    }
  },
  {
    "label": "Stacked area trend",
    "spec": {
      "module": "chart",
      "type": "stackedArea",
      "title": "Stacked area trend",
      "labels": [
        "Mon",
        "Tue",
        "Wed",
        "Thu",
        "Fri"
      ],
      "series": [
        {
          "name": "web",
          "data": [
            8,
            10,
            9,
            12,
            14
          ],
          "color": "blue"
        },
        {
          "name": "api",
          "data": [
            5,
            6,
            7,
            6,
            9
          ],
          "color": "green"
        },
        {
          "name": "job",
          "data": [
            3,
            4,
            3,
            5,
            6
          ],
          "color": "amber"
        }
      ]
    }
  },
  {
    "label": "Treemap",
    "spec": {
      "module": "chart",
      "type": "treemap",
      "title": "Treemap",
      "labels": [
        "Web",
        "API",
        "DB",
        "Cache",
        "Queue"
      ],
      "data": [
        38,
        27,
        18,
        11,
        6
      ],
      "colors": [
        "blue",
        "green",
        "amber",
        "purple",
        "pink"
      ]
    }
  },
  {
    "label": "Box plot",
    "spec": {
      "module": "chart",
      "type": "box",
      "title": "Box plot",
      "boxes": [
        {
          "label": "Web",
          "min": 2,
          "q1": 5,
          "median": 8,
          "q3": 11,
          "max": 14
        },
        {
          "label": "API",
          "min": 3,
          "q1": 6,
          "median": 9,
          "q3": 12,
          "max": 16
        },
        {
          "label": "DB",
          "min": 1,
          "q1": 4,
          "median": 7,
          "q3": 10,
          "max": 13
        }
      ]
    }
  },
  {
    "label": "Range bar with thresholds",
    "spec": {
      "module": "chart",
      "type": "range",
      "title": "Range bar with thresholds",
      "items": [
        {
          "label": "p50",
          "from": 20,
          "to": 60
        },
        {
          "label": "p95",
          "from": 70,
          "to": 140
        },
        {
          "label": "p99",
          "from": 150,
          "to": 260
        }
      ],
      "color": "amber"
    }
  },
  {
    "label": "Density curve",
    "spec": {
      "module": "chart",
      "type": "density",
      "title": "Density curve",
      "series": [
        {
          "name": "web",
          "data": [
            0.05,
            0.2,
            0.6,
            0.9,
            0.6,
            0.2,
            0.05
          ],
          "color": "blue"
        },
        {
          "name": "api",
          "data": [
            0.1,
            0.3,
            0.5,
            0.7,
            0.5,
            0.3,
            0.1
          ],
          "color": "amber"
        }
      ]
    }
  },
  {
    "label": "Slope chart",
    "spec": {
      "module": "chart",
      "type": "slope",
      "title": "Slope chart",
      "items": [
        {
          "label": "Web",
          "before": 20,
          "after": 48
        },
        {
          "label": "API",
          "before": 35,
          "after": 28
        },
        {
          "label": "DB",
          "before": 12,
          "after": 26
        }
      ],
      "color": "cyan"
    }
  },
  {
    "label": "Two-axis combo",
    "spec": {
      "module": "chart",
      "type": "combo",
      "title": "Two-axis combo",
      "labels": [
        "Mon",
        "Tue",
        "Wed",
        "Thu",
        "Fri"
      ],
      "bars": [
        120,
        140,
        130,
        160,
        180
      ],
      "line": [
        3,
        4,
        3.5,
        5,
        6
      ],
      "color": "blue"
    }
  },
  {
    "label": "Annotated timeline",
    "spec": {
      "module": "chart",
      "type": "timeline",
      "title": "Annotated timeline",
      "events": [
        {
          "label": "deploy",
          "at": 0.1
        },
        {
          "label": "cache warm",
          "at": 0.35
        },
        {
          "label": "peak",
          "at": 0.6
        },
        {
          "label": "rollback drill",
          "at": 0.85
        }
      ],
      "color": "green"
    }
  },
  {
    "label": "Bubble chart",
    "spec": {
      "module": "chart",
      "type": "bubble",
      "title": "Bubble chart",
      "data": [
        [
          3,
          4,
          2
        ],
        [
          5,
          7,
          4
        ],
        [
          8,
          6,
          3
        ],
        [
          11,
          9,
          5
        ],
        [
          14,
          12,
          6
        ],
        [
          17,
          11,
          4
        ]
      ],
      "color": "purple"
    }
  },
  {
    "label": "Dumbbell plot",
    "spec": {
      "module": "chart",
      "type": "dumbbell",
      "title": "Dumbbell plot",
      "items": [
        {
          "label": "Web",
          "a": 20,
          "b": 48
        },
        {
          "label": "API",
          "a": 35,
          "b": 28
        },
        {
          "label": "DB",
          "a": 12,
          "b": 26
        }
      ]
    }
  },
  {
    "label": "Quadrant matrix",
    "spec": {
      "module": "chart",
      "type": "quadrant",
      "title": "Quadrant matrix",
      "q1": "scale",
      "q2": "invest",
      "q3": "fix",
      "q4": "watch",
      "data": [
        [
          2,
          8
        ],
        [
          5,
          6
        ],
        [
          7,
          3
        ],
        [
          9,
          7
        ],
        [
          4,
          4
        ]
      ],
      "color": "cyan"
    }
  },
  {
    "label": "Process flow steps",
    "spec": {
      "module": "chart",
      "type": "process",
      "title": "Process flow steps",
      "steps": [
        "plan",
        "build",
        "test",
        "ship"
      ],
      "color": "green"
    }
  },
  {
    "label": "Cycle loop stages",
    "spec": {
      "module": "chart",
      "type": "cycle",
      "title": "Cycle loop stages",
      "steps": [
        "plan",
        "build",
        "test",
        "ship"
      ],
      "color": "purple"
    }
  },
  {
    "label": "Progress bar stack",
    "spec": {
      "module": "chart",
      "type": "progress",
      "title": "Progress bar stack",
      "items": [
        {
          "label": "Web",
          "parts": [
            {
              "value": 60,
              "color": "blue"
            },
            {
              "value": 25,
              "color": "green"
            },
            {
              "value": 15,
              "color": "amber"
            }
          ]
        },
        {
          "label": "API",
          "parts": [
            {
              "value": 40,
              "color": "cyan"
            },
            {
              "value": 35,
              "color": "purple"
            },
            {
              "value": 25,
              "color": "pink"
            }
          ]
        }
      ]
    }
  },
  {
    "label": "Comparison table",
    "spec": {
      "module": "chart",
      "type": "table",
      "title": "Comparison table",
      "columns": [
        "Tool",
        "Speed",
        "Cost",
        "Use"
      ],
      "rows": [
        [
          "Nginx",
          "fast",
          "low",
          "edge"
        ],
        [
          "Postgres",
          "medium",
          "medium",
          "data"
        ],
        [
          "Redis",
          "fast",
          "high",
          "cache"
        ]
      ]
    }
  }
]
```

Example:

```draw
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
    draw-tabs.js       button gallery for multiple draw specs
    modules/           canvas, flow, reverse-proxy, chart, pipeline, graph
  js/logo-manifest.js  generated remote manifest
  css/alur.css
  draw.html
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
node --check js/alur/draw-tabs.js
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

Then check `draw.html` at desktop and phone widths: cables/motions render,
flow has no overlaps, canvas selection/move/resize/undo works, panels fit and
scroll, and the logo grid loads from GitHub.