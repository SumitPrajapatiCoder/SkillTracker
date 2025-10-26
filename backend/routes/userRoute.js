const express = require("express");
const { loginController, registerController,getUserInfo,generateRoadMap,getStudyPlans,saveStudyPlan,deleteNotification,
    getRoadmaps, saveRoadmap, getLanguages, getMockCardDetails, getQuizCardDetails,getCompletedMocks,clearChatHistory,
updateProfileController,saveMockResult,getMockStatus,saveQuizResult,generateStudyPlan,chatbotController,getChatHistory,
    getUserProgress, getNotifications, markAsRead, deleteAllNotifications, uploadProfileImageController, deleteProfileImageController,
    getAllContests, getContestUser, submitContest, getGlobalLeaderboard,progressContestByUser,getUserRank,verifyPasswordController} = require("../controller/userControl");
const authMiddleware = require("../middleware/authMiddleware");
const { upload } = require("../config/cloudinary");


const router = express.Router();

router.post("/login", loginController);
router.post("/register", registerController);
router.post('/get_User_data', authMiddleware, getUserInfo);
router.put('/update_profile', authMiddleware, updateProfileController);
router.put("/upload_profile_image",authMiddleware,upload.single("image"),uploadProfileImageController);
router.delete("/delete_profile_image", authMiddleware, deleteProfileImageController);
router.post("/verify-password", authMiddleware, verifyPasswordController);

router.get("/get-languages", authMiddleware, getLanguages);

router.post("/save-quiz-result", authMiddleware, saveQuizResult);
router.post("/save-mock-result",authMiddleware,saveMockResult);
router.get("/mock-status/:language",authMiddleware,getMockStatus);


router.get("/study-plans", authMiddleware, getStudyPlans);
router.get("/study-plan", authMiddleware, generateStudyPlan);
router.post("/study-plan/save", authMiddleware, saveStudyPlan);


router.get("/roadmaps", authMiddleware, getRoadmaps);
router.get("/roadmap", authMiddleware, generateRoadMap);
router.post("/roadmap/save", authMiddleware, saveRoadmap);

router.get("/progress", authMiddleware, getUserProgress);

router.get("/get-quiz-cards", authMiddleware,getQuizCardDetails);
router.get("/get-mock-cards", authMiddleware,getMockCardDetails);

router.get("/completed-mocks", authMiddleware, getCompletedMocks);
router.post("/chatbot", authMiddleware, chatbotController);
router.get("/chat-history", authMiddleware, getChatHistory);
router.delete("/clear-chat-history", authMiddleware, clearChatHistory);

router.get("/notifications", authMiddleware, getNotifications);
router.post("/notifications/read", authMiddleware, markAsRead);
router.delete("/notifications/:notificationId", authMiddleware, deleteNotification);
router.delete("/notification/all", authMiddleware, deleteAllNotifications);

router.get("/contestAll", authMiddleware, getAllContests);
router.get("/contest/:id", authMiddleware, getContestUser);
router.post("/contestSubmit", authMiddleware, submitContest);
router.get("/leaderboard/global", authMiddleware, getGlobalLeaderboard);
router.get("/progress-contest", authMiddleware, progressContestByUser);
router.get("/user-rank", authMiddleware, getUserRank);

module.exports = router;