import React, { useEffect, useState } from "react";
 import axios from "axios";
import { toast } from "react-toastify";
import "../../styles/uploadCardDetails.css";

const UploadCardDetails = () => {
  const [languages, setLanguages] = useState([]);
  const [formData, setFormData] = useState({
    type: "quiz",
    name: "",
    questions: "",
    time: "",
  });

  const fetchLanguages = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await  axios. get("/api/v1/admin/get-languages", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success) {
        setLanguages(res.data.data || []);
      }
    } catch (err) {
      console.error(
        "Fetch Languages Error:",
        err.response?.data || err.message
      );
      toast.error("Failed to load languages");
    }
  };

  useEffect(() => {
    fetchLanguages();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      await  axios. post("/api/v1/admin/add-card", formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Card uploaded successfully!");
      setFormData({
        type: "quiz",
        name: "",
        questions: "",
        time: "",
      });
    } catch (err) {
      console.error("Upload Error:", err.response?.data || err.message);
      toast.error("Failed to upload card details");
    }
  };

  return (
    <div className="upload-card-wrapper">
      <h2>Upload {formData.type === "quiz" ? "Quiz" : "Mock"} Card Details</h2>

      <form onSubmit={handleSubmit} className="upload-card-form">
        <select
          value={formData.type}
          onChange={(e) => setFormData({ ...formData, type: e.target.value })}
          required
        >
          <option value="quiz">Quiz</option>
          <option value="mock">Mock</option>
        </select>
        <select
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        >
          <option value="">-- Select Language --</option>
          {languages.map((lang) => (
            <option key={lang._id} value={lang.name}>
              {lang.name}
            </option>
          ))}
        </select>

        <input
          type="number"
          min="1"
          placeholder="No. of Questions"
          value={formData.questions}
          onChange={(e) =>
            setFormData({ ...formData, questions: Number(e.target.value) })
          }
          required
        />

        <input
          type="number"
          min="1"
          placeholder="Time (in minutes)"
          value={formData.time}
          onChange={(e) =>
            setFormData({ ...formData, time: Number(e.target.value) })
          }
          required
        />

        <button type="submit">Upload</button>
      </form>
    </div>
  );
};

export default UploadCardDetails;
