

// ManufactureNavbar.jsx
import logo from '../Images/logo.png'
import React, { useState, useRef, useEffect, useContext } from "react";
import {
  Search,
  ChevronDown,
  Settings,
  LayoutDashboard,
  FileText,
  QrCode,
  CreditCard,
  Users2,
  Cpu,
  PackageCheck,
  QrCodeIcon,
  RotateCcw,
  RefreshCw,
  Box,
  LogOut,
  Menu,
  X,
  User,
} from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { UserAppContext } from "../contexts/UserAppProvider";

const ManufactureNavbar = ({ activeRoute: propActiveRoute, setActiveRoute: propSetActiveRoute }) => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Use local state if props aren't provided
  const [localActiveRoute, setLocalActiveRoute] = useState(location.pathname);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [isDealerModalOpen, setIsDealerModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchActive, setIsSearchActive] = useState(false);
  const navRef = useRef(null);

  const { logout } = useContext(UserAppContext);

  // Use props if provided, otherwise use local state
  const activeRoute = propActiveRoute !== undefined ? propActiveRoute : localActiveRoute;
  const setActiveRoute = propSetActiveRoute !== undefined ? propSetActiveRoute : setLocalActiveRoute;

  // ✅ Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (navRef.current && !navRef.current.contains(event.target)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ✅ Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setOpenDropdown(null);
  }, [activeRoute]);

  // Update active route when location changes
  useEffect(() => {
    setActiveRoute(location.pathname);
  }, [location.pathname, setActiveRoute]);

  // ✅ Menu definition with routes
  const menuItems = [
    {
      name: "Dashboard",
      icon: <LayoutDashboard className="w-5 h-5" />,
      dropdown: [
        { name: "Status Dashboard", route: "/dashboard/status" },
        { name: "CCC Dashboard", route: "/dashboard/ccc" },
        { name: "Monitoring Dashboard", route: "/dashboard/monitoring" },
      ],
    },
    { 
      name: "Reports", 
      icon: <FileText className="w-5 h-5" />, 
      route: "/reports"
    },
    {
      name: "Barcode",
      icon: <QrCode className="w-5 h-5" />,
      dropdown: [
        {
          name: "Manage Barcode",
          route: "/barcode/manage",
          icon: <PackageCheck className="w-4 h-4" />,
        },
        {
          name: "Allocate Barcode",
          route: "/barcode/allocate",
          icon: <QrCodeIcon className="w-4 h-4" />,
        },
        {
          name: "Rollback Barcode",
          route: "/barcode/rollback",
          icon: <RotateCcw className="w-4 h-4" />,
        },
        {
          name: "Renewal Allocation",
          route: "/barcode/renewal",
          icon: <RefreshCw className="w-4 h-4" />,
        },
        {
          name: "Manage Accessories",
          route: "/barcode/accessories",
          icon: <Box className="w-4 h-4" />,
        },
      ],
    },
    { 
      name: "Subscription", 
      icon: <CreditCard className="w-5 h-5" />, 
      route: "/subscription"
    },
    {
      name: "Members",
      icon: <Users2 className="w-5 h-5" />,
      dropdown: [
        { name: "Distributors", route: "/members/distributors" },
        { name: "OEM", route: "/members/oem" },
        { name: "Technician", route: "/members/technician" },
        { name: "Dealer", customModal: "dealer" },
      ],
    },
    {
      name: "Manage Device",
      icon: <Cpu className="w-5 h-5" />,
      dropdown: [{ name: "Map Device", route: "/manage-device" }],
    },
  ];

  const toggleDropdown = (name) => {
    setOpenDropdown(openDropdown === name ? null : name);
  };

  const handleLogout = () => {
    logout();
    setIsMobileMenuOpen(false);
  };

  const handleNavItemClick = (item) => {
    if (item.customModal === "dealer") {
      setIsDealerModalOpen(true);
    } else if (item.dropdown) {
      toggleDropdown(item.name);
    } else if (item.route) {
      setActiveRoute(item.route);
      navigate(item.route);
      if (isMobileMenuOpen) setIsMobileMenuOpen(false);
    }
  };

  return (
    <header className="bg-gradient-to-r from-yellow-400 via-black to-black border-b border-yellow-500/40 sticky top-0 z-50">
      {/* Top Header */}
      <div className="px-4 py-3 md:px-6 md:py-4 flex items-center justify-between">
        {/* Left: Logo & Mobile Menu Toggle */}
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden text-yellow-400 p-2 hover:bg-black/30 rounded-lg"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>

          <div className="flex items-center">
            <img
              src={logo}
              alt="MEMUS Logo"
              className="w-32 h-14 md:w-44 md:h-20 object-contain"
            />
          </div>
        </div>

        {/* Desktop Search Bar */}
        <div className="hidden md:flex flex-1 max-w-md mx-6">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search..."
              className="w-full pl-10 pr-4 py-2 bg-black/50 border border-yellow-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500"
            />
          </div>
        </div>

        {/* Right: Actions & User Info */}
        <div className="flex items-center space-x-3 md:space-x-6">
          {/* Mobile Search Toggle */}
          <button
            onClick={() => setIsSearchActive(!isSearchActive)}
            className="md:hidden text-yellow-400 p-2 hover:bg-black/30 rounded-lg"
          >
            <Search className="w-5 h-5" />
          </button>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-4">
            <Link
              to="/tickets/all"
              className="bg-yellow-500 hover:bg-yellow-400 text-black px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Tickets
            </Link>

            <Link
              to="/wallet"
              className="flex items-center space-x-1 text-yellow-400 hover:text-yellow-300 transition-colors"
            >
              <span className="font-medium">Wallet</span>
              <ChevronDown className="w-4 h-4" />
            </Link>

            <button className="flex items-center space-x-1 text-yellow-400 hover:text-yellow-300 transition-colors">
              <Settings className="w-5 h-5" />
              <span className="hidden lg:inline">Settings</span>
            </button>
          </div>

          {/* User Profile */}
          <div className="flex items-center space-x-3">
            <div className="hidden md:flex flex-col items-end">
              <span className="font-medium text-sm text-white">MRUTYUNJAY PRADHAN</span>
              <span className="text-xs text-gray-300">Manufacturer</span>
            </div>
            <div className="relative group">
              <div className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center cursor-pointer hover:bg-yellow-400 transition-colors">
                <User className="w-5 h-5 text-black" />
              </div>
              {/* User Dropdown */}
              <div className="absolute right-0 top-full mt-2 hidden group-hover:block bg-gray-900 border border-yellow-500/30 rounded-lg shadow-xl min-w-[180px] z-50">
                <div className="p-3 border-b border-gray-700">
                  <p className="font-medium text-white">Mrutyunjay Pradhan</p>
                  <p className="text-sm text-gray-400">admin@memus.com</p>
                </div>
                <Link
                  to="/profile"
                  className="flex items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:bg-yellow-500 hover:text-black transition-colors"
                >
                  <User className="w-4 h-4" />
                  My Profile
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-400 hover:bg-red-600 hover:text-white transition-colors rounded-b-lg"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Search Bar */}
      {isSearchActive && (
        <div className="md:hidden px-4 py-3 border-t border-yellow-500/20">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search..."
              className="w-full pl-10 pr-4 py-2 bg-black/50 border border-yellow-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500"
              autoFocus
            />
          </div>
        </div>
      )}

      {/* Desktop Navigation */}
      <div ref={navRef} className="hidden lg:block px-6 pb-4">
        <div className="flex justify-center gap-8">
          {menuItems.map((item) => (
            <div key={item.name} className="relative group">
              {/* Main Nav Item - Use Link for direct routes, button for dropdowns */}
              {item.route && !item.dropdown ? (
                <Link
                  to={item.route}
                  onClick={() => {
                    setActiveRoute(item.route);
                  }}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${activeRoute === item.route
                    ? "bg-yellow-500 text-black"
                    : "text-gray-100 hover:text-yellow-300 hover:bg-black/30"
                    }`}
                >
                  {item.icon}
                  <span className="font-medium">{item.name}</span>
                </Link>
              ) : (
                <button
                  onClick={() => handleNavItemClick(item)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${activeRoute === item.route || (item.dropdown && item.dropdown.some(sub => sub.route === activeRoute))
                    ? "bg-yellow-500 text-black"
                    : "text-gray-100 hover:text-yellow-300 hover:bg-black/30"
                    }`}
                >
                  {item.icon}
                  <span className="font-medium">{item.name}</span>
                  {item.dropdown && (
                    <ChevronDown className={`w-4 h-4 transition-transform ${openDropdown === item.name ? "rotate-180" : ""}`} />
                  )}
                </button>
              )}

              {/* Dropdown */}
              {item.dropdown && (
                <div className={`absolute left-0 top-full mt-1 bg-gray-900 border border-yellow-500/30 rounded-lg shadow-xl min-w-[220px] z-40 transition-all duration-200 ${openDropdown === item.name
                  ? "opacity-100 visible translate-y-0"
                  : "opacity-0 invisible -translate-y-2 pointer-events-none"
                  }`}
                >
                  {item.dropdown.map((sub) =>
                    sub.customModal === "dealer" ? (
                      <button
                        key={sub.name}
                        onClick={() => {
                          setIsDealerModalOpen(true);
                          setOpenDropdown(null);
                        }}
                        className="flex items-center gap-2 w-full px-4 py-3 text-sm text-gray-300 hover:bg-yellow-500 hover:text-black transition-colors first:rounded-t-lg last:rounded-b-lg"
                      >
                        {sub.icon}
                        {sub.name}
                      </button>
                    ) : (
                      <Link
                        key={sub.name}
                        to={sub.route}
                        onClick={() => {
                          setActiveRoute(sub.route);
                          setOpenDropdown(null);
                        }}
                        className={`flex items-center gap-2 px-4 py-3 text-sm transition-colors first:rounded-t-lg last:rounded-b-lg ${activeRoute === sub.route
                          ? "bg-yellow-500 text-black"
                          : "text-gray-300 hover:bg-yellow-500 hover:text-black"
                          }`}
                      >
                        {sub.icon}
                        {sub.name}
                      </Link>
                    )
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      <div
        className={`lg:hidden fixed inset-y-0 left-0 w-64 bg-gray-900 border-r border-yellow-500/30 transform transition-transform duration-300 ease-in-out z-50 ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
          }`}
      >
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <img
              src={logo}
              alt="MEMUS Logo"
              className="w-32 h-14 object-contain"
            />
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-yellow-400 p-2 hover:bg-black/30 rounded-lg"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="flex items-center space-x-3 p-3 bg-black/50 rounded-lg">
            <div className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-black" />
            </div>
            <div>
              <p className="font-medium text-white text-sm">MRUTYUNJAY PRADHAN</p>
              <p className="text-xs text-gray-400">Manufacturer</p>
            </div>
          </div>
        </div>

        <div className="p-4 space-y-2 overflow-y-auto h-[calc(100vh-180px)]">
          {/* Mobile Actions */}
          <div className="space-y-2 mb-4">
            <Link
              to="/tickets/all"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center justify-center gap-2 bg-yellow-500 text-black px-4 py-3 rounded-lg font-medium"
            >
              Tickets
            </Link>
            <Link
              to="/wallet"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center justify-between text-yellow-400 hover:text-yellow-300 p-3 rounded-lg hover:bg-black/30"
            >
              <span>Wallet</span>
              <ChevronDown className="w-4 h-4" />
            </Link>
            <button className="flex items-center justify-between text-yellow-400 hover:text-yellow-300 w-full p-3 rounded-lg hover:bg-black/30">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                <span>Settings</span>
              </div>
            </button>
          </div>

          {/* Mobile Menu Items */}
          <div className="space-y-1">
            {menuItems.map((item) => (
              <div key={item.name} className="border-b border-gray-800 last:border-0">
                {/* For items with direct routes (Reports, Subscription) */}
                {item.route && !item.dropdown ? (
                  <Link
                    to={item.route}
                    onClick={() => {
                      setActiveRoute(item.route);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`flex items-center justify-between w-full p-3 rounded-lg transition-colors ${activeRoute === item.route
                      ? "bg-yellow-500 text-black"
                      : "text-gray-100 hover:bg-black/30"
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      {item.icon}
                      <span className="font-medium">{item.name}</span>
                    </div>
                  </Link>
                ) : (
                  // For items with dropdowns
                  <button
                    onClick={() => handleNavItemClick(item)}
                    className={`flex items-center justify-between w-full p-3 rounded-lg transition-colors ${activeRoute === item.route || (item.dropdown && item.dropdown.some(sub => sub.route === activeRoute))
                      ? "bg-yellow-500 text-black"
                      : "text-gray-100 hover:bg-black/30"
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      {item.icon}
                      <span className="font-medium">{item.name}</span>
                    </div>
                    {item.dropdown && (
                      <ChevronDown className={`w-4 h-4 transition-transform ${openDropdown === item.name ? "rotate-180" : ""}`} />
                    )}
                  </button>
                )}

                {/* Mobile Dropdown */}
                {item.dropdown && openDropdown === item.name && (
                  <div className="ml-4 pl-4 border-l border-yellow-500/20 space-y-1 my-2">
                    {item.dropdown.map((sub) =>
                      sub.customModal === "dealer" ? (
                        <button
                          key={sub.name}
                          onClick={() => {
                            setIsDealerModalOpen(true);
                            setOpenDropdown(null);
                            setIsMobileMenuOpen(false);
                          }}
                          className="flex items-center gap-3 w-full p-3 text-sm text-gray-300 hover:bg-yellow-500 hover:text-black rounded-lg transition-colors"
                        >
                          {sub.icon}
                          {sub.name}
                        </button>
                      ) : (
                        <Link
                          key={sub.name}
                          to={sub.route}
                          onClick={() => {
                            setActiveRoute(sub.route);
                            setOpenDropdown(null);
                            setIsMobileMenuOpen(false);
                          }}
                          className={`flex items-center gap-3 p-3 text-sm rounded-lg transition-colors ${activeRoute === sub.route
                            ? "bg-yellow-500 text-black"
                            : "text-gray-300 hover:bg-yellow-500 hover:text-black"
                            }`}
                        >
                          {sub.icon}
                          {sub.name}
                        </Link>
                      )
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Logout in Mobile Menu */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full p-3 text-red-400 hover:bg-red-600 hover:text-white rounded-lg transition-colors mt-4"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/70 z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* ✅ Dealer Modal */}
      {isDealerModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div 
            className="bg-gray-900 p-6 rounded-xl w-full max-w-md border border-yellow-500/40"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold text-yellow-400 mb-6 text-center">
              Dealer Options
            </h2>
            <div className="flex flex-col gap-3">
              <Link
                to="/members/dealer-distributor"
                onClick={() => {
                  setIsDealerModalOpen(false);
                  setActiveRoute("/members/dealer-distributor");
                }}
                className="px-6 py-3 bg-yellow-500 text-black rounded-lg hover:bg-yellow-400 transition-colors font-medium text-center"
              >
                Under Distributor
              </Link>
              <Link
                to="/members/dealer-oem"
                onClick={() => {
                  setIsDealerModalOpen(false);
                  setActiveRoute("/members/dealer-oem");
                }}
                className="px-6 py-3 bg-yellow-500 text-black rounded-lg hover:bg-yellow-400 transition-colors font-medium text-center"
              >
                Under OEM
              </Link>
            </div>
            <button
              onClick={() => setIsDealerModalOpen(false)}
              className="w-full mt-6 px-4 py-2 bg-gray-800 text-gray-200 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

export default ManufactureNavbar;