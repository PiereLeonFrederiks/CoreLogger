# Geoarchaeological Core Logger

A single-file, offline-capable web app for logging sediment core and borehole stratigraphy in the field. Built for geoarchaeologists and geologists working on excavation sites, it runs entirely in the browser with no server or installation required.

To the application: <https://piereleonfrederiks.github.io/CoreLogger/>

⚠ Early Access — This project is under active development. Features, exports, and data formats may change between versions. If you use this tool, I'd love to hear what works, what doesn't, and what's missing.

DOI: [![DOI](https://zenodo.org/badge/DOI/10.5281/zenodo.21023026.svg)](https://doi.org/10.5281/zenodo.21023026)

---

## Features

### Core Logging

- Add stratigraphic layers with borehole ID, depth range (from/to in metres), soil colour, and a free-text description
- Layer types: **Normal**, **Disturbed / reworked**, **Sediment gap / missing**, **Anthropogenic**
- Edit or delete any layer via an inline modal
- Colour picker pre-loaded with a full geoarchaeological palette, each colour mapped to its **Munsell notation** (e.g. `10YR 4/4`); a **"Use Munsell colours"** toggle switches the list between Munsell-coded colours and plain swatches

### Automatic Soil Classification

- Descriptions are parsed against a built-in soil taxonomy to generate standardised **DIN/BGS short codes** (e.g. `mSu`, `fT`, `Hh`)
- Whole-word matching: compound terms are read correctly — e.g. *fine-sandy silt* → `U(fs)` rather than being mistaken for *fine sand*; hyphenated and spaced spellings (*fine-sandy* / *fine sandy*) are treated the same
- Bilingual input: accepts **English and German** descriptions and auto-translates German terms (including umlaut variants) to English — e.g. *schluffiger Sand* → *silty sand*
- A guided **KA5 quick-entry** picker builds a code from a primary soil plus stacked modifiers, or recalculates it from the current description

### Gradational Layers

- A single layer can record a gradual shift of primary soil from top to base — shown as `X → Y` (e.g. `U(l) → T(g)`), with the column tapering and the texture blending from top to base
- The base soil has its own secondary-modifier picker, independent of the top soil
- The shift is added to the description without overwriting the existing text, and redundant phrasings are suppressed (e.g. `L(l,t)` is shown as `L(t)`)

### Markers & Compaction Zones

- **Markers / Finds**: a tabbed panel for samples, shells, charcoal, wood, ceramics, humic concentrations, roots, stones, and iron oxide — logged at a single depth or across a depth zone, and shown as labelled flags on the stratigraphic profile
- Find textures follow each layer's shape and are drawn semi-transparently, so the sediment grain stays visible underneath
- **Compaction zones**: flag corer-induced compaction depths with a note (e.g. piston corer, Rammsonde); displayed as distinct bands on the profile

### GPS & Coordinates

- One-tap **GPS capture** using the browser's Geolocation API
- Manual coordinate entry (Longitude, Latitude, Surface Elevation, CRS/Datum)
- Supports WGS84 and projected systems (e.g. ETRS89 / UTM32N)
- When elevation is provided, the table shows both depth-below-surface and **absolute elevation (m a.s.l.)**

### Stratigraphic Profile

- Live **canvas-rendered stratigraphic column** that updates as layers are added
- Soil colours rendered at scale; grain-size textures, markers, and compaction zones overlaid as annotations
- Pinch-zoom and pan on mobile; exportable as image or vector
- **Depth-adaptive scaling**: the vertical scale automatically adjusts to the total core length, so long cores (e.g. 10–20 m and deeper) render at a usable on-screen size with a readable depth axis instead of overflowing the drawing area. The profile box resizes to fit the core, and exports keep the same proportions shown on screen
- **Scale controls** above the profile box — independent **Width (X)**, **Height (Y)**, and **Font** sliders redraw the profile geometry (staying crisp at any size and carrying through to the exported image/vector), with the current multiplier (`1.0×`) shown next to each and a **Reset scale** button
- On-screen **zoom** (− / 100 % / + and Reset, plus pinch and Ctrl/⌘ + scroll) magnifies the rendered profile for inspection without altering the export

---

## Export Formats

| Format                   | Description                                                             |
| ------------------------ | ----------------------------------------------------------------------- |
| **Copy as TSV**          | Tab-separated values for direct paste into Excel / LibreOffice          |
| **Download TXT**         | Same TSV content as a `.txt` file                                       |
| **Save Profile (JSON)**  | Full session state — layers, gradational shifts, markers, compaction, coordinates |
| **Load Profile (JSON)**  | Re-import a previously saved JSON session                               |
| **Load TXT / CSV**       | Re-import a previously exported TSV/TXT file                            |
| **GeODin / SEP-3 (CSV)** | CSV in SEP-3 field naming convention for import into **GeODin-Shuttle** |
| **JPG / PNG**            | Raster image of the stratigraphic profile                               |
| **SVG**                  | Vector export of the profile                                            |
| **PDF**                  | Vector PDF (desktop); paginated by depth for long cores; falls back to SVG share sheet on iOS |

JSON is the lossless format and round-trips every field, including gradational shifts and finds. The TXT/CSV import reconstructs gradational shifts from the description and re-reads finds with their type and depth range, so an exported log re-imports faithfully.

---

## Usage

1. Open `index.html` in any modern browser — no installation, no internet required after the first load (fonts load from Google Fonts on first use)
2. Optionally enter site coordinates via GPS or manually
3. Add layers from top (0 m) downward, filling in depth, colour, and description (and, if needed, a gradational shift)
4. Add markers or compaction zones as needed
5. Export data in your preferred format when done

---

## Companion Tool — Stratigraphic Transect

Profiles exported from the Core Logger can be loaded into the **Stratigraphic Transect** viewer to correlate several boreholes side by side along a section line. It reads the full export (gradational codes, Munsell-aware colours, find textures, and the corrected classification) and can export the section as a true-vector SVG with selectable DPI for posters and publications.

---

## Mobile Support

The app is fully optimised for tablet and phone use in the field:

- Responsive layout with touch-friendly input sizes (16 px minimum font size to prevent iOS auto-zoom)
- Safe-area insets for notched devices (iPhone, modern Android)
- File downloads via the **Web Share API** on iOS (opens native share sheet); anchor-download fallback on Android and desktop
- Pinch-zoom and multi-touch gestures are intentionally suppressed outside the profile to prevent accidental UI interactions

---

## Soil Classification Reference

The classifier uses a subset of the **DIN 4022 / KA5 (Bodenkundliche Kartieranleitung)** system for German soil codes and standard English sediment terminology. Main type codes include:

| Code                        | Material                                         |
| --------------------------- | ------------------------------------------------ |
| `T`, `fT`, `mT`, `gT`       | Clay (fine / medium / coarse)                    |
| `U`, `fU`, `mU`, `gU`       | Silt                                             |
| `S`, `fS`, `mS`, `gS`       | Sand                                             |
| `G`, `fG`, `mG`, `gG`       | Gravel                                           |
| `L`                         | Loam                                             |
| `H`, `Hh`, `Hn`, `Hu`, `Ha` | Peat (raised bog / fen / transition / amorphous) |
| `Fss`, `Fsu`, `Fst`         | Lake sand / silt / clay                          |
| `Fkk`                       | Lake chalk (Seekreide)                           |
| `Tbd`                       | Varved clay (Bänderton)                          |
| `Swa`, `Uwa`, `Twa`         | Tidal flat sediments                             |
| `NA`                        | Core loss                                        |

Modifiers (e.g. `t`, `u`, `s`, `l`, `g`, `h` for clayey, silty, sandy, loamy, gravelly, humic) and grain-size prefixes are appended automatically.

---

## File Structure

The entire application is a single self-contained `index.html` file. All styles, logic, soil data, and colour palettes are inlined — no external dependencies beyond the Google Fonts stylesheet.

---

## Browser Compatibility

| Browser                           | Support                              |
| --------------------------------- | ------------------------------------ |
| Chrome / Edge (desktop & Android) | ✅ Full                               |
| Firefox (desktop)                 | ✅ Full                               |
| Safari (macOS)                    | ✅ Full                               |
| Safari (iOS)                      | ✅ Full (PDF exports via share sheet) |

The classifier uses modern JavaScript (lookbehind regular expressions); very old browsers (pre-2018) are not supported.

---

## License

See repository or contact the author for licensing information.

## Credits

Developed by PLF. AI-assisted development — Claude (Anthropic) was used during parts of the scripting process.
