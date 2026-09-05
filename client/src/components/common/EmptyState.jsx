import { Inbox } from "lucide-react";
const EmptyState = ({
  icon,
  title,
  description,
  action
}) => {
  return <div
    style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      textAlign: "center",
      padding: "var(--space-12) var(--space-6)",
      backgroundColor: "var(--bg-surface)",
      border: "1px dashed var(--border-default)",
      borderRadius: "var(--radius-lg)",
      gap: "var(--space-3)"
    }}
  >
      <div style={{ color: "var(--text-tertiary)" }}>
        {icon || <Inbox size={40} />}
      </div>
      <h3 style={{ fontSize: "1.125rem", fontWeight: 600 }}>{title}</h3>
      {description && <p style={{ maxWidth: "400px", fontSize: "0.875rem", color: "var(--text-secondary)" }}>
          {description}
        </p>}
      {action && <div style={{ marginTop: "var(--space-2)" }}>{action}</div>}
    </div>;
};
export {
  EmptyState
};
