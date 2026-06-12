import React, { useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import assets from "../assets/assets";
import { AuthContext } from "../context/AuthContext";

const ProfilePage = () => {
  const navigate = useNavigate();
  const { authUser, updateProfile } = useContext(AuthContext);

  const [selectedImage, setSelectedImage] = useState(null);
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");

  // ==============================
  // LOAD CURRENT USER DATA
  // ==============================
  useEffect(() => {
    if (authUser) {
      setName(authUser.fullName || "");
      setBio(authUser.bio || "");
    }
  }, [authUser]);

  // ==============================
  // HANDLE SUBMIT
  // ==============================
  const onSubmitHandler = async (e) => {
    e.preventDefault();

    let base64Image = null;

    // Convert image to base64 if selected
    if (selectedImage) {
      const reader = new FileReader();
      reader.readAsDataURL(selectedImage);

      reader.onloadend = async () => {
        base64Image = reader.result;

        await updateProfile({
          fullName: name,
          bio: bio,
          profilePicture: base64Image,
        });

        navigate("/");
      };
    } else {
      await updateProfile({
        fullName: name,
        bio: bio,
      });

      navigate("/");
    }
  };

  return (
    <div className="w-full h-full overflow-y-auto bg-cover bg-no-repeat p-6 flex flex-col items-center">
      <div
        className="w-[90%] max-w-4xl bg-panel-bg backdrop-blur-xl
        border border-border-main rounded-2xl grid grid-cols-1 md:grid-cols-2
        overflow-hidden shadow-xl my-auto"
      >
        {/* LEFT SIDE – FORM */}
        <form
          onSubmit={onSubmitHandler}
          className="p-10 flex flex-col gap-6 text-text-main"
        >
          <h2 className="text-xl font-semibold">
            Profile Information
          </h2>

          {/* Avatar Upload */}
          <label
            htmlFor="avatar"
            className="flex items-center gap-4 cursor-pointer"
          >
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
                  : authUser?.profilePicture || assets.avatar_icon
              }
              alt="avatar"
              className="w-14 h-14 rounded-full object-cover border border-border-main"
            />

            <span className="text-sm text-text-main/70 hover:text-text-main transition">
              Click to change avatar
            </span>
          </label>

          {/* Name */}
          <input
            type="text"
            value={name}
            placeholder="Name"
            onChange={(e) => setName(e.target.value)}
            className="bg-input-bg text-text-main px-4 py-3 rounded-lg
              outline-none border border-border-main/30 focus:border-blue-500 transition"
          />

          {/* Bio */}
          <textarea
            value={bio}
            placeholder="Bio"
            onChange={(e) => setBio(e.target.value)}
            rows={4}
            className="bg-input-bg text-text-main px-4 py-3 rounded-lg
              outline-none border border-border-main/30 focus:border-blue-500 resize-none transition"
          />

          {/* Button */}
          <button
            type="submit"
            className="mt-4 bg-[#ff5d5d] hover:bg-[#ff5d5d]/85
              text-white py-3 rounded-lg font-semibold transition cursor-pointer shadow-sm"
          >
            Update Profile
          </button>
        </form>

        {/* RIGHT SIDE */}
        <div
          className="hidden md:flex flex-col items-center justify-center
          bg-gradient-to-br from-[#3a3f87]/30 to-[#1e1b2e]/60 dark:from-[#3a3f87]/40 dark:to-[#1e1b2e]/90 border-l border-border-main/30"
        >
          <img
            src={assets.logo}
            alt="logo"
            className="w-32 h-32 object-contain mb-6 transition hover:scale-105 duration-300"
          />

          <p className="text-text-main/70 text-sm px-6 text-center leading-relaxed">
            Keep your profile updated so your friends can recognize you easily.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
