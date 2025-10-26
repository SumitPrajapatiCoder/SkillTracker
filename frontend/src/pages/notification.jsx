import React, { useState, useEffect } from "react";
 import axios from "axios";
import "../styles/notification.css";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

const MySwal = withReactContent(Swal);

function Notification() {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    
    const fetchNotifications = async () => {
        try {
            const token = localStorage.getItem("token");
            const response = await  axios. get("/api/v1/user/notifications", {
                headers: { Authorization: `Bearer ${token}` },
            });
            setNotifications(response.data.notifications || []);
        } catch (error) {
            console.error("Error fetching notifications:", error);
            toast.error("Failed to load notifications");
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async (id) => {
        try {
            const token = localStorage.getItem("token");
            await  axios. post(
                "/api/v1/user/notifications/read",
                { notificationId: id },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success("Notification marked as read");
            setNotifications((prev) =>
                prev.map((n) => (n._id === id ? { ...n, read: true } : n))
            );
        } catch (error) {
            console.error("Error marking as read:", error);
            toast.error("Failed to mark notification as read");
        }
    };


    const deleteNotification = async (id) => {
        try {
            const token = localStorage.getItem("token");
            await  axios. delete(`/api/v1/user/notifications/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            toast.success("Notification deleted");
            setNotifications((prev) => prev.filter((n) => n._id !== id));
            
        } catch (error) {
            console.error("Error deleting notification:", error);
            toast.error("Failed to delete notification");
        }
    };

    const deleteAllNotifications = async () => {
        const result = await MySwal.fire({
            title: "Are you sure?",
            text: "Do you really want to clear all notifications?",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#d33",
            cancelButtonColor: "#3085d6",
            confirmButtonText: "Yes, clear all!",
        });

        if (!result.isConfirmed) return;
        try {
            const token = localStorage.getItem("token");
            await  axios. delete("/api/v1/user/notification/all", {
                headers: { Authorization: `Bearer ${token}` },
            });
            setNotifications([]);
            toast.success("All notifications deleted");
            MySwal.fire("Cleared!", "All notifications have been removed.", "success");
        } catch (error) {
            console.error("Error deleting all notifications:", error);
            toast.error("Failed to delete all notifications");
        }
    };


    useEffect(() => {
        fetchNotifications();
    }, []);

    if (loading) return <div className="notification-loading">Loading...</div>;

    return (
        <div className="notification-container">
            <div className="notification-header">
                <h2 className="notification-title"> Notifications</h2>
                {notifications.length > 0 && (
                    <button className="delete-all-btn" onClick={deleteAllNotifications}>
                        Delete All
                    </button>
                )}
            </div>

            {notifications.length === 0 ? (
                <p className="no-notifications">No notifications yet.</p>
            ) : (
                <ul className="notification-list">
                    {notifications.map((n) => (
                        <li
                            key={n._id}
                            className={`notification-item ${n.read ? "read" : "unread"}`}
                        >
                            <div className="notification-content">
                                <p className="notification-message">{n.message}</p>
                                <p className="notification-date">
                                    {new Date(n.date).toLocaleString()}
                                </p>
                            </div>

                            <div className="notification-actions">
                                {!n.read && (
                                    <button
                                        className="mark-read-btn"
                                        onClick={() => markAsRead(n._id)}
                                    >
                                        Mark as Read
                                    </button>
                                )}
                                <button
                                    className="delete-btn"
                                    onClick={() => deleteNotification(n._id)}
                                >
                                     Delete
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

export default Notification;
