import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { ChevronRight, FileText, List as ListIcon, Map as MapIcon, Search, Users } from "lucide-react";
import { api } from "../../services/api";
import { LeafletMap } from "../../components/map/LeafletMap";
import { CategoryIcon } from "../../components/common/CategoryIcon";
import { EmptyState } from "../../components/common/EmptyState";
import { LoadingState } from "../../components/common/LoadingState";
import { PriorityBadge } from "../../components/common/PriorityBadge";
import { StatusBadge } from "../../components/common/StatusBadge";
import "../../styles/explore.css";
const DEFAULT_CATEGORIES = [
  { id: "c1000000-0000-0000-0000-000000000001", name: "Road & Potholes", slug: "road-potholes", icon: "Construction", is_active: true, created_at: "" },
  { id: "c1000000-0000-0000-0000-000000000002", name: "Street Lighting", slug: "street-lighting", icon: "Lightbulb", is_active: true, created_at: "" },
  { id: "c1000000-0000-0000-0000-000000000003", name: "Waste & Sanitation", slug: "waste-sanitation", icon: "Trash2", is_active: true, created_at: "" },
  { id: "c1000000-0000-0000-0000-000000000004", name: "Sidewalks & Walkways", slug: "sidewalks", icon: "Footprints", is_active: true, created_at: "" },
  { id: "c1000000-0000-0000-0000-000000000005", name: "Water & Drainage", slug: "water-drainage", icon: "Droplets", is_active: true, created_at: "" },
  { id: "c1000000-0000-0000-0000-000000000006", name: "Public Parks & Trees", slug: "parks-trees", icon: "Trees", is_active: true, created_at: "" }
];
const statuses = ["submitted", "in_review", "accepted", "in_progress", "resolved", "rejected"];
const IssueExplore = () => {
  const { t } = useTranslation();
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [viewMode, setViewMode] = useState("both");
  const { data: serverCategories } = useQuery({
    queryKey: ["categories"],
    queryFn: () => api.getCategories()
  });
  const categories = serverCategories && serverCategories.length > 0 ? serverCategories : DEFAULT_CATEGORIES;
  const { data: issuesData, isLoading, isError } = useQuery({
    queryKey: ["issues", selectedStatus, selectedCategoryId, searchQuery],
    queryFn: async () => {
      const filters = {
        status: selectedStatus || void 0,
        category_id: selectedCategoryId || void 0,
        search: searchQuery || void 0,
        limit: 100
      };
      const first = await api.getIssues(filters);
      for (let page = 2; page <= (first.meta?.totalPages || 1); page++) {
        const next = await api.getIssues({ ...filters, page });
        first.data.push(...next.data);
      }
      return first;
    }
  });
  const issues = issuesData?.data || [];
  const showMap = viewMode !== "list";
  const showList = viewMode !== "map";
  return <div className={`explore-page view-${viewMode}`}>
      <div className="explore-toolbar">
        <label className="explore-search">
          <span className="sr-only">{t("explore.searchPlaceholder")}</span>
          <input
    type="search"
    value={searchQuery}
    onChange={(event) => setSearchQuery(event.target.value)}
    placeholder={t("explore.searchPlaceholder")}
  />
          <Search size={16} aria-hidden="true" />
        </label>

        <div className="explore-filters">
          <select value={selectedCategoryId} onChange={(event) => setSelectedCategoryId(event.target.value)} aria-label={t("explore.allCategories")}>
            <option value="">{t("explore.allCategories")}</option>
            {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
          </select>

          <select value={selectedStatus} onChange={(event) => setSelectedStatus(event.target.value)} aria-label={t("explore.allStatuses")}>
            <option value="">{t("explore.allStatuses")}</option>
            {statuses.map((status) => <option key={status} value={status}>{t(`status.${status}`)}</option>)}
          </select>

          <button type="button" className="btn btn-secondary view-mode-toggle" onClick={() => setViewMode(viewMode === "map" ? "list" : "map")} aria-label={viewMode === "map" ? t("explore.viewList") : t("explore.viewMap")}>
            {viewMode === "map" ? <ListIcon size={16} /> : <MapIcon size={16} />}
            <span>{viewMode === "map" ? t("explore.viewList") : t("explore.viewMap")}</span>
          </button>
        </div>
      </div>

      <div className="explore-content">
        {showList && <aside className="issue-sidebar" aria-label={t("explore.issuesCount", { count: issues.length })}>
            <div className="issue-count">{t("explore.issuesCount", { count: issues.length })}</div>
            {isError ? <p role="alert">Unable to load issues. Please try again.</p> : isLoading ? <LoadingState /> : issues.length === 0 ? <div className="empty-panel">
                <EmptyState title={t("explore.noIssuesFound")} description="Try clearing search filters or report a new problem in your area." />
              </div> : <div>{issues.map((issue) => <IssueCard key={issue.id} issue={issue} selected={selectedIssue?.id === issue.id} onSelect={() => setSelectedIssue(issue)} />)}</div>}
          </aside>}

        {showMap && <div className="map-view-container">
            <LeafletMap issues={issues} selectedIssue={issues.find((i) => i.id === selectedIssue?.id)} onSelectIssue={setSelectedIssue} />
          </div>}
      </div>
    </div>;
};
function IssueCard({ issue, selected, onSelect }) {
  return <article className={`issue-card${selected ? " is-selected" : ""}`} onClick={onSelect}>
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
    </article>;
}
export {
  IssueExplore
};
