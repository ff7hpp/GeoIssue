import React, { useState } from 'react';
import { useAuth } from '../../services/auth.context';
import { useTranslation } from 'react-i18next';
import { X, ShieldAlert, UserCheck, Mail, Lock, User as UserIcon } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'login',
}) => {
  const { signInWithDemo, signInWithCustomToken } = useAuth();
  const { t } = useTranslation();
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (!email || !password) {
        throw new Error('Please provide email and password');
      }

      // Generate dev / firebase simulated token for seamless demo
      const token = `usr_${email.replace(/[^a-zA-Z0-9]/g, '_')}`;
      await signInWithCustomToken(token, email, displayName);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDemoSignIn = async (role: 'admin' | 'user') => {
    setError(null);
    setIsSubmitting(true);
    try {
      await signInWithDemo(role);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Demo sign in failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-4)',
        zIndex: 5000,
      }}
      onClick={onClose}
    >
      <div
        className="card animate-fade-in"
        style={{
          width: '100%',
          maxWidth: '440px',
          backgroundColor: 'var(--bg-surface-elevated)',
          padding: 'var(--space-6)',
          position: 'relative',
          boxShadow: 'var(--shadow-overlay)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="btn-icon"
          style={{ position: 'absolute', top: '16px', insetInlineEnd: '16px' }}
          aria-label="Close modal"
        >
          <X size={20} />
        </button>

        <h2 style={{ fontSize: '1.4rem', fontWeight: 600, marginBottom: '4px' }}>
          {mode === 'login' ? t('auth.signInTitle') : t('auth.signUpTitle')}
        </h2>
        <p style={{ fontSize: '0.875rem', marginBottom: 'var(--space-6)', color: 'var(--text-secondary)' }}>
          {mode === 'login' ? t('auth.signInSubtitle') : t('auth.signUpSubtitle')}
        </p>

        {error && (
          <div
            style={{
              padding: '10px 14px',
              backgroundColor: 'var(--status-rejected-bg)',
              color: 'var(--status-rejected)',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.875rem',
              marginBottom: 'var(--space-4)',
            }}
          >
            {error}
          </div>
        )}

        {/* Quick 1-Click Demo Accounts Section */}
        <div
          style={{
            padding: '12px',
            backgroundColor: 'var(--bg-surface-subtle)',
            borderRadius: 'var(--radius-md)',
            marginBottom: 'var(--space-6)',
            border: '1px solid var(--border-default)',
          }}
        >
          <div
            style={{
              fontSize: '0.75rem',
              fontWeight: 600,
              color: 'var(--text-secondary)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '8px',
            }}
          >
            {t('auth.demoAccounts')}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <button
              type="button"
              onClick={() => handleDemoSignIn('user')}
              className="btn btn-secondary"
              style={{ fontSize: '0.8125rem', padding: '8px 10px' }}
              disabled={isSubmitting}
            >
              <UserCheck size={16} />
              <span>{t('auth.demoUser')}</span>
            </button>
            <button
              type="button"
              onClick={() => handleDemoSignIn('admin')}
              className="btn btn-secondary"
              style={{ fontSize: '0.8125rem', padding: '8px 10px' }}
              disabled={isSubmitting}
            >
              <ShieldAlert size={16} />
              <span>{t('auth.demoAdmin')}</span>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {mode === 'register' && (
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, marginBottom: '6px' }}>
                {t('auth.displayName')}
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. Layla Al-Hassan"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    paddingInlineStart: '36px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-default)',
                    backgroundColor: 'var(--bg-surface)',
                  }}
                />
                <UserIcon
                  size={16}
                  style={{
                    position: 'absolute',
                    top: '50%',
                    insetInlineStart: '12px',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-tertiary)',
                  }}
                />
              </div>
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, marginBottom: '6px' }}>
              {t('auth.email')}
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="citizen@example.com"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  paddingInlineStart: '36px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-default)',
                  backgroundColor: 'var(--bg-surface)',
                }}
              />
              <Mail
                size={16}
                style={{
                  position: 'absolute',
                  top: '50%',
                  insetInlineStart: '12px',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-tertiary)',
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, marginBottom: '6px' }}>
              {t('auth.password')}
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  paddingInlineStart: '36px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-default)',
                  backgroundColor: 'var(--bg-surface)',
                }}
              />
              <Lock
                size={16}
                style={{
                  position: 'absolute',
                  top: '50%',
                  insetInlineStart: '12px',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-tertiary)',
                }}
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={isSubmitting}
            style={{ width: '100%', padding: '12px', marginTop: 'var(--space-2)' }}
          >
            {isSubmitting
              ? t('common.loading')
              : mode === 'login'
              ? t('auth.signInButton')
              : t('auth.signUpButton')}
          </button>
        </form>

        <div style={{ marginTop: 'var(--space-4)', textAlign: 'center', fontSize: '0.875rem' }}>
          {mode === 'login' ? (
            <span>
              {t('auth.noAccount')}{' '}
              <button
                type="button"
                onClick={() => setMode('register')}
                style={{ color: 'var(--accent-primary)', fontWeight: 600, textDecoration: 'underline' }}
              >
                {t('auth.signUpButton')}
              </button>
            </span>
          ) : (
            <span>
              {t('auth.haveAccount')}{' '}
              <button
                type="button"
                onClick={() => setMode('login')}
                style={{ color: 'var(--accent-primary)', fontWeight: 600, textDecoration: 'underline' }}
              >
                {t('auth.signInButton')}
              </button>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
