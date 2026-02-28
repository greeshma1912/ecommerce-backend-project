const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const authMiddleware = require('../middleware/auth');

router.post('/create', authMiddleware, orderController.createOrder);
router.get('/', authMiddleware, orderController.getUserOrders);

module.exports = router;