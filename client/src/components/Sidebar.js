import React from "react";
import "./Sidebar.css";
import { FaUser, FaTags, FaUserFriends, FaFolderOpen, FaBoxOpen, FaClipboardList, FaShoppingCart } from "react-icons/fa";
const navItems = [
  { key: "users", label: "Users", icon: <FaUser /> },
  { key: "brands", label: "Brands", icon: <FaTags /> },
  { key: "customers", label: "Customers", icon: <FaUserFriends /> },
  { key: "categories", label: "Categories", icon: <FaFolderOpen /> },
  { key: "products", label: "Products", icon: <FaBoxOpen /> },
  { key: "orders", label: "Orders", icon: <FaClipboardList /> },
  { key: "orderItems", label: "Order Items", icon: <FaShoppingCart /> },
];

export default function Sidebar({ selected, onSelect }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-title">Menu</div>
      <nav>
        {navItems.map(item => (
          <div
            key={item.key}
            className={`sidebar-link${selected === item.key ? " selected" : ""}`}
            onClick={() => onSelect(item.key)}
          >
            <span className="sidebar-icon">{item.icon}</span>
            {item.label}
          </div>
        ))}
      </nav>
    </aside>
  );
}