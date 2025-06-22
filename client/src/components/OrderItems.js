import React, { useEffect, useState } from "react";
import Papa from "papaparse";
import { FaShoppingCart, FaFileImport, FaFileExport, FaSearch, FaCheck, FaTimes } from "react-icons/fa";

export default function OrderItems() {
  const [orderItems, setOrderItems] = useState([]);
  const [form, setForm] = useState({ order_id: "", product_id: "", quantity: "", price: "" });
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [search, setSearch] = useState("");
  const [importing, setImporting] = useState(false);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);

  // Fetch order items, orders & products
  useEffect(() => {
    fetch("http://localhost:5000/api/orderitems")
      .then(res => res.json())
      .then(data => setOrderItems(Array.isArray(data) ? data : []));
    fetch("http://localhost:5000/api/orders")
      .then(res => res.json())
      .then(data => setOrders(Array.isArray(data) ? data : []));
    fetch("http://localhost:5000/api/products")
      .then(res => res.json())
      .then(data => setProducts(Array.isArray(data) ? data : []));
  }, []);

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleAdd = e => {
    e.preventDefault();
    if (!form.order_id || !form.product_id || !form.quantity || !form.price) {
      setError("Order, product, quantity and price are required");
      setSuccess(null);
      return;
    }
    fetch("http://localhost:5000/api/orderitems", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, quantity: parseInt(form.quantity, 10), price: parseFloat(form.price) }),
    })
      .then(res => res.json().then(data => ({ status: res.status, data })))
      .then(({ status, data }) => {
        if (status >= 400) {
          setError(data.message || "Add failed");
          setSuccess(null);
          return;
        }
        setOrderItems([...orderItems, data]);
        setForm({ order_id: "", product_id: "", quantity: "", price: "" });
        setError(null);
        setSuccess("Order item added!");
        setTimeout(() => setSuccess(null), 1800);
      })
      .catch(() => {
        setError("Add failed");
        setSuccess(null);
      });
  };

  const handleEdit = oi => {
    setEditing(oi.id);
    setForm({
      order_id: oi.order_id,
      product_id: oi.product_id,
      quantity: oi.quantity,
      price: oi.price
    });
    setError(null);
    setSuccess(null);
  };

  const handleUpdate = e => {
    e.preventDefault();
    if (!form.order_id || !form.product_id || !form.quantity || !form.price) {
      setError("Order, product, quantity and price are required");
      setSuccess(null);
      return;
    }
    fetch(`http://localhost:5000/api/orderitems/${editing}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, quantity: parseInt(form.quantity, 10), price: parseFloat(form.price) }),
    })
      .then(res => res.json().then(data => ({ status: res.status, data })))
      .then(({ status, data }) => {
        if (status >= 400) {
          setError(data.message || "Update failed");
          setSuccess(null);
          return;
        }
        setOrderItems(orderItems.map(oi => (oi.id === data.id ? data : oi)));
        setEditing(null);
        setForm({ order_id: "", product_id: "", quantity: "", price: "" });
        setError(null);
        setSuccess("Order item updated!");
        setTimeout(() => setSuccess(null), 1800);
      })
      .catch(() => {
        setError("Update failed");
        setSuccess(null);
      });
  };

  const handleDelete = id => {
    if (!window.confirm("Delete this order item?")) return;
    fetch(`http://localhost:5000/api/orderitems/${id}`, { method: "DELETE" })
      .then(res => {
        if (res.status >= 400) setError("Delete failed");
        else {
          setOrderItems(orderItems.filter(oi => oi.id !== id));
          setError(null);
          setSuccess("Order item deleted!");
          setTimeout(() => setSuccess(null), 1800);
        }
      })
      .catch(() => {
        setError("Delete failed");
        setSuccess(null);
      });
  };

  const handleExport = () => {
    const exportOrderItems = orderItems.map(
      ({ id, order_id, product_id, quantity, price }) => ({
        id, order_id, product_id, quantity, price
      })
    );
    const csv = Papa.unparse(exportOrderItems);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "orderitems.csv");
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
        let newOrderItems = [];
        for (let oi of results.data) {
          if (!oi.order_id || !oi.product_id || !oi.quantity || !oi.price) continue;
          try {
            const res = await fetch("http://localhost:5000/api/orderitems", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                order_id: oi.order_id,
                product_id: oi.product_id,
                quantity: parseInt(oi.quantity, 10),
                price: parseFloat(oi.price),
              }),
            });
            const data = await res.json();
            if (res.status < 400 && data.id) {
              newOrderItems.push(data);
            }
          } catch (e) { /* skip failed */ }
        }
        setOrderItems([...orderItems, ...newOrderItems]);
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

  // --- Defensive filtering: always use string fallback! ---
  const filteredOrderItems = orderItems.filter(oi => {
    const product = products.find(p => String(p.id) === String(oi.product_id));
    const order = orders.find(o => String(o.id) === String(oi.order_id));
    const productName = product ? product.name : "";
    const orderLabel = order ? `#${order.id}` : "";
    return (
      orderLabel.toLowerCase().includes((search || "").toLowerCase()) ||
      productName.toLowerCase().includes((search || "").toLowerCase()) ||
      String(oi.quantity || "").toLowerCase().includes((search || "").toLowerCase()) ||
      String(oi.price || "").toLowerCase().includes((search || "").toLowerCase())
    );
  });

  function getOrderLabel(id) {
    return id ? `#${id}` : "";
  }
  function getProductName(id) {
    const p = products.find(p => String(p.id) === String(id));
    return p ? p.name : "";
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
        <FaShoppingCart style={{ color: "#2563eb" }} /> Order Items
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
              placeholder="Search order items..."
              value={search}
              aria-label="Search order items"
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
          Total: {filteredOrderItems.length} {filteredOrderItems.length === 1 ? "item" : "items"}
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
          <select
            name="order_id"
            required
            value={form.order_id}
            onChange={handleChange}
            className="input"
            style={{
              flex: "1 1 110px", minWidth: 110, padding: "8px 10px", borderRadius: 5, border: "1px solid #dbeafe"
            }}
          >
            <option value="">Order</option>
            {orders.map(o => (
              <option key={o.id} value={o.id}>{getOrderLabel(o.id)}</option>
            ))}
          </select>
          <select
            name="product_id"
            required
            value={form.product_id}
            onChange={handleChange}
            className="input"
            style={{
              flex: "1 1 110px", minWidth: 110, padding: "8px 10px", borderRadius: 5, border: "1px solid #dbeafe"
            }}
          >
            <option value="">Product</option>
            {products.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <input
            name="quantity"
            type="number"
            required
            min={1}
            placeholder="Quantity"
            value={form.quantity}
            onChange={handleChange}
            className="input"
            style={{
              flex: "1 1 90px", minWidth: 90, padding: "8px 10px", borderRadius: 5, border: "1px solid #dbeafe"
            }}
          />
          <input
            name="price"
            type="number"
            required
            min={0}
            step={0.01}
            placeholder="Price"
            value={form.price}
            onChange={handleChange}
            className="input"
            style={{
              flex: "1 1 90px", minWidth: 90, padding: "8px 10px", borderRadius: 5, border: "1px solid #dbeafe"
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
                setForm({ order_id: "", product_id: "", quantity: "", price: "" });
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
                <th style={{ padding: 10, textAlign: "left", fontWeight: 600 }}>Order</th>
                <th style={{ padding: 10, textAlign: "left", fontWeight: 600 }}>Product</th>
                <th style={{ padding: 10, textAlign: "left", fontWeight: 600 }}>Quantity</th>
                <th style={{ padding: 10, textAlign: "left", fontWeight: 600 }}>Price</th>
                <th style={{ padding: 10, textAlign: "left", fontWeight: 600 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrderItems.map(oi => (
                <tr
                  key={oi.id}
                  style={{
                    borderTop: "1px solid #f1f5f9",
                    background: "#fff",
                    transition: "background 0.2s",
                    cursor: "pointer"
                  }}
                  onMouseOver={e => e.currentTarget.style.background = "#f3f4f6"}
                  onMouseOut={e => e.currentTarget.style.background = "#fff"}
                >
                  <td style={{ padding: 10 }}>{getOrderLabel(oi.order_id)}</td>
                  <td style={{ padding: 10 }}>{getProductName(oi.product_id)}</td>
                  <td style={{ padding: 10 }}>{oi.quantity}</td>
                  <td style={{ padding: 10 }}>{oi.price}</td>
                  <td style={{ padding: 10 }}>
                    <button
                      onClick={() => handleEdit(oi)}
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
                      onClick={() => handleDelete(oi.id)}
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
              {filteredOrderItems.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", color: "#aaa", padding: 24 }}>No order items found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}