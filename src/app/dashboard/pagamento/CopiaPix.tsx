'use client';

import { useState } from 'react';

export default function CopiaPix({ chave }: { chave: string }) {
  const [copiado, setCopiado] = useState(false);

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(chave);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    } catch {
      // Fallback para dispositivos sem clipboard API
      const el = document.createElement('textarea');
      el.value = chave;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    }
  };

  return (
    <div style={{ position: 'relative' }}>
      <div
        style={{
          backgroundColor: 'var(--background)',
          padding: '1rem',
          borderRadius: '8px',
          fontFamily: 'monospace',
          fontSize: '1rem',
          color: 'var(--primary)',
          border: '1px dashed var(--primary)',
          userSelect: 'all',
          wordBreak: 'break-all',
          marginBottom: '0.5rem',
        }}
      >
        {chave}
      </div>
      <button
        onClick={copiar}
        style={{
          width: '100%',
          padding: '0.75rem',
          borderRadius: '8px',
          background: copiado ? 'rgba(16, 185, 129, 0.2)' : 'rgba(16, 185, 129, 0.1)',
          border: `1px solid ${copiado ? 'var(--primary)' : 'rgba(16, 185, 129, 0.3)'}`,
          color: 'var(--primary)',
          fontWeight: 700,
          fontSize: '0.875rem',
          cursor: 'pointer',
          transition: 'all 0.2s',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem',
          minHeight: '48px',
        }}
      >
        {copiado ? '✅ Chave copiada!' : '📋 Toque para copiar a chave PIX'}
      </button>
    </div>
  );
}
