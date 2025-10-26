import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
 import api from "../api";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "../styles/login.css";

const Login = () => {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  // const handleSubmit = async (e) => {
  //   e.preventDefault();
  //   try {
  //     const res = await  api.post("/user/login", {
  //       identifier,
  //       password,
  //     });
  //     if (res.data.success) {
  //       localStorage.setItem("token", res.data.token);
  //       toast.success("Login Done Successfully!");
  //       navigate("/home");
  //     } else {
  //       toast.error(res.data.message);
  //     }
  //   } catch (error) {
  //     toast.error("Login Failed: " + error.message);
  //   }
  // };


  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      console.log("API Base URL:", import.meta.env.VITE_API_URL); // Log base URL
      console.log("Login payload:", { identifier, password }); // Log payload

      const res = await api.post("/user/login", { identifier, password });

      console.log("Response from server:", res);

      if (res.data.success) {
        localStorage.setItem("token", res.data.token);
        toast.success("Login Done Successfully!");
        navigate("/home");
      } else {
        console.error("Login failed:", res.data.message);
        toast.error(res.data.message);
      }
    } catch (error) {
      console.error("Login request error:", error);
      if (error.response) {
        console.error("Status:", error.response.status);
        console.error("Data:", error.response.data);
      }
      toast.error("Login Failed: " + error.message);
    }
  };


  return (
    <div className="form-container">
      <form onSubmit={handleSubmit} className="login-form">
        <h2>Login</h2>
        <input
          type="text"
          placeholder="Email or Username"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit">Login</button>
        <Link to="/register" className="m-4">
          Don't have an account? Register here
        </Link>
      </form>
    </div>
  );
};

export default Login;
