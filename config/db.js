const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            dbName: "Notes-Maker",
        });
        console.log("Connected to DB");
    } catch (error) {
        console.error("Error in connecting to DB", error);
        process.exit(1); // Exit process if the connection fails
    }
};

module.exports = { connectDB };
