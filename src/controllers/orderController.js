const db = require('../config/database');

exports.createOrder = (req, res) => {
  const userId = req.user.id;

  // Get cart items
  const cartQuery = `
    SELECT cart_items.*, products.price, products.stock
    FROM cart_items
    JOIN products ON cart_items.product_id = products.id
    WHERE cart_items.user_id = ?
  `;

  db.all(cartQuery, [userId], (err, cartItems) => {
    if (err) return res.status(500).json({ message: "Database error" });

    if (cartItems.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    // Check stock
    for (let item of cartItems) {
      if (item.quantity > item.stock) {
        return res.status(409).json({ message: "Insufficient stock for some items" });
      }
    }

    const totalAmount = cartItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    // Create order
    db.run(
      "INSERT INTO orders (user_id, total_amount) VALUES (?, ?)",
      [userId, totalAmount],
      function (err) {
        if (err) return res.status(500).json({ message: "Order creation failed" });

        const orderId = this.lastID;

        // Insert order items
        cartItems.forEach((item) => {
          db.run(
            "INSERT INTO order_items (order_id, product_id, price, quantity) VALUES (?, ?, ?, ?)",
            [orderId, item.product_id, item.price, item.quantity]
          );

          // Reduce stock
          db.run(
            "UPDATE products SET stock = stock - ? WHERE id = ?",
            [item.quantity, item.product_id]
          );
        });

        // Clear cart
        db.run("DELETE FROM cart_items WHERE user_id = ?", [userId]);

        res.json({
          success: true,
          orderId,
          totalAmount,
          status: "pending"
        });
      }
    );
  });
};

exports.getUserOrders = (req, res) => {
  const userId = req.user.id;

  db.all(
    "SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC",
    [userId],
    (err, orders) => {
      if (err) return res.status(500).json({ message: "Database error" });
      res.json({ success: true, orders });
    }
  );
};