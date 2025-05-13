
require('dotenv').config();
// db/mongoose.js
const mongoose = require("mongoose");

const connectToDatabase = async () => {
  try {
    await mongoose.connect(process.env.DB_URI);
    console.log("DB Connected");
  } catch (error) {
    console.error("Error connecting to the database:", error.message);
    throw error;
  }
};

//.exports = connectToDatabase;
module.exports = { connectToDatabase, mongoose };