import React, { useContext, useState } from "react";
import assets from "../assets/assets";
import { AuthContext } from "../context/AuthContext";

const LoginPage = () => {
  const { login } = useContext(AuthContext);

  const [currState, setCurrState] = useState("login");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [bio, setBio] = useState("");

  const onSubmitHandler = async (e) => {
    e.preventDefault();

    if (currState === "signup") {
      await login("signup", { email, fullName, password, bio });
    } else {
      await login("login", { email, password });
    }
  };

  return (
    <div className="w-full h-full overflow-y-auto bg-app-bg text-text-main p-4 sm:p-6 flex flex-col items-center">
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 rounded-3xl overflow-hidden border border-border-main bg-panel-bg shadow-2xl min-h-[500px] my-auto">
        
        {/* LEFT BRANDING PANEL */}
        <div className="hidden md:flex flex-col items-center justify-center p-12 bg-gradient-to-br from-blue-500/10 to-[#ff5d5d]/10 dark:from-blue-500/5 dark:to-transparent text-center relative border-r border-border-main/30">
          <div className="absolute top-8 left-8 flex items-center gap-2">
            <img src={assets.logo} alt="logo" className="w-6 h-6 object-contain" />
            <span className="text-sm font-bold text-text-main tracking-wider">TripleS Chat</span>
          </div>
          
          <img
            src={assets.logo}
            alt="TripleS Logo"
            className="w-36 h-36 object-contain mb-6 hover:scale-105 transition duration-300"
          />
          <h1 className="text-3xl font-extrabold bg-gradient-to-r from-blue-500 to-[#ff5d5d] bg-clip-text text-transparent mb-3">
            TripleS Chat
          </h1>
          <p className="text-sm text-text-main/70 max-w-sm leading-relaxed">
            Connect instantly with friends, share media, and hold group conversations in a clean, secure, and lightning-fast environment.
          </p>
        </div>

        {/* RIGHT FORM PANEL */}
        <div className="flex flex-col justify-center p-8 sm:p-12 bg-panel-bg">
          <form onSubmit={onSubmitHandler} className="flex flex-col gap-5 w-full max-w-sm mx-auto">
            
            {/* Mobile Branding Header */}
            <div className="md:hidden flex flex-col items-center gap-2 mb-2">
              <img src={assets.logo} alt="logo" className="w-14 h-14 object-contain" />
              <h2 className="text-xl font-bold bg-gradient-to-r from-blue-500 to-[#ff5d5d] bg-clip-text text-transparent">
                TripleS Chat
              </h2>
            </div>

            <div className="text-center md:text-left">
              <h3 className="text-2xl font-bold text-text-main">
                {currState === "signup" ? "Create Account" : "Welcome Back"}
              </h3>
              <p className="text-xs text-text-main/60 mt-1">
                {currState === "signup" ? "Get started with your free account today" : "Please sign in to continue to your chats"}
              </p>
            </div>

            {currState === "signup" && (
              <>
                <input
                  type="text"
                  placeholder="Full Name"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="bg-input-bg text-text-main placeholder-text-main/50 text-sm p-3.5 rounded-xl outline-none border border-border-main/30 focus:border-blue-500 transition"
                />

                <textarea
                  placeholder="Short Bio"
                  required
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={3}
                  className="bg-input-bg text-text-main placeholder-text-main/50 text-sm p-3.5 rounded-xl outline-none border border-border-main/30 focus:border-blue-500 transition resize-none"
                />
              </>
            )}

            <input
              type="email"
              placeholder="Email Address"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-input-bg text-text-main placeholder-text-main/50 text-sm p-3.5 rounded-xl outline-none border border-border-main/30 focus:border-blue-500 transition"
            />

            <input
              type="password"
              placeholder="Password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-input-bg text-text-main placeholder-text-main/50 text-sm p-3.5 rounded-xl outline-none border border-border-main/30 focus:border-blue-500 transition"
            />

            <button
              type="submit"
              className="bg-[#ff5d5d] hover:bg-[#ff5d5d]/85 text-white py-3.5 rounded-xl font-semibold transition cursor-pointer shadow-md mt-2"
            >
              {currState === "signup" ? "Sign Up" : "Sign In"}
            </button>

            {/* SWITCH STATE */}
            <p className="text-sm text-center text-text-main/70 mt-2">
              {currState === "signup" ? (
                <>
                  Already have an account?{" "}
                  <span
                    className="text-[#ff5d5d] cursor-pointer font-bold hover:underline"
                    onClick={() => setCurrState("login")}
                  >
                    Sign In
                  </span>
                </>
              ) : (
                <>
                  Don’t have an account?{" "}
                  <span
                    className="text-[#ff5d5d] cursor-pointer font-bold hover:underline"
                    onClick={() => setCurrState("signup")}
                  >
                    Create Account
                  </span>
                </>
              )}
            </p>
          </form>
        </div>

      </div>
    </div>
  );
};

export default LoginPage;
