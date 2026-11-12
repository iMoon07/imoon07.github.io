# Topology Diagram Authoring Guide

This guide explains how to write a ` ```topology ` block for the static topology
renderer used by articles (`js/topology.js` + `css/topology.css`).

The renderer is intentionally small: no panel, no toolbar, no zoom. Motion is limited
to optional flow dots and a pulsing/stirring icon on `live` nodes; both stop under
`prefers-reduced-motion`.
A diagram sits at the article column width, scales down to fit, and stacks
vertically on narrow screens. Everything is driven by one JSON spec.

---

## 1. Anatomy of a diagram

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

The long object form still works and is useful when a node needs fields the
array cannot express (for example `hidden`). Prefer the compact form for dense
grids.

Top-level keys:

| Key | Required | Meaning |
| --- | --- | --- |
| `title` | no | Accessible name for the diagram (not drawn). |
| `root` | no | Optional parent node drawn above every column, wired down to the first node of each column (see §7.8). |
| `caption` | no | Visible heading above the canvas; pair with `captionHref` to link it. |
| `captionHref` | no | Link target for `caption`. |
| `columns` | yes | Left-to-right columns; `[ids]` or `{ "nodes": [ids], "grid"?: 2 \| 3 \| 4 }`. |
| `components` | no | Shared component registry: `id -> [label, icon, href]` (icon may be a list). Nodes reference these by key instead of repeating every logo and link. |
| `nodes` | yes | Map of `id -> node` (object or compact array). Every id used in `columns` or `edges` must exist. |
| `edges` | no | `[from, to, badge?, back?]` or `{ "from", "to", "badge"?, "back"? }`. |
| `badges` | no | `false` hides every edge number for the diagram; default `true`. |
| `groups` | no | Labelled node sets, drawn as a caption (no box). |
| `legend` | no | Direction key rendered under the diagram: `{ "flow": "Order", "back": "Return" }`. |
| `facilities` | no | `[label, [icon, label], …]`. |
| `vertical` | no | `true` forces the top-to-bottom layout on every viewport. |
| `dense` | no | `true` compacts the diagram for many narrow columns (small nodes, tight gaps, component logos). |

---

## 2. Nodes

Compact form (preferred for grids):

```json
"C": ["Customer", "Places an order", "customer", "actor", "https://en.wikipedia.org/wiki/Web_browser"],
"K": ["Chef", "Prepares the order", "cook", "process", "https://en.wikipedia.org/wiki/Runtime_system", "cook"]
```

Array positions: `[label, sub, iconOrIcons, kind, href, live]`. Omit trailing
items you do not need.

Object form (use when you need `hidden` or prefer named fields):

```json
"C": {
  "label": "Customer",
  "sub": "Places an order",
  "icon": "customer",
  "kind": "actor",
  "href": "https://en.wikipedia.org/wiki/Web_browser",
  "hidden": false
}
```

| Field | Meaning |
| --- | --- |
| `label` | Main text. Required. |
| `sub` | Optional second line (smaller, muted). |
| `icon` | One sprite id without the `i-` prefix. See §5. |
| `icons` | Several logos shown together inside one node. Entries are component keys from `components`, sprite ids, `[id, href]` pairs, or `{icon, href, label}`. A component key resolves to its logo **and** its text label: the label is drawn as a small clickable line under the logos, so names like Linux, Apache, MySQL and PHP are readable and clickable even when the node is narrow. |
| `kind` | Accent colour: `actor`, `process`, `store`, `choice`, `out`, `tech`, `host`, `database`, `cloud`, `security`, `network`. |
| `href` | Optional link; the node becomes an `<a>` that opens in a new tab (an in-page `#anchor` stays in the same tab). |
| `hidden` | `true` reserves a grid cell without drawing a node. Use it only to keep a grid row aligned. |
| `live` | Optional motion: `true` pulses the icon; `"cook"` also stirs it like a cooking pot. Use sparingly, on the active step only. |

Rules:

- Node ids are arbitrary strings, but must be unique within one diagram.
- Prefer short, stable ids (`mean`, `laravel`, `promgraf`) over long ones.
- `sub` is optional; omit it for dense grids to keep rows short.
- Every node should have an `icon`. A node without one renders a blank square.

### 2.1 Shared components (the short syntax)

A stack diagram repeats the same parts across many nodes: Linux, Apache, MySQL
and PHP appear in LAMP, LEMP, WAMP, WIMP and FAMP; MongoDB, Express, Angular and
Node.js appear in MEAN, MERN and MEVN. Instead of repeating every logo and link,
declare each part once in `components` and let nodes reference the key:

```json
{
  "components": {
    "linux": ["Linux", "si-linux", "https://www.kernel.org/"],
    "apache": ["Apache", "si-apache", "https://httpd.apache.org/"],
    "mysql": ["MySQL", "si-mysql", "https://www.mysql.com/"],
    "php": ["PHP", "si-php", "https://www.php.net/"]
  },
  "nodes": {
    "lamp": ["LAMP", "", ["linux", "apache", "mysql", "php"], "tech", "https://en.wikipedia.org/wiki/LAMP_(software_bundle)"],
    "lemp": ["LEMP", "", ["linux", "nginx", "mysql", "php"], "tech", "https://…"]
  }
}
```

Rules:

- A component is `[label, icon, href]`; `icon` may be a list for a component
  with several marks (e.g. `["si-microsoft", "si-azure"]`).
- An icon string that matches a `components` key resolves to the component; any
  other string stays a sprite id, so old diagrams keep working unchanged.
- `[id, href]` pairs and `{icon, href, label}` objects are still accepted.
- The component label is drawn under the logos as a small clickable line, so the
  text names (Linux, Apache, PHP, MariaDB/MySQL, Manager, Indexer, Dashboard…)
  are readable and clickable, not only the marks.
- A label equal to the node label is not repeated (e.g. the `php` node's own
  "PHP" part is hidden).
- The node's own `href` still links the card/label; component links are separate.

---

## 3. Columns, grids, and layout

- Columns are laid out left-to-right with a 20px gap.
- A column is a vertical flex stack by default (`gap: 12px`).
- A column with `"grid": 2`, `3`, or `4` becomes a CSS grid; its nodes fill the
  grid row-major (left-to-right, top-to-bottom).
- The whole canvas scales down with `zoom` to fit the article column, so a wider
  diagram is not clipped; it is just smaller. Keep grids at 3–4 columns so the
  scale stays near `1`.
- On narrow screens (below 600px) every column stacks vertically and a `grid: 3`
  or `grid: 4` becomes `grid: 2`.
- `"vertical": true` forces the top-to-bottom layout on every viewport: columns
  stack, forward edges run downward, and return edges climb as a parallel cable
  beside the forward one (a blocked return falls back to the right gutter). It
  does **not** force narrow mode, so a `grid: 3` column keeps its three columns
  on a wide screen. Use it for short linear flows (3–5 steps) whose horizontal
  edges would be too short to read.

Choose the column count by width, not by height:

- 1–3 columns: best for flows and small comparisons.
- A `grid: 2`, `3`, or `4` column: best for a list of many similar items
  (stacks, tools, options). A `grid: 4` column of eight nodes is two short rows
  and fills the article width without scaling.

---

## 4. Edges and routing

### 4.1 Basic edges

```json
{ "from": "C", "to": "P", "badge": "1" }
```

- Forward edges are blue with an arrowhead at the target.
- `back: true` draws a solid green return edge with an arrowhead, routed below
  the nodes on desktop.
- `badge` draws a small outlined number at the middle of the edge. Set the
  top-level `"badges": false` to hide all numbers for a cleaner look; the
  edges themselves are unchanged.
- A small dot travels along every forward and return edge to show direction.
  Its colour matches the edge (blue forward, green back), its speed scales with
  the path length, and it fades in and out at the ends so it never looks like a
  stray mark. Every drawn connection is animated, including bus trunks, header
  buses, and drop wires.

### 4.2 Fan-out and fan-in

When one node has **two or more** outgoing edges, or one node has two or more
incoming edges, the renderer replaces the individual curves with a **bus**:

- A vertical trunk runs in the gap next to the target column.
- Each target gets its own horizontal stub with an arrowhead.
- For a multi-column grid, there is **one trunk per column**, fed by a header
  above the grid. This keeps later columns connected without lines crossing
  earlier nodes.

This is automatic. You do not need to do anything special; just make sure the
targets are in the same grid column (or the same visual column).

### 4.3 Return paths

Use `back: true` for responses, results, or "return to caller" flows. The green
colour matches the `back` legend entry.

Return edges are routed orthogonally: they leave the source's side, drop through
the column gap, run below the lowest node, and enter the target's side. They
never pass through a node stacked under the source, and the canvas reserves
bottom padding for them.

With `"vertical": true` (and on narrow screens) a return edge between two
neighbouring nodes in the same column runs as a **parallel cable**: it leaves
the source's top edge, climbs straight beside the forward cable, and enters the
target's bottom edge, so the response reads as a second cable going up. If
another node sits between the two, the edge uses a shared gutter on the right
instead. A badge, when enabled, is placed beside the cable, never on top of it,
so the line never cuts through the number.

### 4.4 Adjacent columns

A forward edge should connect **neighbouring columns**. An edge that skips a
column (for example `browser -> web` when `cdn`/`cache` sit between them) has to
cross the skipped column's nodes. Restructure the spec so each hop is adjacent
(`browser -> cdn -> web`), or accept the crossing.

### 4.5 What not to do

