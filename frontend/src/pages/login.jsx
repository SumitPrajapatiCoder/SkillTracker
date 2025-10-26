import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
 import axios from "axios";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "../styles/login.css";

const Login = () => {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await  axios. post("/api/v1/user/login", {
        identifier,
        password,
      });
      if (res.data.success) {
        localStorage.setItem("token", res.data.token);
        toast.success("Login Done Successfully!");
        navigate("/home");
      } else {
        toast.error(res.data.message);
      }
    } catch (error) {
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
