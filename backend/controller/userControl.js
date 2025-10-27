const mongoose = require("mongoose");
const userModel = require("../models/userModel");
const languageModel = require("../models/languageModel");
const contestModel = require("../models/contestModel");
const quizCardModel = require("../models/quizCardModel");
const mockCardModel = require("../models/mockCardModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
const { cloudinary } = require("../config/cloudinary");


const registerController = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        const exist_user = await userModel.findOne({ email: email });
        if (exist_user) {
            return res.status(400).send({ message: 'User Already Exists', success: false });
        }

        const salt = await bcrypt.genSalt(10);
        const hashed_pass = await bcrypt.hash(password, salt);
        req.body.password = hashed_pass;

        const new_user = new userModel(req.body);
        await new_user.save();

        res.status(201).send({ message: 'Registration Successful', success: true });
    } catch (error) {
        console.log('Error From Use Control = ', error);
        res.status(500).send({ success: false, message: `Register Controller: ${error.message}` });
    }
};


const loginController = async (req, res) => {
    try {
        const { identifier, password } = req.body;

        const user = await userModel.findOne({
            $or: [{ email: identifier }, { name: identifier }],
        });

        if (!user) {
            return res.status(200).send({ message: "User Not Found", success: false });
        }

        if (user.isBlocked) {
            return res.status(200).send({ message: "Your account is blocked.", success: false });
        }

        const pass_match = await bcrypt.compare(password, user.password);
        if (!pass_match) {
            return res.status(200).send({ message: "Invalid Email/Username or Password", success: false });
        }

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
            expiresIn: "2d",
        });

        res.status(200).send({
            message: "Login Done Successfully",
            success: true,
            token,
        });
    } catch (error) {
        console.log(error);
        res
            .status(500)
            .send({ message: `Error In Login Control ${error.message}`, success: false });
    }
};


const getUserInfo = async (req, res) => {
    try {
        const userId = req.body.userId || req.userId;

        if (!userId) {
            return res.status(400).send({ success: false, message: "User ID missing" });
        }

        const user = await userModel.findById(userId).select("-password");

        if (!user) {
            return res.status(404).send({ success: false, message: "User Not Found" });
        }

        res.status(200).send({ success: true, data: user });
    } catch (error) {
        console.error("Error in getUerInfo:", error);
        res.status(500).send({ message: "Auth Error", success: false, error });
    }
};


const verifyPasswordController = async (req, res) => {
    try {
        const userId = req.userId;
        const { oldPassword } = req.body;

        if (!oldPassword) {
            return res.status(400).send({ success: false, message: "Old password is required" });
        }

        const user = await userModel.findById(userId);
        if (!user) {
            return res.status(404).send({ success: false, message: "User not found" });
        }

        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch) {
            return res.status(400).send({ success: false, message: "Current password is incorrect" });
        }
    
        await addNotification(userId, "Password Verified Successfully !!")
        res.status(200).send({ success: true, message: "Password verified" });
    } catch (error) {
        console.error("Verify Password Error:", error);
        res.status(500).send({ success: false, message: "Internal Server Error" });
    }
};

const updateProfileController = async (req, res) => {
    try {
        const userId = req.userId;
        const { name, email, newPassword } = req.body;

        if (!name || !email) {
            return res.status(400).send({ success: false, message: "Name and Email are required" });
        }

        const user = await userModel.findById(userId);
        if (!user) {
            return res.status(404).send({ success: false, message: "User not found" });
        }

        user.name = name;
        user.email = email;

        if (newPassword) {
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(newPassword, salt);
        }

        await user.save();
        await addNotification(userId, "Update Profile Successfully !!")

        const updatedUser = await userModel.findById(userId).select("-password");

        res.status(200).send({
            success: true,
            message: "Profile updated successfully",
            data: updatedUser,
        });
    } catch (error) {
        console.error("Update Profile Error:", error);
        res.status(500).send({ success: false, message: "Internal Server Error" });
    }
};



