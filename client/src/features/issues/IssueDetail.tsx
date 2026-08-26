import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { api } from '../../services/api';
import { useAuth } from '../../services/auth.context';
import { StatusBadge } from '../../components/common/StatusBadge';
import { PriorityBadge } from '../../components/common/PriorityBadge';
import { CategoryIcon } from '../../components/common/CategoryIcon';
import { LoadingState } from '../../components/common/LoadingState';
import { EmptyState } from '../../components/common/EmptyState';
import { AuthModal } from '../auth/AuthModal';
import {
  ArrowLeft,
  MapPin,
  Heart,
  FileText,
  Calendar,
  Clock,
  User,
  ExternalLink,
  CheckCircle2,
} from 'lucide-react';

export const IssueDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  const { data: issue, isLoading, error } = useQuery({
    queryKey: ['issue', id],
    queryFn: () => api.getIssueById(id!),
    enabled: !!id,
  });

  const supportMutation = useMutation({
    mutationFn: async () => {
      if (!issue) return;
      if (issue.has_supported) {
        return api.unsupportIssue(issue.id);
      } else {
        return api.supportIssue(issue.id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['issue', id] });
      queryClient.invalidateQueries({ queryKey: ['issues'] });
    },
  });

  const handleToggleSupport = () => {
    if (!user) {
      setIsAuthOpen(true);
      return;
    }
    supportMutation.mutate();
  };

  if (isLoading) return <LoadingState />;
  if (error || !issue) {
    return (
      <div className="app-container" style={{ padding: 'var(--space-12) var(--space-4)' }}>
        <EmptyState
          title="Issue Not Found"
          description="The requested issue does not exist or may have been removed."
          action={
            <Link to="/" className="btn btn-primary">
              <ArrowLeft size={16} />
              <span>{t('nav.explore')}</span>
            </Link>
          }
        />
      </div>
    );
  }

  const reports = issue.reports || [];
  const history = issue.history || [];

  return (
    <div className="app-container" style={{ padding: 'var(--space-6) var(--space-4)', maxWidth: '1000px' }}>
      {/* Top Breadcrumb & Action bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 'var(--space-6)',
          gap: 'var(--space-3)',
        }}
      >
        <Link
          to="/"
          className="btn btn-subtle"
          style={{ paddingInlineStart: 0, gap: '6px' }}
        >
          <ArrowLeft size={16} />
          <span>{t('nav.explore')}</span>
        </Link>

        {/* Support Action CTA */}
        <button
          onClick={handleToggleSupport}
          className={`btn ${issue.has_supported ? 'btn-primary' : 'btn-secondary'}`}
          disabled={supportMutation.isPending}
          style={{ gap: '8px', padding: '10px 18px' }}
        >
          <Heart
            size={18}
            fill={issue.has_supported ? 'currentColor' : 'none'}
            style={{ color: issue.has_supported ? '#ffffff' : '#e11d48' }}
          />
          <span style={{ fontWeight: 600 }}>
            {issue.has_supported ? t('issue.supportedAction') : t('issue.supportAction')}
          </span>
          <span
            style={{
              padding: '2px 7px',
              backgroundColor: 'rgba(0, 0, 0, 0.12)',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.8125rem',
            }}
          >
            {issue.supporter_count || 0}
          </span>
        </button>
      </div>

      {/* Main Issue Header Card */}
      <div className="card" style={{ padding: 'var(--space-6)', marginBottom: 'var(--space-6)' }}>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 'var(--space-3)',
            marginBottom: 'var(--space-4)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CategoryIcon
              slug={issue.category?.slug}
              size={18}
              style={{ color: 'var(--accent-primary)' }}
            />
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              {issue.category?.name}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <StatusBadge status={issue.status} />
            <PriorityBadge priority={issue.priority} />
          </div>
        </div>

        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: 'var(--space-3)', lineHeight: 1.25 }}>
          {issue.title}
        </h1>

        {issue.summary && (
          <p style={{ fontSize: '1.0625rem', color: 'var(--text-secondary)', marginBottom: 'var(--space-4)', lineHeight: 1.6 }}>
            {issue.summary}
          </p>
        )}

        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 'var(--space-4)',
            paddingTop: 'var(--space-4)',
            borderTop: '1px solid var(--border-default)',
            fontSize: '0.875rem',
            color: 'var(--text-secondary)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <MapPin size={16} style={{ color: 'var(--accent-primary)' }} />
            <span>
              {Number(issue.latitude).toFixed(6)}, {Number(issue.longitude).toFixed(6)}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <FileText size={16} />
            <span>{t('issue.reportsCount', { count: issue.report_count })}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Calendar size={16} />
            <span>{new Date(issue.created_at).toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      {/* Two Column Section: Timeline & Citizen Reports */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 'var(--space-6)' }}>
        {/* Status Lifecycle Timeline */}
        <div className="card" style={{ padding: 'var(--space-6)' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Clock size={18} style={{ color: 'var(--accent-primary)' }} />
            <span>{t('issue.statusTimeline')}</span>
          </h3>

          {history.length === 0 ? (
            <p style={{ fontSize: '0.875rem', color: 'var(--text-tertiary)' }}>
              No status updates recorded yet.
            </p>
          ) : (
            <div style={{ position: 'relative', paddingInlineStart: '24px' }}>
              <div
                style={{
                  position: 'absolute',
                  top: '8px',
                  bottom: '8px',
                  insetInlineStart: '7px',
                  width: '2px',
                  backgroundColor: 'var(--border-default)',
                }}
              />
              {history.map((h, idx) => (
                <div key={h.id || idx} style={{ position: 'relative', marginBottom: 'var(--space-4)' }}>
                  <div
                    style={{
                      position: 'absolute',
                      top: '4px',
                      insetInlineStart: '-24px',
                      width: '16px',
                      height: '16px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--accent-primary)',
                      border: '3px solid var(--bg-surface)',
                    }}
                  />
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <StatusBadge status={h.to_status} />
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                      {new Date(h.created_at).toLocaleString()}
                    </span>
                  </div>
                  {h.note && (
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                      {h.note}
                    </p>
                  )}
                  {h.changed_by && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                      Updated by {h.changed_by.display_name || 'Admin'}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Attached Citizen Reports List */}
        <div className="card" style={{ padding: 'var(--space-6)' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={18} style={{ color: 'var(--accent-primary)' }} />
            <span>{t('issue.citizenReports')}</span>
            <span
              style={{
                fontSize: '0.8125rem',
                backgroundColor: 'var(--bg-surface-subtle)',
                padding: '2px 8px',
                borderRadius: 'var(--radius-full)',
                color: 'var(--text-secondary)',
              }}
            >
              {reports.length}
            </span>
          </h3>

          {reports.length === 0 ? (
            <p style={{ fontSize: '0.875rem', color: 'var(--text-tertiary)' }}>
              {t('issue.noReports')}
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              {reports.map((report) => (
                <div
                  key={report.id}
                  style={{
                    padding: 'var(--space-4)',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--bg-surface-subtle)',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '8px',
                      fontSize: '0.8125rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 500 }}>
                      <User size={14} style={{ color: 'var(--text-secondary)' }} />
                      <span>{report.user?.display_name || 'Citizen'}</span>
                    </div>
                    <span style={{ color: 'var(--text-tertiary)' }}>
                      {new Date(report.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  <p style={{ fontSize: '0.875rem', color: 'var(--text-primary)', marginBottom: '8px', lineHeight: 1.5 }}>
                    {report.description}
                  </p>

                  {report.image_url && (
                    <div style={{ marginTop: '8px', maxWidth: '320px', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                      <img
                        src={report.image_url}
                        alt="Report observation evidence"
                        style={{ width: '100%', height: 'auto', maxHeight: '200px', objectFit: 'cover' }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
    </div>
  );
};
