import { useState, useCallback, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import InstallPrompt from './components/InstallPrompt';
import { LatexInput } from './components/LatexInput';
import { Preview } from './components/Preview';
import { DropZone } from './components/DropZone';
import { SvgPicker } from './components/SvgPicker';
import { EXAMPLES } from './data/examples';
import { buildExportSvg, applyPtDimensions, injectFilenameInSvg } from './utils/svgUtils';
import { parseSvgForLatex } from './utils/svgLoader';
import { extractSvgsFromDoc, DOC_EXTENSIONS } from './utils/docUtils';
import { useMathJax } from './hooks/useMathJax';
import { useLanguage } from './i18n/LanguageContext';

export default function App() {
  const { t } = useLanguage();
  const [latexInput,       setLatexInput]      = useState('');
  const [currentSvgString, setCurrentSvgString] = useState('');
  const [currentLatex,     setCurrentLatex]    = useState('');
  const [previewSvgHtml,   setPreviewSvgHtml]  = useState('');
  const [previewError,     setPreviewError]    = useState('');
  const [status,           setStatusState]     = useState({ message: '', type: '' });
  const [svgPicker,        setSvgPicker]       = useState([]);
  const [fontSize,         setFontSize]        = useState(12);
  const [inputMode,        setInputMode]       = useState('tex');

  const [dark, setDark] = useState(() => window.matchMedia('(prefers-color-scheme: dark)').matches);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
  }, [dark]);

  const toggleDark = useCallback(() => setDark(d => !d), []);

  const [font, setFont] = useState(() => localStorage.getItem('mj-font') || '');

  const mjReady          = useMathJax();
  const initialised      = useRef(false);
  const fontSizeRef      = useRef(12);
  const fontRef          = useRef(font);
  const latexInputRef    = useRef('');
  const inputModeRef     = useRef('tex');
  const renderIdRef      = useRef(0);
  const handleDownloadRef  = useRef(null);
  const isDownloadingRef   = useRef(false);
  const loadedFilenameRef  = useRef(null);

  useEffect(() => { fontRef.current = font; }, [font]);

  const setStatus = useCallback((message, type = '') => {
    setStatusState({ message, type });
  }, []);

  const renderLatex = useCallback(async (latex, pt = fontSizeRef.current) => {
    const trimmed = latex.trim();
    const myId = ++renderIdRef.current;

    if (!trimmed) {
      setPreviewSvgHtml('');
      setPreviewError('');
      setCurrentSvgString('');
      setCurrentLatex('');
      setStatus('');
      return;
    }

    if (!window.MathJax?.tex2svgPromise) {
      setStatus(t.mathJaxNotReady, '');
      return;
    }

    try {
      const renderFn = inputModeRef.current === 'asciimath'
        ? window.MathJax.asciimath2svgPromise
        : window.MathJax.tex2svgPromise;
      if (!renderFn) { setStatus(t.mathJaxNotReady, ''); return; }

      const container = await renderFn.call(window.MathJax, trimmed, { display: true });
      if (renderIdRef.current !== myId) return;

      if (container.querySelector('[data-mml-node="merror"]')) {
        throw new Error(
          inputModeRef.current === 'asciimath'
            ? t.invalidAsciimath
            : t.invalidLatex
        );
      }

      const svgEl = container.querySelector('svg');
      if (!svgEl) throw new Error(t.noSvgGenerated);

      setCurrentLatex(trimmed);
      setCurrentSvgString(buildExportSvg(svgEl, trimmed, pt, inputModeRef.current, fontRef.current));

      const preview = svgEl.cloneNode(true);
      applyPtDimensions(preview, pt);
      preview.style.cssText = 'max-width:100%; height:auto;';
      setPreviewSvgHtml(preview.outerHTML);
      setPreviewError('');

      setStatus(t.rendered(trimmed.length), 'ok');
    } catch (e) {
      if (renderIdRef.current !== myId) return;
      setPreviewSvgHtml('');
      setPreviewError(e.message);
      setCurrentSvgString('');
      setStatus(e.message, 'err');
    }
  }, [setStatus, t]);

  useEffect(() => {
    if (mjReady && !initialised.current) {
      initialised.current = true;
      let src = EXAMPLES[0].src;
      const saved = localStorage.getItem('mj-restore');
      if (saved) {
        try {
          const { formula, mode, fontSize: savedFontSize } = JSON.parse(saved);
          localStorage.removeItem('mj-restore');
          if (mode && mode !== 'tex') {
            inputModeRef.current = mode;
            setInputMode(mode);
          }
          if (savedFontSize && savedFontSize > 0) {
            fontSizeRef.current = savedFontSize;
            setFontSize(savedFontSize);
          }
          src = formula;
        } catch { /* ignore */ }
      }
      latexInputRef.current = src;
      setLatexInput(src);
      renderLatex(src);
    }
  }, [mjReady, renderLatex]);

  const handleFontChange = useCallback((newFont) => {
    if (latexInputRef.current.trim()) {
      localStorage.setItem('mj-restore', JSON.stringify({
        formula: latexInputRef.current,
        mode: inputModeRef.current,
        fontSize: fontSizeRef.current,
      }));
    }
    localStorage.setItem('mj-font', newFont);
    setFont(newFont);
    window.location.reload();
  }, []);

  const handleFontSizeChange = useCallback((pt) => {
    fontSizeRef.current = pt;
    setFontSize(pt);
    if (latexInputRef.current.trim()) renderLatex(latexInputRef.current, pt);
  }, [renderLatex]);

  const handleModeChange = useCallback((mode) => {
    inputModeRef.current = mode;
    setInputMode(mode);
    latexInputRef.current = '';
    setLatexInput('');
    setPreviewSvgHtml('');
    setPreviewError('');
    setCurrentSvgString('');
    setCurrentLatex('');
    setStatus('');
  }, []);

  const handleDownload = useCallback(async () => {
    if (isDownloadingRef.current) return;
    if (!currentSvgString) { setStatus(t.nothingToDownload, 'err'); return; }
    isDownloadingRef.current = true;

    const safeName = currentLatex
      .replace(/[^a-zA-Z0-9]/g, '_')
      .substring(0, 30)
      .replace(/_+$/g, '') || t.defaultEquationName;

    const suggestedName = loadedFilenameRef.current ?? `eq_${safeName}.svg`;

    // showSaveFilePicker shows a native "Save As" dialog on Chrome/Edge.
    // Safari declares the API but doesn't prompt for a filename, so we skip it there.
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

    try {
      if (window.showSaveFilePicker && !isSafari) {
        try {
          const handle = await window.showSaveFilePicker({
            suggestedName,
            types: [{ description: 'SVG Image', accept: { 'image/svg+xml': ['.svg'] } }],
          });
          const finalSvg = injectFilenameInSvg(currentSvgString, handle.name);
          try {
            const writable = await handle.createWritable();
            await writable.write(finalSvg);
            await writable.close();
          } catch {
            const blob = new Blob([finalSvg], { type: 'image/svg+xml' });
            const a    = document.createElement('a');
            a.href     = URL.createObjectURL(blob);
            a.download = handle.name;
            a.click();
            setTimeout(() => URL.revokeObjectURL(a.href), 5000);
          }
          loadedFilenameRef.current = handle.name;
          setStatus(t.downloaded(handle.name), 'ok');
        } catch (e) {
          if (e.name !== 'AbortError') setStatus(e.message, 'err');
        }
      } else {
        const userInput = window.prompt(t.saveAsPrompt, suggestedName);
        if (userInput === null) return;
        const chosen = (userInput.trim() || suggestedName).replace(/\.svg$/i, '') + '.svg';
        const finalSvg = injectFilenameInSvg(currentSvgString, chosen);
        const blob = new Blob([finalSvg], { type: 'image/svg+xml' });
        const a    = document.createElement('a');
        a.href     = URL.createObjectURL(blob);
        a.download = chosen;
        a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 5000);
        loadedFilenameRef.current = chosen;
        setStatus(t.downloaded(chosen), 'ok');
      }
    } finally {
      isDownloadingRef.current = false;
    }
  }, [currentSvgString, currentLatex, setStatus, t]);

  handleDownloadRef.current = handleDownload;

  useEffect(() => {
    function onKeyDown(e) {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleDownloadRef.current?.();
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const loadSvgContent = useCallback((content, name = 'archivo.svg') => {
    const result = parseSvgForLatex(content);
    if (result) {
      const { formula, mode, fontSize: svgFontSize, fontFamily: svgFontFamily, fileName } = result;

      loadedFilenameRef.current = fileName || null;

      // Apply defaults when metadata is absent
      const targetFontSize   = (svgFontSize   != null && svgFontSize > 0) ? svgFontSize   : 12;
      const targetFontFamily = svgFontFamily ?? '';

      // If the target font differs from the loaded one, trigger a page reload.
      // Set refs first so handleFontChange saves the correct restore payload.
      if (targetFontFamily !== fontRef.current) {
        latexInputRef.current = formula;
        inputModeRef.current  = mode;
        fontSizeRef.current   = targetFontSize;
        setFontSize(targetFontSize);
        handleFontChange(targetFontFamily);
        return;
      }

      if (targetFontSize !== fontSizeRef.current) {
        handleFontSizeChange(targetFontSize);
      }

      inputModeRef.current = mode;
      setInputMode(mode);
      latexInputRef.current = formula;
      setLatexInput(formula);
      renderLatex(formula);
      setStatus(t.formulaRecovered(formula.substring(0, 60) + (formula.length > 60 ? '…' : '')), 'ok');
    } else {
      setStatus(t.noFormulaMetadata(name), 'err');
    }
  }, [renderLatex, setStatus, t, handleFontChange, handleFontSizeChange]);

  const handleLoadFile = useCallback((file) => {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.svg') && file.type !== 'image/svg+xml') {
      setStatus(t.selectSvgFile, 'err');
      return;
    }
    const reader = new FileReader();
    reader.onload  = e => { try { loadSvgContent(e.target.result, file.name); } catch (err) { setStatus(t.errorParsingSvg(err.message), 'err'); } };
    reader.onerror = () => setStatus(t.errorReadingFile, 'err');
    reader.readAsText(file);
  }, [loadSvgContent, setStatus, t]);

  const handleLoadDoc = useCallback(async (file) => {
    setStatus(t.extractingSvgs, '');
    setSvgPicker([]);
    try {
      const svgs = await extractSvgsFromDoc(file);
      if (svgs.length === 0) {
        setStatus(t.noSvgsFound, 'err');
        return;
      }
      if (svgs.length === 1) {
        loadSvgContent(svgs[0].content, svgs[0].name);
        return;
      }
      setSvgPicker(svgs);
      setStatus(t.svgsFound(svgs.length), '');
    } catch (e) {
      setStatus(t.errorProcessingDoc(e.message), 'err');
    }
  }, [loadSvgContent, setStatus, t]);

  const handleLoadFiles = useCallback(async (files) => {
    if (!files || files.length === 0) return;

    // Single file: existing behavior
    if (files.length === 1) {
      const file = files[0];
      const ext  = file.name.split('.').pop().toLowerCase();
      if (DOC_EXTENSIONS.includes(ext)) handleLoadDoc(file);
      else handleLoadFile(file);
      return;
    }

    // Multiple files: gather equations from every SVG and every document
    setStatus(t.extractingSvgs, '');
    setSvgPicker([]);

    const isSvg = f => f.name.toLowerCase().endsWith('.svg') || f.type === 'image/svg+xml';
    const isDoc = f => DOC_EXTENSIONS.includes(f.name.split('.').pop().toLowerCase());

    try {
      const groups = await Promise.all(files.map(f => {
        if (isSvg(f)) {
          return new Promise((res, rej) => {
            const reader = new FileReader();
            reader.onload  = e => {
              const content = e.target.result;
              const parsed  = parseSvgForLatex(content);
              res([{ name: f.name, displayName: parsed?.fileName ?? null, content, latex: parsed?.formula ?? null }]);
            };
            reader.onerror = () => rej(new Error(f.name));
            reader.readAsText(f);
          });
        }
        if (isDoc(f)) return extractSvgsFromDoc(f);
        return Promise.resolve([]);
      }));

      const all = groups.flat();
      all.sort((a, b) => (b.latex ? 1 : 0) - (a.latex ? 1 : 0));

      if (all.length === 0) {
        setStatus(t.noSvgsFound, 'err');
      } else if (all.length === 1) {
        loadSvgContent(all[0].content, all[0].name);
      } else {
        setSvgPicker(all);
        setStatus(t.svgsFound(all.length), '');
      }
    } catch (e) {
      setStatus(t.errorProcessingDoc(e.message), 'err');
    }
  }, [handleLoadDoc, handleLoadFile, loadSvgContent, setStatus, t]);

  return (
    <>
      <Header dark={dark} onToggleDark={toggleDark} />
      <InstallPrompt />
      <main>
        <div className="panels">
          <LatexInput
            value={latexInput}
            onChange={v => { latexInputRef.current = v; setLatexInput(v); loadedFilenameRef.current = null; }}
            onRender={renderLatex}
            inputMode={inputMode}
            onModeChange={handleModeChange}
            dark={dark}
          />
          <Preview
            mjReady={mjReady}
            svgHtml={previewSvgHtml}
            error={previewError}
            onDownloadSvg={handleDownload}
            fontSize={fontSize}
            onFontSizeChange={handleFontSizeChange}
            font={font}
            onFontChange={handleFontChange}
          />
        </div>

        <div
          id="status"
          className={status.type}
          role="status"
          aria-live="polite"
        >
          {status.message}
        </div>

        {svgPicker.length > 0 && (
          <SvgPicker
            items={svgPicker}
            onSelect={(svg) => { loadSvgContent(svg.content, svg.name); setSvgPicker([]); }}
            onClose={() => setSvgPicker([])}
          />
        )}

        <DropZone onFiles={handleLoadFiles} />
      </main>
      <Footer />
    </>
  );
}
