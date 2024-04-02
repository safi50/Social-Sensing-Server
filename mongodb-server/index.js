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
app.use(cookieParser());
app.use(
    cors({
      origin: true,
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
      credentials: true, // Enable credentials (cookies) to be sent with the request
    })
  );

app.listen(process.env.PORT, () => {
    console.log("Server is running on Port:",process.env.PORT);
    connectDB();
})

app.use('/user',userRoutes);
app.use('/auth', authRoutes);
app.use('/search', searchRoutes);

