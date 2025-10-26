const express = require("express");
const { getQuizByLanguage ,getMockByLanguage} = require("../controller/quizControl");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/get-quiz/:language", authMiddleware, getQuizByLanguage);
router.get("/get-mock/:language", authMiddleware, getMockByLanguage);

module.exports = router;