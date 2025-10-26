import React, { useEffect, useState } from "react";
 import axios from "axios";
import "../../styles/questionList.css";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import hljs from "highlight.js";
import "highlight.js/styles/github-dark.css";
import { FaPen } from "react-icons/fa";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

const MySwal = withReactContent(Swal);

const AdminQuestionList = () => {
  const [questions, setQuestions] = useState([]);
  const [type, setType] = useState("quiz");
  const [search, setSearch] = useState("");
  const [language, setLanguage] = useState("");
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [languages, setLanguages] = useState([]);

  const [currentPage, setCurrentPage] = useState(1);
  const questionsPerPage = 5;

  const cleanCode = (code) =>
    code.replace(/```[a-zA-Z]*/g, "").replace(/```/g, "").trim();

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await  axios. get(
        `/api/v1/admin/all-questions?type=${type}&search=${search}&language=${language}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = res.data?.data ?? res.data?.questions ?? res.data ?? [];
      setQuestions(Array.isArray(data) ? data : []);
      setCurrentPage(1);
    } catch (err) {
      console.error("fetchQuestions error:", err);
      toast.error(err.response?.data?.message ?? "Failed to load questions");
    } finally {
      setLoading(false);
    }
  };

  const fetchLanguages = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await  axios. get("/api/v1/admin/get-languages", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setLanguages(res.data.data || []);
    } catch (err) {
      console.error("Fetch Languages Error:", err);
      toast.error("Failed to load languages");
    }
  };

  const handleDelete = async (id) => {
    const result = await MySwal.fire({
      title: "Are you sure?",
      text: "Do you really want to delete this question?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    });

    if (!result.isConfirmed) return;

    try {
      const token = localStorage.getItem("token");
      await  axios. delete(`/api/v1/admin/delete-question/${id}?type=${type}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setQuestions((prev) => prev.filter((q) => q._id !== id));
      toast.success("Question deleted successfully!");
      MySwal.fire("Deleted!", "Question has been deleted.", "success");
    } catch (err) {
      console.error(err);
      toast.error("Delete failed");
    }
  };

  const startEdit = (q) => {
    setEditMode(q._id);
    setEditForm({
      language: q.language || "",
      difficulty: q.difficulty || "",
      question: q.question || "",
      options: q.options || [],
      correctAnswer: q.correctAnswer || "",
    });
  };

  const handleUpdate = async () => {
    try {
      const token = localStorage.getItem("token");
      await  axios. put(
        `/api/v1/admin/edit-question/${editMode}?type=${type}`,
        editForm,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Question updated successfully!");
      setQuestions((prev) =>
        prev.map((q) => (q._id === editMode ? { ...q, ...editForm } : q))
      );
      setEditMode(null);
    } catch (err) {
      console.error(err);
      toast.error("Update failed");
    }
  };

  const totalCount = questions.length;
  const languageCounts = languages.reduce((acc, lang) => {
    acc[lang.name] = questions.filter(
      (q) => q.language?.toLowerCase() === lang.name.toLowerCase()
    ).length;
    return acc;
  }, {});

  const indexOfLast = currentPage * questionsPerPage;
  const indexOfFirst = indexOfLast - questionsPerPage;
  const currentQuestions = questions.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(totalCount / questionsPerPage);

  const handlePageChange = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  useEffect(() => {
    hljs.highlightAll();
  }, [questions]);

  useEffect(() => {
    fetchQuestions();
  }, [type, language]);

  useEffect(() => {
    fetchLanguages();
  }, []);

  return (
    <div className="admin-form">
      <h2>All {type === "quiz" ? "Quiz" : "Mock"} Questions</h2>

      <div className="filter-bar">
        <select value={type} onChange={(e) => setType(e.target.value)}>
          <option value="quiz">Quiz</option>
          <option value="mock">Mock</option>
        </select>

        <select value={language} onChange={(e) => setLanguage(e.target.value)}>
          <option value="">All Languages ({totalCount})</option>
          {languages.map((lang) => (
            <option key={lang._id} value={lang.name}>
              {lang.name} ({languageCounts[lang.name] || 0})
            </option>
          ))}
        </select>

        <input
          type="text"
          placeholder="Search by language or question"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button onClick={fetchQuestions} disabled={loading}>
          {loading ? "Searching..." : "Search"}
        </button>
      </div>

      {questions.length === 0 ? (
        <p>No questions found.</p>
      ) : (
        <>
          <ul className="question-list">
            {currentQuestions.map((q) => (
              <li key={q._id} className="question-card">
                {editMode === q._id ? (
                  <>
                    <div className="input-group">
                      <label>Language:</label>
                      <input
                        type="text"
                        value={editForm.language}
                        onChange={(e) =>
                          setEditForm({ ...editForm, language: e.target.value })
                        }
                        className="profile-input"
                      />
                    </div>
                    <div className="input-group">
                      <label>Difficulty:</label>
                      <input
                        type="text"
                        value={editForm.difficulty}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            difficulty: e.target.value,
                          })
                        }
                        className="profile-input"
                      />
                    </div>
                    <div className="input-group">
                      <label>Question:</label>
                      <textarea
                        value={editForm.question}
                        onChange={(e) =>
                          setEditForm({ ...editForm, question: e.target.value })
                        }
                        className="profile-input"
                      />
                    </div>
                    <div className="input-group">
                      <label>Options:</label>
                      {editForm.options.map((opt, idx) => (
                        <input
                          key={idx}
                          type="text"
                          value={opt}
                          onChange={(e) => {
                            const newOpts = [...editForm.options];
                            newOpts[idx] = e.target.value;
                            setEditForm({ ...editForm, options: newOpts });
                          }}
                          className="profile-input"
                        />
                      ))}
                    </div>
                    <div className="input-group">
                      <label>Correct Answer:</label>
                      <input
                        type="text"
                        value={editForm.correctAnswer}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            correctAnswer: e.target.value,
                          })
                        }
                        className="profile-input"
                      />
                    </div>
                    <div className="edit-buttons">
                      <button className="save-btn" onClick={handleUpdate}>
                        Save
                      </button>
                      <button
                        className="cancel-btn"
                        onClick={() => setEditMode(null)}
                      >
                        Cancel
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <FaPen
                      className="edit-icon"
                      style={{
                        position: "absolute",
                        top: "10px",
                        right: "10px",
                        cursor: "pointer",
                        color: "#007bff",
                      }}
                      onClick={() => startEdit(q)}
                    />
                    <p>
                      <strong>Language:</strong> {q.language}
                    </p>
                    <p>
                      <strong>Difficulty:</strong> {q.difficulty}
                    </p>
                    <p>
                      <strong>Question:</strong>
                    </p>
                    <pre className="code-block">
                      <code className={q.language?.toLowerCase() || ""}>
                        {cleanCode(q.question)}
                      </code>
                    </pre>
                    <p>
                      <strong>Options:</strong>
                    </p>
                    <div className="options-grid">
                      {q.options.map((opt, idx) => (
                        <div
                          key={idx}
                          className={`option-item ${opt === q.correctAnswer ? "correct-option" : ""
                            }`}
                        >
                          <span className="option-label">
                            Option {idx + 1}:
                          </span>
                          <pre className="code-block">
                            <code className={q.language?.toLowerCase() || ""}>
                              {cleanCode(opt)}
                            </code>
                          </pre>
                        </div>
                      ))}
                    </div>

                    <p>
                      <strong>Answer:</strong>
                      <pre className="code-block">
                        <code className={q.language?.toLowerCase() || ""}>
                          {cleanCode(q.correctAnswer)}
                        </code>
                      </pre>
                    </p>
                    <div className="question-actions">
                      <button
                        onClick={() => handleDelete(q._id)}
                        className="delete-button"
                      >
                        Delete
                      </button>
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>

            <div className="question-pagination">
              <button
                className="question-page-btn"
                disabled={currentPage === 1}
                onClick={() => handlePageChange(currentPage - 1)}
              >
                Prev
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(
                  (page) =>
                    page === 1 ||
                    page === totalPages ||
                    (page >= currentPage - 1 && page <= currentPage + 1)
                )
                .map((page, i, arr) => {
                  const prevPage = arr[i - 1];
                  return (
                    <React.Fragment key={page}>
                      {prevPage && page - prevPage > 1 && <span className="question-dots">...</span>}
                      <button
                        className={`question-page-btn ${currentPage === page ? "question-active" : ""
                          }`}
                        onClick={() => handlePageChange(page)}
                      >
                        {page}
                      </button>
                    </React.Fragment>
                  );
                })}

              <button
                className="question-page-btn"
                disabled={currentPage === totalPages}
                onClick={() => handlePageChange(currentPage + 1)}
              >
                Next
              </button>
            </div>


        </>
      )}
    </div>
  );
};

export default AdminQuestionList;
