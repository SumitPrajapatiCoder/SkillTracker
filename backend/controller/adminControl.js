const quizModel = require("../models/quizModel");
const mockModel = require("../models/mockModel");
const contestModel = require("../models/contestModel");
const userModel = require("../models/userModel");
const languageModel = require("../models/languageModel");
const quizCardModel = require("../models/quizCardModel");
const mockCardModel = require("../models/mockCardModel");
const { addNotification }=require("./userControl");

// const OpenAI = require("openai");
// const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// const generateAIQuestion = async (req, res) => {
//     const { language, difficulty } = req.body;

//     if (!language || !difficulty) {
//         return res.status(400).json({ success: false, message: "Language and difficulty required" });
//     }

//     const prompt = `Generate one ${difficulty} level multiple-choice programming question in ${language}. 
// It should have 4 options and clearly mention the correct answer.
// Respond strictly in JSON format:
// {
//   "question": "Your question here?",
//   "options": ["A", "B", "C", "D"],
//   "correctAnswer": "Correct option exactly as in options"
// }`;

//     try {
//         const chatCompletion = await openai.chat.completions.create({
//             model: "gpt-3.5-turbo",
//             messages: [{ role: "user", content: prompt }],
//         });

//         const text = chatCompletion.choices[0].message.content;

//         console.log("AI Response:", text);

//         const parsed = JSON.parse(text);

//         return res.status(200).json({ success: true, data: parsed });
//     } catch (err) {
//         console.error("OpenAI Error:", err);
//         return res.status(500).json({
//             success: false,
//             message: "Failed to generate question",
//             error: err.message,
//         });
//     }
// };





const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

const generateAIQuestion = async (req, res) => {
  try {
    const { language, difficulty, type, count = 1 } = req.body;

    if (!language || !difficulty || !["quiz", "mock"].includes(type)) {
      return res.status(400).json({
        success: false,
        message: "Language, difficulty, and valid type are required",
      });
    }

    const numQuestions = Math.min(parseInt(count), 20);
    const Model = type === "quiz" ? quizModel : mockModel;

    const existing = await Model.find({ language, difficulty })
      .select("question -_id")
      .lean();
    const existingQuestions = existing.map((q) => q.question).slice(0, 20);

    const avoidList = existingQuestions.length
      ? `Avoid these existing questions:\n- ${existingQuestions.join("\n- ")}\n\n`
      : "";

    const prompt = `
${avoidList}
Generate ${numQuestions} UNIQUE ${difficulty}-level multiple-choice programming questions in ${language}.
Each question must be based on a short code snippet and ask the user to predict the output or behavior.

Strictly respond in valid JSON ARRAY format like:
[
  {
    "question": "What will be the output of the following ${language} code?\\n<insert code here>",
    "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
    "correctAnswer": "Correct option exactly as in the options"
  }
]

Do NOT include explanations or markdown. Only pure JSON array.
`;

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
    const result = await model.generateContent([prompt]);
    const text = result.response.text();

    const match = text.match(/\[[\s\S]*\]/);
    if (!match) {
      return res.status(500).json({
        success: false,
        message: "Failed to extract JSON array from AI response",
        raw: text,
      });
    }

    let parsed;
    try {
      parsed = JSON.parse(match[0]);
    } catch (e) {
      return res.status(500).json({
        success: false,
        message: "Failed to parse AI JSON array",
        raw: match[0],
      });
    }

    const uniqueQuestions = [];
    for (const q of parsed) {
      const exists = await Model.findOne({ question: q.question });
      if (!exists) uniqueQuestions.push(q);
    }

    await addNotification(req.userId, `Generated ${uniqueQuestions.length} new ${type} questions for ${language}.`);
    return res.status(200).json({ success: true, data: uniqueQuestions });
  } catch (err) {
    console.error("Gemini API Error:", err);
    return res.status(500).json({
      success: false,
      message: "Gemini generation failed",
      error: err.message,
    });
  }
};

const uploadQuestion = async (req, res) => {
  try {
    const { type, questions, question, options, correctAnswer, language, difficulty } = req.body;

    if (!type || !["quiz", "mock"].includes(type)) {
      return res.status(400).send({ success: false, message: "Invalid type" });
    }

    const Model = type === "quiz" ? quizModel : mockModel;

    if (Array.isArray(questions) && questions.length > 0) {
      const newDocs = questions.map((q) => ({
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
        language: q.language,
        difficulty: q.difficulty,
        createdBy: req.userId,
      }));
      await Model.insertMany(newDocs);
      return res.status(201).send({
        success: true,
        message: `${questions.length} ${type} questions uploaded`,
      });
    }

    if (question && options && correctAnswer && language && difficulty) {
      const newQuestion = new Model({
        question,
        options,
        correctAnswer,
        language,
        difficulty,
        createdBy: req.userId,
      });
      await newQuestion.save();
      return res.status(201).send({
        success: true,
        message: `${type} question uploaded successfully`,
      });
    }
    
    return res.status(400).send({ success: false, message: "Invalid input" });
  } catch (error) {
    console.log("Upload Error:", error);
    res.status(500).send({ success: false, message: "Upload failed" });
  }
};



