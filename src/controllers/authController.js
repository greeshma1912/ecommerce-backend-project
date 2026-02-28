const db = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.register = (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'All fields required' });
  }

  const hashedPassword = bcrypt.hashSync(password, 10);

  const sql = `INSERT INTO users (name, email, password) VALUES (?, ?, ?)`;

  db.run(sql, [name, email, hashedPassword], function (err) {
    if (err) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    res.status(201).json({
      success: true,
      userId: this.lastID
    });
  });
};

exports.login = (req, res) => {
  const { email, password } = req.body;

  const sql = `SELECT * FROM users WHERE email = ?`;

  db.get(sql, [email], (err, user) => {
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = bcrypt.compareSync(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    });
  });
};