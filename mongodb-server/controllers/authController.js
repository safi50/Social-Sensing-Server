const express = require('express');
const User = require('../models/user'); 
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
dotenv.config();

const api_url = 'https://social-sensing-frontend.vercel.app';


async function generateResetToken() {
    return new Promise((resolve, reject) => {
        crypto.randomBytes(32, (err, buffer) => {
            if (err) {
                return reject(err);
            }
            const token = buffer.toString('hex');
            resolve(token);
        });
    });
}

async function saveResetToken(email, token) {
    const user = await User.findOne({ email });
    if (!user) {
        throw new Error('User not found');
    }
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 3600000; // Token expires in 1 hour
    await user.save();
}

async function sendResetPasswordEmail(user) {
    const token = await generateResetToken();
    await saveResetToken(user.email, token);

    const resetLink = api_url + `/changepassword?token=${token}`; 

    const transporter = nodemailer.createTransport({
        service: 'outlook',
        // host : 'smtp.office365.com',
        port: 587,
        secure: false,
        tls: {
            rejectUnauthorized: false
        },
        auth: {
            user: 'no-reply-walee@outlook.com',
            pass: 'Social-Sensing-Walee',
        },
    });

    const mailOptions = {
        from: process.env.EMAIL, 
        to: user.email,
        subject: 'Password Reset Request',
        html: `
            <p>You requested a password reset for your account.</p>
            <p>Click on the following link to reset your password:</p>
            <a href="${resetLink}">${resetLink}</a>
            <p>This link will expire in 1 hour.</p>
        `,
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error(error);
        } else {
            console.log('Email sent: ' + info.response);
        }
    });
}


exports.sendEmail = async (req, res) => {
    const { email } = req.body;

    try {
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({ message: 'Email address not found' });
        }

        await sendResetPasswordEmail(user);

        res.status(200).json({ message: 'Password reset email sent. Please check your inbox.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'An error occurred. Please try again later.' });
    }
};

