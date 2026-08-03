const express = require('express');
const router = express.Router();
const {registerUser,  loginUser,   getUserProfile, forgotPassword,  resetPassword } = require('../controllers/authController');
const { protect } = require('../middlewares/auth');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword); 
router.get('/profile', protect, getUserProfile);

module.exports = router;