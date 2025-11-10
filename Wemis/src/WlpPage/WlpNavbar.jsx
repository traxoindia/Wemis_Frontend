import React, { useContext, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useLocation } from "react-router-dom";
import {
  MdDashboard,
  MdWidgets,
  MdKeyboardArrowDown,
  MdPeople,
  MdPersonAdd,
  MdAssignmentTurnedIn,
} from "react-icons/md";
import { UserAppContext } from "../contexts/UserAppProvider";

const WlpNavbar = () => {
  const [isClientDropdownOpen, setIsClientDropdownOpen] = useState(false);
  const [isDealerDropdownOpen, setIsDealerDropdownOpen] = useState(false);
  const location = useLocation();
  const { logout } = useContext(UserAppContext);

  const navLinks = [
    { name: "Dashboard", icon: <MdDashboard />, path: "/wlp/dashboard" },
  ];

  const clientLinks = [
    { name: "Element List", icon: <MdPeople />, path: "/wlp/Element-List" },
    { name: "Assign Elements", icon: <MdWidgets />, path: "/wlp/assign-element" },
  ];

  const dealerLinks = [
    { name: "Create Manufacture", icon: <MdPersonAdd />, path: "/wlp/createmanufacture" },
    { name: "Manufacture List", icon: <MdAssignmentTurnedIn />, path: "/wlp/manufacturelist" },
  ];

  const dropdownVariants = {
    hidden: { opacity: 0, y: -10 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -5 },
  };

  return (
    <div className="w-full bg-black/90 backdrop-blur-md shadow-lg fixed top-0 left-0 z-50 border-b border-yellow-500/30">
      {/* Header */}
      <header className="flex items-center justify-between px-8 py-4">
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-3xl font-extrabold text-yellow-400 tracking-widest"
        >
          Traxo 
        </motion.div>

        {/* Profile Section */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center space-x-4"
        >
          <div className="flex items-center gap-4 bg-gray-800/70 px-5 py-2 rounded-full border border-yellow-500/40 shadow-md hover:shadow-yellow-400/20 transition duration-300">
            {/* Profile Image */}
            <img
              src="https://via.placeholder.com/40"
              alt="Profile"
              className="w-10 h-10 rounded-full border-2 border-yellow-400 hover:scale-110 transition duration-300"
            />

            {/* Logout Button */}
            <button
              onClick={logout}
              className="px-5 py-1.5 text-sm font-semibold text-black bg-yellow-400 rounded-full hover:bg-yellow-300 transition-all duration-300 shadow-md hover:shadow-yellow-400/30"
            >
              Logout
            </button>
          </div>
        </motion.div>
      </header>

      {/* Navigation */}
      <nav className="flex justify-center space-x-10 py-3 text-gray-300 font-medium">
        {navLinks.map((link) => (
          <Link
            key={link.name}
            to={link.path}
            className={`flex items-center gap-2 px-3 py-2 relative group ${
              location.pathname === link.path ? "text-yellow-400" : ""
            }`}
          >
            <span className="text-xl">{link.icon}</span>
            {link.name}
            <span className="absolute bottom-0 left-0 w-0 h-[2px] bg-yellow-400 group-hover:w-full transition-all duration-300"></span>
          </Link>
        ))}

        {/* Clients Dropdown */}
        <div
          className="relative"
          onMouseEnter={() => setIsClientDropdownOpen(true)}
          onMouseLeave={() => setIsClientDropdownOpen(false)}
        >
          <button
            className={`flex items-center gap-2 px-3 py-2 ${
              isClientDropdownOpen ? "text-yellow-400" : "hover:text-yellow-400"
            }`}
          >
            <MdPeople className="text-xl" /> Elements
            <MdKeyboardArrowDown className="text-xl" />
          </button>

          <AnimatePresence>
            {isClientDropdownOpen && (
              <motion.div
                variants={dropdownVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                transition={{ duration: 0.25 }}
                className="absolute top-full left-0 mt-2 bg-black text-gray-300 border border-yellow-500/30 w-56 py-2 z-50"
              >
                {clientLinks.map((item, index) => (
                  <Link
                    key={index}
                    to={item.path}
                    className="flex items-center gap-3 px-5 py-2 hover:bg-yellow-400 hover:text-black transition duration-300 border-b border-gray-800 last:border-b-0"
                  >
                    <span className="text-lg">{item.icon}</span> {item.name}
                  </Link>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Dealer Dropdown */}
        <div
          className="relative"
          onMouseEnter={() => setIsDealerDropdownOpen(true)}
          onMouseLeave={() => setIsDealerDropdownOpen(false)}
        >
          <button
            className={`flex items-center gap-2 px-3 py-2 ${
              isDealerDropdownOpen ? "text-yellow-400" : "hover:text-yellow-400"
            }`}
          >
            <MdPersonAdd className="text-xl" /> Onboard Manufacture
            <MdKeyboardArrowDown className="text-xl" />
          </button>

          <AnimatePresence>
            {isDealerDropdownOpen && (
              <motion.div
                variants={dropdownVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                transition={{ duration: 0.25 }}
                className="absolute top-full left-0 mt-2 bg-black text-gray-300 border border-yellow-500/30 w-56 py-2 z-50"
              >
                {dealerLinks.map((item, index) => (
                  <Link
                    key={index}
                    to={item.path}
                    className="flex items-center gap-3 px-5 py-2 hover:bg-yellow-400 hover:text-black transition duration-300 border-b border-gray-800 last:border-b-0"
                  >
                    <span className="text-lg">{item.icon}</span> {item.name}
                  </Link>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </nav>
    </div>
  );
};

export default WlpNavbar;
