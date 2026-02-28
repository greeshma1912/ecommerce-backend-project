const db = require('../config/database');

exports.addToCart = (req, res) => {
  const userId = req.user.id;
  const { productId, quantity } = req.body;

  if (!productId || !quantity || quantity <= 0) {
    return res.status(400).json({ message: "Invalid input" });
  }

  // Check if product exists
  db.get("SELECT * FROM products WHERE id = ?", [productId], (err, product) => {
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (quantity > product.stock) {
      return res.status(409).json({ message: "Insufficient stock" });
    }

    // Check if already in cart
    db.get(
      "SELECT * FROM cart_items WHERE user_id = ? AND product_id = ?",
      [userId, productId],
      (err, item) => {
        if (item) {
          // Update quantity
          db.run(
            "UPDATE cart_items SET quantity = quantity + ? WHERE id = ?",
            [quantity, item.id],
            () => res.json({ success: true, message: "Cart updated" })
          );
        } else {
          db.run(
            "INSERT INTO cart_items (user_id, product_id, quantity) VALUES (?, ?, ?)",
            [userId, productId, quantity],
            () => res.json({ success: true, message: "Item added to cart" })
          );
        }
      }
    );
  });
};

exports.getCart = (req, res) => {
  const userId = req.user.id;

  const query = `
    SELECT cart_items.id, products.name, products.price, cart_items.quantity,
    (products.price * cart_items.quantity) as total
    FROM cart_items
    JOIN products ON cart_items.product_id = products.id
    WHERE cart_items.user_id = ?
  `;

  db.all(query, [userId], (err, items) => {
    if (err) return res.status(500).json({ message: "Database error" });

    const cartTotal = items.reduce((sum, item) => sum + item.total, 0);

    res.json({
      success: true,
      cartTotal,
      items
    });
  });
};

exports.updateCart = (req, res) => {
  const userId = req.user.id;
  const itemId = req.params.id;
  const { quantity } = req.body;

  db.run(
    "UPDATE cart_items SET quantity = ? WHERE id = ? AND user_id = ?",
    [quantity, itemId, userId],
    function () {
      if (this.changes === 0) {
        return res.status(404).json({ message: "Item not found" });
      }
      res.json({ success: true, message: "Cart updated" });
    }
  );
};

exports.removeFromCart = (req, res) => {
  const userId = req.user.id;
  const itemId = req.params.id;

  db.run(
    "DELETE FROM cart_items WHERE id = ? AND user_id = ?",
    [itemId, userId],
    function () {
      if (this.changes === 0) {
        return res.status(404).json({ message: "Item not found" });
      }
      res.json({ success: true, message: "Item removed" });
    }
  );
};

exports.clearCart = (req, res) => {
  const userId = req.user.id;

  db.run("DELETE FROM cart_items WHERE user_id = ?", [userId], () => {
    res.json({ success: true, message: "Cart cleared" });
  });
};