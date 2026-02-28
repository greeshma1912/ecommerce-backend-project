const db = require('../config/database');

exports.addReview = (req, res) => {
  const userId = req.user.id;
  const { productId, rating, comment } = req.body;

  if (!productId || !rating) {
    return res.status(400).json({ message: "Product and rating required" });
  }

  db.run(
    "INSERT INTO reviews (user_id, product_id, rating, comment) VALUES (?, ?, ?, ?)",
    [userId, productId, rating, comment],
    function (err) {
      if (err) {
        return res.status(409).json({ message: "You already reviewed this product" });
      }

      res.json({ success: true, message: "Review added" });
    }
  );
};

exports.getProductReviews = (req, res) => {
  const productId = req.params.productId;

  const query = `
    SELECT reviews.rating, reviews.comment, users.name
    FROM reviews
    JOIN users ON reviews.user_id = users.id
    WHERE reviews.product_id = ?
    ORDER BY reviews.created_at DESC
  `;

  db.all(query, [productId], (err, reviews) => {
    if (err) return res.status(500).json({ message: "Database error" });

    const avgQuery = `
      SELECT AVG(rating) as averageRating, COUNT(*) as totalReviews
      FROM reviews WHERE product_id = ?
    `;

    db.get(avgQuery, [productId], (err, stats) => {
      res.json({
        success: true,
        averageRating: Number(stats.averageRating || 0).toFixed(1),
        totalReviews: stats.totalReviews,
        reviews
      });
    });
  });
};