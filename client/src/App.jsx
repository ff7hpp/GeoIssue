import { useMemo, useState } from "react";
import "./App.css";

const categories = ["road", "water", "electricity", "traffic", "environment", "other"];
const statuses = ["pending", "open", "in_progress", "resolved", "rejected"];

const initialIssues = [
  {
    id: crypto.randomUUID(),
    title: "Broken road surface",
    description: "Deep pothole near the bus stop needs urgent repair.",
    category: "road",
    status: "open",
    lat: 39.9321,
    lng: 32.8597,
    reporter: "Ayse Demir",
    createdAt: new Date().toISOString(),
  },
  {
    id: crypto.randomUUID(),
    title: "Street light outage",
    description: "Three lights are not working on the main pedestrian route.",
    category: "electricity",
    status: "pending",
    lat: 39.9182,
    lng: 32.8368,
    reporter: "Mert Kaya",
    createdAt: new Date().toISOString(),
  },
];

const blankForm = {
  title: "",
  description: "",
  category: "road",
  status: "pending",
  lat: 39.9255,
  lng: 32.8663,
  reporter: "",
};

function formatLabel(value) {
  return value.replace("_", " ");
}

function getStoredIssues() {
  try {
    const saved = localStorage.getItem("geoissue_issues");
    return saved ? JSON.parse(saved) : initialIssues;
  } catch {
    return initialIssues;
  }
}

