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
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { UserAppContext } from "../contexts/UserAppProvider";

const ManufactureNavbar = ({ activeRoute, setActiveRoute }) => {
  const [openDropdown, setOpenDropdown] = useState(null);
  const [isDealerModalOpen, setIsDealerModalOpen] = useState(false);
  const navRef = useRef(null);
  const navigate = useNavigate();

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

  // ✅ Logout handler

  const { logout } = useContext(UserAppContext);


  // ✅ Menu definition with routes
  const menuItems = [
    {
      name: "Dashboard",
      icon: <LayoutDashboard />,
      dropdown: [
        { name: "Status Dashboard", route: "/dashboard/status" },
        { name: "CCC Dashboard", route: "/dashboard/ccc" },
        { name: "Monitoring Dashboard", route: "/dashboard/monitoring" },
      ],
    },
    { name: "Reports", icon: <FileText />, route: "/reports" },
    {
      name: "Barcode",
      icon: <QrCode />,
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
    { name: "Subscription", icon: <CreditCard />, route: "/subscription" },
    {
      name: "Members",
      icon: <Users2 />,
      dropdown: [
        { name: "Distributors", route: "/members/distributors" },
        { name: "OEM", route: "/members/oem" },
        { name: "Technician", route: "/members/technician" },
        { name: "Dealer", customModal: "dealer" },
        // ✅ opens Dealer Modal
      ],
    },

    {
      name: "Manage Device",
      icon: <Cpu />,
      dropdown: [{ name: "Map Device", route: "/manage-device" }],
    },
  ];

  const toggleDropdown = (name) => {
    setOpenDropdown(openDropdown === name ? null : name);
  };

  return (
    <header className="bg-gradient-to-r from-yellow-400 via-black to-black border-b border-yellow-500/40
">
      {/* Top Header */}
      <div className="px-6 py-4 flex flex-col lg:flex-row items-center justify-between">
        {/* Left */}
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2">
            <img
              src={logo} // 
              alt="MEMUS Logo"
              className="w-44 h-20 object-contain"
            />
           
          </div>

          <div className="hidden md:flex items-center space-x-4 text-gray-400">
           
          </div>
        </div>


        {/* Right */}
        <div className="flex items-center space-x-6 mt-4 lg:mt-0">
          <button className="bg-yellow-500 text-black px-4 py-2 rounded-lg text-sm font-medium">
            Product
          </button>
          <div className="flex items-center space-x-2 cursor-pointer">
            <div className="w-5 h-5 bg-yellow-500 rounded"></div>
            <span className="text-yellow-400 font-medium">Wallet</span>
            <ChevronDown className="w-4 h-4 text-yellow-400" />
          </div>
          <div className="flex items-center space-x-2 cursor-pointer">
            <Settings className="w-5 h-5 text-yellow-400" />
            <span className="text-yellow-400">Settings</span>
          </div>
          <div className="flex items-center space-x-3">
            <span className="font-medium">MRUTYUNJAY PRADHAN</span>
            <div className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center">
              <span className="text-black font-bold">M</span>
            </div>
          </div>
          {/* ✅ Logout Button */}
          <button
            onClick={logout}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-lg transition"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav ref={navRef} className="px-6 pb-4">
        <div className="flex flex-wrap justify-center lg:justify-center gap-10 mt-12 pb-6">
          {menuItems.map((item) => (
            <div key={item.name} className="relative flex flex-col items-center">
              {/* Main Nav Item */}
              <div
                onClick={() => {
                  if (item.customModal === "dealer") {
                    setIsDealerModalOpen(true);
                  } else if (item.dropdown) {
                    toggleDropdown(item.name);
                  } else {
                    setActiveRoute(item.route);
                  }
                }}
                className={`flex flex-col items-center cursor-pointer transition ${activeRoute === item.route
                    ? "text-yellow-400"
                    : "text-gray-100 hover:text-yellow-300"
                  }`}
              >
                <div className="w-8 h-8 mb-1">{item.icon}</div>
                <span className="text-sm font-medium flex items-center gap-1">
                  {item.dropdown ? (
                    <>
                      {item.name}
                      <ChevronDown
                        className={`w-4 h-4 transition-transform duration-200 ${openDropdown === item.name
                            ? "rotate-180 text-yellow-400"
                            : "text-gray-400"
                          }`}
                      />
                    </>
                  ) : (
                    <Link to={item.route}>{item.name}</Link>
                  )}
                </span>
              </div>

              {/* Dropdown if exists */}
              {item.dropdown && openDropdown === item.name && (
                <div className="absolute top-full mt-2 bg-[#111] border border-yellow-500/40 rounded-lg shadow-lg min-w-[200px] z-50">
                  {item.dropdown.map((sub) =>
                    sub.customModal === "dealer" ? (
                      <button
                        key={sub.name}
                        onClick={() => {
                          setIsDealerModalOpen(true);
                          setOpenDropdown(null);
                        }}
                        className="block w-full text-left px-4 py-2 text-sm rounded transition text-gray-300 hover:bg-yellow-500 hover:text-black"
                      >
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
                        className={`flex items-center gap-2 px-4 py-2 text-sm rounded transition ${activeRoute === sub.route
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
      </nav>

      {/* ✅ Dealer Modal with only 2 options */}
      {isDealerModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-gray-900 p-6 rounded-xl w-[400px] border border-yellow-500 text-center">
            <h2 className="text-xl font-bold text-yellow-400 mb-6">
              Dealer Options
            </h2>
            <div className="flex flex-col gap-4">
              <Link
                to="/members/dealer-distributor"
                onClick={() => {
                  setIsDealerModalOpen(false);
                  setActiveRoute("/members/dealer-distributor");
                }}
                className="px-6 py-3 bg-yellow-500 text-black rounded-lg hover:bg-yellow-400 transition"
              >
                Under Distributor
              </Link>
              <Link
                to="/members/dealer-oem"
                onClick={() => {
                  setIsDealerModalOpen(false);
                  setActiveRoute("/members/dealer-oem");
                }}
                className="px-6 py-3 bg-yellow-500 text-black rounded-lg hover:bg-yellow-400 transition"
              >
                Under OEM
              </Link>
            </div>
            <button
              onClick={() => setIsDealerModalOpen(false)}
              className="mt-6 px-4 py-2 bg-gray-700 text-gray-200 rounded-lg hover:bg-gray-600"
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
