import React, { useState } from "react";
import { Menu, X } from "lucide-react";
import "./SideBar.css";
import { Link } from "react-router-dom";
import {
  Home,
  PenToolIcon as Tool,
  Beaker,
  GraduationCap,
  User,
} from "lucide-react";

export default function Sidebar({ isOpen, onToggle }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);


  const menuItems = [
    {
      icon: (
        <Home className="h-5 w-5 text-[#80EE98] hover:text-white transition-transform duration-300 ease-in-out hover:scale-110" />
      ),
      label: "Dashboard",
      to: "/dashboard",
      className: "text-[#80EE98]",
    },
    {
      icon: (
        <Tool className="h-5 w-5 text-[#09D1C7] hover:text-white hover:bg-[#09D1C7]/20 transition-transform duration-300 ease-in-out hover:scale-110" />
      ),
      label: "Tools",
      to: "/dashboard/tools",
      className: "",
    },
    {
      icon: (
        <Beaker className="h-5 w-5 text-[#80EE98] hover:text-white hover:bg-[#80EE98]/20 transition-transform duration-300 ease-in-out hover:scale-110" />
      ),
      label: "Loading",
      to: "/dashboard/loading",
      className: "",
    },
    {
      icon: (
        <GraduationCap className="h-5 w-5 text-[#09D1C7] hover:text-white hover:bg-[#09D1C7]/20 transition-transform duration-300 ease-in-out hover:scale-110" />
      ),
      label: "Pricing",
      to: "/dashboard/pricing",
      className: "",
    },
    {
      icon: (
        <User className="h-5 w-5 text-[#80EE98] hover:text-white hover:bg-[#80EE98]/20 transition-transform duration-300 ease-in-out hover:scale-110" />
      ),
      label: "Profile",
      to: "/dashboard/profile",
      className: "",
    },
  ];

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={toggleMobileMenu}
        className="fixed top-4 left-4 z-50 md:hidden rounded-lg p-2 text-[#80EE98] hover:text-white hover:bg-[#80EE98]/20 transition-all duration-300"
      >
        {isMobileMenuOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <Menu className="h-6 w-6" />
        )}
        <span className="sr-only">Toggle Mobile Menu</span>
      </button>

      {/* Sidebar for desktop */}
      <div className="fixed top-0 left-0 z-40 h-screen hidden md:block bg-black/20 backdrop-blur-sm">
        <div
          className={`h-screen transition-all duration-300 relative border-r border-transparent sidebar-gradient-border ${
            isOpen ? "w-[15rem]" : "w-14"
          } bg-black/20 text-gray-100`}
        >
          <div className="flex h-16 items-center justify-between pr-[12px]">
            {isOpen && (
              <div className="flex items-center pl-1">
                <h5 className="text-2xl font-semibold uppercase text-btg">
                  DevOps Mentor
                </h5>
              </div>
            )}

            <button
              onClick={onToggle}

              className="text-gray-400 hover:bg-opacity-10 hover:text-white"
            >
              <Menu
                  className={`h-6 w-6 text-[#80EE98] hover:text-white hover:bg-[#80EE98]/20 transition-all duration-300 ${
                    isOpen ? "" : "ml-3"
                  }`}
                />
              <span className="sr-only">Toggle Menu</span>
            </button>
          </div>

          <div
            className={`fixed z-50 bg-white bg-opacity-5 px-4 py-0 transition-all duration-300 bottom-gradient-border ${
              isOpen ? "w-60" : "w-20"
            }`}
          ></div>

          <div
            className={`m2-4 flex flex-col gap-2 py-4 overflow-y-auto h-screen ${
              isOpen ? "justify-center -mt-8" : "justify-center -mt-8"
            }`}
          >
            {menuItems.map((item, index) => (
              <Link
                key={item.label}
                to={item.to}
                className={`flex items-center rounded-lg px-2 py-2 text-xl ml-[6px] transition-all duration-300 ${
                  index % 2 === 0 ? "text-[#80EE98]" : "text-[#09D1C7]"
                }`}
              >
                <div className="flex flex-row">
                  <div className="h-8 w-8">{item.icon}</div>
                  {isOpen && (
                    <span
                      className={`ml-4 -mt-[3px] transition-transform duration-300 ease-in-out hover:scale-110 hover:text-white`}
                    >
                      {item.label}
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div
        className={`fixed inset-0 z-40 backdrop-blur-md bg-black/40 transition-all duration-300 md:hidden ${
          isMobileMenuOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        <div className="flex flex-col items-center justify-center h-full space-y-8">
          {menuItems.map((item, index) => (
            <Link
              key={item.label}
              to={item.to}
              className={`flex flex-col items-center justify-center space-y-2 ${
                index % 2 === 0 ? "text-[#80EE98]" : "text-[#09D1C7]"
              }`}
              onClick={toggleMobileMenu}
            >
              <div className="flex flex-row ">
                <div className="h-8 w-8">{item.icon}</div>
                <span
                  className={`ml-4 -mt-[3px] transition-transform duration-300 ease-in-out hover:scale-110 hover:text-white`}
                >
                  {item.label}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
