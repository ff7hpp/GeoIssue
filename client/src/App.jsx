import { useMemo, useState } from "react";
import "./App.css";

const categories = ["Road", "Water", "Electricity", "Traffic", "Environment", "Other"];
const statuses = ["Pending", "In Progress", "Resolved"];

const initialIssues = [
  {
    id: 1,
    title: "Pothole on Main St",
    description: "Large pothole near the bus stop.",
    category: "Road",
    status: "Pending",
    reporter: "Ayse Demir",
    latitude: 39.9207,
    longitude: 32.8541,
    createdAt: "2026-08-18",
  },
  {
    id: 2,
    title: "Leaking fire hydrant",
    description: "Water has been leaking since this morning.",
    category: "Water",
    status: "In Progress",
    reporter: "Mert Kaya",
    latitude: 39.919,
    longitude: 32.853,
    createdAt: "2026-08-17",
  },
  {
    id: 3,
    title: "Broken streetlight",
    description: "The street is very dark at night.",
    category: "Electricity",
    status: "Resolved",
    reporter: "Zeynep Yilmaz",
    latitude: 39.9215,
    longitude: 32.855,
    createdAt: "2026-08-16",
  },
];

const emptyForm = {
  title: "",
  description: "",
  category: "Road",
  reporter: "",
  latitude: 39.9207,
  longitude: 32.8541,
};

