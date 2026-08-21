import { MapPin, Pencil, Trash2 } from "lucide-react";

const statuses = ["Pending", "In Progress", "Resolved"];
const statusLabels = { Pending: "جديد", "In Progress": "قيد المعالجة", Resolved: "تم الحل" };
const categoryLabels = { Road: "الطرق", Water: "المياه", Electricity: "الكهرباء", Traffic: "المرور", Environment: "البيئة", Other: "أخرى" };

function IssueTable({ admin = false, issues, currentUserId, onEdit, onRemove, onStatusChange, loading }) {
  if (loading) {
    return (
      <div className="table-skeleton" aria-busy="true" aria-label="جارٍ تحميل البلاغات">
        {Array.from({ length: 4 }).map((_, index) => <span key={index} />)}
      </div>
    );
  }

  if (issues.length === 0) {
    return (
      <div className="empty-state">
        <MapPin size={28} />
        <h3>لا توجد بلاغات مطابقة</h3>
        <p>جرّب تغيير البحث أو التصفية، أو أضف أول بلاغ في هذه المنطقة.</p>
      </div>
    );
  }

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th scope="col">البلاغ</th>
            {admin && <th scope="col">الوصف</th>}
            <th scope="col">التصنيف</th>
            <th scope="col">الحالة</th>
            {admin && <th scope="col">المبلّغ</th>}
            <th scope="col">الموقع</th>
            {admin && <th scope="col">التاريخ</th>}
            <th scope="col">الإجراءات</th>
          </tr>
        </thead>
        <tbody>
          {issues.map((issue) => {
            const canManage = issue.createdBy === currentUserId;
            const statusClass = issue.status.toLowerCase().replace(" ", "-");

            return (
              <tr key={issue.id}>
                <td className="title-cell">
                  <strong>{issue.title}</strong>
                  {!admin && <small>{issue.description}</small>}
                </td>
                {admin && <td className="description-cell">{issue.description}</td>}
                <td><span className="category-tag">{categoryLabels[issue.category] || issue.category}</span></td>
                <td>
                  {admin && canManage ? (
                    <select
                      aria-label={`تغيير حالة ${issue.title}`}
                      className={`status-select ${statusClass}`}
                      value={issue.status}
                      onChange={(event) => onStatusChange(issue.id, event.target.value)}
                    >
                      {statuses.map((status) => <option key={status} value={status}>{statusLabels[status]}</option>)}
                    </select>
                  ) : (
                    <span className={`status ${statusClass}`}><i />{statusLabels[issue.status] || issue.status}</span>
                  )}
                </td>
                {admin && <td>{issue.reporter || "غير معروف"}</td>}
                <td>
                  <span className="location-cell" dir="ltr">
                    <MapPin size={14} />{issue.latitude.toFixed(4)}, {issue.longitude.toFixed(4)}
                  </span>
                </td>
                {admin && <td>{issue.createdAt}</td>}
                <td>
                  {canManage ? (
                    <div className="row-actions">
                      <button className="text-button" type="button" onClick={() => onEdit(issue)}><Pencil size={14} />تعديل</button>
                      <button className="remove-button" type="button" onClick={() => onRemove(issue.id)}><Trash2 size={14} />حذف</button>
                    </div>
                  ) : <span className="not-owner">للعرض فقط</span>}
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
