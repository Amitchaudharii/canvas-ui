# Topology Canvas

A high-performance, canvas-based network topology viewer built with Next.js and plain JavaScript. Designed to handle 100k+ elements (routers, bridges, connections) with smooth pan, zoom, and per-element JS selector access.

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Project Structure](#project-structure)
3. [File Reference](#file-reference)
   - [Config & Root](#config--root)
   - [Library — Pure Logic](#library--pure-logic)
   - [Library — Renderer](#library--renderer)
   - [Hook](#hook)
   - [Components](#components)
   - [App Router](#app-router)
4. [Architecture Overview](#architecture-overview)
5. [Data Flow](#data-flow)
6. [Backend Contract](#backend-contract)
7. [Connection Direction System](#connection-direction-system)
8. [JS Selector API](#js-selector-api)
9. [Scaling Guide](#scaling-guide)
10. [Adding a New Element Type](#adding-a-new-element-type)

---

## Quick Start

```bash
npm install
npm run dev
# → http://localhost:3000
```

---

## Project Structure

```
nextjs-topology-js/
├── package.json
├── next.config.js
├── jsconfig.json
├── .eslintrc.json
├── .gitignore
│
└── src/
    ├── lib/
    │   └── topology/
    │       ├── registry.js
    │       ├── factory.js
    │       ├── layout.js
    │       ├── mock.js
    │       └── renderer/
    │           ├── draw.js
    │           ├── viewport.js
    │           └── engine.js
    │
    ├── hooks/
    │   └── useTopology.js
    │
    ├── components/
    │   └── topology/
    │       ├── TopologyCanvas.jsx
    │       ├── TopologyPage.jsx
    │       ├── hud/
    │       │   └── index.jsx
    │       └── panels/
    │           └── InfoPanel.jsx
    │
    └── app/
        ├── globals.css
        ├── layout.jsx
        ├── page.jsx
        └── api/
            └── topology/
                └── route.js
```

---

## File Reference

### Config & Root

#### `package.json`

Declares the project dependencies — Next.js 14, React 18, no TypeScript. Run `npm install` from this file's directory.

#### `next.config.js`

Minimal Next.js configuration. Enables React strict mode. No custom webpack or image domains needed.

#### `jsconfig.json`

Enables the `@/` import alias so files can import as `@/lib/topology/...` instead of relative `../../` paths. Required for all internal imports to resolve correctly.

#### `.eslintrc.json`

Linting rules using Next.js core web vitals preset. Catches common React mistakes such as missing keys, invalid hooks usage, and missing dependencies.

#### `.gitignore`

Excludes `node_modules`, `.next` build output, `.env` files, and OS artifacts from version control.

---

### Library — Pure Logic

These files contain no React, no DOM, and no canvas API. They can be tested in Node.js directly.

---

#### `src/lib/topology/registry.js`

**What it does:** The querySelector engine for canvas elements. Makes every element independently addressable from JavaScript exactly like the DOM.

**How it works:** Maintains four internal indexes updated on every `register` call:

| Index      | Key            | Use                                        |
| ---------- | -------------- | ------------------------------------------ |
| `_byId`    | element id     | `getElementById('router-0-0')`             |
| `_byType`  | element type   | `querySelectorAll('bridge')`               |
| `_byClass` | className      | `querySelector('.router')`                 |
| `_byAttr`  | meta key=value | `querySelectorAll('[type=router-router]')` |

**Supported selectors:**

```js
registry.getElementById("router-0-0");
registry.querySelector("#router-0-0");
registry.querySelector(".connection-line");
registry.querySelectorAll("bridge");
registry.querySelectorAll("[connectionId=conn-bridge-0-0-0]");
registry.querySelectorAll("router, bridge"); // multi-selector
```

**Bulk helpers:**

```js
registry.applyStyle("bridge", { strokeColor: "#fa0" });
registry.applyState("connection-line", { visible: false });
```

---

#### `src/lib/topology/factory.js`

**What it does:** Converts raw backend JSON config objects into runtime elements with all defaults applied.

**Functions:**

| Function                     | Input            | Output           |
| ---------------------------- | ---------------- | ---------------- |
| `createRouter(cfg)`          | RouterConfig     | RouterElement    |
| `createBridge(cfg)`          | BridgeConfig     | BridgeElement    |
| `createConnectionLines(cfg)` | ConnectionConfig | ConnectionLine[] |

`createConnectionLines` is the key function. It explodes one connection config with `lineCount: N` into N individual elements, each with its own id, registry entry, and perpendicular offset from the bundle centre.

**Example — a connection with `lineCount: 3`:**

```
"conn-bridge-0-0-0-line-0"  offset: -3.5
"conn-bridge-0-0-0-line-1"  offset:  0      ← centre line
"conn-bridge-0-0-0-line-2"  offset:  3.5
```

Each line is its own independently selectable, styleable, hoverable element.

---

#### `src/lib/topology/layout.js`

**What it does:** Pure position math for placing elements when the backend does not supply coordinates.

**Functions:**

| Function                                     | Purpose                                                           |
| -------------------------------------------- | ----------------------------------------------------------------- |
| `bridgePositionsAround(center, count, opts)` | Returns N evenly-spaced positions in a circle around a router     |
| `computeBBox(elements)`                      | Returns the axis-aligned bounding box of all element positions    |
| `applyGridLayout(routers, opts)`             | Assigns x/y to routers in a grid — preserves existing coordinates |
| `nudgeOverlaps(bridges, minDist)`            | Iterative overlap resolution for dense bridge clusters            |

---

#### `src/lib/topology/mock.js`

**What it does:** Generates deterministic fake topology data for development and testing.

**Key detail:** Uses a seeded LCG (linear congruential generator) instead of `Math.random()`. The same seed always produces the same layout, which prevents hydration mismatches between server-rendered HTML and the client canvas.

**Usage:**

```js
import { generateMockConfig } from "@/lib/topology/mock.js";

const config = generateMockConfig({ rows: 3, cols: 3, seed: 42 });
// Returns { routers: [...], bridges: [...], connections: [...] }
```

**Replace this** with a real database query or `fetch()` call in `page.jsx` and `route.js` when connecting to a backend.

---

### Library — Renderer

These files interact with the Canvas 2D API. Still no React.

---

#### `src/lib/topology/renderer/viewport.js`

**What it does:** Owns all pan, zoom, and coordinate transform math. Completely unaware of React or the canvas element itself.

**Key methods:**

| Method                     | Purpose                                                            |
| -------------------------- | ------------------------------------------------------------------ |
| `setSize(w, h)`            | Tell the viewport the canvas dimensions for centering calculations |
| `toWorld(sx, sy)`          | Convert a screen pixel (mouse position) to a world coordinate      |
| `toScreen(wx, wy)`         | Convert a world coordinate back to a screen pixel                  |
| `zoomAt(factor, cx, cy)`   | Zoom toward a focal point — used by wheel and pinch                |
| `fitToBBox(bbox, padding)` | Scale and centre the viewport to fit a bounding box                |
| `pan(dx, dy)`              | Translate the viewport by a screen-space delta                     |
| `reset()`                  | Return to zoom 1, pan 0,0                                          |
| `apply(ctx)`               | Apply the current transform to a canvas context                    |

---

#### `src/lib/topology/renderer/draw.js`

**What it does:** Pure stateless canvas draw functions and hit test functions — one per element type. No class instances, no side effects. Easy to replace or extend.

**Draw functions:**

| Function                                | Draws                                           |
| --------------------------------------- | ----------------------------------------------- |
| `drawRouter(ctx, el)`                   | Double-ring octagon with label                  |
| `drawBridge(ctx, el)`                   | Rounded rectangle with label                    |
| `drawConnectionLine(ctx, el, from, to)` | Single line with proportionally-sized arrowhead |
| `drawGrid(ctx, w, h, panX, panY, zoom)` | Subtle dot-grid background                      |

**Arrow sizing rule** — the arrowhead length and width scale with the line's rendered `strokeWidth` so thin lines get thin arrows and thick (selected) lines get larger arrows:

```js
const AL = rs(style, "arrowLength", 3 + lw * 3);
const AW = rs(style, "arrowWidth", Math.PI / 7);
```

**Arrowhead color** always matches the line color exactly — both use the same resolved `stroke` variable, so they look like one continuous object.

**Hit test functions:**

| Function                                                           | Tests                                                  |
| ------------------------------------------------------------------ | ------------------------------------------------------ |
| `hitTestRouter(el, wx, wy)`                                        | Circular radius test                                   |
| `hitTestBridge(el, wx, wy)`                                        | Axis-aligned bounding box test                         |
| `hitTestConnectionLine(fromPos, toPos, offset, wx, wy, threshold)` | Line-segment distance test on the offset line position |

**Hit threshold** is derived from the line width — passed in from the engine at test time:

```js
const threshold = lw / 2 + 2; // 1px line → 2.5px zone, 3px line → 3.5px zone
```

---

#### `src/lib/topology/renderer/engine.js`

**What it does:** The core orchestrator. Framework-agnostic — no React imports. Owns everything that happens between config loading and pixels on screen.

**Responsibilities:**

| Area           | Detail                                                                                 |
| -------------- | -------------------------------------------------------------------------------------- |
| Registry       | Creates and owns the `ElementRegistry` instance                                        |
| Viewport       | Creates and owns the `ViewportManager` instance                                        |
| Render loop    | `requestAnimationFrame` with dirty flag — only redraws when state changes              |
| Config loading | Calls `createConnectionLines` to explode each connection into individual line elements |
| Draw order     | Connections (back) → bridges → routers (front)                                         |
| Hit testing    | Reverse draw order so topmost element wins                                             |
| Selection      | Tracks one selected element, sets `state.selected`                                     |
| Hover          | Tracks one hovered element, sets `state.hovered`                                       |
| Event bus      | `on(event, handler)` — returns an unsubscribe function                                 |

**Events emitted:**

| Event        | Payload                 |
| ------------ | ----------------------- |
| `'select'`   | `{ element, previous }` |
| `'hover'`    | `{ element }`           |
| `'loaded'`   | `{ count }`             |
| `'viewport'` | `{ zoom, panX, panY }`  |

**Singleton:** The `ENGINE` constant exported at the bottom is the single instance shared by `useTopology`, `TopologyPage`, and `window.TopologyAPI`. There is only ever one engine per app.

---

### Hook

#### `src/hooks/useTopology.js`

**What it does:** The bridge between React and the engine. Manages the full lifecycle of the canvas from React's perspective.

**Steps it performs in order:**

1. **Mount** — on first render, sets canvas dimensions and calls `ENGINE.mount(canvas)`
2. **Subscribe** — registers listeners for `select`, `hover`, `viewport`, `loaded` events and maps them to React state (`useState`)
3. **Resize** — attaches a `ResizeObserver` to the canvas element so `ENGINE.resize()` is called automatically when the container changes size
4. **Config** — calls `ENGINE.loadConfig(config)` whenever the `config` prop changes
5. **Events** — wires all mouse events (`mousedown`, `mousemove`, `mouseup`, `wheel`) and touch events (`touchstart`, `touchmove`, `touchend`) to the engine's interaction handlers
6. **Cursor** — sets `canvas.style.cursor` to `pointer` when hovering an element, `grab` otherwise

**Returns:**

```js
const { canvasRef, engine, selected, hovered, zoomPct, elemCount, isReady } =
  useTopology({ config, onSelect, onHover });
```

---

### Components

#### `src/components/topology/TopologyCanvas.jsx`

**What it does:** The root canvas component. Renders the `<canvas>` element and positions the four UI overlays on top of it.

**Intentionally thin** — contains no business logic. All logic lives in the engine and hook. The component is a composition layer only.

**Renders:**

- `<canvas>` — fills the container, managed by `useTopology`
- `<HUD>` — top-left stats strip
- `<Controls>` — bottom-right zoom buttons
- `<ArrowLegend>` — bottom-center direction color key
- `<InfoPanel>` — top-right element detail drawer

---

#### `src/components/topology/TopologyPage.jsx`

**What it does:** The client-side page root. Manages config state and grid controls, and exposes `window.TopologyAPI`.

**Grid controls:** A centered top bar with ROWS and COLS spinners (range 1–20). Clicking APPLY or pressing Enter fetches `/api/topology?rows=N&cols=N` and updates the canvas. Uses `useTransition` so the previous frame stays visible during the fetch.

**`window.TopologyAPI`** is registered here on mount and gives external scripts full access to the system:

```js
window.TopologyAPI = {
  getElementById,
  querySelector,
  querySelectorAll,
  applyStyle,
  applyState,
  select,
  clearSelection,
  fitToScreen,
  markDirty,
  setGrid,
  reload,
  engine,
  registry,
};
```

---

#### `src/components/topology/hud/index.jsx`

**What it does:** Three fixed-position overlay components that show status and controls.

| Component     | Position      | Purpose                                                                                  |
| ------------- | ------------- | ---------------------------------------------------------------------------------------- |
| `HUD`         | Top-left      | Two pills — total element count, and the id/type of whatever is hovered or selected      |
| `Controls`    | Bottom-right  | Four buttons: zoom in, zoom out, fit to screen, reset view. Plus a zoom percentage label |
| `ArrowLegend` | Bottom-center | Color key for the three arrow directions                                                 |

All three are `pointer-events: none` except the control buttons.

---

#### `src/components/topology/panels/InfoPanel.jsx`

**What it does:** A detail drawer that appears top-right when an element is selected. Shows different properties per element type.

| Type              | Properties shown                                                                   |
| ----------------- | ---------------------------------------------------------------------------------- |
| `router`          | id, label, x, y, radius, all meta keys                                             |
| `bridge`          | id, label, routerId, x, y, radius, all meta keys                                   |
| `connection-line` | id, connectionId, from, to, direction (color-coded), lineIndex / lineTotal, offset |

Closes when the user clicks × or clicks empty canvas space.

---

### App Router

#### `src/app/globals.css`

**What it does:** Global styles applied to the entire app.

Defines CSS variables (`--bg`, `--accent`, `--font-mono`), resets margins and box-sizing, disables mobile browser pinch-zoom on the canvas (the canvas has its own), and styles scrollbars for any future scrollable panels.

---

#### `src/app/layout.jsx`

**What it does:** The root HTML shell for the Next.js App Router.

Sets the page `<title>` and description via the `metadata` export. Disables browser-level `user-scalable` zoom since the canvas manages its own zoom. Imports `globals.css`.

---

#### `src/app/page.jsx`

**What it does:** Server Component — the entry point that runs on the server before any client code executes.

Calls `generateMockConfig({ rows: 3, cols: 3 })` on the server and passes the result to `TopologyPage` as `initialConfig`. Because this runs server-side, the canvas data is embedded in the initial HTML response — the topology appears immediately with no client-side loading state.

**To connect a real backend**, replace the mock call:

```js
// Replace this:
const config = generateMockConfig({ rows: 3, cols: 3 });

// With this:
const res = await fetch(`${process.env.API_BASE_URL}/topology`);
const config = await res.json();
```

---

#### `src/app/api/topology/route.js`

**What it does:** The API endpoint `GET /api/topology`. Called by `TopologyPage` every time the user changes the grid size.

Accepts `rows` and `cols` as query parameters (both capped at 20 for safety). Returns a JSON object in the `{ routers, bridges, connections }` shape with appropriate cache headers.

**To connect a real backend**, replace the mock generator:

```js
// Replace this:
const config = generateMockConfig({ rows, cols });

// With Prisma:
const [routers, bridges, connections] = await Promise.all([
  prisma.router.findMany(),
  prisma.bridge.findMany(),
  prisma.connection.findMany(),
]);
return NextResponse.json({ routers, bridges, connections });
```

---

## Architecture Overview

The system is split into 10 layers. Each layer only depends on layers below it.

```
window.TopologyAPI          ← external JS surface
    │
TopologyPage.jsx            ← config state, grid controls
    │
TopologyCanvas.jsx          ← canvas element + UI overlays
    │
useTopology.js              ← React ↔ engine bridge
    │
TopologyEngine              ← orchestrator (render loop, hit test, events)
    ├── ElementRegistry     ← querySelector / getElementById
    ├── ViewportManager     ← pan / zoom / transforms
    └── draw.js             ← pure canvas draw functions
         │
         factory.js         ← config → runtime elements
         layout.js          ← position math
```

**Key design decision:** The engine has zero React imports. It is a plain JavaScript class that could run in a Web Worker, a test runner, or a different framework without any changes. React hooks and `window.TopologyAPI` are wrappers around it, not part of it.

---

## Data Flow

### Initial page load

```
Browser requests /
  → page.jsx runs on server
  → generateMockConfig({ rows: 3, cols: 3 })
  → TopologyPage receives initialConfig
  → useTopology calls ENGINE.loadConfig(config)
  → ENGINE explodes connections into individual lines
  → rAF loop begins, canvas renders
```

### User changes grid

```
User changes ROWS to 5, clicks APPLY
  → TopologyPage calls applyGrid(5, 3)
  → fetch('/api/topology?rows=5&cols=3')
  → route.js generates config for 5×3
  → response arrives, setConfig(newConfig)
  → useTopology detects config change, calls ENGINE.loadConfig
  → canvas re-renders with new topology
```

### User hovers a line

```
Mouse moves over canvas
  → useTopology forwards MouseEvent to ENGINE.onMouseMove
  → engine calls viewport.toWorld(x, y)
  → engine runs _hitTest in reverse draw order
  → hitTestConnectionLine checks distance to that specific offset line
  → threshold = lw/2 + 2  (tight to line width)
  → ENGINE sets hovered element, emits 'hover' event
  → useTopology setState → HUD re-renders with element id
  → engine marks dirty → next rAF draws hover glow
```

---

## Backend Contract

Your server must return one JSON object with this shape:

```json
{
  "routers": [
    {
      "id": "router-0-0",
      "label": "0-0",
      "x": 200,
      "y": 160,
      "radius": 46,
      "meta": { "status": "active" }
    }
  ],
  "bridges": [
    {
      "id": "bridge-0-0-0",
      "label": "V",
      "x": 200,
      "y": 52,
      "routerId": "router-0-0",
      "radius": 18,
      "meta": {}
    }
  ],
  "connections": [
    {
      "id": "conn-bridge-0-0-0",
      "fromId": "router-0-0",
      "toId": "bridge-0-0-0",
      "direction": "from",
      "lineCount": 3,
      "meta": { "type": "router-bridge" }
    }
  ]
}
```

All fields except `id`, `x`, `y`, and `routerId` (for bridges) are optional. The frontend fills in defaults.

---

## Connection Direction System

| `direction` value | Arrow drawn       | Color            |
| ----------------- | ----------------- | ---------------- |
| `"from"`          | → toward `toId`   | Blue `#64c8ff`   |
| `"to"`            | ← toward `fromId` | Orange `#ff8c42` |
| `"bidirectional"` | ↔ both ends       | Green `#aaffcc`  |

Each individual line within a `lineCount` bundle inherits the direction from its parent connection. Arrow size scales with line width — a 1px line gets a 6px arrow, a 3px selected line gets a 12px arrow.

---

## JS Selector API

`window.TopologyAPI` is available in the browser console or any external script after the page loads.

### Selecting elements

```js
// By id
TopologyAPI.getElementById("router-0-0");

// By type
TopologyAPI.querySelectorAll("router");
TopologyAPI.querySelectorAll("bridge");
TopologyAPI.querySelectorAll("connection-line");

// By id shorthand
TopologyAPI.querySelector("#router-1-1");

// By meta attribute
TopologyAPI.querySelectorAll("[type=router-router]");
TopologyAPI.querySelectorAll("[connectionId=conn-bridge-0-0-0]");

// Multi-selector
TopologyAPI.querySelectorAll("router, bridge");
```

### Styling elements

After any manual style change, call `markDirty()` to trigger a repaint.

```js
// Single element
const r = TopologyAPI.getElementById("router-0-0");
r.style.fillColor = "#001a2e";
r.style.strokeColor = "#00ff88";
r.style.glowColor = "#00ff88";
TopologyAPI.markDirty();

// Bulk — all bridges
TopologyAPI.applyStyle("bridge", { strokeColor: "#fa0", labelColor: "#fa0" });

// Bulk — specific connection lines
TopologyAPI.applyStyle("[connectionId=conn-bridge-0-0-0]", {
  strokeColor: "#f00",
});

// Bulk — by meta attribute
TopologyAPI.applyStyle("[type=router-router]", {
  strokeColor: "#0ff",
  alpha: 1,
});
```

### Available style properties

| Property      | Type     | Effect                        |
| ------------- | -------- | ----------------------------- |
| `fillColor`   | string   | Element background color      |
| `strokeColor` | string   | Border and arrowhead color    |
| `strokeWidth` | number   | Border thickness in world px  |
| `labelColor`  | string   | Text color                    |
| `fontSize`    | number   | Text size in world px         |
| `alpha`       | number   | Overall opacity (0–1)         |
| `glowColor`   | string   | Canvas shadow color           |
| `glowBlur`    | number   | Canvas shadow blur radius     |
| `dash`        | number[] | `setLineDash` pattern         |
| `arrowLength` | number   | Override arrowhead length     |
| `arrowWidth`  | number   | Override arrowhead half-angle |
| `lineSpacing` | number   | Override bundle line spacing  |

### State

```js
// Hide all bridges
TopologyAPI.applyState("bridge", { visible: false });

// Disable hit testing on connections
TopologyAPI.applyState("connection-line", { disabled: true });
```

### Navigation and control

```js
TopologyAPI.select('router-1-1')
TopologyAPI.clearSelection()
TopologyAPI.fitToScreen()
TopologyAPI.markDirty()

// Change grid from JS
TopologyAPI.setGrid(5, 5)

// Reload with custom config object
TopologyAPI.reload({ routers: [...], bridges: [...], connections: [...] })
```

---

## Scaling Guide

The current implementation handles up to approximately 5,000 visible elements comfortably. For larger datasets, apply these optimisations in order of impact:

### 1. Viewport culling (most impact)

Skip drawing elements outside the visible world rectangle. Add to `engine.js` render loop:

```js
const visRect = getVisibleWorldRect(this.viewport, canvas);
for (const el of this._drawOrder) {
  if (!isInRect(el, visRect)) continue;
  drawElement(ctx, el, this._positions);
}
```

### 2. Level of detail

At low zoom levels, replace full element draw with simple dots:

```js
if (this.viewport.zoom < 0.2) {
  drawRouterDot(ctx, el); // just ctx.arc
} else {
  drawRouter(ctx, el); // full octagon
}
```

### 3. Spatial index for hit testing

Replace the linear `_hitTest` scan with a quadtree for O(log n) lookups instead of O(n):

```js
import Quadtree from "@timohausmann/quadtree-js";
// rebuild on loadConfig, query on every mouse move
```

### 4. OffscreenCanvas + Web Worker

Move the render loop entirely off the main thread:

```js
const offscreen = canvas.transferControlToOffscreen();
const worker = new Worker("./topology.worker.js");
worker.postMessage({ canvas: offscreen }, [offscreen]);
```

### 5. WebGL renderer

Swap `draw.js` for a WebGL or regl renderer. The engine, registry, viewport, and all React components stay identical — only the draw functions change.

---

## Adding a New Element Type

1. **`factory.js`** — add a `createMyElement(cfg)` function
2. **`draw.js`** — add `drawMyElement(ctx, el)` and `hitTestMyElement(el, wx, wy)` functions
3. **`engine.js`** — handle the new type in `loadConfig`, `_hitOne`, and `drawElement` dispatch
4. **`panels/InfoPanel.jsx`** — add a row renderer and wire it in the type switch
5. **`registry.js`** — no changes needed, it indexes by type automatically

The registry, viewport, event system, selection, hover, and `window.TopologyAPI` all work for the new type automatically.
