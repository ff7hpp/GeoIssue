import { useEffect, useMemo, useState } from "react";
import "./App.css";

const API_URL = "http://localhost:5000/api/issues";
const categories = ["Road", "Water", "Electricity", "Traffic", "Environment", "Other"];
const statuses = ["Pending", "In Progress", "Resolved"];

const emptyForm = {
  title: "",
  description: "",
  category: "Road",
  reporter: "",
  latitude: 39.9207,
  longitude: 32.8541,
};

async function request(url, options = {}) {
  const response = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || "Something went wrong.");
  }

  return response.status === 204 ? null : response.json();
}

function App() {
  const [page, setPage] = useState("sign-in");
  const [user, setUser] = useState(null);
  const [issues, setIssues] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadIssues();
  }, []);

  const filteredIssues = useMemo(() => {
    return issues.filter((issue) => {
      const text = `${issue.title} ${issue.description} ${issue.reporter}`.toLowerCase();
      const matchesSearch = text.includes(search.toLowerCase());
      const matchesCategory = categoryFilter === "All" || issue.category === categoryFilter;
      const matchesStatus = statusFilter === "All" || issue.status === statusFilter;

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [issues, search, categoryFilter, statusFilter]);

  async function loadIssues() {
    try {
      setLoading(true);
      const data = await request(API_URL);
      setIssues(data.issues);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

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

  async function saveIssue(event) {
    event.preventDefault();
    setMessage("");

    try {
      const isEditing = editingId !== null;
      const data = await request(isEditing ? `${API_URL}/${editingId}` : API_URL, {
        method: isEditing ? "PUT" : "POST",
        body: JSON.stringify({ ...form, reporter: form.reporter || user.name }),
      });

      setIssues((currentIssues) => {
        if (isEditing) {
          return currentIssues.map((issue) => (issue.id === data.issue.id ? data.issue : issue));
        }

        return [data.issue, ...currentIssues];
      });
      cancelEdit();
    } catch (error) {
      setMessage(error.message);
    }
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

  async function removeIssue(id) {
    if (!window.confirm("Remove this report?")) return;

    try {
      await request(`${API_URL}/${id}`, { method: "DELETE" });
      setIssues((currentIssues) => currentIssues.filter((issue) => issue.id !== id));

      if (editingId === id) cancelEdit();
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function updateStatus(id, status) {
    try {
      const data = await request(`${API_URL}/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      setIssues((currentIssues) =>
        currentIssues.map((issue) => (issue.id === data.issue.id ? data.issue : issue)),
      );
    } catch (error) {
      setMessage(error.message);
    }
  }

  function signIn(account) {
    // Firebase Authentication will replace this temporary frontend-only session.
    setUser(account);
    setPage("reports");
    setMessage("");
  }

  function signOut() {
    setUser(null);
    setPage("sign-in");
    cancelEdit();
  }

  const totalIssues = issues.length;
  const pendingIssues = issues.filter((issue) => issue.status === "Pending").length;
  const resolvedIssues = issues.filter((issue) => issue.status === "Resolved").length;

  return (
    <div className="app">
      <header className="topbar">
        <div className="topbar-inner">
          <button className="brand" type="button" onClick={() => setPage(user ? "reports" : "sign-in")}>
            GeoIssue
          </button>

          {user ? (
            <>
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
              <div className="account-area">
                <span>{user.name}</span>
                <button className="sign-out-button" type="button" onClick={signOut}>
                  Sign out
                </button>
              </div>
            </>
          ) : (
            <nav className="auth-nav">
              <button className="nav-link" type="button" onClick={() => setPage("sign-in")}>
                Sign in
              </button>
              <button className="header-register" type="button" onClick={() => setPage("register")}>
                Create account
              </button>
            </nav>
          )}
        </div>
      </header>

      <main className="page-content">
        {message && <p className="message" role="alert">{message}</p>}

        {page === "sign-in" || page === "register" ? (
          <AuthPage mode={page} onSubmit={signIn} onSwitch={setPage} />
        ) : page === "reports" ? (
          <ReportsPage
            form={form}
            editingId={editingId}
            issues={filteredIssues}
            search={search}
            categoryFilter={categoryFilter}
            onChange={updateForm}
            onChooseLocation={chooseLocation}
            onSubmit={saveIssue}
            onCancel={cancelEdit}
            onSearch={setSearch}
            onCategoryFilter={setCategoryFilter}
            onEdit={startEdit}
            onRemove={removeIssue}
            loading={loading}
          />
        ) : (
          <DashboardPage
            total={totalIssues}
            pending={pendingIssues}
            resolved={resolvedIssues}
            issues={filteredIssues}
            search={search}
            categoryFilter={categoryFilter}
            statusFilter={statusFilter}
            onSearch={setSearch}
            onCategoryFilter={setCategoryFilter}
            onStatusFilter={setStatusFilter}
            onCreate={() => setPage("reports")}
            onEdit={startEdit}
            onRemove={removeIssue}
            onStatusChange={updateStatus}
            loading={loading}
          />
        )}
      </main>

      <footer className="footer">GeoIssue Internship Project</footer>
    </div>
  );
}

function AuthPage({ mode, onSubmit, onSwitch }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const isRegister = mode === "register";

  function handleSubmit(event) {
    event.preventDefault();
    const displayName = name.trim() || email.split("@")[0];

    if ((isRegister && !name.trim()) || !email.includes("@") || password.length < 6) {
      setError("Enter a valid email and a password with at least 6 characters.");
      return;
    }

    onSubmit({ name: displayName, email });
  }

  return (
    <section className="auth-layout">
      <div className="auth-intro">
        <p className="eyebrow">CITY ISSUE REPORTING</p>
        <h1>Keep your city moving.</h1>
        <p>Report local problems and follow their progress in one place.</p>
      </div>
      <form className="auth-card" onSubmit={handleSubmit}>
        <h2>{isRegister ? "Create account" : "Welcome back"}</h2>
        <p>{isRegister ? "Create an account to submit reports." : "Sign in to continue to GeoIssue."}</p>

        {isRegister && (
          <>
            <label htmlFor="name">Full name</label>
            <input id="name" value={name} onChange={(event) => setName(event.target.value)} />
          </>
        )}

        <label htmlFor="email">Email</label>
        <input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />

        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />

        {error && <p className="form-error">{error}</p>}
        <button className="primary-button auth-submit" type="submit">
          {isRegister ? "Create account" : "Sign in"}
        </button>
        <button className="auth-switch" type="button" onClick={() => onSwitch(isRegister ? "sign-in" : "register")}>
          {isRegister ? "Already have an account? Sign in" : "Need an account? Create one"}
        </button>
      </form>
    </section>
  );
}

function ReportsPage({
  form,
  editingId,
  issues,
  search,
  categoryFilter,
  onChange,
  onChooseLocation,
  onSubmit,
  onCancel,
  onSearch,
  onCategoryFilter,
  onEdit,
  onRemove,
  loading,
}) {
  return (
    <section>
      <div className="page-heading">
        <h1>Report a City Issue</h1>
        <p>Log a civic problem for review.</p>
      </div>

      <div className="report-layout">
        <section className="panel report-form-panel">
          <h2>{editingId !== null ? "Edit Report" : "Add New Issue"}</h2>
          <form onSubmit={onSubmit}>
            <label htmlFor="title">Title</label>
            <input id="title" value={form.title} onChange={(event) => onChange("title", event.target.value)} placeholder="E.g., Pothole on Main St" />

            <label htmlFor="description">Description</label>
            <textarea id="description" rows="5" value={form.description} onChange={(event) => onChange("description", event.target.value)} placeholder="Provide details about the issue..." />

            <div className="two-fields">
              <div>
                <label htmlFor="category">Category</label>
                <select id="category" value={form.category} onChange={(event) => onChange("category", event.target.value)}>
                  {categories.map((category) => <option key={category} value={category}>{category}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="reporter">Reporter Name</label>
                <input id="reporter" value={form.reporter} onChange={(event) => onChange("reporter", event.target.value)} placeholder="Your name" />
              </div>
            </div>

            <label>Location Coordinates</label>
            <div className="two-fields coordinates">
              <input readOnly value={`Lat: ${form.latitude.toFixed(4)}`} />
              <input readOnly value={`Lng: ${form.longitude.toFixed(4)}`} />
            </div>

            <div className="form-actions">
              {editingId !== null && <button className="secondary-button" type="button" onClick={onCancel}>Cancel</button>}
              <button className="primary-button" type="submit">{editingId !== null ? "Update Report" : "Submit Report"}</button>
            </div>
          </form>
        </section>

        <section className="panel location-panel">
          <div className="panel-title-row"><h2>Select Location</h2><span>Click map to pin</span></div>
          <button className="map" type="button" onClick={onChooseLocation}>
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
            <input type="search" value={search} onChange={(event) => onSearch(event.target.value)} placeholder="Search reports..." />
            <select value={categoryFilter} onChange={(event) => onCategoryFilter(event.target.value)}>
              <option value="All">All Categories</option>
              {categories.map((category) => <option key={category} value={category}>{category}</option>)}
            </select>
          </div>
        </div>
        <IssueTable issues={issues} onEdit={onEdit} onRemove={onRemove} loading={loading} />
      </section>
    </section>
  );
}

function DashboardPage({ total, pending, resolved, issues, search, categoryFilter, statusFilter, onSearch, onCategoryFilter, onStatusFilter, onCreate, onEdit, onRemove, onStatusChange, loading }) {
  return (
    <section>
      <div className="page-heading dashboard-heading">
        <div><h1>System Overview</h1><p>Real-time status of reported civic issues.</p></div>
        <button className="primary-button" type="button" onClick={onCreate}>Create Report</button>
      </div>

      <div className="stat-grid">
        <StatCard label="Total Reports" value={total} type="total" />
        <StatCard label="Pending" value={pending} type="pending" />
        <StatCard label="Resolved" value={resolved} type="resolved" />
      </div>

      <section className="panel admin-panel">
        <div className="panel-title-row table-title-row">
          <h2>Recent Reports</h2>
          <div className="filters admin-filters">
            <input type="search" value={search} onChange={(event) => onSearch(event.target.value)} placeholder="Search issues..." />
            <select value={categoryFilter} onChange={(event) => onCategoryFilter(event.target.value)}>
              <option value="All">All Categories</option>
              {categories.map((category) => <option key={category} value={category}>{category}</option>)}
            </select>
            <select value={statusFilter} onChange={(event) => onStatusFilter(event.target.value)}>
              <option value="All">All Statuses</option>
              {statuses.map((status) => <option key={status} value={status}>{status}</option>)}
            </select>
          </div>
        </div>
        <IssueTable admin issues={issues} onEdit={onEdit} onRemove={onRemove} onStatusChange={onStatusChange} loading={loading} />
      </section>
    </section>
  );
}

function StatCard({ label, value, type }) {
  return <section className={`stat-card ${type}`}><span>{label}</span><strong>{value}</strong></section>;
}

function IssueTable({ admin = false, issues, onEdit, onRemove, onStatusChange, loading }) {
  if (loading) return <p className="empty-state">Loading reports...</p>;
  if (issues.length === 0) return <p className="empty-state">No reports found.</p>;

  return (
    <div className="table-wrap">
      <table>
        <thead><tr><th>Title</th>{admin && <th>Description</th>}<th>Category</th><th>Status</th>{admin && <th>Reporter</th>}<th>Location</th>{admin && <th>Date</th>}<th>Actions</th></tr></thead>
        <tbody>
          {issues.map((issue) => (
            <tr key={issue.id}>
              <td>{issue.title}</td>
              {admin && <td className="description-cell">{issue.description}</td>}
              <td>{issue.category}</td>
              <td>{admin ? <select className={`status-select ${issue.status.toLowerCase().replace(" ", "-")}`} value={issue.status} onChange={(event) => onStatusChange(issue.id, event.target.value)}>{statuses.map((status) => <option key={status} value={status}>{status}</option>)}</select> : <span className={`status ${issue.status.toLowerCase().replace(" ", "-")}`}>{issue.status}</span>}</td>
              {admin && <td>{issue.reporter || "Anonymous"}</td>}
              <td>{issue.latitude.toFixed(4)}, {issue.longitude.toFixed(4)}</td>
              {admin && <td>{issue.createdAt}</td>}
              <td><div className="row-actions"><button className="text-button" type="button" onClick={() => onEdit(issue)}>Edit</button><button className="remove-button" type="button" onClick={() => onRemove(issue.id)}>Remove</button></div></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default App;
