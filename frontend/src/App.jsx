import { Routes, Route, Navigate } from "react-router-dom"
import HomePage from "./pages/HomePage"
import LoginPage from "./pages/LoginPage"
import ProfilePage from "./pages/ProfilePage"
import Navbar from "./components/Navbar"
import { Toaster } from "react-hot-toast"
import { useContext } from "react"
import { AuthContext } from "./context/AuthContext"

const App = () => {
  const { authUser } = useContext(AuthContext);
  return (
    <div className="h-screen flex flex-col bg-app-bg text-text-main overflow-hidden">
      <Navbar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Toaster />
        <Routes>
          <Route path="/" element={authUser ? <HomePage /> : <Navigate to="/login" />} />
          <Route path="/login" element={authUser ? <Navigate to="/" /> : <LoginPage />} />
          <Route path="/profile" element={authUser ? <ProfilePage /> : <Navigate to="/login" />} />
        </Routes>
      </div>
    </div>
  )
}

export default App
