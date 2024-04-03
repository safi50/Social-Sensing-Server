const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');

const userRoutes = require('./routes/userRoutes');
const authRoutes = require('./routes/authRoutes');
const searchRoutes = require('./routes/searchRoutes');

dotenv.config();

const app = express(); 

app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(
  app.use(
    cors({
      // TODO: Change Server Link when deploying to production
      origin: ['https://social-sensing-frontend.vercel.app'], 
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
      credentials: true, // Enable credentials (cookies) to be sent with the request
    })
);
app.use(cookieParser());


connectDB(); // Connect to the database

app.use('/user', userRoutes);
app.use('/auth', authRoutes);
app.use('/search', searchRoutes);

module.exports = app; // Export the Express app for serverless deployment