function App() {
  const [page, setPage] = useState("reports");
  const [issues, setIssues] = useState(initialIssues);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  const filteredIssues = useMemo(() => {
    return issues.filter((issue) => {
      const text = `${issue.title} ${issue.description} ${issue.reporter}`.toLowerCase();
      const matchesSearch = text.includes(search.toLowerCase());
      const matchesCategory = categoryFilter === "All" || issue.category === categoryFilter;
      const matchesStatus = statusFilter === "All" || issue.status === statusFilter;

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [issues, search, categoryFilter, statusFilter]);

  function updateForm(field, value) {
    setForm({ ...form, [field]: value });
  }

  function chooseLocation(event) {
    const mapBounds = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - mapBounds.left) / mapBounds.width;
    const y = (event.clientY - mapBounds.top) / mapBounds.height;

    setForm({
      ...form,
      latitude: Number((40.01 - y * 0.16).toFixed(4)),
      longitude: Number((32.78 + x * 0.16).toFixed(4)),
    });
  }

  function saveIssue(event) {
    event.preventDefault();

    if (!form.title.trim() || !form.description.trim()) {
      alert("Please enter a title and description.");
      return;
    }

    if (editingId !== null) {
      setIssues(
        issues.map((issue) =>
          issue.id === editingId ? { ...issue, ...form } : issue,
        ),
      );
    } else {
      setIssues([
        {
          ...form,
          id: Date.now(),
          status: "Pending",
          createdAt: new Date().toISOString().slice(0, 10),
        },
        ...issues,
      ]);
    }

    cancelEdit();
  }

  function startEdit(issue) {
    setForm({
      title: issue.title,
      description: issue.description,
      category: issue.category,
      reporter: issue.reporter,
      latitude: issue.latitude,
      longitude: issue.longitude,
    });
    setEditingId(issue.id);
    setPage("reports");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEdit() {
    setForm(emptyForm);
    setEditingId(null);
  }

  function removeIssue(id) {
    if (window.confirm("Remove this report?")) {
      setIssues(issues.filter((issue) => issue.id !== id));

      if (editingId === id) {
        cancelEdit();
      }
    }
  }

  function updateStatus(id, status) {
    setIssues(issues.map((issue) => (issue.id === id ? { ...issue, status } : issue)));
  }

  const totalIssues = issues.length;
  const pendingIssues = issues.filter((issue) => issue.status === "Pending").length;
  const resolvedIssues = issues.filter((issue) => issue.status === "Resolved").length;

  return (
    <div className="app">
      <header className="topbar">
        <div className="topbar-inner">
          <button className="brand" type="button" onClick={() => setPage("reports")}>
            GeoIssue
          </button>
          <nav className="main-nav" aria-label="Main navigation">
            <button
              className={page === "dashboard" ? "nav-link active" : "nav-link"}
              type="button"
              onClick={() => setPage("dashboard")}
            >
              Dashboard
            </button>
            <button
              className={page === "reports" ? "nav-link active" : "nav-link"}
              type="button"
              onClick={() => setPage("reports")}
            >
              Reports
            </button>
          </nav>
        </div>
      </header>

      <main className="page-content">
        {page === "reports" ? (
          <section>
            <div className="page-heading">
              <h1>Report a City Issue</h1>
              <p>Log a civic problem for review.</p>
            </div>

            <div className="report-layout">
              <section className="panel report-form-panel">
                <h2>{editingId !== null ? "Edit Report" : "Add New Issue"}</h2>
                <form onSubmit={saveIssue}>
                  <label htmlFor="title">Title</label>
                  <input
                    id="title"
                    value={form.title}
                    onChange={(event) => updateForm("title", event.target.value)}
                    placeholder="E.g., Pothole on Main St"
                  />

                  <label htmlFor="description">Description</label>
                  <textarea
                    id="description"
                    rows="5"
                    value={form.description}
                    onChange={(event) => updateForm("description", event.target.value)}
                    placeholder="Provide details about the issue..."
                  />

                  <div className="two-fields">
                    <div>
                      <label htmlFor="category">Category</label>
                      <select
                        id="category"
                        value={form.category}
                        onChange={(event) => updateForm("category", event.target.value)}
                      >
                        {categories.map((category) => (
                          <option key={category} value={category}>
                            {category}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="reporter">Reporter Name</label>
                      <input
                        id="reporter"
                        value={form.reporter}
                        onChange={(event) => updateForm("reporter", event.target.value)}
                        placeholder="Your name"
                      />
                    </div>
                  </div>

                  <label>Location Coordinates</label>
                  <div className="two-fields coordinates">
                    <input readOnly value={`Lat: ${form.latitude.toFixed(4)}`} />
                    <input readOnly value={`Lng: ${form.longitude.toFixed(4)}`} />
                  </div>

                  <div className="form-actions">
                    {editingId !== null && (
                      <button className="secondary-button" type="button" onClick={cancelEdit}>
                        Cancel
                      </button>
                    )}
                    <button className="primary-button" type="submit">
                      {editingId !== null ? "Update Report" : "Submit Report"}
                    </button>
                  </div>
                </form>
              </section>

              <section className="panel location-panel">
                <div className="panel-title-row">
                  <h2>Select Location</h2>
                  <span>Click map to pin</span>
                </div>
                <button className="map" type="button" onClick={chooseLocation}>
                  <span className="map-road road-one" />
                  <span className="map-road road-two" />
                  <span className="map-label">ANKARA</span>
                  <span className="map-pin" />
                  <span className="map-help">Click on the map to select a location.</span>
                </button>
              </section>
            </div>

            <section className="panel reports-panel">
              <div className="panel-title-row table-title-row">
                <h2>My Reports</h2>
                <div className="filters">
                  <input
                    type="search"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search reports..."
                  />
                  <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
                    <option value="All">All Categories</option>
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <IssueTable issues={filteredIssues} onEdit={startEdit} onRemove={removeIssue} />
            </section>
          </section>
        ) : (
          <section>
            <div className="page-heading dashboard-heading">
              <div>
                <h1>System Overview</h1>
                <p>Real-time status of reported civic issues.</p>
              </div>
              <button className="primary-button" type="button" onClick={() => setPage("reports")}>
                Create Report
              </button>
            </div>

            <div className="stat-grid">
              <StatCard label="Total Reports" value={totalIssues} type="total" />
              <StatCard label="Pending" value={pendingIssues} type="pending" />
              <StatCard label="Resolved" value={resolvedIssues} type="resolved" />
            </div>

            <section className="panel admin-panel">
              <div className="panel-title-row table-title-row">
                <h2>Recent Reports</h2>
                <div className="filters admin-filters">
                  <input
                    type="search"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search issues..."
                  />
                  <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
                    <option value="All">All Categories</option>
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                  <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                    <option value="All">All Statuses</option>
                    {statuses.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <IssueTable
                admin
                issues={filteredIssues}
                onEdit={startEdit}
                onRemove={removeIssue}
                onStatusChange={updateStatus}
              />
            </section>
          </section>
        )}
      </main>

      <footer className="footer">GeoIssue Internship Project</footer>
    </div>
  );
}

function StatCard({ label, value, type }) {
  return (
    <section className={`stat-card ${type}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </section>
  );
}

function IssueTable({ admin = false, issues, onEdit, onRemove, onStatusChange }) {
  if (issues.length === 0) {
    return <p className="empty-state">No reports found.</p>;
  }

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
          {issues.map((issue) => (
            <tr key={issue.id}>
              <td>{issue.title}</td>
              {admin && <td className="description-cell">{issue.description}</td>}
              <td>{issue.category}</td>
              <td>
                {admin ? (
                  <select
                    className={`status-select ${issue.status.toLowerCase().replace(" ", "-")}`}
                    value={issue.status}
                    onChange={(event) => onStatusChange(issue.id, event.target.value)}
                  >
                    {statuses.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className={`status ${issue.status.toLowerCase().replace(" ", "-")}`}>
                    {issue.status}
                  </span>
                )}
              </td>
              {admin && <td>{issue.reporter || "Anonymous"}</td>}
              <td>{issue.latitude.toFixed(4)}, {issue.longitude.toFixed(4)}</td>
              {admin && <td>{issue.createdAt}</td>}
              <td>
                <div className="row-actions">
                  <button className="text-button" type="button" onClick={() => onEdit(issue)}>
                    Edit
                  </button>
                  <button className="remove-button" type="button" onClick={() => onRemove(issue.id)}>
                    Remove
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default App;
