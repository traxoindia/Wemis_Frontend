import React, { useState, useRef, useEffect, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
// Assuming you use react-icons for icon set
import { FaBarcode, FaUsers, FaCogs, FaTicketAlt, FaWallet, FaPlus, FaChevronDown, FaChevronUp } from "react-icons/fa";
import { FiSettings, FiLogOut } from "react-icons/fi"; 

// --- MOCK/PLACEHOLDER DEFINITIONS (Replace with your actual imports) ---
// Note: These definitions are here to make the component runnable.
// You should replace them with actual imports in your project.

// 1. Mock Logo Source (Replace with your actual path)
import logo from '../Images/logo.png'; 

// 2. Mock UserAppContext (Assuming it provides 'user' and 'logout')
const UserAppContext = React.createContext({
  user: { name: 'RAHUL PRADHAN (Distributor)' },
  logout: () => console.log('Mock Logout Called'),
});

// 3. Mock DropdownLink Component
const DropdownLink = ({ to, children, ...props }) => (
  <Link 
    to={to} 
    className="block px-4 py-2 text-sm text-gray-200 hover:bg-yellow-500 hover:text-black transition duration-150 whitespace-nowrap"
    {...props}
  >
    {children}
  </Link>
);

// 4. Mock NavDropdown Component
const NavDropdown = ({ menuKey, title, icon, openMenu, toggleMenu, children }) => (
  <div className="relative">
    <button
      onClick={() => toggleMenu(menuKey)}
      className="flex items-center gap-1.5 text-yellow-400 hover:text-white font-medium p-2 rounded-lg transition duration-200"
    >
      {icon} 
      <span>{title}</span>
      {menuKey !== 'wallet' && (openMenu === menuKey ? <FaChevronUp size={10} /> : <FaChevronDown size={10} />)}
    </button>
    {openMenu === menuKey && (
      <div className="absolute top-full mt-2 right-0 bg-neutral-900 border border-yellow-500/30 rounded-lg shadow-xl z-40 min-w-[150px]">
        {children}
      </div>
    )}
  </div>
);

// --------------------------------------------------------------------------

function DealerNavbar({ setIsModalOpen }) {
  const [openMenu, setOpenMenu] = useState(null);
  const navRef = useRef(null);
  const navigate = useNavigate();
  const { user, logout } = useContext(UserAppContext); // Destructure user and logout

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
    navigate("/"); // Redirect to login page
  };

  return (
    <div
      ref={navRef}
      className="sticky top-0 z-30 bg-gradient-to-r from-yellow-400 via-black to-black shadow-2xl shadow-gray-900/50"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex justify-between items-center">
          
          {/* LOGO */}
          <img
            src={logo} 
            alt="MEMUS Logo"
            className="w-44 h-20 object-contain"
          />

          {/* NAV LINKS (Desktop) */}
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

            {/* Ticket Dropdown */}
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
            
            {/* PRIMARY ACTION: Raise Ticket Button */}
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

            {/* Settings Icon */}
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
                {user?.name || "Distributor Name"}
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
  );
}

export default DealerNavbar;