const uploadProfileImageController = async (req, res) => {
    try {
        const userId = req.userId;

        if (!req.file || !req.file.path) {
            return res
                .status(400)
                .send({ success: false, message: "No image uploaded" });
        }

        const user = await userModel.findById(userId);
        if (!user) {
            return res
                .status(404)
                .send({ success: false, message: "User not found" });
        }

        if (user.profileImage && user.profileImage.includes("cloudinary.com")) {
            try {
                const publicId = user.profileImage
                    .split("/")
                    .pop()
                    .split(".")[0];
                await cloudinary.uploader.destroy(`user_profiles/${publicId}`);
            } catch (err) {
                console.warn("Old image cleanup failed:", err.message);
            }
        }

        user.profileImage = req.file.path;
        await user.save();

        const updatedUser = await userModel.findById(userId).select("-password");

        res.status(200).send({
            success: true,
            message: "Profile photo updated successfully",
            data: updatedUser,
        });
    } catch (error) {
        console.error("Upload Image Error:", error);
        res
            .status(500)
            .send({ success: false, message: "Internal Server Error" });
    }
};



const deleteProfileImageController = async (req, res) => {
    try {
        const userId = req.userId;
        const user = await userModel.findById(userId);
        if (!user) {
            return res.status(404).send({ success: false, message: "User not found" });
        }

        if (user.profileImage && user.profileImage.includes("cloudinary.com")) {
            try {
                const parts = user.profileImage.split("/");
                const fileName = parts[parts.length - 1].split(".")[0]; 
                await cloudinary.uploader.destroy(`user_profiles/${fileName}`);
            } catch (err) {
                console.warn("Failed to delete old image from Cloudinary:", err.message);
            }
        }

        user.profileImage = "";
        await user.save();

        const updatedUser = await userModel.findById(userId).select("-password");

        res.status(200).send({
            success: true,
            message: "Profile image deleted successfully",
            data: updatedUser,
        });
    } catch (error) {
        console.error("Delete Profile Image Error:", error);
        res.status(500).send({ success: false, message: "Internal Server Error" });
    }
};


const saveQuizResult = async (req, res) => {
    try {
        const { language, correct, total, playedQuestions } = req.body;

        const user = await userModel.findById(req.userId);
        if (!user)
            return res
                .status(404)
                .json({ success: false, message: "User not found" });

        user.quizHistory.push({
            language,
            correct,
            total,
            playedQuestions, 
        });

        await user.save();
        await addNotification(user._id, `Quiz completed for ${language}. You scored ${correct}/${total}.`);


        res
            .status(200)
            .json({ success: true, message: "Quiz result saved with details" });
    } catch (error) {
        console.error("Save Result Error:", error);
        res
            .status(500)
            .json({ success: false, message: "Failed to save quiz result" });
    }
};


const saveMockResult = async (req, res) => {
    try {
        const { language, correct, total } = req.body;
        const user = await userModel.findById(req.userId);
        if (!user) return res.status(404).json({ success: false, message: "User not found" });

        if (!user.mockHistory) {
            user.mockHistory = [];
        }

        user.mockHistory.push({ language, correct, total, date: new Date() });

        if (Number(correct) === Number(total)) {
            let entry = user.completedMocks.find((c) => c.language === language);
            if (entry) {
                entry.completed = true;
                entry.date = new Date();
            } else {
                user.completedMocks.push({
                    language,
                    completed: true,
                    date: new Date(),
                });
            }
        }

        await user.save();
        await addNotification(user._id, `Mock Test for ${language} completed. You scored ${correct}/${total}.`);

        if (Number(correct) === Number(total)) {
            await addNotification(user._id, `Congratulations! You achieved a perfect score in ${language} mock test. Certificate unlocked!`);
        }

        res.status(200).json({ success: true, message: "Mock result saved" });
    } catch (error) {
        console.error("Save Mock Result Error:", error);
        res.status(500).json({ success: false, message: "Failed to save mock result" });
    }
};

const getMockStatus = async (req, res) => {
    try {
        const user = await userModel.findById(req.userId);
        if (!user) return res.status(404).json({ success: false, message: "User not found" });

        const language = req.params.language;

        const entry = user.completedMocks.find(
            (c) => c.language === language && c.completed === true
        );

        const disabled = !!entry; 

        res.status(200).json({ success: true, disable: disabled, date: entry ? entry.date : null });
    } catch (err) {
        console.error("Mock status error", err);
        res.status(500).json({ success: false, message: "Error checking mock status" });
    }
};


