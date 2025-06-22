import React, { useEffect, useState } from "react";
import Papa from "papaparse";
import { FaBoxOpen, FaFileImport, FaFileExport, FaSearch, FaCheck, FaTimes } from "react-icons/fa";

export default function Products() {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({ name: "", price: "", stock: "", category_id: "", brand_id: "", description: "" });
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [search, setSearch] = useState("");
  const [importing, setImporting] = useState(false);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);

  // Fetch products, categories & brands
  useEffect(() => {
    fetch("http://localhost:5000/api/products")
      .then(res => res.json())
      .then(data => setProducts(Array.isArray(data) ? data : []));
    fetch("http://localhost:5000/api/categories")
      .then(res => res.json())
      .then(data => setCategories(Array.isArray(data) ? data : []));
    fetch("http://localhost:5000/api/brands")
      .then(res => res.json())
      .then(data => setBrands(Array.isArray(data) ? data : []));
  }, []);

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleAdd = e => {
    e.preventDefault();
    if (!form.name || !form.price || !form.category_id || !form.brand_id) {
      setError("Name, price, category and brand are required");
      setSuccess(null);
      return;
    }
    fetch("http://localhost:5000/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, price: parseFloat(form.price), stock: parseInt(form.stock || "0", 10) }),
    })
      .then(res => res.json().then(data => ({ status: res.status, data })))
      .then(({ status, data }) => {
        if (status >= 400) {
          setError(data.message || "Add failed");
          setSuccess(null);
          return;
        }
        setProducts([...products, data]);
        setForm({ name: "", price: "", stock: "", category_id: "", brand_id: "", description: "" });
        setError(null);
        setSuccess("Product added!");
        setTimeout(() => setSuccess(null), 1800);
      })
      .catch(() => {
        setError("Add failed");
        setSuccess(null);
      });
  };

  const handleEdit = p => {
    setEditing(p.id);
    setForm({
      name: p.name,
      price: p.price,
      stock: p.stock,
      category_id: p.category_id,
      brand_id: p.brand_id,
      description: p.description || ""
    });
    setError(null);
    setSuccess(null);
  };

  const handleUpdate = e => {
    e.preventDefault();
    if (!form.name || !form.price || !form.category_id || !form.brand_id) {
      setError("Name, price, category and brand are required");
      setSuccess(null);
      return;
    }
    fetch(`http://localhost:5000/api/products/${editing}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, price: parseFloat(form.price), stock: parseInt(form.stock || "0", 10) }),
    })
      .then(res => res.json().then(data => ({ status: res.status, data })))
      .then(({ status, data }) => {
        if (status >= 400) {
          setError(data.message || "Update failed");
          setSuccess(null);
          return;
        }
        setProducts(products.map(p => (p.id === data.id ? data : p)));
        setEditing(null);
        setForm({ name: "", price: "", stock: "", category_id: "", brand_id: "", description: "" });
        setError(null);
        setSuccess("Product updated!");
        setTimeout(() => setSuccess(null), 1800);
      })
      .catch(() => {
        setError("Update failed");
        setSuccess(null);
      });
  };

  const handleDelete = id => {
    if (!window.confirm("Delete this product?")) return;
    fetch(`http://localhost:5000/api/products/${id}`, { method: "DELETE" })
      .then(res => {
        if (res.status >= 400) setError("Delete failed");
        else {
          setProducts(products.filter(p => p.id !== id));
          setError(null);
          setSuccess("Product deleted!");
          setTimeout(() => setSuccess(null), 1800);
        }
      })
      .catch(() => {
        setError("Delete failed");
        setSuccess(null);
      });
  };

  const handleExport = () => {
    const exportProducts = products.map(
      ({ id, name, price, stock, category_id, brand_id, description }) => ({
        id, name, price, stock, category_id, brand_id, description
      })
    );
    const csv = Papa.unparse(exportProducts);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "products.csv");
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
        let newProducts = [];
        for (let product of results.data) {
          if (!product.name || !product.price || !product.category_id || !product.brand_id) continue;
          try {
            const res = await fetch("http://localhost:5000/api/products", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                name: product.name,
                price: parseFloat(product.price),
                stock: parseInt(product.stock || "0", 10),
                category_id: product.category_id,
                brand_id: product.brand_id,
                description: product.description || "",
              }),
            });
            const data = await res.json();
            if (res.status < 400 && data.id) {
              newProducts.push(data);
            }
          } catch (e) { /* skip failed product */ }
        }
        setProducts([...products, ...newProducts]);
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

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.description && p.description.toLowerCase().includes(search.toLowerCase()))
  );

  function getCategoryName(id) {
    const cat = categories.find(c => String(c.id) === String(id));
    return cat ? cat.name : "";
  }
  function getBrandName(id) {
    const brand = brands.find(b => String(b.id) === String(id));
    return brand ? brand.name : "";
  }

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
        <FaBoxOpen style={{ color: "#2563eb" }} /> Products
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
              placeholder="Search products..."
              value={search}
              aria-label="Search products"
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
          Total: {filteredProducts.length} {filteredProducts.length === 1 ? "product" : "products"}
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
            placeholder="Name"
            value={form.name}
            onChange={handleChange}
            className="input"
            style={{
              flex: "1 1 110px", minWidth: 110, padding: "8px 10px", borderRadius: 5, border: "1px solid #dbeafe"
            }}
          />
          <input
            name="price"
            type="number"
            required
            placeholder="Price"
            value={form.price}
            onChange={handleChange}
            className="input"
            min={0}
            step={0.01}
            style={{
              flex: "1 1 90px", minWidth: 90, padding: "8px 10px", borderRadius: 5, border: "1px solid #dbeafe"
            }}
          />
          <input
            name="stock"
            type="number"
            placeholder="Stock"
            value={form.stock}
            onChange={handleChange}
            className="input"
            min={0}
            style={{
              flex: "1 1 80px", minWidth: 80, padding: "8px 10px", borderRadius: 5, border: "1px solid #dbeafe"
            }}
          />
          <select
            name="category_id"
            required
            value={form.category_id}
            onChange={handleChange}
            className="input"
            style={{
              flex: "1 1 120px", minWidth: 120, padding: "8px 10px", borderRadius: 5, border: "1px solid #dbeafe"
            }}
          >
            <option value="">Category</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <select
            name="brand_id"
            required
            value={form.brand_id}
            onChange={handleChange}
            className="input"
            style={{
              flex: "1 1 120px", minWidth: 120, padding: "8px 10px", borderRadius: 5, border: "1px solid #dbeafe"
            }}
          >
            <option value="">Brand</option>
            {brands.map(b => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
          <input
            name="description"
            placeholder="Description"
            value={form.description}
            onChange={handleChange}
            className="input"
            style={{
              flex: "3 1 160px", minWidth: 160, padding: "8px 10px", borderRadius: 5, border: "1px solid #dbeafe"
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
                setForm({ name: "", price: "", stock: "", category_id: "", brand_id: "", description: "" });
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
                <th style={{ padding: 10, textAlign: "left", fontWeight: 600 }}>Price</th>
                <th style={{ padding: 10, textAlign: "left", fontWeight: 600 }}>Stock</th>
                <th style={{ padding: 10, textAlign: "left", fontWeight: 600 }}>Category</th>
                <th style={{ padding: 10, textAlign: "left", fontWeight: 600 }}>Brand</th>
                <th style={{ padding: 10, textAlign: "left", fontWeight: 600 }}>Description</th>
                <th style={{ padding: 10, textAlign: "left", fontWeight: 600 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map(p => (
                <tr
                  key={p.id}
                  style={{
                    borderTop: "1px solid #f1f5f9",
                    background: "#fff",
                    transition: "background 0.2s",
                    cursor: "pointer"
                  }}
                  onMouseOver={e => e.currentTarget.style.background = "#f3f4f6"}
                  onMouseOut={e => e.currentTarget.style.background = "#fff"}
                >
                  <td style={{ padding: 10 }}>{p.name}</td>
                  <td style={{ padding: 10 }}>{p.price}</td>
                  <td style={{ padding: 10 }}>{p.stock}</td>
                  <td style={{ padding: 10 }}>{getCategoryName(p.category_id)}</td>
                  <td style={{ padding: 10 }}>{getBrandName(p.brand_id)}</td>
                  <td style={{ padding: 10, maxWidth: 200, whiteSpace: "nowrap", textOverflow: "ellipsis", overflow: "hidden" }}>{p.description}</td>
                  <td style={{ padding: 10 }}>
                    <button
                      onClick={() => handleEdit(p)}
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
                      onClick={() => handleDelete(p.id)}
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
              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", color: "#aaa", padding: 24 }}>No products found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}