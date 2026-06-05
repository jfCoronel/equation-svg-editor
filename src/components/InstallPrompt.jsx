import { useState, useEffect } from 'react';
import { useLanguage } from '../i18n/LanguageContext';

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [visible, setVisible] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setVisible(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  async function install() {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setVisible(false);
    setDeferredPrompt(null);
  }

  if (!visible) return null;

  return (
    <div className="install-prompt">
      <span className="ti ti-download" />
      <span>{t.installApp}</span>
      <button onClick={install} className="install-btn">{t.install}</button>
      <button onClick={() => setVisible(false)} className="install-dismiss" aria-label="Cerrar">
        <span className="ti ti-x" />
      </button>
    </div>
  );
}