const generateStudyPlan = async (req, res) => {
    try {
        const userId = req.userId;
        const { language } = req.query;

        const user = await userModel.findById(userId).select("quizHistory studyPlans");

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        if (!user.quizHistory.length) {
            return res.status(400).json({ success: false, message: "No quiz history found" });
        }

        const groupedByLanguage = user.quizHistory.reduce((acc, q) => {
            if (!acc[q.language]) acc[q.language] = [];
            acc[q.language].push(q);
            return acc;
        }, {});
        async function generatePlanForLanguage(lang, quizzes) {
            const historySummary = quizzes
                .map((q, idx) => {
                    const answersSummary = (q.playedQuestions || [])
                        .map((pq, i) => {
                            const questionText = pq.question ? pq.question.replace(/\n/g, " ") : "No question text";
                            const selected = pq.selectedAnswer || "No answer selected";
                            const correct = pq.correctAnswer || "No correct answer";
                            return `   • Q${i + 1}: "${questionText}" | User Selected Answer: "${selected}" | Correct Answer: "${correct}"`;
                        })
                        .join("\n");

                    return `• Quiz ${idx + 1} taken on ${new Date(q.date).toLocaleDateString()}:\n${answersSummary}`;
                })
                .join("\n");


            const prompt = `
You are an expert programming tutor and mentor. Based on this user's quiz history in ${lang}, create a **deep, personalized study plan** that is fully actionable, readable, and motivating.

**Requirements for the study plan:**
1. **Analyze Overall Performance:** Identify patterns, strengths, weaknesses, and common mistakes across all quizzes. Do NOT mention individual question numbers.
2. **Readable Format:** Structure the plan with clear headers, subheaders, bullet points, and numbered lists.
3. **Tables:** Include tables if useful to summarize key concepts, progress, or topic areas.
4. **Actionable Steps:** Suggest exercises, mini-projects, coding challenges, and hands-on tasks for each topic.
5. **Practical Learning:** Focus on learning by doing, not just theory. Include tips on avoiding common mistakes.
6. **Daily & Weekly Routine:** Provide a structured study routine that the user can follow.
7. **Resources:** Recommend books, websites, videos, coding platforms, and tools with clickable links.
8. **Motivating Tone:** Write as if a personal mentor is guiding the user—friendly, encouraging, and supportive.
9. **Code Examples:** Include short code snippets or examples where relevant.
10. **HTML Format:** Format the entire output in HTML with proper headings (<h3>, <h4>), lists (<ul>, <ol>), tables (<table>), and links (<a>) so it can be rendered directly in a web page.

**User Quiz History Summary:**
${historySummary}

Goal: Produce a **fully formatted, mentor-style HTML study plan** for ${lang} that is practical, interactive, and visually engaging. Use tables, lists, headers, exercises, and resources to make it easy to follow and actionable.
`;

            const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
            const result = await model.generateContent([prompt]);
            return result.response.text();
        }

        if (language) {
            const quizzes = groupedByLanguage[language];
            if (!quizzes) {
                return res.status(404).json({ success: false, message: `No quiz data found for language: ${language}` });
            }
            const studyPlanText = await generatePlanForLanguage(language, quizzes);
            user.studyPlans.set(language, studyPlanText);
            await user.save();
            await addNotification(userId, `Study plan for ${language} has been generated successfully.`);
            return res.status(200).json({ success: true, language, studyPlan: studyPlanText });
        }

        for (const [lang, quizzes] of Object.entries(groupedByLanguage)) {
            if (!user.studyPlans.get(lang)) {
                const plan = await generatePlanForLanguage(lang, quizzes);
                user.studyPlans.set(lang, plan);
            }
        }
        await user.save();
        
        return res.status(200).json({
            success: true,
            studyPlansByLanguage: Object.fromEntries(user.studyPlans),
        });

    } catch (err) {
        console.error("Gemini API Error:", err);
        return res.status(500).json({
            success: false,
            message: "Failed to generate study plan",
            error: err.message,
        });
    }
};



const getStudyPlans = async (req, res) => {
    try {
        const userId = req.userId;
        const user = await userModel.findById(userId).select("studyPlans");
        
        if (!user) return res.status(404).json({ success: false, message: "User not found" });

        return res.status(200).json({ success: true, studyPlansByLanguage: user.studyPlans || {} });
    } catch (err) {
        return res.status(500).json({ success: false, message: "Failed to get study plans", error: err.message });
    }
};

