const mongoose = require("mongoose");

const contestSchema = new mongoose.Schema({
    questionSize: {
        type: Number,
        required: true,
    },
    timeDuration: {
        type: Number, 
        required: true,
    },
    publishDetails: {
        date: {
            type: Date,
            required: true,
        },
        formatted: {
            type: String, 
            required: true,
        },
    },
    questions: [
        {
            question: String,
            options: [String],
            correctAnswer: String,
            language: String,
            difficulty: String,
            source: { type: String, enum: ["quiz", "mock"] },
        },
    ],
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        required: true,
    },
}, { timestamps: true });

const contestModel = mongoose.model("contest", contestSchema);
module.exports = contestModel;
