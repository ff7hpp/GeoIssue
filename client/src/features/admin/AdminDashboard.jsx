import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { api } from "../../services/api";
import { useAuth } from "../../services/auth.context";
import { StatusBadge } from "../../components/common/StatusBadge";
import { PriorityBadge } from "../../components/common/PriorityBadge";
import { CategoryIcon } from "../../components/common/CategoryIcon";
import { LoadingState } from "../../components/common/LoadingState";
import { EmptyState } from "../../components/common/EmptyState";
import {
  Shield,
  Layers,
  Tag,
  Users,
  Edit,
  Plus,
  X,
  Lock
} from "lucide-react";
const AdminDashboard = () => {
  const { t } = useTranslation();
  const { user, role } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("issues");
  const [selectedIssueForStatus, setSelectedIssueForStatus] = useState(null);
  const [targetStatus, setTargetStatus] = useState("in_review");
  const [statusNote, setStatusNote] = useState("");
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [catName, setCatName] = useState("");
  const [catSlug, setCatSlug] = useState("");
  const [catIcon, setCatIcon] = useState("AlertTriangle");
  const { data: issuesData, isLoading: isLoadingIssues } = useQuery({
    queryKey: ["admin-issues"],
    queryFn: () => api.getAdminIssues({ limit: 50 }),
    enabled: role === "admin"
  });
  const { data: categories = [], isLoading: isLoadingCategories } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: () => api.getCategories(false),
    enabled: role === "admin"
  });
  const { data: usersData, isLoading: isLoadingUsers } = useQuery({
    queryKey: ["admin-users"],
    queryFn: () => api.getAdminUsers(),
    enabled: role === "admin"
  });
  const statusMutation = useMutation({
    mutationFn: ({ id, status, note }) => api.updateAdminStatus(id, status, note),
    onSuccess: () => {
      setSelectedIssueForStatus(null);
      setStatusNote("");
      queryClient.invalidateQueries({ queryKey: ["admin-issues"] });
      queryClient.invalidateQueries({ queryKey: ["issues"] });
      queryClient.invalidateQueries({ queryKey: ["issue"] });
    }
  });
  const assignMutation = useMutation({
    mutationFn: ({ id, assignee_id }) => api.assignAdminIssue(id, assignee_id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-issues"] });
      queryClient.invalidateQueries({ queryKey: ["issues"] });
    }
  });
  const createCategoryMutation = useMutation({
    mutationFn: (data) => api.createAdminCategory(data),
    onSuccess: () => {
      setIsCategoryModalOpen(false);
      setCatName("");
      setCatSlug("");
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    }
  });
  const toggleCategoryMutation = useMutation({
    mutationFn: ({ id, is_active }) => api.updateAdminCategory(id, { is_active }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    }
  });
  const updateUserMutation = useMutation({
    mutationFn: ({ id, data }) => api.updateAdminUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    }
  });
  if (role !== "admin") {
    return <div className="app-container" style={{ padding: "var(--space-12) var(--space-4)" }}>
        <EmptyState
      icon={<Lock size={48} />}
      title="Admin Authorization Required"
      description="You must be signed in with an administrator account to access this operational dashboard."
    />
      </div>;
  }
  const issues = issuesData?.data || [];
  const users = usersData?.data || [];
  const handleOpenStatusModal = (issue) => {
    setSelectedIssueForStatus(issue);
    if (issue.status === "submitted") setTargetStatus("in_review");
    else if (issue.status === "in_review") setTargetStatus("accepted");
    else if (issue.status === "accepted") setTargetStatus("in_progress");
    else if (issue.status === "in_progress") setTargetStatus("resolved");
    else setTargetStatus(issue.status);
    setStatusNote("");
  };
  const handleSaveStatus = (e) => {
    e.preventDefault();
    if (!selectedIssueForStatus) return;
    statusMutation.mutate({
      id: selectedIssueForStatus.id,
      status: targetStatus,
      note: statusNote || void 0
    });
  };
  const handleCreateCategory = (e) => {
    e.preventDefault();
    if (!catName || !catSlug) return;
    createCategoryMutation.mutate({
      name: catName,
      slug: catSlug.toLowerCase().replace(/\s+/g, "-"),
      icon: catIcon
    });
  };
  return <div className="app-container" style={{ padding: "var(--space-6) var(--space-4)" }}>
      {
    /* Admin Title */
  }
      <div style={{ marginBottom: "var(--space-6)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
          <Shield size={24} style={{ color: "var(--accent-primary)" }} />
          <h1 style={{ fontSize: "1.75rem", fontWeight: 700 }}>{t("admin.portal")}</h1>
        </div>
        <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>
          {t("admin.subtitle")}
        </p>
      </div>

      {
    /* Tabs */
  }
      <div
    style={{
      display: "flex",
      gap: "8px",
      borderBottom: "1px solid var(--border-default)",
      marginBottom: "var(--space-6)"
    }}
  >
        <button
    onClick={() => setActiveTab("issues")}
    style={{
      padding: "10px 16px",
      fontSize: "0.875rem",
      fontWeight: 600,
      color: activeTab === "issues" ? "var(--accent-primary)" : "var(--text-secondary)",
      borderBottom: activeTab === "issues" ? "2px solid var(--accent-primary)" : "2px solid transparent",
      display: "flex",
      alignItems: "center",
      gap: "8px"
    }}
  >
          <Layers size={16} />
          <span>{t("admin.tabs.issues")}</span>
          <span
    style={{
      fontSize: "0.75rem",
      backgroundColor: "var(--bg-surface-subtle)",
      padding: "2px 6px",
      borderRadius: "var(--radius-full)"
    }}
  >
            {issues.length}
          </span>
        </button>

        <button
    onClick={() => setActiveTab("categories")}
    style={{
      padding: "10px 16px",
      fontSize: "0.875rem",
      fontWeight: 600,
      color: activeTab === "categories" ? "var(--accent-primary)" : "var(--text-secondary)",
      borderBottom: activeTab === "categories" ? "2px solid var(--accent-primary)" : "2px solid transparent",
      display: "flex",
      alignItems: "center",
      gap: "8px"
    }}
  >
          <Tag size={16} />
          <span>{t("admin.tabs.categories")}</span>
        </button>

        <button
    onClick={() => setActiveTab("users")}
    style={{
      padding: "10px 16px",
      fontSize: "0.875rem",
      fontWeight: 600,
      color: activeTab === "users" ? "var(--accent-primary)" : "var(--text-secondary)",
      borderBottom: activeTab === "users" ? "2px solid var(--accent-primary)" : "2px solid transparent",
      display: "flex",
      alignItems: "center",
      gap: "8px"
    }}
  >
          <Users size={16} />
          <span>{t("admin.tabs.users")}</span>
        </button>
      </div>

      {
    /* TAB 1: ISSUES QUEUE */
  }
      {activeTab === "issues" && <div>
          {isLoadingIssues ? <LoadingState /> : issues.length === 0 ? <EmptyState title="No Issues in Queue" description="All reported issues have been processed." /> : <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
              {issues.map((issue) => <div
    key={issue.id}
    className="card"
    style={{
      padding: "var(--space-4)",
      backgroundColor: "var(--bg-surface-elevated)",
      display: "flex",
      flexWrap: "wrap",
      alignItems: "center",
      justifyContent: "space-between",
      gap: "var(--space-3)"
    }}
  >
                  <div style={{ flex: "1 1 300px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                      <CategoryIcon slug={issue.category?.slug} size={15} style={{ color: "var(--accent-primary)" }} />
                      <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-secondary)" }}>
                        {issue.category?.name}
                      </span>
                      <StatusBadge status={issue.status} />
                    </div>

                    <Link
    to={`/issues/${issue.id}`}
    style={{ fontSize: "1rem", fontWeight: 600, color: "var(--text-primary)" }}
  >
                      {issue.title}
                    </Link>

                    <div style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", marginTop: "4px" }}>
                      {issue.report_count} Reports · {issue.supporter_count || 0} Supporters ·{" "}
                      {new Date(issue.created_at).toLocaleDateString()}
                    </div>
                  </div>

                  {
    /* Operational Controls: Status, Priority, & Assignee Dropdowns */
  }
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                    {
    /* Assignee Selector */
  }
                    <select
    value={issue.assigned_to || ""}
    onChange={(e) => assignMutation.mutate({
      id: issue.id,
      assignee_id: e.target.value || null
    })}
    style={{
      padding: "6px 10px",
      borderRadius: "var(--radius-md)",
      border: "1px solid var(--border-default)",
      backgroundColor: "var(--bg-surface)",
      fontSize: "0.8125rem"
    }}
  >
                      <option value="">Unassigned</option>
                      {users.filter((u) => u.role === "admin").map((u) => <option key={u.id} value={u.id}>
                            {u.display_name || u.email}
                          </option>)}
                    </select>

                    <PriorityBadge priority={issue.priority} supporterCount={issue.supporter_count} />

                    {
    /* Change Status Action Button */
  }
                    <button
    onClick={() => handleOpenStatusModal(issue)}
    className="btn btn-primary"
    style={{ fontSize: "0.8125rem", padding: "6px 12px" }}
  >
                      <Edit size={14} />
                      <span>{t("admin.changeStatus")}</span>
                    </button>
                  </div>
                </div>)}
            </div>}
        </div>}

      {
    /* TAB 2: CATEGORIES */
  }
      {activeTab === "categories" && <div>
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "var(--space-4)" }}>
            <button
    onClick={() => setIsCategoryModalOpen(true)}
    className="btn btn-primary"
    style={{ fontSize: "0.875rem", gap: "6px" }}
  >
              <Plus size={16} />
              <span>{t("admin.createCategory")}</span>
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "var(--space-4)" }}>
            {categories.map((cat) => <div
    key={cat.id}
    className="card"
    style={{
      padding: "var(--space-4)",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between"
    }}
  >
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div
    style={{
      width: "40px",
      height: "40px",
      borderRadius: "var(--radius-md)",
      backgroundColor: "var(--bg-surface-subtle)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: "var(--accent-primary)"
    }}
  >
                    <CategoryIcon slug={cat.slug} size={20} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: "0.9375rem" }}>{cat.name}</div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-tertiary)" }}>{cat.slug}</div>
                  </div>
                </div>

                <button
    onClick={() => toggleCategoryMutation.mutate({ id: cat.id, is_active: !cat.is_active })}
    className={`btn ${cat.is_active ? "btn-secondary" : "btn-subtle"}`}
    style={{ fontSize: "0.75rem", padding: "4px 8px" }}
  >
                  {cat.is_active ? "Active" : "Disabled"}
                </button>
              </div>)}
          </div>
        </div>}

      {
    /* TAB 3: USERS */
  }
      {activeTab === "users" && <div>
          {isLoadingUsers ? <LoadingState /> : <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {users.map((u) => <div
    key={u.id}
    className="card"
    style={{
      padding: "var(--space-3) var(--space-4)",
      display: "flex",
      flexWrap: "wrap",
      alignItems: "center",
      justifyContent: "space-between",
      gap: "8px"
    }}
  >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: "0.9375rem" }}>
                      {u.display_name || u.email}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-tertiary)" }}>
                      {u.email} · Lang: {u.language.toUpperCase()} · Joined{" "}
                      {new Date(u.created_at).toLocaleDateString()}
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <select
    value={u.role}
    onChange={(e) => updateUserMutation.mutate({
      id: u.id,
      data: { role: e.target.value }
    })}
    style={{
      padding: "4px 8px",
      borderRadius: "var(--radius-sm)",
      fontSize: "0.8125rem",
      border: "1px solid var(--border-default)",
      backgroundColor: "var(--bg-surface)"
    }}
  >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                      <option value="visitor">Visitor</option>
                    </select>

                    <select
    value={u.account_status}
    onChange={(e) => updateUserMutation.mutate({
      id: u.id,
      data: { account_status: e.target.value }
    })}
    style={{
      padding: "4px 8px",
      borderRadius: "var(--radius-sm)",
      fontSize: "0.8125rem",
      border: "1px solid var(--border-default)",
      backgroundColor: "var(--bg-surface)"
    }}
  >
                      <option value="active">Active</option>
                      <option value="suspended">Suspended</option>
                    </select>
                  </div>
                </div>)}
            </div>}
        </div>}

      {
    /* Status Change Modal */
  }
      {selectedIssueForStatus && <div
    style={{
      position: "fixed",
      inset: 0,
      backgroundColor: "rgba(0, 0, 0, 0.65)",
      backdropFilter: "blur(4px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "var(--space-4)",
      zIndex: 5e3
    }}
    onClick={() => setSelectedIssueForStatus(null)}
  >
          <div
    className="card animate-fade-in"
    style={{
      width: "100%",
      maxWidth: "480px",
      backgroundColor: "var(--bg-surface-elevated)",
      padding: "var(--space-6)",
      position: "relative"
    }}
    onClick={(e) => e.stopPropagation()}
  >
            <button
    onClick={() => setSelectedIssueForStatus(null)}
    className="btn-icon"
    style={{ position: "absolute", top: "16px", insetInlineEnd: "16px" }}
  >
              <X size={20} />
            </button>

            <h3 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "6px" }}>
              {t("admin.changeStatus")}
            </h3>
            <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginBottom: "var(--space-4)" }}>
              {selectedIssueForStatus.title}
            </p>

            <form onSubmit={handleSaveStatus} style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, marginBottom: "6px" }}>
                  Target Lifecycle Status
                </label>
                <select
    value={targetStatus}
    onChange={(e) => setTargetStatus(e.target.value)}
    style={{
      width: "100%",
      padding: "10px 12px",
      borderRadius: "var(--radius-md)",
      border: "1px solid var(--border-default)",
      backgroundColor: "var(--bg-surface)"
    }}
  >
                  <option value="in_review">{t("status.in_review")}</option>
                  <option value="accepted">{t("status.accepted")}</option>
                  <option value="in_progress">{t("status.in_progress")}</option>
                  <option value="resolved">{t("status.resolved")}</option>
                  <option value="rejected">{t("status.rejected")}</option>
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, marginBottom: "6px" }}>
                  Action Note / Dispatch Reason
                </label>
                <textarea
    rows={3}
    value={statusNote}
    onChange={(e) => setStatusNote(e.target.value)}
    placeholder={t("admin.addNotePlaceholder")}
    style={{
      width: "100%",
      padding: "10px 12px",
      borderRadius: "var(--radius-md)",
      border: "1px solid var(--border-default)",
      backgroundColor: "var(--bg-surface)"
    }}
  />
              </div>

              {statusMutation.isError && <div
    style={{
      padding: "10px",
      backgroundColor: "var(--status-rejected-bg)",
      color: "var(--status-rejected)",
      borderRadius: "var(--radius-md)",
      fontSize: "0.8125rem"
    }}
  >
                  {statusMutation.error?.message || "Status update failed"}
                </div>}

              <button
    type="submit"
    disabled={statusMutation.isPending}
    className="btn btn-primary"
    style={{ padding: "12px" }}
  >
                {statusMutation.isPending ? t("common.loading") : t("admin.updateStatusAction")}
              </button>
            </form>
          </div>
        </div>}

      {
    /* Category Creation Modal */
  }
      {isCategoryModalOpen && <div
    style={{
      position: "fixed",
      inset: 0,
      backgroundColor: "rgba(0, 0, 0, 0.65)",
      backdropFilter: "blur(4px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "var(--space-4)",
      zIndex: 5e3
    }}
    onClick={() => setIsCategoryModalOpen(false)}
  >
          <div
    className="card animate-fade-in"
    style={{
      width: "100%",
      maxWidth: "440px",
      backgroundColor: "var(--bg-surface-elevated)",
      padding: "var(--space-6)",
      position: "relative"
    }}
    onClick={(e) => e.stopPropagation()}
  >
            <button
    onClick={() => setIsCategoryModalOpen(false)}
    className="btn-icon"
    style={{ position: "absolute", top: "16px", insetInlineEnd: "16px" }}
  >
              <X size={20} />
            </button>

            <h3 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "var(--space-4)" }}>
              {t("admin.createCategory")}
            </h3>

            <form onSubmit={handleCreateCategory} style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, marginBottom: "6px" }}>
                  {t("admin.categoryName")}
                </label>
                <input
    type="text"
    required
    value={catName}
    onChange={(e) => {
      setCatName(e.target.value);
      setCatSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-"));
    }}
    placeholder="e.g. Traffic Signals"
    style={{
      width: "100%",
      padding: "10px 12px",
      borderRadius: "var(--radius-md)",
      border: "1px solid var(--border-default)",
      backgroundColor: "var(--bg-surface)"
    }}
  />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, marginBottom: "6px" }}>
                  {t("admin.categorySlug")}
                </label>
                <input
    type="text"
    required
    value={catSlug}
    onChange={(e) => setCatSlug(e.target.value)}
    placeholder="traffic-signals"
    style={{
      width: "100%",
      padding: "10px 12px",
      borderRadius: "var(--radius-md)",
      border: "1px solid var(--border-default)",
      backgroundColor: "var(--bg-surface)"
    }}
  />
              </div>

              <button
    type="submit"
    disabled={createCategoryMutation.isPending}
    className="btn btn-primary"
    style={{ padding: "12px" }}
  >
                {t("admin.save")}
              </button>
            </form>
          </div>
        </div>}
    </div>;
};
export {
  AdminDashboard
};
