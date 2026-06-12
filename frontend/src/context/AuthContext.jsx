import { createContext, useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { connectSocket } from "../lib/socket";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [authUser, setAuthUser] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [socket, setSocket] = useState(null);

  // ======================
  // CHECK AUTH
  // ======================
  const checkAuth = async () => {
    try {
      const { data } = await axios.get(
        `${BACKEND_URL}/api/auth/check-auth`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (data.success) {
        setAuthUser(data.user);
        connectSocketHandler(data.user);
      }
    } catch (err) {
      logout();
    }
  };

  // ======================
  // SOCKET CONNECTION
  // ======================
  const connectSocketHandler = (userData) => {
    if (!userData) return;

    const newSocket = connectSocket(userData._id);

    newSocket.on("connect", () => {
      console.log("Socket connected:", newSocket.id);
    });

    newSocket.on("getOnlineUsers", (users) => {
      setOnlineUsers(users);
    });

    setSocket(newSocket);
  };

  // ======================
  // LOGIN / SIGNUP
  // ======================
 const login = async (type, credentials) => {
  try {
    const { data } = await axios.post(
      `${BACKEND_URL}/api/auth/${type}`,
      credentials
    );

    if (data.success) {
      setAuthUser(data.userData);
      setToken(data.token);

      localStorage.setItem("token", data.token);

      axios.defaults.headers.common[
        "Authorization"
      ] = `Bearer ${data.token}`;

      connectSocketHandler(data.userData);

      toast.success(`${type} successful!`);
    }
  } catch (err) {
    console.log(err.response?.data);
    toast.error("Authentication failed.");
  }
};

  // ======================
  // LOGOUT
  // ======================
  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setAuthUser(null);
    setOnlineUsers([]);
    socket?.disconnect();
    setSocket(null);

    delete axios.defaults.headers.common["Authorization"];

    toast.success("Logged out successfully!");
  };

  // ======================
  // UPDATE PROFILE
  // ======================
  const updateProfile = async (body) => {
    try {
      const { data } = await axios.put(
        `${BACKEND_URL}/api/auth/update-profile`,
        body,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (data.success) {
        setAuthUser(data.userData);
        toast.success("Profile updated!");
      }
    } catch (err) {
      toast.error("Profile update failed.");
    }
  };

  const [theme, setTheme] = useState(localStorage.getItem("theme") || "dark");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  // ======================
  // AUTO LOGIN
  // ======================
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common[
        "Authorization"
      ] = `Bearer ${token}`;
      checkAuth();
    }
  }, [token]);

  return (
    <AuthContext.Provider
      value={{
        authUser,
        onlineUsers,
        socket,
        login,
        logout,
        updateProfile,
        theme,
        toggleTheme,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