const saveStudyPlan = async (req, res) => {
    try {
        const userId = req.userId;
        const { language, studyPlan } = req.body;

        if (!language || !studyPlan) {
            return res.status(400).json({ success: false, message: "Language and studyPlan are required" });
        }

        const user = await userModel.findById(userId);
        if (!user) return res.status(404).json({ success: false, message: "User not found" });

        user.studyPlans.set(language, studyPlan);
        await user.save();

        return res.status(200).json({ success: true, message: `Study plan saved for ${language}` });
    } catch (err) {
        return res.status(500).json({ success: false, message: "Failed to save study plan", error: err.message });
    }
};


const generateRoadMap = async (req, res) => {
    try {
        const userId = req.userId;
        const { language } = req.query;

        const user = await userModel.findById(userId).select("quizHistory roadmap");
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        if (!user.quizHistory.length) {
            return res.status(400).json({ success: false, message: "No quiz history found" });
        }

        const groupedByLanguage = user.quizHistory.reduce((acc, q) => {
            if (!acc[q.language]) acc[q.language] = [];
            acc[q.language].push(q);
            return acc;
        }, {});


        async function generateRoadmapForLanguage(lang, quizzes) {
            const historySummary = quizzes
                .map((q, idx) => {
                    const answersSummary = (q.playedQuestions || [])
                        .map((pq, i) => {
                            const questionText = pq.question ? pq.question.replace(/\n/g, " ") : "No question text";
                            const selected = pq.selectedAnswer || "No answer selected";
                            const correct = pq.correctAnswer || "No correct answer";
                            return `   • Q${i + 1}: "${questionText}" | User Selected Answer: "${selected}" | Correct Answer: "${correct}"`;
                        })
                        .join("\n");

                    return `• Quiz ${idx + 1} taken on ${new Date(q.date).toLocaleDateString()}:\n${answersSummary}`;
                })
                .join("\n");

            const prompt = `
You are an expert programming mentor AI. Based on this user's quiz history in ${lang}, create a **deep, personalized, confidence-building learning roadmap** in **HTML format** that can be rendered directly on a webpage.

**Requirements for the roadmap:**
1. **Analyze Performance:** Identify patterns, strengths, weaknesses, and common mistakes across all quizzes. Do NOT mention individual question numbers.
2. **Phased Roadmap:** Structure the roadmap in phases or milestones, each with clear objectives, hands-on exercises, mini-projects, and practical tasks.
3. **Readable & Structured:** Use HTML headings (<h3>, <h4>), lists (<ul>, <ol>), tables (<table>) where helpful, and links (<a>) for resources.
4. **Daily & Weekly Routine:** Provide a structured, realistic study routine with suggested daily and weekly activities for consistent progress.
5. **Practical Learning:** Focus on coding by doing—examples, challenges, mini-projects, and exercises rather than abstract theory.
6. **Code Examples:** Include short, relevant code snippets to illustrate concepts or exercises.
7. **Resources:** Suggest books, websites, platforms, videos, and communities with **clickable links** for deeper learning, including professional and networking platforms like **LinkedIn**, **GitHub**, **Stack Overflow**, **LeetCode**, and other relevant communities.
8. **Motivating Tone:** Write as a personal mentor speaking directly to the learner—encouraging, supportive, and confidence-building.
9. **Progress Tracking:** Include tables or checklists to help the learner track completed milestones and exercises.
10. **Actionable Steps:** Each phase should have clear, practical, and achievable tasks that the learner can implement immediately.
11. **Code Examples:** Include short code snippets or examples where relevant.
12. **HTML Format:** Format the entire output in HTML with proper headings (<h3>, <h4>), lists (<ul>, <ol>), tables (<table>), and links (<a>) so it can be rendered directly in a web page.

**User Quiz History Summary:**
${historySummary}

Goal: Produce a **fully formatted, mentor-style HTML roadmap** for ${lang}, focusing on practical mastery, motivation, and clear progression. Use tables, lists, headings, exercises, routines, and resources to make the roadmap visually engaging and easy to follow.
`;




            const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
            const result = await model.generateContent([prompt]);
            return result.response.text();
        }

        if (language) {
            const quizzes = groupedByLanguage[language];
            if (!quizzes) {
                return res.status(404).json({ success: false, message: `No quiz data found for language: ${language}` });
            }
            const roadmapText = await generateRoadmapForLanguage(language, quizzes);
            user.roadmap.set(language, roadmapText);
            await user.save();
            await addNotification(userId, `Roadmap for ${language} has been generated successfully.`);
            return res.status(200).json({ success: true, language, roadmap: roadmapText });
        }

        for (const [lang, quizzes] of Object.entries(groupedByLanguage)) {
            if (!user.roadmap.get(lang)) {
                const roadmapText = await generateRoadmapForLanguage(lang, quizzes);
                user.roadmap.set(lang, roadmapText);
            }
        }
        await user.save();

        return res.status(200).json({
            success: true,
            roadmapByLanguage: Object.fromEntries(user.roadmap),
        });

    } catch (err) {
        console.error("Gemini API Error:", err);
        return res.status(500).json({
            success: false,
            message: "Failed to generate roadmap",
            error: err.message,
        });
    }
};




