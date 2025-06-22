import React, { useEffect, useState } from "react";
import Papa from "papaparse";
import { FaTags, FaFileImport, FaFileExport, FaSearch, FaCheck, FaTimes } from "react-icons/fa";

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({ name: "", description: "" });
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [search, setSearch] = useState("");
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    fetch("http://localhost:5000/api/categories")
      .then(res => res.json())
      .then(data => setCategories(Array.isArray(data) ? data : []));
  }, []);

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleAdd = e => {
    e.preventDefault();
    if (!form.name) {
      setError("Category name is required");
      setSuccess(null);
      return;
    }
    fetch("http://localhost:5000/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
      .then(res => res.json().then(data => ({ status: res.status, data })))
      .then(({ status, data }) => {
        if (status >= 400) {
          setError(data.message || "Add failed");
          setSuccess(null);
          return;
        }
        setCategories([...categories, data]);
        setForm({ name: "", description: "" });
        setError(null);
        setSuccess("Category added!");
        setTimeout(() => setSuccess(null), 1800);
      })
      .catch(() => {
        setError("Add failed");
        setSuccess(null);
      });
  };

  const handleEdit = c => {
    setEditing(c.id);
    setForm({ name: c.name, description: c.description || "" });
    setError(null);
    setSuccess(null);
  };

  const handleUpdate = e => {
    e.preventDefault();
    if (!form.name) {
      setError("Category name is required");
      setSuccess(null);
      return;
    }
    fetch(`http://localhost:5000/api/categories/${editing}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
      .then(res => res.json().then(data => ({ status: res.status, data })))
      .then(({ status, data }) => {
        if (status >= 400) {
          setError(data.message || "Update failed");
          setSuccess(null);
          return;
        }
        setCategories(categories.map(c => (c.id === data.id ? data : c)));
        setEditing(null);
        setForm({ name: "", description: "" });
        setError(null);
        setSuccess("Category updated!");
        setTimeout(() => setSuccess(null), 1800);
      })
      .catch(() => {
        setError("Update failed");
        setSuccess(null);
      });
  };

  const handleDelete = id => {
    if (!window.confirm("Delete this category?")) return;
    fetch(`http://localhost:5000/api/categories/${id}`, { method: "DELETE" })
      .then(res => {
        if (res.status >= 400) setError("Delete failed");
        else {
          setCategories(categories.filter(c => c.id !== id));
          setError(null);
          setSuccess("Category deleted!");
          setTimeout(() => setSuccess(null), 1800);
        }
      })
      .catch(() => {
        setError("Delete failed");
        setSuccess(null);
      });
  };

  const handleExport = () => {
    const exportCategories = categories.map(
      ({ id, name, description }) => ({
        id, name, description
      })
    );
    const csv = Papa.unparse(exportCategories);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "categories.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImport = event => {
    setImporting(true);
    const file = event.target.files[0];
    if (!file) return;
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async results => {
        let newCategories = [];
        for (let cat of results.data) {
          if (!cat.name) continue;
          try {
            const res = await fetch("http://localhost:5000/api/categories", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                name: cat.name,
                description: cat.description || "",
              }),
            });
            const data = await res.json();
            if (res.status < 400 && data.id) {
              newCategories.push(data);
            }
          } catch (e) { /* skip failed */ }
        }
        setCategories([...categories, ...newCategories]);
        setImporting(false);
        setSuccess("Import complete!");
        setTimeout(() => setSuccess(null), 1800);
        event.target.value = "";
      },
      error: () => {
        setError("Import failed");
        setSuccess(null);
        setImporting(false);
      }
    });
  };

  const filteredCategories = categories.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.description && c.description.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div style={{
      background: "#fff",
      borderRadius: "18px",
      boxShadow: "0 4px 20px rgba(0,0,0,0.07)",
      padding: "1.5rem 2.5rem 2.5rem 2.5rem",
      maxWidth: 900,
      margin: "2rem auto",
      minHeight: 400
    }}>
      <div style={{
        fontSize: 30, fontWeight: 700, display: "flex", alignItems: "center", gap: 10, marginBottom: 10
      }}>
        <FaTags style={{ color: "#2563eb" }} /> Categories
      </div>
      <div style={{
        background: "#f7fafd",
        borderRadius: "12px",
        padding: "1.2rem 1.5rem 1.5rem 1.5rem",
        marginBottom: "1.5rem",
        border: "1px solid #e5e9f2"
      }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 12, marginBottom: 10, flexWrap: "wrap"
        }}>
          <div style={{ flex: "1 1 220px", display: "flex", alignItems: "center", position: "relative" }}>
            <FaSearch style={{
              position: "absolute", left: 10, color: "#bbb", fontSize: 17
            }} />
            <input
              type="text"
              placeholder="Search categories..."
              value={search}
              aria-label="Search categories"
              onChange={e => setSearch(e.target.value)}
              style={{
                padding: "8px 12px 8px 33px",
                borderRadius: 6,
                border: "1px solid #dbeafe",
                width: "100%",
                fontSize: 16,
                background: "#fff"
              }}
            />
          </div>
          <button
            type="button"
            onClick={handleExport}
            style={{
              padding: "8px 16px",
              background: "#22c55e",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: 6
            }}
          >
            <FaFileExport /> Export CSV
          </button>
          <label
            style={{
              padding: "8px 16px",
              background: "#2563eb",
              color: "#fff",
              borderRadius: 6,
              cursor: importing ? "not-allowed" : "pointer",
              opacity: importing ? 0.7 : 1,
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: 6
            }}
          >
            <FaFileImport /> Import CSV
            <input
              type="file"
              accept=".csv"
              onChange={handleImport}
              style={{ display: "none" }}
              disabled={importing}
            />
          </label>
          {importing && <span style={{ marginLeft: 8, color: "#555" }}>Importing...</span>}
        </div>
        <div style={{ marginBottom: 16, fontWeight: 500 }}>
          Total: {filteredCategories.length} {filteredCategories.length === 1 ? "category" : "categories"}
        </div>
        {error && (
          <div style={{
            background: "#fee2e2", color: "#991b1b", borderRadius: 6, padding: "6px 14px", marginBottom: 12,
            display: "flex", alignItems: "center", gap: 8, fontWeight: 500
          }}>
            <FaTimes /> {error}
          </div>
        )}
        {success && (
          <div style={{
            background: "#d1fae5", color: "#065f46", borderRadius: 6, padding: "6px 14px", marginBottom: 12,
            display: "flex", alignItems: "center", gap: 8, fontWeight: 500
          }}>
            <FaCheck /> {success}
          </div>
        )}
        <form onSubmit={editing ? handleUpdate : handleAdd} style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
          <input
            name="name"
            required
            placeholder="Category Name"
            value={form.name}
            onChange={handleChange}
            className="input"
            style={{
              flex: "1 1 170px", minWidth: 170, padding: "8px 10px", borderRadius: 5, border: "1px solid #dbeafe"
            }}
          />
          <input
            name="description"
            placeholder="Description"
            value={form.description}
            onChange={handleChange}
            className="input"
            style={{
              flex: "3 1 250px", minWidth: 120, padding: "8px 10px", borderRadius: 5, border: "1px solid #dbeafe"
            }}
          />
          <button
            className="button"
            type="submit"
            style={{
              padding: "8px 18px",
              background: "#2563eb",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
              fontWeight: 600,
              minWidth: 82
            }}
          >
            {editing ? "Update" : "Add"}
          </button>
          {editing && (
            <button
              className="button"
              type="button"
              onClick={() => {
                setEditing(null);
                setForm({ name: "", description: "" });
                setError(null);
                setSuccess(null);
              }}
              style={{
                padding: "8px 13px",
                background: "#6b7280",
                color: "#fff",
                border: "none",
                borderRadius: 6,
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              Cancel
            </button>
          )}
        </form>
        <div style={{ overflowX: "auto" }}>
          <table style={{
            width: "100%",
            borderCollapse: "separate",
            borderSpacing: 0,
            background: "#fff",
            borderRadius: "8px",
            overflow: "hidden",
            boxShadow: "0 1px 2px rgba(0,0,0,0.02)"
          }}>
            <thead>
              <tr style={{ background: "#f1f5f9" }}>
                <th style={{ padding: 10, textAlign: "left", fontWeight: 600 }}>Name</th>
                <th style={{ padding: 10, textAlign: "left", fontWeight: 600 }}>Description</th>
                <th style={{ padding: 10, textAlign: "left", fontWeight: 600 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCategories.map(c => (
                <tr
                  key={c.id}
                  style={{
                    borderTop: "1px solid #f1f5f9",
                    background: "#fff",
                    transition: "background 0.2s",
                    cursor: "pointer"
                  }}
                  onMouseOver={e => e.currentTarget.style.background = "#f3f4f6"}
                  onMouseOut={e => e.currentTarget.style.background = "#fff"}
                >
                  <td style={{ padding: 10 }}>{c.name}</td>
                  <td style={{ padding: 10, maxWidth: 350, whiteSpace: "nowrap", textOverflow: "ellipsis", overflow: "hidden" }}>{c.description}</td>
                  <td style={{ padding: 10 }}>
                    <button
                      onClick={() => handleEdit(c)}
                      style={{
                        padding: "6px 14px",
                        background: "#2563eb",
                        color: "#fff",
                        border: "none",
                        borderRadius: 5,
                        marginRight: 7,
                        cursor: "pointer",
                        fontWeight: 500,
                        fontSize: 15
                      }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(c.id)}
                      style={{
                        padding: "6px 14px",
                        background: "#ef4444",
                        color: "#fff",
                        border: "none",
                        borderRadius: 5,
                        cursor: "pointer",
                        fontWeight: 500,
                        fontSize: 15
                      }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {filteredCategories.length === 0 && (
                <tr>
                  <td colSpan={3} style={{ textAlign: "center", color: "#aaa", padding: 24 }}>No categories found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}