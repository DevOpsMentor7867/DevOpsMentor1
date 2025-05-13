import React, { useState, useEffect } from "react";
import { useAuthContext } from "../../API/UseAuthContext";
import LoadingPage from "./LoadingPage";
import DeleteAccountPopup from './DeleteAccountPopup';
import { useNavigate } from "react-router-dom";
import axios from "axios";

const api = axios.create({
  baseURL: process.env.REACT_APP_BASE_URL,
  withCredentials: true,
});

const UserProfile = () => {
  const { user } = useAuthContext();
  const [user2, setUser] = useState({
    name: user.name,
    username: user.username,
    gender: user.gender,
    email: user.email,
    profilePicture: "https://github.com/shadcn.png", // Placeholder image
  });
  
  const [isEditing, setIsEditing] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [apiMessage, setApiMessage] = useState({ type: "", content: "" });
  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (apiMessage.content) {
      const timer = setTimeout(() => {
        setApiMessage({ type: "", content: "" });
      }, 3000); // Clear message after 3 seconds

      return () => clearTimeout(timer);
    }
  }, [apiMessage]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUser((prevUser) => ({
      ...prevUser,
      [name]: value,
    }));
  };

  const handleGenderChange = (e) => {
    setUser((prevUser) => ({
      ...prevUser,
      gender: e.target.value,
    }));
  };

  const toggleEdit = async () => {
    if (isEditing) {
      try {
        const response = await api.post("/user/SetUserInformation", {
          email: user2.email,
          name: user2.name,
          username: user2.username,
          gender: user2.gender,
        });

        console.log("API Response:", response.data);

        setApiMessage({
          type: "success",
          content: "Profile saved successfully!",
        });

        // Update the user state with the response data
        setUser((prevUser) => ({
          ...prevUser,
          ...response.data,
        }));
      } catch (error) {
        console.error("API Error:", error);
        setApiMessage({
          type: "error",
          content: "Failed to save profile. Please try again.",
        });
      }
    } else {
      // Clear the API message when entering edit mode
      setApiMessage({ type: "", content: "" });
    }
    setIsEditing(!isEditing);
  };


  const handleDeleteAccount = async (email, password) => {
    try {
      const response = await api.post("/user/delete-user", { email, password });
      setApiMessage({
        type: "success",
        content: response.data.message || "Account deleted successfully.",
      });    
       
      setTimeout(() => {
        navigate('/login');
      }, 3000);

    } catch (error) {
      setApiMessage({
        type: "error",
        content: error.response?.data?.message || "Failed to delete account. Please try again.",
      });
    }
  };

  if (!isLoaded) {
    return <LoadingPage />;
  }

  return (
    <>
      <div className="fixed inset-0 z-0">
        <img
          src="/homebgc.jpg"
          alt="Background"
          className="w-full h-full object-cover mt-12"
        />
        <div className="absolute  inset-0 bg-black/70 backdrop-blur-sm" />
      </div>
      <div className="max-w-xl mx-auto p-6 border border-[#09D1C7]/60 bg-white/5 rounded-xl mt-16 relative backdrop-blur-sm">
        <div
          className={`flex gap-4 ${
            apiMessage.content ? "justify-between" : "justify-end"
          }  mb-4 z-50`}
        >
          {apiMessage.content && (
            <div
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                apiMessage.type === "success"
                  ? "bg-[#80EE98]/20 text-[#80EE98]"
                  : "bg-red-500/20 text-red-500"
              }`}
            >
              {apiMessage.content}
            </div>
          )}
          <button
            onClick={toggleEdit}
            className="px-4 py-2 bg-gradient-to-r from-[#80EE98] to-[#09D1C7] text-[#1A202C] hover:from-[#09D1C7] hover:to-[#80EE98] font-medium rounded-md transition-all duration-300"
          >
            {isEditing ? "Save Profile" : "Edit Profile"}
          </button>
          <button
            onClick={() => setShowDeletePopup(true)}
            className="px-4 py-2 rounded-lg bg-red-600 text-white hover:opacity-90 transition-opacity flex items-center gap-2"
          >
            Delete Account
          </button>
        </div>

        <div className="flex flex-row items-center text-center">
          <div className="w-32 h-32 relative ml-2">
            <img
              src={user2.profilePicture}
              alt={user2.name}
              className="rounded-full w-full h-full object-cover border-4 border-[#80EE98]/20"
            />
          </div>
          <div className="flex flex-col ml-4">
            <h1 className="text-3xl font-bold text-white">{user2.name}</h1>
            <p className="text-[#09D1C7]">@{user2.username}</p>
          </div>
        </div>

        <div className="space-y-6 mt-3">
          <div className="space-y-2">
            <label className="block text-[#09D1C7] text-sm font-medium">
              Name
            </label>
            {isEditing ? (
              <input
                type="text"
                name="name"
                value={user2.name}
                onChange={handleInputChange}
                className="flex-1 bg-transparent border border-[#80EE98]/20 group-hover:border-[#09D1C7]/40 focus:border-[#09D1C7] text-white rounded-lg px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-[#09D1C7] transition-colors w-full"
              />
            ) : (
              <div className="w-full bg-[#1A202C]/50 border border-[#09D1C7]/20 rounded-md px-4 py-2 text-white hover:bg-[#09D1C7]/20">
                {user2.name}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="block text-[#80EE98] text-sm font-medium">
              Username
            </label>
            {isEditing ? (
              <input
                type="text"
                name="username"
                value={user2.username}
                onChange={handleInputChange}
                className="flex-1 bg-transparent border border-[#80EE98]/20 group-hover:border-[#80EE98]/40 focus:border-[#80EE98] text-white rounded-lg px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-[#80EE98] transition-colors w-full"
              />
            ) : (
              <div className="w-full bg-[#1A202C]/50 border border-[#80EE98]/20 rounded-md px-4 py-2 text-white hover:bg-[#80EE98]/20">
                {user2.username}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="block text-[#09D1C7] text-sm font-medium">
              Gender
            </label>
            {isEditing ? (
              <select
                name="gender"
                value={user2.gender}
                onChange={handleGenderChange}
                className="flex-1 bg-transparent border border-[#80EE98]/20 group-hover:border-[#09D1C7]/40 focus:border-[#09D1C7] text-white rounded-lg px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-[#09D1C7] transition-colors w-full"
              >
                <option
                  value="Male"
                  className="bg-[#1A202C] hover:bg-[#09D1C7]/80 text-white"
                >
                  Male
                </option>
                <option
                  value="Female"
                  className="bg-[#1A202C] hover:bg-[#80EE98]/80 text-white"
                >
                  Female
                </option>
              </select>
            ) : (
              <div className="w-full bg-[#1A202C]/50 border border-[#09D1C7]/20 rounded-md px-4 py-2 text-white hover:bg-[#09D1C7]/20">
                {user2.gender}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="block text-[#80EE98] text-sm font-medium">
              Email
            </label>
            <div className="w-full bg-[#1A202C]/50 border border-[#80EE98]/20 rounded-md px-4 py-2 text-white hover:bg-[#80EE98]/20">
              {user2.email}
            </div>
          </div>
        </div>
      </div>
      <DeleteAccountPopup
        isOpen={showDeletePopup}
        onClose={() => setShowDeletePopup(false)}
        onDelete={handleDeleteAccount}
        apiMessage={apiMessage}
      />
    </>
  );
};

export default UserProfile;