const getRoadmaps = async (req, res) => {
    try {
        const userId = req.userId;
        const user = await userModel.findById(userId).select("roadmap");
        if (!user) return res.status(404).json({ success: false, message: "User not found" });

        return res.status(200).json({ success: true, roadmapByLanguage: user.roadmap || {} });
    } catch (err) {
        return res.status(500).json({ success: false, message: "Failed to get roadmaps", error: err.message });
    }
};

const saveRoadmap = async (req, res) => {
    try {
        const userId = req.userId;
        const { language, roadmap } = req.body;

        if (!language || !roadmap) {
            return res.status(400).json({ success: false, message: "Language and roadmap are required" });
        }

        const user = await userModel.findById(userId);
        if (!user) return res.status(404).json({ success: false, message: "User not found" });

        user.roadmap.set(language, roadmap);
        await user.save();

        return res.status(200).json({ success: true, message: `Roadmap saved for ${language}` });
    } catch (err) {
        return res.status(500).json({ success: false, message: "Failed to save roadmap", error: err.message });
    }
};


const getUserProgress = async (req, res) => {
    try {
        const userId = req.userId; 
        const user = await userModel.findById(userId).select("quizHistory");

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

       
        const progress = {};
        user.quizHistory.forEach(entry => {
            if (!progress[entry.language]) {
                progress[entry.language] = { correct: 0, total: 0 };
            }
            progress[entry.language].correct += entry.correct;
            progress[entry.language].total += entry.total;
        });

        res.json({ success: true, data: progress });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error" });
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
    return res.status(500).json({
      error: "Failed to fetch mock cards",
      details: error.message,
    });
  }
};


const getCompletedMocks = async (req, res) => {
    try {
        const user = await userModel.findById(req.user.id);
        if (!user) return res.status(404).json({ success: false, message: "User not found" });

        res.json({ success: true, data: user.completedMocks });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error" });
    }
};



