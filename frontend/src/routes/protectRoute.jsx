// import React from "react";
// import { Navigate } from "react-router-dom";

// const ProtectedRoute = ({ children }) => {
//   const token = localStorage.getItem("token");
//   return token ? children : <Navigate to="/" />;
// };

// export default ProtectedRoute;



import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
 import axios from "axios";

const ProtectedRoute = ({ children }) => {
  const [isValid, setIsValid] = useState(null);

  useEffect(() => {
    const validateToken = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setIsValid(false);
        return;
      }

      try {
        const res = await  axios. post(
          "/api/v1/user/get_User_data",
          {},
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (res.data.success) {
          setIsValid(true);
        } else {
          localStorage.removeItem("token");
          setIsValid(false);
        }
      } catch (err) {
        console.error("Token validation failed:", err.message);
        localStorage.removeItem("token");
        setIsValid(false);
      }
    };

    validateToken();
  }, []);

  if (isValid === null) {
    return <div>Loading...</div>; 
  }

  return isValid ? children : <Navigate to="/" />;
};

export default ProtectedRoute;
