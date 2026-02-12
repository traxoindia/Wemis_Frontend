import React, { useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  FaWallet,
  FaThLarge,
} from "react-icons/fa";
import { FiLogOut } from "react-icons/fi";
import { UserAppContext } from "../contexts/UserAppProvider";
import logo from "../Images/logo.png";

const NavItem = ({ to, icon, children }) => (
  <Link
    to={to}
    className="flex items-center gap-2 px-4 py-2 rounded-lg text-white hover:bg-white/10 transition-all duration-200 font-semibold text-sm uppercase tracking-wide"
  >
    {React.cloneElement(icon, { size: 16 })}
    <span>{children}</span>
  </Link>
);

const DealerOemNavbar = () => {
  const navigate = useNavigate();
  const { logout, user } = useContext(UserAppContext);

  return (
    <div className="font-sans">
      <nav className="sticky top-0 z-50 bg-gradient-to-r from-yellow-500 via-black to-black shadow-lg">
        <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
          
          {/* Logo Section */}
          <div className="flex items-center gap-8">
            <Link to="">
              <img src={logo} alt="Logo" className="h-12 w-auto object-contain" />
            </Link>

            {/* Main Navigation */}
            <div className="hidden md:flex items-center gap-2">
              <NavItem to="/dealer-oem/dashboard" icon={<FaThLarge />}>
                Dashboard
              </NavItem>
              <NavItem to="/oem/wallet-summary" icon={<FaWallet />}>
                Activation Wallet
              </NavItem>
            </div>
          </div>

          {/* User Profile & Logout */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 pr-4 border-r border-gray-700">
              <div className="hidden lg:text-right lg:block text-white">
                <p className="text-xs font-black uppercase tracking-wider">
                  {user?.name || "Dealer_OEM"}
                </p>
                <p className="text-[10px] text-yellow-400 font-bold uppercase">
                
                </p>
              </div>
              <img
                src="https://i.pravatar.cc/44?img=12"
                alt="Profile"
                className="w-10 h-10 rounded-full border-2 border-yellow-400"
              />
            </div>

            <button
              onClick={() => logout()}
              className="flex items-center gap-2 bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white px-4 py-2 rounded-lg transition-all duration-300 font-bold text-xs uppercase"
            >
              <FiLogOut size={18} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </nav>
    </div>
  );
};

export default DealerOemNavbar;