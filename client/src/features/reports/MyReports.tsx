import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuth } from '../../services/auth.context';
import { StatusBadge } from '../../components/common/StatusBadge';
import { PriorityBadge } from '../../components/common/PriorityBadge';
import { CategoryIcon } from '../../components/common/CategoryIcon';
import { LoadingState } from '../../components/common/LoadingState';
import { EmptyState } from '../../components/common/EmptyState';
import { Report } from '../../types';
import {
  FileText,
  MapPin,
  Calendar,
  Trash2,
  Edit2,
  ExternalLink,
  PlusCircle,
  Check,
  X,
} from 'lucide-react';

export const MyReports: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [editingReportId, setEditingReportId] = useState<string | null>(null);
  const [editDescription, setEditDescription] = useState<string>('');

  const { data: reportsData, isLoading } = useQuery({
    queryKey: ['my-reports'],
    queryFn: () => api.getMyReports(),
    enabled: !!user,
  });

  const reports = reportsData?.data || [];

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteReport(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-reports'] });
      queryClient.invalidateQueries({ queryKey: ['issues'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, description }: { id: string; description: string }) =>
      api.updateReport(id, { description }),
    onSuccess: () => {
      setEditingReportId(null);
      queryClient.invalidateQueries({ queryKey: ['my-reports'] });
      queryClient.invalidateQueries({ queryKey: ['issues'] });
    },
  });

  const handleDelete = (id: string) => {
    if (confirm(t('myReports.deleteConfirm'))) {
      deleteMutation.mutate(id);
    }
  };

  const handleStartEdit = (report: Report) => {
    setEditingReportId(report.id);
    setEditDescription(report.description);
  };

  const handleSaveEdit = (id: string) => {
    if (!editDescription.trim()) return;
    updateMutation.mutate({ id, description: editDescription });
  };

  if (!user) {
    return (
      <div className="app-container" style={{ padding: 'var(--space-12) var(--space-4)' }}>
        <EmptyState
          title="Sign in required"
          description="Please sign in to view and manage your submitted reports."
        />
      </div>
    );
  }

  return (
    <div className="app-container" style={{ padding: 'var(--space-6) var(--space-4)', maxWidth: '900px' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 'var(--space-6)',
          gap: 'var(--space-3)',
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '4px' }}>
            {t('myReports.title')}
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            {t('myReports.subtitle')}
          </p>
        </div>

        <Link to="/reports/new" className="btn btn-primary" style={{ gap: '6px' }}>
          <PlusCircle size={16} />
          <span>{t('nav.report')}</span>
        </Link>
      </div>

      {isLoading ? (
        <LoadingState />
      ) : reports.length === 0 ? (
        <EmptyState
          icon={<FileText size={48} />}
          title={t('myReports.noReports')}
          description="You can report road damage, lighting issues, waste, and more to help improve your neighborhood."
          action={
            <Link to="/reports/new" className="btn btn-primary">
              <PlusCircle size={16} />
              <span>{t('myReports.reportNew')}</span>
            </Link>
          }
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {reports.map((report) => {
            const isEditing = editingReportId === report.id;

            return (
              <div
                key={report.id}
                className="card"
                style={{ padding: 'var(--space-5)', backgroundColor: 'var(--bg-surface-elevated)' }}
              >
                {/* Linked Problem Header */}
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '8px',
                    marginBottom: 'var(--space-3)',
                    paddingBottom: 'var(--space-3)',
                    borderBottom: '1px solid var(--border-subtle)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CategoryIcon
                      slug={report.category?.slug}
                      size={16}
                      style={{ color: 'var(--accent-primary)' }}
                    />
                    <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                      {report.category?.name}
                    </span>
                  </div>

                  {report.issue && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <StatusBadge status={report.issue.status} />
                      {report.issue.priority && <PriorityBadge priority={report.issue.priority} />}
                    </div>
                  )}
                </div>

                {/* Linked Issue Title */}
                {report.issue && (
                  <Link
                    to={`/issues/${report.issue_id}`}
                    style={{
                      fontSize: '1.0625rem',
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                      marginBottom: '8px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <span>{report.issue.title}</span>
                    <ExternalLink size={14} style={{ color: 'var(--accent-primary)' }} />
                  </Link>
                )}

                {/* Citizen Report Description / Editing */}
                {isEditing ? (
                  <div style={{ marginTop: '8px', marginBottom: '12px' }}>
                    <textarea
                      rows={3}
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-default)',
                        backgroundColor: 'var(--bg-surface)',
                        fontSize: '0.875rem',
                      }}
                    />
                    <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                      <button
                        onClick={() => handleSaveEdit(report.id)}
                        disabled={updateMutation.isPending}
                        className="btn btn-primary"
                        style={{ padding: '6px 12px', fontSize: '0.8125rem' }}
                      >
                        <Check size={14} />
                        <span>{t('common.save')}</span>
                      </button>
                      <button
                        onClick={() => setEditingReportId(null)}
                        className="btn btn-subtle"
                        style={{ padding: '6px 12px', fontSize: '0.8125rem' }}
                      >
                        <X size={14} />
                        <span>{t('common.cancel')}</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <p
                    style={{
                      fontSize: '0.9375rem',
                      color: 'var(--text-secondary)',
                      marginBottom: 'var(--space-3)',
                      lineHeight: 1.5,
                    }}
                  >
                    {report.description}
                  </p>
                )}

                {/* Optional Image */}
                {report.image_url && (
                  <div style={{ maxWidth: '240px', borderRadius: 'var(--radius-md)', overflow: 'hidden', marginBottom: 'var(--space-3)' }}>
                    <img
                      src={report.image_url}
                      alt="Citizen report evidence"
                      style={{ width: '100%', height: 'auto', maxHeight: '160px', objectFit: 'cover' }}
                    />
                  </div>
                )}

                {/* Footer Controls: Coords, Date, Edit, Delete */}
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '0.75rem',
                    color: 'var(--text-tertiary)',
                    borderTop: '1px solid var(--border-subtle)',
                    paddingTop: '8px',
                    gap: '8px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <MapPin size={13} style={{ color: 'var(--accent-primary)' }} />
                      {Number(report.latitude).toFixed(4)}, {Number(report.longitude).toFixed(4)}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Calendar size={13} />
                      {new Date(report.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {!isEditing && (
                      <button
                        onClick={() => handleStartEdit(report)}
                        className="btn-icon"
                        title={t('myReports.edit')}
                        style={{ padding: '4px 6px', fontSize: '0.75rem' }}
                      >
                        <Edit2 size={14} />
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(report.id)}
                      disabled={deleteMutation.isPending}
                      className="btn-icon"
                      title={t('myReports.delete')}
                      style={{ padding: '4px 6px', color: 'var(--status-rejected)' }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
