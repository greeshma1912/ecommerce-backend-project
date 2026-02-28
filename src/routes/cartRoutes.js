const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const authMiddleware = require('../middleware/auth');

router.post('/add', authMiddleware, cartController.addToCart);
router.get('/', authMiddleware, cartController.getCart);
router.put('/update/:id', authMiddleware, cartController.updateCart);
router.delete('/remove/:id', authMiddleware, cartController.removeFromCart);
router.delete('/clear', authMiddleware, cartController.clearCart);

module.exports = router;