const mongoose = require("mongoose");

const mockSchema = new mongoose.Schema({
    question: {
        type: String,
        required: true,
    },
    options: {
        type: [String],
        required: true,
        validate: [opt => opt.length >= 2, 'At least 2 options are required'],
    },
    correctAnswer: {
        type: String,
        required: true,
    },
    language: {
        type: String,
        required: true,
    }, 
    difficulty: {
        type: String,
        required: true,
        enum: ["Easy", "Medium", "Hard"],
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
    },
}, { timestamps: true });

const quizModel = mongoose.model("mock", mockSchema);
module.exports = quizModel;
