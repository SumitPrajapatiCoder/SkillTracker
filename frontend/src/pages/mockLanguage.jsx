import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
 import axios from "axios";
import "../styles/mocklanguage.css";
import { toast } from "react-toastify";
import hljs from "highlight.js";
import "highlight.js/styles/github-dark.css";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

const MockLanguage = () => {
  const { language } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { cardQuestions, cardTime } = location.state || {};

  const [allQuestions, setAllQuestions] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({});
  const [score, setScore] = useState(0);
  const [timer, setTimer] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [completed, setCompleted] = useState(false);
  const [mockDisabled, setMockDisabled] = useState(false);
  const [completionDate, setCompletionDate] = useState(null);
  const [user, setUser] = useState(null);
  const [pdfLoading, setPdfLoading] = useState(false);

  const certificateRef = useRef();
  const q = questions[current] || null;

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await  axios. post(
          `/api/v1/user/get_User_data`,
          {},
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        setUser(res.data.data);
      } catch (err) {
        console.error("Error fetching user:", err.message);
      }
    };
    fetchUser();
  }, []);

  const getMockStatus = async () => {
    try {
      const token = localStorage.getItem("token");
      const check = await  axios. get(`/api/v1/user/mock-status/${language}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (check.data?.disable) {
        setMockDisabled(true);
        if (check.data.date) setCompletionDate(check.data.date);
        return { disable: true, date: check.data.date };
      } else {
        setMockDisabled(false);
        setCompletionDate(null);
        return { disable: false, date: null };
      }
    } catch (err) {
      console.error("Error checking mock status:", err);
      return { disable: false, date: null };
    }
  };

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const token = localStorage.getItem("token");
        const status = await getMockStatus();
        if (status.disable) return;

        const res = await  axios. get(`/api/v1/quiz/get-mock/${language}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setAllQuestions(res.data.data || []);
      } catch (err) {
        console.error("Fetch Error", err);
        toast.error("Error loading mock test");
      }
    };
    fetchQuestions();
  }, [language]);


  useEffect(() => {
    if (allQuestions.length > 0 && cardQuestions) {
      const shuffled = [...allQuestions].sort(() => Math.random() - 0.5);
      const selected = shuffled.slice(0, cardQuestions);
      setQuestions(selected);

      const savedTime = localStorage.getItem(`mock-${language}-timer`);
      if (savedTime) {
        setTimer(parseInt(savedTime, 10));
      } else {
        setTimer(cardTime * 60);
      }
    }
  }, [allQuestions, cardQuestions, cardTime, language]);

  useEffect(() => {
    if (!completed && questions.length > 0 && timer > 0) {
      const interval = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            handleSubmit();
            localStorage.removeItem(`mock-${language}-timer`);
            return 0;
          }
          const newTime = prev - 1;
          localStorage.setItem(`mock-${language}-timer`, newTime);
          return newTime;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [timer, completed, questions]);

  const handleAnswer = (selected) => {
    setSelectedOption(selected);
    setAnswers((prev) => ({ ...prev, [current]: selected }));
  };

  const handleNext = () => {
    setSelectedOption(null);
    if (current + 1 < questions.length) setCurrent((c) => c + 1);
    else handleSubmit();
  };

  const handlePrevious = () => {
    if (current > 0) {
      setCurrent((c) => c - 1);
      setSelectedOption(answers[current - 1] || null);
    }
  };

  const handleSubmit = async () => {
    const finalScore = questions.reduce(
      (acc, q, idx) => acc + (answers[idx] === q.correctAnswer ? 1 : 0),
      0
    );
    setScore(finalScore);
    setCompleted(true);
    localStorage.removeItem(`mock-${language}-timer`);

    try {
      const token = localStorage.getItem("token");
      await  axios. post(
        "/api/v1/user/save-mock-result",
        { language, correct: finalScore, total: questions.length },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Mock submitted!");
      await getMockStatus();
    } catch (err) {
      toast.error("Failed to save mock result");
      console.error(err);
    }
  };

  const getHighlightedQuestion = (text) => {
    if (!text) return "";
    const cleanText = text.replace(/```[a-zA-Z0-9]*/g, "").replace(/```/g, "");
    return hljs.highlightAuto(cleanText).value;
  };

  const handleDownloadManual = async () => {
    if (!certificateRef.current) return toast.error("Certificate not found.");
    try {
      setPdfLoading(true);
      const node = certificateRef.current;

      if (document.fonts && document.fonts.ready) await document.fonts.ready;
      const imgs = Array.from(node.querySelectorAll("img"));
      await Promise.all(
        imgs.map((img) =>
          img.complete ? Promise.resolve() : new Promise((r) => (img.onload = r))
        )
      );

      const orig = {
        width: node.style.width,
        height: node.style.height,
        overflow: node.style.overflow,
        animation: node.style.animation,
        boxSizing: node.style.boxSizing,
      };

      const fullW = Math.ceil(node.scrollWidth);
      const fullH = Math.ceil(node.scrollHeight);
      node.style.width = `${fullW}px`;
      node.style.height = `${fullH}px`;
      node.style.overflow = "visible";
      node.style.animation = "none";
      node.style.boxSizing = "border-box";

      await new Promise((r) => setTimeout(r, 50));

      const scale = Math.min(2, window.devicePixelRatio || 1.5);
      const canvas = await html2canvas(node, {
        scale,
        useCORS: true,
        backgroundColor: "#ffffff",
        width: fullW,
        height: fullH,
        windowWidth: document.documentElement.clientWidth,
        windowHeight: document.documentElement.clientHeight,
      });

      node.style.width = orig.width;
      node.style.height = orig.height;
      node.style.overflow = orig.overflow;
      node.style.animation = orig.animation;
      node.style.boxSizing = orig.boxSizing;

      const dataUrl = canvas.toDataURL("image/png", 1);

      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "px",
        format: "a4",
      });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();

      const ratio = Math.min(pageW / fullW, pageH / fullH);
      const imgW = fullW * ratio;
      const imgH = fullH * ratio;
      const x = (pageW - imgW) / 2;
      const y = (pageH - imgH) / 2;

      pdf.addImage(dataUrl, "PNG", x, y, imgW, imgH);
      pdf.save(`${user?.name || "user"}-${language}-certificate.pdf`);
      toast.success("Certificate downloaded successfully!");
    } catch (err) {
      console.error("download error:", err);
      toast.error("Failed to download certificate.");
    } finally {
      setPdfLoading(false);
    }
  };

  if (mockDisabled) {
    return (
      <div className="quiz-complete">
        <h2>🎉 Already Cleared</h2>
        <p>
          You’ve already scored full marks in the <strong>{language}</strong>{" "}
          mock test.
        </p>
        <button onClick={() => navigate("/mock_test")}>Go To Mock Page</button>

        <div
          className="certificate"
          ref={certificateRef}
          style={{
            maxWidth: 800,
            margin: "20px auto",
            padding: 24,
            border: "6px solid #d4af37",
            borderRadius: 12,
            textAlign: "center",
            background: "#fff",
            color: "#333",
            fontFamily: "'Georgia', serif, 'Times New Roman', Times, serif",
            userSelect: "none",
          }}
        >
          <h3 style={{ margin: 0 }}>🏆 Certificate of Excellence 🏆</h3>
          <p style={{ marginTop: 10 }}>This certifies that</p>
          <h2 className="user-name" style={{ margin: "10px 0" }}>
            {user?.name || "You"}
          </h2>
          <p style={{ marginBottom: 12 }}>
            has successfully completed the <strong>{language}</strong> mock test
            with full marks.
          </p>
          <p className="date" style={{ marginTop: 8 }}>
            Date:{" "}
            {completionDate
              ? new Date(completionDate).toLocaleDateString("en-IN")
              : "N/A"}
          </p>
        </div>

        <button
          onClick={handleDownloadManual}
          style={{ marginTop: 10 }}
          disabled={pdfLoading}
          aria-busy={pdfLoading}
        >
          {pdfLoading ? "Downloading..." : "Download Certificate"}
        </button>
      </div>
    );
  }

  if (completed) {
    return (
      <div className="quiz-complete">
        <h2>Mock Test Completed!</h2>
        <p>
          You scored <strong>{score}</strong> out of{" "}
          <strong>{questions.length}</strong>
        </p>
        <button onClick={() => navigate("/mock_test")}>Go to Mock Test</button>
      </div>
    );
  }

  if (questions.length === 0) return <p>Loading mock questions...</p>;

  const minutes = Math.floor(timer / 60);
  const seconds = timer % 60;

  return (
    <div className="quiz-language-wrapper">
      <div className="mock-header">
        <div className="mock-header-top">
          <button className="quit-btn" onClick={() => navigate("/mock_test")}>
            Quit
          </button>
          <h2>{language} Mock Test</h2>
          {!completed && (
            <div className="mock-timer">
              ⏱ Time Left: {minutes}:{seconds < 10 ? `0${seconds}` : seconds}
            </div>
          )}
        </div>
        <p>Total Questions: {questions.length}</p>
      </div>

      <div className="question-box">
        <pre>
          <strong>Q{current + 1}:</strong>{" "}
          <code
            dangerouslySetInnerHTML={{
              __html: getHighlightedQuestion(q?.question),
            }}
          />
        </pre>

        <div className="options-list">
          {q.options.map((opt, idx) => {
            const cleanedOpt = opt.replace(/\n[a-zA-Z]*/g, "").trim();
            const highlightedOpt = hljs.highlightAuto(cleanedOpt).value;
            return (
              <label
                key={idx}
                className={`option-label ${selectedOption === opt ? "selected" : ""
                  }`}
              >
                <input
                  type="radio"
                  name={`question-${current}`}
                  value={opt}
                  checked={selectedOption === opt}
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

export default MockLanguage;
