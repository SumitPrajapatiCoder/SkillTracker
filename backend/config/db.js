const mongoose = require("mongoose");
const colors = require("colors");
const connect_DB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log(`Database connected successfully on host: ${mongoose.connection.host}`.bgGreen.white);
    } catch (error) {
        console.error(`MongoDB Connection Error: ${error.message}`.bgRed.white);
    }
};

module.exports = connect_DB;
