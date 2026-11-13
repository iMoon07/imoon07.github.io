# Topology Diagram Authoring Guide

` ```topology ` renders a JSON diagram through `js/topology.js` +
`css/topology.css`. It is a static article renderer: no toolbar, no zoom, no
panel. It scales to the article column and stacks on narrow screens.

## Anatomy

```topology
{
  "title": "The Flow",
  "vertical": true,
  "columns": [["C"], ["P"], ["K"], ["G"]],
  "nodes": {
    "C": ["Customer", "Places an order", "customer", "actor", "https://…"],
    "P": ["Waiter", "Takes the order", "waiter", "process"],
    "K": ["Chef", "Prepares the order", "cook", "process", "https://…", "cook"],
    "G": ["Pantry", "Stores ingredients", "warehouse", "store"]
  },
  "edges": [["C", "P", "1"], ["P", "K", "2"], ["K", "G", "3"], ["G", "K", "4", true]],
  "groups": [["Eatery", ["P", "K", "G"], "store"]],
  "legend": { "flow": "Order", "back": "Return" },
  "facilities": ["In this place", ["store", "Eatery"], ["wifi", "Wi-Fi"]]
}
```

Top-level keys:

| Key | Meaning |
| --- | --- |
| `title` | Accessible name (not drawn). |
| `root` | Parent node above every column, wired to the first node of each column. |
| `caption`, `captionHref` | Visible heading above the canvas, optionally linked. |
| `columns` | Left-to-right lanes: `[ids]`, or `{ "nodes": [ids], "grid": 2 \| 3 \| 4 }`. |
| `components` | Shared `id -> [label, icon, href]` registry. |
| `nodes` | `id -> node` (compact array or object). |
| `edges` | `[from, to, badge?, back?]` or an object. |
| `badges` | `false` hides all edge numbers; default `true`. |
| `groups` | Labelled node sets drawn as captions. |
| `legend` | `{ "flow": "…", "back": "…" }`. |
| `facilities` | `[caption, [icon, label], …]`. |
| `vertical` | Force top-to-bottom layout. |
| `dense` | Compact layout for many narrow columns. |

## Nodes

Compact form (preferred):

```json
"C": ["Customer", "Places an order", "customer", "actor", "https://…"]
```

Array positions: `[label, sub, iconOrIcons, kind, href, live]`. Omit trailing
items.

Object form:

```json
"C": {
  "label": "Customer",
  "sub": "Places an order",
  "icon": "customer",
  "kind": "actor",
  "href": "https://…",
  "hidden": false
}
```

| Field | Meaning |
| --- | --- |
| `label` | Main text. Required. |
| `sub` | Optional second line. |
| `icon` | One sprite id without the `i-` prefix. |
| `icons` | Several logos in one node: component keys, sprite ids, `[id, href]` pairs, or `{icon, href, label}`. |
| `kind` | Accent: `actor`, `process`, `store`, `choice`, `out`, `tech`, `host`, `database`, `cloud`, `security`, `network`. |
| `href` | Link; the node becomes an `<a>` (in-page `#anchor` stays in the same tab). |
| `hidden` | Reserve a grid cell without drawing a node. |
| `live` | `true` pulses the icon; `"cook"` stirs it. Use on the active step only. |

Node ids must be unique. Prefer short, stable ids. Every node should have an
`icon` or `icons`.

### Shared components

Declare repeated parts once:

```json
{
  "components": {
    "linux": ["Linux", "si-linux", "https://www.kernel.org/"],
    "apache": ["Apache", "si-apache", "https://httpd.apache.org/"],
    "mysql": ["MySQL", "si-mysql", "https://www.mysql.com/"],
    "php": ["PHP", "si-php", "https://www.php.net/"]
  },
  "nodes": {
    "lamp": ["LAMP", "", ["linux", "apache", "mysql", "php"], "tech", "https://…"]
  }
}
```

A component is `[label, icon, href]`; `icon` may be a list. A key that matches
`components` resolves to that component; any other string stays a sprite id.
Component labels are drawn under the logos as small clickable text.

## Columns and layout

- Columns are left-to-right with a 20 px gap; nodes in a column stack vertically
  with a 12 px gap.
- A column with `"grid": 2`, `3`, or `4` becomes a CSS grid, filled row-major.
- `vertical: true` stacks columns top-to-bottom; forward edges run downward and
  return edges run upward as a parallel cable.
- On narrow screens columns stack; `grid: 3`/`4` becomes `grid: 2`.
- Keep grids at 3–4 columns so the scale stays near `1`.
- Use `dense: true` for many narrow columns with several logos per node.

## Edges

```json
{ "from": "C", "to": "P", "badge": "1", "back": false }
```

