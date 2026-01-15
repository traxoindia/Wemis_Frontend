import React, { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

// --- IMAGES ---
import vehicleLogo from '../Images/car.png'; 

// --- ICONS ---
import { 
  Car, MapPin, Gauge, Power, RefreshCw, Search, 
  Wifi, Package, Clock, Navigation, XCircle, 
  ArrowLeft, BatteryCharging, Signal, Compass,
  BarChart3, Download, ChevronUp, ChevronDown,
  StopCircle, Activity, AlertCircle, Filter
} from "lucide-react";

// --- CONFIG ---
const SOCKET_SERVER_URL = "https://api.websave.in";

// --- HELPER: Create Rotatable Map Icon ---
const createVehicleIcon = (heading) => {
  return `
    <div style="
      transform: rotate(${heading}deg); 
      width: 100%; 
      height: 100%; 
      display: flex; 
      align-items: center; 
      justify-content: center;
      transition: transform 0.3s ease-out;
    ">
      <img src="${vehicleLogo}" style="width: 40px; height: 40px; object-fit: contain; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.3));" />
    </div>
  `;
};

// --- COMPONENT: Stat Card ---
const StatCard = ({ icon, label, val, unit, color, bg }) => (
  <div className={`p-3 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center gap-1 transition-all hover:scale-105 ${bg}`}>
    <div className={`p-2 rounded-full bg-white shadow-sm ${color}`}>
      {icon}
    </div>
    <div className="text-center">
      <div className={`text-lg font-black ${color}`}>
        {val} <span className="text-[10px] text-slate-400 font-bold">{unit}</span>
      </div>
      <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{label}</div>
    </div>
  </div>
);

// --- COMPONENT: Address Lookup ---
const MapAddress = ({ lat, lng }) => {
  const [address, setAddress] = useState("Locating...");

  useEffect(() => {
    const getAddress = async () => {
      if (!lat || !lng) return;
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`, {
          headers: { 'Accept-Language': 'en' }
        });
        const data = await res.json();
        setAddress(data.display_name || "Unknown Location");
      } catch (error) {
        setAddress("Location Unavailable");
      }
    };
    getAddress();
  }, [lat, lng]);

  return (
    <div className="mt-2 p-2 bg-slate-50 rounded-lg border border-slate-100 flex gap-2 items-start">
      <MapPin className="w-3 h-3 text-indigo-500 mt-0.5 shrink-0" />
      <p className="text-[10px] font-medium text-slate-600 leading-tight line-clamp-2">{address}</p>
    </div>
  );
};

const CustomerDashboard = () => {
  const socketRef = useRef(null);
  
  // --- Leaflet Refs ---
  const mapRef = useRef(null);
  const leafletMapRef = useRef(null);
  const vehicleMarkerRef = useRef(null);

  // --- State ---
  const [devices, setDevices] = useState({});
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [summary, setSummary] = useState({ total: 0, online: 0, offline: 0, moving: 0, stopped: 0 });
  const [imeiFilter, setImeiFilter] = useState("");
  const [showAllDevices, setShowAllDevices] = useState(true);
  
  // Reports State
  const [expandedReports, setExpandedReports] = useState({ stoppage: true });
  const [reportData, setReportData] = useState({});

  // --- 1. SOCKET CONNECTION FOR LIVE TRACKING ---
  useEffect(() => {
    if (socketRef.current) return;
    
    const storedUser = localStorage.getItem("user");
    if (!storedUser) return;
    
    let myUserId;
    try { myUserId = JSON.parse(storedUser)?._id || JSON.parse(storedUser)?.id; } catch(e) {
      console.error("Error parsing user data:", e);
    }

    if (!myUserId) return;

    const socket = io(SOCKET_SERVER_URL, {
      path: "/socket.io",
      transports: ["polling", "websocket"],
      query: { userId: myUserId },
    });

    socketRef.current = socket;

    // Handle GPS updates from socket
    socket.on("gps-update", (data) => {
      setDevices(prev => {
        const updatedDevice = {
          ...data,
          lat: parseFloat(data.lat) || 0,
          lng: parseFloat(data.lng) || 0,
          speed: parseFloat(data.speed || 0),
          heading: parseFloat(data.heading || 0),
          status: 'online',
          lastUpdate: new Date().toISOString(),
          timestamp: new Date().toISOString()
        };

        const updatedDevices = {
          ...prev,
          [data.deviceNo]: updatedDevice
        };

        // Update summary
        updateSummary(Object.values(updatedDevices));
        
        // Update map if this device is selected
        if (selectedDevice && selectedDevice.deviceNo === data.deviceNo) {
          updateLiveTracking(updatedDevice);
        }
        
        return updatedDevices;
      });
    });

    // Handle connection errors
    socket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
    });

    socket.on("connect", () => {
      console.log("Socket connected successfully");
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [selectedDevice]);

  // Update live tracking on map
  const updateLiveTracking = (deviceData) => {
    setSelectedDevice(prevDev => ({ 
      ...prevDev, 
      ...deviceData
    }));

    if (leafletMapRef.current && vehicleMarkerRef.current) {
      const newLatLng = [deviceData.lat, deviceData.lng];
      const newHeading = deviceData.heading || 0;
      
      // Update marker position
      vehicleMarkerRef.current.setLatLng(newLatLng);
      
      // Update icon with rotation
      const iconHtml = createVehicleIcon(newHeading);
      const newIcon = window.L.divIcon({
        className: 'vehicle-marker',
        html: iconHtml,
        iconSize: [40, 40],
        iconAnchor: [20, 20],
      });
      vehicleMarkerRef.current.setIcon(newIcon);
      
      // Smooth pan to location
      leafletMapRef.current.panTo(newLatLng);
    }
  };

  // --- 2. INITIALIZE MAP ---
  const initMap = () => {
    if (!mapRef.current || leafletMapRef.current) return;
    
    const L = window.L;
    if (!L) return;

    const startLat = selectedDevice?.lat || 20.5937;
    const startLng = selectedDevice?.lng || 78.9629;
    const startHeading = selectedDevice?.heading || 0;

    // Create map instance
    const map = L.map(mapRef.current, {
      center: [startLat, startLng],
      zoom: 16,
      zoomControl: false,
      attributionControl: false,
    });

    // Add Google Maps tile layer
    L.tileLayer('https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
      maxZoom: 20,
      subdomains: ['mt0', 'mt1', 'mt2', 'mt3']
    }).addTo(map);

    leafletMapRef.current = map;
    
    // Add zoom control
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Add scale control
    L.control.scale({ imperial: false }).addTo(map);

    // Create vehicle marker
    const initialIcon = L.divIcon({
      className: 'vehicle-marker',
      html: createVehicleIcon(startHeading),
      iconSize: [40, 40],
      iconAnchor: [20, 20],
    });

    const marker = L.marker([startLat, startLng], { 
      icon: initialIcon, 
      zIndexOffset: 1000 
    }).addTo(map);
    
    vehicleMarkerRef.current = marker;
  };

  // --- 3. LOAD LEAFLET SCRIPTS ---
  useEffect(() => {
    if (!selectedDevice) {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
        vehicleMarkerRef.current = null;
      }
      return;
    }

    // Load Leaflet CSS
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement("link");
      link.id = 'leaflet-css';
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }
    
    // Load Leaflet JS
    if (!window.L) {
      const script = document.createElement("script");
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      script.async = true;
      script.onload = initMap;
      document.body.appendChild(script);
    } else {
      // Use timeout to ensure DOM is ready
      setTimeout(() => initMap(), 100);
    }

    // Cleanup function
    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
        vehicleMarkerRef.current = null;
      }
    };
  }, [selectedDevice]);

  // --- 4. DATA FETCHING AND FILTERING ---
  const updateSummary = (list) => {
    setSummary({
      total: list.length,
      online: list.filter(d => d.status === 'online').length,
      offline: list.filter(d => d.status !== 'online').length,
      moving: list.filter(d => d.speed > 5).length,
      stopped: list.filter(d => d.speed <= 5).length,
    });
  };

  const fetchInitialData = async () => {
    setLoading(true);
    const token = localStorage.getItem("token");
    try {
      const response = await fetch("https://api.websave.in/api/manufactur/liveTrackingAllDevices", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await response.json();
      const deviceList = data.devices || [];
      const devicesObj = {};
      
      deviceList.forEach(d => {
        devicesObj[d.deviceNo] = {
          ...d,
          lat: parseFloat(d.lat) || 0,
          lng: parseFloat(d.lng) || 0,
          speed: parseFloat(d.speed || 0),
          heading: parseFloat(d.heading || 0),
          status: 'online',
          lastUpdate: d.lastUpdate || new Date().toISOString()
        };
      });
      
      setDevices(devicesObj);
      updateSummary(deviceList);
    } catch (error) {
      console.error("Error fetching initial data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    fetchInitialData(); 
  }, []);

  // Filter devices based on search and IMEI filter
  const filteredDevices = Object.values(devices).filter(d => {
    const matchesSearch = searchTerm === "" || 
      d.vechileNo?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      d.deviceNo?.includes(searchTerm) ||
      d.RegistrationNo?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesImei = imeiFilter === "" || d.deviceNo?.includes(imeiFilter);

    return matchesSearch && matchesImei;
  });

  // Get only online devices
  const onlineDevices = filteredDevices.filter(d => d.status === 'online');

  // Toggle report section
  const toggleReportSection = (type) => setExpandedReports(prev => ({ ...prev, [type]: !prev[type] }));

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm("");
    setImeiFilter("");
    setShowAllDevices(true);
  };

  // =========================================================
  // VIEW MODE 1: LIVE TRACKING (Selected Device View)
  // =========================================================
  if (selectedDevice) {
    return (
      <div className="min-h-screen bg-slate-100 p-4 lg:p-6 font-sans">
        {/* Navigation Bar */}
        <div className="mb-6 flex items-center justify-between">
          <button 
            onClick={() => setSelectedDevice(null)} 
            className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl shadow-sm text-slate-600 font-bold text-xs hover:bg-slate-50 transition-all"
          >
            <ArrowLeft size={16} /> Back to Fleet List
          </button>
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-xs font-black uppercase tracking-widest animate-pulse">
              Live Tracking Active
            </span>
            <span className="text-xs text-slate-500 font-medium">
              IMEI: {selectedDevice.deviceNo}
            </span>
          </div>
        </div>

        {/* Split Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-150px)] min-h-[600px]">
          
          {/* LEFT: LIVE MAP */}
          <div className="lg:col-span-7 bg-white rounded-[2.5rem] p-3 shadow-xl border border-slate-200 relative overflow-hidden flex flex-col">
            <div 
              ref={mapRef} 
              className="flex-1 rounded-[2rem] overflow-hidden z-0 relative h-full w-full bg-slate-100"
            />
            
            {/* Floating Info Overlay */}
            <div className="absolute top-6 left-6 z-[1001] bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow-lg border border-white/50 max-w-xs">
              <h2 className="text-lg font-black text-slate-800">{selectedDevice.vechileNo || selectedDevice.RegistrationNo || "Unknown Vehicle"}</h2>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-2">IMEI: {selectedDevice.deviceNo}</p>
              <div className="flex gap-2 flex-wrap">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-100 text-emerald-700">
                  ONLINE
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                  selectedDevice.ignition === '1' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'
                }`}>
                  IGN: {selectedDevice.ignition === '1' ? 'ON' : 'OFF'}
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                  selectedDevice.speed > 0 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'
                }`}>
                  {selectedDevice.speed > 0 ? 'MOVING' : 'STOPPED'}
                </span>
              </div>
              <div className="mt-2 text-xs text-slate-600">
                <Clock className="w-3 h-3 inline mr-1" />
                Last update: {new Date(selectedDevice.lastUpdate || Date.now()).toLocaleTimeString()}
              </div>
            </div>
          </div>

          {/* RIGHT: LIVE STATS & INFO */}
          <div className="lg:col-span-5 flex flex-col gap-4 overflow-y-auto">
            {/* Live Stats Cards */}
            <div className="grid grid-cols-4 gap-3">
              <StatCard 
                icon={<Gauge size={14} />} 
                label="Speed" 
                val={selectedDevice.speed || 0} 
                unit="km/h" 
                color="text-amber-500" 
                bg="bg-amber-50" 
              />
              <StatCard 
                icon={<Compass size={14} />} 
                label="Heading" 
                val={selectedDevice.heading || 0} 
                unit="°" 
                color="text-blue-500" 
                bg="bg-blue-50" 
              />
              <StatCard 
                icon={<BatteryCharging size={14} />} 
                label="Battery" 
                val={selectedDevice.externalBattery || 12.4} 
                unit="V" 
                color="text-green-500" 
                bg="bg-green-50" 
              />
              <StatCard 
                icon={<Signal size={14} />} 
                label="Signal" 
                val={selectedDevice.gsmSignal || selectedDevice.rssi || 0} 
                unit="%" 
                color="text-purple-500" 
                bg="bg-purple-50" 
              />
            </div>

            {/* Live Location Details */}
            <div className="bg-white rounded-[2rem] p-6 border border-slate-200 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <MapPin className="w-4 h-4 text-indigo-500" />
                <h4 className="text-[10px] font-black text-slate-700 uppercase tracking-widest">Live Location</h4>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[9px] font-bold text-slate-400 uppercase">Latitude</p>
                  <p className="font-mono text-sm font-bold text-slate-700">
                    {selectedDevice.lat?.toFixed(6) || "0.000000"}
                  </p>
                </div>
                <div>
                  <p className="text-[9px] font-bold text-slate-400 uppercase">Longitude</p>
                  <p className="font-mono text-sm font-bold text-slate-700">
                    {selectedDevice.lng?.toFixed(6) || "0.000000"}
                  </p>
                </div>
              </div>
              <MapAddress lat={selectedDevice.lat} lng={selectedDevice.lng} />
            </div>

            {/* Vehicle Details */}
            <div className="bg-white rounded-[2rem] p-6 border border-slate-200 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <Car className="w-4 h-4 text-indigo-500" />
                <h4 className="text-[10px] font-black text-slate-700 uppercase tracking-widest">Vehicle Details</h4>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-medium text-slate-500">Vehicle Number</span>
                  <span className="text-sm font-bold text-slate-700">
                    {selectedDevice.vechileNo || selectedDevice.RegistrationNo || "N/A"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-medium text-slate-500">IMEI Number</span>
                  <span className="text-sm font-bold text-slate-700 font-mono">{selectedDevice.deviceNo}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-medium text-slate-500">Connection Status</span>
                  <span className="text-xs font-bold px-2 py-1 rounded bg-emerald-100 text-emerald-700">
                    {selectedDevice.status || 'online'}
                  </span>
                </div>
              </div>
            </div>

            {/* Reports Section */}
            <div className="flex-1 bg-white rounded-[2rem] p-4 border border-slate-200 shadow-sm flex flex-col">
              <div className="flex items-center gap-2 mb-4 px-2">
                <div className="p-1.5 bg-indigo-100 rounded-lg">
                  <BarChart3 className="w-4 h-4 text-indigo-600" />
                </div>
                <h4 className="text-[10px] font-black text-slate-700 uppercase tracking-widest">Live Status Reports</h4>
              </div>
              
              <div className="space-y-3 overflow-y-auto pr-1 flex-1">
                {['stoppage', 'ignition', 'moving'].map((type) => {
                  const isActive = 
                    (type === 'stoppage' && selectedDevice.speed === 0) ||
                    (type === 'ignition' && selectedDevice.ignition === '1') ||
                    (type === 'moving' && selectedDevice.speed > 0);
                  
                  return (
                    <div key={type} className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
                      <div className="p-3 flex items-center justify-between cursor-pointer hover:bg-slate-100 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className={`p-1.5 rounded-lg ${
                            type === 'stoppage' ? (isActive ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-400') : 
                            type === 'ignition' ? (isActive ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400') : 
                            (isActive ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400')
                          }`}>
                            {type === 'stoppage' && <StopCircle size={14} />}
                            {type === 'ignition' && <Power size={14} />}
                            {type === 'moving' && <Activity size={14} />}
                          </div>
                          <div>
                            <p className="text-[11px] font-bold text-slate-800 capitalize">{type} Status</p>
                            <span className="text-[9px] text-slate-500">
                              {type === 'stoppage' ? (isActive ? 'Currently Stopped' : 'Not Stopped') :
                               type === 'ignition' ? (isActive ? 'Ignition ON' : 'Ignition OFF') :
                               (isActive ? 'Currently Moving' : 'Not Moving')}
                            </span>
                          </div>
                        </div>
                        <div className={`px-2 py-1 rounded text-[10px] font-bold ${
                          isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {isActive ? 'ACTIVE' : 'INACTIVE'}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================
  // VIEW MODE 2: FLEET LIST (Default)
  // =========================================================
  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans">
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Live Fleet Tracking</h1>
          <p className="text-slate-500 font-medium">Real-time GPS Monitoring Dashboard</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={fetchInitialData} 
            className="px-4 py-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 flex items-center gap-2 shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 text-indigo-600 ${loading ? "animate-spin" : ""}`} />
            <span className="font-bold text-sm text-slate-700">Refresh</span>
          </button>
          <div className="text-xs text-slate-500">
            {summary.online} online / {summary.total} total
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        {[
          { label: "Total Assets", val: summary.total, color: "bg-indigo-600", icon: <Package size={18}/> },
          { label: "Online", val: summary.online, color: "bg-emerald-500", icon: <Wifi size={18}/> },
          { label: "Offline", val: summary.offline, color: "bg-slate-400", icon: <XCircle size={18}/> },
          { label: "Moving", val: summary.moving, color: "bg-blue-500", icon: <Navigation size={18}/> },
          { label: "Stopped", val: summary.stopped, color: "bg-amber-500", icon: <Clock size={18}/> },
        ].map((c, i) => (
          <div key={i} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 hover:scale-105 transition-transform">
            <div className={`${c.color} p-3 rounded-xl text-white shadow-lg`}>{c.icon}</div>
            <div>
              <div className="text-xl font-black text-slate-900">{c.val}</div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{c.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Search and Filter Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* General Search */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search vehicle or IMEI..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* IMEI Filter */}
          <div className="relative">
            <Filter className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              value={imeiFilter}
              onChange={(e) => setImeiFilter(e.target.value)}
              placeholder="Filter by IMEI number..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Filter Toggles */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowAllDevices(!showAllDevices)}
              className={`flex-1 py-2 text-sm font-bold rounded-xl transition-all ${
                showAllDevices ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Devices
            </button>
            <button
              onClick={() => {
                setShowAllDevices(false);
                setImeiFilter("");
                setSearchTerm("");
              }}
              className="flex-1 py-2 bg-slate-100 text-slate-600 text-sm font-bold rounded-xl hover:bg-slate-200 transition-colors"
            >
              Show Online Only
            </button>
            <button
              onClick={clearFilters}
              className="px-4 py-2 bg-white border border-slate-200 text-slate-600 text-sm font-bold rounded-xl hover:bg-slate-50 transition-colors"
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* Devices Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center justify-between">
            <div className="text-sm font-bold text-slate-700">
              {showAllDevices ? 'All Vehicles' : 'Online Vehicles Only'} 
              <span className="text-slate-400 ml-2">({filteredDevices.length} found)</span>
            </div>
            <div className="text-xs text-slate-500">
              Real-time updates via WebSocket
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">
              <tr>
                <th className="p-4">Vehicle Details</th>
                <th className="p-4">Status</th>
                <th className="p-4">Speed</th>
                <th className="p-4">Ignition</th>
                <th className="p-4">Last Update</th>
                <th className="p-4 text-right">Live Tracking</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {(showAllDevices ? filteredDevices : onlineDevices).map(d => (
                <tr key={d.deviceNo} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-slate-100 rounded-lg">
                        <Car className="w-5 h-5 text-slate-600" />
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 text-sm">
                          {d.vechileNo || d.RegistrationNo || "Unnamed Vehicle"}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">IMEI: {d.deviceNo}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                      d.status === 'online' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                    }`}>
                      {d.status === 'online' ? 'LIVE' : 'OFFLINE'}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <Gauge className="w-4 h-4 text-slate-400" />
                      <span className="font-mono text-sm font-bold text-slate-700">{d.speed || 0}</span>
                      <span className="text-[10px] text-slate-400">km/h</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className={`p-2 rounded-lg w-fit ${
                      d.ignition === '1' ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400'
                    }`}>
                      <Power size={16} />
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="text-xs text-slate-500">
                      {new Date(d.lastUpdate || Date.now()).toLocaleTimeString()}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {d.status === 'online' ? 'Receiving live updates' : 'Last known position'}
                    </div>
                  </td>
                  <td className="p-4 text-right">
                    <button 
                      onClick={() => setSelectedDevice(d)}
                      disabled={d.status !== 'online'}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg shadow-md transition-all flex items-center gap-1 ml-auto ${
                        d.status === 'online' 
                          ? 'bg-indigo-600 text-white hover:bg-indigo-700' 
                          : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                      }`}
                    >
                      <Navigation size={12} />
                      {d.status === 'online' ? 'Track Live' : 'Offline'}
                    </button>
                  </td>
                </tr>
              ))}
              
              {((showAllDevices ? filteredDevices : onlineDevices).length === 0) && (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-slate-500">
                    <div className="flex flex-col items-center gap-2">
                      <AlertCircle className="w-8 h-8 text-slate-300" />
                      <p>No vehicles found matching your filters</p>
                      <button
                        onClick={clearFilters}
                        className="mt-2 px-4 py-2 bg-indigo-600 text-white text-sm font-bold rounded-lg hover:bg-indigo-700 transition-colors"
                      >
                        Clear Filters
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Connection Status Footer */}
      <div className="mt-6 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-slate-200">
          <div className={`w-2 h-2 rounded-full ${socketRef.current?.connected ? 'bg-emerald-500' : 'bg-red-500'} animate-pulse`} />
          <span className="text-xs font-medium text-slate-600">
            {socketRef.current?.connected ? 'Connected to live server' : 'Connecting to server...'}
          </span>
        </div>
        <p className="text-xs text-slate-400 mt-2">
          Real-time updates powered by WebSocket connection
        </p>
      </div>
    </div>
  );
};

export default CustomerDashboard;