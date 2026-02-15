import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import assets from '../assets/assets'

const ProfilePage = () => {

  const navigate = useNavigate()

  const [selectedImage, setSelectedImage] = useState(null)
  const [name, setName] = useState("Abcdefg")
  const [bio, setBio] = useState("Tell about yourself in short")

  const onSubmitHandler = (e) => {
    e.preventDefault()
    navigate("/")
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-cover bg-no-repeat">

      {/* Main Card */}
      <div className="w-[90%] max-w-4xl bg-black/40 backdrop-blur-xl
        border border-gray-600/40 rounded-2xl grid grid-cols-1 md:grid-cols-2
        overflow-hidden"
      >

        {/* LEFT SIDE – FORM */}
        <div className="p-10 flex flex-col gap-6">

          <h2 className="text-xl font-semibold text-white">
            Profile Information
          </h2>

          {/* Avatar Upload */}
          <label htmlFor="avatar" className="flex items-center gap-4 cursor-pointer">
            <input
              type="file"
              id="avatar"
              accept=".png,.jpg,.jpeg"
              hidden
              onChange={(e) => setSelectedImage(e.target.files[0])}
            />

            <img
              src={
                selectedImage
                  ? URL.createObjectURL(selectedImage)
                  : assets.avatar_icon
              }
              alt="avatar"
              className="w-14 h-14 rounded-full object-cover border border-gray-500"
            />

            <span className="text-sm text-gray-300">
              Click to change avatar
            </span>
          </label>

          {/* Name */}
          <input
            type="text"
            value={name}
            placeholder="Name"
            onChange={(e) => setName(e.target.value)}
            className="bg-[#282142]/70 text-white px-4 py-3 rounded-lg
              outline-none border border-gray-600 focus:border-blue-500"
          />

          {/* Bio */}
          <textarea
            value={bio}
            placeholder="Bio"
            onChange={(e) => setBio(e.target.value)}
            rows={4}
            className="bg-[#282142]/70 text-white px-4 py-3 rounded-lg
              outline-none border border-gray-600 focus:border-blue-500 resize-none"
          />

          {/* Button */}
          <button
            type="submit"
            onClick={onSubmitHandler}
            className="mt-4 bg-[#ff5d5d] hover:bg-[#ff5d5d]/80
              text-white py-3 rounded-lg font-medium transition"
          >
            Update Profile
          </button>
        </div>

        {/* RIGHT SIDE – LOGO / VISUAL */}
        <div className="hidden md:flex flex-col items-center justify-center
          bg-gradient-to-br from-[#3a3f87]/40 to-[#1e1b2e]/80"
        >
          <img
            src={assets.logo_icon}
            alt="logo"
            className="w-40 h-40 rounded-full shadow-xl mb-6"
          />

          <p className="text-gray-300 text-sm px-6 text-center">
            Keep your profile updated so your friends can recognize you easily.
          </p>
        </div>

      </div>
    </div>
  )
}

export default ProfilePage
