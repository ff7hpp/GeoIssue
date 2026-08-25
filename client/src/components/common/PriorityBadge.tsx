import React from 'react';
import { useTranslation } from 'react-i18next';
import { IssuePriority } from '../../types';

interface PriorityBadgeProps {
  priority: IssuePriority;
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority }) => {
  const { t } = useTranslation();

  const getStyle = () => {
    switch (priority) {
      case 'urgent':
        return { color: 'var(--priority-urgent)', backgroundColor: 'rgba(225, 29, 72, 0.12)' };
      case 'high':
        return { color: 'var(--priority-high)', backgroundColor: 'rgba(217, 119, 6, 0.12)' };
      case 'medium':
        return { color: 'var(--priority-medium)', backgroundColor: 'rgba(37, 99, 235, 0.12)' };
      case 'low':
      default:
        return { color: 'var(--priority-low)', backgroundColor: 'rgba(113, 113, 122, 0.12)' };
    }
  };

  return (
    <span
      style={{
        ...getStyle(),
        padding: '2px 8px',
        borderRadius: 'var(--radius-full)',
        fontSize: '0.75rem',
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.04em',
      }}
    >
      {t(`priority.${priority}`)}
    </span>
  );
};
