import React, { useState, useEffect } from "react";
 import axios from "axios";
import "../../styles/uploadContest.css";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import hljs from "highlight.js";
import "highlight.js/styles/github-dark.css";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

const MySwal = withReactContent(Swal);

const ContestUpload = () => {
    const [questionSize, setQuestionSize] = useState("");
    const [timeDuration, setTimeDuration] = useState("");
    const [publishDateTime, setPublishDateTime] = useState("");
    const [generatedQuestions, setGeneratedQuestions] = useState([]);
    const [selectedQuestions, setSelectedQuestions] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        hljs.highlightAll();
    }, [generatedQuestions]);

    const handleGenerateQuestions = async () => {
        if (!questionSize || !timeDuration || !publishDateTime) {
            toast.error("Please fill all fields first");
            return;
        }
        setLoading(true);
        try {
            const token = localStorage.getItem("token");

            const res = await  axios. post(
                "/api/v1/admin/generateContestQuestions",
                { questionSize },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            const questionsWithSelect = res.data.questions.map((q) => ({
                ...q,
                selected: true,
            }));

            setGeneratedQuestions(questionsWithSelect);
            setSelectedQuestions(questionsWithSelect.filter((q) => q.selected));
            toast.success("Questions generated successfully!");
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || "Error generating questions");
        }
        setLoading(false);
    };

    const toggleQuestion = (index) => {
        const updated = [...generatedQuestions];
        updated[index].selected = !updated[index].selected;
        setGeneratedQuestions(updated);
        setSelectedQuestions(updated.filter((q) => q.selected));
    };

    const handleUpload = async () => {
        if (selectedQuestions.length === 0) {
            toast.error("No questions selected to upload");
            return;
        }

        setLoading(true);
        try {
            const token = localStorage.getItem("token");
            const res = await  axios. post(
                "/api/v1/admin/createContest",
                {
                    questionSize: selectedQuestions.length,
                    timeDuration,
                    publishDateTime,
                    questions: selectedQuestions,
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            toast.success(`Contest uploaded successfully! ID: ${res.data.contestId}`);
            setQuestionSize("");
            setTimeDuration("");
            setPublishDateTime("");
            setGeneratedQuestions([]);
            setSelectedQuestions([]);
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || "Error uploading contest");
        }
        setLoading(false);
    };

    const handleClear = async () => {
        const result = await MySwal.fire({
            title: "Are you sure?",
            text: "All fields and generated questions will be cleared!",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#d33",
            cancelButtonColor: "#3085d6",
            confirmButtonText: "Yes, clear all!",
        });

        if (result.isConfirmed) {
            setQuestionSize("");
            setTimeDuration("");
            setPublishDateTime("");
            setGeneratedQuestions([]);
            setSelectedQuestions([]);
            toast.success("All fields cleared!");
            MySwal.fire("Cleared!", "All questions and fields have been cleared.", "success");
        }
    };


    return (
        <div className="upload-container">
            <h2>Create Contest</h2>

            <div className="upload-form">
                <div className="form-group">
                    <label>Question Size:</label>
                    <input
                        type="number"
                        min="1"
                        value={questionSize}
                        onChange={(e) => setQuestionSize(e.target.value)}
                        className="form-input"
                    />
                </div>

                <div className="form-group">
                    <label>Time Duration (minutes):</label>
                    <input
                        type="number"
                        min="1"
                        value={timeDuration}
                        onChange={(e) => setTimeDuration(e.target.value)}
                        className="form-input"
                    />
                </div>

                <div className="form-group">
                    <label>Publish Date & Time:</label>
                    <input
                        type="datetime-local"
                        value={publishDateTime}
                        onChange={(e) => setPublishDateTime(e.target.value)}
                        className="form-input"
                    />
                </div>

                <button
                    type="button"
                    className="btn-generate"
                    onClick={handleGenerateQuestions}
                    disabled={loading}
                >
                    {loading ? "Generating..." : "Generate Questions"}
                </button>
            </div>

            {generatedQuestions.length > 0 && (
                <div className="generated-section">
                    <h3>Review Questions</h3>
                    {generatedQuestions.map((q, idx) => (
                        <div key={idx} className="question-box">
                            <label>
                                <input
                                    type="checkbox"
                                    checked={q.selected}
                                    onChange={() => toggleQuestion(idx)}
                                />{" "}
                                <strong>Q{idx + 1}:</strong>
                            </label>

                            <pre>
                                <code className="hljs">{q.question}</code>
                            </pre>

                            <ul className="options-list">
                                {q.options.map((opt, i) => (
                                    <li key={i}>
                                        {String.fromCharCode(65 + i)}. {opt}
                                    </li>
                                ))}
                            </ul>
                            <p className="correct-answer-display">
                                <strong>Answer:</strong> {q.correctAnswer}
                            </p>
                        </div>
                    ))}

                    <div className="buttons-group">
                        <button
                            className="btn-upload"
                            onClick={handleUpload}
                            disabled={loading}
                        >
                            Upload For Contest
                        </button>
                        <button
                            className="btn-clear"
                            onClick={handleClear}
                            disabled={loading}
                        >
                            Clear All
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ContestUpload;
