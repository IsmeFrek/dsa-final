import React, { useState } from "react";
import "./App.css";
import Sidebar from "./components/Sidebar";
import Customers from "./components/Customers";
import Categories from "./components/Categories";
import Products from "./components/Products";
import Orders from "./components/Orders";
import OrderItems from "./components/OrderItems";
import Brands from "./components/Brands";
import Users from "./components/Users";

export default function App() {
  const [selectedSection, setSelectedSection] = useState("products");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedBrand, setSelectedBrand] = useState(null);

  return (
    <div className="app-layout">
      <Sidebar
        selected={selectedSection}
        onSelect={setSelectedSection}
      />
      <main className="main-container">
        <h1>
          <span role="img" aria-label="cart">🛒</span> E-Commerce Demo
        </h1>
        {selectedSection === "users" && (
          <Users />
        )}
        {selectedSection === "brands" && (
          <Brands
            onSelect={brand => setSelectedBrand(brand)}
            selectedBrand={selectedBrand}
          />
        )}
        {selectedSection === "customers" && (
          <Customers
            onSelect={customer => {
              setSelectedCustomer(customer);
              setSelectedOrder(null);
            }}
            selectedCustomer={selectedCustomer}
          />
        )}
        {selectedSection === "categories" && (
          <Categories
            onSelect={category => setSelectedCategory(category)}
            selectedCategory={selectedCategory}
          />
        )}
        {selectedSection === "products" && (
          <Products
            categoryId={selectedCategory ? selectedCategory.id : null}
          />
        )}
        {selectedSection === "orders" && (
          <Orders
            customer={selectedCustomer}
            onSelect={order => setSelectedOrder(order)}
            selectedOrder={selectedOrder}
          />
        )}
        {selectedSection === "orderItems" && (
          <OrderItems order={selectedOrder} />
        )}
      </main>
    </div>
  );
}