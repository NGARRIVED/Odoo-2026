const express = require('express');
const { handleGoogleLogin } = require('./google-auth');
const router = express.Router();
const controller = require('./auth.controller');

// Public routes
router.post('/signup', controller.signup);
router.post('/login', controller.login);
router.post('/google', (req, res) => {
  handleGoogleLogin(req, res, req.app.locals.prisma);
});

module.exports = router;
