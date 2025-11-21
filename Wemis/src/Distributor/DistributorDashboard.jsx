import React, { useState, useRef, useEffect, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import logo from '../Images/logo.png'
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
  Menu, // Added Menu icon for small screen
  X,    // Added X icon for small screen
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); // New state for mobile menu
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

  const MobileNavLinks = ({ isMobile }) => (
    <>
      {/* Dashboard */}
      <Link
        to="/distibutor/dashboard"
        className={`flex items-center gap-2 text-yellow-400 hover:text-white font-semibold uppercase tracking-wide ${isMobile ? 'py-2 px-4 border-b border-yellow-400/20' : ''}`}
        onClick={() => setIsMobileMenuOpen(false)}
      >
        <LayoutDashboard size={18} /> Dashboard
      </Link>

      {/* Barcode Dropdown */}
      <div className="relative">
        <div
          className={`flex items-center justify-between gap-2 cursor-pointer text-yellow-400 hover:text-white font-semibold uppercase tracking-wide ${isMobile ? 'py-2 px-4 border-b border-yellow-400/20' : ''}`}
          onClick={() => toggleMenu("barcode")}
        >
          <div className="flex items-center gap-2">
            <Barcode size={18} /> Barcode
          </div>
          {openMenu === "barcode" ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
        {openMenu === "barcode" && (
          <div className={`bg-neutral-900 ${isMobile ? 'static w-full' : 'absolute top-10 left-0 rounded-md w-56 shadow-lg z-20 border border-yellow-400/30'}`}>
            <ul className="text-sm text-yellow-300">
              <li>
                <Link
                  to="/distributor/barcode"
                  className="flex items-center gap-2 px-4 py-2 hover:bg-yellow-400 hover:text-black transition"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <QrCode size={16} /> Barcode
                </Link>
              </li>
              <li>
                <Link
                  to="/distributor/allocate-barcode"
                  className="flex items-center gap-2 px-4 py-2 hover:bg-yellow-400 hover:text-black transition"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <ArrowUpRight size={16} /> Allocate Barcode
                </Link>
              </li>
              <li>
                <Link
                  to="/distributor/rollback-barcode"
                  className="flex items-center gap-2 px-4 py-2 hover:bg-yellow-400 hover:text-black transition"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <RotateCcw size={16} /> Rollback Barcode
                </Link>
              </li>
              <li>
                <Link
                  to="/distributor/renewal-allocation"
                  className="flex items-center gap-2 px-4 py-2 hover:bg-yellow-400 hover:text-black transition"
                  onClick={() => setIsMobileMenuOpen(false)}
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
          className={`flex items-center justify-between gap-2 cursor-pointer text-yellow-400 hover:text-white font-semibold uppercase tracking-wide ${isMobile ? 'py-2 px-4 border-b border-yellow-400/20' : ''}`}
          onClick={() => toggleMenu("members")}
        >
          <div className="flex items-center gap-2">
            <Users size={18} /> Members
          </div>
          {openMenu === "members" ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
        {openMenu === "members" && (
          <div className={`bg-neutral-900 ${isMobile ? 'static w-full' : 'absolute top-10 left-0 rounded-md w-44 shadow-lg z-20 border border-yellow-400/30'}`}>
            <ul className="text-sm text-yellow-300">
              <li>
                <Link
                  to="/distributor/dealer"
                  className="flex items-center gap-2 px-4 py-2 hover:bg-yellow-400 hover:text-black transition"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Users size={16} /> Dealer
                </Link>
              </li>
            </ul>
          </div>
        )}
      </div>

      {/* Map Device Link (moved from Manage Device) */}
      <Link
        to="/distributor/map-device"
        className={`flex items-center gap-2 text-yellow-400 hover:text-white font-semibold uppercase tracking-wide ${isMobile ? 'py-2 px-4 border-b border-yellow-400/20' : ''}`}
        onClick={() => setIsMobileMenuOpen(false)}
      >
        <Map size={18} /> Map Device
      </Link>
    </>
  );

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Top Navbar */}
      <header className="flex flex-col md:flex-row justify-between items-center bg-gradient-to-r from-yellow-400 via-black to-black border-b border-yellow-500/40 px-4 py-2 md:py-0">
        <div className="flex justify-between items-center w-full md:w-auto">
          <div className="flex items-center gap-2">
            <img
              src={logo}
              alt="MEMUS Logo"
              className="w-32 h-16 md:w-44 md:h-20 object-contain"
            />
          </div>
          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-yellow-400 p-2"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Desktop & Mobile Top Bar Content */}
        <div className={`flex-col md:flex-row gap-2 md:gap-4 items-center w-full md:w-auto mt-2 md:mt-0 ${isMobileMenuOpen ? 'flex' : 'hidden md:flex'}`}>
          <div className="flex flex-wrap justify-center gap-2 w-full md:w-auto">
            <button className="flex-grow md:flex-grow-0 px-2 py-1 bg-yellow-400 text-black font-semibold rounded-md hover:bg-yellow-300 transition text-sm">
              Product
            </button>
            <button className="flex-grow md:flex-grow-0 px-2 py-1 bg-yellow-400 text-black font-semibold rounded-md hover:bg-yellow-300 transition text-sm">
              Wallet
            </button>
            <button className="flex-grow md:flex-grow-0 px-2 py-1 bg-neutral-800 text-yellow-400 font-semibold rounded-md hover:bg-yellow-400 hover:text-black transition text-sm flex items-center justify-center">
              <Settings size={14} className="inline mr-1" /> Settings
            </button>
          </div>
          <div className="flex items-center gap-2 py-1 w-full md:w-auto justify-center md:justify-start">
            <span className="font-semibold text-yellow-400 text-sm">SBT SOLUTIONS</span>
            <img
              src="https://i.pravatar.cc/40"
              alt="user"
              className="w-7 h-7 rounded-full border border-yellow-400"
            />
          </div>
          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="flex-grow md:flex-grow-0 px-4 py-1.5 bg-red-600 text-white font-semibold rounded-md hover:bg-red-500 transition flex items-center justify-center gap-1 w-full md:w-auto"
          >
            <LogOut size={16} /> Logout
          </button>
        </div>
      </header>

      {/* Navigation Bar */}
      <nav
        ref={navRef}
        className="relative bg-neutral-950 border-b border-yellow-400/30 px-6 py-3"
      >
        {/* Desktop Navigation */}
        <div className="hidden md:flex flex-wrap justify-center gap-6 lg:gap-10">
          <MobileNavLinks isMobile={false} />
        </div>

        {/* Mobile Navigation Dropdown */}
        {isMobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 w-full bg-neutral-950 border-t border-yellow-400/30 z-30">
            <MobileNavLinks isMobile={true} />
          </div>
        )}
      </nav>

      {/* Status Dashboard */}
      <main className="px-4 py-10">
        <h2 className="text-xl font-bold mb-6 text-yellow-400 uppercase tracking-wide border-b border-yellow-400/50 pb-2">
          Status Dashboard
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="bg-neutral-900 border border-yellow-400/30 rounded-xl p-6 flex flex-col justify-center items-center hover:shadow-[0_0_20px_rgba(250,204,21,0.5)] transition"
            >
              <div className="mb-2 text-yellow-400">{stat.icon}</div>
              <p className="font-semibold text-yellow-400 text-center text-sm sm:text-base">
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