const mongoose = require('mongoose');
const dotenv = require('dotenv');


dotenv.config(); // configuring .env 

const connectDB = async () => {
    await mongoose.connect(process.env.MONGODB_URI, {
    }).then(() => {
        console.log("Connected to Database Successfully!");
    }).catch((err) => {
        console.log("Error Connecting to Database: ", err);
    });
}

module.exports = connectDB;
