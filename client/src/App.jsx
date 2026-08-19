import { useEffect, useMemo, useState } from "react";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
} from "firebase/auth";
import { LogOut, Moon, Plus, Sun } from "lucide-react";
import { issueApi } from "./api";
import AuthPage from "./components/AuthPage";
import IssueMap from "./components/IssueMap";
import IssueTable from "./components/IssueTable";
import { auth } from "./firebase";
import "./App.css";

const categories = ["Road", "Water", "Electricity", "Traffic", "Environment", "Other"];
const statuses = ["Pending", "In Progress", "Resolved"];
const emptyForm = {
  title: "",
  description: "",
  category: "Road",
  latitude: 39.9207,
  longitude: 32.8541,
};

function authMessage(error) {
  const messages = {
    "auth/email-already-in-use": "This email already has an account.",
    "auth/invalid-credential": "Email or password is incorrect.",
    "auth/operation-not-allowed": "Enable Email/Password in the Firebase Authentication console.",
    "auth/too-many-requests": "Too many attempts. Please wait and try again.",
  };
  return messages[error.code] || error.message || "Authentication failed.";
}

function App() {
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem("geoissue-theme");
    if (savedTheme) return savedTheme;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });
  const [page, setPage] = useState("sign-in");
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState("");
  const [issues, setIssues] = useState([]);
  const [issuesLoading, setIssuesLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("geoissue-theme", theme);
  }, [theme]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (account) => {
      setUser(account);
      setAuthLoading(false);
      setPage((currentPage) => {
        if (!account) return "sign-in";
        return currentPage === "sign-in" || currentPage === "register" ? "reports" : currentPage;
      });
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    async function loadIssues() {
      try {
        const data = await issueApi.list();
        setIssues(data.issues);
      } catch (error) {
        setMessage(error.message);
      } finally {
        setIssuesLoading(false);
      }
    }

    loadIssues();
  }, []);

  const filteredIssues = useMemo(() => {
    return issues.filter((issue) => {
      const text = `${issue.title} ${issue.description} ${issue.reporter}`.toLowerCase();
      return (
        text.includes(search.toLowerCase()) &&
        (categoryFilter === "All" || issue.category === categoryFilter) &&
        (statusFilter === "All" || issue.status === statusFilter)
      );
    });
  }, [issues, search, categoryFilter, statusFilter]);

  async function handleAuthentication(account, mode) {
    try {
      setAuthBusy(true);
      setAuthError("");

      if (mode === "register") {
        const credential = await createUserWithEmailAndPassword(auth, account.email, account.password);
        await updateProfile(credential.user, { displayName: account.name });
        await credential.user.reload();
        setUser(auth.currentUser);
      } else {
        await signInWithEmailAndPassword(auth, account.email, account.password);
      }
    } catch (error) {
      setAuthError(authMessage(error));
    } finally {
      setAuthBusy(false);
    }
  }

  async function signOut() {
    await firebaseSignOut(auth);
    setForm(emptyForm);
    setEditingId(null);
  }

  function updateForm(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function chooseLocation(latitude, longitude) {
    setForm((current) => ({
      ...current,
      latitude: Number(latitude.toFixed(5)),
      longitude: Number(longitude.toFixed(5)),
    }));
  }

  async function saveIssue(event) {
    event.preventDefault();
    setMessage("");

    if (!form.title.trim() || !form.description.trim()) {
      setMessage("Please enter a title and description.");
      return;
    }

    try {
      const data = editingId === null
        ? await issueApi.create(form)
        : await issueApi.update(editingId, form);

      setIssues((current) => editingId === null
        ? [data.issue, ...current]
        : current.map((issue) => (issue.id === data.issue.id ? data.issue : issue)));
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
      await issueApi.remove(id);
      setIssues((current) => current.filter((issue) => issue.id !== id));
      if (editingId === id) cancelEdit();
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function updateStatus(id, status) {
    try {
      const data = await issueApi.updateStatus(id, status);
      setIssues((current) => current.map((issue) => (issue.id === id ? data.issue : issue)));
    } catch (error) {
      setMessage(error.message);
    }
  }

  const userName = user?.displayName || user?.email?.split("@")[0] || "User";
  const totalIssues = issues.length;
  const pendingIssues = issues.filter((issue) => issue.status === "Pending").length;
  const resolvedIssues = issues.filter((issue) => issue.status === "Resolved").length;
  const themeLabel = theme === "dark" ? "Use light mode" : "Use dark mode";

  const themeButton = (
    <button className="icon-button theme-toggle" type="button" onClick={() => setTheme((current) => current === "dark" ? "light" : "dark")} aria-label={themeLabel} title={themeLabel}>
      {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );

  if (authLoading) {
    return <div className="app-loading">Loading GeoIssue...</div>;
  }

  return (
    <div className="app">
      <header className="topbar">
        <div className="topbar-inner">
          <button className="brand" type="button" onClick={() => setPage(user ? "reports" : "sign-in")}>GeoIssue</button>

          {user ? (
            <>
              <nav className="main-nav" aria-label="Main navigation">
                <button className={page === "dashboard" ? "nav-link active" : "nav-link"} type="button" onClick={() => setPage("dashboard")}>Dashboard</button>
                <button className={page === "reports" ? "nav-link active" : "nav-link"} type="button" onClick={() => setPage("reports")}>Reports</button>
              </nav>
              <div className="account-area"><span>{userName}</span>{themeButton}<button className="sign-out-button" type="button" onClick={signOut}><LogOut size={16} />Sign out</button></div>
            </>
          ) : (
            <nav className="auth-nav">
              {themeButton}
              <button className="nav-link" type="button" onClick={() => { setAuthError(""); setPage("sign-in"); }}>Sign in</button>
              <button className="header-register" type="button" onClick={() => { setAuthError(""); setPage("register"); }}>Create account</button>
            </nav>
          )}
        </div>
      </header>

      <main className="page-content">
        {message && <p className="message" role="alert">{message}</p>}

        {!user ? (
          <AuthPage mode={page} onSubmit={handleAuthentication} onSwitch={(nextPage) => { setAuthError(""); setPage(nextPage); }} busy={authBusy} serverError={authError} />
        ) : page === "reports" ? (
          <ReportsPage
            form={form}
            editingId={editingId}
            issues={filteredIssues}
            allIssues={issues}
            search={search}
            categoryFilter={categoryFilter}
            currentUserId={user.uid}
            onChange={updateForm}
            onChooseLocation={chooseLocation}
            onSubmit={saveIssue}
            onCancel={cancelEdit}
            onSearch={setSearch}
            onCategoryFilter={setCategoryFilter}
            onEdit={startEdit}
            onRemove={removeIssue}
            loading={issuesLoading}
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
            currentUserId={user.uid}
            onSearch={setSearch}
            onCategoryFilter={setCategoryFilter}
            onStatusFilter={setStatusFilter}
            onCreate={() => setPage("reports")}
            onEdit={startEdit}
            onRemove={removeIssue}
            onStatusChange={updateStatus}
            loading={issuesLoading}
          />
        )}
      </main>

      <footer className="footer">GeoIssue Internship Project</footer>
    </div>
  );
}

function ReportsPage({ form, editingId, issues, allIssues, search, categoryFilter, currentUserId, onChange, onChooseLocation, onSubmit, onCancel, onSearch, onCategoryFilter, onEdit, onRemove, loading }) {
  return (
    <section>
      <div className="page-heading"><h1>Report a City Issue</h1><p>Log a civic problem for review.</p></div>
      <div className="report-layout">
        <section className="panel report-form-panel">
          <h2>{editingId !== null ? "Edit Report" : "Add New Issue"}</h2>
          <form onSubmit={onSubmit}>
            <label htmlFor="title">Title</label>
            <input id="title" value={form.title} onChange={(event) => onChange("title", event.target.value)} placeholder="E.g., Pothole on Main St" />
            <label htmlFor="description">Description</label>
            <textarea id="description" rows="5" value={form.description} onChange={(event) => onChange("description", event.target.value)} placeholder="Provide details about the issue..." />
            <label htmlFor="category">Category</label>
            <select id="category" value={form.category} onChange={(event) => onChange("category", event.target.value)}>{categories.map((category) => <option key={category} value={category}>{category}</option>)}</select>
            <label>Location Coordinates</label>
            <div className="two-fields coordinates"><input readOnly value={`Lat: ${form.latitude.toFixed(5)}`} /><input readOnly value={`Lng: ${form.longitude.toFixed(5)}`} /></div>
            <div className="form-actions">{editingId !== null && <button className="secondary-button" type="button" onClick={onCancel}>Cancel</button>}<button className="primary-button" type="submit">{editingId !== null ? "Update Report" : "Submit Report"}</button></div>
          </form>
        </section>
        <IssueMap latitude={form.latitude} longitude={form.longitude} issues={allIssues} onPick={onChooseLocation} />
      </div>

      <section className="panel reports-panel">
        <div className="panel-title-row table-title-row"><h2>Community Reports</h2><div className="filters"><input type="search" value={search} onChange={(event) => onSearch(event.target.value)} placeholder="Search reports..." /><select value={categoryFilter} onChange={(event) => onCategoryFilter(event.target.value)}><option value="All">All Categories</option>{categories.map((category) => <option key={category} value={category}>{category}</option>)}</select></div></div>
        <IssueTable issues={issues} currentUserId={currentUserId} onEdit={onEdit} onRemove={onRemove} loading={loading} />
      </section>
    </section>
  );
}

function DashboardPage({ total, pending, resolved, issues, search, categoryFilter, statusFilter, currentUserId, onSearch, onCategoryFilter, onStatusFilter, onCreate, onEdit, onRemove, onStatusChange, loading }) {
  return (
    <section>
      <div className="page-heading dashboard-heading"><div><h1>System Overview</h1><p>Real-time status of reported civic issues.</p></div><button className="primary-button" type="button" onClick={onCreate}><Plus size={17} />Create Report</button></div>
      <div className="stat-grid"><StatCard label="Total Reports" value={total} type="total" /><StatCard label="Pending" value={pending} type="pending" /><StatCard label="Resolved" value={resolved} type="resolved" /></div>
      <section className="panel admin-panel">
        <div className="panel-title-row table-title-row"><h2>Recent Reports</h2><div className="filters admin-filters"><input type="search" value={search} onChange={(event) => onSearch(event.target.value)} placeholder="Search issues..." /><select value={categoryFilter} onChange={(event) => onCategoryFilter(event.target.value)}><option value="All">All Categories</option>{categories.map((category) => <option key={category} value={category}>{category}</option>)}</select><select value={statusFilter} onChange={(event) => onStatusFilter(event.target.value)}><option value="All">All Statuses</option>{statuses.map((status) => <option key={status} value={status}>{status}</option>)}</select></div></div>
        <IssueTable admin issues={issues} currentUserId={currentUserId} onEdit={onEdit} onRemove={onRemove} onStatusChange={onStatusChange} loading={loading} />
      </section>
    </section>
  );
}

function StatCard({ label, value, type }) {
  return <section className={`stat-card ${type}`}><span>{label}</span><strong>{value}</strong></section>;
}

export default App;
