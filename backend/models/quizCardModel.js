const mongoose = require("mongoose");

const quizLanguageSchema = new mongoose.Schema({
    language: { type: String, required: true},
    questions: { type: Number, required: true, min: 1 }, 
    time: { type: Number, required: true, min: 1 }, 
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });

const quizCardModel= mongoose.model("QuizCardDetail", quizLanguageSchema);

module.exports= quizCardModel;