const mongoose = require("mongoose");

const mockLanguageSchema = new mongoose.Schema({
    language: { type: String, required: true},
    questions: { type: Number, required: true, min: 1 }, 
    time: { type: Number, required: true, min: 1 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });

const mockCardModel= mongoose.model("MockCardDetail", mockLanguageSchema);
module.exports= mockCardModel;