// import React, { useState } from "react";
// import { useNavigate ,Link} from "react-router-dom";
//  import api from "../api";
// import { toast } from "react-toastify";
// import "react-toastify/dist/ReactToastify.css";
// import "../styles/register.css";

// const Register = () => {
//   const [form, setForm] = useState({ name: "", email: "", password: "" });
//   const navigate = useNavigate();

//   const handleChange = (e) => {
//     setForm({ ...form, [e.target.name]: e.target.value });
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     try {
//       const res = await  api.post("/user/register", form);
//       if (res.data.success) {
//         toast.success("Registration Successful!");
//         navigate("/");
//       } else {
//         toast.error(res.data.message);
//       }
//     } catch (error) {
//       toast.error("Registration Failed" + error);
//     }
//   };

//   return (
//     <div className="form-container">
//       <form onSubmit={handleSubmit} className="register-form">
//         <h2>Register</h2>
//         <input
//           name="name"
//           type="text"
//           placeholder="Name"
//           value={form.name}
//           onChange={handleChange}
//           required
//         />
//         <input
//           name="email"
//           type="email"
//           placeholder="Email"
//           value={form.email}
//           onChange={handleChange}
//           required
//         />
//         <input
//           name="password"
//           type="password"
//           placeholder="Password"
//           value={form.password}
//           onChange={handleChange}
//           required
//         />
//         <button type="submit">Register</button>
//         <Link to="/" className="m-4 ">
//           Already have an account? Login here
//         </Link>
//       </form>
//     </div>
//   );
// };

// export default Register;


















import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "../styles/register.css";

const Register = () => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (loading) return; // 🔒 prevent double click

    setLoading(true);
    try {
      const res = await axios.post("/api/v1/user/register", form);

      if (res.data.success) {
        toast.success("Registration Successful");
        navigate("/");
      } else {
        toast.error(res.data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Registration Failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-container">
      <form onSubmit={handleSubmit} className="register-form">
        <h2>Register</h2>

        <input
          type="text"
          name="name"
          placeholder="Name"
          value={form.name}
          onChange={handleChange}
          required
        />

        <input
          type="email"
          name="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
          required
        />

        <input
          type="password"
          name="password"
          placeholder="Password"
          value={form.password}
          onChange={handleChange}
          required
        />

        <button type="submit" disabled={loading}>
          {loading ? "Registering..." : "Register"}
        </button>

        <Link to="/" className="m-4">
          Already have an account? Login here
        </Link>
      </form>
    </div>
  );
};

export default Register;