const chatbotController = async (req, res) => {
    try {
        const userId = req.user.id;
        const { messages } = req.body;

        if (!messages || !Array.isArray(messages) || messages.length === 0) {
            return res.status(400).json({ success: false, message: "Messages are required" });
        }

        const userMessage = messages[messages.length - 1].text
            || messages[messages.length - 1].parts?.[0]?.text;

        const user = await userModel.findById(userId).select("chatHistory");
        const history = user?.chatHistory || [];
        const recentHistory = history.slice(-20);

        let conversationContext = "";
        recentHistory.forEach(msg => {
            const speaker = msg.role === "user" ? "User" : "Gemini";
            conversationContext += `${speaker}: ${msg.text}\n`;
        });

        const siteKeywords = [
            "ai-skilltracker",
            "skilltracker",
            "about your website",
            "what does your website do",
            "explain your platform",
            "how skilltracker works",
            "tell me about your site",
            "learning platform",
            "programming platform",
            "skill tracker",
            "ai skill tracker"
        ];

        const isAboutSite = siteKeywords.some(keyword =>
            userMessage.toLowerCase().includes(keyword.toLowerCase())
        );

        let botResponse = "";

        if (isAboutSite) {
            botResponse = `Welcome to **SkillTracker**, an **AI-powered learning platform** built to help you master programming in a structured and personalized way!   

Here’s what **SkillTracker** offers:  

- **Interactive Quizzes & Mock Tests:** Practice programming with topic-wise quizzes and mock tests for languages like **Java**, **C**, and **C++**.  
- **Certificates:** After completing mock tests, earn certificates to showcase your skills and progress.  
- **AI-Powered Study Plans & Roadmaps:** Based on your quiz performance and chosen language, SkillTracker automatically generates **personalized study plans and learning roadmaps** to guide your journey.  
- **Built-in AI Chatbot:** Chat with our integrated AI assistant to solve coding problems, clear doubts, or get quick explanations.  
- **User Progress Tracking:** View your detailed progress, check quiz history, and track which mocks are completed or pending.  

**Technology Stack:**  
- **Frontend:** HTML, CSS, React.js (Vite)  
- **Backend:** Node.js, Express.js, JavaScript  
- **Database:** MongoDB  

In short, **SkillTracker** combines AI-driven learning, progress tracking, and interactive practice to make coding education smarter, personalized, and results-driven. `;
        
} else {

            const formattedPrompt = `
You are a professional assistant. 
This is the conversation so far:
${conversationContext}

Now the user says: "${userMessage}"

Respond in a friendly, readable, and engaging way, like ChatGPT would. 
- Use **bold** for important terms
- Use short paragraimport StudyPlan from './../../frontend/src/pages/study_plane';
phs for clarity
- Use bullet points or numbered lists
- Avoid markdown headings like ###
- Make it conversational and professional
- Keep it suitable for direct chat display (no raw markdown)
`;

            const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
            const result = await model.generateContent([{ text: formattedPrompt }]);
            botResponse = result?.response?.text() || "No response from AI.";
        }

        await userModel.findByIdAndUpdate(userId, {
            $push: {
                chatHistory: {
                    $each: [
                        { role: "user", text: userMessage, time: new Date() },
                        { role: "bot", text: botResponse, time: new Date() },
                    ]
                }
            }
        });

        return res.status(200).json({
            success: true,
            response: botResponse,
            timestamp: new Date().toISOString(),
        });

    } catch (error) {
        console.error("Chatbot Error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to get response from AI",
            error: error.message,
        });
    }
};



const getChatHistory = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await userModel.findById(userId).select("chatHistory");
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        return res.status(200).json({ success: true, chatHistory: user.chatHistory });
    } catch (error) {
        console.error("GetChatHistory Error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch chat history",
            error: error.message,
        });
    }
};

const clearChatHistory = async (req, res) => {
    try {
        const userId = req.user.id;
        await userModel.findByIdAndUpdate(userId, { $set: { chatHistory: [] } });
        return res.status(200).json({ success: true, message: "Chat history cleared" });
    } catch (error) {
        console.error("ClearChatHistory Error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to clear chat history",
            error: error.message,
        });
    }
};



const addNotification = async (userId,message) => {
    try {
        await userModel.findByIdAndUpdate(userId, {
            $push: { notifications: { message } },
        });
    } catch (error) {
        console.error("Add Notification Error:", error);
    }
};

const getNotifications = async (req, res) => {
    try {
        const userId = req.userId;
        const user = await userModel.findById(userId).select("notifications");
        if (!user) return res.status(404).json({ success: false, message: "User not found" });

        const notifications = user.notifications.sort((a, b) => b.date - a.date);

        res.status(200).json({ success: true, notifications });
    } catch (error) {
        console.error("Get Notifications Error:", error);
        res.status(500).json({ success: false, message: "Failed to fetch notifications" });
    }
};

const markAsRead = async (req, res) => {
    try {
        const { notificationId } = req.body;
        const userId = req.userId;

        const updated = await userModel.updateOne(
            { _id: userId, "notifications._id": notificationId },
            { $set: { "notifications.$.read": true } }
        );

        if (updated.modifiedCount === 0) {
            return res.status(404).json({ success: false, message: "Notification not found" });
        }

        res.status(200).json({ success: true, message: "Notification marked as read" });
    } catch (error) {
        console.error("Mark Notification Error:", error);
        res.status(500).json({ success: false, message: "Failed to mark notification" });
    }
};


