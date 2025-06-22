import React, { useEffect, useState } from "react";

export default function Brands() {
  const [brands, setBrands] = useState([]);
  const [form, setForm] = useState({ name: "", country: "" });
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch("http://localhost:5000/api/brands")
      .then(res => res.json())
      .then(data => setBrands(Array.isArray(data) ? data : []))
      .catch(() => setError("Could not fetch brands"));
  }, []);

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleAdd = e => {
    e.preventDefault();
    if (!form.name) {
      setError("Name is required");
      return;
    }
    fetch("http://localhost:5000/api/brands", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
      .then(res => res.json().then(data => ({ status: res.status, data })))
      .then(({ status, data }) => {
        if (status >= 400) {
          setError(data.message || "Add failed");
          return;
        }
        setBrands([...brands, data]);
        setForm({ name: "", country: "" });
        setError(null);
      })
      .catch(() => setError("Add failed"));
  };

  const handleEdit = b => {
    setEditing(b.id);
    setForm({ name: b.name, country: b.country || "" });
  };

  const handleUpdate = e => {
    e.preventDefault();
    if (!form.name) {
      setError("Name is required");
      return;
    }
    fetch(`http://localhost:5000/api/brands/${editing}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
      .then(res => res.json().then(data => ({ status: res.status, data })))
      .then(({ status, data }) => {
        if (status >= 400) {
          setError(data.message || "Update failed");
          return;
        }
        setBrands(brands.map(b => (b.id === data.id ? data : b)));
        setEditing(null);
        setForm({ name: "", country: "" });
        setError(null);
      })
      .catch(() => setError("Update failed"));
  };

  const handleDelete = id => {
    if (!window.confirm("Delete this brand?")) return;
    fetch(`http://localhost:5000/api/brands/${id}`, { method: "DELETE" })
      .then(res => {
        if (res.status >= 400) setError("Delete failed");
        else {
          setBrands(brands.filter(b => b.id !== id));
          setError(null);
        }
      })
      .catch(() => setError("Delete failed"));
  };

  return (
    <div>
      <h2>Brands</h2>
      {error && <div style={{ color: "red" }}>{error}</div>}
      <form onSubmit={editing ? handleUpdate : handleAdd}>
        <div className="form-row">
          <input name="name" required placeholder="Name" value={form.name} onChange={handleChange} />
          <input name="country" placeholder="Country" value={form.country} onChange={handleChange} />
        </div>
        <div className="form-actions">
          <button className="button" type="submit">{editing ? "Update" : "Add"}</button>
          {editing && (
            <button className="button" type="button" onClick={() => {
              setEditing(null);
              setForm({ name: "", country: "" });
              setError(null);
            }}>
              Cancel
            </button>
          )}
        </div>
      </form>
      <div style={{ marginBottom: 16, fontWeight: 500 }}>
        Total: {brands.length} {brands.length === 1 ? "brand" : "brands"}
      </div>
      <table className="table">
        <thead>
          <tr><th>Name</th><th>Country</th><th>Actions</th></tr>
        </thead>
        <tbody>
        {brands.map(b => (
          <tr key={b.id}>
            <td>{b.name}</td>
            <td>{b.country}</td>
            <td>
              <button className="button" onClick={() => handleEdit(b)}>Edit</button>
              <button className="button button-danger" onClick={() => handleDelete(b.id)}>Delete</button>
            </td>
          </tr>
        ))}
        </tbody>
      </table>
    </div>
  );
}