function App() {
  const [issues, setIssues] = useState(getStoredIssues);
  const [form, setForm] = useState(blankForm);
  const [editingId, setEditingId] = useState(null);
  const [filters, setFilters] = useState({
    category: "all",
    status: "all",
    search: "",
  });

  const visibleIssues = useMemo(() => {
    const query = filters.search.trim().toLowerCase();

    return issues.filter((issue) => {
      const matchesCategory = filters.category === "all" || issue.category === filters.category;
      const matchesStatus = filters.status === "all" || issue.status === filters.status;
      const matchesSearch =
        !query ||
        issue.title.toLowerCase().includes(query) ||
        issue.description.toLowerCase().includes(query) ||
        issue.reporter.toLowerCase().includes(query);

      return matchesCategory && matchesStatus && matchesSearch;
    });
  }, [filters, issues]);

  function saveIssues(nextIssues) {
    setIssues(nextIssues);
    localStorage.setItem("geoissue_issues", JSON.stringify(nextIssues));
  }

  function updateForm(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function handleMapPick(event) {
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width;
    const y = (event.clientY - bounds.top) / bounds.height;

    updateForm("lng", Number((32.72 + x * 0.32).toFixed(5)));
    updateForm("lat", Number((40.02 - y * 0.2).toFixed(5)));
  }

  function handleSubmit(event) {
    event.preventDefault();

    const payload = {
      ...form,
      title: form.title.trim(),
      description: form.description.trim(),
      reporter: form.reporter.trim() || "Anonymous reporter",
      updatedAt: new Date().toISOString(),
    };

    if (!payload.title) {
      return;
    }

    if (editingId) {
      saveIssues(issues.map((issue) => (issue.id === editingId ? { ...issue, ...payload } : issue)));
    } else {
      saveIssues([
        {
          ...payload,
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
        },
        ...issues,
      ]);
    }

    setEditingId(null);
    setForm(blankForm);
  }

  function editIssue(issue) {
    setEditingId(issue.id);
    setForm({
      title: issue.title,
      description: issue.description,
      category: issue.category,
      status: issue.status,
      lat: issue.lat,
      lng: issue.lng,
      reporter: issue.reporter,
    });
  }

  function removeIssue(id) {
    saveIssues(issues.filter((issue) => issue.id !== id));
    if (editingId === id) {
      setEditingId(null);
      setForm(blankForm);
    }
  }

  function updateStatus(id, status) {
    saveIssues(
      issues.map((issue) =>
        issue.id === id ? { ...issue, status, updatedAt: new Date().toISOString() } : issue,
      ),
    );
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(blankForm);
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">ANKAGEO</p>
          <h1>GeoIssue Management</h1>
        </div>
        <div className="summary-strip" aria-label="Issue summary">
          <span>{issues.length} total</span>
          <span>{issues.filter((issue) => issue.status === "pending").length} pending</span>
          <span>{issues.filter((issue) => issue.status === "resolved").length} resolved</span>
        </div>
      </header>

      <main className="workspace">
        <section className="map-panel" aria-label="Issue map and coordinate picker">
          <div className="panel-heading">
            <div>
              <h2>Map</h2>
              <p>Click the map area to place the selected issue pin.</p>
            </div>
            <span className="coordinate-pill">
              {form.lat.toFixed(5)}, {form.lng.toFixed(5)}
            </span>
          </div>

          <button className="map-canvas" type="button" onClick={handleMapPick}>
            <span className="district-label center">Cankaya</span>
            <span className="district-label north">Altindag</span>
            <span className="district-label west">Yenimahalle</span>
            {visibleIssues.map((issue) => {
              const left = ((issue.lng - 32.72) / 0.32) * 100;
              const top = ((40.02 - issue.lat) / 0.2) * 100;

              return (
                <span
                  className={`map-marker status-${issue.status}`}
                  key={issue.id}
                  style={{ left: `${left}%`, top: `${top}%` }}
                  title={issue.title}
                />
              );
            })}
            <span
              className="map-marker draft"
              style={{
                left: `${((form.lng - 32.72) / 0.32) * 100}%`,
                top: `${((40.02 - form.lat) / 0.2) * 100}%`,
              }}
              title="Selected location"
            />
          </button>
        </section>

        <section className="form-panel" aria-label="Issue form">
          <div className="panel-heading">
            <div>
              <h2>{editingId ? "Edit Issue" : "Add Issue"}</h2>
              <p>{editingId ? "Update the selected report." : "Create a new geo-located report."}</p>
            </div>
          </div>

          <form className="issue-form" onSubmit={handleSubmit}>
            <label>
              Title
              <input
                value={form.title}
                onChange={(event) => updateForm("title", event.target.value)}
                placeholder="Example: Flooded underpass"
                required
              />
            </label>

            <label>
              Description
              <textarea
                value={form.description}
                onChange={(event) => updateForm("description", event.target.value)}
                placeholder="Add the details people need to understand the issue."
                rows="4"
              />
            </label>

            <div className="field-grid">
              <label>
                Category
                <select value={form.category} onChange={(event) => updateForm("category", event.target.value)}>
                  {categories.map((category) => (
                    <option value={category} key={category}>
                      {formatLabel(category)}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Status
                <select value={form.status} onChange={(event) => updateForm("status", event.target.value)}>
                  {statuses.map((status) => (
                    <option value={status} key={status}>
                      {formatLabel(status)}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label>
              Reporter
              <input
                value={form.reporter}
                onChange={(event) => updateForm("reporter", event.target.value)}
                placeholder="Name or department"
              />
            </label>

            <div className="form-actions">
              <button type="submit" className="primary-action">
                {editingId ? "Save Changes" : "Add Issue"}
              </button>
              {editingId && (
                <button type="button" className="secondary-action" onClick={cancelEdit}>
                  Cancel
                </button>
              )}
            </div>
          </form>
        </section>

        <section className="list-panel" aria-label="Issue list">
          <div className="filters">
            <select
              aria-label="Filter by category"
              value={filters.category}
              onChange={(event) => setFilters((current) => ({ ...current, category: event.target.value }))}
            >
              <option value="all">All categories</option>
              {categories.map((category) => (
                <option value={category} key={category}>
                  {formatLabel(category)}
                </option>
              ))}
            </select>

            <select
              aria-label="Filter by status"
              value={filters.status}
              onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}
            >
              <option value="all">All status</option>
              {statuses.map((status) => (
                <option value={status} key={status}>
                  {formatLabel(status)}
                </option>
              ))}
            </select>

            <input
              aria-label="Search issues"
              value={filters.search}
              onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
              placeholder="Search issues"
            />
          </div>

          <div className="issue-list">
            {visibleIssues.map((issue) => (
              <article className="issue-card" key={issue.id}>
                <div className="issue-card-head">
                  <div>
                    <h3>{issue.title}</h3>
                    <p>{issue.description || "No description added."}</p>
                  </div>
                  <span className={`status-badge status-${issue.status}`}>{formatLabel(issue.status)}</span>
                </div>

                <dl className="issue-meta">
                  <div>
                    <dt>Category</dt>
                    <dd>{formatLabel(issue.category)}</dd>
                  </div>
                  <div>
                    <dt>Location</dt>
                    <dd>
                      {issue.lat.toFixed(4)}, {issue.lng.toFixed(4)}
                    </dd>
                  </div>
                  <div>
                    <dt>Reporter</dt>
                    <dd>{issue.reporter}</dd>
                  </div>
                </dl>

                <div className="card-actions">
                  <select
                    aria-label={`Update status for ${issue.title}`}
                    value={issue.status}
                    onChange={(event) => updateStatus(issue.id, event.target.value)}
                  >
                    {statuses.map((status) => (
                      <option value={status} key={status}>
                        {formatLabel(status)}
                      </option>
                    ))}
                  </select>
                  <button type="button" className="secondary-action" onClick={() => editIssue(issue)}>
                    Edit
                  </button>
                  <button type="button" className="danger-action" onClick={() => removeIssue(issue.id)}>
                    Remove
                  </button>
                </div>
              </article>
            ))}

            {visibleIssues.length === 0 && (
              <div className="empty-state">
                <h3>No issues found</h3>
                <p>Adjust filters or add a new issue from the form.</p>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
