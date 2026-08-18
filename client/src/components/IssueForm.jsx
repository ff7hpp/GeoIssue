function IssueForm({ form, editingId, categories, statuses, onChange, onSubmit, onCancel }) {
  return (
    <section className="form-section">
      <h2>{editingId !== null ? "Edit Issue" : "Add New Issue"}</h2>

      <form onSubmit={onSubmit}>
        <label htmlFor="title">Title</label>
        <input
          id="title"
          value={form.title}
          onChange={(event) => onChange("title", event.target.value)}
        />

        <label htmlFor="description">Description</label>
        <textarea
          id="description"
          rows="4"
          value={form.description}
          onChange={(event) => onChange("description", event.target.value)}
        />

        <label htmlFor="category">Category</label>
        <select
          id="category"
          value={form.category}
          onChange={(event) => onChange("category", event.target.value)}
        >
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>

        <label htmlFor="status">Status</label>
        <select
          id="status"
          value={form.status}
          onChange={(event) => onChange("status", event.target.value)}
        >
          {statuses.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>

        <label htmlFor="reporter">Reporter name</label>
        <input
          id="reporter"
          value={form.reporter}
          onChange={(event) => onChange("reporter", event.target.value)}
        />

        <p className="coordinates">
          Location: {form.lat.toFixed(5)}, {form.lng.toFixed(5)}
        </p>

        <div className="form-buttons">
          <button className="save-button" type="submit">
            {editingId !== null ? "Update" : "Add Issue"}
          </button>
          {editingId !== null && (
            <button className="cancel-button" type="button" onClick={onCancel}>
              Cancel
            </button>
          )}
        </div>
      </form>
    </section>
  );
}

export default IssueForm;
