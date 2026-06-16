# CoreLogger — Known Issues & Limitations

_Reference for v0.2.0. This lists the assumptions, heuristics, and accuracy
boundaries built into the tool's automated features. None of these are bugs in
the "broken code" sense — they are places where the tool makes an informed
guess or a deliberate simplification, and where your own judgement should
override it._

---

## 1. Soil-horizon generator (KA5)

The horizon generator is a **suggestion engine, not an authority**. It infers a
likely KA5 horizon from colour, petrography, observations, depth, and genesis
keywords. Every result is editable and carries a confidence flag (● high, ◓
medium, ○ low).

Known limitations:

- **Cannot detect features that need lab or close field evidence.** Clay
  illuviation (Bt), spodic horizons (Bs/Bh), and true calcic horizons are not
  reliably inferable from the logged data. The tool deliberately does **not**
  invent these; weathered subsoil is suggested as **Bv** with a note that no
  clay-illuviation test was done.
- **Stagnic vs. groundwater gley (Sw/Sd vs. Go/Gr)** is only distinguished when
  explicit keywords are present. A bare "stagnic" keyword yields a low-confidence
  **Sw** flagged for verification; the Sw/Sd split is not determined.
- **Depositional environment is not a KA5 horizon.** Marine/tidal, lacustrine,
  fluvial, glaciofluvial, etc. are recorded as a substrate *note* and used to
  bias the pedogenic call (e.g. toward gley in waterlogged settings). They are
  intentionally never forced into the horizon symbol.
- **Buried-soil (fAh) detection is heuristic.** It fires on explicit wording
  ("fossil", "palaeosol", "begraben"…) or structurally when a dark/humic layer
  sits beneath mineral cover. The structural rule can miss thin or weakly humic
  buried soils, and could in principle over-fire on a dark mineral band.
- **Holocene / Pleistocene age is never asserted as a hard label.** Where a
  buried soil rests on a glacial-family substrate, the tool adds a *contextual*
  note ("likely Pleistocene surface beneath Holocene cover, verify with
  dating") — it does not classify age. Age determination needs ¹⁴C/OSL,
  biostratigraphy, or regional mapping.
- **Environment keywords must actually be typed.** The tool cannot infer
  "marine" or "glaciofluvial" from grain size alone; if you don't write it, it
  won't be considered.
- **Fallback is low-confidence C.** When no strong signal is found, the layer is
  labelled substrate (**C**) at low confidence and flagged "please verify".

---

## 2. Munsell soil-colour values

Colour hexes were corrected to the **Munsell Soil Color Chart sRGB** reference
using the authoritative `aqp` dataset (USDA-NRCS). The palette holds ~343
soil-relevant chips.

Known limitations:

- **Neutrals (N 2/ – N 8/) are computed, not table-read.** The chromatic
  dataset has no neutral chips, so greys are derived from the standard ASTM
  Munsell-value → luminance formula. This is the accepted method but is a
  computation rather than a direct chart lookup.
- **A few chip *names* sit on disputed boundaries.** Names follow the published
  soil-colour nomenclature, but references and chart printings disagree on
  exactly where some regions divide — e.g. "weak red" vs "red" around 10R
  value 4 chroma 4, and "reddish brown" vs "yellowish red" at 5YR 5/4. The
  everyday names are correct; these borderline chips are the least certain.
- **Names are English Munsell convention, not German.** If your workflow uses
  KA5 Bodenfarben (German colour terms), these names will not match; that would
  be a separate naming set.
- **Scope is soil pages only.** The palette covers the soil + gley hue pages
  (10R…5Y, plus GLEY 10Y…5B, N). Vivid non-soil colours from the full Munsell
  renotation are intentionally excluded.

---

## 3. Legacy-core colour converter

The "Convert old core colours" tool re-maps colours in a previously exported
core to the authoritative soil-chart hexes.

Known limitations:

- **JSON conversion depends on the old palette.** JSON exports store only the
  hex, not the notation, so the converter bridges each old hex through the
  v0.1.9 palette to recover its Munsell code. If an old JSON had **hand-edited
  hexes** not in that palette, those fall back to a **nearest-colour match**
  (RGB distance), which is approximate rather than exact.
- **TXT/CSV conversion is exact** because those exports include a Munsell
  column, which is read directly — preferred over JSON when available.
- **Unrecognised colours are left as nearest-match, not flagged per-row.** The
  summary reports totals (scanned / changed) but does not list which specific
  layers used the approximate fallback.

---

## 4. Munsell colour dropdown (grouped view)

- **Grouped code view applies only in Munsell mode.** With "Use Munsell colours"
  on, both dropdowns show code-only options grouped by hue page. With it off,
  the custom non-chart colours show by descriptive name as before.
- **Munsell mode is off by default**, so a new session shows the custom-colour
  list first until the toggle is ticked.
- **Five legacy duplicate notations are de-duplicated** in the dropdown (first
  entry kept). The duplicates still exist in the underlying data and in older
  saved profiles.

---

## 5. PDF / print export

- **1 m segmentation renders the full SVG once per page.** Each metre is shown
  by offsetting a full-height copy of the profile SVG inside a clipped window.
  For very deep cores this produces many SVG copies and can be **memory- and
  time-heavy** in the browser's print preview.
- **The final segment is a full 1 m page** even when the core ends partway
  through, leaving white space below (intentional, for consistent page height).
- **Segment size is fixed at 1 m** — not yet user-adjustable from the UI.
- **Horizon labels are not drawn on the profile/PDF.** The generated KA5
  horizon lives in the table and exports, but is not rendered as a column on the
  graphical profile or the segmented PDF pages.
- **PDF relies on the browser's "Save as PDF".** Behaviour and pagination can
  vary slightly between browsers; iOS Safari on `file://` has historically been
  the least reliable.

---

## 6. Edit-layer modal

- **Finds / markers are not editable in the modal.** They are managed in the
  dedicated Finds & Observations panel; the modal covers descriptive and
  classification fields (depths, colour, description, petrography, genesis,
  layer type, horizon) but not structured markers.
- **Petrography/genesis quick-entry in the modal clears on open.** The dropdowns
  reset each time the modal opens (the saved description text is preserved); they
  re-apply cleanly on the next selection but do not pre-populate from the saved
  layer.

---

## 7. General / data-integrity notes

- **Language detection and German→English translation are dictionary-based.**
  Unusual phrasing, abbreviations, or mixed-language descriptions may translate
  imperfectly, which can in turn affect the KA5 code and horizon suggestion.
- **TSV/CSV import is column-name based.** Adding or renaming export columns is
  safe, but a file with a renamed "Color"/"Munsell"/"Description" header may not
  round-trip.
- **No undo.** Deleting a layer or overwriting the profile via import is
  immediate; keep JSON backups of important logs.
- **All processing is client-side and in-memory.** Nothing is uploaded, but an
  unsaved session is lost on page reload — export or save JSON to persist.

---

_If any of these limitations are blocking your workflow, most are
straightforward to address as a follow-up (e.g. user-adjustable PDF segment
size, horizon column on the profile, per-row conversion report, German colour
names). They are listed here as current behaviour, not as a backlog commitment._
