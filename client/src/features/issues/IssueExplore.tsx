import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ChevronRight, FileText, List as ListIcon, Map as MapIcon, Search, Users } from 'lucide-react';
import { api } from '../../services/api';
import { Issue, IssueStatus } from '../../types';
import { LeafletMap } from '../../components/map/LeafletMap';
import { CategoryIcon } from '../../components/common/CategoryIcon';
import { EmptyState } from '../../components/common/EmptyState';
import { LoadingState } from '../../components/common/LoadingState';
import { PriorityBadge } from '../../components/common/PriorityBadge';
import { StatusBadge } from '../../components/common/StatusBadge';
import '../../styles/explore.css';

const statuses: IssueStatus[] = ['submitted', 'in_review', 'accepted', 'in_progress', 'resolved', 'rejected'];

export const IssueExplore: React.FC = () => {
  const { t } = useTranslation();
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<IssueStatus | ''>('');
  const [viewMode, setViewMode] = useState<'both' | 'map' | 'list'>('both');

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.getCategories(),
  });

  const { data: issuesData, isLoading } = useQuery({
    queryKey: ['issues', selectedStatus, selectedCategoryId, searchQuery],
    queryFn: () => api.getIssues({
      status: selectedStatus || undefined,
      category_id: selectedCategoryId || undefined,
      search: searchQuery || undefined,
      limit: 50,
    }),
  });

  const issues = issuesData?.data || [];
  const showMap = viewMode !== 'list';
  const showList = viewMode !== 'map';

  return (
    <div className={`explore-page view-${viewMode}`}>
      <div className="explore-toolbar">
        <label className="explore-search">
          <span className="sr-only">{t('explore.searchPlaceholder')}</span>
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder={t('explore.searchPlaceholder')}
          />
          <Search size={16} aria-hidden="true" />
        </label>

        <div className="explore-filters">
          <select value={selectedCategoryId} onChange={(event) => setSelectedCategoryId(event.target.value)} aria-label={t('explore.allCategories')}>
            <option value="">{t('explore.allCategories')}</option>
            {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
          </select>

          <select value={selectedStatus} onChange={(event) => setSelectedStatus(event.target.value as IssueStatus | '')} aria-label={t('explore.allStatuses')}>
            <option value="">{t('explore.allStatuses')}</option>
            {statuses.map((status) => <option key={status} value={status}>{t(`status.${status}`)}</option>)}
          </select>

          <button type="button" className="btn btn-secondary view-mode-toggle" onClick={() => setViewMode(viewMode === 'map' ? 'list' : 'map')} aria-label={viewMode === 'map' ? t('explore.viewList') : t('explore.viewMap')}>
            {viewMode === 'map' ? <ListIcon size={16} /> : <MapIcon size={16} />}
            <span>{viewMode === 'map' ? t('explore.viewList') : t('explore.viewMap')}</span>
          </button>
        </div>
      </div>

      <div className="explore-content">
        {showList && (
          <aside className="issue-sidebar" aria-label={t('explore.issuesCount', { count: issues.length })}>
            <div className="issue-count">{t('explore.issuesCount', { count: issues.length })}</div>
            {isLoading ? <LoadingState /> : issues.length === 0 ? (
              <div className="empty-panel">
                <EmptyState title={t('explore.noIssuesFound')} description="Try clearing search filters or report a new problem in your area." />
              </div>
            ) : (
              <div>{issues.map((issue) => <IssueCard key={issue.id} issue={issue} selected={selectedIssue?.id === issue.id} onSelect={() => setSelectedIssue(issue)} />)}</div>
            )}
          </aside>
        )}

        {showMap && (
          <div className="map-view-container">
            <LeafletMap issues={issues} selectedIssue={selectedIssue} onSelectIssue={setSelectedIssue} />
          </div>
        )}
      </div>
    </div>
  );
};

interface IssueCardProps {
  issue: Issue;
  selected: boolean;
  onSelect: () => void;
}

function IssueCard({ issue, selected, onSelect }: IssueCardProps) {
  return (
    <article className={`issue-card${selected ? ' is-selected' : ''}`} onClick={onSelect}>
      <div className="issue-card-heading">
        <div className="issue-category"><CategoryIcon slug={issue.category?.slug} size={14} /><span>{issue.category?.name}</span></div>
        <StatusBadge status={issue.status} />
      </div>
      <h2>{issue.title}</h2>
      {issue.summary && <p>{issue.summary}</p>}
      <div className="issue-card-footer">
        <div className="issue-metadata">
          <span title="Reports"><FileText size={13} />{issue.report_count}</span>
          <span title="Supporters"><Users size={13} />{issue.supporter_count || 0}</span>
          <PriorityBadge priority={issue.priority} />
        </div>
        <Link to={`/issues/${issue.id}`} onClick={(event) => event.stopPropagation()} className="btn-icon" aria-label="View full details">
          <ChevronRight size={16} />
        </Link>
      </div>
    </article>
  );
}
