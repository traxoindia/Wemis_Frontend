import React, {
  useState,
  useEffect,
  useRef,
  useContext,
  useCallback,
} from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  FaTachometerAlt,
  FaBarcode,
  FaUsers,
  FaCogs,
  FaWallet,
  FaTools,
  FaBoxOpen,
  FaMapMarkedAlt,
  FaCalendarDay,
  FaSync,
  FaCheckCircle,
  FaClock,
  FaChevronDown,
  FaChartLine,
  FaTicketAlt, // New icon for Tickets
  FaPlus, // New icon for 'Raise Ticket' button
} from "react-icons/fa";
import { FiSettings, FiLogOut } from "react-icons/fi";
import { UserAppContext } from "../contexts/UserAppProvider";
import logo from '../Images/logo.png'
// Import the new modal component
import RaiseTicketModal from "./RaiseTicketModal"; // Assuming this path is correct

// --- Utility Components for a Clean Look (Unchanged) ---

// Elegant Dropdown Menu Link (Font size reduced to xs)
const DropdownLink = ({ to, children, onClick }) => ( // Added onClick prop
  <Link
    to={to}
    onClick={onClick} // Handle onClick for non-navigation links (like opening modal)
    className="block px-3 py-2 text-xs text-gray-300 hover:bg-yellow-500 hover:text-gray-900 transition-all duration-200 font-medium"
  >
    {children}
  </Link>
);

// Navigation Item with Dropdown Logic (Text and icon size small)
const NavDropdown = ({
  menuKey,
  title,
  icon,
  children,
  openMenu,
  toggleMenu,
}) => (
  <div className="relative">
    <button
      onClick={() => toggleMenu(menuKey)}
      className={`flex items-center gap-1 px-4 py-2 rounded-lg transition-all duration-200 ${
        // Padding adjusted for larger button
        openMenu === menuKey
          ? "bg-yellow-500 text-gray-900 shadow-md font-semibold"
          : "text-gray-200 hover:bg-gray-700/50 hover:text-yellow-400"
        }`}
      aria-expanded={openMenu === menuKey}
    >
      {React.cloneElement(icon, { className: "text-sm" })}
      <span className="text-xs font-medium">{title}</span>
      <FaChevronDown
        className={`w-2 h-2 ml-1 transform transition-transform duration-200 ${openMenu === menuKey ? "rotate-180" : "rotate-0"
          }`}
      />
    </button>
    {openMenu === menuKey && (
      <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 min-w-[10rem] bg-gray-800 border border-yellow-500 rounded-lg shadow-2xl z-20 overflow-hidden animate-fade-in-down">
        {children}
      </div>
    )}
  </div>
);

// Elegant Stat Card Component (Unchanged)
const StatCard = ({ label, value, icon, color, footerText }) => (
  <div className="relative bg-gray-800 p-5 rounded-xl shadow-2xl border-l-4 border-yellow-500 transition-transform duration-300 hover:scale-[1.03] hover:shadow-yellow-500/20">
    <div className={`flex items-center justify-between`}>
      <div className="flex flex-col">
        <p className="text-3xl font-extrabold text-white mb-1">{value}</p>
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
          {label}
        </h3>
      </div>
      <div className={`p-2 rounded-full bg-yellow-500/20 ${color}`}>
        {React.cloneElement(icon, { className: "text-xl" })}
      </div>
    </div>
    <p className="mt-3 text-xs text-gray-500 pt-3 border-t border-gray-700/50">
      {footerText}
    </p>
  </div>
);

// --- The Main Dashboard Component ---

