import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
 import axios from "axios";
import { toast } from "react-toastify";
import hljs from "highlight.js";
import "highlight.js/styles/github-dark.css";
import "../styles/quizlanguage.css";

const QuizLanguage = () => {
  const { language } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { cardQuestions, cardTime } = location.state || {};

  const [allQuestions, setAllQuestions] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({});
  const [completed, setCompleted] = useState(false);
  const [timer, setTimer] = useState(0);

  const intervalRef = useRef(null);

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await  axios. get(`/api/v1/quiz/get-quiz/${language}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setAllQuestions(res.data.data || []);
      } catch (err) {
        console.error("Fetch Error", err);
        toast.error(`No quiz found for ${language}`);
      }
    };
    fetchQuestions();
  }, [language]);

  useEffect(() => {
    if (allQuestions.length > 0 && cardQuestions) {
      const shuffled = [...allQuestions].sort(() => Math.random() - 0.5);
      const selected = shuffled.slice(0, cardQuestions);
      setQuestions(selected);

      const savedTime = localStorage.getItem(`quiz-${language}-timer`);
      if (savedTime) setTimer(parseInt(savedTime, 10));
      else setTimer(cardTime * 60);

      const savedAnswers = localStorage.getItem(`quiz-${language}-answers`);
      if (savedAnswers) setAnswers(JSON.parse(savedAnswers));
    }
  }, [allQuestions, cardQuestions, cardTime, language]);

  useEffect(() => {
    if (!completed && questions.length > 0 && timer > 0) {
      intervalRef.current = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            clearInterval(intervalRef.current);
            setCompleted(true);
            localStorage.removeItem(`quiz-${language}-timer`);
            return 0;
          }
          const newTime = prev - 1;
          localStorage.setItem(`quiz-${language}-timer`, newTime);
          return newTime;
        });
      }, 1000);

      return () => clearInterval(intervalRef.current);
    }
  }, [completed, questions, timer, language]);

  useEffect(() => {
    localStorage.setItem(`quiz-${language}-answers`, JSON.stringify(answers));
  }, [answers, language]);

  useEffect(() => {
    const submitQuiz = async () => {
      if (!completed || questions.length === 0) return;

      clearInterval(intervalRef.current);
      localStorage.removeItem(`quiz-${language}-timer`);
      localStorage.removeItem(`quiz-${language}-answers`);

      const finalScore = questions.reduce(
        (acc, q, idx) => acc + (answers[idx] === q.correctAnswer ? 1 : 0),
        0
      );

      const playedQuestions = questions.map((q, idx) => ({
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
        selectedAnswer: answers[idx] || null,
      }));

      try {
        const token = localStorage.getItem("token");
        await  axios. post(
          "/api/v1/user/save-quiz-result",
          { language, correct: finalScore, total: questions.length, playedQuestions },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const completedQuizzesForStudy =
          JSON.parse(localStorage.getItem("completedQuizzesForStudy")) || [];
        if (!completedQuizzesForStudy.includes(language)) {
          completedQuizzesForStudy.push(language);
          localStorage.setItem(
            "completedQuizzesForStudy",
            JSON.stringify(completedQuizzesForStudy)
          );
        }

        const completedQuizzesForRoadmap =
          JSON.parse(localStorage.getItem("completedQuizzesForRoadmap")) || [];
        if (!completedQuizzesForRoadmap.includes(language)) {
          completedQuizzesForRoadmap.push(language);
          localStorage.setItem(
            "completedQuizzesForRoadmap",
            JSON.stringify(completedQuizzesForRoadmap)
          );
        }

        toast.success("Quiz submitted!");
      } catch (err) {
        toast.error("Failed to save result");
        console.error(err);
      }
    };

    submitQuiz();
  }, [completed, questions, answers, language]);

  const handleAnswer = (selected) => {
    setAnswers((prev) => ({ ...prev, [current]: selected }));
  };

  const handleNext = () => {
    setCurrent((c) => {
      const next = c + 1;
      if (next < questions.length) return next;
      else {
        setCompleted(true);
        return c;
      }
    });
  };

  const handlePrevious = () => {
    if (current > 0) setCurrent((c) => c - 1);
  };

  if (completed) {
    const finalScore = questions.reduce(
      (acc, q, idx) => acc + (answers[idx] === q.correctAnswer ? 1 : 0),
      0
    );

    return (
      <div className="quiz-complete">
        <h2>Quiz Completed!</h2>
        <p>
          You scored <strong>{finalScore}</strong> out of{" "}
          <strong>{questions.length}</strong>
        </p>

        <div className="review-section">
          {questions.map((q, idx) => {
            const highlightedQ = hljs.highlightAuto(q.question).value;
            return (
              <div key={idx} className="review-question-card">
                <div className="review-question-header">
                  <span>Question {idx + 1}</span>
                </div>

                <pre className="review-question-text">
                  <code dangerouslySetInnerHTML={{ __html: highlightedQ }} />
                </pre>

                <div className="review-options">
                  {q.options.map((opt, i) => {
                    const highlightedOpt = hljs.highlightAuto(opt).value;
                    const isCorrect = opt === q.correctAnswer;
                    const isSelected = answers[idx] === opt;

                    return (
                      <div
                        key={i}
                        className={`review-option ${isCorrect ? "correct" : ""} ${isSelected && !isCorrect ? "wrong" : ""
                          }`}
                      >
                        <pre>
                          <code dangerouslySetInnerHTML={{ __html: highlightedOpt }} />
                        </pre>
                        {isCorrect || isSelected ? (
                          <span
                            className={`option-badge ${isCorrect ? "correct-badge" : "wrong-badge"
                              }`}
                          >
                            {isCorrect ? "Correct" : "Wrong"}
                          </span>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <button onClick={() => navigate("/quiz")}>Back to Quizzes</button>
        <button
          onClick={() =>
            navigate("/study_plane", {
              state: { generateLanguage: language },
              replace: true,
            })
          }
        >
          Go to Study Plan
        </button>
        <button
          onClick={() =>
            navigate("/roadmap", {
              state: { generateLanguage: language },
              replace: true,
            })
          }
        >
          Go to Road Map
        </button>
      </div>
    );
  }

  if (questions.length === 0) return <p>Loading questions...</p>;

  const q = questions[current];
  const minutes = Math.floor(timer / 60);
  const seconds = timer % 60;
  const highlightedHTML = hljs.highlightAuto(q.question).value;
  const selectedOption = answers[current] || null;

  return (
    <div className="quiz-language-wrapper">
      <div className="quiz-header">
        <div className="header-top">
          <div className="quiz-quit">
            <button onClick={() => navigate("/quiz")}>Quit</button>
          </div>

          <h2>{language} Quiz</h2>

          {!completed && (
            <div className="timer">
              ⏱ Time Left: {minutes}:{seconds < 10 ? `0${seconds}` : seconds}
            </div>
          )}
        </div>

        <div className="header-bottom">
          <p>Total Questions: {questions.length}</p>
        </div>
      </div>

      <div className="question-box">
        <pre>
          Q{current + 1}: <code dangerouslySetInnerHTML={{ __html: highlightedHTML }} />
        </pre>

        <div className="options-list">
          {q.options.map((opt, idx) => {
            const highlightedOpt = hljs.highlightAuto(opt).value;
            const isSelected = selectedOption === opt;

            return (
              <label
                key={idx}
                className={`option-radio ${isSelected ? "selected" : ""}`}
              >
                <input
                  type="radio"
                  name={`question-${current}`}
                  value={opt}
                  checked={isSelected}
                  onChange={() => handleAnswer(opt)}
                />
                <pre className="option-code">
                  <code dangerouslySetInnerHTML={{ __html: highlightedOpt }} />
                </pre>
              </label>
            );
          })}
        </div>

        <div className="navigation-buttons">
          <button onClick={handlePrevious} disabled={current === 0}>
            Previous
          </button>
          <button onClick={handleNext}>
            {current === questions.length - 1 ? "Submit" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuizLanguage;
