import React, { useEffect, useState } from "react";
 import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
    FaTrophy,
    FaLock,
    FaPlayCircle,
    FaCalendarAlt,
    FaHistory,
    FaClock,
} from "react-icons/fa";
import "../styles/contestList.css";

const ContestList = () => {
    const [languages, setLanguages] = useState([]);
    const [contests, setContests] = useState([]);
    const [leaderboard, setLeaderboard] = useState([]);
    const [userRank, setUserRank] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const contestsPerPage = 6; 

    const navigate = useNavigate();

    useEffect(() => {
        const fetchLanguages = async () => {
            try {
                const token = localStorage.getItem("token");
                if (!token) throw new Error("No token found");
                const res = await  axios. get("/api/v1/user/get-languages", {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (res.data.success && res.data.data) {
                    setLanguages(res.data.data);
                }
            } catch (err) {
                console.error("Failed to load languages:", err);
            }
        };

        fetchLanguages();
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem("token");
                if (!token) throw new Error("No token found");

                const [contestsRes, leaderboardRes, userRankRes] = await Promise.all([
                     axios. get("/api/v1/user/contestAll", { headers: { Authorization: `Bearer ${token}` } }),
                     axios. get("/api/v1/user/leaderboard/global", { headers: { Authorization: `Bearer ${token}` } }),
                     axios. get("/api/v1/user/user-rank", { headers: { Authorization: `Bearer ${token}` } }),
                ]);

                let contestData = contestsRes.data.contests || [];

                const getStatus = (contest) => {
                    const now = new Date();
                    const start = new Date(contest.publishDetails.date);
                    const end = new Date(start.getTime() + contest.timeDuration * 60000);
                    if (now < start) return "upcoming";
                    if (now >= start && now <= end) return "live";
                    return "past";
                };

                contestData.sort((a, b) => {
                    const order = { upcoming: 1, live: 2, past: 3 };
                    return order[getStatus(a)] - order[getStatus(b)];
                });

                setContests(contestData);
                setLeaderboard(leaderboardRes.data.leaderboard || []);
                if (userRankRes.data.success && userRankRes.data.userRank) {
                    setUserRank(userRankRes.data.userRank);
                }
            } catch (err) {
                console.error(err);
                setError("Failed to load contests or leaderboard");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const getStatus = (contest) => {
        const now = new Date();
        const start = new Date(contest.publishDetails.date);
        const end = new Date(start.getTime() + contest.timeDuration * 60000);

        if (now < start) return "upcoming";
        if (now >= start && now <= end) return "live";
        return "past";
    };

    const handleContestClick = (contest) => {
        const status = getStatus(contest);
        if (status === "upcoming") return; 
        navigate(`/contest/${contest._id}`);
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

    if (loading) return <p className="contest-list-loading">Loading contests...</p>;
    if (error) return <p className="contest-list-error">{error}</p>;

    return (
        <section className="contest-list-wrapper">
            <h2><FaTrophy style={{ marginRight: "8px" }} /> Contests</h2>

            <div className="language-list">
                <h3>Contest Questions Are Based On These Languages</h3>
                {languages.length > 0 ? (
                    <div className="language-tags">
                        {languages.map((lang) => (
                            <span key={lang._id} className="language-tag">
                                {lang.name}
                            </span>
                        ))}
                    </div>
                ) : (
                    <p>No languages found</p>
                )}
            </div>

            <div className="contest-list-grid">
                {currentContests.map((contest) => {
                    const status = getStatus(contest);
                    const publishDate = new Date(contest.publishDetails.date).toLocaleString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                        hour12: true,
                    });

                    return (
                        <article key={contest._id} className={`contest-list-card ${status}`}>
                            <div className="contest-status-badge">
                                {status === "upcoming" && (
                                    <span className="contest-list-status upcoming">
                                        <FaLock /> Upcoming
                                    </span>
                                )}
                                {status === "live" && (
                                    <span className="contest-list-status live">
                                        <FaClock /> Live Now
                                    </span>
                                )}
                                {status === "past" && (
                                    <span className="contest-list-status past">
                                        <FaHistory /> Past Contest
                                    </span>
                                )}
                            </div>

                            <header className="contest-list-card-header">
                                <h3>Contest {contest._id.slice(-5).toUpperCase()}</h3>
                                <p>
                                    <strong>Questions:</strong> {contest.questionSize} |{" "}
                                    <strong>Duration:</strong> {contest.timeDuration} mins
                                </p>
                            </header>

                            <footer className="contest-list-card-footer">
                                <span className="contest-list-date">
                                    <FaCalendarAlt /> {publishDate}
                                </span>

                                {status !== "upcoming" && (
                                    <button
                                        className={`contest-play-btn ${status}`}
                                        onClick={() => handleContestClick(contest)}
                                    >
                                        <FaPlayCircle />
                                        {status === "past" ? " Play Again" : " Play Now"}
                                    </button>
                                )}
                            </footer>
                        </article>
                    );
                })}
            </div>

            
            {totalPages > 1 && (
                <div className="contest-pagination-modern">
                    <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="contest-page-btn"
                    >
                        Prev
                    </button>

                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter((page) => page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1))
                        .map((page, i, arr) => {
                            if (i > 0 && page - arr[i - 1] > 1) {
                                return (
                                    <React.Fragment key={page}>
                                        <span className="contest-ellipsis">...</span>
                                        <button
                                            onClick={() => handlePageChange(page)}
                                            className={`contest-page-btn ${currentPage === page ? "active" : ""}`}
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
                                    className={`contest-page-btn ${currentPage === page ? "active" : ""}`}
                                >
                                    {page}
                                </button>
                            );
                        })}

                    <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="contest-page-btn"
                    >
                        Next
                    </button>
                </div>
            )}



            {userRank && (
                <section className="user-rank">
                    <h3>Your Rank</h3>
                    <p>
                        <strong>Rank:</strong> {userRank.rank} | <strong>Name:</strong> {userRank.name} |{" "}
                        <strong>Total Score:</strong> {userRank.totalScore}
                    </p>
                </section>
            )}

            <section className="global-leaderboard">
                <h2>Global Leaderboard</h2>
                <table>
                    <thead>
                        <tr>
                            <th>Rank</th>
                            <th>Candidate Name</th>
                            <th>Total Score</th>
                        </tr>
                    </thead>
                    <tbody>
                        {leaderboard.map((user, index) => (
                            <tr
                                key={user.userId}
                                style={userRank?.name === user.name ? { backgroundColor: "#6e6e56ff" } : {}}
                            >
                                <td>{index + 1}</td>
                                <td>{user.name}</td>
                                <td>{user.totalScore}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </section>
        </section>
    );
};

export default ContestList;
