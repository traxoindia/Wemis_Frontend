import React, {
  useState,
  useEffect,
  useRef,
  useContext,
  useCallback,
} from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  FaBarcode,
  FaUsers,
  FaCogs,
  FaWallet,
  FaTools,
  FaMapMarkedAlt,
  FaCalendarDay,
  FaSync,
  FaCheckCircle,
  FaChevronDown,
  FaChartLine,
  FaTicketAlt,
  FaPlus,
} from "react-icons/fa";
import { FiSettings, FiLogOut } from "react-icons/fi";
import { UserAppContext } from "../contexts/UserAppProvider";
import logo from "../Images/logo.png";
import RaiseTicketModal from "./RaiseTicketModal";

// --- Optimized Utility Components ---

const NavDropdown = ({
  menuKey,
  title,
  icon,
  children,
  openMenu,
  toggleMenu,
}) => {
  const isOpen = openMenu === menuKey;
  return (
    <div className="relative">
      <button
        onClick={() => toggleMenu(menuKey)}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 text-base 
          ${isOpen ? "bg-white text-black shadow-md" : "text-white hover:bg-black/10"}`}
      >
        {React.cloneElement(icon, { size: 16 })}
        <span>{title}</span>
        <FaChevronDown
          className={`transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
          size={12}
        />
      </button>
      {isOpen && (
        <div className="absolute top-full mt-2 left-0 w-56 bg-white border border-gray-200 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
          {children}
        </div>
      )}
    </div>
  );
};

const DropdownLink = ({ to, children }) => (
  <Link
    to={to}
    className="block px-5 py-3 text-sm text-gray-700 hover:bg-yellow-400 hover:text-black transition-colors font-semibold"
  >
    {children}
  </Link>
);

const DealerNavbar = () => {
  const [openMenu, setOpenMenu] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navRef = useRef(null);
  const navigate = useNavigate();
  const { logout, user } = useContext(UserAppContext);

  useEffect(() => {
    const closeMenu = (e) =>
      navRef.current && !navRef.current.contains(e.target) && setOpenMenu(null);
    document.addEventListener("mousedown", closeMenu);
    return () => document.removeEventListener("mousedown", closeMenu);
  }, []);

  return (
    <div className=" bg-[#F8F9FA] text-gray-800 font-sans">
      {/* --- Navbar: Yellow to Black Gradient --- */}
      <nav
        ref={navRef}
        className="sticky top-0 z-50 bg-gradient-to-r from-yellow-500 via-black to-black shadow-lg"
      >
        <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
          <Link to="/dealer/dashboard">
            <img src={logo} alt="Logo" className="h-14 w-auto object-contain" />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden xl:flex items-center gap-2">
            <NavDropdown
              menuKey="barcode"
              title="Barcode"
              icon={<FaBarcode />}
              openMenu={openMenu}
              toggleMenu={setOpenMenu}
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
              toggleMenu={setOpenMenu}
            >
              <DropdownLink to="/distributor/dealer/technicians">
                Technicians
              </DropdownLink>
            </NavDropdown>

            <NavDropdown
              menuKey="device"
              title="Devices"
              icon={<FaCogs />}
              openMenu={openMenu}
              toggleMenu={setOpenMenu}
            >
              <DropdownLink to="/distributor/dealer/map-device">
                Map Device
              </DropdownLink>
            </NavDropdown>

            <NavDropdown
              menuKey="tickets"
              title="Tickets"
              icon={<FaTicketAlt />}
              openMenu={openMenu}
              toggleMenu={setOpenMenu}
            >
              <DropdownLink to="/dealer/tickets">All Tickets</DropdownLink>
            </NavDropdown>
            <NavDropdown menuKey="Wallet" title="Wallet" icon={<FaWallet />} openMenu={openMenu} toggleMenu={setOpenMenu}>
              <DropdownLink to="/dealer/walletActivation">Activation Wallet</DropdownLink>
             
            </NavDropdown>
          </div>
          {/* User Actions */}  
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsModalOpen(true)}
              className="hidden md:flex items-center bg-yellow-400 text-black px-6 py-2.5 rounded-full font-black text-sm shadow-md hover:bg-yellow-300 transition-transform hover:scale-105"
            >
              <FaPlus className="mr-2" /> RAISE TICKET
            </button>

            <div className="flex items-center gap-3 pl-4 border-l border-gray-700">
              <div className="hidden lg:text-right lg:block text-white">
                <p className="text-xs font-black uppercase tracking-wider">
                  {user?.name || "Dealer"}
                </p>
                <p className="text-[10px] text-yellow-400 font-bold uppercase">
                  Dealer Partner
                </p>
              </div>
              <img
                src="https://i.pravatar.cc/44?img=1"
                alt="Profile"
                className="w-10 h-10 rounded-full border-2 border-yellow-400"
              />
              <button
                onClick={() => logout()}
                className="p-2 text-gray-400 hover:text-red-500 transition-colors"
              >
                <FiLogOut size={22} />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* --- Dashboard Content: White Theme --- */}

      {isModalOpen && (
        <RaiseTicketModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSubmit={(d) => console.log(d)}
        />
      )}
    </div>
  );
};

export default DealerNavbar;
