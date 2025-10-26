import React, { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import "../styles/header.css";
 import axios from "axios";
import { FaBars, FaTimes, FaChevronDown, FaChevronUp, FaBell } from "react-icons/fa";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import defaultAvatar from "../assets/default-avatar.png";


const Header = () => {
  const [user, setUser] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showAdminMenu, setShowAdminMenu] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 1024);
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();

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

  const fetchNotificationCount = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await  axios. get("/api/v1/user/notifications", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const notifications = res.data.notifications || [];
      const unread = notifications.filter((n) => !n.read).length;
      setUnreadCount(unread);
    } catch (err) {
      console.error("Error fetching notifications:", err);
    }
  };

  useEffect(() => {
    fetchNotificationCount();
    const interval = setInterval(fetchNotificationCount, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 1024);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    toast.success("Logout Successful!");
    navigate("/");
  };

  const handleLinkClick = () => {
    setShowDropdown(false);
    setShowAdminMenu(false);
  };

  const isActive = (path) => location.pathname === path;

  const MenuLinks = () => (
    <>
      {user?.isAdmin && (
        <div className="admin-dropdown">
          <div
            className="admin-toggle"
            onClick={() => setShowAdminMenu(!showAdminMenu)}
          >
            Admin Panel {showAdminMenu ? <FaChevronUp /> : <FaChevronDown />}
          </div>
          {showAdminMenu && (
            <div className="admin-menu">
              <Link
                to="/upload"
                onClick={handleLinkClick}
                className={isActive("/upload") ? "active-link" : ""}
              >
                Upload Question
              </Link>
              <Link
                to="/allQuestion"
                onClick={handleLinkClick}
                className={isActive("/allQuestion") ? "active-link" : ""}
              >
                All Questions
              </Link>
              <Link
                to="/upload-card"
                onClick={handleLinkClick}
                className={isActive("/upload-card") ? "active-link" : ""}
              >
                Upload Card Details
              </Link>
              <Link
                to="/get-card"
                onClick={handleLinkClick}
                className={isActive("/get-card") ? "active-link" : ""}
              >
                List Card Details
              </Link>
              <Link
                to="/upload-contest"
                onClick={handleLinkClick}
                className={isActive("/upload-contest") ? "active-link" : ""}
              >
                Upload Contest
              </Link>
              <Link
                to="/view-contest"
                onClick={handleLinkClick}
                className={isActive("/view-contest") ? "active-link" : ""}
              >
                List Contest Details
              </Link>
              <Link
                to="/userList"
                onClick={handleLinkClick}
                className={isActive("/userList") ? "active-link" : ""}
              >
                User List
              </Link>
            </div>
          )}
        </div>
      )}

      <Link
        to="/home"
        onClick={handleLinkClick}
        className={isActive("/home") ? "active-link" : ""}
      >
        Home
      </Link>

      <Link
        to="/profile"
        onClick={handleLinkClick}
        className={isActive("/profile") ? "active-link" : ""}
      >
        Profile
      </Link>

      <Link
        to="/contestList"
        onClick={handleLinkClick}
        className={isActive("/contestList") ? "active-link" : ""}
      >
        Contest
      </Link>

      <Link
        to="/quiz"
        onClick={handleLinkClick}
        className={isActive("/quiz") ? "active-link" : ""}
      >
        Quiz
      </Link>

      <Link
        to="/mock_test"
        onClick={handleLinkClick}
        className={isActive("/mock_test") ? "active-link" : ""}
      >
        Mock Test
      </Link>

      <Link
        to="/roadmap"
        onClick={handleLinkClick}
        className={isActive("/roadmap") ? "active-link" : ""}
      >
        Roadmap
      </Link>

      <Link
        to="/study_plane"
        onClick={handleLinkClick}
        className={isActive("/study_plane") ? "active-link" : ""}
      >
        Study Plan
      </Link>

      <Link
        to="/chatbot_page"
        onClick={handleLinkClick}
        className={isActive("/chatbot_page") ? "active-link" : ""}
      >
        Chatbot
      </Link>

      <Link
        to="/notification"
        onClick={handleLinkClick}
        className={`notification-link ${isActive("/notification") ? "active-link" : ""
          }`}
      >
        <FaBell className="notification-icon" />
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount}</span>
        )}
      </Link>

      {user && (
        <button
          className="logout-button"
          onClick={() => {
            handleLogout();
            handleLinkClick();
          }}
        >
          Logout
        </button>
      )}
    </>
  );

  return (
    <header className="navbar">
      <div className="left">
        {!isMobile && (
          <Link to="/home" className="brand-link">
            <span className="brand-text">SkillTracker</span>
          </Link>
        )}
        {isMobile && (
          <div
            className="dropdown-icon"
            onClick={() => setShowDropdown(!showDropdown)}
          >
            {showDropdown ? <FaTimes /> : <FaBars />}
          </div>
        )}
      </div>

      <div className="center">
        {isMobile && (
          <Link to="/home" className="brand-link">
            <span className="brand-text">SkillTracker</span>
          </Link>
        )}
        {!isMobile && <nav className="menu">{MenuLinks()}</nav>}
      </div>

      <div className="right">
        {user && (
          <>
            {user.profileImage ? (
              <img src={user.profileImage} alt="Profile" className="profile-img-small" />
            ) : (
                <img
                  src={user.profileImage || defaultAvatar}
                  alt="Profile"
                  className="profile-img-small"
                />

            )}
            <span className="username">{user.name}</span>
          </>
        )}
      </div>



      {isMobile && showDropdown && (
        <nav className="menu mobile-menu">{MenuLinks()}</nav>
      )}
    </header>
  );
};

export default Header;
