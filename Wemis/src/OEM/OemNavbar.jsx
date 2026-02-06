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
  Cpu,
  ShieldCheck,
  Package
} from "lucide-react";
import { UserAppContext } from "../contexts/UserAppProvider";

const OemNavbar = () => {
  const [openMenu, setOpenMenu] = useState(null);
  const navRef = useRef(null);
  const navigate = useNavigate();
  
  // Destructuring logout from your UserAppProvider context
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

  // Logout button handler
  const handleLogout = () => {
    logout(); // Removes user data/tokens from context/storage
    navigate("/"); // Redirects to login
  };

  return (
    <div className="bg-black text-white sticky top-0 z-50">
      {/* Top Header Section */}
      <header className="flex flex-col md:flex-row justify-between items-center bg-gradient-to-r from-yellow-400 via-black to-black border-b border-yellow-500/40 px-6 py-2 gap-3">
        <div className="flex items-center space-x-6">
          <Link to="/oem/dashboard">
            <img
              src={logo}
              alt="MEMUS Logo"
              className="w-40 h-16 object-contain"
            />
          </Link>
        </div>

        <div className="flex flex-wrap gap-3 items-center justify-center">
          <Link to="/oem/wallet">
            <button className="px-4 py-1.5 bg-yellow-400 text-black font-semibold rounded-md hover:bg-yellow-300 transition flex items-center gap-2">
              <ShieldCheck size={16} /> Wallet
            </button>
          </Link>
          
          <button className="px-4 py-1.5 bg-neutral-800 text-yellow-400 font-semibold rounded-md hover:bg-yellow-400 hover:text-black transition flex items-center">
            <Settings size={16} className="mr-1" /> Settings
          </button>

          <div className="flex items-center gap-2 px-3">
            <div className="text-right hidden sm:block">
              <p className="text-xs text-gray-400 leading-none">Logged in as</p>
              <span className="font-semibold text-yellow-400 text-sm uppercase">OEM Partner</span>
            </div>
            <img
              src="https://i.pravatar.cc/40?img=33"
              alt="user"
              className="w-9 h-9 rounded-full border border-yellow-400"
            />
          </div>

          <button
            onClick={handleLogout}
            className="px-4 py-1.5 bg-red-600 text-white font-semibold rounded-md hover:bg-red-500 transition flex items-center gap-1"
          >
            <LogOut size={16} /> Logout
          </button>
        </div>
      </header>

      {/* Main Navigation Links */}
      <nav
        ref={navRef}
        className="bg-neutral-950 border-b border-yellow-400/30 px-4 py-3 flex flex-wrap justify-center items-center gap-5 md:gap-10"
      >
        {/* Dashboard Link */}
        <Link
          to="/oem/dashboard"
          className="flex items-center gap-2 text-yellow-400 hover:text-white font-semibold uppercase tracking-wide text-sm"
        >
          <LayoutDashboard size={18} /> Dashboard
        </Link>

        {/* Inventory Dropdown */}
        <div className="relative inline-block">
          <div
            className="flex items-center gap-2 cursor-pointer text-yellow-400 hover:text-white font-semibold uppercase tracking-wide text-sm"
            onClick={() => toggleMenu("inventory")}
          >
            <Package size={18} /> Inventory
            {openMenu === "inventory" ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>
          {openMenu === "inventory" && (
            <div className="absolute left-0 mt-2 bg-neutral-900 border border-yellow-400/30 rounded-md shadow-xl z-50 w-56 overflow-hidden">
              <ul className="text-sm text-yellow-300">
                <li className="border-b border-white/5">
                  <Link
                    to="/oem/barcodes"
                    className="flex items-center gap-2 px-4 py-3 hover:bg-yellow-400 hover:text-black transition"
                  >
                    <QrCode size={16} /> My Barcodes
                  </Link>
                </li>
                <li>
                  <Link
                    to="/oem/mapping"
                    className="flex items-center gap-2 px-4 py-3 hover:bg-yellow-400 hover:text-black transition"
                  >
                    <Cpu size={16} /> Device Mapping
                  </Link>
                </li>
              </ul>
            </div>
          )}
        </div>

        {/* Members/Network Dropdown */}
        <div className="relative inline-block">
          <div
            className="flex items-center gap-2 cursor-pointer text-yellow-400 hover:text-white font-semibold uppercase tracking-wide text-sm"
            onClick={() => toggleMenu("network")}
          >
            <Users size={18} /> Network
            {openMenu === "network" ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>
          {openMenu === "network" && (
            <div className="absolute left-0 mt-2 bg-neutral-900 border border-yellow-400/30 rounded-md shadow-xl z-50 w-56 overflow-hidden">
              <ul className="text-sm text-yellow-300">
                <li className="border-b border-white/5">
                  <Link
                    to="/oem/dealers"
                    className="flex items-center gap-2 px-4 py-3 hover:bg-yellow-400 hover:text-black transition"
                  >
                    <Users size={16} /> My Dealers
                  </Link>
                </li>
                <li>
                  <Link
                    to="/oem/technicians"
                    className="flex items-center gap-2 px-4 py-3 hover:bg-yellow-400 hover:text-black transition"
                  >
                    <Users size={16} /> My Technicians
                  </Link>
                </li>
              </ul>
            </div>
          )}
        </div>

        {/* Action Center Link */}
        <Link
          to="/oem/activation-requests"
          className="flex items-center gap-2 text-yellow-400 hover:text-white font-semibold uppercase tracking-wide text-sm"
        >
          <ArrowUpRight size={18} /> Activation Requests
        </Link>
      </nav>
    </div>
  );
};

export default OemNavbar;