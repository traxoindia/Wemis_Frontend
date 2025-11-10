// import React, { createContext, useEffect, useState } from "react";
// import axios from "axios";
// import { toast } from "react-toastify";
// import { useNavigate } from "react-router-dom";

// const UserAppContext = createContext();

// const UserAppProvider = ({ children }) => {
//     const navigate = useNavigate();
//     const [token, setToken] = useState(localStorage.getItem("token") || "");
//     const [user, setUser] = useState(() => {
//         const storedUser = localStorage.getItem("user");
//         return storedUser ? JSON.parse(storedUser) : null;
//     });

//     const apiUrl = import.meta.env.VITE_BACKEND_URL;

//     // Fetch user profile from backend
//     const fetchUserProfile = async (authToken) => {
//         try {
//             const response = await axios.post(
//                 `${apiUrl}/superadmin/profile`,
//                 {},
//                 {
//                     headers: { Authorization: `Bearer ${authToken}` },
//                 }
//             );

//             if (response.data.user) {
//                 setUser(response.data.user);
//                 localStorage.setItem("user", JSON.stringify(response.data.user));
//                 console.log("Fetched Profile:", response.data.user);
//             } else {
//                 throw new Error("Invalid response data");
//             }
//         } catch (err) {
//             console.error("Error fetching profile:", err.message);
//             logout();
//         }
//     };

//     // Auto-fetch profile if token exists
//     useEffect(() => {
//         if (token) {
//             fetchUserProfile(token);
//         }
//     }, [token]);

//     // Handle login
//     const login = (authToken, userData) => {
//         if (!authToken) {
//             console.error("No token received");
//             toast.error("Login failed: No token received");
//             navigate('/')
//             return;
//         }
//         localStorage.setItem("token", authToken);
//         localStorage.setItem("user", JSON.stringify(userData));
//         setToken(authToken);
//         setUser(userData);
//         toast.success("Login Successful");
//     };

//     // Handle logout
//     const logout = () => {
//         setUser(null);
//         setToken("");
//         localStorage.removeItem("token");
//         localStorage.removeItem("user");
//         toast.success("Logout Successful");
//         navigate("/")
//     };

//     return (
//         <UserAppContext.Provider value={{ user, token, login, logout, setUser }}>
//             {children}
//         </UserAppContext.Provider>
//     );
// };

// export { UserAppContext };
// export default UserAppProvider;



import React, { createContext, useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

const UserAppContext = createContext();

const UserAppProvider = ({ children }) => {
  const navigate = useNavigate();
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem("user");
    return storedUser ? JSON.parse(storedUser) : null;
  });

  const apiUrl =  "https://api.websave.in/api";

  // Fetch user profile
  const fetchUserProfile = async (authToken) => {
    try {
      const response = await axios.post(
        `${apiUrl}/superadmin/profile`,
        {},
        { headers: { Authorization: `Bearer ${authToken}` } }
      );

      if (response.data.user) {
        setUser(response.data.user);
        localStorage.setItem("user", JSON.stringify(response.data.user));
        console.log("Fetched Profile:", response.data.user);
      } else {
        throw new Error("Invalid profile response");
      }
    } catch (err) {
      console.error("Profile fetch failed:", err.message);
      logout();
    }
  };

  useEffect(() => {
    if (token) fetchUserProfile(token);
  }, [token]);

  // Login Handler
  const login = (authToken, userData) => {
    if (!authToken) {
      toast.error("Login failed: No token");
      navigate("/");
      return;
    }
    localStorage.setItem("token", authToken);
    localStorage.setItem("user", JSON.stringify(userData));
    setToken(authToken);
    setUser(userData);
    // toast.success("Login Successful");
  };

  const logout = () => {
    setUser(null);
    setToken("");
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    toast.success("Logout Successful");
    navigate("/");
  };

  return (
    <UserAppContext.Provider value={{ user, token, login, logout, setUser }}>
      {children}
    </UserAppContext.Provider>
  );
};

export { UserAppContext };
export default UserAppProvider;
