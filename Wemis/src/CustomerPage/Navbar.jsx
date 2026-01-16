import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaMapMarkedAlt } from "react-icons/fa";
import { FiLogOut } from "react-icons/fi";
import { toast } from "react-toastify";
import logo from "../Images/logo.png";

function Navbar() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user"); // remove user
    toast.success("Logout successfully"); // show toast
    navigate("/");
  };

  return (
    <div className="sticky top-0 z-30 bg-gradient-to-r from-yellow-500 via-black to-black shadow-xl">
      <div className="max-w-7xl mx-auto px-6 py-4 relative">

        {/* LOGO */}
        <Link to="/customer/dashboard" className="absolute left-6">
          <img
            src={logo}
            alt="Logo"
            className="w-24 h-16 -mt-5 object-contain"
          />
        </Link>

        {/* NAV ITEMS */}
        <div className="flex justify-center">
          <nav className="flex items-center gap-10 text-[15px] tracking-wide">
            <Link
              to="/customer/dashboard"
              className="flex items-center gap-2 text-yellow-200 hover:text-white transition-all duration-200 border-b-2 border-transparent hover:border-yellow-400 pb-1"
            >
              <FaMapMarkedAlt className="text-base" />
              Dashboard
            </Link>
            <Link
              to="/customer/reports"
              className="flex items-center gap-2 text-yellow-200 hover:text-white transition-all duration-200 border-b-2 border-transparent hover:border-yellow-400 pb-1"
            >
              <FaMapMarkedAlt className="text-base" />
              Reports
            </Link>
          </nav>
        </div>

        {/* LOGOUT BUTTON */}
        <button
          onClick={handleLogout}
          className="absolute right-6 top-1/2 -translate-y-1/2 flex items-center gap-2 text-yellow-200 hover:text-red-400 transition-all duration-200 text-sm"
          title="Logout"
        >
          <FiLogOut className="text-lg" />
          Logout
        </button>

      </div>
    </div>
  );
}

export default Navbar;
