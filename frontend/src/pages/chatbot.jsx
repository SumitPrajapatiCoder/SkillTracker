import React, { useState, useEffect, useRef } from "react";
 import axios from "axios";
import hljs from "highlight.js";
import "highlight.js/styles/github-dark.css";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import "../styles/chatbot.css";

import {
  FaPaperPlane,
  FaVolumeUp,
  FaToggleOn,
  FaToggleOff,
  FaTrash,
  FaMicrophone,
} from "react-icons/fa";

const MySwal = withReactContent(Swal);

function Chatbot() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [user, setUser] = useState({ username: "User" });
  const [activeSoundIdx, setActiveSoundIdx] = useState(null);
  const [listening, setListening] = useState(false);

  const chatEndRef = useRef(null);
  const speakingRef = useRef(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await  axios. post(
          `/api/v1/user/get_User_data`,
          {},
          { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
        );
        const data = res.data.data;
        setUser({
          username: data.username || data.name || "User",
          isAdmin: data.isAdmin || false,
        });
      } catch (err) {
        console.error("Error fetching user:", err.message);
        setUser({ username: "User" });
      }
    };

    const fetchHistory = async () => {
      try {
        const res = await  axios. get("/api/v1/user/chat-history", {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        if (res.data.success) setMessages(res.data.chatHistory);
      } catch (err) {
        console.error("Error fetching chat history:", err.message);
      }
    };

    fetchUser();
    fetchHistory();
  }, []);

  useEffect(() => {
    document.querySelectorAll("pre code").forEach((block) => {
      hljs.highlightElement(block);
    });
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const saved = localStorage.getItem("darkMode");
    if (saved === "on") setDarkMode(true);
  }, []);

  useEffect(() => {
    if (!("SpeechRecognition" in window || "webkitSpeechRecognition" in window)) return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setListening(true);

    recognition.onresult = (event) => {
      let transcript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      setInput(transcript);
    };

    recognition.onend = () => setListening(false);

    recognition.onerror = (event) => {
      if (event.error === "no-speech") toast.info("No speech detected. Please try again.");
      else if (event.error === "audio-capture") toast.error("Microphone not detected.");
      else if (event.error === "not-allowed") toast.error("Microphone access denied.");
      else toast.error("Speech recognition error: " + event.error);
      setListening(false);
    };

    recognitionRef.current = recognition;
  }, []);

  const handleSend = async () => {
    if (!input.trim()) return;

    const newMessage = { role: "user", text: input, time: new Date() };
    setMessages((prev) => [...prev, newMessage]);
    setInput("");
    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      const res = await  axios. post(
        "/api/v1/user/chatbot",
        { messages: [{ text: input }] },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const botMessage = res.data.success
        ? { role: "bot", text: res.data.response, time: new Date(res.data.timestamp) }
        : { role: "bot", text: "Error: " + res.data.message, time: new Date() };

      setMessages((prev) => [...prev, botMessage]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "bot",
          text: "Server error. " + (err.response?.data?.message || "Please try again."),
          time: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault(); 
      handleSend();
    }
  };


  const toggleDarkMode = () => {
    setDarkMode((prev) => {
      const newMode = !prev;
      localStorage.setItem("darkMode", newMode ? "on" : "off");
      return newMode;
    });
  };

  const handleMicClick = () => {
    if (!recognitionRef.current) {
      toast.error("Speech Recognition not supported in this browser.");
      return;
    }

    try {
      if (listening) recognitionRef.current.stop();
      else {
        recognitionRef.current.abort();
        setInput("");
        recognitionRef.current.start();
      }
    } catch (err) {
      console.error("Speech recognition start error:", err);
      toast.error("Failed to start microphone. Try again.");
    }
  };

  const handleClearChat = async () => {
    const result = await MySwal.fire({
      title: "Are you sure?",
      text: "Do you really want to clear all messages?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, clear it!",
    });

    if (!result.isConfirmed) return;

    try {
      const res = await  axios. delete("/api/v1/user/clear-chat-history", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (res.data.success) {
        setMessages([]);
        toast.success("Chat deleted successfully!");
        MySwal.fire("Cleared!", "Your chat history has been removed.", "success");
      }
    } catch (err) {
      toast.error("Error clearing chat: " + (err.response?.data?.message || err.message));
      console.error("Error clearing chat:", err.message);
    }
  };
  
  const handleBubbleClick = (msg, idx) => {
    if (speakingRef.current !== null) speechSynthesis.cancel();

    if (activeSoundIdx === idx) {
      speakingRef.current = null;
      setActiveSoundIdx(null);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(msg.text);
    utterance.onend = () => {
      speakingRef.current = null;
      setActiveSoundIdx(null);
    };

    speechSynthesis.speak(utterance);
    speakingRef.current = idx;
    setActiveSoundIdx(idx);
  };

  return (
    <div className={`chatbot-container ${darkMode ? "dark-mode" : ""}`}>
      <div className="chat-header">
        <span>Hello, {user?.username}</span>
        <div>
          <button onClick={toggleDarkMode} className="btn-toggle">
            {darkMode ? <FaToggleOn /> : <FaToggleOff />}
          </button>
          <button onClick={handleClearChat} className="btn-clear">
            <FaTrash /> Clear Chat
          </button>
        </div>
      </div>

      <div className="chat-window">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`chat-bubble ${msg.role === "user" ? "from-user" : "from-bot"} ${activeSoundIdx === idx ? "active-sound" : ""}`}
            onClick={() => handleBubbleClick(msg, idx)}
          >
            <strong>{msg.role === "user" ? user?.username || "You" : "Gemini"}</strong>
            <div
              className="bubble-content"
              dangerouslySetInnerHTML={{
                __html: msg.text.replace(/```([\s\S]*?)```/g, (match, p1) => `<pre><code>${p1}</code></pre>`),
              }}
            />
            {activeSoundIdx === idx && (
              <span className="volume-icon">
                <FaVolumeUp />
              </span>
            )}
            <small>
              {msg.time ? new Date(msg.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}
            </small>
          </div>
        ))}
        {loading && <div className="chat-bubble from-bot">Typing...</div>}
        <div ref={chatEndRef}></div>
      </div>

      <div className="input-row">
        <button onClick={handleMicClick} className="btn-mic">
          <FaMicrophone color={listening ? "red" : "black"} />
        </button>
        <input
          id="promptInput"
          type="text"
          placeholder="Type your message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={loading}
        />
        <button onClick={handleSend} disabled={loading} className="btn-send">
          <FaPaperPlane />
        </button>
      </div>
    </div>
  );
}

export default Chatbot;
