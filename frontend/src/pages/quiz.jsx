import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
 import axios from "axios";
import "../styles/quiz.css";

function Quiz() {
  const navigate = useNavigate();
  const [quizData, setQuizData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  const pageWindow = 3;

  const fetchQuizData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await  axios. get("/api/v1/user/get-quiz-cards", {
        headers: { Authorization: `Bearer ${token}` },
      });

      let data = res.data.data || [];

      const unique = [];
      const seen = new Set();
      for (const item of data) {
        const key = `${item.language}-${item.questions}-${item.time}`;
        if (!seen.has(key)) {
          seen.add(key);
          unique.push(item);
        }
      }

      setQuizData(unique);
    } catch (err) {
      console.error("Error fetching quiz data:", err.response || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuizData();
  }, []);

  const handleNavigate = (card) => {
    navigate(`/quiz/${card.language}`, {
      state: { cardQuestions: card.questions, cardTime: card.time },
    });
  };

  if (loading) return <p className="loading-text">Loading quizzes...</p>;

  const totalPages = Math.ceil(quizData.length / itemsPerPage);
  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentItems = quizData.slice(indexOfFirst, indexOfLast);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };


  const startPage = Math.max(1, currentPage - Math.floor(pageWindow / 2));
  const endPage = Math.min(totalPages, startPage + pageWindow - 1);
  const visiblePages = [];
  for (let i = startPage; i <= endPage; i++) {
    visiblePages.push(i);
  }

  return (
    <div className="quiz-page">
      <h2 className="quiz-title">Choose A Quiz</h2>

      <div className="quiz-card-container">
        {currentItems.map((card, index) => (
          <div
            key={`${card.language}-${index}`} 
            className="quiz-card"
          >
            <div className="quiz-card-header">{card.language}</div>
            <div className="quiz-card-content">
              <p>Questions: {card.questions}</p>
              <p>Time: {card.time} mins</p>
            </div>
            <button
              className="quiz-button"
              onClick={() => handleNavigate(card)}
            >
              Start Quiz
            </button>
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="quiz-pagination-modern">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="quiz-page-btn"
          >
            Prev
          </button>

          {startPage > 1 && (
            <>
              <button
                onClick={() => handlePageChange(1)}
                className={`quiz-page-btn ${currentPage === 1 ? "active" : ""}`}
              >
                1
              </button>
              {startPage > 2 && <span className="quiz-ellipsis">...</span>}
            </>
          )}

          {visiblePages.map((page) => (
            <button
              key={page}
              onClick={() => handlePageChange(page)}
              className={`quiz-page-btn ${page === currentPage ? "active" : ""}`}
            >
              {page}
            </button>
          ))}

          {endPage < totalPages && (
            <>
              {endPage < totalPages - 1 && <span className="quiz-ellipsis">...</span>}
              <button
                onClick={() => handlePageChange(totalPages)}
                className={`quiz-page-btn ${currentPage === totalPages ? "active" : ""}`}
              >
                {totalPages}
              </button>
            </>
          )}

          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="quiz-page-btn"
          >
            Next
          </button>
        </div>

      )}

    </div>
  );
}

export default Quiz;
