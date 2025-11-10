import React, { useState, useRef, useEffect, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Barcode,
  Users,
  Wrench,
  Settings,
  Map,
  Package,
  ArrowUpRight,
  Calendar,
  RefreshCcw,
  CheckCircle,
  Clock,
  ChevronDown,
  ChevronUp,
  QrCode,
  RotateCcw,
  Repeat,
  LogOut,
} from "lucide-react";
import { UserAppContext } from "../contexts/UserAppProvider";

const stats = [
  { title: "Total Dealer", value: "1", icon: <Users className="text-yellow-400" /> },
  { title: "Total Technician", value: "1", icon: <Wrench className="text-yellow-400" /> },
  { title: "Total Device in Stock", value: "0", icon: <Package className="text-yellow-400" /> },
  { title: "Total Allocated Devices", value: "2", icon: <ArrowUpRight className="text-yellow-400" /> },
  { title: "Today Allocated Devices", value: "0", icon: <Calendar className="text-yellow-400" /> },
  { title: "This Month Allocated Devices", value: "0", icon: <Calendar className="text-yellow-400" /> },
  { title: "Total Map Devices", value: "2", icon: <Map className="text-yellow-400" /> },
  { title: "Today Map Devices", value: "2", icon: <Map className="text-yellow-400" /> },
  { title: "This Month Map Devices", value: "N/A", icon: <Calendar className="text-yellow-400" /> },
  { title: "Total Renewal Devices", value: "N/A", icon: <RefreshCcw className="text-yellow-400" /> },
  { title: "Total Renewed Devices", value: "N/A", icon: <CheckCircle className="text-yellow-400" /> },
  { title: "Upcoming Renew Devices", value: "N/A", icon: <Clock className="text-yellow-400" /> },
];