- Do not draw an edge to a node that does not exist — it is silently dropped.
- Do not rely on edge order for meaning; the renderer groups by source/target.
- Do not create cycles unless the return path is intentional (`back`).

---

## 5. Icons

Three families are inlined in `js/topology-icons.js` (generated — do not edit):

1. **Concept icons** — Lucide stroke icons, e.g. `user`, `server`, `database`,
   `shield`, `wifi`, `wrench`, `store`, `chef-hat`.
2. **Profession icons** — real role marks for people/agents, e.g. `customer`,
   `waiter`, `chef`, `cook`, `baker`, `barista`, `cashier`, `courier`,
   `mechanic`, `plumber`, `electrician`, `farmer`, `fisher`, `guard`,
   `detective`, `hacker`, `criminal`, `teacher`, `student`, `doctor`, `nurse`.
3. **Brand icons** — Simple Icons / devicon logos, referenced as `si-<slug>`,
   e.g. `si-javascript`, `si-docker`, `si-postgresql`, `si-laravel`,
   `si-elasticsearch`.

Use a brand logo for a named product; use a profession icon for a human role;
use a concept icon for an abstract component.

A node can carry several logos at once with `icons` (compact form: third array
item). This is the right choice for acronym stacks whose name is made of
components rather than one product, for example
`["si-linux", "si-apache", "si-mysql", "si-php"]` for LAMP. The logos stack in a
row above the label; keep it to two to four icons.

Give a logo its own link with the pair form `[id, href]`:

```json
"lamp": ["LAMP", "", [
  ["si-linux", "https://www.kernel.org/"],
  ["si-apache", "https://httpd.apache.org/"],
  ["si-mysql", "https://www.mysql.com/"],
  ["si-php", "https://www.php.net/"]
], "tech", "https://cloud.google.com/mysql/lamp"]
```

Every logo becomes a separate anchor; the label still links to the node `href`.
Keep the `href` on each logo pointing at that component's own page, not at the
stack's landing page.

To add one:

```bash
# concept: drop a Lucide SVG in tools/icons/<name>.svg
# brand:   drop the SVG in ../logo/programming/<slug>.svg or ../logo/stack/<slug>.svg
python3 tools/build_topology_icons.py     # rebuilds js/topology-icons.js
```

Brand logos are discovered automatically from `programming/` and `stack/` in the
logo repo — no script edit is needed. A small allowlist (`BRAND_EXTRA`) also
pulls selected logos from the large `security/` folder — currently `wazuh` —
exposed the same way as `si-<slug>`. A few files use a different public name
than their filename (`aws` → `si-amazonwebservices`, `gcp` → `si-googlecloud`,
`java` → `si-openjdk`); that is the only mapping kept in the script. Files larger
than 60 KB are skipped to keep the sprite small.

Internal `<defs>`/`<use>` ids are namespaced per symbol, so logos with gradients
or clip paths do not collide with each other.

After rebuilding, check the sprite size and that the new ids appear:

```bash
python3 - <<'PY'
import re
t=open('js/topology-icons.js').read()
print(sorted(set(re.findall(r'<symbol id="([^"]+)"', t)))[:10])
PY
```

---

## 6. Groups, legend, and facilities

### Groups

```json
"groups": [["Eatery / Single Location", ["P", "K", "G"], "store"]]
```

A group renders a small icon + caption above its nodes. There is no box, so use
groups sparingly and only when the label adds meaning.

### Legend

```json
"legend": { "flow": "Order / request", "back": "Return / response" }
```

Keys must be `flow` or `back`. The legend is rendered under the diagram.

### Facilities

```json
"facilities": ["In this place", ["store", "Eatery"], ["wifi", "Wi-Fi"]]
```

The first item is the caption; each following pair is one chip. Chips are
rendered under the diagram, after the legend. Use them for "what else is here"
context (tools, rooms, services) that is not part of the flow.

---

## 7. Recipes

### 7.1 Linear flow

Three or four single-node columns:

```json
"columns": [["A"], ["B"], ["C"]]
```

### 7.2 Choice / fan-out

One source, many targets in one column:

```json
"columns": [["Q"], ["A", "B", "C"]]
```

The renderer draws one trunk and one arrowed stub per target.

### 7.3 Grid of options

Many similar items in a grid:

```json
"columns": [["root"], { "nodes": ["a", "b", "c", "d", "e", "f"], "grid": 3 }, ["app"]]
```

`root -> a..f` and `a..f -> app` are both buses. Use `grid: 2` for ≤ 20 items,
`grid: 3` for more, to keep the diagram from becoming too tall.

### 7.4 Static grid (no edges)

A category of similar items needs no flow at all. Drop `root`, `app`, `edges`,
and `legend`, and let a `group` name the set:

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

A static grid has no dots and no legend: there is no direction to explain.

