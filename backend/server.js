const dotenv = require("dotenv");
dotenv.config();  

const express = require("express");
const morgan = require("morgan");
const connect_DB = require("./config/db");
const cors = require("cors");
const path = require("path");
const colors = require("colors");
connect_DB();
const app = express();

const allowedOrigins = [
    "http://localhost:5173",
    "https://ai-skilltracker-frontend.onrender.com"
];

app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error("CORS not allowed"));
        }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true
}));



app.use(express.json());
app.use(morgan("dev"));

app.use('/api/v1/user', require("./routes/userRoute"));
app.use('/api/v1/admin', require("./routes/adminRoute"));
app.use('/api/v1/quiz', require("./routes/quizRoute"));



// ✅ Serve frontend in production
if (process.env.NODE_ENV === "production") {
    const __dirname1 = path.resolve();
    app.use(express.static(path.join(__dirname1, "../frontend/dist")));
    app.get("*", (req, res) => {
        res.sendFile(path.resolve(__dirname1, "../frontend/dist", "index.html"));
    });
}


const port = process.env.PORT || 8080;
app.listen(port, () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${port}`.bgCyan.white);
});