const deleteQuestion = async (req, res) => {
    try {
        const { id } = req.params;
        const { type } = req.query;

        if (!id || !type || !["quiz", "mock"].includes(type)) {
            return res.status(400).send({ success: false, message: "Invalid ID or type" });
        }

        const Model = type === "quiz" ? quizModel : mockModel;
        const deleted = await Model.findByIdAndDelete(id);
        await addNotification(req.userId, `Deleted one ${type} question (${deleted.language}).`);

        if (!deleted) {
            return res.status(404).send({ success: false, message: "Question not found" });
        }

        res.status(200).send({ success: true, message: "Question deleted" });
    } catch (error) {
        console.log("Delete Error:", error);
        res.status(500).send({ success: false, message: "Delete failed" });
    }
};


const editQuestion = async (req, res) => {
  try {
    const { id } = req.params;
    const { type } = req.query;

    if (!id || !type || !["quiz", "mock"].includes(type)) {
      return res.status(400).send({ success: false, message: "Invalid ID or type" });
    }

    const updateData = req.body;
    const Model = type === "quiz" ? quizModel : mockModel;

    const updatedQuestion = await Model.findByIdAndUpdate(id, updateData, { new: true });
    await addNotification(req.userId, `Updated a ${type} question (${updatedQuestion.language}).`);

    if (!updatedQuestion) {
      return res.status(404).send({ success: false, message: "Question not found" });
    }

    res.status(200).send({ success: true, message: "Question updated", data: updatedQuestion });
  } catch (error) {
    console.error("Edit Error:", error);
    res.status(500).send({ success: false, message: "Update failed" });
  }
};



const listAllQuestions = async (req, res) => {
  try {
    const { type, search, language } = req.query;

    if (!type || !["quiz", "mock"].includes(type)) {
      return res.status(400).send({ success: false, message: "Invalid type" });
    }

    const Model = type === "quiz" ? quizModel : mockModel;
    const query = {};

    if (search) {
      query.$or = [
        { question: { $regex: search, $options: "i" } },
        { language: { $regex: search, $options: "i" } }
      ];
    }

    if (language && language !== "all") {
      query.language = { $regex: `^${language}$`, $options: "i" };
    }

    const questions = await Model.find(query);
    res.status(200).send({ success: true, data: questions });
  } catch (error) {
    console.log("List Error:", error);
    res.status(500).send({ success: false, message: "Failed to fetch questions" });
  }
};


const uploadLanguage = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).send({ success: false, message: "Language name required" });
    }

    const exists = await languageModel.findOne({ name });
    if (exists) {
      return res.status(400).send({ success: false, message: "Language already exists" });
    }

    const newLang = new languageModel({ name });
    await newLang.save();
    await addNotification(req.userId, `Added new programming language: ${name}.`);


    res.status(201).send({ success: true, message: "Language uploaded", data: newLang });
  } catch (error) {
    console.error("Upload Language Error:", error);
    res.status(500).send({ success: false, message: "Failed to upload language" });
  }
};

const getLanguages = async (req, res) => {
  try {
    const langs = await languageModel.find().sort({ name: 1 });
    res.status(200).send({ success: true, data: langs });
  } catch (error) {
    console.error("Get Languages Error:", error);
    res.status(500).send({ success: false, message: "Failed to fetch languages" });
  }
};

const deleteLanguage = async (req, res) => {
  try {
    const { id } = req.params;

    const lang = await languageModel.findByIdAndDelete(id);
    await addNotification(req.userId, `Deleted language: ${lang.name}.`);

    if (!lang) {
      return res.status(404).send({ success: false, message: "Language not found" });
    }

    res.status(200).send({ success: true, message: "Language deleted successfully" });
  } catch (error) {
    console.error("Delete Language Error:", error);
    res.status(500).send({ success: false, message: "Failed to delete language" });
  }
};


const listAllUsers = async (req, res) => {
    try {
        const users = await userModel.find().select("-password");
        res.status(200).send({ success: true, data: users });
    } catch (error) {
        console.log("User List Error:", error);
        res.status(500).send({ success: false, message: "Failed to fetch users" });
    }
};

const userDetailsById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await userModel.findById(id).select("-password");

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.status(200).json({ success: true, data: user });
  } catch (error) {
    console.error("User details error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch user details" });
  }
};



