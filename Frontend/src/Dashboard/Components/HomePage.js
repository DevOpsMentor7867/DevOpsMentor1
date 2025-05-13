import React, { useState, useEffect } from "react";
import axios from "axios";
import ProfileSetupModal from "./ProfileModal";
import { useAuthContext } from "../../API/UseAuthContext";
import LoadingPage from "./LoadingPage";
import DashboardOverview from "./DashboardOverview";

const api = axios.create({
  baseURL: process.env.REACT_APP_BASE_URL,
  withCredentials: true,
});

export default function HomePage() {
  const { user, loading, updateUser } = useAuthContext();
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  const [apiMessage, setApiMessage] = useState({ type: "", content: "" });

  useEffect(() => {
    if (user && user.name === "*") {
      setShowProfileSetup(true);
    }
  }, [user]);

  const SetUserInformation = async (profileData) => {
    try {
      const response = await api.post("/user/SetUserInformation", {
        ...profileData,
        email: user?.email || profileData.email,
      });
      console.log("API Response:", response.data);
      setApiMessage({
        type: "success",
        content: "Profile saved successfully!",
      });

      // Update the user context with the new data
      updateUser(profileData);

      return true;
    } catch (error) {
      console.error("Error sending profile data:", error);
      setApiMessage({
        type: "error",
        content:
          error.response?.data?.message ||
          "Failed to save profile data. Please try again.",
      });
      return false;
    }
  };

  const handleProfileSave = async (profileData) => {
    console.log("Form Data:", profileData);
    const success = await SetUserInformation(profileData);
    if (success) {
      setShowProfileSetup(false);
    }
  };

  const handleCloseModal = () => {
    setShowProfileSetup(false);
    setApiMessage({ type: "", content: "" });
  };

  if (loading) {
    return <LoadingPage />;
  }

  return (
    <>
      {/* <div className="fixed inset-0 z-0">
        <img
          src="/homebgc.jpg"
          alt="Background"
          className="w-full h-full object-cover mt-12"
        />
        <div className="absolute backdrop-blur-lg  inset-0 bg-black/70" />
      </div> */}

      <div className="relative text-btg text-center  backdrop-blur-sm h-[41rem] ">
        {showProfileSetup && user && (
          <ProfileSetupModal
            email={user.email || ""}
            onSave={handleProfileSave}
            apiMessage={apiMessage}
            onClose={handleCloseModal}
          />
        )}

        <DashboardOverview />

        {/* {!showProfileSetup && user && (
        <div>
          <h2>Profile Information:</h2>
          <p>Name: {user.name}</p>
          <p>Username: {user.username}</p>
          <p>Email: {user.email}</p>
          <p>Gender: {user.gender}</p>
        </div>
      )} */}
      </div>
    </>
  );
}
