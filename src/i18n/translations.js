export const translations = {
  es: {
    // Header
    appTitle: 'Math Editor → SVG',
    toggleToDark: 'Cambiar a modo oscuro',
    toggleToLight: 'Cambiar a modo claro',
    modeDark: 'Modo oscuro',
    modeLight: 'Modo claro',
    switchLanguage: 'Switch to English',

    // LatexInput
    panelSource: 'Fuente',
    clearContent: 'Borrar contenido',
    examplesPlaceholder: 'Ejemplos de ecuaciones…',
    placeholderLatex: 'Escribe tu ecuación en LaTeX aquí... Por ejemplo: E = mc^2',
    placeholderAsciimath: 'Escribe tu ecuación en ASCIIMath aquí... Por ejemplo: E = m c^2',

    // Preview
    panelPreview: 'Imagen',
    loadingMathJax: 'Cargando MathJax...',
    writePlaceholder: 'Escribe una ecuación...',

    // ActionButtons
    downloadSvg: 'Descargar SVG',
    saveAsPrompt: 'Nombre del archivo:',
    fontSize: 'Tamaño',
    fontFace: 'Fuente',
    fontDefault: 'defecto',
    fontClassic: 'clásica',

    // SvgPicker
    selectEquation: 'Selecciona la ecuación a recuperar',
    close: 'Cerrar',
    noLatexMeta: 'sin metadatos LaTeX',
    viewSvgContent: 'Ver contenido SVG (diagnóstico)',

    // DropZone
    dropZoneLabel: 'Arrastra un SVG aquí para recuperar el LaTeX',
    dropZonePre: 'Arrastra aquí un',
    dropZoneMid: 'o un documento',
    dropZonePost: 'para extraer las ecuaciones',

    // Footer
    developedBy: 'desarrollado por',
    renderedWith: 'Renderizado con',
    editedWith: 'Editado con',

    // Status — App.jsx
    mathJaxNotReady: 'MathJax aún no está listo...',
    invalidAsciimath: 'Sintaxis ASCIIMath inválida — revisa la expresión',
    invalidLatex: 'Sintaxis LaTeX inválida — revisa la expresión',
    noSvgGenerated: 'MathJax no generó ningún SVG',
    rendered: (chars) => `✓ Renderizado · ${chars} chars · SVG listo para exportar`,
    nothingToDownload: 'Nada que descargar',
    downloaded: (name) => `✓ Descargado: ${name}`,
    formulaRecovered: (formula) => `✓ Fórmula recuperada: ${formula}`,
    noFormulaMetadata: (name) => `"${name}" no contiene metadatos de fórmula (no fue generado con este editor).`,
    selectSvgFile: 'Selecciona un archivo .svg',
    errorParsingSvg: (msg) => `Error al analizar el SVG: ${msg}`,
    errorReadingFile: 'Error al leer el archivo.',
    extractingSvgs: 'Extrayendo SVGs del documento…',
    noSvgsFound: 'No se encontraron SVGs en el documento.',
    svgsFound: (n) => `Se encontraron ${n} SVGs en el documento — selecciona uno:`,
    errorProcessingDoc: (msg) => `Error al procesar el documento: ${msg}`,
    defaultEquationName: 'ecuacion',

    // InstallPrompt
    installApp: 'Instala MathEditor para usarla sin conexión',
    install: 'Instalar',
  },

  en: {
    // Header
    appTitle: 'Math Editor → SVG',
    toggleToDark: 'Switch to dark mode',
    toggleToLight: 'Switch to light mode',
    modeDark: 'Dark mode',
    modeLight: 'Light mode',
    switchLanguage: 'Cambiar a español',

    // LatexInput
    panelSource: 'Source',
    clearContent: 'Clear content',
    examplesPlaceholder: 'Equation examples…',
    placeholderLatex: 'Type your LaTeX equation here... For example: E = mc^2',
    placeholderAsciimath: 'Type your ASCIIMath equation here... For example: E = m c^2',

    // Preview
    panelPreview: 'Image',
    loadingMathJax: 'Loading MathJax...',
    writePlaceholder: 'Type an equation...',

    // ActionButtons
    downloadSvg: 'Download SVG',
    saveAsPrompt: 'File name:',
    fontSize: 'Size',
    fontFace: 'Font',
    fontDefault: 'default',
    fontClassic: 'classic',

    // SvgPicker
    selectEquation: 'Select the equation to recover',
    close: 'Close',
    noLatexMeta: 'no LaTeX metadata',
    viewSvgContent: 'View SVG content (debug)',

    // DropZone
    dropZoneLabel: 'Drag an SVG here to recover the LaTeX',
    dropZonePre: 'Drag a',
    dropZoneMid: 'or a',
    dropZonePost: 'document here to extract equations',

    // Footer
    developedBy: 'developed by',
    renderedWith: 'Rendered with',
    editedWith: 'Edited with',

    // Status — App.jsx
    mathJaxNotReady: 'MathJax is not ready yet...',
    invalidAsciimath: 'Invalid ASCIIMath syntax — check the expression',
    invalidLatex: 'Invalid LaTeX syntax — check the expression',
    noSvgGenerated: 'MathJax did not generate any SVG',
    rendered: (chars) => `✓ Rendered · ${chars} chars · SVG ready to export`,
    nothingToDownload: 'Nothing to download',
    downloaded: (name) => `✓ Downloaded: ${name}`,
    formulaRecovered: (formula) => `✓ Formula recovered: ${formula}`,
    noFormulaMetadata: (name) => `"${name}" does not contain formula metadata (not generated with this editor).`,
    selectSvgFile: 'Select an .svg file',
    errorParsingSvg: (msg) => `Error parsing SVG: ${msg}`,
    errorReadingFile: 'Error reading the file.',
    extractingSvgs: 'Extracting SVGs from document…',
    noSvgsFound: 'No SVGs found in the document.',
    svgsFound: (n) => `Found ${n} SVGs in the document — select one:`,
    errorProcessingDoc: (msg) => `Error processing the document: ${msg}`,
    defaultEquationName: 'equation',

    // InstallPrompt
    installApp: 'Install MathEditor for offline use',
    install: 'Install',
  },
};
