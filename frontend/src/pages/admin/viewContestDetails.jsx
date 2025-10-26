import React, { useState, useEffect } from "react";
 import axios from "axios";
import "../../styles/viewContestDetails.css";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import hljs from "highlight.js";
import "highlight.js/styles/github-dark.css";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

const MySwal = withReactContent(Swal);

const ContestView = () => {
    const [contests, setContests] = useState([]);
    const [loading, setLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const contestsPerPage = 1; 
    const fetchContests = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem("token");
            const res = await  axios. get("/api/v1/admin/getAllContests", {
                headers: { Authorization: `Bearer ${token}` },
            });

            const sortedContests = res.data.contests.sort((a, b) =>
                new Date(b.publishDateTime) - new Date(a.publishDateTime)
            );

            setContests(sortedContests);
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || "Error fetching contests");
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchContests();
    }, []);

    useEffect(() => {
        hljs.highlightAll();
    }, [contests]);

    const handleDeleteContest = async (id) => {
        const result = await MySwal.fire({
            title: "Are you sure?",
            text: "Do you really want to delete this contest?",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#d33",
            cancelButtonColor: "#3085d6",
            confirmButtonText: "Yes, delete it!"
        });

        if (result.isConfirmed) {
            try {
                const token = localStorage.getItem("token");
                await  axios. delete(`/api/v1/admin/deleteContest/${id}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });

                setContests((prev) => prev.filter((c) => c._id !== id));
                toast.success("Contest deleted successfully");
                MySwal.fire("Deleted!", "Contest has been deleted.", "success");
            } catch (err) {
                console.error(err);
                toast.error(err.response?.data?.message || "Failed to delete contest");
            }
        }
    };

    const totalPages = Math.ceil(contests.length / contestsPerPage);
    const indexOfLast = currentPage * contestsPerPage;
    const indexOfFirst = indexOfLast - contestsPerPage;
    const currentContests = contests.slice(indexOfFirst, indexOfLast);

    const handlePageChange = (page) => {
        if (page < 1 || page > totalPages) return;
        setCurrentPage(page);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    return (
        <div className="view-container">
            <h2>All Contests</h2>

            {loading && <p>Loading contests...</p>}
            {!loading && contests.length === 0 && <p>No contests found.</p>}

            {currentContests.map((contest, idx) => (
                <div key={idx} className="contest-card">
                    <div className="contest-header">
                        <p className="contest-no"><strong>Contest No. {contest._id.slice(-5)}</strong></p>
                        <p className="question-size"><strong>Question Size:</strong> {contest.questionSize}</p>
                        <p className="time-duration"><strong>Time Duration:</strong> {contest.timeDuration} minutes</p>
                        <p className="publish-date"><strong>Published Date & Time:</strong> {contest.publishDetails.formatted}</p>
                    </div>

                    <h3>Questions:</h3>
                    <div className="questions-list">
                        {contest.questions.map((q, qidx) => (
                            <div key={qidx} className="question-card">
                                <p className="question-meta">
                                    <strong>Q{qidx + 1}:</strong> ({q.language}, {q.difficulty})
                                </p>
                                <pre>
                                    <code className="hljs">{q.question}</code>
                                </pre>
                                <ul className="options-list">
                                    {q.options.map((opt, i) => (
                                        <li key={i}>{String.fromCharCode(65 + i)}. {opt}</li>
                                    ))}
                                </ul>
                                <p className="correct-answer-display">
                                    <strong>Answer:</strong> {q.correctAnswer}
                                </p>
                            </div>
                        ))}
                    </div>
                    <button
                        className="btn-delete"
                        onClick={() => handleDeleteContest(contest._id)}
                    >
                        Delete Contest
                    </button>
                </div>
            ))}

            {totalPages > 1 && (
                <div className="view-pagination">
                    <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                    >
                        Prev
                    </button>

                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter((page) => {
                            return (
                                page === 1 ||
                                page === totalPages ||
                                (page >= currentPage - 1 && page <= currentPage + 1)
                            );
                        })
                        .map((page, i, arr) => {
                            if (i > 0 && page - arr[i - 1] > 1) {
                                return (
                                    <React.Fragment key={page}>
                                        <span>...</span>
                                        <button
                                            onClick={() => handlePageChange(page)}
                                            className={currentPage === page ? "active" : ""}
                                        >
                                            {page}
                                        </button>
                                    </React.Fragment>
                                );
                            }
                            return (
                                <button
                                    key={page}
                                    onClick={() => handlePageChange(page)}
                                    className={currentPage === page ? "active" : ""}
                                >
                                    {page}
                                </button>
                            );
                        })}

                    <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                    >
                        Next
                    </button>
                </div>
            )}

        </div>
    );
};

export default ContestView;

