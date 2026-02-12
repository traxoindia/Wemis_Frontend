import React, { useState, useRef, useEffect, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import logo from '../Images/logo.png'
import {
  LayoutDashboard,
  Barcode,
  Users,
  Settings,
  ArrowUpRight,
  RotateCcw,
  Repeat,
  ChevronDown,
  ChevronUp,
  QrCode,
  LogOut,
  ClipboardList, // Icon for Requests
  UserCheck // Icon for Dealer specific requests
} from "lucide-react";
import { UserAppContext } from "../contexts/UserAppProvider";

const DistributorNavbar = () => {
  const [openMenu, setOpenMenu] = useState(null);
  const navRef = useRef(null);
  const navigate = useNavigate();
  const { logout } = useContext(UserAppContext);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (navRef.current && !navRef.current.contains(event.target)) {
        setOpenMenu(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleMenu = (menu) => {
    setOpenMenu(openMenu === menu ? null : menu);
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="bg-black text-white">
      {/* Top Navbar */}
      <header className="flex flex-col md:flex-row justify-between items-center bg-gradient-to-r from-yellow-400 via-black to-black border-b border-yellow-500/40 gap-3">
        <div className="flex items-center space-x-6 ml-10">
          <div className="flex items-center space-x-2">
            <img
              src={logo}
              alt="MEMUS Logo"
              className="w-44 h-20 object-contain"
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-3 items-center justify-center mr-4">
          <button className="px-4 py-1.5 bg-yellow-400 text-black font-semibold rounded-md hover:bg-yellow-300 transition w-full md:w-auto">
            Product
          </button>
         
          <button className="px-4 py-1.5 bg-neutral-800 text-yellow-400 font-semibold rounded-md hover:bg-yellow-400 hover:text-black transition w-full md:w-auto">
            <Settings size={16} className="inline mr-1" /> Settings
          </button>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-yellow-400">Distributor</span>
            <img
              src="https://i.pravatar.cc/40"
              alt="user"
              className="w-9 h-9 rounded-full border border-yellow-400"
            />
          </div>

          <button
            onClick={handleLogout}
            className="px-4 py-1.5 bg-red-600 text-white font-semibold rounded-md hover:bg-red-500 transition w-full md:w-auto flex items-center gap-1"
          >
            <LogOut size={16} /> Logout
          </button>
        </div>
      </header>

      {/* Navigation Bar */}
      <nav
        ref={navRef}
        className="relative bg-neutral-950 border-b border-yellow-400/30 px-4 py-3 flex flex-wrap justify-center items-center gap-5 md:gap-10"
      >
        {/* Dashboard */}
        <Link
          to="/distibutor/dashboard"
          className="flex items-center gap-2 text-yellow-400 hover:text-white font-semibold uppercase tracking-wide"
        >
          <LayoutDashboard size={18} /> Dashboard
        </Link>

        {/* Barcode Dropdown */}
        <div className="relative inline-block">
          <div
            className="flex items-center gap-2 cursor-pointer text-yellow-400 hover:text-white font-semibold uppercase tracking-wide"
            onClick={() => toggleMenu("barcode")}
            tabIndex={0}
          >
            <Barcode size={18} /> Barcode
            {openMenu === "barcode" ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>
          {openMenu === "barcode" && (
            <div className="absolute left-0 mt-2 bg-neutral-900 border border-yellow-400/30 rounded-md shadow-lg z-30 w-48 md:w-56 overflow-auto">
              <ul className="text-sm text-yellow-300">
                <li>
                  <Link to="/distributor/barcode" className="flex items-center gap-2 px-4 py-3 hover:bg-yellow-400 hover:text-black rounded transition">
                    <QrCode size={16} /> Barcode
                  </Link>
                </li>
                <li>
                  <Link to="/distributor/allocate-barcode" className="flex items-center gap-2 px-4 py-3 hover:bg-yellow-400 hover:text-black rounded transition">
                    <ArrowUpRight size={16} /> Allocate Barcode
                  </Link>
                </li>
                <li>
                  <Link to="/distributor/rollback-barcode" className="flex items-center gap-2 px-4 py-3 hover:bg-yellow-400 hover:text-black rounded transition">
                    <RotateCcw size={16} /> Rollback Barcode
                  </Link>
                </li>
                <li>
                  <Link to="/distributor/renewal-allocation" className="flex items-center gap-2 px-4 py-3 hover:bg-yellow-400 hover:text-black rounded transition">
                    <Repeat size={16} /> Renewal Allocation
                  </Link>
                </li>
              </ul>
            </div>
          )}
        </div>

        {/* Members Dropdown */}
        <div className="relative inline-block">
          <div
            className="flex items-center gap-2 cursor-pointer text-yellow-400 hover:text-white font-semibold uppercase tracking-wide"
            onClick={() => toggleMenu("members")}
            tabIndex={0}
          >
            <Users size={18} /> Members
            {openMenu === "members" ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>
          {openMenu === "members" && (
            <div className="absolute left-0 mt-2 bg-neutral-900 border border-yellow-400/30 rounded-md shadow-lg z-30 w-40 md:w-44 overflow-auto">
              <ul className="text-sm text-yellow-300">
                <li>
                  <Link to="/distributor/dealer" className="flex items-center gap-2 px-4 py-3 hover:bg-yellow-400 hover:text-black rounded transition">
                    <Users size={16} /> Dealer
                  </Link>
                </li>
              </ul>
            </div>
          )}
        </div>

        {/* Activation Requests Dropdown */}
        <div className="relative inline-block">
          <div
            className="flex items-center gap-2 cursor-pointer text-yellow-400 hover:text-white font-semibold uppercase tracking-wide"
            onClick={() => toggleMenu("requests")}
            tabIndex={0}
          >
            <ClipboardList size={18} /> Activation Requests
            {openMenu === "requests" ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>
          {openMenu === "requests" && (
            <div className="absolute left-0 mt-2 bg-neutral-900 border border-yellow-400/30 rounded-md shadow-lg z-30 w-52 md:w-60 overflow-auto">
              <ul className="text-sm text-yellow-300">
               
                <li>
                  <Link
                    to="/distributor/ActivationRequests"
                    className="flex items-center gap-2 px-4 py-3 hover:bg-yellow-400 hover:text-black rounded transition"
                  >
                    <ClipboardList size={16} /> Activation Requests
                  </Link>
                </li>
                 <li>
                  <Link
                    to="/distributor/DealerRequests"
                    className="flex items-center gap-2 px-4 py-3 hover:bg-yellow-400 hover:text-black rounded transition"
                  >
                    <UserCheck size={16} /> Dealer Requests
                  </Link>
                </li>
              </ul>
            </div>
          )}
        </div>
      </nav>
    </div>
  );
};

export default DistributorNavbar;