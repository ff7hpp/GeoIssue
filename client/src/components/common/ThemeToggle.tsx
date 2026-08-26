import React from 'react';
import { useTheme } from '../../services/theme.context';
import { Sun, Moon, Laptop } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const ThemeToggle: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const { t } = useTranslation();

  const cycleTheme = () => {
    if (theme === 'light') setTheme('dark');
    else if (theme === 'dark') setTheme('system');
    else setTheme('light');
  };

  const getIcon = () => {
    if (theme === 'light') return <Sun size={16} />;
    if (theme === 'dark') return <Moon size={16} />;
    return <Laptop size={16} />;
  };

  return (
    <button
      onClick={cycleTheme}
      className="btn-icon"
      style={{
        border: '1px solid var(--border-default)',
        backgroundColor: 'var(--bg-surface)',
        padding: '7px 9px',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
      }}
      title={`Theme: ${t('theme.' + theme)} (Click to switch)`}
      aria-label="Toggle visual theme"
    >
      {getIcon()}
      <span style={{ fontSize: '0.8125rem', textTransform: 'capitalize' }}>
        {t('theme.' + theme)}
      </span>
    </button>
  );
};
