const db = require('../config/database');

exports.getAllProducts = (req, res) => {
  let { page = 1, limit = 10, search, minPrice, maxPrice, sortBy } = req.query;

  page = parseInt(page);
  limit = parseInt(limit);
  const offset = (page - 1) * limit;

  let query = "SELECT * FROM products WHERE 1=1";
  let countQuery = "SELECT COUNT(*) as total FROM products WHERE 1=1";
  let params = [];

  // Search filter
  if (search) {
    query += " AND name LIKE ?";
    countQuery += " AND name LIKE ?";
    params.push(`%${search}%`);
  }

  // Price filter
  if (minPrice) {
    query += " AND price >= ?";
    countQuery += " AND price >= ?";
    params.push(minPrice);
  }

  if (maxPrice) {
    query += " AND price <= ?";
    countQuery += " AND price <= ?";
    params.push(maxPrice);
  }

  // Sorting
  if (sortBy === "price_asc") {
    query += " ORDER BY price ASC";
  } else if (sortBy === "price_desc") {
    query += " ORDER BY price DESC";
  } else {
    query += " ORDER BY id DESC"; // newest
  }

  query += " LIMIT ? OFFSET ?";
  params.push(limit, offset);

  db.all(query, params, (err, products) => {
    if (err) {
      console.error("Create Product Error:", err.message);
      return res.status(500).json({ message: "Database error" });
    }

    db.get(countQuery, params.slice(0, params.length - 2), (err, countResult) => {
      if (err) {
        return res.status(500).json({ message: "Count query failed" });
      }

      res.json({
        success: true,
        page,
        totalPages: Math.ceil(countResult.total / limit),
        totalProducts: countResult.total,
        products
      });
    });
  });
};

exports.createProduct = (req, res) => {
  const { name, description, price, stock, category } = req.body;

  if (!name || !price || !stock) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  const query = `
    INSERT INTO products (name, description, price, stock, category)
    VALUES (?, ?, ?, ?, ?)
  `;

  db.run(query, [name, description, price, stock, category], function (err) {
    if (err) {
      return res.status(500).json({ message: "Database error" });
    }

    res.status(201).json({
      success: true,
      productId: this.lastID
    });
  });
};