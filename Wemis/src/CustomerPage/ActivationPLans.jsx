import React, { useState, useEffect, useCallback } from "react";
import Navbar from "./Navbar";
import { 
  Car, 
  Clock, 
  Package, 
  AlertCircle, 
  Radio, 
  Zap, 
  ShieldCheck, 
  Lock,
  Truck,
  MapPin,
  Battery,
  Wifi,
  Gauge,
  Activity,
  RefreshCw
} from "lucide-react";

function ActivationPlans() {
  const [allData, setAllData] = useState([]); 
  const [selectedVehicleNo, setSelectedVehicleNo] = useState(""); 
  const [deviceStatus, setDeviceStatus] = useState(null); 
  const [loading, setLoading] = useState(true);
  const [statusLoading, setStatusLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const token = localStorage.getItem("token");

  // Fetch Wallet/Activation Data
  const fetchWalletData = useCallback(async () => {
    if (!token) {
      setError("Authentication token not found. Please log in.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(
        "https://api.websave.in/api/manufactur/fetchCoustmerActivationWallet",
        {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const result = await response.json();
      console.log("Wallet Data:", result);

      if (result.success) {
        const dataArray = result.data || [];
        setAllData(dataArray);
        
        if (dataArray.length > 0 && !selectedVehicleNo) {
          setSelectedVehicleNo(dataArray[0].vechileNo);
        }
        setError(null);
      } else {
        throw new Error(result.message || "Failed to fetch activation data.");
      }
    } catch (err) {
      setError(err.message);
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [token, selectedVehicleNo]);

  // Initial Fetch + Auto Refresh every hour
  useEffect(() => {
    fetchWalletData();
    const intervalId = setInterval(fetchWalletData, 3600000);
    return () => clearInterval(intervalId);
  }, [fetchWalletData]);

  // Fetch Device Status every hour
  useEffect(() => {
    const fetchDeviceStatus = async () => {
      if (!selectedVehicleNo || !token) return;

      const currentVehicle = allData.find(v => v.vechileNo === selectedVehicleNo);
      
      // Don't fetch device status if activation is not Active
      if (!currentVehicle || currentVehicle.activationStatus !== "Active") {
        setDeviceStatus(null);
        return;
      }

      setStatusLoading(true);
      try {
        const response = await fetch("https://api.websave.in/api/manufactur/getDeviceStatus", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            vechileNo: selectedVehicleNo,
            coustmerId: currentVehicle.coustmerId
          }),
        });

        const result = await response.json();
        console.log("Device Status:", result);
        
        setLastUpdated(new Date().toLocaleString());
        
        if (result.success) {
          // Check if status is "Active" or "Ended"
          if (result.status === "Active") {
            setDeviceStatus(result);
          } else {
            // If status is "Ended", hide device status
            setDeviceStatus(null);
          }
        } else {
          setDeviceStatus(null);
        }
      } catch (err) {
        console.error("Device Status Error:", err);
        setDeviceStatus(null);
      } finally {
        setStatusLoading(false);
      }
    };

    // Initial fetch
    fetchDeviceStatus();

    // Set up interval to fetch every hour
    const intervalId = setInterval(fetchDeviceStatus, 3600000); // 1 hour = 3600000 ms

    // Cleanup interval on unmount or when dependencies change
    return () => clearInterval(intervalId);
  }, [selectedVehicleNo, allData, token]);

  // Manual refresh function
  const handleRefreshDeviceStatus = async () => {
    if (!selectedVehicleNo || !token) return;

    const currentVehicle = allData.find(v => v.vechileNo === selectedVehicleNo);
    
    if (!currentVehicle || currentVehicle.activationStatus !== "Active") {
      setDeviceStatus(null);
      return;
    }

    setStatusLoading(true);
    try {
      const response = await fetch("https://api.websave.in/api/manufactur/getDeviceStatus", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          vechileNo: selectedVehicleNo,
          coustmerId: currentVehicle.coustmerId
        }),
      });

      const result = await response.json();
      console.log("Device Status (Manual Refresh):", result);
      
      setLastUpdated(new Date().toLocaleString());
      
      if (result.success) {
        // Check if status is "Active" or "Ended"
        if (result.status === "Active") {
          setDeviceStatus(result);
        } else {
          // If status is "Ended", hide device status
          setDeviceStatus(null);
        }
      } else {
        setDeviceStatus(null);
      }
    } catch (err) {
      console.error("Device Status Error:", err);
      setDeviceStatus(null);
    } finally {
      setStatusLoading(false);
    }
  };

  const activePlan = allData.find(item => item.vechileNo === selectedVehicleNo);
  const isExpired = activePlan?.activationStatus !== "Active";

  // Format date helper
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return dateString.split(',')[0];
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50 text-black p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          
          {/* Header Section */}
          <div className="bg-white p-6 rounded-xl shadow-sm border mb-6">
            <h1 className="text-xl font-bold mb-4 flex items-center gap-2">
              <ShieldCheck className="text-blue-600" /> Vehicle Command Center
            </h1>
            
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <div className="flex-1">
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">
                  Select Vehicle
                </label>
                <select 
                  value={selectedVehicleNo}
                  onChange={(e) => setSelectedVehicleNo(e.target.value)}
                  className="w-full p-3 bg-gray-50 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 font-bold text-lg"
                  disabled={loading || allData.length === 0}
                >
                  {allData.length > 0 ? (
                    allData.map((item, index) => (
                      <option key={index} value={item.vechileNo}>
                        {item.vechileNo} — {item.vehicleType}
                      </option>
                    ))
                  ) : (
                    <option value="">No vehicles available</option>
                  )}
                </select>
              </div>
              
              <div className="md:w-1/3">
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">
                  Activation Status
                </label>
                <div className={`p-3 rounded-lg border font-bold flex items-center justify-center gap-2 ${
                  activePlan && !isExpired 
                    ? "bg-green-50 border-green-200 text-green-700" 
                    : "bg-red-50 border-red-200 text-red-700"
                }`}>
                  <div className={`w-2 h-2 rounded-full ${
                    activePlan && !isExpired ? "bg-green-500 animate-pulse" : "bg-red-500"
                  }`} />
                  {activePlan?.activationStatus || "Inactive"}
                </div>
              </div>
            </div>

            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                <AlertCircle className="inline mr-2" size={16} />
                {error}
              </div>
            )}
          </div>

          {loading ? (
            <div className="text-center py-20 bg-white rounded-xl border">
              <Loader className="animate-spin text-blue-600 mx-auto" size={32} />
              <p className="mt-4 text-gray-500 font-medium">Loading vehicle data...</p>
            </div>
          ) : allData.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-xl border">
              <AlertCircle className="mx-auto text-gray-400" size={48} />
              <p className="mt-4 text-gray-500 font-medium">No activation plans found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left Column - Plan Details */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* Plan Information Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Package Info Card */}
                  <div className="bg-white p-6 rounded-xl border shadow-sm">
                    <h3 className="text-xs font-bold text-gray-400 uppercase mb-4">
                      Plan Information
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center text-blue-600">
                          <Car size={20} />
                        </div>
                        <div>
                          <p className="text-xs text-gray-400">Vehicle Type</p>
                          <p className="font-bold">{activePlan?.vehicleType || "N/A"}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-50 rounded-full flex items-center justify-center text-purple-600">
                          <Package size={20} />
                        </div>
                        <div>
                          <p className="text-xs text-gray-400">Current Package</p>
                          <p className="font-bold">{activePlan?.package?.packageName || "N/A"}</p>
                          <p className="text-xs text-gray-500">{activePlan?.package?.description || ""}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-orange-50 rounded-full flex items-center justify-center text-orange-600">
                          <Radio size={20} />
                        </div>
                        <div>
                          <p className="text-xs text-gray-400">Device</p>
                          <p className="font-bold">{activePlan?.package?.elementName || "N/A"}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Duration & Expiry Card */}
                  <div className="bg-white p-6 rounded-xl border shadow-sm">
                    <h3 className="text-xs font-bold text-gray-400 uppercase mb-4">
                      Remaining Duration
                    </h3>
                    
                    <div className="flex items-center gap-4 mb-4">
                      <div className={`text-5xl font-black ${
                        isExpired ? 'text-gray-300' : 'text-blue-600'
                      }`}>
                        {activePlan?.remainingDays || 0}
                      </div>
                      <div className="text-xs font-bold text-gray-400 uppercase leading-none">
                        Days<br/>Left
                      </div>
                    </div>

                    <div className="space-y-3 pt-3 border-t">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Start Date:</span>
                        <span className="font-semibold">
                          {activePlan?.IndiastartTime ? formatDate(activePlan.IndiastartTime) : "N/A"}
                        </span>
                      </div>
                      
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Expiry Date:</span>
                        <span className={`font-semibold ${
                          isExpired ? 'text-red-500' : 'text-gray-900'
                        }`}>
                          {activePlan?.IndiaendTime ? formatDate(activePlan.IndiaendTime) : "N/A"}
                        </span>
                      </div>

                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Billing Cycle:</span>
                        <span className="font-semibold">
                          {activePlan?.package?.billingCycle || 0} days
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Billing Summary Card */}
                <div className={`p-6 rounded-xl shadow-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ${
                  isExpired ? 'bg-gradient-to-r from-red-600 to-red-700' : 'bg-gradient-to-r from-blue-600 to-blue-700'
                } text-white`}>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest opacity-90">
                      {isExpired ? 'Plan Expired' : 'Current Plan Amount'}
                    </p>
                    <h3 className="text-3xl font-black">₹{activePlan?.package?.totalPrice || 0}</h3>
                  </div>
                  
                  <button className="bg-white px-8 py-3 rounded-lg font-bold text-sm hover:shadow-lg text-gray-900">
                    {isExpired ? 'Reactivate' : 'Extend Plan'}
                  </button>
                </div>

                {/* Device Renewal Section - Shown only when device status is Ended */}
                {deviceStatus === null && activePlan?.activationStatus === "Active" && !statusLoading && (
                  <div className="p-6 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl shadow-lg text-white">
                    <div className="flex items-center gap-3 mb-4">
                      <RefreshCw size={28} className="animate-spin-slow" />
                      <h2 className="text-xl font-bold">Device Renewal Required</h2>
                    </div>
                    <p className="mb-4 opacity-90">
                      Your device needs to be renewed. Please contact support or renew your device to continue using the service.
                    </p>
                    <div className="flex gap-3">
                      <button className="bg-white text-amber-600 px-6 py-2 rounded-lg font-bold hover:shadow-lg transition-all">
                        Renew Now
                      </button>
                      <button className="border border-white text-white px-6 py-2 rounded-lg font-bold hover:bg-white hover:text-amber-600 transition-all">
                        Contact Support
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column - Vehicle Info & Device Status */}
              <div className="space-y-6">
                
                {/* Vehicle Details Card */}
                <div className="bg-white p-6 rounded-xl border shadow-sm">
                  <h3 className="text-xs font-bold text-gray-400 uppercase mb-4">
                    Vehicle Details
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-400 mb-1">Registration Number</p>
                      <p className="text-2xl font-black text-blue-600">
                        {activePlan?.vechileNo || "N/A"}
                      </p>
                    </div>

                    <div className="flex items-center justify-between p-3 border-b">
                      <span className="text-sm text-gray-400">Type</span>
                      <span className="font-semibold flex items-center gap-1">
                        <Truck size={16} className="text-gray-500" />
                        {activePlan?.vehicleType || "N/A"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Device Status Card - Only shown when status is Active */}
                {deviceStatus && deviceStatus.status === "Active" && (
                  <div className="bg-white p-6 rounded-xl border shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xs font-bold text-gray-400 uppercase">
                        Device Status
                      </h3>
                      <button 
                        onClick={handleRefreshDeviceStatus}
                        disabled={statusLoading}
                        className="text-blue-600 hover:text-blue-800 transition-colors"
                        title="Refresh Status"
                      >
                        <RefreshCw size={16} className={statusLoading ? "animate-spin" : ""} />
                      </button>
                    </div>
                    
                    {statusLoading ? (
                      <div className="flex items-center justify-center py-6">
                        <Loader className="animate-spin text-blue-600" size={24} />
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                          <span className="font-semibold text-green-700">Active</span>
                        </div>

                        <div className="p-3 bg-gray-50 rounded-lg">
                          <p className="text-xs text-gray-400 mb-1">End Time</p>
                          <p className="font-semibold">{deviceStatus.endTime || "N/A"}</p>
                        </div>

                        <div className="p-3 bg-gray-50 rounded-lg">
                          <p className="text-xs text-gray-400 mb-1">Last Updated</p>
                          <p className="text-sm">{lastUpdated || "Just now"}</p>
                        </div>

                        {/* Additional device information */}
                        
                      </div>
                    )}
                  </div>
                )}

                {/* Security Badge */}
                <div className="bg-green-50 p-4 rounded-xl border border-green-200 flex items-center gap-3">
                  <Lock size={20} className="text-green-600" />
                  <div>
                    <p className="text-sm font-bold text-green-800">Secure Connection</p>
                    <p className="text-xs text-green-600">End-to-end encrypted</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes spin-slow {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        .animate-spin-slow {
          animation: spin-slow 3s linear infinite;
        }
      `}</style>
    </>
  );
}

// Loader Component
const Loader = ({ size = 24, className = "" }) => (
  <svg 
    className={`animate-spin ${className}`} 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle 
      className="opacity-25" 
      cx="12" 
      cy="12" 
      r="10" 
      stroke="currentColor" 
      strokeWidth="4"
    />
    <path 
      className="opacity-75" 
      fill="currentColor" 
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    />
  </svg>
);

export default ActivationPlans;