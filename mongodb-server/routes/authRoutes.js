const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');


router.post('/sendEmail', authController.sendEmail);

module.exports = router;

