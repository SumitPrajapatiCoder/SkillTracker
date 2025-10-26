const mongoose = require("mongoose");

const quizHistorySchema = new mongoose.Schema({
    language: String,
    correct: Number,
    total: Number,
    date: { type: Date, default: Date.now },
    playedQuestions: [
        {
            question: String,
            options: [String],
            correctAnswer: String,
            selectedAnswer: String,
        },
    ],
});

const notificationSchema = new mongoose.Schema({
    message: { type: String, required: true },
    read: { type: Boolean, default: false },
    date: { type: Date, default: Date.now },
});

const contestHistorySchema = new mongoose.Schema({
    contestId: { type: mongoose.Schema.Types.ObjectId, ref: "contest" },
    score: Number,
    totalQuestions: Number,
    submissionType: {
        type: String,
        enum: ["valid", "not valid"],
    },
    date: { type: Date, default: Date.now },
    playedQuestions: [
        {
            question: String,
            options: [String],
            correctAnswer: String,
            selectedAnswer: String,
        },
    ],
});

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Name Is required"],
        },
        email: {
            type: String,
            required: [true, "Email Is Required"],
        },
        password: {
            type: String,
            required: [true, "Password Is Required"],
        },
        isAdmin: {
            type: Boolean,
            default: false,
        },
        isBlocked: {
            type: Boolean,
            default: false,
        },
        profileImage: {
            type: String, 
            default: "",  
        },

        quizHistory: [quizHistorySchema],
        mockHistory: [
            {
                language: String,
                correct: Number,
                total: Number,
                date: { type: Date, default: Date.now },
            },
        ],
        completedMocks: [
            {
                language: { type: String, required: true },
                completed: { type: Boolean, default: false },
                date: { type: Date },
            },
        ],
        contestHistory: [contestHistorySchema],
        studyPlans: {
            type: Map,
            of: String,
            default: {},
        },
        roadmap: {
            type: Map,
            of: String,
            default: {},
        },
        notifications: [notificationSchema],
        chatHistory: [
            {
                role: { type: String, enum: ["user", "bot"], required: true },
                text: { type: String, required: true },
                time: { type: Date, default: Date.now },
            },
        ],
    },
    { timestamps: true }
);

const userModel = mongoose.model("user", userSchema);
module.exports = userModel;