const DealerDashboard = () => {
  const [openMenu, setOpenMenu] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false); // State for the new modal
  const navRef = useRef(null);
  const navigate = useNavigate();
  const { logout, user } = useContext(UserAppContext);

  // Example static data
  const [stats, setStats] = useState({
    technician: 2,
    deviceStock: 15,
    totalMapDevices: 87,
    todayMapDevices: 3,
    thisMonthDevices: 25,
    totalRenewalDevices: 45,
    totalRenewedDevices: 12,
    upcomingRenewDevices: 18,
  });

  const cardData = [
    {
      label: "Total Technicians",
      value: stats.technician,
      icon: <FaTools />,
      color: "text-blue-400",
      footerText: "View all team members",
    },
    
    {
      label: "Total Mapped Devices",
      value: stats.totalMapDevices,
      icon: <FaMapMarkedAlt />,
      color: "text-yellow-500",
      footerText: "Lifetime device count",
    },
    {
      label: "Today Mappings",
      value: stats.todayMapDevices,
      icon: <FaCalendarDay />,
      color: "text-green-400",
      footerText: `${stats.thisMonthDevices} this month`,
    },
    {
      label: "Renewal Due",
      value: stats.totalRenewalDevices,
      icon: <FaSync />,
      color: "text-red-500",
      footerText: `${stats.upcomingRenewDevices} expiring soon`,
    },
    {
      label: "Total Renewed",
      value: stats.totalRenewedDevices,
      icon: <FaCheckCircle />,
      color: "text-teal-400",
      footerText: "Successful renewals",
    },
    {
      label: "Wallet Balance",
      value: "₹ 5,000",
      icon: <FaWallet />,
      color: "text-green-500",
      footerText: "Click to recharge",
    },
    {
      label: "Device Rate",
      value: "₹ 1,200",
      icon: <FaCogs />,
      color: "text-indigo-400",
      footerText: "Product pricing structure",
    },
  ];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (navRef.current && !navRef.current.contains(event.target)) {
        setOpenMenu(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleMenu = useCallback(
    (menu) => {
      setOpenMenu(openMenu === menu ? null : menu);
    },
    [openMenu]
  );

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const handleTicketSubmit = (ticketData) => {
    // In a real application, you would send this data to an API
    console.log("New Ticket Submitted:", ticketData);
    // You might want to show a toast/notification here
    setIsModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* --- Navbar (Big and Elegant) --- */}
      <div
        ref={navRef}
        className="sticky top-0 z-30 bg-gradient-to-r from-yellow-400 via-black to-black  shadow-2xl shadow-gray-900/50"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            {/* LOGO (Changed to Traxo) */}
            <img
              src={logo} // 
              alt="MEMUS Logo"
              className="w-44 h-20 object-contain"
            />



            {/* NAV LINKS (Desktop - Font and icons small) */}
            <nav className="hidden md:flex items-center gap-2 text-xs">
              

              <NavDropdown
                menuKey="barcode"
                title="Barcode"
                icon={<FaBarcode />}
                openMenu={openMenu}
                toggleMenu={toggleMenu}
              >
                
                <DropdownLink to="/distributor/dealer/Barcode">
                  Barcode List
                </DropdownLink>
              </NavDropdown>

              <NavDropdown
                menuKey="members"
                title="Members"
                icon={<FaUsers />}
                openMenu={openMenu}
                toggleMenu={toggleMenu}
              >
                <DropdownLink to="/distributor/dealer/technicians">
                  Technicians
                </DropdownLink>
                
              </NavDropdown>

              <NavDropdown
                menuKey="device"
                title="Manage Device"
                icon={<FaCogs />}
                openMenu={openMenu}
                toggleMenu={toggleMenu}
              >
                <DropdownLink to="/distributor/dealer/map-device">Map Device</DropdownLink>
               
              </NavDropdown>

              {/* UPDATED: Ticket Dropdown - Removed Raise Ticket Link */}
              <NavDropdown
                menuKey="tickets"
                title="Tickets"
                icon={<FaTicketAlt />}
                openMenu={openMenu}
                toggleMenu={toggleMenu}
              >
                <DropdownLink to="/dealer/tickets">Ticket List</DropdownLink>
              </NavDropdown>
            </nav>

            {/* Right Side - Actions & Profile */}
            <div className="flex items-center gap-3">
              {/* PRIMARY ACTION: Raise Ticket Button (Still opens modal) */}
              <button
                onClick={() => setIsModalOpen(true)}
                className="hidden sm:flex items-center bg-green-600 text-white px-3 py-1 rounded-full font-bold text-xs shadow-lg hover:bg-green-500 transition-colors duration-150"
              >
                <FaPlus className="text-xs mr-1" /> Raise Ticket
              </button>

              {/* Wallet Dropdown (Icon Only) */}
              <NavDropdown
                menuKey="wallet"
                title=""
                icon={<FaWallet />}
                openMenu={openMenu}
                toggleMenu={toggleMenu}
              >
                <DropdownLink to="/dealer/wallet">Balance</DropdownLink>
                <DropdownLink to="/dealer/wallet-history">History</DropdownLink>
              </NavDropdown>

              {/* Settings Icon (Size small) */}
              <Link
                to="/dealer/settings"
                className="text-gray-400 text-xl p-1.5 rounded-full hover:bg-gray-800 hover:text-yellow-500 transition-colors duration-200"
                aria-label="Settings"
              >
                <FiSettings />
              </Link>

              {/* Profile & Logout */}
              <div className="flex items-center gap-2">
                <span className="hidden lg:inline font-medium text-xs text-yellow-400">
                  {user?.name || "RAHUL PRADHAN"}
                </span>
                <div className="relative group">
                  <img
                    src="https://i.pravatar.cc/32?img=1"
                    alt="profile"
                    className="rounded-full w-8 h-8 border-2 border-yellow-500 cursor-pointer object-cover shadow-lg"
                  />
                </div>
                <button
                  onClick={handleLogout}
                  className="bg-red-600 text-white px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1 hover:bg-red-500 transition-colors duration-200 shadow-md"
                >
                  <FiLogOut className="text-sm" />
                  <span className="hidden md:inline">Logout</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- Dashboard Content Area --- */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        <header className="flex justify-between items-center mb-8 pb-3 border-b border-gray-800">
          <h1 className="text-2xl md:text-3xl font-extrabold text-white">
            Dashboard <span className="text-yellow-500">Summary</span>
          </h1>
          <p className="text-xs text-gray-400 hidden sm:block">
            Last updated:{" "}
            <span className="font-semibold">
              {new Date().toLocaleTimeString()}
            </span>
          </p>
        </header>

        {/* Card Grid Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {cardData.map((card, index) => (
            <StatCard
              key={index}
              label={card.label}
              value={card.value}
              icon={card.icon}
              color={card.color}
              footerText={card.footerText}
            />
          ))}
        </div>

        {/* --- Secondary Data Section (2-Column Layout) --- */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Recent Activities/Log */}
          <div className="lg:col-span-2 bg-gray-800 p-5 rounded-xl shadow-2xl">
            <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
              <FaChartLine className="text-sm text-yellow-500" /> Activity Log
            </h2>
            <div className="space-y-3">
              {[
                {
                  action: "Device #XYS900 Mapped",
                  detail: "Technician A",
                  time: "2 min ago",
                  color: "text-green-400",
                },
                {
                  action: "Wallet Top-up Success",
                  detail: "₹1,000 added",
                  time: "1 hour ago",
                  color: "text-yellow-500",
                },
                {
                  action: "Renewal Due Reminder",
                  detail: "Device #A34B12",
                  time: "3 hours ago",
                  color: "text-red-400",
                },
                {
                  action: "New Dealer Registered",
                  detail: "Dealer ID 789",
                  time: "Yesterday",
                  color: "text-blue-400",
                },
                {
                  action: "Device #QRZ345 Mapped",
                  detail: "Technician B",
                  time: "Yesterday",
                  color: "text-green-400",
                },
              ].map((item, i) => (
                <div
                  key={i}
                  className="flex justify-between items-center py-1.5 border-b border-gray-700 hover:bg-gray-700/50 px-2 -mx-2 rounded-md transition-colors"
                >
                  <span className={`text-sm font-medium ${item.color}`}>
                    {item.action}
                  </span>
                  <div className="text-right">
                    <span className="block text-xs text-gray-300">
                      {item.detail}
                    </span>
                    <span className="block text-xs text-gray-500">
                      {item.time}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <button className="mt-4 text-xs text-yellow-500 hover:text-yellow-400 font-medium transition-colors duration-200">
              View Full History &rarr;
            </button>
          </div>

          {/* Quick Links/Help Card */}
          <div className="bg-gray-800 p-5 rounded-xl shadow-2xl flex flex-col justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <FaTools className="text-sm text-yellow-500" /> Quick Tools
              </h2>
              <div className="space-y-3">
                <Link
                  to="/dealer/renewal-list"
                  className="w-full inline-flex items-center justify-center px-3 py-2 border border-yellow-500 text-xs font-bold rounded-lg text-yellow-500 bg-gray-900 hover:bg-yellow-500 hover:text-gray-900 transition-colors shadow-lg"
                >
                  <FaClock className="mr-2" /> View Renewal Status
                </Link>
                <Link
                  to="/dealer/add-technician"
                  className="w-full inline-flex items-center justify-center px-3 py-2 border border-transparent text-xs font-bold rounded-lg shadow-sm text-white bg-green-600 hover:bg-green-700 transition-colors"
                >
                  <FaUsers className="mr-2" /> Add New Technician
                </Link>
                <Link
                  to="/dealer/wallet"
                  className="w-full inline-flex items-center justify-center px-3 py-2 border border-transparent text-xs font-bold rounded-lg shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
                >
                  <FaWallet className="mr-2" /> Recharge Wallet
                </Link>
                {/* Link to new ticket list page */}
                <Link
                  to="/dealer/tickets"
                  className="w-full inline-flex items-center justify-center px-3 py-2 border border-transparent text-xs font-bold rounded-lg shadow-sm text-white bg-purple-600 hover:bg-purple-700 transition-colors"
                >
                  <FaTicketAlt className="mr-2" /> My Ticket Status
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- Footer (Simple and Dark) --- */}
      <footer className="mt-8 py-3 border-t border-gray-800 text-center text-xs text-gray-600">
        &copy; {new Date().getFullYear()} Traxo. All rights reserved. | Dealer
        Panel v1.2
      </footer>

      {/* Ticket Creation Modal */}
      {isModalOpen && (
        <RaiseTicketModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleTicketSubmit}
        />
      )}
    </div>
  );
};

export default DealerDashboard;