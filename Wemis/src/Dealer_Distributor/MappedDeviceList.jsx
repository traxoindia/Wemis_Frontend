import React, { useState, useEffect, useCallback } from "react";
import { 
  MapPin, Eye, SquarePen, FileText, SquareCheckBig, 
  Loader2, AlertTriangle,Smartphone, ChevronDown, ChevronUp, Search, MoreHorizontal
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const FETCH_MAPPED_DEVICES_API = "https://api.websave.in/api/manufactur/fetchDelerMapDevices";

function MappedDeviceList() {
  const navigate = useNavigate();
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDevices, setSelectedDevices] = useState([]);
  const [expandedRow, setExpandedRow] = useState(null);

  // --- Fetch Data ---
  const fetchDevices = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(FETCH_MAPPED_DEVICES_API, {
        method: "GET",
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json" 
        }
      });
      const data = await response.json();
      console.log(data)
      // Assuming API returns { success: true, delMapDevice: [...] }
      setDevices(data.delMapDevice || []);
    } catch (err) {
      setError("Failed to load devices. Please check connection.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDevices(); }, [fetchDevices]);

  // --- Handlers ---
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedDevices(devices.map(d => d._id));
    } else {
      setSelectedDevices([]);
    }
  };

  const handleSelectRow = (id) => {
    setSelectedDevices(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleLiveTracking = () => {
    const selectedNos = devices
      .filter(d => selectedDevices.includes(d._id))
      .map(d => d.deviceNo)
      .join(",");
    
    if (selectedNos) {
      navigate(`/dealer/map-device/livetracking?deviceNos=${selectedNos}`);
    }
  };

  // Filter Logic
  const filteredDevices = devices.filter(d => 
    d.vechileNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.deviceNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.fullName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return (
    <div className="flex flex-col items-center justify-center p-20 text-yellow-500">
      <Loader2 className="animate-spin mb-4" size={40} />
      <p className="font-bold tracking-widest uppercase text-sm">Synchronizing Data...</p>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Action Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-zinc-900/50 p-4 rounded-2xl border border-white/5">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
          <input 
            type="text"
            placeholder="Search vehicle, serial, or customer..."
            className="w-full bg-black border border-white/10 rounded-xl py-3 pl-12 pr-4 text-sm focus:border-yellow-500 outline-none transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex gap-2 w-full md:w-auto">
          <button 
            disabled={selectedDevices.length === 0}
            onClick={handleLiveTracking}
            className="flex-1 md:flex-none bg-green-600 hover:bg-green-500 disabled:opacity-30 disabled:grayscale text-white px-6 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all"
          >
            <SquareCheckBig size={18} /> Live Track
          </button>
          <button className="flex-1 md:flex-none bg-zinc-800 hover:bg-zinc-700 text-white px-6 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 border border-white/5 transition-all">
            <FileText size={18} /> Export PDF
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-zinc-900 rounded-3xl border border-white/5 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-black/40 text-gray-400 text-[10px] font-black uppercase tracking-widest border-b border-white/5">
                <th className="p-5 w-10">
                  <input 
                    type="checkbox" 
                    onChange={handleSelectAll}
                    checked={selectedDevices.length === devices.length && devices.length > 0}
                    className="accent-yellow-500"
                  />
                </th>
                <th className="p-5">Vehicle Details</th>
                <th className="p-5">Hardware Serial</th>
                <th className="p-5">Customer Info</th>
                <th className="p-5">Reg. Date</th>
                <th className="p-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {filteredDevices.map((device) => (
                <React.Fragment key={device._id}>
                  <tr className={`border-b border-white/5 transition-colors ${selectedDevices.includes(device._id) ? 'bg-yellow-500/5' : 'hover:bg-white/[0.02]'}`}>
                    <td className="p-5">
                      <input 
                        type="checkbox" 
                        checked={selectedDevices.includes(device._id)}
                        onChange={() => handleSelectRow(device._id)}
                        className="accent-yellow-500"
                      />
                    </td>
                    <td className="p-5">
                      <div className="font-bold text-yellow-500">{device.vechileNo}</div>
                      <div className="text-[10px] text-yellow-500 uppercase">{device.RegistrationNo}</div>
                    </td>
                    <td className="p-5">
                      <div className="flex items-center gap-2 font-mono text-yellow-500">
                        <Smartphone size={14} className="text-yellow-500" />
                        {device.deviceNo}
                      </div>
                    </td>
                    <td className="p-5">
                      <div className="font-medium text-white">{device.fullName}</div>
                      <div className="text-xs text-yellow-500">{device.mobileNo}</div>
                    </td>
                    <td className="p-5 text-yellow-500">
                      {device.date ? new Date(device.date).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="p-5 text-right">
                      <div className="flex justify-end gap-2">
                        <button className="p-2 text-white hover:bg-blue-500/20 hover:text-blue-400 rounded-lg transition-colors" title="View Details">
                          <Eye size={18} />
                        </button>
                        <button 
                          onClick={() => setExpandedRow(expandedRow === device._id ? null : device._id)}
                          className={`p-2 rounded-lg transition-all ${expandedRow === device._id ? 'bg-yellow-500 text-yellow-100' : 'hover:bg-white/10 text-gray-400'}`}
                        >
                          <ChevronDown size={18} className={`transition-transform duration-300 ${expandedRow === device._id ? 'rotate-180' : ''}`} />
                        </button>
                      </div>
                    </td>
                  </tr>
                  
                  {/* Expandable Quick View Section */}
                  {expandedRow === device._id && (
                    <tr className="bg-black/60 animate-in fade-in slide-in-from-top-1">
                      <td colSpan="6" className="p-8 border-b border-yellow-500/20">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-xs">
                          <div>
                            <p className="text-gray-500 uppercase font-bold mb-2 tracking-widest">Chassis Number</p>
                            <p className="text-yellow-100 font-mono">{device.ChassisNumber || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-gray-500 uppercase font-bold mb-2 tracking-widest">Engine Number</p>
                            <p className="text-yellow-100 font-mono">{device.EngineNumber || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-gray-500 uppercase font-bold mb-2 tracking-widest">Selected Plan</p>
                            <p className="text-yellow-100 uppercase">{device.Packages || 'Standard'}</p>
                          </div>
                          <div>
                            <p className="text-gray-500 uppercase font-bold mb-2 tracking-widest">SIM Info</p>
                            <p className="text-yellow-100">{device.simDetails?.map(s => s.simNo).join(", ") || 'N/A'}</p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredDevices.length === 0 && (
          <div className="p-20 text-center">
            <AlertTriangle className="mx-auto text-gray-700 mb-4" size={48} />
            <p className="text-gray-500">No matching records found.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default MappedDeviceList;