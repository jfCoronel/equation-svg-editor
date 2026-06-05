import JSZip from 'jszip';
import { parseSvgForLatex } from './svgLoader';

// Known SVG locations by document format
const SVG_FILTER = {
  odt:  p => p.startsWith('Pictures/')  && p.toLowerCase().endsWith('.svg'),
  odp:  p => p.startsWith('Pictures/')  && p.toLowerCase().endsWith('.svg'),
  ods:  p => p.startsWith('Pictures/')  && p.toLowerCase().endsWith('.svg'),
  docx: p => p.startsWith('word/media/') && p.toLowerCase().endsWith('.svg'),
  pptx: p => p.startsWith('ppt/media/')  && p.toLowerCase().endsWith('.svg'),
  xlsx: p => p.startsWith('xl/media/')   && p.toLowerCase().endsWith('.svg'),
};

export const DOC_EXTENSIONS = Object.keys(SVG_FILTER);

export async function extractSvgsFromDoc(file) {
  const ext = file.name.split('.').pop().toLowerCase();
  const filter = SVG_FILTER[ext];
  if (!filter) throw new Error(`Formato no soportado: .${ext}`);

  const zip = await JSZip.loadAsync(file);
  const results = [];

  for (const [path, entry] of Object.entries(zip.files)) {
    if (!entry.dir && filter(path)) {
      const content = await entry.async('string');
      const parsed  = parseSvgForLatex(content);
      results.push({
        name:        path.split('/').pop(),
        displayName: parsed?.fileName ?? null,
        sourceName:  file.name,
        content,
        latex:       parsed?.formula ?? null,
      });
    }
  }

  // Sort: SVGs with LaTeX metadata first
  results.sort((a, b) => (b.latex ? 1 : 0) - (a.latex ? 1 : 0));
  return results;
}