const DistributorDashboard = () => {
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
    logout(); // Call context logout
    navigate("/"); // Redirect to login page
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Top Navbar */}
      <header className="flex justify-between items-center bg-neutral-900 p-4 border-b border-yellow-400/40">
        <div className="flex items-center gap-2">
          <img
            src="https://wemis.in/assets/logo.png"
            alt="wemis"
            className="h-8 brightness-200"
          />
          <span className="font-bold text-2xl text-yellow-400 tracking-wide">
            WEMIS
          </span>
        </div>
        <div className="flex gap-4 items-center">
          <button className="px-4 py-1.5 bg-yellow-400 text-black font-semibold rounded-md hover:bg-yellow-300 transition">
            Product
          </button>
          <button className="px-4 py-1.5 bg-yellow-400 text-black font-semibold rounded-md hover:bg-yellow-300 transition">
            Wallet
          </button>
          <button className="px-4 py-1.5 bg-neutral-800 text-yellow-400 font-semibold rounded-md hover:bg-yellow-400 hover:text-black transition">
            <Settings size={16} className="inline mr-1" /> Settings
          </button>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-yellow-400">SBT SOLUTIONS</span>
            <img
              src="https://i.pravatar.cc/40"
              alt="user"
              className="w-9 h-9 rounded-full border border-yellow-400"
            />
          </div>
          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="px-4 py-1.5 bg-red-600 text-white font-semibold rounded-md hover:bg-red-500 transition flex items-center gap-1"
          >
            <LogOut size={16} /> Logout
          </button>
        </div>
      </header>

      {/* Navigation Bar */}
      <nav
        ref={navRef}
        className="relative bg-neutral-950 border-b border-yellow-400/30 px-6 py-3 flex flex-wrap justify-center gap-6 md:gap-10"
      >
        {/* Dashboard */}
        <Link
          to="/distributor/dashboard"
          className="flex items-center gap-2 text-yellow-400 hover:text-white font-semibold uppercase tracking-wide"
        >
          <LayoutDashboard size={18} /> Dashboard
        </Link>

        {/* Barcode Dropdown */}
        <div className="relative">
          <div
            className="flex items-center gap-2 cursor-pointer text-yellow-400 hover:text-white font-semibold uppercase tracking-wide"
            onClick={() => toggleMenu("barcode")}
          >
            <Barcode size={18} /> Barcode
            {openMenu === "barcode" ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>
          {openMenu === "barcode" && (
            <div className="absolute top-10 left-0 bg-neutral-900 border border-yellow-400/30 rounded-md w-56 shadow-lg z-20">
              <ul className="text-sm text-yellow-300">
                <li>
                  <Link
                    to="/distributor/barcode"
                    className="flex items-center gap-2 px-4 py-2 hover:bg-yellow-400 hover:text-black transition"
                  >
                    <QrCode size={16} /> Barcode
                  </Link>
                </li>
                <li>
                  <Link
                    to="/distributor/allocate-barcode"
                    className="flex items-center gap-2 px-4 py-2 hover:bg-yellow-400 hover:text-black transition"
                  >
                    <ArrowUpRight size={16} /> Allocate Barcode
                  </Link>
                </li>
                <li>
                  <Link
                    to="/distributor/rollback-barcode"
                    className="flex items-center gap-2 px-4 py-2 hover:bg-yellow-400 hover:text-black transition"
                  >
                    <RotateCcw size={16} /> Rollback Barcode
                  </Link>
                </li>
                <li>
                  <Link
                    to="/distributor/renewal-allocation"
                    className="flex items-center gap-2 px-4 py-2 hover:bg-yellow-400 hover:text-black transition"
                  >
                    <Repeat size={16} /> Renewal Allocation
                  </Link>
                </li>
              </ul>
            </div>
          )}
        </div>

        {/* Members Dropdown */}
        <div className="relative">
          <div
            className="flex items-center gap-2 cursor-pointer text-yellow-400 hover:text-white font-semibold uppercase tracking-wide"
            onClick={() => toggleMenu("members")}
          >
            <Users size={18} /> Members
            {openMenu === "members" ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>
          {openMenu === "members" && (
            <div className="absolute top-10 left-0 bg-neutral-900 border border-yellow-400/30 rounded-md w-44 shadow-lg z-20">
              <ul className="text-sm text-yellow-300">
                <li>
                  <Link
                    to="/distributor/dealer"
                    className="flex items-center gap-2 px-4 py-2 hover:bg-yellow-400 hover:text-black transition"
                  >
                    <Users size={16} /> Dealer
                  </Link>
                </li>
                
              </ul>
            </div>
          )}
        </div>

        {/* Manage Device Dropdown */}
        <div className="relative">
          <div
            className="flex items-center gap-2 cursor-pointer text-yellow-400 hover:text-white font-semibold uppercase tracking-wide"
            onClick={() => toggleMenu("device")}
          >
            <Package size={18} /> Manage Device
            {openMenu === "device" ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>
          {openMenu === "device" && (
            <div className="absolute top-10 left-0 bg-neutral-900 border border-yellow-400/30 rounded-md w-44 shadow-lg z-20">
              <ul className="text-sm text-yellow-300">
                <li>
                  <Link
                    to="/distributor/map-device"
                    className="flex items-center gap-2 px-4 py-2 hover:bg-yellow-400 hover:text-black transition"
                  >
                    <Map size={16} /> Map Device
                  </Link>
                </li>
              </ul>
            </div>
          )}
        </div>
      </nav>

      {/* Status Dashboard */}
      <main className="px-4 py-10">
        <h2 className="text-lg font-bold mb-6 text-yellow-400 uppercase tracking-wide">
          Status Dashboard
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="bg-neutral-900 border border-yellow-400/30 rounded-xl p-6 flex flex-col justify-center items-center hover:shadow-[0_0_20px_rgba(250,204,21,0.5)] transition"
            >
              <div className="mb-2 text-yellow-400">{stat.icon}</div>
              <p className="font-semibold text-yellow-400 text-center">
                {stat.title}
              </p>
              <p className="text-2xl font-bold mt-2 text-white">{stat.value}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default DistributorDashboard;
