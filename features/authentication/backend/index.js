const express = require('express');
const { handleGoogleLogin } = require('./google-auth');

const router = express.Router();

router.post('/google', (req, res) => {
  handleGoogleLogin(req, res, req.app.locals.prisma);
});

module.exports = router;
