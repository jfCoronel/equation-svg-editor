---
name: word-svg-metadata
description: Word strips SVG <metadata> blocks; all recoverable data must live in the root id attribute
metadata:
  type: project
---

Word (docx/pptx) strips the SVG `<metadata>` block entirely when embedding or re-exporting SVGs. The root element's `id` attribute IS preserved.

**Solution**: encode all metadata in the `id` using format `lxs2-{base64url(JSON)}` where JSON = `{ f, m, s, ff, fn }` (formula, mode, fontSize, fontFamily, fileName).

`<metadata>` is kept for non-Word tools (LibreOffice, Inkscape) that do respect it.

**Why:** Discovered when testing SVG recovery from Word — names, font sizes and font families were not being restored despite being stored in `<metadata>`.

**How to apply:** Any new per-SVG metadata field must be encoded in BOTH `<metadata>` AND the `lxs2-` id. The loader (`parseSvgForLatex`) reads `<metadata>` first, then falls back to the id if metadata was stripped.

Key files:
- `src/utils/svgUtils.js` — `encodeMetadataId`, `injectFilenameInSvg`
- `src/utils/svgLoader.js` — `decodeLatexId`, `parseSvgForLatex`
