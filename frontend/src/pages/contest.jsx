import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
 import axios from "axios";
import { toast } from "react-toastify";
import hljs from "highlight.js";
import "highlight.js/styles/github-dark.css";
import "../styles/contest.css";

const Contest = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [contest, setContest] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({});
  const [completed, setCompleted] = useState(false);
  const [timer, setTimer] = useState(0);

  const intervalRef = useRef(null);
  const hasSubmittedRef = useRef(false);

  useEffect(() => {
    const fetchContest = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await  axios. get(`/api/v1/user/contest/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.data.success) {
          const c = res.data.contest;
          setContest(c);
          setQuestions(c.questions || []);

          const savedTime = localStorage.getItem(`contest-${id}-timer`);
          if (savedTime) setTimer(parseInt(savedTime, 10));
          else setTimer(c.timeDuration * 60);

          const savedAnswers = localStorage.getItem(`contest-${id}-answers`);
          if (savedAnswers) setAnswers(JSON.parse(savedAnswers));

          
        } else {
          toast.error(res.data.message);
        }
      } catch (err) {
        console.error("Error fetching contest:", err);
        toast.error(err.response?.data?.message || "Failed to load contest.");
      }
    };

    fetchContest();
  }, [id]);

  useEffect(() => {
    if (!contest || completed) return;

    intervalRef.current = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          setCompleted(true);
          localStorage.removeItem(`contest-${id}-timer`);
          return 0;
        }
        const newTime = prev - 1;
        localStorage.setItem(`contest-${id}-timer`, newTime);
        return newTime;
      });
    }, 1000);

    return () => clearInterval(intervalRef.current);
  }, [contest, completed, id]);

  useEffect(() => {
    localStorage.setItem(`contest-${id}-answers`, JSON.stringify(answers));
  }, [answers, id]);

  useEffect(() => {
    const submitContest = async () => {
      if (!completed || questions.length === 0 || hasSubmittedRef.current) return;

      hasSubmittedRef.current = true;

      clearInterval(intervalRef.current);
      localStorage.removeItem(`contest-${id}-timer`);
      localStorage.removeItem(`contest-${id}-answers`);

      const correctCount = questions.reduce(
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
        const res = await  axios. post(
          "/api/v1/user/contestSubmit",
          {
            contestId: contest._id,
            score: correctCount,
            totalQuestions: questions.length,
            playedQuestions,
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (res.data.message?.includes("not valid")) {
          setContest((prev) => ({ ...prev, invalidSubmission: true }));
          toast.warning(res.data.message); 
        } else {
          toast.success(res.data.message || "Contest submitted successfully!");
        }
      } catch (err) {
        console.error(err);
        toast.error(err.response?.data?.message || "Failed to save contest result");
      }
    };

    submitContest();
  }, [completed, questions, answers, contest, id]);



  const handleAnswer = (selected) => {
    setAnswers((prev) => ({ ...prev, [current]: selected }));
  };

  const handleNext = () => {
    setCurrent((prev) => {
      const next = prev + 1;
      if (next < questions.length) return next;
      else {
        setCompleted(true);
        return prev;
      }
    });
  };

  const handlePrevious = () => {
    if (current > 0) setCurrent((prev) => prev - 1);
  };

  if (!contest)
    return <p className="contest-page-loading">Loading contest...</p>;

  const minutes = Math.floor(timer / 60);
  const seconds = timer % 60;

  if (completed) {
    const isInvalid = contest?.invalidSubmission;

    return (
      <section className="contest-page-complete">
        {isInvalid ? (
          <>
            <h3>Invalid Submission</h3>
            <p>
              {`Your submission for Contest ${contest._id.slice(-6).toUpperCase()} was submitted but is not valid.`}
            </p>
          </>
        ) : (
          <>
            <h3>Your contest has been submitted successfully!</h3>
            <p>Results will be visible once the leaderboard is published.</p>
          </>
        )}

        <button
          className="contest-page-back-btn"
          onClick={() => navigate("/contestList")}
        >
          Back to Contests
        </button>
      </section>
    );
  }




  const q = questions[current];
  const highlightedHTML = hljs.highlightAuto(q.question).value;
  const selectedOption = answers[current] || null;

  return (
    <section className="contest-page-wrapper">
      <header className="contest-header">
        <div className="contest-header-top">
          <button
            className="contest-quit-btn"
            onClick={() => navigate("/contestList")}
          >
            Quit
          </button>
          <span className="contest-timer">
            ⏱ Time Left: {minutes}:{seconds < 10 ? `0${seconds}` : seconds}
          </span>
        </div>

        <div className="contest-header-center">
          <h2>Contest {contest._id.slice(-6).toUpperCase()}</h2>
          <p>
            <strong>Questions:</strong> {questions.length} |{" "}
            <strong>Duration:</strong> {contest.timeDuration} mins
          </p>
        </div>
      </header>

      <article className="contest-page-question-box">
        <pre className="contest-page-question-text">
          Q{current + 1}:{" "}
          <code dangerouslySetInnerHTML={{ __html: highlightedHTML }} />
        </pre>

        <div className="contest-page-options-list">
          {q.options.map((opt, idx) => {
            const highlightedOpt = hljs.highlightAuto(opt).value;
            const isSelected = selectedOption === opt;

            return (
              <label
                key={idx}
                className={`contest-page-option-item ${isSelected ? "contest-page-selected-option" : ""
                  }`}
              >
                <input
                  type="radio"
                  name={`question-${current}`}
                  value={opt}
                  checked={isSelected}
                  onChange={() => handleAnswer(opt)}
                />
                <pre className="contest-page-option-code">
                  <code dangerouslySetInnerHTML={{ __html: highlightedOpt }} />
                </pre>
              </label>
            );
          })}
        </div>

        <div className="contest-page-navigation-buttons">
          <button
            className="contest-page-nav-btn"
            onClick={handlePrevious}
            disabled={current === 0}
          >
            Previous
          </button>
          <button className="contest-page-nav-btn" onClick={handleNext}>
            {current === questions.length - 1 ? "Submit" : "Next"}
          </button>
        </div>
      </article>
    </section>
  );
};

export default Contest;
