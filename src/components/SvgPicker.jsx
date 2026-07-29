import { useState, useMemo } from 'react';
import { useLanguage } from '../i18n/LanguageContext';

function svgToDataUri(content) {
  return 'data:image/svg+xml;charset=utf-8,' +
    encodeURIComponent(content.replace(/currentColor/g, 'black'));
}

function PickerItem({ svg, onSelect }) {
  const { t } = useLanguage();
  const [expanded, setExpanded] = useState(false);
  const uri = useMemo(() => svgToDataUri(svg.content), [svg.content]);

  return (
    <div className="svg-picker-row">
      <button className="svg-picker-item" onClick={() => onSelect(svg)}>
        <div className="svg-picker-preview">
          <img src={uri} alt={svg.latex ?? svg.name} />
        </div>
        <div className="svg-picker-meta">
          <span className="svg-picker-name">
            {svg.eqName ?? svg.displayName ?? svg.name}
            {svg.sourceName && <span className="svg-picker-source"> {t.fromSource} {svg.sourceName}</span>}
          </span>
          {svg.latex
            ? <span className="svg-picker-latex">{svg.latex.length > 60 ? svg.latex.substring(0, 60) + '…' : svg.latex}</span>
            : <span className="svg-picker-none">{t.noLatexMeta}</span>
          }
        </div>
      </button>
      {!svg.latex && (
        <button
          className="svg-picker-debug"
          title={t.viewSvgContent}
          onClick={() => setExpanded(v => !v)}
        >
          <i className={`ti ti-${expanded ? 'chevron-up' : 'code'}`} aria-hidden="true" />
        </button>
      )}
      {!svg.latex && expanded && (
        <pre className="svg-picker-raw">{svg.content.slice(0, 600)}</pre>
      )}
    </div>
  );
}

export function SvgPicker({ items, onSelect, onClose }) {
  const { t } = useLanguage();
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(svg => (svg.eqName ?? svg.displayName ?? svg.name ?? '').toLowerCase().includes(q));
  }, [items, query]);

  return (
    <div className="svg-picker">
      <div className="svg-picker-header">
        <span>{t.selectEquation}</span>
        <input
          type="text"
          className="svg-picker-search"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder={t.searchPlaceholder}
        />
        <button className="svg-picker-close" onClick={onClose} aria-label={t.close}>
          <i className="ti ti-x" aria-hidden="true" />
        </button>
      </div>
      <div className="svg-picker-list">
        {filtered.map((svg, i) => (
          <PickerItem key={i} svg={svg} onSelect={onSelect} />
        ))}
        {filtered.length === 0 && (
          <div className="svg-picker-empty">{t.noSearchResults}</div>
        )}
      </div>
    </div>
  );
}
