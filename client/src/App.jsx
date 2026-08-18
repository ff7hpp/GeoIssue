import { useEffect, useMemo, useState } from "react";
import IssueForm from "./components/IssueForm";
import IssueTable from "./components/IssueTable";
import SimpleMap from "./components/SimpleMap";
import { categories, statuses } from "./data";
import "./App.css";

const emptyForm = {
  title: "",
  description: "",
  category: "Road",
  status: "Pending",
  reporter: "",
  lat: 39.9255,
  lng: 32.8663,
};

const exampleIssues = [
  {
    id: 1,
    title: "Broken road",
    description: "There is a large hole near the bus stop.",
    category: "Road",
    status: "Pending",
    reporter: "Ali",
    lat: 39.9321,
    lng: 32.8597,
  },
  {
    id: 2,
    title: "Street light problem",
    description: "The street light has not worked for two days.",
    category: "Electricity",
    status: "In Progress",
    reporter: "Zeynep",
    lat: 39.9182,
    lng: 32.8368,
  },
];

function loadIssues() {
  const savedIssues = localStorage.getItem("geoissue_student_issues");

  try {
    return savedIssues ? JSON.parse(savedIssues) : exampleIssues;
  } catch {
    return exampleIssues;
  }
}

function App() {
  const [issues, setIssues] = useState(loadIssues);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");

  useEffect(() => {
    localStorage.setItem("geoissue_student_issues", JSON.stringify(issues));
  }, [issues]);

  const filteredIssues = useMemo(() => {
    return issues.filter((issue) => {
      const text = `${issue.title} ${issue.description} ${issue.reporter}`.toLowerCase();
      const matchesSearch = text.includes(search.toLowerCase());
      const matchesCategory = categoryFilter === "All" || issue.category === categoryFilter;

      return matchesSearch && matchesCategory;
    });
  }, [issues, search, categoryFilter]);

  function updateForm(name, value) {
    setForm({ ...form, [name]: value });
  }

  function selectLocation(event) {
    const map = event.currentTarget.getBoundingClientRect();
    const horizontalPosition = (event.clientX - map.left) / map.width;
    const verticalPosition = (event.clientY - map.top) / map.height;

    setForm({
      ...form,
      lng: Number((32.72 + horizontalPosition * 0.32).toFixed(5)),
      lat: Number((40.02 - verticalPosition * 0.2).toFixed(5)),
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
          issue.id === editingId ? { ...form, id: editingId } : issue,
        ),
      );
    } else {
      setIssues([...issues, { ...form, id: Date.now() }]);
    }

    cancelEdit();
  }

  function startEdit(issue) {
    setForm(issue);
    setEditingId(issue.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function removeIssue(id) {
    const shouldRemove = window.confirm("Are you sure you want to remove this issue?");

    if (shouldRemove) {
      setIssues(issues.filter((issue) => issue.id !== id));

      if (editingId === id) {
        cancelEdit();
      }
    }
  }

  function cancelEdit() {
    setForm(emptyForm);
    setEditingId(null);
  }

  return (
    <div className="page">
      <header className="site-header">
        <div className="container">
          <h1>GeoIssue</h1>
          <p>City problem reporting system</p>
        </div>
      </header>

      <main className="container">
        <div className="top-section">
          <IssueForm
            form={form}
            editingId={editingId}
            categories={categories}
            statuses={statuses}
            onChange={updateForm}
            onSubmit={saveIssue}
            onCancel={cancelEdit}
          />
          <SimpleMap issues={filteredIssues} form={form} onSelect={selectLocation} />
        </div>

        <section className="issues-section">
          <div className="section-title">
            <h2>Reported Issues</h2>
            <span>Total: {filteredIssues.length}</span>
          </div>

          <div className="filters">
            <input
              type="search"
              placeholder="Search issue..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <select
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
            >
              <option value="All">All categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          <IssueTable issues={filteredIssues} onEdit={startEdit} onRemove={removeIssue} />
        </section>
      </main>

      <footer>GeoIssue Internship Project</footer>
    </div>
  );
}

export default App;
