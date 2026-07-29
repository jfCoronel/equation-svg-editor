import { useRef, useMemo, useEffect } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import CodeMirror from '@uiw/react-codemirror';
import { StreamLanguage } from '@codemirror/language';
import { stex } from '@codemirror/legacy-modes/mode/stex';
import { autocompletion } from '@codemirror/autocomplete';
import { keymap } from '@codemirror/view';
import { Prec } from '@codemirror/state';
import { solarizedLightInit, solarizedDarkInit } from '@uiw/codemirror-theme-solarized';
import { tags as t } from '@lezer/highlight';
import { EXAMPLES, ASCII_EXAMPLES } from '../data/examples';
import { makeLatexCompletionSource } from '../data/latexCompletions';
import { makeAsciimathCompletionSource } from '../data/asciimathCompletions';
import { asciimathLanguage } from '../data/asciimathMode';

const bracketStyle = { tag: t.bracket, color: '#CB4B16', fontWeight: '600' };

const themeDark  = solarizedDarkInit ({ styles: [bracketStyle] });
const themeLight = solarizedLightInit({ styles: [bracketStyle] });

export function LatexInput({ value, onChange, onRender, inputMode, onModeChange, dark, equationName, onEquationNameChange }) {
  const { t, lang } = useLanguage();
  const debounceRef = useRef(null);
  const onRenderRef = useRef(onRender);
  useEffect(() => { onRenderRef.current = onRender; }, [onRender]);

  const cmViewRef = useRef(null);
  function focusEditor() { setTimeout(() => cmViewRef.current?.focus(), 0); }

  const latexExtensions = useMemo(() => [
    StreamLanguage.define(stex),
    autocompletion({ override: [makeLatexCompletionSource(lang)] }),
    Prec.highest(keymap.of([{
      key: 'Ctrl-Enter', mac: 'Cmd-Enter',
      run() { clearTimeout(debounceRef.current); onRenderRef.current(editorValueRef.current); return true; },
    }])),
  ], [lang]);

  const asciimathExtensions = useMemo(() => [
    asciimathLanguage,
    autocompletion({ override: [makeAsciimathCompletionSource(lang)] }),
    Prec.highest(keymap.of([{
      key: 'Ctrl-Enter', mac: 'Cmd-Enter',
      run() { clearTimeout(debounceRef.current); onRenderRef.current(editorValueRef.current); return true; },
    }])),
  ], [lang]);

  const editorValueRef = useRef(value);
  useEffect(() => { editorValueRef.current = value; }, [value]);

  function handleChange(val) {
    editorValueRef.current = val;
    onChange(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => onRenderRef.current(val), 450);
  }

  const examples = inputMode === 'asciimath' ? ASCII_EXAMPLES : EXAMPLES;
  const placeholder = inputMode === 'asciimath' ? t.placeholderAsciimath : t.placeholderLatex;

  function handleExample(src, label) {
    onChange(src);
    clearTimeout(debounceRef.current);
    onRenderRef.current(src);
    if (label) onEquationNameChange(label);
  }

  return (
    <div className="panel">
      <div className="panel-label-row">
        <span className="panel-label" style={{ margin: 0 }}>{t.panelSource}</span>
        <div className="mode-toggle">
          <button
            className={`mode-btn${inputMode === 'tex' ? ' active' : ''}`}
            onClick={() => { onModeChange('tex'); focusEditor(); }}
          >LaTeX</button>
          <button
            className={`mode-btn${inputMode === 'asciimath' ? ' active' : ''}`}
            onClick={() => { onModeChange('asciimath'); focusEditor(); }}
          >ASCIIMath</button>
        </div>
        <label className="eq-name-control">
          <span>{t.equationName}</span>
          <input
            type="text"
            className="eq-name-input"
            value={equationName}
            onChange={e => onEquationNameChange(e.target.value)}
            placeholder={t.equationNamePlaceholder}
          />
        </label>
        <button
          className="clear-btn"
          title={t.clearContent}
          onClick={() => { onChange(''); clearTimeout(debounceRef.current); onRenderRef.current(''); focusEditor(); }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 6h18"/>
            <path d="M8 6V4h8v2"/>
            <path d="M19 6l-.867 12.142A2 2 0 0 1 16.138 20H7.862a2 2 0 0 1-1.995-1.858L5 6"/>
            <line x1="10" y1="11" x2="10" y2="17"/>
            <line x1="14" y1="11" x2="14" y2="17"/>
          </svg>
        </button>
        <select
          className="ex-select"
          value=""
          onChange={e => {
            const ex = examples.find(ex => ex.src === e.target.value);
            if (ex) handleExample(ex.src, ex.label);
          }}
        >
          <option value="" disabled>{t.examplesPlaceholder}</option>
          {examples.map(ex => (
            <option key={ex.label} value={ex.src}>{ex.label}</option>
          ))}
        </select>
      </div>
      <CodeMirror
        value={value}
        onChange={handleChange}
        onCreateEditor={(view) => { cmViewRef.current = view; }}
        theme={dark ? themeDark : themeLight}
        extensions={inputMode === 'asciimath' ? asciimathExtensions : latexExtensions}
        basicSetup={{
          lineNumbers: false,
          foldGutter: false,
          dropCursor: false,
          allowMultipleSelections: false,
          indentOnInput: false,
          highlightActiveLine: false,
          highlightSelectionMatches: false,
        }}
        className="cm-latex-editor"
        placeholder={placeholder}
      />
    </div>
  );
}
