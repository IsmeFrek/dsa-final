import React, { useEffect, useState } from "react";
import Papa from "papaparse";
import { FaUserPlus, FaFileImport, FaFileExport, FaSearch, FaCheck, FaTimes } from "react-icons/fa";

export default function Users() {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({ username: "", password: "", email: "" });
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [search, setSearch] = useState("");
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    fetch("http://localhost:5000/api/users")
      .then(res => res.json())
      .then(data => setUsers(Array.isArray(data) ? data : []))
      .catch(() => setError("Could not fetch users"));
  }, []);

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleAdd = e => {
    e.preventDefault();
    if (!form.username || !form.password || !form.email) {
      setError("Username, password, and email are required");
      setSuccess(null);
      return;
    }
    fetch("http://localhost:5000/api/users", {
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
        setUsers([...users, data]);
        setForm({ username: "", password: "", email: "" });
        setError(null);
        setSuccess("User added!");
        setTimeout(() => setSuccess(null), 1800);
      })
      .catch(() => {
        setError("Add failed");
        setSuccess(null);
      });
  };

  const handleEdit = u => {
    setEditing(u.id);
    setForm({ username: u.username, password: "", email: u.email });
    setError(null);
    setSuccess(null);
  };

  const handleUpdate = e => {
    e.preventDefault();
    if (!form.username || !form.email) {
      setError("Username and email are required");
      setSuccess(null);
      return;
    }
    const updateBody = { username: form.username, email: form.email };
    if (form.password) updateBody.password = form.password;
    fetch(`http://localhost:5000/api/users/${editing}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updateBody),
    })
      .then(res => res.json().then(data => ({ status: res.status, data })))
      .then(({ status, data }) => {
        if (status >= 400) {
          setError(data.message || "Update failed");
          setSuccess(null);
          return;
        }
        setUsers(users.map(u => (u.id === data.id ? data : u)));
        setEditing(null);
        setForm({ username: "", password: "", email: "" });
        setError(null);
        setSuccess("User updated!");
        setTimeout(() => setSuccess(null), 1800);
      })
      .catch(() => {
        setError("Update failed");
        setSuccess(null);
      });
  };

  const handleDelete = id => {
    if (!window.confirm("Delete this user?")) return;
    fetch(`http://localhost:5000/api/users/${id}`, { method: "DELETE" })
      .then(res => {
        if (res.status >= 400) setError("Delete failed");
        else {
          setUsers(users.filter(u => u.id !== id));
          setError(null);
          setSuccess("User deleted!");
          setTimeout(() => setSuccess(null), 1800);
        }
      })
      .catch(() => {
        setError("Delete failed");
        setSuccess(null);
      });
  };

  // === CSV EXPORT ===
  const handleExport = () => {
    // Exclude password from export for security
    const exportUsers = users.map(({ id, username, email, created_at }) => ({
      id, username, email, created_at
    }));
    const csv = Papa.unparse(exportUsers);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "users.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // === CSV IMPORT ===
  const handleImport = event => {
    setImporting(true);
    const file = event.target.files[0];
    if (!file) return;
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async results => {
        let newUsers = [];
        for (let user of results.data) {
          if (!user.username || !user.email) continue;
          const password = user.password || "password123";
          try {
            const res = await fetch("http://localhost:5000/api/users", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ username: user.username, email: user.email, password }),
            });
            const data = await res.json();
            if (res.status < 400 && data.id) {
              newUsers.push(data);
            }
          } catch (e) { /* skip failed user */ }
        }
        setUsers([...users, ...newUsers]);
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

  const filteredUsers = users.filter(u =>
    u.username.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{
      background: "#fff",
      borderRadius: "18px",
      boxShadow: "0 4px 20px rgba(0,0,0,0.07)",
      padding: "1.5rem 2.5rem 2.5rem 2.5rem",
      maxWidth: 1100,
      margin: "2rem auto",
      minHeight: 600
    }}>
      <div style={{
        fontSize: 30, fontWeight: 700, display: "flex", alignItems: "center", gap: 10, marginBottom: 10
      }}>
        <FaUserPlus style={{ color: "#2563eb" }} /> Users
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
              placeholder="Search users..."
              value={search}
              aria-label="Search users"
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
            className="btn export"
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
            className="btn import"
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
          Total: {filteredUsers.length} {filteredUsers.length === 1 ? "user" : "users"}
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
        <form onSubmit={editing ? handleUpdate : handleAdd} style={{ display: "flex", gap: 10, marginBottom: 20 }}>
          <input
            name="username"
            required
            placeholder="Username"
            value={form.username}
            onChange={handleChange}
            className="input"
            style={{
              flex: 1, padding: "8px 10px", borderRadius: 5, border: "1px solid #dbeafe"
            }}
          />
          <input
            name="email"
            type="email"
            required
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
            className="input"
            style={{
              flex: 1, padding: "8px 10px", borderRadius: 5, border: "1px solid #dbeafe"
            }}
          />
          <input
            name="password"
            type="password"
            required={!editing}
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
            className="input"
            style={{
              flex: 1, padding: "8px 10px", borderRadius: 5, border: "1px solid #dbeafe"
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
                setForm({ username: "", password: "", email: "" });
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
                <th style={{ padding: 10, textAlign: "left", fontWeight: 600 }}>Username</th>
                <th style={{ padding: 10, textAlign: "left", fontWeight: 600 }}>Email</th>
                <th style={{ padding: 10, textAlign: "left", fontWeight: 600 }}>Created At</th>
                <th style={{ padding: 10, textAlign: "left", fontWeight: 600 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(u => (
                <tr
                  key={u.id}
                  style={{
                    borderTop: "1px solid #f1f5f9",
                    background: "#fff",
                    transition: "background 0.2s",
                    cursor: "pointer"
                  }}
                  onMouseOver={e => e.currentTarget.style.background = "#f3f4f6"}
                  onMouseOut={e => e.currentTarget.style.background = "#fff"}
                >
                  <td style={{ padding: 10 }}>{u.username}</td>
                  <td style={{ padding: 10 }}>{u.email}</td>
                  <td style={{ padding: 10 }}>{u.created_at ? new Date(u.created_at).toLocaleString() : ""}</td>
                  <td style={{ padding: 10 }}>
                    <button
                      onClick={() => handleEdit(u)}
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
                      onClick={() => handleDelete(u.id)}
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
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ textAlign: "center", color: "#aaa", padding: 24 }}>No users found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}