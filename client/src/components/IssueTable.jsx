function IssueTable({ issues, onEdit, onRemove }) {
  if (issues.length === 0) {
    return <p className="empty-message">No issues found.</p>;
  }

  return (
    <div className="table-wrapper">
      <table>
        <thead>
          <tr>
            <th>Title</th>
            <th>Category</th>
            <th>Status</th>
            <th>Reporter</th>
            <th>Location</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {issues.map((issue) => (
            <tr key={issue.id}>
              <td>
                <strong>{issue.title}</strong>
                <small>{issue.description}</small>
              </td>
              <td>{issue.category}</td>
              <td>{issue.status}</td>
              <td>{issue.reporter || "Anonymous"}</td>
              <td>{issue.lat.toFixed(3)}, {issue.lng.toFixed(3)}</td>
              <td className="action-buttons">
                <button className="edit-button" type="button" onClick={() => onEdit(issue)}>
                  Edit
                </button>
                <button className="remove-button" type="button" onClick={() => onRemove(issue.id)}>
                  Remove
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default IssueTable;