const deleteNotification = async (req, res) => {
    try {
        const { notificationId } = req.params; 
        const userId = req.userId;

        const result = await userModel.updateOne(
            { _id: userId },
            { $pull: { notifications: { _id: notificationId } } }
        );

        if (result.modifiedCount === 0) {
            return res
                .status(404)
                .json({ success: false, message: "Notification not found" });
        }

        res.status(200).json({
            success: true,
            message: "Notification deleted successfully",
        });
    } catch (error) {
        console.error("Delete Notification Error:", error);
        res
            .status(500)
            .json({ success: false, message: "Failed to delete notification" });
    }
};


const deleteAllNotifications = async (req, res) => {
    try {
        const userId = req.userId;

        await userModel.findByIdAndUpdate(userId, { $set: { notifications: [] } });

        res.status(200).json({
            success: true,
            message: "All notifications deleted successfully",
        });
    } catch (error) {
        console.error("Delete All Notifications Error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to delete all notifications",
        });
    }
};


const getContestUser = async (req, res) => {
    try {
        const { id } = req.params;

        const contest = await contestModel.findById(id).lean();

        if (!contest)
            return res.status(404).json({ message: "Contest not found" });

        const now = new Date();
        const publishTime = new Date(contest.publishDetails.date);

        if (now < publishTime) {
            return res.status(403).json({
                success: false,
                message: `Contest will unlock at ${contest.publishDetails.formatted}`,
                unlockTime: contest.publishDetails.date,
            });
        }

        res.status(200).json({
            success: true,
            contest
        });
    } catch (error) {
        console.error("Error fetching contest for user:", error);
        res.status(500).json({ message: "Server error", error });
    }
};



const submitContest = async (req, res) => {
    try {
        const { contestId, score, totalQuestions, playedQuestions } = req.body;
        const userId = req.user.id;

        const contest = await contestModel.findById(contestId).lean();
        if (!contest)
            return res.status(404).json({ success: false, message: "Contest not found" });

        const now = new Date();
        const publishTime = new Date(contest.publishDetails.date);
        const durationMinutes = contest.timeDuration;
        const endTime = new Date(publishTime.getTime() + durationMinutes * 60000);

        const submissionType = now >= publishTime && now <= endTime ? "valid" : "not valid";

        await userModel.findByIdAndUpdate(userId, {
            $push: {
                contestHistory: {
                    contestId,
                    score,
                    totalQuestions,
                    playedQuestions,
                    date: new Date(),
                    submissionType,
                },
            },
        });

        let message = "";

        if (submissionType === "valid") {
            const users = await userModel.find().lean();

            const leaderboard = [];

            users.forEach(user => {
                if (!user.contestHistory || user.contestHistory.length === 0) return;

                const validContests = user.contestHistory.filter(ch => ch.submissionType === "valid");
                if (validContests.length === 0) return;

                const totalScore = validContests.reduce((acc, ch) => acc + (ch.score || 0), 0);

                let earliestSubmission = null;
                validContests.forEach(ch => {
                    if (ch.date) {
                        if (!earliestSubmission || new Date(ch.date) < new Date(earliestSubmission)) {
                            earliestSubmission = ch.date;
                        }
                    }
                });

                leaderboard.push({
                    userId: user._id.toString(),
                    name: user.name || "Unknown",
                    totalScore,
                    earliestSubmission,
                });
            });

            leaderboard.sort((a, b) => {
                if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
                if (a.earliestSubmission && b.earliestSubmission) {
                    return new Date(a.earliestSubmission) - new Date(b.earliestSubmission);
                }
                return 0;
            });

            const rankIndex = leaderboard.findIndex(u => u.userId === userId);
            const userRank = rankIndex !== -1 ? rankIndex + 1 : null;

            const totalScore = leaderboard.find(u => u.userId === userId)?.totalScore || score;

            message = `Contest ${contestId} submitted successfully! Your score: ${score}. Total score: ${totalScore}. Current rank: ${userRank}.`;

        } else {
            message = `Your submission for Contest ${contestId} was submitted but is not valid.`;
        }

        await addNotification(userId, message);

        return res.status(200).json({
            success: true,
            submissionType,
            score,
            message,
        });

    } catch (error) {
        console.error("Error submitting contest:", error);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};



const progressContestByUser = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await userModel.findById(userId).lean();

        if (!user || !user.contestHistory) {
            return res.status(200).json({ success: true, data: [] });
        }

        const validContests = user.contestHistory.filter(
            (ch) => ch.submissionType === "valid"
        );

        const progressData = validContests.map((contest) => {
            const totalQ = contest.totalQuestions || 1;
            const percentage = ((contest.score / totalQ) * 100).toFixed(2);

            return {
                contestId: contest.contestId,   
                score: contest.score,
                totalQuestions: totalQ,
                percentage: Number(percentage),
                date: contest.date || new Date(),
            };
        });

        res.status(200).json({ success: true, data: progressData });
    } catch (error) {
        console.error("Error fetching user contest progress:", error);
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
};


