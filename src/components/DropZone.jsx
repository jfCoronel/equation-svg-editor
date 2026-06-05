import { useState, useRef } from 'react';
import { useLanguage } from '../i18n/LanguageContext';

export function DropZone({ onFiles }) {
  const { t } = useLanguage();
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);

  function handleDragOver(e) {
    e.preventDefault();
    setIsDragOver(true);
  }

  function handleDragLeave() {
    setIsDragOver(false);
  }

  function handleDrop(e) {
    e.preventDefault();
    setIsDragOver(false);
    onFiles(Array.from(e.dataTransfer.files));
  }

  function handleClick() {
    fileInputRef.current?.click();
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' || e.key === ' ') {
      fileInputRef.current?.click();
    }
  }

  function handleFileChange(e) {
    onFiles(Array.from(e.target.files));
    e.target.value = '';
  }

  return (
    <>
      <div
        className={`drop-zone${isDragOver ? ' drag-over' : ''}`}
        role="button"
        tabIndex={0}
        aria-label={t.dropZoneLabel}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
      >
        <i className="ti ti-file-upload" aria-hidden="true" />
        {t.dropZonePre} <strong>.svg</strong> {t.dropZoneMid} <strong>.odt · .odp · .docx · .pptx</strong> {t.dropZonePost}
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept=".svg,image/svg+xml,.odt,.odp,.ods,.docx,.pptx,.xlsx"
        multiple
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />
    </>
  );
}
