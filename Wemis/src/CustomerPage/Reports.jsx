import React, { useState, useEffect } from "react";
import { 
  FileText, Calendar, Search, Download, Filter, 
  MapPin, Clock, Gauge, Navigation, AlertTriangle, 
  CheckCircle2, XCircle, ArrowRight, Fuel, Printer 
} from "lucide-react";
import Navbar from "./Navbar";

// --- CONFIG ---
const API_BASE_URL = "https://api.websave.in";

// --- HELPER: Format Duration (seconds -> HH:mm:ss) ---
const formatDuration = (seconds) => {
  if (!seconds) return "0s";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${m}m`;
};

// --- COMPONENT: Stat Card ---
const ReportStatCard = ({ icon, label, value, color, bg }) => (
  <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 transition-transform hover:-translate-y-1">
    <div className={`p-3 rounded-xl ${bg} ${color}`}>
      {icon}
    </div>
    <div>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</p>
      <h3 className="text-xl font-black text-slate-800">{value}</h3>
    </div>
  </div>
);

function Reports() {
  // --- STATE ---
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
  
  // Filters
  const [selectedDevice, setSelectedDevice] = useState("");
  const [reportType, setReportType] = useState("stoppage"); // stoppage, trip, ignition, idle, overspeed
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Data
  const [reportData, setReportData] = useState([]);
  const [summary, setSummary] = useState({ totalDist: 0, totalDuration: 0, maxSpeed: 0, count: 0 });

  // --- 1. FETCH DEVICE LIST ON MOUNT ---
  useEffect(() => {
    const fetchDevices = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_BASE_URL}/api/manufactur/liveTrackingAllDevices`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        const data = await res.json();
        setDevices(data.devices || []);
        
        // Default to first device
        if (data.devices?.length > 0) {
            setSelectedDevice(data.devices[0].deviceNo);
        }
        
        // Default dates (Today)
        const now = new Date();
        const start = new Date(now.setHours(0, 0, 0, 0)).toISOString().slice(0, 16);
        const end = new Date().toISOString().slice(0, 16);
        setStartDate(start);
        setEndDate(end);

      } catch (err) {
        console.error("Failed to load devices", err);
      }
    };
    fetchDevices();
  }, []);

  // --- 2. GENERATE REPORT ---
  const handleGenerateReport = async () => {
    if (!selectedDevice || !startDate || !endDate) return alert("Please select all fields.");
    
    setReportLoading(true);
    const token = localStorage.getItem("token");

    try {
      // NOTE: Adjust endpoint based on your exact API documentation. 
      // Using a generic structure common in GPS APIs.
      const response = await fetch(`${API_BASE_URL}/api/reports/generate`, {
        method: "POST",
        headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
            deviceNo: selectedDevice,
            type: reportType,
            from: new Date(startDate).toISOString(),
            to: new Date(endDate).toISOString()
        })
      });

      // --- MOCK DATA FALLBACK (If API isn't ready yet) ---
      // Remove this `if(true)` block once your real API is connected.
      if (!response.ok || true) {
        await new Promise(r => setTimeout(r, 1000)); // Fake delay
        const mock = generateMockData(reportType);
        setReportData(mock);
        calculateSummary(mock);
        setReportLoading(false);
        return;
      }

      const data = await response.json();
      if(data.success) {
          setReportData(data.result);
          calculateSummary(data.result);
      } else {
          alert("No data found for this period.");
          setReportData([]);
      }
    } catch (error) {
      console.error(error);
      // alert("Error fetching report.");
      // Fallback to mock for demo
      const mock = generateMockData(reportType);
      setReportData(mock);
      calculateSummary(mock);
    } finally {
      setReportLoading(false);
    }
  };

  // --- HELPER: Calculate Totals ---
  const calculateSummary = (data) => {
    let dist = 0, dur = 0, maxS = 0;
    data.forEach(Row => {
        dist += Number(Row.distance || 0);
        dur += Number(Row.durationSeconds || 0);
        if(Number(Row.speed) > maxS) maxS = Number(Row.speed);
    });
    setSummary({
        totalDist: dist.toFixed(2),
        totalDuration: dur,
        maxSpeed: maxS,
        count: data.length
    });
  };


  // --- HELPER: Mock Data Generator (For Testing UI) ---
  const generateMockData = (type) => {
    const arr = [];
    const locs = ["Market Road, Sector 4", "National Highway 48", "Industrial Area Phase 1", "Main Warehouse", "City Center Parking"];
    for(let i=0; i<8; i++) {
        arr.push({
            id: i,
            startTime: "2023-10-25 08:30:00",
            endTime: "2023-10-25 09:15:00",
            duration: "45 min",
            durationSeconds: 2700,
            location: locs[i % locs.length],
            startLocation: locs[i % locs.length],
            endLocation: locs[(i+1) % locs.length],
            distance: (Math.random() * 50).toFixed(1),
            speed: (Math.random() * 80).toFixed(0),
            status: type === 'ignition' ? (i%2===0 ? "ON" : "OFF") : "Stopped",
            driver: "Ramesh Kumar"
        });
    }
    return arr;
  };

  // --- 3. RENDER COLUMNS BASED ON TYPE ---
  const renderTableHeader = () => {
    switch(reportType) {
        case "stoppage":
        case "idle":
            return (
                <>
                    <th className="p-4 text-left">Start Time</th>
                    <th className="p-4 text-left">End Time</th>
                    <th className="p-4 text-left">Duration</th>
                    <th className="p-4 text-left">Location</th>
                </>
            );
        case "trip":
            return (
                <>
                    <th className="p-4 text-left">Start Time</th>
                    <th className="p-4 text-left">End Time</th>
                    <th className="p-4 text-left">Distance</th>
                    <th className="p-4 text-left">Route (Start → End)</th>
                </>
            );
        case "ignition":
            return (
                <>
                    <th className="p-4 text-left">Event Time</th>
                    <th className="p-4 text-left">Status</th>
                    <th className="p-4 text-left">Duration</th>
                    <th className="p-4 text-left">Location</th>
                </>
            );
        case "overspeed":
            return (
                <>
                    <th className="p-4 text-left">Time</th>
                    <th className="p-4 text-left">Speed</th>
                    <th className="p-4 text-left">Limit</th>
                    <th className="p-4 text-left">Location</th>
                </>
            );
        default: return null;
    }
  };

  const renderTableBody = (row) => {
    switch(reportType) {
        case "stoppage":
        case "idle":
            return (
                <>
                    <td className="p-4 font-bold text-slate-600">{row.startTime}</td>
                    <td className="p-4 font-bold text-slate-600">{row.endTime}</td>
                    <td className="p-4"><span className="bg-amber-50 text-amber-700 px-2 py-1 rounded-md text-xs font-bold">{row.duration}</span></td>
                    <td className="p-4 text-slate-500 text-xs flex items-center gap-2"><MapPin size={12}/> {row.location}</td>
                </>
            );
        case "trip":
            return (
                <>
                    <td className="p-4 font-bold text-slate-600">{row.startTime}</td>
                    <td className="p-4 font-bold text-slate-600">{row.endTime}</td>
                    <td className="p-4 text-indigo-600 font-bold">{row.distance} km</td>
                    <td className="p-4 text-xs text-slate-500">
                        <div className="flex flex-col gap-1">
                            <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-green-500"></div> {row.startLocation}</span>
                            <span className="flex items-center gap-1 pl-0.5 text-slate-300"><div className="w-0.5 h-3 bg-slate-200 ml-0.5"></div></span>
                            <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-red-500"></div> {row.endLocation}</span>
                        </div>
                    </td>
                </>
            );
        case "ignition":
            return (
                <>
                    <td className="p-4 font-bold text-slate-600">{row.startTime}</td>
                    <td className="p-4">
                        <span className={`px-2 py-1 rounded-md text-xs font-bold uppercase ${row.status === 'ON' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                            {row.status}
                        </span>
                    </td>
                    <td className="p-4 text-slate-600 font-medium">{row.duration}</td>
                    <td className="p-4 text-slate-500 text-xs"><MapPin size={12} className="inline mr-1"/>{row.location}</td>
                </>
            );
        default: return null;
    }
  };

  return (
    <>
        <Navbar/>

    <div className="min-h-screen bg-slate-50/50 p-6 md:p-10 font-sans">
      
      {/* --- HEADER --- */}
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-800 tracking-tight">Analytics & Reports</h1>
        <p className="text-slate-500 font-medium text-sm mt-1">Generate detailed insights about your fleet performance.</p>
      </div>

      {/* --- CONTROL PANEL --- */}
      <div className="bg-white rounded-[2rem] p-6 shadow-xl shadow-slate-200/50 border border-slate-100 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
            
            {/* Vehicle Selector */}
            <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Select Asset</label>
                <div className="relative group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 group-focus-within:text-indigo-500" />
                    <select 
                        value={selectedDevice} 
                        onChange={(e) => setSelectedDevice(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-100 transition-all appearance-none cursor-pointer hover:bg-slate-100"
                    >
                        {devices.map(d => (
                            <option key={d.deviceNo} value={d.deviceNo}>{d.vechileNo} ({d.deviceNo})</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Report Type Selector */}
            <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Report Type</label>
                <div className="relative group">
                    <FileText className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 group-focus-within:text-indigo-500" />
                    <select 
                        value={reportType}
                        onChange={(e) => setReportType(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-100 transition-all appearance-none cursor-pointer hover:bg-slate-100"
                    >
                        <option value="stoppage">Stoppage Report</option>
                        <option value="trip">Trip / Distance Report</option>
                        <option value="ignition">Ignition On/Off</option>
                        <option value="idle">Idling Report</option>
                        <option value="overspeed">Overspeed Report</option>
                    </select>
                </div>
            </div>

            {/* Start Date */}
            <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">From</label>
                <div className="relative">
                    <input 
                        type="datetime-local" 
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 outline-none focus:ring-2 focus:ring-indigo-100 transition-all"
                    />
                </div>
            </div>

            {/* End Date */}
            <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">To</label>
                <div className="relative">
                    <input 
                        type="datetime-local" 
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 outline-none focus:ring-2 focus:ring-indigo-100 transition-all"
                    />
                </div>
            </div>

            {/* Action Button */}
            <button 
                onClick={handleGenerateReport}
                disabled={reportLoading}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 transition-all active:scale-95 flex items-center justify-center gap-2"
            >
                {reportLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : <Filter size={18} />}
                Generate
            </button>

        </div>
      </div>

      {/* --- STATS SUMMARY --- */}
      {reportData.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8 animate-in fade-in slide-in-from-bottom-4">
            <ReportStatCard 
                icon={<AlertTriangle size={20}/>} 
                label="Total Events" 
                value={summary.count} 
                bg="bg-indigo-50" color="text-indigo-600" 
            />
            <ReportStatCard 
                icon={<Navigation size={20}/>} 
                label="Total Distance" 
                value={`${summary.totalDist} km`} 
                bg="bg-emerald-50" color="text-emerald-600" 
            />
            <ReportStatCard 
                icon={<Clock size={20}/>} 
                label="Total Duration" 
                value={formatDuration(summary.totalDuration)} 
                bg="bg-amber-50" color="text-amber-600" 
            />
            <ReportStatCard 
                icon={<Gauge size={20}/>} 
                label="Max Speed" 
                value={`${summary.maxSpeed} km/h`} 
                bg="bg-rose-50" color="text-rose-600" 
            />
        </div>
      )}

      {/* --- RESULTS TABLE --- */}
      <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden min-h-[400px] flex flex-col">
        {/* Table Header Controls */}
        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h3 className="font-bold text-slate-700 uppercase tracking-wider text-xs flex items-center gap-2">
                <FileText size={16} className="text-indigo-500"/> Report Results
            </h3>
            <div className="flex gap-2">
                <button className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors">
                    <Printer size={14} /> Print
                </button>
                <button className="flex items-center gap-2 px-3 py-2 bg-emerald-50 border border-emerald-100 rounded-lg text-xs font-bold text-emerald-700 hover:bg-emerald-100 transition-colors">
                    <Download size={14} /> Export CSV
                </button>
            </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto flex-1">
            <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">
                    <tr>
                        {renderTableHeader()}
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                    {reportData.map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50 transition-colors text-xs">
                            {renderTableBody(row)}
                        </tr>
                    ))}
                    {reportData.length === 0 && !reportLoading && (
                        <tr>
                            <td colSpan="4" className="p-10 text-center text-slate-400">
                                <div className="flex flex-col items-center gap-3">
                                    <div className="p-4 bg-slate-50 rounded-full"><Search size={24}/></div>
                                    <p>No data found. Select filters and click Generate.</p>
                                </div>
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
      </div>

    </div>
        </>
  );
}

export default Reports;