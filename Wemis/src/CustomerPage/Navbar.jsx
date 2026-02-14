import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FaHome,
  FaChartBar,
  FaClipboardList,
  FaBars,
  FaTimes
} from "react-icons/fa";
import { FiLogOut } from "react-icons/fi";
import { toast } from "react-toastify";
import logo from "../Images/logo.png";

function Navbar() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    toast.success("Logout successfully");
    navigate("/");
  };

  return (
    <div className="sticky top-0 z-30 bg-gradient-to-r from-yellow-500 via-black to-black shadow-xl">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">

        {/* LOGO */}
        <Link to="/customer/dashboard">
          <img
            src={logo}
            alt="Logo"
            className="w-24 h-14 object-contain"
          />
        </Link>

        {/* DESKTOP MENU */}
        <nav className="hidden md:flex items-center gap-10 text-[15px] tracking-wide">
          <NavItem to="/customer/dashboard" icon={<FaHome />} label="Dashboard" />
          <NavItem to="/customer/reports" icon={<FaChartBar />} label="Reports" />
          <NavItem
            to="/customer/ActivationPlans"
            icon={<FaClipboardList />}
            label="Activation Packages"
          />
        </nav>

        {/* DESKTOP LOGOUT */}
        <button
          onClick={handleLogout}
          className="hidden md:flex items-center gap-2 text-yellow-200 hover:text-red-400 transition text-sm"
        >
          <FiLogOut className="text-lg" />
          Logout
        </button>

        {/* MOBILE TOGGLE */}
        <button
          className="md:hidden text-yellow-200 text-xl"
          onClick={() => setOpen(!open)}
        >
          {open ? <FaTimes /> : <FaBars />}
        </button>
      </div>

      {/* MOBILE MENU */}
      {open && (
        <div className="md:hidden bg-black/95 px-6 py-5 space-y-4 border-t border-yellow-500/30">
          <MobileNavItem
            to="/customer/dashboard"
            icon={<FaHome />}
            label="Dashboard"
            setOpen={setOpen}
          />
          <MobileNavItem
            to="/customer/reports"
            icon={<FaChartBar />}
            label="Reports"
            setOpen={setOpen}
          />
          <MobileNavItem
            to="/customer/ActivationPlans"
            icon={<FaClipboardList />}
            label="Activation Plans"
            setOpen={setOpen}
          />

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-yellow-200 hover:text-red-400 text-sm pt-2"
          >
            <FiLogOut className="text-lg" />
            Logout
          </button>
        </div>
      )}
    </div>
  );
}

/* ---------- Reusable Components ---------- */

const NavItem = ({ to, icon, label }) => (
  <Link
    to={to}
    className="flex items-center gap-2 text-yellow-200 hover:text-white transition-all duration-200
               border-b-2 border-transparent hover:border-yellow-400 pb-1"
  >
    <span className="text-base">{icon}</span>
    {label}
  </Link>
);

const MobileNavItem = ({ to, icon, label, setOpen }) => (
  <Link
    to={to}
    onClick={() => setOpen(false)}
    className="flex items-center gap-3 text-yellow-200 hover:text-white transition text-base"
  >
    <span className="text-lg">{icon}</span>
    {label}
  </Link>
);

export default Navbar;
