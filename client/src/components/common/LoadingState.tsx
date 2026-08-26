import React from 'react';
import { Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const LoadingState: React.FC<{ message?: string }> = ({ message }) => {
  const { t } = useTranslation();
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-12) var(--space-4)',
        gap: 'var(--space-3)',
        color: 'var(--text-secondary)',
      }}
    >
      <Loader2 size={32} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
      <p style={{ fontSize: '0.9375rem' }}>{message || t('common.loading')}</p>
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};
