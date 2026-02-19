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
      await login("signup", { fullName, email, password, bio });
    } else {
      await login("login", { email, password });
    }
  };

  return (
    <div className="min-h-screen bg-cover bg-center flex items-center justify-center gap-8 sm:justify-evenly max-sm:flex-col backdrop-blur-2xl">
      
      {/* LEFT LOGO */}
      <img
        src={assets.logo_big}
        alt="logo"
        className="w-[min(30vw,250px)]"
      />

      {/* FORM */}
      <form
        onSubmit={onSubmitHandler}
        className="border bg-white/10 text-white border-gray-500 p-6 
        flex flex-col gap-5 rounded-lg shadow-lg w-[320px]"
      >
        <h2 className="font-medium text-2xl text-center">
          {currState === "signup" ? "Create Account" : "Login"}
        </h2>

        {currState === "signup" && (
          <>
            <input
              type="text"
              placeholder="Full Name"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="bg-[#282142]/60 text-sm p-3 rounded-lg outline-none"
            />

            <textarea
              placeholder="Short Bio"
              required
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              className="bg-[#282142]/60 text-sm p-3 rounded-lg outline-none"
            />
          </>
        )}

        <input
          type="email"
          placeholder="Email Address"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="bg-[#282142]/60 text-sm p-3 rounded-lg outline-none"
        />

        <input
          type="password"
          placeholder="Password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="bg-[#282142]/60 text-sm p-3 rounded-lg outline-none"
        />

        <button
          type="submit"
          className="bg-[#ff5d5d] hover:bg-[#ff5d5d]/80 py-3 rounded-lg font-medium"
        >
          {currState === "signup" ? "Sign Up" : "Login"}
        </button>

        {/* SWITCH MODE */}
        <p className="text-sm text-center">
          {currState === "signup" ? (
            <>
              Already have an account?{" "}
              <span
                className="text-[#ff5d5d] cursor-pointer"
                onClick={() => setCurrState("login")}
              >
                Login
              </span>
            </>
          ) : (
            <>
              Don’t have an account?{" "}
              <span
                className="text-[#ff5d5d] cursor-pointer"
                onClick={() => setCurrState("signup")}
              >
                Sign Up
              </span>
            </>
          )}
        </p>
      </form>
    </div>
  );
};

export default LoginPage;
