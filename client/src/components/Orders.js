import React, { useEffect, useState } from "react";
import Papa from "papaparse";
import { FaClipboardList, FaFileImport, FaFileExport, FaSearch, FaCheck, FaTimes } from "react-icons/fa";

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [form, setForm] = useState({ customer_id: "", order_date: "", status: "" });
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [search, setSearch] = useState("");
  const [importing, setImporting] = useState(false);
  const [customers, setCustomers] = useState([]);

  // Fetch orders & customers
  useEffect(() => {
    fetch("http://localhost:5000/api/orders")
      .then(res => res.json())
      .then(data => setOrders(Array.isArray(data) ? data : []));
    fetch("http://localhost:5000/api/customers")
      .then(res => res.json())
      .then(data => setCustomers(Array.isArray(data) ? data : []));
  }, []);

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleAdd = e => {
    e.preventDefault();
    if (!form.customer_id || !form.order_date || !form.status) {
      setError("Customer, order date, and status are required");
      setSuccess(null);
      return;
    }
    fetch("http://localhost:5000/api/orders", {
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
        setOrders([...orders, data]);
        setForm({ customer_id: "", order_date: "", status: "" });
        setError(null);
        setSuccess("Order added!");
        setTimeout(() => setSuccess(null), 1800);
      })
      .catch(() => {
        setError("Add failed");
        setSuccess(null);
      });
  };

  const handleEdit = o => {
    setEditing(o.id);
    setForm({
      customer_id: o.customer_id,
      order_date: o.order_date ? o.order_date.split("T")[0] : "",
      status: o.status,
    });
    setError(null);
    setSuccess(null);
  };

  const handleUpdate = e => {
    e.preventDefault();
    if (!form.customer_id || !form.order_date || !form.status) {
      setError("Customer, order date, and status are required");
      setSuccess(null);
      return;
    }
    fetch(`http://localhost:5000/api/orders/${editing}`, {
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
        setOrders(orders.map(o => (o.id === data.id ? data : o)));
        setEditing(null);
        setForm({ customer_id: "", order_date: "", status: "" });
        setError(null);
        setSuccess("Order updated!");
        setTimeout(() => setSuccess(null), 1800);
      })
      .catch(() => {
        setError("Update failed");
        setSuccess(null);
      });
  };

  const handleDelete = id => {
    if (!window.confirm("Delete this order?")) return;
    fetch(`http://localhost:5000/api/orders/${id}`, { method: "DELETE" })
      .then(res => {
        if (res.status >= 400) setError("Delete failed");
        else {
          setOrders(orders.filter(o => o.id !== id));
          setError(null);
          setSuccess("Order deleted!");
          setTimeout(() => setSuccess(null), 1800);
        }
      })
      .catch(() => {
        setError("Delete failed");
        setSuccess(null);
      });
  };

  const handleExport = () => {
    const exportOrders = orders.map(
      ({ id, customer_id, order_date, status }) => ({
        id, customer_id, order_date, status
      })
    );
    const csv = Papa.unparse(exportOrders);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "orders.csv");
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
        let newOrders = [];
        for (let order of results.data) {
          if (!order.customer_id || !order.order_date || !order.status) continue;
          try {
            const res = await fetch("http://localhost:5000/api/orders", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                customer_id: order.customer_id,
                order_date: order.order_date,
                status: order.status,
              }),
            });
            const data = await res.json();
            if (res.status < 400 && data.id) {
              newOrders.push(data);
            }
          } catch (e) { /* skip failed order */ }
        }
        setOrders([...orders, ...newOrders]);
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

  // Defensive filter: always use a string fallback!
  const filteredOrders = orders.filter(o => {
    const customer = customers.find(c => String(c.id) === String(o.customer_id));
    const customerName = customer && (customer.name || customer.user_id) ? (customer.name || customer.user_id) : "";
    return (
      ((o.status || "").toLowerCase().includes((search || "").toLowerCase())) ||
      ((o.order_date || "").toLowerCase().includes((search || "").toLowerCase())) ||
      (customerName.toLowerCase().includes((search || "").toLowerCase()))
    );
  });

  function getCustomerName(id) {
    const c = customers.find(c => String(c.id) === String(id));
    return c ? (c.name || c.user_id || c.id) : "";
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
        <FaClipboardList style={{ color: "#2563eb" }} /> Orders
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
              placeholder="Search orders..."
              value={search}
              aria-label="Search orders"
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
          Total: {filteredOrders.length} {filteredOrders.length === 1 ? "order" : "orders"}
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
            name="customer_id"
            required
            value={form.customer_id}
            onChange={handleChange}
            className="input"
            style={{
              flex: "1 1 150px", minWidth: 150, padding: "8px 10px", borderRadius: 5, border: "1px solid #dbeafe"
            }}
          >
            <option value="">Select customer</option>
            {customers.map(c => (
              <option key={c.id} value={c.id}>{c.name || c.user_id || c.id}</option>
            ))}
          </select>
          <input
            name="order_date"
            type="date"
            required
            placeholder="Order Date"
            value={form.order_date}
            onChange={handleChange}
            className="input"
            style={{
              flex: "1 1 120px", minWidth: 120, padding: "8px 10px", borderRadius: 5, border: "1px solid #dbeafe"
            }}
          />
          <input
            name="status"
            required
            placeholder="Status"
            value={form.status}
            onChange={handleChange}
            className="input"
            style={{
              flex: "1 1 120px", minWidth: 120, padding: "8px 10px", borderRadius: 5, border: "1px solid #dbeafe"
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
                setForm({ customer_id: "", order_date: "", status: "" });
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
                <th style={{ padding: 10, textAlign: "left", fontWeight: 600 }}>Customer</th>
                <th style={{ padding: 10, textAlign: "left", fontWeight: 600 }}>Order Date</th>
                <th style={{ padding: 10, textAlign: "left", fontWeight: 600 }}>Status</th>
                <th style={{ padding: 10, textAlign: "left", fontWeight: 600 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map(o => (
                <tr
                  key={o.id}
                  style={{
                    borderTop: "1px solid #f1f5f9",
                    background: "#fff",
                    transition: "background 0.2s",
                    cursor: "pointer"
                  }}
                  onMouseOver={e => e.currentTarget.style.background = "#f3f4f6"}
                  onMouseOut={e => e.currentTarget.style.background = "#fff"}
                >
                  <td style={{ padding: 10 }}>{getCustomerName(o.customer_id)}</td>
                  <td style={{ padding: 10 }}>{o.order_date ? (o.order_date.length > 10 ? new Date(o.order_date).toLocaleDateString() : o.order_date) : ""}</td>
                  <td style={{ padding: 10 }}>{o.status}</td>
                  <td style={{ padding: 10 }}>
                    <button
                      onClick={() => handleEdit(o)}
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
                      onClick={() => handleDelete(o.id)}
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
              {filteredOrders.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ textAlign: "center", color: "#aaa", padding: 24 }}>No orders found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}