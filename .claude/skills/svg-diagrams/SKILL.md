---
name: svg-diagrams
description: Hand-author SVG diagrams (flowcharts, process diagrams, architecture diagrams) with a clear title, generous spacing so connector-line labels stay legible, and no overlapping shapes or clipped text — then render and visually verify before calling it done. Use when the user asks to "make an SVG diagram", "draw a flowchart", "add a diagram", or similar, especially for docs/ illustrations.
---

# SVG Diagrams

Raw hand-written SVG (not a diagramming library) for flowcharts and process/architecture diagrams.
The failure mode this skill guards against isn't bad content — it's a diagram that *reads* fine as
markup but renders with text spilling out of boxes, connector labels sitting on top of other shapes,
or lines crossing through boxes they shouldn't. SVG coordinates are written blind; always confirm by
looking at the rendered output, not just the source.

## Layout rules

1. **A clear title at the top.** A bold, centered `<text>` element near `y≈24-34` naming the diagram,
   above everything else. If the diagram is one of several (e.g. "Path 1" / "Path 2"), the title
   should say which one.

2. **Plan node positions on a grid before writing coordinates.** Sketch (even just mentally) a
   top-to-bottom or left-to-right flow with fixed box sizes and consistent gaps — don't place boxes
   by trial and error one at a time. A typical box is `~250-360w x ~60-70h` with `~30-40px` vertical
   gap between rows.

3. **Leave enough space between entities for connector-line labels to sit in.** A label on an arrow
   (e.g. "No — keep refining", "Yes") needs clear space near the line that isn't already occupied by
   a box. When a connector has a label, route it through empty canvas, not through or right next to
   another shape.

4. **Route long/loop-back connectors *around* boxes, not through them.** A straight or naively-bent
   line from A to B will frequently cross a box that sits between them. Use an elbow path (`M x1,y1
   Lx2,y2 Lx3,y3 Lx4,y4`) that jogs out into the margin — e.g. left of the leftmost column, or below
   the lowest row — specifically to dodge occupied space, rather than a direct diagonal or a bezier
   curve whose midpoint you haven't checked against other boxes' bounding boxes.

5. **Wrap long text across multiple `<text>` lines** (one `<text>` per line, ~18-19px apart) instead
   of one long line that overflows the box width. Match font size to box size — 14px for a bold
   label, 12-13px for a description line, and check the description actually fits the box width
   given roughly 6-7px per character.

6. **Use one consistent color system**: a fill/stroke pair per semantic category (e.g. indigo for
   process steps, green for parallel/alternate paths, orange for decision points), reused throughout
   the diagram rather than picked per-box. Arrowheads via a single reusable `<marker>` in `<defs>`.

## Verification workflow (required — don't skip)

After writing or editing the SVG, render it and look at it before considering the diagram done:

1. **Open the file in the Browser pane.** `file://` URLs are often blocked from navigating directly —
   if so, serve the containing directory over a quick local static server instead:
   ```
   (python3 -m http.server <port> --directory . >/tmp/svgserver.log 2>&1 &)
   ```
   then `navigate` to `http://localhost:<port>/path/to/file.svg`, and `preview_stop`/kill the server
   once done previewing.
2. **Screenshot it** with `computer {action: "screenshot"}` and actually inspect the image.
3. **Check specifically for:**
   - Any text clipped by its box edge or running outside the box.
   - Any two shapes (box/box, box/line, label/box) overlapping.
   - Any connector label sitting on top of a line or box rather than in clear space.
   - The title is present, at the top, and not colliding with the first row of content.
4. **If anything is wrong, fix the SVG source and re-render** — adjust coordinates, box sizes, or
   connector routing (per the layout rules above) and repeat from step 1 until the screenshot is
   clean. Don't hand back a diagram you haven't visually confirmed.

## Sequential flows don't need step labels in the boxes

If the diagram is already a flow (arrows connecting steps top-to-bottom or left-to-right), don't
also stamp each box with "A —", "1)", "Step 2", etc. The ordering is the layout — an arrow from box
to box already says "this, then this." Reserve letter/number labels for prose *outside* the diagram
(e.g. a numbered list in the doc that walks through the same steps) if you need a way to refer back
to a specific step.

## Placing the file

Save it as its own `.svg` file (not inlined) as a **sibling** of the doc that references it — same
directory, no `images/` (or similarly-named) subdirectory. Embed it with a markdown
`![alt](name.svg)` using a real, descriptive `alt` text (that's what a non-visual reader gets).

If this diagram lives under this repo's `docs/` (which follows the `refine-docs` skill's
conventions), the SVG is a background asset for the doc that embeds it, not a documentation entry in
its own right — it does **not** get a row in that directory's `README.md` Files table, and it does
not need its own subdirectory or README.
