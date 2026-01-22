import { Link } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import { useState } from "react";

export default function WalletDropdown() {
  const [open, setOpen] = useState(false);

  return (
    <div
      className="relative"
      onClick={() => setOpen(!open)}
      
    >
      {/* Wallet Button */}
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center space-x-1 text-yellow-400 hover:text-yellow-300 transition-colors"
      >
        <span className="font-medium">Wallet</span>
        <ChevronDown className="w-4 h-4" />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute top-full mt-2 w-40 rounded-lg bg-gray-900 shadow-lg border border-gray-700 z-50">
         <Link
            to="/wallet/vtspackages"
            className="block px-4 py-2 text-sm text-white hover:bg-gray-800 rounded-t-lg"
          >
            VTS Packages
          </Link>
          <Link
            to="/wallet/renewal"
            className="block px-4 py-2 text-sm text-white hover:bg-gray-800 rounded-t-lg"
          >
            Renewal
          </Link>

          <Link
            to="/wallet/activation"
            className="block px-4 py-2 text-sm text-white hover:bg-gray-800 rounded-b-lg"
          >
            Activation
          </Link>
        </div>
      )}
    </div>
  );
}