### 7.5 Return path

```json
"edges": [["A", "B"], ["B", "A", "", true]]
```

### 7.6 Grouped diagram

Use `groups` for a caption over a set, and `facilities` for surrounding context.

### 7.7 Dense menu

A single diagram that lists many categories at once: one column per language,
the language on top, its stacks below. `"dense": true` shrinks the nodes, lays
the language rows out one per line on narrow screens, and keeps several
component logos per stack visible.

```json
{
  "root": ["Solution Stack", "", "layers", "out", "https://en.wikipedia.org/wiki/Solution_stack"],
  "title": "Solution Stack",
  "dense": true,
  "components": {
    "javascript": ["JavaScript", "si-javascript", "https://developer.mozilla.org/en-US/docs/Web/JavaScript"],
    "typescript": ["TypeScript", "si-typescript", "https://www.typescriptlang.org/"],
    "linux": ["Linux", "si-linux", "https://www.kernel.org/"],
    "apache": ["Apache", "si-apache", "https://httpd.apache.org/"],
    "mysql": ["MySQL", "si-mysql", "https://www.mysql.com/"],
    "php": ["PHP", "si-php", "https://www.php.net/"]
  },
  "columns": [
    ["js", "mean", "mern"],
    ["php", "laravel", "lamp"]
  ],
  "nodes": {
    "js": ["JS / TS", "", ["javascript", "typescript"], "out", "https://en.wikipedia.org/wiki/JavaScript"],
    "mean": ["MEAN", "", ["mongodb", "express", "angular", "nodejs"], "tech", "https://…"],
    "lamp": ["LAMP", "", ["linux", "apache", "mysql", "php"], "tech", "https://…"]
  }
}
```

Keep the language labels short (one or two words): the whole diagram is about
nine columns wide, so a long label widens every column. Put the shared parts in
`components` and reference the keys in `icons`; each node then stays one line and
the same Linux/Apache/MySQL/PHP set is written once instead of five times. Each
component's label is rendered as clickable text under the logos, so the names
stay readable on a narrow node.

### 7.8 Root node and wires

`root` draws one parent node above every column and wires it to the first node
of each column:

- Desktop: a vertical spine from the root, one horizontal bus, then a short
  drop into each column's first node.
- Narrow: the bus drops down a left gutter and enters each language row, so the
  wire never crosses a node.

Use it when every column is a child of one concept (`Solution Stack` above the
languages). The first node of each column is the child; put the language there
and the stacks below it. A `root` node takes the same compact array as any other
node (`[label, sub, iconOrIcons, kind, href, live]`).

---

## 8. Checklist before committing

- [ ] Every id in `columns`/`edges` exists in `nodes`.
- [ ] Every component key used in `icons` exists in `components`, and every component icon resolves in the sprite.
- [ ] Every node has an `icon` or `icons`, and every icon id resolves in the sprite.
- [ ] Every multi-logo node either has no `href` (logos are decorative) or gives each logo its own `[id, href]` or component key; no logo is left unclickable when the node is a `div`.
- [ ] Component text labels are present and link to their own page (e.g. Grafana to grafana.com, not Prometheus).
- [ ] An in-page `#anchor` link stays in the same tab (no `target="_blank"`).
- [ ] A vertical flow with `back` edges keeps each return cable parallel to its forward cable (upward); a blocked return uses the shared right gutter. Edge numbers are either meaningful or hidden with `"badges": false`.
- [ ] If `root` is set, its wires reach the first node of every column and no wire crosses a node on mobile.
- [ ] No duplicate node ids and no duplicate labels that would confuse readers.
- [ ] No dangling edges (a `from`/`to` that does not exist).
- [ ] No orphan nodes (a node with no edge, unless it is intentionally a legend chip).
- [ ] A static grid has no `edges`, `legend`, or stray dots.
- [ ] The diagram matches the surrounding prose (same order, same roles).
- [ ] The JSON is pretty-printed (2-space indent), not minified.
- [ ] Run the verification harness (see §9).

---

## 9. Verification

A headless-Chromium harness renders the article with the real pipeline
(marked → DOMPurify → markdown.js → topology.js) and reports node counts,
overlaps, and scale per diagram.

```bash
cd /tmp/kilo
python3 gen_harness.py en      # or id / ms / tl
python3 verify.py              # all languages, desktop + mobile
```

`verify.py` prints `OK` when the expected diagram count is present
(`topo == 3` for the server-single-tier-stack article: flow, combined stack
menu, platform), `mermaid == 0`, and there are no overlapping nodes in any
block. A non-zero overlap or a missing diagram means the spec or the layout
regressed.

For a single block, `python3 measure.py <blockIndex>` prints canvas size, scale,
and per-node rects. Use it to check that bus trunks stay in the gaps and that no
path crosses a node.