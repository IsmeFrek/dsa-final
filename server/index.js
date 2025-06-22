require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

// Health check
app.get('/', (req, res) => {
  res.send('Ecommerce Demo API is running!');
});

// --- Categories CRUD ---
app.get('/api/categories', (req, res) => {
  db.query('SELECT * FROM categories', (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});
app.post('/api/categories', (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ message: "Name is required" });
  db.query('INSERT INTO categories (name) VALUES (?)', [name], (err, result) => {
    if (err) return res.status(500).json({ message: err.message });
    db.query('SELECT * FROM categories WHERE id=?', [result.insertId], (err2, rows) => {
      if (err2) return res.status(500).json({ message: err2.message });
      res.json(rows[0]);
    });
  });
});
app.put('/api/categories/:id', (req, res) => {
  const { name } = req.body;
  db.query('UPDATE categories SET name=? WHERE id=?', [name, req.params.id], (err) => {
    if (err) return res.status(500).json({ message: err.message });
    db.query('SELECT * FROM categories WHERE id=?', [req.params.id], (err2, rows) => {
      if (err2) return res.status(500).json({ message: err2.message });
      res.json(rows[0]);
    });
  });
});
app.delete('/api/categories/:id', (req, res) => {
  db.query('DELETE FROM categories WHERE id=?', [req.params.id], (err) => {
    if (err) return res.status(500).json({ message: err.message });
    res.json({ message: "Category deleted" });
  });
});

