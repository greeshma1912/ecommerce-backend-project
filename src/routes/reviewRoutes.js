const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const authMiddleware = require('../middleware/auth');

router.post('/create', authMiddleware, reviewController.addReview);
router.get('/product/:productId', reviewController.getProductReviews);

module.exports = router;