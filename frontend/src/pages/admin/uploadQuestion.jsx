import React, { useState, useEffect } from "react";
 import axios from "axios";
import "../../styles/uploadQuestion.css";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FaTrash } from "react-icons/fa";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import hljs from "highlight.js";
import "highlight.js/styles/github-dark.css";

const MySwal = withReactContent(Swal);

const AdminUpload = () => {
  const [type, setType] = useState("quiz");
  const [language, setLanguage] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [count, setCount] = useState(1);
  const [loadingAI, setLoadingAI] = useState(false);
  const [languages, setLanguages] = useState([]);
  const [showLangList, setShowLangList] = useState(false);
  const [showLangForm, setShowLangForm] = useState(false);
  const [newLang, setNewLang] = useState("");

  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", "", "", ""]);
  const [correctAnswer, setCorrectAnswer] = useState("");

  const [aiQuestions, setAiQuestions] = useState([]);

  const difficulties = ["Easy", "Medium", "Hard"];

  useEffect(() => {
    hljs.highlightAll();
  }, [aiQuestions]);

  const fetchLanguages = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await  axios. get("/api/v1/admin/get-languages", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setLanguages(res.data.data);
    } catch (err) {
      console.error("Fetch Languages Error:", err);
      toast.error("Failed to load languages");
    }
  };

  useEffect(() => {
    fetchLanguages();
  }, []);

  const handleUploadLanguage = async (e) => {
    e.preventDefault();
    if (!newLang.trim()) {
      toast.error("Language name required");
      return;
    }
    try {
      const token = localStorage.getItem("token");
      await  axios. post(
        "/api/v1/admin/upload-language",
        { name: newLang.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Language uploaded!");
      setNewLang("");
      setShowLangForm(false);
      fetchLanguages();
    } catch (err) {
      console.error("Upload Language Error:", err);
      toast.error(err.response?.data?.message || "Failed to upload language");
    }
  };

  const handleDeleteLanguage = async (id) => {
    try {
      const result = await MySwal.fire({
        title: "Are you sure?",
        text: "Do you really want to delete this language?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#d33",
        cancelButtonColor: "#3085d6",
        confirmButtonText: "Yes, delete it!",
      });

      if (result.isConfirmed) {
        const token = localStorage.getItem("token");
        await  axios. delete(`/api/v1/admin/delete-language/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        toast.success("Language deleted successfully!");
        MySwal.fire("Deleted!", "Language has been deleted.", "success");
        fetchLanguages();
      }
    } catch (err) {
      console.error("Delete Language Error:", err);
      toast.error(err.response?.data?.message || "Failed to delete language");
    }
  };

  const handleGenerateAI = async () => {
    if (!language || !difficulty) {
      toast.error("Please select both language and difficulty");
      return;
    }
    if (count < 1) {
      toast.error("Please enter a valid number of questions");
      return;
    }
    try {
      setLoadingAI(true);
      const token = localStorage.getItem("token");
      const res = await  axios. post(
        "/api/v1/admin/generate-ai",
        { language, difficulty, type, count },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setAiQuestions(res.data.data);
      toast.success("AI-generated questions loaded!");
    } catch (err) {
      console.error("AI Generation Error:", err);
      toast.error(
        err.response?.data?.message ||
        err.message ||
        "Unknown error while generating AI question."
      );
    } finally {
      setLoadingAI(false);
    }
  };

  const handleSubmitManual = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      await  axios. post(
        "/api/v1/admin/upload-question",
        { type, language, difficulty, question, options, correctAnswer },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success("Question uploaded!");
      resetAllFields();
    } catch (err) {
      console.error(err);
      toast.error("Upload failed");
    }
  };

  const handleUploadAIQuestions = async () => {
    try {
      const token = localStorage.getItem("token");
      for (const q of aiQuestions) {
        await  axios. post(
          "/api/v1/admin/upload-question",
          {
            type,
            language,
            difficulty,
            question: q.question,
            options: q.options,
            correctAnswer: q.correctAnswer,
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
      toast.success(`${aiQuestions.length} AI questions uploaded!`);
      resetAllFields();
    } catch (err) {
      console.error(err);
      toast.error("Failed to upload AI questions");
    }
  };

  const handleClearAll = async () => {
    const result = await MySwal.fire({
      title: "Are you sure?",
      text: "All AI questions will be cleared!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, clear all!",
    });

    if (result.isConfirmed) {
      resetAllFields();
      toast.success("All fields cleared!");
      MySwal.fire("Cleared!", "All AI questions have been cleared.", "success");
    }
  };

  const resetAllFields = () => {
    setType("quiz");
    setLanguage("");
    setDifficulty("");
    setCount(1);
    setQuestion("");
    setOptions(["", "", "", ""]);
    setCorrectAnswer("");
    setAiQuestions([]);
  };

  return (
    <div className="container">
      <div className="button-row">
        <button type="button" onClick={handleGenerateAI} disabled={loadingAI}>
          {loadingAI ? "Generating..." : "Generate with AI"}
        </button>

        <button
          type="button"
          onClick={() => setShowLangForm(!showLangForm)}
          className="toggle-btn"
        >
          {showLangForm ? "Cancel" : "Upload Language"}
        </button>

        <button
          type="button"
          onClick={() => setShowLangList(!showLangList)}
          className="toggle-btn"
        >
          {showLangList ? "Hide Languages" : "Show Languages"}
        </button>
      </div>

      {showLangForm && (
        <form onSubmit={handleUploadLanguage} className="lang-form">
          <input
            type="text"
            placeholder="Enter new language"
            value={newLang}
            onChange={(e) => setNewLang(e.target.value)}
            required
          />
          <button type="submit">Add Language</button>
        </form>
      )}

      {showLangList && (
        <div className="lang-list">
          <h3>Uploaded Languages</h3>
          {languages.length === 0 ? (
            <p>No languages uploaded yet.</p>
          ) : (
            <ul>
              {languages.map((lang) => (
                <li key={lang._id}>
                  {lang.name}
                  <button
                    type="button"
                    onClick={() => handleDeleteLanguage(lang._id)}
                    className="delete-btn"
                  >
                    <FaTrash />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <h2>Upload {type === "quiz" ? "Quiz" : "Mock"} Question</h2>

      <div className="common-select">
        <select value={type} onChange={(e) => setType(e.target.value)}>
          <option value="quiz">Quiz</option>
          <option value="mock">Mock</option>
        </select>

        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          required
        >
          <option value="">Select Language</option>
          {languages.map((lang) => (
            <option key={lang._id} value={lang.name}>
              {lang.name}
            </option>
          ))}
        </select>

        <select
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value)}
          required
        >
          <option value="">Select Difficulty</option>
          {difficulties.map((level) => (
            <option key={level} value={level}>
              {level}
            </option>
          ))}
        </select>

        <input
          type="number"
          min="1"
          max="20"
          className="count-input"
          value={count}
          onChange={(e) => setCount(e.target.value)}
          placeholder="No. of Questions (AI)"
        />
      </div>

      {aiQuestions.length > 0 && (
        <div className="generated-section">
          <h3>AI Generated Questions</h3>
          {aiQuestions.map((q, index) => (
            <div key={index} className="question-box">
              <h4>Q{index + 1}</h4>
              <div className="code-highlight">
                <pre>
                  <code className="hljs">{q.question}</code>
                </pre>
              </div>

              <ul>
                {q.options.map((opt, i) => (
                  <li key={i}>
                    {String.fromCharCode(65 + i)}. {opt}
                  </li>
                ))}
              </ul>
              <p>
                <strong>Correct Answer:</strong> {q.correctAnswer}
              </p>
            </div>
          ))}
          <button onClick={handleUploadAIQuestions}>Upload All</button>
          <button
            onClick={handleClearAll}
            style={{ background: "#ef4444", marginLeft: "1rem" }}
          >
            Clear All
          </button>
        </div>
      )}

      {aiQuestions.length === 0 && (
        <div className="manual-section">
          <h3>Manually Add Question</h3>
          <form onSubmit={handleSubmitManual}>
            <label>Enter Question</label>
            <textarea
              placeholder="Enter Question"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              required
            />

            <label>Enter Options</label>
            <div className="options-grid">
              {options.map((opt, idx) => (
                <input
                  key={idx}
                  type="text"
                  placeholder={`Option ${idx + 1}`}
                  value={opt}
                  onChange={(e) => {
                    const updated = [...options];
                    updated[idx] = e.target.value;
                    setOptions(updated);
                  }}
                  required
                />
              ))}
            </div>

            <label>Enter Correct Answer</label>
            <input
              type="text"
              placeholder="Correct Answer"
              value={correctAnswer}
              onChange={(e) => setCorrectAnswer(e.target.value)}
              required
            />

            <button type="submit">Upload Question</button>
          </form>
        </div>
      )}
    </div>
  );
};

export default AdminUpload;
