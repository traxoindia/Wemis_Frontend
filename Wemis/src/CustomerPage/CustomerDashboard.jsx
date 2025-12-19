import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom"; // Import useNavigate
import { 
  Car, Activity, MapPin, Gauge, 
  Power, RefreshCw, Download, Mail, Search, 
  ChevronLeft, ChevronRight, Filter,
  AlertCircle, CheckCircle,
  XCircle, BarChart3, Radio, Eye, MoreVertical,
  Clock, Navigation, Wifi, Package, Zap,
  Info, Shield, Cpu, CreditCard, X, ExternalLink
} from "lucide-react";

// --- Sub-component for Reverse Geocoding ---
const AddressCell = ({ lat, lng }) => {
  const [address, setAddress] = useState("Fetching address...");

  useEffect(() => {
    const getAddress = async () => {
      if (!lat || !lng || lat === 0 || lng === 0) {
        setAddress("Location Unavailable");
        return;
      }
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`,
          { headers: { 'Accept-Language': 'en' } }
        );
        const data = await response.json();
        setAddress(data.display_name || "Address not found");
      } catch (error) {
        setAddress("Error loading location");
      }
    };
    getAddress();
  }, [lat, lng]);

  return (
    <div className="flex items-start gap-2 text-[10px] text-slate-500 font-medium">
      <MapPin size={12} className="shrink-0 mt-0.5 text-indigo-500" />
      <span className="line-clamp-2 leading-tight hover:text-slate-700 transition-colors">
        {address}
      </span>
    </div>
  );
};

const DataRow = ({ label, value, icon: Icon }) => (
  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
    <div className="flex items-center gap-3">
      {Icon && <Icon size={14} className="text-slate-400" />}
      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</span>
    </div>
    <span className="text-sm font-black text-slate-700">{value || "N/A"}</span>
  </div>
);

const CustomerDashboard = () => {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDevice, setSelectedDevice] = useState(null);
  const navigate = useNavigate(); // Initialize Navigation

  const [summary, setSummary] = useState({
    total: 0, online: 0, offline: 0, moving: 0, stopped: 0
  });

  const fetchData = async () => {
    setLoading(true);
    const token = localStorage.getItem("token");
    try {
      const response = await fetch("https://api.websave.in/api/manufactur/liveTrackingAllDevices", {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });
      const data = await response.json();
      const deviceList = data.devices || []; 
      setDevices(deviceList);
      
      setSummary({
        total: deviceList.length,
        online: deviceList.filter(d => d.status === 'online').length,
        offline: deviceList.filter(d => d.status !== 'online').length,
        moving: deviceList.filter(d => d.movementStatus === 'moving').length,
        stopped: deviceList.filter(d => d.movementStatus === 'stopped').length,
      });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // FUNCTION TO NAVIGATE TO LIVE TRACKING
  const handleLiveTracking = (deviceNo) => {
    navigate("/customer/tracking", { state: { deviceNo: deviceNo } });
  };

  const filteredDevices = devices.filter(device => {
    const searchStr = searchTerm.toLowerCase();
    return (
      device.vechileNo?.toLowerCase().includes(searchStr) ||
      device.RegistrationNo?.toLowerCase().includes(searchStr) ||
      device.deviceNo?.includes(searchStr)
    );
  });

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans">
      {/* Header Section */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Fleet Command Center</h1>
          <p className="text-slate-500 font-medium">Monitoring Assets Globally</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={fetchData} className="px-4 py-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 flex items-center gap-2 shadow-sm transition-all active:scale-95">
            <RefreshCw className={`w-4 h-4 text-indigo-600 ${loading ? "animate-spin" : ""}`} />
            <span className="font-bold text-sm text-slate-700">Sync Live</span>
          </button>
        </div>
      </div>

      {/* Summary Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        {[
          { label: "Total Assets", val: summary.total, color: "bg-indigo-600", icon: <Package size={18}/> },
          { label: "Online", val: summary.online, color: "bg-emerald-500", icon: <Wifi size={18}/> },
          { label: "Offline", val: summary.offline, color: "bg-slate-400", icon: <XCircle size={18}/> },
          { label: "Moving", val: summary.moving, color: "bg-blue-500", icon: <Navigation size={18}/> },
          { label: "Stopped", val: summary.stopped, color: "bg-amber-500", icon: <Clock size={18}/> },
        ].map((card, i) => (
          <div key={i} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 transition-transform hover:scale-105">
            <div className={`${card.color} p-3 rounded-xl text-white shadow-lg`}>{card.icon}</div>
            <div>
              <div className="text-xl font-black text-slate-900">{card.val}</div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{card.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Search Panel */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 mb-6">
        <div className="relative w-full">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search Registration, Vehicle No, or IMEI..."
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
          />
        </div>
      </div>

      {/* Main Data Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-8">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <th className="text-left p-5">Vehicle Identification</th>
                <th className="text-left p-5">Status</th>
                <th className="text-center p-5">Ignition</th>
                <th className="text-center p-5">Signal</th>
                <th className="text-left p-5">Speed</th>
                <th className="text-left p-5">Location</th>
                <th className="text-right p-5 px-10">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredDevices.map((device, index) => (
                <tr key={device._id || index} className="hover:bg-indigo-50/30 transition-colors group">
                  <td className="p-5">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${device.status === 'online' ? 'bg-emerald-100 text-emerald-600 shadow-inner' : 'bg-slate-100 text-slate-400'}`}>
                        <Car size={20} />
                      </div>
                      <div>
                        <div className="font-black text-slate-900 text-sm">{device.vechileNo || device.RegistrationNo}</div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter leading-none">IMEI: {device.deviceNo}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-5">
                    <div className="flex flex-col gap-1.5">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-black uppercase w-fit ${device.status === 'online' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                        {device.status}
                      </span>
                    </div>
                  </td>
                  <td className="p-5 text-center">
                    <Power size={18} className={`mx-auto ${device.liveTracking?.ignition === "1" ? "text-emerald-500 drop-shadow-sm" : "text-slate-300"}`} />
                  </td>
                  <td className="p-5 text-center">
                    <Wifi size={18} className="mx-auto text-indigo-500" />
                    <span className="text-[9px] font-black text-slate-700">{device.liveTracking?.gsmSignal || 0} RSSI</span>
                  </td>
                  <td className="p-5">
                    <div className="text-base font-black text-slate-900 leading-none">{device.speed || 0}</div>
                    <div className="text-[9px] font-bold text-slate-400 uppercase mt-1">KM/H</div>
                  </td>
                  <td className="p-5 max-w-xs">
                    <AddressCell lat={device.lat} lng={device.lng} />
                  </td>
                  <td className="p-5 text-right whitespace-nowrap">
                    <div className="flex justify-end items-center gap-2">
                      <button 
                        onClick={() => setSelectedDevice(device)}
                        className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-indigo-600 hover:text-white transition-all shadow-sm flex items-center gap-1.5 text-xs font-bold"
                        title="View Details"
                      >
                        <Eye size={16} />
                      </button>
                      <button 
                        onClick={() => handleLiveTracking(device.deviceNo)}
                        className="px-3 py-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-600 hover:text-white transition-all shadow-sm flex items-center gap-1.5 text-xs font-bold"
                      >
                        <Navigation size={14} /> Tracking
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- DETAIL MODAL --- */}
      {selectedDevice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] w-full max-w-4xl shadow-2xl overflow-hidden border border-white/20">
            {/* Modal Header */}
            <div className="bg-slate-900 p-8 text-white flex justify-between items-center relative overflow-hidden">
              <div className="flex items-center gap-6 relative z-10">
                <div className="p-4 bg-indigo-500 rounded-3xl">
                  <Car size={32} />
                </div>
                <div>
                  <h2 className="text-2xl font-black">{selectedDevice.vechileNo || selectedDevice.RegistrationNo}</h2>
                  <span className="text-[10px] font-black uppercase bg-white/10 px-2 py-0.5 rounded tracking-widest text-indigo-300">IMEI: {selectedDevice.deviceNo}</span>
                </div>
              </div>
              <button onClick={() => setSelectedDevice(null)} className="p-3 bg-white/10 hover:bg-white/20 rounded-full transition-all">
                <X size={24} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-8 max-h-[70vh] overflow-y-auto">
              {/* Column 1: Registry */}
              <div className="space-y-6">
                <div className="flex items-center gap-2 text-indigo-600"><Shield size={18}/><h3 className="text-xs font-black uppercase tracking-[0.2em]">Registry</h3></div>
                <div className="space-y-2">
                  <DataRow label="Make / Model" value={selectedDevice.MakeModel} />
                  <DataRow label="Registration" value={selectedDevice.RegistrationNo} />
                  <DataRow label="Chassis No" value={selectedDevice.dev?.ChassisNumber} />
                  <DataRow label="Vehicle Type" value={selectedDevice.dev?.VehicleType} />
                </div>
              </div>

              {/* Column 2: Live Telemetry */}
              <div className="space-y-6">
                <div className="flex items-center gap-2 text-emerald-600"><Zap size={18}/><h3 className="text-xs font-black uppercase tracking-[0.2em]">Diagnostics</h3></div>
                <div className="space-y-2">
                  <DataRow label="Mains Power" value={selectedDevice.liveTracking?.mainsPowerStatus === "1" ? "CONNECTED" : "DISCONNECTED"} icon={Zap} />
                  <DataRow label="Voltage" value={`${selectedDevice.liveTracking?.mainsVoltage || 0}V`} />
                  <DataRow label="Satellites" value={selectedDevice.liveTracking?.satellites} icon={Navigation} />
                  <DataRow label="GPS Fix" value={selectedDevice.liveTracking?.gpsFix === "1" ? "VALID" : "INVALID"} />
                </div>
              </div>

              {/* Column 3: Connectivity */}
              <div className="space-y-6">
                <div className="flex items-center gap-2 text-blue-600"><Radio size={18}/><h3 className="text-xs font-black uppercase tracking-[0.2em]">SIM Details</h3></div>
                <div className="space-y-2">
                  <DataRow label="GSM Signal" value={`${selectedDevice.liveTracking?.gsmSignal} RSSI`} />
                  {selectedDevice.simDetails?.map((sim, i) => (
                    <div key={i} className="p-3 bg-slate-50 rounded-xl border border-slate-100 mt-2 text-[10px]">
                       <p className="font-bold text-slate-400">SIM {i+1}</p>
                       <p className="font-black text-slate-700">{sim.simNo}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-between gap-4">
              <button 
                onClick={() => handleLiveTracking(selectedDevice.deviceNo)}
                className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 shadow-xl shadow-indigo-200"
              >
                <ExternalLink size={16} /> Open Live Tracking
              </button>
              <button 
                onClick={() => setSelectedDevice(null)}
                className="px-8 py-4 bg-white border border-slate-200 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <footer className="mt-8 text-center border-t border-slate-200 pt-8">
        <p className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-400">Traxo India Automation</p>
      </footer>
    </div>
  );
};

export default CustomerDashboard;