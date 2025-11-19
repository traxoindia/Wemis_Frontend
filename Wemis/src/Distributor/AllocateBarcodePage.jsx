import React, { useState } from "react";
import { Plus, Search, RefreshCw, X, HardHat, Package, Send, Calendar } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

// Assuming UserAppContext is correctly defined and imported
// import { UserAppContext } from "../contexts/UserAppProvider"; 
import DistributorNavbar from './DistributorNavbar';


// --- Dummy Data (Replace with your API fetch logic) ---
const DUMMY_ALLOCATION_HISTORY = [
  { dealer: "ASHOK KUMAR DEALER", barcode: "34567890987", date: "Nov 4, 2025, 05:40 PM", status: "ACTIVE" },
  { dealer: "ASHOK KUMAR DEALER", barcode: "345678", date: "Nov 6, 2025, 04:52 PM", status: "ACTIVE" },
  { dealer: "ASHOK KUMAR DEALER", barcode: "862567079764606", date: "Nov 10, 2025, 03:35 PM", status: "ACTIVE" },
  { dealer: "ASHOK KUMAR DEALER", barcode: "862567075885710", date: "Nov 10, 2025, 04:45 PM", status: "ACTIVE" },
  { dealer: "ASHOK KUMAR DEALER", barcode: "862567076887350", date: "Nov 12, 2025, 04:22 PM", status: "ACTIVE" },
  { dealer: "ASHOK KUMAR DEALER", barcode: "862567079762287", date: "Nov 14, 2025, 12:49 PM", status: "ACTIVE" },
];

// Helper components for UI consistency
const StatusBadge = ({ status }) => {
  const color = status === "ACTIVE" ? "bg-green-900/50 text-green-400" : "bg-yellow-900/50 text-yellow-400";
  return (
    <span className={`inline-block px-3 py-1 leading-none rounded-full text-xs font-semibold ${color}`}>
      {status}
    </span>
  );
};

