import { unescapeXml } from './svgUtils';

function fromB64url(b64url) {
  const b64    = b64url.replace(/-/g, '+').replace(/_/g, '/');
  const padded = b64 + '=='.slice(0, (4 - b64.length % 4) % 4);
  return Uint8Array.from(atob(padded), c => c.charCodeAt(0));
}

function decodeLatexId(id) {
  // New format: lxs2-{base64url(JSON)} — carries formula, mode, fontSize, fontFamily, fileName
  if (id.startsWith('lxs2-')) {
    const { f, m, s, ff, fn } = JSON.parse(new TextDecoder().decode(fromB64url(id.slice(5))));
    return {
      formula:    f,
      mode:       m  || 'tex',
      fontSize:   typeof s === 'number' && s > 0 ? s : null,
      fontFamily: ff || null,
      fileName:   fn || null,
    };
  }
  // Legacy formats: lxs-tex-{b64}, lxs-asc-{b64}, lxs-{b64}
  let encoded, mode;
  if (id.startsWith('lxs-tex-'))      { encoded = id.slice(8); mode = 'tex'; }
  else if (id.startsWith('lxs-asc-')) { encoded = id.slice(8); mode = 'asciimath'; }
  else                                 { encoded = id.slice(4); mode = 'tex'; }
  return {
    formula:    new TextDecoder().decode(fromB64url(encoded)),
    mode,
    fontSize:   null,
    fontFamily: null,
    fileName:   null,
  };
}

// Returns { formula, mode, fontSize, fontFamily, fileName } or null if no metadata found.
// mode is 'tex' | 'asciimath', defaults to 'tex' for backwards compatibility.
// fontSize, fontFamily, fileName are null when absent (older SVGs).
export function parseSvgForLatex(svgText) {
  const parser = new DOMParser();
  const doc    = parser.parseFromString(svgText, 'image/svg+xml');
  const svgEl  = doc.querySelector('svg');
  let formula    = null;
  let mode       = 'tex';
  let fontSize   = null;
  let fontFamily = null;
  let fileName   = null;

  // Method 1: <latex-source mode="..."> inside <metadata> — current format
  const lsEl = doc.querySelector('latex-source');
  if (lsEl) {
    formula = lsEl.textContent;
    const m = lsEl.getAttribute('mode');
    if (m === 'asciimath') mode = 'asciimath';

    const fs = parseFloat(lsEl.getAttribute('font-size'));
    if (!isNaN(fs) && fs > 0) fontSize = fs;

    const ff = lsEl.getAttribute('font-family');
    if (ff) fontFamily = ff;

    const fn = lsEl.getAttribute('file-name');
    if (fn) fileName = fn;
  }

  // Method 2: id attribute — survives Word's <metadata> stripping.
  // lxs2-{json} carries formula+mode+fontSize+fontFamily+fileName.
  // Legacy lxs-tex-/lxs-asc- carry formula+mode only.
  if (!formula && svgEl?.id?.startsWith('lxs')) {
    try {
      const d  = decodeLatexId(svgEl.id);
      formula    = d.formula;
      mode       = d.mode;
      fontSize   = fontSize   ?? d.fontSize;
      fontFamily = fontFamily ?? d.fontFamily;
      fileName   = fileName   ?? d.fileName;
    } catch { /* malformed */ }
  }

  // Method 3: data-latex — backwards compat
  if (!formula && svgEl) formula = svgEl.getAttribute('data-latex');

  if (!formula) return null;
  return { formula: unescapeXml(formula.trim()), mode, fontSize, fontFamily, fileName };
}
