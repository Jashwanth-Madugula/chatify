import React, { useContext } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import assets from "../assets/assets";
import { AuthContext } from "../context/AuthContext";

const Navbar = () => {
  const { authUser, logout, theme, toggleTheme } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border-main bg-header-bg/70 backdrop-blur-md transition-all duration-300">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 sm:px-8">
        
        {/* BRANDING LOGO */}
        <Link to="/" className="flex items-center gap-2.5">
          <img src={assets.logo} alt="logo" className="h-7 w-7 object-contain rounded" />
          <span className="text-lg font-bold bg-gradient-to-r from-blue-500 to-[#ff5d5d] bg-clip-text text-transparent tracking-wide">
            TripleS Chat
          </span>
        </Link>

        {/* CONTROLS */}
        <div className="flex items-center gap-4 text-text-main">
          
          {/* THEME TOGGLE BUTTON */}
          <button
            onClick={toggleTheme}
            title={`Switch to ${theme === "dark" ? "Light" : "Dark"} Mode`}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-input-bg hover:bg-input-bg/80 border border-border-main transition duration-200 cursor-pointer shadow-sm text-lg"
          >
            {theme === "dark" ? "☀️" : "🌙"}
          </button>

          {/* AUTHENTICATION CONTROLS */}
          {authUser ? (
            <div className="flex items-center gap-3.5">
              
              {/* PROFILE PILE */}
              <Link
                to="/profile"
                className={`flex items-center gap-2 p-1.5 rounded-full hover:bg-input-bg/70 border border-transparent hover:border-border-main transition duration-200 ${
                  location.pathname === "/profile" ? "bg-input-bg border-border-main" : ""
                }`}
                title="Edit Profile"
              >
                <img
                  src={authUser.profilePicture || assets.avatar_icon}
                  alt={authUser.fullName}
                  className="h-7 w-7 rounded-full object-cover border border-gray-500/50"
                />
                <span className="hidden sm:inline text-sm font-medium pr-1 text-text-main">
                  {authUser.fullName}
                </span>
              </Link>

              {/* LOGOUT BUTTON */}
              <button
                onClick={handleLogout}
                className="bg-[#ff5d5d] hover:bg-[#ff5d5d]/80 text-white text-xs font-semibold px-4 py-2 rounded-full cursor-pointer transition shadow-sm"
              >
                Logout
              </button>

            </div>
          ) : (
            // If on login, show status or link
            location.pathname !== "/login" && (
              <Link
                to="/login"
                className="bg-blue-500 hover:bg-blue-600 text-white text-xs font-semibold px-4 py-2 rounded-full cursor-pointer transition shadow-sm"
              >
                Login
              </Link>
            )
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
