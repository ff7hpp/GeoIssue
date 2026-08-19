const statuses = ["Pending", "In Progress", "Resolved"];

function IssueTable({ admin = false, issues, currentUserId, onEdit, onRemove, onStatusChange, loading }) {
  if (loading) return <p className="empty-state">Loading reports...</p>;
  if (issues.length === 0) return <p className="empty-state">No reports found.</p>;

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Title</th>
            {admin && <th>Description</th>}
            <th>Category</th>
            <th>Status</th>
            {admin && <th>Reporter</th>}
            <th>Location</th>
            {admin && <th>Date</th>}
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {issues.map((issue) => {
            const canManage = issue.createdBy === currentUserId;
            const statusClass = issue.status.toLowerCase().replace(" ", "-");

            return (
              <tr key={issue.id}>
                <td>{issue.title}</td>
                {admin && <td className="description-cell">{issue.description}</td>}
                <td>{issue.category}</td>
                <td>
                  {admin && canManage ? (
                    <select className={`status-select ${statusClass}`} value={issue.status} onChange={(event) => onStatusChange(issue.id, event.target.value)}>
                      {statuses.map((status) => <option key={status} value={status}>{status}</option>)}
                    </select>
                  ) : (
                    <span className={`status ${statusClass}`}>{issue.status}</span>
                  )}
                </td>
                {admin && <td>{issue.reporter || "Anonymous"}</td>}
                <td>{issue.latitude.toFixed(4)}, {issue.longitude.toFixed(4)}</td>
                {admin && <td>{issue.createdAt}</td>}
                <td>
                  {canManage ? (
                    <div className="row-actions">
                      <button className="text-button" type="button" onClick={() => onEdit(issue)}><Pencil size={14} />Edit</button>
                      <button className="remove-button" type="button" onClick={() => onRemove(issue.id)}><Trash2 size={14} />Remove</button>
                    </div>
                  ) : (
                    <span className="not-owner">View only</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default IssueTable;
import { Pencil, Trash2 } from "lucide-react";
