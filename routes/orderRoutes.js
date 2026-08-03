const express = require('express');
const router = express.Router();
const {
  createOrder,
  getMyOrders,
  getAllOrders,
  updateOrderStatus,
} = require('../controllers/orderController');

const { protect, adminOnly } = require('../middlewares/auth');


router.post('/', protect, createOrder);

// 2. Get logged-in user's orders (Yehi route frontend ke /orders call par chalega)
router.get('/', protect, getMyOrders);
router.get('/orders', protect, getMyOrders); // Agar koi /orders/orders hit kare toh bhi chale


router.get('/admin/all', protect, adminOnly, getAllOrders);

// 4. Update order status
router.put('/:id/status', protect, adminOnly, updateOrderStatus);

module.exports = router;