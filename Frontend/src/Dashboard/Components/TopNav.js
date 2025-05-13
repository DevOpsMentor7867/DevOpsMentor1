import React, { useState, useRef, useEffect } from "react";
import { Expand, Settings } from "lucide-react";
import "./SideBar.css";
import { LogoutUser } from "../../API/LogoutUser";
import { useAuthContext } from "../../API/UseAuthContext";

export default function TopNav({ isSidebarOpen }) {
  // eslint-disable-next-line
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const { logout } = LogoutUser();
  const dropdownRef = useRef(null);
  const triggerRef = useRef(null);
  const { user } = useAuthContext();

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  // Close on click outside
  useEffect(() => {
    const clickHandler = ({ target }) => {
      if (!dropdownRef.current) return;
      if (
        !isDropdownOpen ||
        dropdownRef.current.contains(target) ||
        triggerRef.current.contains(target)
      )
        return;
      setIsDropdownOpen(false);
    };
    document.addEventListener("click", clickHandler);
    return () => document.removeEventListener("click", clickHandler);
  });

  // Close if the esc key is pressed
  useEffect(() => {
    const keyHandler = ({ keyCode }) => {
      if (!isDropdownOpen || keyCode !== 27) return;
      setIsDropdownOpen(false);
    };
    document.addEventListener("keydown", keyHandler);
    return () => document.removeEventListener("keydown", keyHandler);
  });

  const handleLogout = async (e) => {
    await logout();
  };

  return (
    <nav
    // bg-[#1A202C]
      className={`fixed top-0 right-0 z-50 flex items-center justify-between px-4 py-4 transition-all duration-300 bottom-gradient-border w-full  bg-gray-950 ${
        isSidebarOpen ? "left-60" : "md:left-14"
      }`}
    >
      <div className="flex-1 text-center">
        <span className="text-btg z-10 text-2xl md:text-2xl ml-8 md:ml-16 font-semibold uppercase ">
          DEV∞OPS Mentor
        </span>
      </div>

      <div
        className={`flex items-center gap-4 md:gap-8 ${
          isSidebarOpen ? "md:mr-64" : "md:mr-14"
        }`}
      >
        <button
          variant="ghost"
          size="icon"
          className="hidden md:block text-[#80EE98] hover:text-white transition-all duration-300"
          onClick={toggleFullscreen}
        >
          <Expand className="h-5 w-5" />
        </button>

        <div className="relative">
          <button
            ref={triggerRef}
            variant="ghost"
            size="icon"
            className=" md:block mt-2 md:mt-0 text-[#80EE98] hover:text-white hover:bg-[#80EE98]/20 transition-all duration-300"
            onClick={toggleDropdown}
          >
            <Settings className="h-5 w-5" />
          </button>

          {isDropdownOpen && (
            <div
              ref={dropdownRef}
              className="absolute right-0 mt-2 w-60 rounded-lg bg-gray-900 p-2 shadow-lg ring-1 ring-black ring-opacity-5 z-50"
            >
              <div className="border-b border-gray-700 p-3">
                <div className="flex items-center gap-3">
                  <div>
                    <div className="font-medium text-2xl text-btg">
                    {user ? user.name : "Dummy Name"}
                    </div>
                    <div className="text-sm text-white mt-1">
                      {user ? user.email : "dummyemail@example.com"}
                    </div>
                  </div>
                </div>
              </div>

              <div className="py-1">
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 rounded px-3 py-2 text-sm text-green-300  hover:bg-[#2D3748]"
                >
                  <svg
                    className="h-4 w-4 text-[#80EE98]"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    />
                  </svg>
                  Log out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
