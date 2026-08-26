import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../services/auth.context';
import { LanguageSwitcher } from '../common/LanguageSwitcher';
import { ThemeToggle } from '../common/ThemeToggle';
import { AuthModal } from '../../features/auth/AuthModal';
import {
  MapPin,
  PlusCircle,
  Shield,
  Layers,
  FileText,
  User,
  LogOut,
  Menu,
  X,
} from 'lucide-react';

export const AppHeader: React.FC = () => {
  const { t } = useTranslation();
  const { user, role, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isActive = (path: string) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  const isAdminRoute = location.pathname.startsWith('/admin');

  return (
    <>
      {role === 'admin' && isAdminRoute && (
        <div style={{ backgroundColor: 'var(--status-resolved)', color: 'white', padding: '4px 16px', fontSize: '0.75rem', fontWeight: 600, textAlign: 'center', letterSpacing: '0.05em' }}>
          ADMINISTRATOR PORTAL
        </div>
      )}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 1000,
          backgroundColor: 'var(--bg-surface)',
          borderBottom: '1px solid var(--border-default)',
          backdropFilter: 'blur(8px)',
        }}
      >
        <div
          className="app-container"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: '64px',
          }}
        >
          {/* Logo & Brand Identity */}
          <Link
            to="/"
            className="site-brand"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontWeight: 700,
              fontSize: '1.25rem',
              color: 'var(--text-primary)',
            }}
          >
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--accent-primary)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <MapPin size={20} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ lineHeight: 1.1 }}>{t('app.name')}</span>
              <span className="site-tagline"
                style={{
                  fontSize: '0.6875rem',
                  fontWeight: 500,
                  color: 'var(--text-tertiary)',
                  letterSpacing: '0.02em',
                }}
              >
                {t('app.tagline')}
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav
            style={{
              display: 'none',
              alignItems: 'center',
              gap: 'var(--space-2)',
            }}
            className="desktop-nav"
          >
            <Link
              to="/"
              className={`btn ${isActive('/') && location.pathname === '/' ? 'btn-secondary' : 'btn-subtle'}`}
              style={{ fontSize: '0.875rem' }}
            >
              <Layers size={16} />
              <span>{t('nav.explore')}</span>
            </Link>

            {user && (
              <Link
                to="/my-reports"
                className={`btn ${isActive('/my-reports') ? 'btn-secondary' : 'btn-subtle'}`}
                style={{ fontSize: '0.875rem' }}
              >
                <FileText size={16} />
                <span>{t('nav.myReports')}</span>
              </Link>
            )}

            {role === 'admin' && (
              <Link
                to="/admin"
                className={`btn ${isActive('/admin') ? 'btn-secondary' : 'btn-subtle'}`}
                style={{
                  fontSize: '0.875rem',
                  color: 'var(--accent-primary)',
                  fontWeight: 600,
                }}
              >
                <Shield size={16} />
                <span>{t('nav.admin')}</span>
              </Link>
            )}
          </nav>

          {/* Header Action Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            {/* New Report Wizard Primary CTA */}
            <Link
              to="/reports/new"
              className="btn btn-primary"
              style={{
                padding: '8px 14px',
                fontSize: '0.875rem',
                fontWeight: 600,
              }}
            >
              <PlusCircle size={16} />
              <span>{t('nav.report')}</span>
            </Link>

            {/* Language & Theme switchers */}
            <LanguageSwitcher />
            <div className="mobile-hide-theme"><ThemeToggle /></div>

            {/* User Profile / Auth Action */}
            {user ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    backgroundColor: 'var(--bg-surface-subtle)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-default)',
                    fontSize: '0.8125rem',
                  }}
                >
                  <User size={14} style={{ color: 'var(--text-secondary)' }} />
                  <span style={{ fontWeight: 500 }}>
                    {user.display_name || user.email.split('@')[0]}
                  </span>
                  {role === 'admin' && (
                    <span
                      style={{
                        fontSize: '0.6875rem',
                        backgroundColor: 'var(--accent-primary)',
                        color: 'white',
                        padding: '1px 5px',
                        borderRadius: '4px',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                      }}
                    >
                      Admin
                    </span>
                  )}
                </div>
                <button
                  onClick={signOut}
                  className="btn-icon"
                  title={t('nav.logout')}
                  aria-label="Sign out"
                >
                  <LogOut size={16} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsAuthOpen(true)}
                className="btn btn-secondary"
                data-mobile-auth="header"
                style={{ fontSize: '0.875rem' }}
              >
                <User size={16} />
                <span>{t('nav.login')}</span>
              </button>
            )}

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="btn-icon mobile-menu-btn"
              aria-label="Toggle navigation menu"
              style={{ display: 'none' }}
            >
              {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {isMobileMenuOpen && (
          <div
            style={{
              padding: 'var(--space-4)',
              backgroundColor: 'var(--bg-surface-elevated)',
              borderTop: '1px solid var(--border-default)',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-2)',
            }}
          >
            <Link
              to="/"
              onClick={() => setIsMobileMenuOpen(false)}
              className="btn btn-subtle"
              style={{ justifyContent: 'flex-start' }}
            >
              <Layers size={18} />
              <span>{t('nav.explore')}</span>
            </Link>
            {user && (
              <Link
                to="/my-reports"
                onClick={() => setIsMobileMenuOpen(false)}
                className="btn btn-subtle"
                style={{ justifyContent: 'flex-start' }}
              >
                <FileText size={18} />
                <span>{t('nav.myReports')}</span>
              </Link>
            )}
            {role === 'admin' && (
              <Link
                to="/admin"
                onClick={() => setIsMobileMenuOpen(false)}
                className="btn btn-subtle"
                style={{ justifyContent: 'flex-start', color: 'var(--accent-primary)' }}
              >
                <Shield size={18} />
                <span>{t('nav.admin')}</span>
              </Link>
            )}
            {!user && (
              <button
                onClick={() => { setIsAuthOpen(true); setIsMobileMenuOpen(false); }}
                className="btn btn-secondary"
                style={{ justifyContent: 'flex-start' }}
              >
                <User size={18} />
                <span>{t('nav.login')}</span>
              </button>
            )}
          </div>
        )}
      </header>

      {/* Auth Modal */}
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />

      <style>{`
        @media (min-width: 768px) {
          .desktop-nav {
            display: flex !important;
          }
        }
        @media (max-width: 767px) {
          .mobile-menu-btn {
            display: flex !important;
          }
          .site-tagline,
          .mobile-hide-theme,
          [data-mobile-auth='header'] {
            display: none !important;
          }
          .site-brand {
            flex: 0 0 auto;
          }
        }
      `}</style>
    </>
  );
};
