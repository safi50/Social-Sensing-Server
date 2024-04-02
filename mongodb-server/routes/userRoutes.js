const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const UserController = require('../controllers/userController');
const verifyToken = require("../config/verifyToken");
const User = require('../models/user'); 
const crypto = require('crypto');
const nodemailer = require('nodemailer');

// Register User Route
router.post('/register', [
    check('firstName', 'First name is required').not().isEmpty(),
    check('lastName', 'Last name is required').not().isEmpty(),
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Please enter a password with 8 or more characters').isLength({ min: 8 })
], UserController.register);

// Login User Route
router.post('/login', [
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password is required').exists()
], UserController.login);

// Update Password Route
router.post('/updatePassword', [
    check('newPassword', 'Please enter a password with 8 or more characters').isLength({ min: 8 })
], UserController.updatePassword);

router.post('/signout', UserController.signout);


module.exports = router;