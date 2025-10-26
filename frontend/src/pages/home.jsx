import React from "react";
import { Link } from "react-router-dom";
import "../styles/home.css";

const Home = () => {
  return (
    <div className="home-container">
      <div className="page-content">
        <h1 className="home-title">Welcome to SkillTracker</h1>
        <p className="home-description">
          Your personal platform to{" "}
          <strong>learn, test, and grow your skills</strong> in a structured and
          rewarding way. Whether you're preparing for interviews, improving
          programming knowledge, or tracking your learning journey —
          SkillTracker has you covered.
        </p>

        <div className="features-grid">
          <Link to="/profile">
            <div className="feature-card">
              <h3>Profile & Skill Growth</h3>
              <p>
                Create your personal profile to track your skill development over
                time. View your quiz history, scores, and earned certificates all
                in one place.
                
               </p>
            </div>
          </Link>

          <Link to="/quiz">
            <div className="feature-card">
              <h3>Quizzes</h3>
              <p>
                Take language-based quizzes to test your knowledge. After each
                quiz, get a personalized AI-generated{" "}
                <strong>Study Plan</strong> and <strong>Roadmap</strong>.
              </p>
            </div>
          </Link>

          <Link to="/mock_test">
            <div className="feature-card">
              <h3>Mock Tests</h3>
              <p>
                Challenge yourself with real exam-style mock tests. Score full
                marks to earn an exclusive <strong>Certificate</strong> for your
                profile.
              </p>
            </div>
          </Link>

          <Link to="/study_plane">
            <div className="feature-card">
              <h3>AI-Generated Study Plan</h3>
              <p>
                Every time you finish a quiz, our AI creates a tailored
                step-by-step study plan to help you improve on weak areas.
              </p>
            </div>
          </Link>

          <Link to="/roadmap">
            <div className="feature-card">
              <h3>AI-Generated Roadmap</h3>
              <p>
                Get a clear, topic-wise roadmap for mastering the language you
                are learning — generated instantly after each quiz.
              </p>
            </div>
          </Link>

          <Link to="/chatbot_page">
            <div className="feature-card">
              <h3>Chat Bot</h3>
              <p>
                Get instant answers to your questions, personalized study tips,
                and guidance throughout your learning journey.
              </p>
            </div>
          </Link>
        </div>

        <p className="cta-text">
          Start your journey today. Take your first quiz, get your AI-powered
          study plan, and track your progress like never before!
        </p>
      </div>
    </div>
  );
};

export default Home;