// --- Modal Component for Allocation Form ---
const AllocateBarcodeModal = ({ isOpen, onClose, handleSubmit }) => {
  const [formData, setFormData] = useState({
    dealerId: "",
    barcodeType: "single", // single, range, or file
    singleBarcode: "",
    startBarcode: "",
    endBarcode: "",
    elementModel: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const onSubmit = (e) => {
    e.preventDefault();
    handleSubmit(formData);
    // Optional: clear form after submit
    // setFormData({ dealerId: "", barcodeType: "single", singleBarcode: "", startBarcode: "", endBarcode: "", elementModel: "" });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg transform transition-all duration-300 scale-100 border border-yellow-500/30"
        onClick={(e) => e.stopPropagation()} // Prevent closing on inner click
      >
        {/* Modal Header */}
        <div className="flex justify-between items-center p-5 border-b border-gray-700">
          <h2 className="text-2xl font-bold text-yellow-400 flex items-center"><Send size={24} className="mr-2" />Allocate New Barcode</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white p-1 rounded-full hover:bg-gray-700 transition">
            <X size={20} />
          </button>
        </div>

        {/* Modal Body: Form */}
        <form onSubmit={onSubmit} className="p-5 space-y-5">

          {/* Dealer Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Select Dealer</label>
            {/* NOTE: This should ideally be a searchable dropdown (Select component) */}
            <div className="relative">
              <input
                type="text"
                name="dealerId"
                value={formData.dealerId}
                onChange={handleChange}
                placeholder="Enter Dealer ID or Name"
                required
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-yellow-500 focus:ring-yellow-500"
              />
              <HardHat size={16} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
          </div>

          {/* Barcode Allocation Type */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Allocation Method</label>
            <div className="flex space-x-4">
              <label className="flex items-center text-white">
                <input
                  type="radio"
                  name="barcodeType"
                  value="single"
                  checked={formData.barcodeType === 'single'}
                  onChange={handleChange}
                  className="h-4 w-4 text-yellow-500 border-gray-600 focus:ring-yellow-500 bg-gray-700"
                />
                <span className="ml-2">Single Barcode</span>
              </label>
              <label className="flex items-center text-white">
                <input
                  type="radio"
                  name="barcodeType"
                  value="range"
                  checked={formData.barcodeType === 'range'}
                  onChange={handleChange}
                  className="h-4 w-4 text-yellow-500 border-gray-600 focus:ring-yellow-500 bg-gray-700"
                />
                <span className="ml-2">Barcode Range</span>
              </label>
              <label className="flex items-center text-white">
                <input
                  type="radio"
                  name="barcodeType"
                  value="file"
                  checked={formData.barcodeType === 'file'}
                  onChange={handleChange}
                  className="h-4 w-4 text-yellow-500 border-gray-600 focus:ring-yellow-500 bg-gray-700"
                  disabled // File upload complexity often requires a separate component
                />
                <span className="ml-2 text-gray-500">File Upload (Disabled)</span>
              </label>
            </div>
          </div>

          {/* Barcode Input Fields (Conditional based on type) */}
          {formData.barcodeType === 'single' && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Enter Single Barcode/Serial No</label>
              <input
                type="text"
                name="singleBarcode"
                value={formData.singleBarcode}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-yellow-500 focus:ring-yellow-500"
              />
            </div>
          )}

          {formData.barcodeType === 'range' && (
            <div className="flex space-x-4">
              <div className="w-1/2">
                <label className="block text-sm font-medium text-gray-300 mb-1">Start Barcode/Serial No</label>
                <input
                  type="text"
                  name="startBarcode"
                  value={formData.startBarcode}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-yellow-500 focus:ring-yellow-500"
                />
              </div>
              <div className="w-1/2">
                <label className="block text-sm font-medium text-gray-300 mb-1">End Barcode/Serial No</label>
                <input
                  type="text"
                  name="endBarcode"
                  value={formData.endBarcode}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-yellow-500 focus:ring-yellow-500"
                />
              </div>
            </div>
          )}

          {/* Device/Element Model Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Select Device Model (Optional)</label>
            <div className="relative">
              {/* NOTE: This should also be a searchable dropdown based on Element APIs */}
              <input
                type="text"
                name="elementModel"
                value={formData.elementModel}
                onChange={handleChange}
                placeholder="e.g., GPS Tracker V2"
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-yellow-500 focus:ring-yellow-500"
              />
              <Package size={16} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-4">
            <button
              type="submit"
              className="w-full flex items-center justify-center px-6 py-3 rounded-lg bg-yellow-500 text-gray-900 font-bold hover:bg-yellow-400 transition duration-150 shadow-lg"
            >
              <Send size={20} className="mr-2" />
              Confirm Allocation
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};


// --- Main Component ---
function AllocateBarcodePage() {
  // const { token: contextToken } = useContext(UserAppContext); // Uncomment if using context
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [historyData, setHistoryData] = useState(DUMMY_ALLOCATION_HISTORY);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false); // Simulate loading state

  // --- Handlers ---
  const handleAllocateSubmit = (formData) => {
    // 1. **API Integration Point:** This is where you would call your allocation API (e.g., POST /api/manufactur/allocateBarcode)
    setLoading(true);
    console.log("Submitting Allocation Data:", formData);

    // Simulate API call success/failure
    setTimeout(() => {
      setLoading(false);
      toast.success(`Successfully allocated ${formData.barcodeType === 'single' ? '1 barcode' : 'barcode range'} to Dealer ID: ${formData.dealerId}`);
      setIsModalOpen(false);
      // In a real app, you would refetch the history here: fetchAllocationHistory();
    }, 1500);
  };

  const filteredHistory = historyData.filter(item => {
    const lowerSearch = searchTerm.toLowerCase();
    return item.dealer.toLowerCase().includes(lowerSearch) ||
      item.barcode.toLowerCase().includes(lowerSearch);
  });

  return (
    <div className="bg-gray-900 min-h-screen">
      <DistributorNavbar />
      <Toaster position="top-right" />

      <div className="p-4 sm:p-8 max-w-6xl mx-auto">

        <h1 className="text-3xl sm:text-4xl font-extrabold text-yellow-400 mb-6 border-b border-gray-700 pb-3">
          Barcode Allocation Management
        </h1>

        {/* Top Control Bar: Allocate & Search */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-8 space-y-4 sm:space-y-0">

          {/* Allocate Button */}
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center px-6 py-3 rounded-xl bg-yellow-500 text-gray-900 font-bold hover:bg-yellow-400 transition duration-150 shadow-lg w-full sm:w-auto justify-center"
          >
            <Plus size={20} className="mr-2" /> Allocate New Barcode
          </button>

          {/* Search and Refresh */}
          <div className="flex items-center space-x-3 w-full sm:w-auto">
            <div className="relative w-full">
              <input
                type="text"
                placeholder="Search by Barcode, Dealer, Status..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-3 rounded-xl bg-gray-800 text-white border border-gray-700 focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 w-full sm:w-80 transition duration-150 shadow-inner"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
            <button
              className="p-3 rounded-xl bg-gray-800 text-yellow-400 border border-gray-700 hover:bg-gray-700 transition duration-150 shadow-md"
              title="Refresh Data"
              onClick={() => { /* Implement history fetch here */ }}
              disabled={loading}
            >
              {loading ? <Loader2 size={20} className="animate-spin" /> : <RefreshCw size={20} />}
            </button>
          </div>
        </div>

        {/* Allocated Barcodes History */}
        <h2 className="text-2xl font-semibold text-white mb-4">Allocated Barcodes History</h2>

        <div className="bg-gray-800 shadow-2xl rounded-xl overflow-hidden border border-gray-700">
          <div className="overflow-x-auto">
            {loading ? (
              <p className="p-10 text-center text-yellow-400 text-lg flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin mr-3" /> Loading history...
              </p>
            ) : filteredHistory.length === 0 ? (
              <p className="p-10 text-center text-gray-500 text-lg">No allocation records found.</p>
            ) : (
              <table className="min-w-full divide-y divide-gray-700">
                <thead className="bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-bold text-yellow-400 uppercase tracking-wider">Distributor & OEM</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-yellow-400 uppercase tracking-wider">Dealer</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-yellow-400 uppercase tracking-wider">Barcode(s)</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-yellow-400 uppercase tracking-wider">Allocated Date</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-yellow-400 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-gray-800 divide-y divide-gray-700">
                  {filteredHistory.map((item, index) => (
                    <tr key={index} className="text-white hover:bg-gray-700/50 transition duration-100">

                      {/* Distributor/OEM (Hardcoded based on screenshot pattern) */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <span className="text-white">ASHOK KUMAR </span>
                        <span className="text-gray-400 text-xs">(Distributor)</span>
                      </td>

                      {/* Dealer */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <span className="inline-block px-3 py-1 leading-none rounded-full text-xs font-semibold bg-red-900/50 text-red-300">
                          {item.dealer}
                        </span>
                      </td>

                      {/* Barcode */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-yellow-300">
                        {item.barcode}
                      </td>

                      {/* Allocated Date */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400 flex items-center">
                        <Calendar size={14} className="mr-2" /> {item.date}
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <StatusBadge status={item.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Allocate Barcode Modal Component */}
      <AllocateBarcodeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        handleSubmit={handleAllocateSubmit}
      />
    </div>
  );
}

export default AllocateBarcodePage;