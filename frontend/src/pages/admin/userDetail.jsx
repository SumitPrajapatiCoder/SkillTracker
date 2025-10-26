import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
 import axios from "axios";
import { Spin, Descriptions, Collapse, Card, List } from "antd";
import "../../styles/userDetail.css";

const { Panel } = Collapse;

const UserDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchUserDetails = async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await  axios. get(`/api/v1/admin/user/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setUser(res.data.data);
        } catch (err) {
            console.error(err);
            alert("Failed to fetch user details");
            navigate(-1);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUserDetails();
    }, [id]);

    if (loading) return <Spin size="large" className="loading-spin" />;

    return (
        <div className="user-details-page">
            <button className="back-button" onClick={() => navigate("/userList")}>Back To User List</button>
            <h2>{user.name} - Full Details</h2>

            <Descriptions bordered column={1} size="middle">
                <Descriptions.Item label="ID">{user._id}</Descriptions.Item>
                <Descriptions.Item label="Name">{user.name}</Descriptions.Item>
                <Descriptions.Item label="Email">{user.email}</Descriptions.Item>
                <Descriptions.Item label="Role">{user.isAdmin ? "Admin" : "User"}</Descriptions.Item>
                <Descriptions.Item label="Status">{user.isBlocked ? "Blocked" : "Active"}</Descriptions.Item>
                <Descriptions.Item label="Profile Image URL">{user.profileImage}</Descriptions.Item>
                <Descriptions.Item label="Profile Image"><img src={user.profileImage} /></Descriptions.Item>
                <Descriptions.Item label="Created At">{new Date(user.createdAt).toLocaleString()}</Descriptions.Item>
                <Descriptions.Item label="Updated At">{new Date(user.updatedAt).toLocaleString()}</Descriptions.Item>
            </Descriptions>

            <Collapse
                defaultActiveKey={[
                    "quiz",
                    "mock",
                    "contest",
                    "studyPlans",
                    "roadmap",
                    "notifications",
                    "chat",
                    "completedMocks",
                ]}
                className="user-history-collapse"
            >
                <Panel header="Quiz History" key="quiz">
                    {user.quizHistory.length === 0 ? (
                        <p>No quiz history</p>
                    ) : (
                        user.quizHistory.map((quiz, idx) => (
                            <Card key={idx} className="history-item">
                                <p>
                                    <strong>Language:</strong> {quiz.language}
                                </p>
                                <p>
                                    <strong>Score:</strong> {quiz.correct}/{quiz.total}
                                </p>
                                <p>
                                    <strong>Date:</strong> {new Date(quiz.date).toLocaleString()}
                                </p>
                                <Collapse>
                                    <Panel header="Played Questions" key="playedQuestions">
                                        {quiz.playedQuestions.length === 0 ? (
                                            <p>No played questions</p>
                                        ) : (
                                            <List
                                                size="small"
                                                dataSource={quiz.playedQuestions}
                                                renderItem={(q, i) => (
                                                    <List.Item key={i}>
                                                        <div>
                                                            <p>
                                                                <strong>Q{i + 1}:</strong> {q.question}
                                                            </p>
                                                            <p>
                                                                <strong>Options:</strong> {q.options.join(", ")}
                                                            </p>
                                                            <p>
                                                                <strong>Correct Answer:</strong> {q.correctAnswer} |{" "}
                                                                <strong>Selected Answer:</strong> {q.selectedAnswer}
                                                            </p>
                                                        </div>
                                                    </List.Item>
                                                )}
                                            />
                                        )}
                                    </Panel>
                                </Collapse>
                            </Card>
                        ))
                    )}
                </Panel>

                <Panel header="Mock History" key="mock">
                    {user.mockHistory.length === 0 ? (
                        <p>No mock history</p>
                    ) : (
                        user.mockHistory.map((mock, idx) => (
                            <Card key={idx} className="history-item">
                                <p>
                                    <strong>Language:</strong> {mock.language}
                                </p>
                                <p>
                                    <strong>Score:</strong> {mock.correct}/{mock.total}
                                </p>
                                <p>
                                    <strong>Date:</strong> {new Date(mock.date).toLocaleString()}
                                </p>
                            </Card>
                        ))
                    )}
                </Panel>

                <Panel header="Completed Mocks" key="completedMocks">
                    {user.completedMocks.length === 0 ? (
                        <p>No completed mocks</p>
                    ) : (
                        user.completedMocks.map((mock, idx) => (
                            <Card key={idx} className="history-item">
                                <p>
                                    <strong>Language:</strong> {mock.language}
                                </p>
                                <p>
                                    <strong>Completed:</strong> {mock.completed ? "Yes" : "No"}
                                </p>
                                {mock.date && (
                                    <p>
                                        <strong>Date:</strong> {new Date(mock.date).toLocaleString()}
                                    </p>
                                )}
                            </Card>
                        ))
                    )}
                </Panel>

                <Panel header="Contest History" key="contest">
                    {user.contestHistory.length === 0 ? (
                        <p>No contest history</p>
                    ) : (
                        user.contestHistory.map((contest, idx) => (
                            <Card key={idx} className="history-item">
                                <p>
                                    <strong>Contest ID:</strong> {contest.contestId}
                                </p>
                                <p>
                                    <strong>Score:</strong> {contest.score}/{contest.totalQuestions}
                                </p>
                                <p>
                                    <strong>Date:</strong> {new Date(contest.date).toLocaleString()}
                                </p>
                                <p>
                                    <strong>Submission Type:</strong> {contest.submissionType?.toUpperCase() || "N/A"} 
                                </p>
                                <Collapse>
                                    <Panel header="Played Questions" key="playedQuestions">
                                        {contest.playedQuestions.length === 0 ? (
                                            <p>No played questions</p>
                                        ) : (
                                            <List
                                                size="small"
                                                dataSource={contest.playedQuestions}
                                                renderItem={(q, i) => (
                                                    <List.Item key={i}>
                                                        <div>
                                                            <p>
                                                                <strong>Q{i + 1}:</strong> {q.question}
                                                            </p>
                                                            <p>
                                                                <strong>Options:</strong> {q.options.join(", ")}
                                                            </p>
                                                            <p>
                                                                <strong>Correct Answer:</strong> {q.correctAnswer} |{" "}
                                                                <strong>Selected Answer:</strong> {q.selectedAnswer}
                                                            </p>
                                                            
                                                        </div>
                                                    </List.Item>
                                                )}
                                            />
                                        )}
                                    </Panel>
                                </Collapse>
                            </Card>
                        ))
                    )}
                </Panel>

                <Panel header="Study Plans" key="studyPlans">
                    {user.studyPlans &&
                        Object.entries(user.studyPlans).map(([topic, content], idx) => (
                            <Card key={idx} className="history-item">
                                <p>
                                    <strong>{topic}</strong>
                                </p>
                                <pre>{content}</pre>
                            </Card>
                        ))}
                </Panel>

                <Panel header="Roadmap" key="roadmap">
                    {user.roadmap &&
                        Object.entries(user.roadmap).map(([topic, content], idx) => (
                            <Card key={idx} className="history-item">
                                <p>
                                    <strong>{topic}</strong>
                                </p>
                                <pre>{content}</pre>
                            </Card>
                        ))}
                </Panel>

                <Panel header="Notifications" key="notifications">
                    {user.notifications.length === 0 ? (
                        <p>No notifications</p>
                    ) : (
                        user.notifications.map((note, idx) => (
                            <Card key={idx} className="history-item">
                                <p>{note.message}</p>
                                <p>
                                    <strong>Status:</strong> {note.read ? "Read" : "Unread"}
                                </p>
                                <p>
                                    <strong>Date:</strong> {new Date(note.date).toLocaleString()}
                                </p>
                            </Card>
                        ))
                    )}
                </Panel>

                <Panel header="Chat History" key="chat">
                    {user.chatHistory.length === 0 ? (
                        <p>No chat history</p>
                    ) : (
                        user.chatHistory.map((chat, idx) => (
                            <Card key={idx} className="history-item">
                                <p>
                                    <strong>Role:</strong> {chat.role}
                                </p>
                                <p>{chat.text}</p>
                                <p>
                                    <strong>Date:</strong> {new Date(chat.time).toLocaleString()}
                                </p>
                            </Card>
                        ))
                    )}
                </Panel>
            </Collapse>
        </div>
    );
};

export default UserDetails;