const getUserRank = async (req, res) => {
    try {
        const userId = req.user.id;

        const users = await userModel.find().lean();

        const leaderboard = [];

        users.forEach(user => {
            if (!user.contestHistory || user.contestHistory.length === 0) return;

            const validContests = user.contestHistory.filter(ch => ch.submissionType === "valid");
            if (validContests.length === 0) return;

            const totalScore = validContests.reduce((acc, ch) => acc + (ch.score || 0), 0);

            let earliestSubmission = null;
            validContests.forEach(ch => {
                if (ch.date) {
                    if (!earliestSubmission || new Date(ch.date) < new Date(earliestSubmission)) {
                        earliestSubmission = ch.date;
                    }
                }
            });

            leaderboard.push({
                userId: user._id.toString(),
                name: user.name || "Unknown",
                totalScore,
                earliestSubmission,
            });
        });

        leaderboard.sort((a, b) => {
            if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
            if (a.earliestSubmission && b.earliestSubmission) {
                return new Date(a.earliestSubmission) - new Date(b.earliestSubmission);
            }
            return 0;
        });

        const rankIndex = leaderboard.findIndex(u => u.userId === userId);
        let userRank = null;

        if (rankIndex !== -1) {
            userRank = {
                rank: rankIndex + 1,
                name: leaderboard[rankIndex].name,
                totalScore: leaderboard[rankIndex].totalScore,
            };
        }

        res.status(200).json({ success: true, userRank });
    } catch (error) {
        console.error("Error fetching user rank:", error);
        res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
};


const getGlobalLeaderboard = async (req, res) => {
    try {
        const users = await userModel.find().lean();

        let leaderboard = [];

        users.forEach((user) => {
            if (!user.contestHistory || user.contestHistory.length === 0) return;

            const validContests = user.contestHistory.filter(ch => ch.submissionType === "valid");

            if (validContests.length === 0) return;

            const totalScore = validContests.reduce((acc, ch) => acc + (ch.score || 0), 0);

            let earliestSubmission = null;
            validContests.forEach((ch) => {
                if (ch.date) {
                    if (!earliestSubmission || new Date(ch.date) < new Date(earliestSubmission)) {
                        earliestSubmission = ch.date;
                    }
                }
            });

            leaderboard.push({
                userId: user._id,
                name: user.name || "Unknown",
                totalScore,
                earliestSubmission,
            });
        });

        leaderboard.sort((a, b) => {
            if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
            if (a.earliestSubmission && b.earliestSubmission) {
                return new Date(a.earliestSubmission) - new Date(b.earliestSubmission);
            }
            return 0;
        });

        res.status(200).json({ success: true, leaderboard });
    } catch (error) {
        console.error("Error fetching global leaderboard:", error);
        res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
};




const getAllContests = async (req, res) => {
    try {
        const contests = await contestModel.find().sort({ createdAt: -1 });
        res.status(200).json({ success: true, contests });
    } catch (error) {
        console.error("Error fetching contests:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};



module.exports = {
    loginController, registerController, getUserInfo, updateProfileController, deleteProfileImageController,
    uploadProfileImageController, chatbotController, getChatHistory, clearChatHistory, getGlobalLeaderboard,
    getStudyPlans,saveStudyPlan,getRoadmaps,saveRoadmap,getUserProgress,getLanguages,getCompletedMocks,
    saveQuizResult, getMockStatus, saveMockResult,generateStudyPlan,generateRoadMap,
    getMockCardDetails, getQuizCardDetails, progressContestByUser,getUserRank,
    addNotification,getNotifications,markAsRead,deleteNotification,
    deleteAllNotifications, getContestUser, submitContest, getAllContests,verifyPasswordController
 };