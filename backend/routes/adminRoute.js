const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");
const {
    uploadQuestion,blockUser,unblockUser,deleteUser,deleteLanguage,generateContestQuestions,
    deleteQuestion, toggleAdminRole, deleteCard, updateCard,createContest,getAllContests,
    listAllQuestions, addCardDetails, getQuizCardDetails, getMockCardDetails,deleteContest,
    listAllUsers, generateAIQuestion, editQuestion, uploadLanguage, getLanguages,userDetailsById
} = require("../controller/adminControl");


router.post("/upload-language", authMiddleware, adminMiddleware, uploadLanguage);
router.get("/get-languages", authMiddleware, adminMiddleware, getLanguages);
router.delete("/delete-language/:id", authMiddleware, adminMiddleware, deleteLanguage);

router.post("/upload-question", authMiddleware, adminMiddleware, uploadQuestion);
router.post("/generate-ai", authMiddleware, adminMiddleware, generateAIQuestion);
router.delete("/delete-question/:id", authMiddleware, adminMiddleware, deleteQuestion);
router.get("/all-questions", authMiddleware, adminMiddleware, listAllQuestions);
router.get("/all-users", authMiddleware, adminMiddleware, listAllUsers);
router.get("/user/:id", authMiddleware, adminMiddleware, userDetailsById);
router.put("/block-user/:id", authMiddleware, adminMiddleware, blockUser);
router.put("/unblock-user/:id", authMiddleware, adminMiddleware, unblockUser);
router.put("/toggle-admin/:id", authMiddleware, adminMiddleware, toggleAdminRole);
router.delete("/delete-user/:id", authMiddleware, adminMiddleware, deleteUser);
router.put("/edit-question/:id", authMiddleware, adminMiddleware ,editQuestion);

router.post("/add-card", authMiddleware, adminMiddleware, addCardDetails);
router.get("/get-quiz-cards", authMiddleware, adminMiddleware, getQuizCardDetails);
router.get("/get-mock-cards", authMiddleware, adminMiddleware, getMockCardDetails);

router.delete("/delete-card/:id", authMiddleware, adminMiddleware, deleteCard);
router.put("/update-card/:id", authMiddleware, adminMiddleware, updateCard);


router.post("/createContest", authMiddleware, adminMiddleware, createContest);
router.get("/getAllContests", authMiddleware, adminMiddleware, getAllContests);
router.post("/generateContestQuestions", authMiddleware, adminMiddleware, generateContestQuestions);
router.delete("/deleteContest/:id", authMiddleware, adminMiddleware, deleteContest);

module.exports = router;


