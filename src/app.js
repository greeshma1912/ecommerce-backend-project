const express = require('express');
const dotenv = require('dotenv');
const rateLimit = require('express-rate-limit');
const fs = require('fs');
const path = require('path');
const db = require('./config/database');

dotenv.config();

const app = express();   // ✅ CREATE APP FIRST

app.use(express.json());

/* ---------------- DATABASE INIT ---------------- */

const schemaPath = path.join(__dirname, '../database/schema.sql');
const seedPath = path.join(__dirname, '../database/seeds.sql');

db.serialize(() => {
  db.exec(fs.readFileSync(schemaPath).toString());
});

/* ---------------- RATE LIMIT ---------------- */

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use(limiter);

/* ---------------- ROUTES ---------------- */

const authRoutes = require('./routes/authRoutes');
app.use('/api/auth', authRoutes);

const productRoutes = require('./routes/productRoutes');
app.use('/api/products', productRoutes);

const cartRoutes = require('./routes/cartRoutes');
app.use('/api/cart', cartRoutes);

const orderRoutes = require('./routes/orderRoutes');
app.use('/api/orders', orderRoutes);

const paymentRoutes = require('./routes/paymentRoutes');
app.use('/api/payments', paymentRoutes);

const reviewRoutes = require('./routes/reviewRoutes');
app.use('/api/reviews', reviewRoutes);
/* ---------------- ROOT ROUTE ---------------- */

app.get('/', (req, res) => {
  res.json({ message: 'Ecommerce Backend Running' });
});

app.get('/debug/users', (req, res) => {
  db.all("SELECT * FROM users", [], (err, rows) => {
    res.json(rows);
  });
});

/* ---------------- SERVER ---------------- */

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));