const blockUser = async (req, res) => {
  try {
    const user = await userModel.findById(req.params.id);
    if (user.isAdmin) {
      return res.status(400).send({ success: false, message: "Cannot block an admin user" });
    }
    await userModel.findByIdAndUpdate(req.params.id, { isBlocked: true });
    await addNotification(req.userId, `You blocked a user ${user.name} (ID: ${req.params.id}).`);
    await addNotification(req.params.id, "Your account has been blocked by admin.");

    res.status(200).send({ success: true, message: "User blocked successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).send({ success: false, message: "Failed to block user" });
  }
};

const unblockUser = async (req, res) => {
  try {
    const user = await userModel.findById(req.params.id);
    if (!user.isBlocked) {
      return res.status(400).send({ success: false, message: "User is not blocked" });
    }
    await userModel.findByIdAndUpdate(req.params.id, { isBlocked: false });
    await addNotification(req.userId, `You unblocked a user ${user.name || user.email} (ID: ${req.params.id}).`);
    await addNotification(req.params.id, "Your account has been unblocked by admin.");

    res.status(200).send({ success: true, message: "User unblocked successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).send({ success: false, message: "Failed to unblock user" });
  }
};

const deleteUser = async (req, res) => {
  try {
    const user = await userModel.findById(req.params.id);
    if (!user) {
      return res.status(404).send({ success: false, message: "User not found" });
    }
    await userModel.findByIdAndDelete(req.params.id);
    await addNotification(req.userId, `Deleted user ${user.name} (ID: ${req.params.id}).`);
    res.status(200).send({ success: true, message: "User deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).send({ success: false, message: "Failed to delete user" });
  }
};

const toggleAdminRole = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await userModel.findById(id);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (user._id.toString() === req.userId) {
      return res.status(400).json({
        success: false,
        message: "You cannot change your own admin status"
      });
    }


    user.isAdmin = !user.isAdmin;
    await user.save();
    await addNotification(req.userId, `You changed admin status for ${user.name}.`);
    await addNotification(
      user._id,
      `Your admin role has been ${user.isAdmin ? "granted " : "removed "} by another admin.`
    );


    res.status(200).json({
      success: true,
      message: `User is now ${user.isAdmin ? "an Admin" : "a regular user"}`,
      user,
    });
  } catch (error) {
    console.error("Error toggling admin:", error);
    res.status(500).json({ success: false, message: "Server error while toggling admin" });
  }
};


const addCardDetails = async (req, res) => {
  try {
    const { type, name, questions, time } = req.body;

    if (!type || !["quiz", "mock"].includes(type)) {
      return res.status(400).json({ error: "Invalid type. Must be 'quiz' or 'mock'" });
    }

    if (!name || name.trim() === "" || !questions || !time) {
      return res.status(400).json({ error: "All fields are required and cannot be empty" });
    }

    const trimmedName = name.trim();

    const Model = type === "quiz" ? quizCardModel : mockCardModel;

    const newCard = new Model({
      language: trimmedName,
      questions,
      time,
      createdBy: req.userId,
    });

    await newCard.save();
    await addNotification(req.userId, `Added a new ${type} card for ${name}.`);


    return res.status(201).json({
      success: true,
      message: `${type} card added successfully`,
      data: newCard,
    });
  } catch (error) {
    console.error("Add Card Error:", error);
    return res.status(500).json({
      error: "Failed to add card",
      details: error.message,
    });
  }
};


const getQuizCardDetails = async (req, res) => {
  try {
    const quizCards = await quizCardModel.find().sort({ createdAt: -1 });
    return res.status(200).json({ success: true, data: quizCards });
  } catch (error) {
    console.error("Get Quiz Cards Error:", error);
    return res.status(500).json({
      error: "Failed to fetch quiz cards",
      details: error.message,
    });
  }
};

const getMockCardDetails = async (req, res) => {
  try {
    const mockCards = await mockCardModel.find().sort({ createdAt: -1 });
    return res.status(200).json({ success: true, data: mockCards });
  } catch (error) {
    console.error("Get Mock Cards Error:", error);
    return res.status(500).json({
      error: "Failed to fetch mock cards",
      details: error.message,
    });
  }
};

const deleteCard = async (req, res) => {
  try {
    const { id } = req.params;
    const { type } = req.query;

    if (type === "quiz") {
      await quizCardModel.findByIdAndDelete(id);
    } else if (type === "mock") {
      await mockCardModel.findByIdAndDelete(id);
    } else {
      return res.status(400).json({ error: "Invalid card type" });
    }

    await addNotification(req.userId, `Deleted a ${type} card.`);

    return res.status(200).json({ success: true, message: "Card deleted successfully" });
  } catch (error) {
    console.error("Delete Card Error:", error);
    return res.status(500).json({
      error: "Failed to delete card",
      details: error.message,
    });
  }
};


const updateCard = async (req, res) => {
  try {
    const { id } = req.params;
    const { type } = req.query;
    const updateData = req.body;

    let updatedCard;
    if (type === "quiz") {
      updatedCard = await quizCardModel.findByIdAndUpdate(id, updateData, { new: true });
    } else if (type === "mock") {
      updatedCard = await mockCardModel.findByIdAndUpdate(id, updateData, { new: true });
    } else {
      return res.status(400).json({ error: "Invalid card type" });
    }
    await addNotification(req.userId, `Updated a ${type} card (${updatedCard.language}).`);

    return res.status(200).json({ success: true, data: updatedCard });
  } catch (error) {
    console.error("Update Card Error:", error);
    return res.status(500).json({
      error: "Failed to update card",
      details: error.message,
    });
  }
};

const generateContestQuestions = async (req, res) => {
  try {
    const { questionSize } = req.body;

    if (!questionSize || questionSize <= 0) {
      return res.status(400).json({ message: "Invalid question size" });
    }

    const quizCount = Math.floor(questionSize / 2);
    const mockCount = questionSize - quizCount;

    const quizQuestions = await quizModel.aggregate([{ $sample: { size: quizCount } }]);
    const mockQuestions = await mockModel.aggregate([{ $sample: { size: mockCount } }]);

    const combinedQuestions = [
      ...quizQuestions.map(q => ({
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
        language: q.language,
        difficulty: q.difficulty,
        source: "quiz",
      })),
      ...mockQuestions.map(m => ({
        question: m.question,
        options: m.options,
        correctAnswer: m.correctAnswer,
        language: m.language,
        difficulty: m.difficulty,
        source: "mock",
      })),
    ];

    for (let i = combinedQuestions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [combinedQuestions[i], combinedQuestions[j]] = [combinedQuestions[j], combinedQuestions[i]];
    }
    await addNotification(req.userId, `Generated contest questions (${questionSize}) Successfully.`);

    res.status(200).json({ success: true, questions: combinedQuestions });
  } catch (error) {
    console.error("Error generating questions:", error);
    res.status(500).json({ message: "Server error", error });
  }
};


const createContest = async (req, res) => {
  try {
    const { questionSize, timeDuration, publishDateTime, questions } = req.body;
    const adminId = req.user._id;

    if (!questionSize || !timeDuration || !publishDateTime || !questions) {
      return res.status(400).json({
        message: "questionSize, timeDuration, publishDateTime, and questions are required",
      });
    }

    const publishDate = new Date(publishDateTime);
    if (isNaN(publishDate)) {
      return res.status(400).json({ message: "Invalid publish date/time format" });
    }

    const contest = await contestModel.create({
      questionSize: questions.length,
      timeDuration,
      publishDetails: {
        date: publishDate,
        formatted: publishDate.toLocaleString(),
      },
      questions,
      createdBy: adminId,
    });

    await addNotification(req.userId, `Upload contest Questions Successfully (${contest._id}).`);

    res.status(201).json({
      success: true,
      message: "Contest created successfully",
      contestId: contest._id,
      publishDetails: contest.publishDetails,
    });
  } catch (error) {
    console.error("Error creating contest:", error);
    res.status(500).json({ message: "Server error", error });
  }
};


const getAllContests = async (req, res) => {
  try {

    const contests = await contestModel.find()
      .sort({ createdAt: -1 })
      .lean(); 

    if (!contests || contests.length === 0) {
      return res.status(404).json({ message: "No contests found" });
    }

    res.status(200).json({ success: true, contests });
  } catch (error) {
    console.error("Error fetching contests:", error);
    res.status(500).json({ message: "Server error", error });
  }
};



const deleteContest = async (req, res) => {
  const contestId = req.params.id;

  try {
    const contest = await contestModel.findByIdAndDelete(contestId);
    await addNotification(req.userId, `Deleted contest (${contestId}).`);
    if (!contest) {
      return res.status(404).json({ message: "Contest not found" });
    }

    return res.status(200).json({
      message: "Contest deleted successfully",
      contestId,
    });
  } catch (error) {
    console.error("Delete Contest Error:", error);
    return res.status(500).json({
      message: "Server error while deleting contest",
      error: error.message,
    });
  }
};



module.exports = {
    uploadQuestion,
    deleteQuestion,
    createContest,
    getAllContests,
    deleteContest,
    generateContestQuestions,
    listAllQuestions,
    listAllUsers,
    generateAIQuestion,
    editQuestion,userDetailsById,
    blockUser,unblockUser,deleteUser,toggleAdminRole,deleteLanguage,
  uploadLanguage,getLanguages,addCardDetails,getQuizCardDetails,getMockCardDetails,deleteCard,updateCard
};
