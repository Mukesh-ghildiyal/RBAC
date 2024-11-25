const express = require('express');
const router = express();

const auth = require('../middlewares/authMiddleware');

const authController = require('../controllers/authController');

const { registerValidator, loginValidator } = require('../helpers/validator');

const rateLimit = require('express-rate-limit');
const { send2FAOTP, verify2FAOTP } = require('../controllers/userController');

const authRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 3, // Limit each IP to 10 requests per windowMs
    message: "Too many login attempts from this IP, please try again after 15 minutes."
});

router.post('/register', registerValidator, authController.registerUser);
router.post('/login', loginValidator, authRateLimiter, authController.loginUser);


// Send OTP
router.post('/send-otp', send2FAOTP);

// Verify OTP
router.post('/verify-otp', verify2FAOTP);

// Authenticated Routes

router.get('/profile', auth, authController.getProfile);

module.exports = router;