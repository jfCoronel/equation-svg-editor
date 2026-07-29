export function escapeXml(str) {
  return str
    .replace(/&/g,  '&amp;')
    .replace(/</g,  '&lt;')
    .replace(/>/g,  '&gt;')
    .replace(/"/g,  '&quot;')
    .replace(/'/g,  '&apos;');
}

export function unescapeXml(str) {
  return str
    .replace(/&amp;/g,  '&')
    .replace(/&lt;/g,   '<')
    .replace(/&gt;/g,   '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

// Encodes all recoverable metadata into a URL-safe base64 id that survives
// Word/PowerPoint SVG processing (they strip <metadata> but keep root attributes).
// Format: lxs2-{base64url(JSON)}
// JSON keys: f=formula, m=mode, s=fontSize, ff=fontFamily, fn=fileName
function toB64url(str) {
  const bytes = new TextEncoder().encode(str);
  const b64   = btoa(Array.from(bytes, b => String.fromCharCode(b)).join(''));
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function encodeMetadataId(formula, mode, fontSize, fontFamily, name) {
  const meta = { f: formula, m: mode, s: fontSize };
  if (fontFamily) meta.ff = fontFamily;
  if (name)       meta.n  = name;
  return 'lxs2-' + toB64url(JSON.stringify(meta));
}

// Legacy export kept for external compat — new code uses encodeMetadataId.
export function encodeLatexId(formula, mode = 'tex') {
  const b64url = toB64url(formula);
  return (mode === 'asciimath' ? 'lxs-asc-' : 'lxs-tex-') + b64url;
}

// MathJax SVG viewBox units: 1 unit = 1/1000 em.
// Given a desired font size in pt, we can convert viewBox dimensions to pt:
//   width_pt  = viewBox_width  / 1000 * fontSize_pt
//   height_pt = viewBox_height / 1000 * fontSize_pt
function applyPtDimensions(svgEl, fontSize) {
  const vb = svgEl.getAttribute('viewBox');
  if (!vb) return;
  const parts = vb.trim().split(/[\s,]+/).map(Number);
  if (parts.length !== 4 || parts.some(isNaN)) return;
  const [, , vbW, vbH] = parts;
  svgEl.setAttribute('width',  `${(vbW / 1000 * fontSize).toFixed(3)}pt`);
  svgEl.setAttribute('height', `${(vbH / 1000 * fontSize).toFixed(3)}pt`);
}

export function buildExportSvg(svgEl, formula, fontSize = 12, mode = 'tex', fontFamily = '', name = '') {
  const ns    = 'http://www.w3.org/2000/svg';
  const clone = svgEl.cloneNode(true);

  applyPtDimensions(clone, fontSize);

  clone.setAttribute('xmlns',       ns);
  clone.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
  // lxs2- id encodes all metadata in JSON/base64url — survives Word's <metadata> stripping
  clone.setAttribute('id', encodeMetadataId(formula, mode, fontSize, fontFamily, name));

  // <metadata> for LibreOffice, Inkscape and other SVG-aware tools
  const fontFamilyAttr = fontFamily ? ` font-family="${escapeXml(fontFamily)}"` : '';
  const nameAttr       = name       ? ` name="${escapeXml(name)}"`               : '';
  const meta = document.createElementNS(ns, 'metadata');
  meta.innerHTML =
    `<latex-source xmlns="https://schemas.latexeditor.app/1.0" mode="${mode}" font-size="${fontSize}"${fontFamilyAttr}${nameAttr}>` +
    escapeXml(formula) +
    '</latex-source>';
  clone.insertBefore(meta, clone.firstChild);

  // Word/PowerPoint don't inherit a CSS color context, so currentColor resolves
  // to white/undefined. Replace it with an explicit black before exporting.
  return new XMLSerializer().serializeToString(clone).replace(/currentColor/g, 'black');
}

// Injects the final filename into both <latex-source> and the lxs2- id.
// Called at download time once the user has confirmed the filename.
export function injectFilenameInSvg(svgString, filename) {
  const escaped = escapeXml(filename);

  // Update <metadata> attribute (for non-Word tools)
  const withMeta = svgString.replace(
    /(<(?:[\w]+:)?latex-source\b[^>]*)>/,
    (_, open) => `${open} file-name="${escaped}">`
  );

  // Update lxs2- id attribute (survives Word's <metadata> stripping)
  return withMeta.replace(
    /(\bid=")lxs2-([^"]+)(")/,
    (full, pre, b64url, post) => {
      try {
        const b64    = b64url.replace(/-/g, '+').replace(/_/g, '/');
        const padded = b64 + '=='.slice(0, (4 - b64.length % 4) % 4);
        const bytes  = Uint8Array.from(atob(padded), c => c.charCodeAt(0));
        const meta   = JSON.parse(new TextDecoder().decode(bytes));
        meta.fn = filename;
        return `${pre}lxs2-${toB64url(JSON.stringify(meta))}${post}`;
      } catch {
        return full;
      }
    }
  );
}

export { applyPtDimensions };

export async function svgToPngBlob(svgString, scale = 3) {
  const svgBlob = new Blob([svgString], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(svgBlob);
  try {
    const img = new Image();
    img.src = url;
    await new Promise((res, rej) => { img.onload = res; img.onerror = rej; });

    const canvas = document.createElement('canvas');
    canvas.width  = img.naturalWidth  * scale;
    canvas.height = img.naturalHeight * scale;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.scale(scale, scale);
    ctx.drawImage(img, 0, 0);

    return await new Promise((res, rej) =>
      canvas.toBlob(b => (b ? res(b) : rej(new Error('toBlob devolvió null'))), 'image/png')
    );
  } finally {
    URL.revokeObjectURL(url);
  }
}

// Injects a PNG tEXt chunk with the LaTeX source after the IHDR chunk.
function crc32(bytes) {
  let c = 0xFFFFFFFF;
  for (const b of bytes) {
    c ^= b;
    for (let i = 0; i < 8; i++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
  }
  return (c ^ 0xFFFFFFFF) >>> 0;
}

export async function addPngLatexMetadata(pngBlob, latex) {
  const enc  = new TextEncoder();
  const key  = enc.encode('LaTeX');
  const val  = enc.encode(latex);

  const data = new Uint8Array(key.length + 1 + val.length);
  data.set(key);
  data[key.length] = 0;
  data.set(val, key.length + 1);

  const type    = enc.encode('tEXt');
  const crcSrc  = new Uint8Array(4 + data.length);
  crcSrc.set(type);
  crcSrc.set(data, 4);

  const chunk = new Uint8Array(12 + data.length);
  const dv    = new DataView(chunk.buffer);
  dv.setUint32(0, data.length, false);
  chunk.set(type, 4);
  chunk.set(data, 8);
  dv.setUint32(8 + data.length, crc32(crcSrc), false);

  // PNG signature (8 B) + IHDR chunk (4+4+13+4 = 25 B) = 33 B; insert right after
  const orig = new Uint8Array(await pngBlob.arrayBuffer());
  const out  = new Uint8Array(orig.length + chunk.length);
  out.set(orig.slice(0, 33));
  out.set(chunk, 33);
  out.set(orig.slice(33), 33 + chunk.length);

  return new Blob([out], { type: 'image/png' });
}
