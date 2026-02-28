const db = require('../config/database');
const crypto = require('crypto');

exports.processPayment = (req, res) => {
  const userId = req.user.id;
  const { orderId, method } = req.body;

  if (!orderId || !method) {
    return res.status(400).json({ message: "Order ID and payment method required" });
  }

  // Check if order exists & belongs to user
  db.get(
    "SELECT * FROM orders WHERE id = ? AND user_id = ?",
    [orderId, userId],
    (err, order) => {
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      if (order.status === "paid") {
        return res.status(409).json({ message: "Order already paid" });
      }

      const transactionId = "TXN_" + crypto.randomBytes(6).toString("hex");

      // Insert payment record
      db.run(
        "INSERT INTO payments (order_id, transaction_id, method) VALUES (?, ?, ?)",
        [orderId, transactionId, method],
        function (err) {
          if (err) {
            return res.status(500).json({ message: "Payment failed" });
          }

          // Update order status
          db.run(
            "UPDATE orders SET status = 'paid' WHERE id = ?",
            [orderId],
            () => {
              res.json({
                success: true,
                transactionId,
                message: "Payment successful"
              });
            }
          );
        }
      );
    }
  );
};