- Forward edges are blue with an arrowhead; `back: true` draws a green return.
- A small dot travels along every drawn connection.
- `badges: false` hides all numbers.
- Two or more edges from one source, or into one target, become a **bus**: one
  vertical trunk in the column gap plus one arrowed stub per target. Multi-column
  grids get one trunk per column, fed by a header above the grid.
- Connect neighbouring columns. A skipped column has to cross the skipped nodes.
- Do not reference a missing node; the edge is dropped.
- Cycles need an intentional return path.

## Icons

`js/topology-icons.js` is generated — do not edit by hand. It inlines:

1. **Concept icons** — Lucide stroke icons (`user`, `server`, `database`,
   `shield`, `wifi`, `wrench`, `store`, …).
2. **Profession icons** — roles (`customer`, `waiter`, `chef`, `cook`, `baker`,
   `courier`, `mechanic`, `plumber`, `detective`, `teacher`, `doctor`, …).
3. **Brand icons** — Simple Icons / devicon, referenced as `si-<slug>`
   (`si-javascript`, `si-docker`, `si-postgresql`, `si-laravel`, …).

Use a brand logo for a named product, a profession icon for a human role, and a
concept icon for an abstract component.

Rebuild:

```bash
python3 /home/moon/Projects/ai-tools/tools/build_topology_icons.py
```

The builder reads concept icons from `ai-tools/tools/icons/` and brand logos from
the local logo checkout (`/home/moon/Projects/logo/programming` and `stack`, plus
a small `security` allowlist). It writes
`/home/moon/Projects/imoon07.github.io/js/topology-icons.js`.

Add a concept icon by dropping `ai-tools/tools/icons/<name>.svg`; add a brand by
dropping the SVG in the logo checkout and rerunning. Large files (>60 KB) are
skipped.

## Groups, legend, facilities

```json
"groups": [["Eatery", ["P", "K", "G"], "store"]],
"legend": { "flow": "Order", "back": "Return" },
"facilities": ["In this place", ["store", "Eatery"], ["wifi", "Wi-Fi"]]
```

- `groups` draws an icon + caption above a set; there is no box.
- `legend` renders under the diagram; keys are `flow` and `back`.
- `facilities` renders context chips after the legend.

## Recipes

Linear flow:

```json
"columns": [["A"], ["B"], ["C"]]
```

Choice / fan-out:

```json
"columns": [["Q"], ["A", "B", "C"]]
```

Grid of options:

```json
"columns": [["root"], { "nodes": ["a", "b", "c", "d", "e", "f"], "grid": 3 }, ["app"]]
```

Static grid (no edges, no legend):

```json
{
  "title": "PHP",
  "grid": 4,
  "columns": [["laravel", "symfony", "lamp", "lemp", "wamp", "wimp", "famp", "xampp"]],
  "nodes": {
    "lamp": ["LAMP", "Linux · Apache · MySQL · PHP", ["si-linux", "si-apache", "si-mysql", "si-php"], "tech", "https://…"]
  },
  "groups": [["PHP", ["laravel", "symfony", "lamp", "lemp", "wamp", "wimp", "famp", "xampp"], "si-php"]]
}
```

Return path:

```json
"edges": [["A", "B"], ["B", "A", "", true]]
```

Dense menu: set `"dense": true`, put shared parts in `components`, and reference
them by key in `icons` so each node stays one line.

Root node:

```json
"root": ["Solution Stack", "", "layers", "out", "https://…"]
```

Desktop draws a vertical spine, a horizontal bus, and a drop into each column's
first node. Narrow screens use a left gutter so no wire crosses a node.

## Checklist

- [ ] Every id in `columns`/`edges` exists in `nodes`.
- [ ] Every component key used in `icons` exists in `components`.
- [ ] Every node has an `icon` or `icons`.
- [ ] Component labels link to their own page.
- [ ] In-page `#anchor` links stay in the same tab.
- [ ] Return edges stay parallel to their forward cable on vertical layouts.
- [ ] `root` wires reach the first node of every column without crossing nodes.
- [ ] No duplicate ids, dangling edges, or unintended orphan nodes.
- [ ] A static grid has no `edges`, `legend`, or stray dots.
- [ ] JSON is pretty-printed with 2-space indent.

## Verification

Render through the real pipeline (marked → DOMPurify → `markdown.js` →
`topology.js`) at desktop and phone widths. Check:

- node count and scale are sane,
- no overlapping nodes,
- no path crosses a node,
- `vertical` return cables stay parallel,
- a static grid has no dots or legend.

The old `/tmp/kilo` harness scripts (`gen_harness.py`, `verify.py`,
`measure.py`) are not part of the site; use them only for local regression runs.