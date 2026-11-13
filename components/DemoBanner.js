import { useState } from 'react';

const NOTICE =
  'Demo: sample data stored only in your browser (no account, no database). AI recommendations show static examples ' +
  'because the free Google Gemini key has probably expired, and image uploads are disabled.';

/** Small dismissible notice shown to guests of the demo account. */
export default function DemoBanner() {
  // Rendered only after the client-side auth check (see withAuth), so reading sessionStorage here is safe.
  const [visible, setVisible] = useState(() => {
    try {
      return sessionStorage.getItem('demoBannerDismissed') !== '1';
    } catch {
      return true;
    }
  });

  if (!visible) return null;

  const dismiss = () => {
    try {
      sessionStorage.setItem('demoBannerDismissed', '1');
    } catch {}
    setVisible(false);
  };

  return (
    <div
      role="status"
      style={{
        position: 'fixed',
        left: 12,
        right: 12,
        bottom: 12,
        zIndex: 10000,
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
        maxWidth: 720,
        margin: '0 auto',
        padding: '10px 14px',
        borderRadius: 10,
        background: '#14532d',
        color: '#ffffff',
        fontSize: 14,
        lineHeight: 1.4,
        boxShadow: '0 4px 18px rgba(0,0,0,0.25)',
      }}
    >
      <span style={{ flex: 1 }}>{NOTICE}</span>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss demo notice"
        style={{ background: 'transparent', border: 0, color: '#ffffff', fontSize: 20, lineHeight: 1, cursor: 'pointer', minWidth: 32, minHeight: 32 }}
      >
        ×
      </button>
    </div>
  );
}