// --- Brands CRUD ---
app.get('/api/brands', (req, res) => {
  db.query('SELECT * FROM brands', (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});
app.post('/api/brands', (req, res) => {
  const { name, country } = req.body;
  if (!name) return res.status(400).json({ message: "Name is required" });
  db.query('INSERT INTO brands (name, country) VALUES (?, ?)', [name, country || null], (err, result) => {
    if (err) return res.status(500).json({ message: err.message });
    db.query('SELECT * FROM brands WHERE id=?', [result.insertId], (err2, rows) => {
      if (err2) return res.status(500).json({ message: err2.message });
      res.json(rows[0]);
    });
  });
});
app.put('/api/brands/:id', (req, res) => {
  const { name, country } = req.body;
  if (!name) return res.status(400).json({ message: "Name is required" });
  db.query('UPDATE brands SET name=?, country=? WHERE id=?', [name, country || null, req.params.id], (err) => {
    if (err) return res.status(500).json({ message: err.message });
    db.query('SELECT * FROM brands WHERE id=?', [req.params.id], (err2, rows) => {
      if (err2) return res.status(500).json({ message: err2.message });
      res.json(rows[0]);
    });
  });
});
app.delete('/api/brands/:id', (req, res) => {
  db.query('DELETE FROM brands WHERE id=?', [req.params.id], (err) => {
    if (err) return res.status(500).json({ message: err.message });
    res.json({ message: "Brand deleted" });
  });
});

// --- Products CRUD ---
app.get('/api/products', (req, res) => {
  const { category_id } = req.query;
  let sql = 'SELECT * FROM products';
  const params = [];
  if (category_id) {
    sql += ' WHERE category_id = ?';
    params.push(category_id);
  }
  db.query(sql, params, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});
app.post('/api/products', (req, res) => {
  const { name, price, stock, category_id, brand_id, description } = req.body;
  if (!name || !price || !category_id || !brand_id) {
    return res.status(400).json({ message: "Missing required fields" });
  }
  db.query(
    'INSERT INTO products (name, price, stock, category_id, brand_id, description) VALUES (?, ?, ?, ?, ?, ?)',
    [name, price, stock || 0, category_id, brand_id, description || null],
    (err, result) => {
      if (err) return res.status(500).json({ message: err.message });
      db.query('SELECT * FROM products WHERE id=?', [result.insertId], (err2, rows) => {
        if (err2) return res.status(500).json({ message: err2.message });
        res.json(rows[0]);
      });
    }
  );
});
app.put('/api/products/:id', (req, res) => {
  const { name, price, stock, category_id, brand_id, description } = req.body;
  db.query(
    'UPDATE products SET name=?, price=?, stock=?, category_id=?, brand_id=?, description=? WHERE id=?',
    [name, price, stock || 0, category_id, brand_id, description || null, req.params.id],
    (err) => {
      if (err) return res.status(500).json({ message: err.message });
      db.query('SELECT * FROM products WHERE id=?', [req.params.id], (err2, rows) => {
        if (err2) return res.status(500).json({ message: err2.message });
        res.json(rows[0]);
      });
    }
  );
});
app.delete('/api/products/:id', (req, res) => {
  db.query('DELETE FROM products WHERE id=?', [req.params.id], (err) => {
    if (err) return res.status(500).json({ message: err.message });
    res.json({ message: "Product deleted" });
  });
});

// --- Customers CRUD ---
app.get('/api/customers', (req, res) => {
  db.query('SELECT * FROM customers', (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});
app.post('/api/customers', (req, res) => {
  const { user_id, address, phone } = req.body;
  if (!user_id || !address || !phone) {
    return res.status(400).json({ message: "user_id, address, and phone are required" });
  }
  db.query(
    'INSERT INTO customers (user_id, address, phone) VALUES (?, ?, ?)',
    [user_id, address, phone],
    (err, result) => {
      if (err) return res.status(500).json({ message: err.message });
      db.query('SELECT * FROM customers WHERE id=?', [result.insertId], (err2, rows) => {
        if (err2) return res.status(500).json({ message: err2.message });
        res.json(rows[0]);
      });
    }
  );
});
app.put('/api/customers/:id', (req, res) => {
  const { user_id, address, phone } = req.body;
  db.query(
    'UPDATE customers SET user_id=?, address=?, phone=? WHERE id=?',
    [user_id, address, phone, req.params.id],
    (err) => {
      if (err) return res.status(500).json({ message: err.message });
      db.query('SELECT * FROM customers WHERE id=?', [req.params.id], (err2, rows) => {
        if (err2) return res.status(500).json({ message: err2.message });
        res.json(rows[0]);
      });
    }
  );
});
app.delete('/api/customers/:id', (req, res) => {
  db.query('DELETE FROM customers WHERE id=?', [req.params.id], (err) => {
    if (err) return res.status(500).json({ message: err.message });
    res.json({ message: "Customer deleted" });
  });
});

// --- Users CRUD ---
app.get('/api/users', (req, res) => {
  db.query('SELECT * FROM users', (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});
app.post('/api/users', (req, res) => {
  const { username, password, email } = req.body;
  if (!username || !password || !email) {
    return res.status(400).json({ message: "Username, password, and email are required" });
  }
  db.query(
    'INSERT INTO users (username, password, email) VALUES (?, ?, ?)',
    [username, password, email],
    (err, result) => {
      if (err) return res.status(500).json({ message: err.message });
      db.query('SELECT * FROM users WHERE id=?', [result.insertId], (err2, rows) => {
        if (err2) return res.status(500).json({ message: err2.message });
        res.json(rows[0]);
      });
    }
  );
});
app.put('/api/users/:id', (req, res) => {
  const { username, password, email } = req.body;
  if (!username || !email) return res.status(400).json({ message: "Username and email are required" });
  let sql, params;
  if (password) {
    sql = 'UPDATE users SET username=?, password=?, email=? WHERE id=?';
    params = [username, password, email, req.params.id];
  } else {
    sql = 'UPDATE users SET username=?, email=? WHERE id=?';
    params = [username, email, req.params.id];
  }
  db.query(sql, params, (err) => {
    if (err) return res.status(500).json({ message: err.message });
    db.query('SELECT * FROM users WHERE id=?', [req.params.id], (err2, rows) => {
      if (err2) return res.status(500).json({ message: err2.message });
      res.json(rows[0]);
    });
  });
});
app.delete('/api/users/:id', (req, res) => {
  db.query('DELETE FROM users WHERE id=?', [req.params.id], (err) => {
    if (err) return res.status(500).json({ message: err.message });
    res.json({ message: "User deleted" });
  });
});

// --- Orders CRUD ---
app.get('/api/orders', (req, res) => {
  const { customer_id } = req.query;
  if (customer_id) {
    db.query('SELECT * FROM orders WHERE customer_id=?', [customer_id], (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(results);
    });
  } else {
    db.query('SELECT * FROM orders', (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(results);
    });
  }
});
app.post('/api/orders', (req, res) => {
  const { customer_id, order_date, total } = req.body;
  if (!customer_id || !order_date || !total) {
    return res.status(400).json({ message: "customer_id, order_date, and total are required" });
  }
  db.query(
    'INSERT INTO orders (customer_id, order_date, total) VALUES (?, ?, ?)',
    [customer_id, order_date, total],
    (err, result) => {
      if (err) return res.status(500).json({ message: err.message });
      db.query('SELECT * FROM orders WHERE id=?', [result.insertId], (err2, rows) => {
        if (err2) return res.status(500).json({ message: err2.message });
        res.json(rows[0]);
      });
    }
  );
});
app.put('/api/orders/:id', (req, res) => {
  const { customer_id, order_date, total } = req.body;
  db.query(
    'UPDATE orders SET customer_id=?, order_date=?, total=? WHERE id=?',
    [customer_id, order_date, total, req.params.id],
    (err) => {
      if (err) return res.status(500).json({ message: err.message });
      db.query('SELECT * FROM orders WHERE id=?', [req.params.id], (err2, rows) => {
        if (err2) return res.status(500).json({ message: err2.message });
        res.json(rows[0]);
      });
    }
  );
});
app.delete('/api/orders/:id', (req, res) => {
  db.query('DELETE FROM orders WHERE id=?', [req.params.id], (err) => {
    if (err) return res.status(500).json({ message: err.message });
    res.json({ message: "Order deleted" });
  });
});

// --- Order Items CRUD ---
app.get('/api/order_items', (req, res) => {
  const { order_id } = req.query;
  if (order_id) {
    db.query('SELECT * FROM order_items WHERE order_id=?', [order_id], (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(results);
    });
  } else {
    db.query('SELECT * FROM order_items', (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(results);
    });
  }
});
app.post('/api/order_items', (req, res) => {
  const { order_id, product_id, quantity, price } = req.body;
  if (!order_id || !product_id || !quantity || !price) {
    return res.status(400).json({ message: "order_id, product_id, quantity, and price are required" });
  }
  db.query(
    'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)',
    [order_id, product_id, quantity, price],
    (err, result) => {
      if (err) return res.status(500).json({ message: err.message });
      db.query('SELECT * FROM order_items WHERE id=?', [result.insertId], (err2, rows) => {
        if (err2) return res.status(500).json({ message: err2.message });
        res.json(rows[0]);
      });
    }
  );
});
app.put('/api/order_items/:id', (req, res) => {
  const { order_id, product_id, quantity, price } = req.body;
  db.query(
    'UPDATE order_items SET order_id=?, product_id=?, quantity=?, price=? WHERE id=?',
    [order_id, product_id, quantity, price, req.params.id],
    (err) => {
      if (err) return res.status(500).json({ message: err.message });
      db.query('SELECT * FROM order_items WHERE id=?', [req.params.id], (err2, rows) => {
        if (err2) return res.status(500).json({ message: err2.message });
        res.json(rows[0]);
      });
    }
  );
});
app.delete('/api/order_items/:id', (req, res) => {
  db.query('DELETE FROM order_items WHERE id=?', [req.params.id], (err) => {
    if (err) return res.status(500).json({ message: err.message });
    res.json({ message: "Order item deleted" });
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});