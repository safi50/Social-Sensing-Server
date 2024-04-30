const User = require('../models/user');
const jwt = require('jsonwebtoken');
const {check, validationResult} = require('express-validator');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv')
dotenv.config();


// signup a user
exports.register = async (req, res) => {
    const errors = validationResult(req); 
    const {firstName, lastName, email, companyName, password}  = req.body;
    if(!errors.isEmpty()) {
        return res.status(400).json({
            errors: errors.array()
        });
    }
    const user = await User.findOne({ email }); 
      if (user) {
        return res.status(400).json({
            error: "Email Already Exists.Try Again!"});
      }
      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = {
          firstName: firstName,
          lastName: lastName,
          email: email,
          password: hashedPassword
      };
  
      if (companyName) {
          newUser.companyName = companyName;
      }
  
        const result =   await User.create(newUser);
        const token = jwt.sign({id: result._id}, process.env.SECRET_KEY, {
            expiresIn: 86400 
        });

        // save token in cookies 
        // res.cookie('token', token, { sameSite: 'none', secure: true, maxAge: 86400, httpOnly: false});

        return res.status(200).json({
            message: "User Registered Successfully!",
            ...result._doc, 
            token,
        })
};


// validate a user's credential and provide token
exports.login = async (req, res) => {
    const {email, password} = req.body;

    // Check if User Exists
    const user = await User.findOne({email});
    if (!user) {
       return res.status(400).send("Invalid Credentials! Try Again.");
    }
    //check if password is correct
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return  res.status(400).send("Invalid Credentials! Try Again.");
    }
    const token = jwt.sign({id: user._id}, process.env.SECRET_KEY, {
        expiresIn: 86400
    });

    // save token in cookies 
    // res.cookie('token', token, { sameSite: 'none', secure: true, maxAge: 86400});

   return res.status(200).json({
        message: "User Logged In Successfully", 
        token : token,
        user : user
    });
};


// update user's password, given the token and new password
exports.updatePassword = async (req, res) => {
    const { token, newPassword } = req.body; 
  
    try {
      const user = await User.findOne({
        resetPasswordToken: token,
        resetPasswordExpires: { $gt: Date.now() }, 
      });
  
      if (!user) {
        return res.status(401).json({ message: 'Invalid or expired token' });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);

  
      user.password = hashedPassword;
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();
  
      res.status(200).json({ message: 'Password updated successfully' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'An error occurred. Please try again later.' });
    }
  };

  exports.signout = (req, res) => {
    res.clearCookie('token');
    res.status(200).json({ message: 'User Logged Out Successfully' });
  };

  exports.testing = (req, res) => {
    res.send("*** Routes Working Fine! ***");
  };
  
