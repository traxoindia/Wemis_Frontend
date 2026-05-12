import React, { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import "leaflet/dist/leaflet.css";

// --- CUSTOM IMAGE ---
import vehicleLogo from "../Images/car.png";

// --- ICONS ---
import {
  Car,
  MapPin,
  Gauge,
  Power,
  RefreshCw,
  Search,
  Wifi,
  Package,
  Clock,
  Navigation,
  XCircle,
  ArrowLeft,
  BatteryCharging,
  Signal,
  Compass,
  History,
  Calendar,
  Menu,
  X,
  Grid3x3,
  List,
  Eye,
  EyeOff,
  AlertTriangle,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Route,
} from "lucide-react";

// --- CONFIG ---
const SOCKET_SERVER_URL = "https://api.websave.in";
const ANIMATION_DURATION = 2000;
const STALE_THRESHOLD = 5 * 60 * 1000;
const API_TOKEN = localStorage.getItem("token") || "your_api_token_here";
const PLAYBACK_SPEEDS = [0.5, 1, 2, 5, 10];

// --- HELPER: Format Date ---
const formatDate = (date) => {
  if (!date) return "N/A";
  const d = new Date(date);
  return d.toLocaleString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    day: "2-digit",
    month: "short",
  });
};

// --- HELPER: Format Speed ---
const formatSpeed = (speed) => {
  const num = Number(speed);
  if (isNaN(num)) return "0";
  return num.toFixed(1);
};

// --- HELPER: Create Rotatable Map Icon ---
const createVehicleIcon = (heading, isStatic = false) => {
  if (isStatic) {
    return `
      <div style="
        width: 40px; 
        height: 40px; 
        display: flex; 
        align-items: center; 
        justify-content: center;
        filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));
      ">
        <div style="
          width: 32px;
          height: 32px;
          background: #9CA3AF;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid #6B7280;
        ">
          <img src="${vehicleLogo}" style="width: 20px; height: 20px; opacity: 0.5;" />
        </div>
      </div>
    `;
  }
  
  return `
    <div style="
      transform: rotate(${heading}deg); 
      width: 100%; 
      height: 100%; 
      display: flex; 
      align-items: center; 
      justify-content: center;
      transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      filter: drop-shadow(0 4px 6px rgba(0,0,0,0.3));
    ">
      <img src="${vehicleLogo}" style="width: 40px; height: 40px; object-fit: contain; transition: all 0.3s ease;" />
    </div>
  `;
};

// --- HELPER: Get status with color and label ---
const getDeviceStatus = (device) => {
  if (!device) return { color: "gray", label: "Unknown", bg: "bg-gray-100", text: "text-gray-600" };
  
  if (device.isStaticOnly) {
    return { color: "gray", label: "No Signal", bg: "bg-gray-100", text: "text-gray-600" };
  }
  
  const lastUpdate = new Date(device.lastUpdate).getTime();
  const now = Date.now();
  const timeDiff = now - lastUpdate;
  
  if (device.status === "online" && timeDiff < STALE_THRESHOLD) {
    return { color: "green", label: "Online", bg: "bg-green-100", text: "text-green-700" };
  } else if (device.status === "online" && timeDiff >= STALE_THRESHOLD) {
    return { color: "yellow", label: "IDLE", bg: "bg-yellow-100", text: "text-yellow-700" };
  } else {
    return { color: "red", label: "Offline", bg: "bg-red-100", text: "text-red-700" };
  }
};

// --- COMPONENT: Location Display ---
const LocationDisplay = ({ lat, lng, isMinimized = false }) => {
  const [address, setAddress] = useState('Locating...');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!lat || !lng) {
      setAddress('No location data');
      setIsLoading(false);
      return;
    }
    
    const getAddress = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&v=2&lat=${lat}&lon=${lng}`,
          {
            headers: {
              'Accept-Language': 'en',
              'User-Agent': 'FleetManagementApp/1.0'
            }
          }
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setAddress(data.display_name?.split(',')[0] || 'Unknown Location');
      } catch (error) {
        console.error('Geocoding error:', error);
        setAddress(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
      } finally {
        setIsLoading(false);
      }
    };

    const timer = setTimeout(getAddress, 300);
    return () => clearTimeout(timer);
  }, [lat, lng]);

  if (isLoading && !isMinimized) {
    return (
      <div className="mt-3 p-3 bg-slate-50/80 rounded-xl flex items-center gap-2">
        <div className="w-4 h-4 border-2 border-slate-300 border-t-indigo-600 rounded-full animate-spin" />
        <span className="text-xs text-slate-400">Loading location...</span>
      </div>
    );
  }

  if (isMinimized) {
    return <p className="text-xs text-slate-500 truncate">{address}</p>;
  }

  return (
    <div className="mt-3 p-3 bg-slate-50/80 backdrop-blur-sm rounded-xl border border-slate-100 flex gap-3 items-start">
      <MapPin className="w-4 h-4 text-indigo-500 mt-0.5 shrink-0" />
      <p className="text-xs font-medium text-slate-600 leading-snug line-clamp-2">
        {address}
      </p>
    </div>
  );
};

// --- COMPONENT: Mobile Stats Drawer ---
const MobileStatsDrawer = ({ isOpen, onClose, device, displayData, isPlaybackMode }) => {
  if (!isOpen) return null;

  const status = getDeviceStatus(device);

  return (
    <div className="fixed inset-0 z-[2000] lg:hidden">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl p-6 max-h-[85vh] overflow-y-auto animate-slide-up">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-lg">Vehicle Details</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full">
            <X size={20} />
          </button>
        </div>

        <div className="mb-4 p-4 bg-slate-50 rounded-2xl">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-indigo-50 rounded-xl">
              <Car size={20} className="text-indigo-600" />
            </div>
            <div>
              <h4 className="font-bold">{device?.vechileNo || "Unknown"}</h4>
              <p className="text-xs text-slate-500">IMEI: {device?.deviceNo || device?.imei}</p>
              {device?.deviceType && (
                <p className="text-xs text-slate-500">Type: {device?.deviceType}</p>
              )}
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {isPlaybackMode ? (
              <span className="px-3 py-1 text-xs font-bold bg-amber-50 text-amber-700 rounded-lg">
                Playback Mode
              </span>
            ) : (
              <>
                <span className={`px-3 py-1 text-xs font-bold rounded-lg ${status.bg} ${status.text}`}>
                  {status.label}
                </span>
                {!device?.isStaticOnly && (
                  <span className={`px-3 py-1 text-xs font-bold rounded-lg ${
                    device?.ignition === "1" 
                      ? "bg-blue-50 text-blue-700" 
                      : "bg-slate-100 text-slate-500"
                  }`}>
                    <Power size={12} className="inline mr-1" />
                    {device?.ignition === "1" ? "ON" : "OFF"}
                  </span>
                )}
              </>
            )}
          </div>
        </div>

        {!device?.isStaticOnly && (
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="p-3 bg-slate-50 rounded-xl">
              <div className="flex items-center gap-2 text-amber-600 mb-1">
                <Gauge size={16} />
                <span className="text-xs font-medium">Speed</span>
              </div>
              <p className="text-xl font-bold">
                {displayData?.speed || 0} <span className="text-xs font-normal text-slate-500">km/h</span>
              </p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl">
              <div className="flex items-center gap-2 text-blue-600 mb-1">
                <Compass size={16} />
                <span className="text-xs font-medium">Heading</span>
              </div>
              <p className="text-xl font-bold">{displayData?.heading || 0}°</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl">
              <div className="flex items-center gap-2 text-green-600 mb-1">
                <BatteryCharging size={16} />
                <span className="text-xs font-medium">Battery</span>
              </div>
              <p className="text-xl font-bold">{device?.externalBattery?.toFixed(1) || 12.4}V</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl">
              <div className="flex items-center gap-2 text-purple-600 mb-1">
                <Signal size={16} />
                <span className="text-xs font-medium">Signal</span>
              </div>
              <p className="text-xl font-bold">{device?.gsmSignal || device?.rssi || 0}</p>
            </div>
          </div>
        )}

        <LocationDisplay lat={displayData?.lat} lng={displayData?.lng} />
      </div>
    </div>
  );
};

// --- COMPONENT: Desktop Stats Sidebar ---
const DesktopStatsSidebar = ({ device, displayData, isPlaybackMode, isMinimized, onToggleMinimize }) => {
  const status = getDeviceStatus(device);

  if (isMinimized) {
    return (
      <div className="hidden lg:block absolute top-4 right-4 z-[1001]">
        <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-white/50 w-16 overflow-hidden">
          <button
            onClick={onToggleMinimize}
            className="w-full p-4 hover:bg-slate-50 transition-colors flex flex-col items-center gap-2"
          >
            <Eye size={20} className="text-indigo-600" />
            <span className="text-[10px] font-medium text-slate-500">Expand</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="hidden lg:block absolute top-4 right-4 z-[1001] w-80">
      <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-white/50 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 rounded-xl">
              <Car size={20} className="text-indigo-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-slate-800 truncate">
                {device?.vechileNo || "Unknown"}
              </h3>
              <p className="text-xs text-slate-500 truncate">IMEI: {device?.deviceNo || device?.imei}</p>
              {device?.deviceType && (
                <p className="text-xs text-slate-400 truncate">Type: {device?.deviceType}</p>
              )}
            </div>
          </div>
          <button
            onClick={onToggleMinimize}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <EyeOff size={16} className="text-slate-400" />
          </button>
        </div>

        <div className="px-4 pt-3">
          <div className="flex gap-2">
            {isPlaybackMode ? (
              <span className="px-3 py-1 text-xs font-bold bg-amber-50 text-amber-700 rounded-lg">
                Playback Mode
              </span>
            ) : (
              <>
                <span className={`px-3 py-1 text-xs font-bold rounded-lg ${status.bg} ${status.text}`}>
                  {status.label}
                </span>
                {!device?.isStaticOnly && (
                  <span className={`px-3 py-1 text-xs font-bold rounded-lg ${
                    device?.ignition === "1" 
                      ? "bg-blue-50 text-blue-700" 
                      : "bg-slate-100 text-slate-500"
                  }`}>
                    <Power size={12} className="inline mr-1" />
                    {device?.ignition === "1" ? "ON" : "OFF"}
                  </span>
                )}
              </>
            )}
          </div>
        </div>

        {!device?.isStaticOnly && (
          <div className="p-4 grid grid-cols-2 gap-3">
            <div className="p-3 bg-slate-50 rounded-xl">
              <div className="flex items-center gap-2 text-amber-600 mb-1">
                <Gauge size={14} />
                <span className="text-xs">Speed</span>
              </div>
              <p className="text-lg font-bold">
                {displayData?.speed || 0} <span className="text-xs font-normal text-slate-500">km/h</span>
              </p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl">
              <div className="flex items-center gap-2 text-blue-600 mb-1">
                <Compass size={14} />
                <span className="text-xs">Heading</span>
              </div>
              <p className="text-lg font-bold">{displayData?.heading || 0}°</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl">
              <div className="flex items-center gap-2 text-green-600 mb-1">
                <BatteryCharging size={14} />
                <span className="text-xs">Battery</span>
              </div>
              <p className="text-lg font-bold">{device?.externalBattery?.toFixed(1) || 12.4}V</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl">
              <div className="flex items-center gap-2 text-purple-600 mb-1">
                <Signal size={14} />
                <span className="text-xs">Signal</span>
              </div>
              <p className="text-lg font-bold">{device?.gsmSignal || device?.rssi || 0}</p>
            </div>
          </div>
        )}

        <div className="p-4 border-t border-slate-100">
          <LocationDisplay lat={displayData?.lat} lng={displayData?.lng} />
        </div>
      </div>
    </div>
  );
};

const CustomerDashboard = () => {
  const socketRef = useRef(null);

  // --- Leaflet Refs ---
  const mapContainerRef = useRef(null);
  const leafletMapRef = useRef(null);
  const vehicleMarkerRef = useRef(null);
  const playbackMarkerRef = useRef(null);
  const playbackPathRef = useRef(null);
  const previousPositionsRef = useRef([]);
  const livePathRef = useRef(null);

  // --- Animation Refs ---
  const moveAnimationRef = useRef(null);
  const animationFrameRef = useRef(null);
  const selectedDeviceIdRef = useRef(null);

  // --- UI State ---
  const [showMobileStats, setShowMobileStats] = useState(false);
  const [showMobileList, setShowMobileList] = useState(false);
  const [isSidebarMinimized, setIsSidebarMinimized] = useState(false);
  const [viewMode, setViewMode] = useState('list');

  // --- Main State ---
  const [devices, setDevices] = useState({});
  const [staticDevices, setStaticDevices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [summary, setSummary] = useState({
    total: 0,
    online: 0,
    offline: 0,
    idle: 0,
    moving: 0,
    stopped: 0,
    noSignal: 0,
  });

  // --- Playback State ---
  const [isPlaybackMode, setIsPlaybackMode] = useState(false);
  const [playbackStartTime, setPlaybackStartTime] = useState("");
  const [playbackEndTime, setPlaybackEndTime] = useState("");
  const [playbackRoute, setPlaybackRoute] = useState([]);
  const [playbackIndex, setPlaybackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isLoadingPlayback, setIsLoadingPlayback] = useState(false);

  // --- Sync Ref with State ---
  useEffect(() => {
    selectedDeviceIdRef.current = selectedDevice ? (selectedDevice.deviceNo || selectedDevice.imei) : null;
  }, [selectedDevice]);

  // --- Helper: Extract data from socket ---
  const extractSocketData = (data) => {
    const liveData = data.liveTracking || data;
    const deviceInfo = data.dev || {};

    return {
      deviceNo: data.deviceNo || liveData.deviceNo || liveData.deviceId,
      imei: data.imei || liveData.imei || data.deviceNo,
      lat: Number(liveData.lat),
      lng: Number(liveData.lng),
      speed: Number(liveData.speed || 0),
      heading: Number(liveData.headDegree || liveData.heading || 0),
      ignition: liveData.ignition || "0",
      gpsFix: liveData.gpsFix || "0",
      satellites: liveData.satellites || "0",
      gsmSignal: liveData.gsmSignal || "0",
      externalBattery: parseFloat(liveData.batteryVoltage || liveData.mainsVoltage || 0),
      vechileNo: deviceInfo.vechileNo || liveData.vehicleNo || "Unknown",
      deviceType: deviceInfo.deviceType || liveData.deviceType || "Unknown",
      vechileType: deviceInfo.vechileType || liveData.vechileType || "Unknown",
      status: data.status || (liveData.gpsFix === "1" ? "online" : "offline"),
      lastUpdate: liveData.lastUpdate || liveData.timestamp || new Date().toISOString(),
      isStaticOnly: false,
    };
  };

  // --- Helper: Extract data from static API ---
  const extractStaticData = (vehicle) => {
    return {
      imei: vehicle.imei,
      deviceNo: vehicle.imei,
      vechileNo: vehicle.vechileNo,
      deviceType: vehicle.deviceType,
      vechileType: vehicle.vechileType,
      lat: null,
      lng: null,
      speed: 0,
      heading: 0,
      ignition: "0",
      status: "offline",
      lastUpdate: new Date().toISOString(),
      isStaticOnly: true,
    };
  };

  // --- Fetch Static Vehicles Data ---
  const fetchStaticVehicles = async () => {
    try {
      const response = await fetch(
        "https://api.websave.in/api/manufactur/coustmerSeewithout_live_vechile",
        {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${API_TOKEN}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Authentication failed. Please check your API token.");
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success && result.Vechiles) {
        setStaticDevices(result.Vechiles);
        return result.Vechiles;
      }
      return [];
    } catch (err) {
      console.error("Static API call error:", err);
      return [];
    }
  };

  // --- Merge static and live data ---
  const mergeDevicesData = (liveDevicesObj, staticVehiclesList) => {
    const merged = { ...liveDevicesObj };
    const liveImeis = new Set(Object.keys(liveDevicesObj));
    
    staticVehiclesList.forEach(staticVehicle => {
      const imei = staticVehicle.imei;
      if (!liveImeis.has(imei)) {
        merged[imei] = extractStaticData(staticVehicle);
      }
    });
    
    return merged;
  };

  // --- Update Summary ---
  const updateSummary = (list) => {
    const online = list.filter(d => {
      if (d.isStaticOnly) return false;
      const lastUpdate = new Date(d.lastUpdate).getTime();
      const now = Date.now();
      return d.status === "online" && (now - lastUpdate) < STALE_THRESHOLD;
    }).length;
    
    const idle = list.filter(d => {
      if (d.isStaticOnly) return false;
      const lastUpdate = new Date(d.lastUpdate).getTime();
      const now = Date.now();
      return d.status === "online" && (now - lastUpdate) >= STALE_THRESHOLD;
    }).length;
    
    const offline = list.filter(d => !d.isStaticOnly && d.status !== "online").length;
    const noSignal = list.filter(d => d.isStaticOnly).length;

    setSummary({
      total: list.length,
      online,
      offline,
      idle,
      noSignal,
      moving: list.filter((d) => !d.isStaticOnly && d.speed > 5).length,
      stopped: list.filter((d) => !d.isStaticOnly && d.speed <= 5 && !d.isStaticOnly).length,
    });
  };

  // --- ANIMATION FUNCTION ---
  const animateMarkerTo = (endLat, endLng, heading) => {
    if (!vehicleMarkerRef.current) return;

    const startLatLng = vehicleMarkerRef.current.getLatLng();
    const startLat = startLatLng.lat;
    const startLng = startLatLng.lng;

    const dist = Math.sqrt(
      Math.pow(endLat - startLat, 2) + Math.pow(endLng - startLng, 2)
    );
    
    if (dist > 0.05) {
      vehicleMarkerRef.current.setLatLng([endLat, endLng]);
      updateMarkerIcon(heading);
      return;
    }

    const deltaLat = endLat - startLat;
    const deltaLng = endLng - startLng;
    const startTime = performance.now();

    if (moveAnimationRef.current) {
      cancelAnimationFrame(moveAnimationRef.current);
    }

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / ANIMATION_DURATION, 1);

      const currentLat = startLat + deltaLat * progress;
      const currentLng = startLng + deltaLng * progress;

      vehicleMarkerRef.current.setLatLng([currentLat, currentLng]);

      if (progress < 1) {
        moveAnimationRef.current = requestAnimationFrame(animate);
      } else {
        vehicleMarkerRef.current.setLatLng([endLat, endLng]);
        updateMarkerIcon(heading);
      }
    };

    moveAnimationRef.current = requestAnimationFrame(animate);
  };

  const updateMarkerIcon = (heading) => {
    if (!vehicleMarkerRef.current) return;
    const iconHtml = createVehicleIcon(heading);
    const newIcon = window.L.divIcon({
      className: "vehicle-marker",
      html: iconHtml,
      iconSize: [40, 40],
      iconAnchor: [20, 20],
    });
    vehicleMarkerRef.current.setIcon(newIcon);
  };

  // --- PLAYBACK API & SETUP ---
  const fetchRoutePlayback = async () => {
    if (!selectedDevice?.deviceNo || !playbackStartTime || !playbackEndTime) {
      alert("Please select date range");
      return;
    }

    if (selectedDevice.isStaticOnly) {
      alert("This vehicle has no live data available for playback");
      return;
    }

    setIsLoadingPlayback(true);
    const token = localStorage.getItem("token");

    try {
      const response = await fetch(
        "https://api.websave.in/api/manufactur/fetchSingleRoutePlayback",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            deviceNo: selectedDevice.deviceNo,
            startTime: new Date(playbackStartTime).toISOString(),
            endTime: new Date(playbackEndTime).toISOString(),
          }),
        }
      );
      const data = await response.json();

      if (data.success && data.route?.length > 0) {
        const cleanRoute = data.route
          .map((p) => ({
            ...p,
            lat: parseFloat(p.latitude || p.lat),
            lng: parseFloat(p.longitude || p.lng),
            speed: parseFloat(p.speed || 0),
            heading: parseFloat(p.heading || p.headDegree || 0),
            timestamp: p.timestamp || p.lastUpdate,
          }))
          .filter((p) => !isNaN(p.lat) && !isNaN(p.lng));

        setPlaybackRoute(cleanRoute);
        setIsPlaybackMode(true);
        setIsPlaying(true);
        setupPlaybackVisualization(cleanRoute);
      } else {
        alert("No route data found for this period.");
      }
    } catch (e) {
      console.error("Playback fetch error:", e);
      alert("Failed to fetch history");
    } finally {
      setIsLoadingPlayback(false);
    }
  };

  const setupPlaybackVisualization = (route) => {
    const L = window.L;
    if (!L || !leafletMapRef.current || route.length === 0) return;

    // Hide live marker
    if (vehicleMarkerRef.current) vehicleMarkerRef.current.setOpacity(0);
    if (livePathRef.current) {
      leafletMapRef.current.removeLayer(livePathRef.current);
      livePathRef.current = null;
    }
    if (moveAnimationRef.current) cancelAnimationFrame(moveAnimationRef.current);
    
    // Remove existing playback layers
    if (playbackMarkerRef.current) leafletMapRef.current.removeLayer(playbackMarkerRef.current);
    if (playbackPathRef.current) leafletMapRef.current.removeLayer(playbackPathRef.current);

    // Draw route path
    const points = route.map((p) => [p.lat, p.lng]);
    playbackPathRef.current = L.polyline(points, {
      color: "#DC2626",
      weight: 4,
      opacity: 0.8,
      lineJoin: "round",
      lineCap: "round",
    }).addTo(leafletMapRef.current);
    
    // Fit bounds to route
    leafletMapRef.current.fitBounds(L.latLngBounds(points), { padding: [50, 50] });

    // Add marker at start
    const startPoint = route[0];
    const pbIcon = L.divIcon({
      className: "playback-marker",
      html: createVehicleIcon(startPoint.heading),
      iconSize: [40, 40],
      iconAnchor: [20, 20],
    });
    playbackMarkerRef.current = L.marker([startPoint.lat, startPoint.lng], {
      icon: pbIcon,
      zIndexOffset: 9999,
    }).addTo(leafletMapRef.current);
    
    setPlaybackIndex(0);
  };

  // --- PLAYBACK ANIMATION LOOP ---
  useEffect(() => {
    let lastFrameTime = 0;
    let animationId = null;

    const animate = (timestamp) => {
      if (!lastFrameTime) lastFrameTime = timestamp;
      const interval = 1000 / (30 * playbackSpeed);

      if (timestamp - lastFrameTime > interval) {
        setPlaybackIndex((prev) => {
          if (prev >= playbackRoute.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
        lastFrameTime = timestamp;
      }
      
      if (isPlaying && isPlaybackMode && playbackRoute.length > 0) {
        animationId = requestAnimationFrame(animate);
      }
    };

    if (isPlaying && isPlaybackMode && playbackRoute.length > 0) {
      animationId = requestAnimationFrame(animate);
    }

    return () => {
      if (animationId) cancelAnimationFrame(animationId);
    };
  }, [isPlaying, isPlaybackMode, playbackRoute.length, playbackSpeed]);

  // --- UPDATE PLAYBACK MARKER ---
  useEffect(() => {
    if (isPlaybackMode && playbackRoute[playbackIndex] && playbackMarkerRef.current) {
      const point = playbackRoute[playbackIndex];
      playbackMarkerRef.current.setLatLng([point.lat, point.lng]);
      
      const iconHtml = createVehicleIcon(point.heading);
      const newIcon = window.L.divIcon({
        className: "playback-marker",
        html: iconHtml,
        iconSize: [40, 40],
        iconAnchor: [20, 20],
      });
      playbackMarkerRef.current.setIcon(newIcon);
      
      if (leafletMapRef.current) {
        leafletMapRef.current.panTo([point.lat, point.lng], { 
          animate: true, 
          duration: 0.5 
        });
      }
    }
  }, [playbackIndex, isPlaybackMode, playbackRoute]);

  const exitPlaybackMode = () => {
    setIsPlaying(false);
    setIsPlaybackMode(false);
    setPlaybackRoute([]);
    setPlaybackIndex(0);

    if (leafletMapRef.current) {
      if (playbackMarkerRef.current) {
        leafletMapRef.current.removeLayer(playbackMarkerRef.current);
        playbackMarkerRef.current = null;
      }
      if (playbackPathRef.current) {
        leafletMapRef.current.removeLayer(playbackPathRef.current);
        playbackPathRef.current = null;
      }

      if (vehicleMarkerRef.current && selectedDevice && !selectedDevice.isStaticOnly && selectedDevice.lat && selectedDevice.lng) {
        vehicleMarkerRef.current.setOpacity(1);
        vehicleMarkerRef.current.setLatLng([selectedDevice.lat, selectedDevice.lng]);
        updateMarkerIcon(selectedDevice.heading);
        leafletMapRef.current.panTo([selectedDevice.lat, selectedDevice.lng]);
        
        // Restore live path
        if (previousPositionsRef.current.length > 1 && !livePathRef.current) {
          livePathRef.current = window.L.polyline(previousPositionsRef.current, {
            color: "#3B82F6",
            weight: 3,
            opacity: 0.7,
            dashArray: "5, 10",
          }).addTo(leafletMapRef.current);
        }
      } else if (vehicleMarkerRef.current) {
        vehicleMarkerRef.current.setOpacity(1);
      }
    }
  };

  // --- MAP INIT with Google Tiles ---
  const initMap = () => {
    if (!mapContainerRef.current || leafletMapRef.current) return;
    const L = window.L;
    if (!L) return;

    const startLat = selectedDevice?.lat || 21.485926;
    const startLng = selectedDevice?.lng || 86.907545;
    const startHeading = selectedDevice?.heading || 0;

    const map = L.map(mapContainerRef.current, {
      center: [startLat, startLng],
      zoom: 16,
      zoomControl: false,
      attributionControl: false,
      doubleClickZoom: true,
      scrollWheelZoom: true,
    });

    // Using Google Maps tiles (your previous map configuration)
    L.tileLayer("https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}", {
      maxZoom: 20,
      subdomains: ["mt0", "mt1", "mt2", "mt3"],
    }).addTo(map);

    L.control.zoom({ position: "bottomright" }).addTo(map);
    leafletMapRef.current = map;

    if (!selectedDevice?.isStaticOnly && selectedDevice?.lat && selectedDevice?.lng) {
      const initialIcon = L.divIcon({
        className: "vehicle-marker",
        html: createVehicleIcon(startHeading),
        iconSize: [40, 40],
        iconAnchor: [20, 20],
      });

      const marker = L.marker([startLat, startLng], {
        icon: initialIcon,
        zIndexOffset: 1000,
      }).addTo(map);
      vehicleMarkerRef.current = marker;
      previousPositionsRef.current = [[startLat, startLng]];
    } else if (selectedDevice?.lat && selectedDevice?.lng) {
      const staticIcon = L.divIcon({
        className: "vehicle-marker-static",
        html: `<div style="width: 40px; height: 40px; background: #9CA3AF; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid #6B7280;"><img src="${vehicleLogo}" style="width: 24px; height: 24px; opacity: 0.5;" /></div>`,
        iconSize: [40, 40],
        iconAnchor: [20, 20],
      });
      const marker = L.marker([startLat, startLng], {
        icon: staticIcon,
        zIndexOffset: 1000,
      }).addTo(map);
      vehicleMarkerRef.current = marker;
    }
  };

  // --- LOAD LEAFLET ---
  useEffect(() => {
    if (!selectedDevice) {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
        vehicleMarkerRef.current = null;
        playbackMarkerRef.current = null;
        playbackPathRef.current = null;
        livePathRef.current = null;
        previousPositionsRef.current = [];
      }
      return;
    }

    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link");
      link.id = "leaflet-css";
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }

    if (!window.L) {
      const script = document.createElement("script");
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      script.async = true;
      script.onload = () => setTimeout(() => initMap(), 100);
      document.body.appendChild(script);
    } else {
      setTimeout(() => initMap(), 100);
    }
  }, [selectedDevice?.deviceNo || selectedDevice?.imei]);

  // --- SOCKET & LIVE DATA ---
  useEffect(() => {
    const initializeData = async () => {
      setLoading(true);
      const staticVehicles = await fetchStaticVehicles();
      
      if (socketRef.current) return;

      const storedUser = localStorage.getItem("user");
      let myUserId;
      try {
        myUserId = JSON.parse(storedUser)?._id || JSON.parse(storedUser)?.id;
      } catch (e) {}

      const socket = io(SOCKET_SERVER_URL, {
        path: "/socket.io",
        transports: ["polling", "websocket"],
        query: { userId: myUserId },
      });

      socketRef.current = socket;

      const token = localStorage.getItem("token");
      try {
        const response = await fetch(
          "https://api.websave.in/api/manufactur/liveTrackingAllDevices",
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const data = await response.json();
        
        const deviceList = data.devices || [];
        const devicesObj = {};

        deviceList.forEach((d) => {
          const extracted = extractSocketData(d);
          devicesObj[extracted.deviceNo || extracted.imei] = extracted;
        });

        const mergedDevices = mergeDevicesData(devicesObj, staticVehicles);
        setDevices(mergedDevices);
        updateSummary(Object.values(mergedDevices));
      } catch (error) {
        console.error("Fetch error:", error);
        const mergedDevices = mergeDevicesData({}, staticVehicles);
        setDevices(mergedDevices);
        updateSummary(Object.values(mergedDevices));
      } finally {
        setLoading(false);
      }

      socket.on("gps-update", (data) => {
        const extractedData = extractSocketData(data);
        const imeiKey = extractedData.deviceNo || extractedData.imei;

        setDevices((prev) => {
          const staticVehicle = staticVehicles.find(v => v.imei === imeiKey);
          
          const updated = {
            ...prev,
            [imeiKey]: {
              ...extractedData,
              isStaticOnly: false,
              vechileNo: extractedData.vechileNo || staticVehicle?.vechileNo || "Unknown",
              deviceType: extractedData.deviceType || staticVehicle?.deviceType || "Unknown",
              vechileType: extractedData.vechileType || staticVehicle?.vechileType || "Unknown",
            },
          };
          updateSummary(Object.values(updated));
          return updated;
        });

        if (selectedDeviceIdRef.current === imeiKey && !isPlaybackMode) {
          setSelectedDevice((prev) => ({ ...prev, ...extractedData, isStaticOnly: false }));

          if (leafletMapRef.current && vehicleMarkerRef.current && extractedData.lat && extractedData.lng) {
            const newLatLng = [extractedData.lat, extractedData.lng];
            
            // Update path
            previousPositionsRef.current.push(newLatLng);
            if (previousPositionsRef.current.length > 100) {
              previousPositionsRef.current = previousPositionsRef.current.slice(-100);
            }

            if (livePathRef.current) {
              livePathRef.current.setLatLngs(previousPositionsRef.current);
            } else if (previousPositionsRef.current.length > 1) {
              livePathRef.current = window.L.polyline(previousPositionsRef.current, {
                color: "#3B82F6",
                weight: 3,
                opacity: 0.7,
                lineJoin: "round",
                dashArray: "5, 10",
              }).addTo(leafletMapRef.current);
            }

            animateMarkerTo(extractedData.lat, extractedData.lng, extractedData.heading);
            leafletMapRef.current.panTo(newLatLng, {
              animate: true,
              duration: 2.0,
            });
          }
        }
      });
    };

    initializeData();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      if (moveAnimationRef.current) cancelAnimationFrame(moveAnimationRef.current);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, []);

  const filteredDevices = Object.values(devices).filter(
    (d) =>
      d.vechileNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.deviceNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.imei?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.deviceType?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const displayData = isPlaybackMode && playbackRoute.length > 0
    ? playbackRoute[playbackIndex]
    : selectedDevice;

  // =========================================================
  // VIEW 1: SINGLE DEVICE (Full Screen Map)
  // =========================================================
  if (selectedDevice) {
    return (
      <div className="h-screen w-screen overflow-hidden relative font-sans">
        <div ref={mapContainerRef} className="absolute inset-0 z-0" />

        {/* Top Navigation Bar */}
        <div className="absolute top-0 left-0 right-0 z-[1001] bg-gradient-to-b from-black/50 to-transparent p-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => {
                setSelectedDevice(null);
                exitPlaybackMode();
                setShowMobileStats(false);
              }}
              className="flex items-center gap-2 px-3 py-2 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg text-slate-700 font-medium text-sm hover:bg-white transition-all"
            >
              <ArrowLeft size={16} /> Back
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowMobileList(!showMobileList)}
                className="lg:hidden flex items-center gap-2 px-3 py-2 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg"
              >
                <Menu size={16} />
                <span className="text-sm font-medium">Vehicles</span>
              </button>

              <button
                onClick={() => setShowMobileStats(true)}
                className="lg:hidden flex items-center gap-2 px-3 py-2 bg-indigo-600 text-white rounded-xl shadow-lg"
              >
                <Car size={16} />
                <span className="text-sm font-medium">Stats</span>
              </button>
            </div>
          </div>

          {/* Playback Controls */}
          {isPlaybackMode && (
            <div className="mt-2 flex items-center gap-2 bg-white/90 backdrop-blur-sm p-2 rounded-xl shadow-lg">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="p-2 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors"
              >
                {isPlaying ? <Pause size={16} /> : <Play size={16} />}
              </button>
              <div className="flex items-center gap-1">
                {PLAYBACK_SPEEDS.map((s) => (
                  <button
                    key={s}
                    onClick={() => setPlaybackSpeed(s)}
                    className={`px-2 py-1 text-xs font-bold rounded-lg transition-all ${
                      playbackSpeed === s 
                        ? "bg-indigo-600 text-white shadow-md" 
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {s}x
                  </button>
                ))}
              </div>
              <button
                onClick={exitPlaybackMode}
                className="px-3 py-1.5 text-xs font-medium bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100 transition-colors"
              >
                Exit
              </button>
            </div>
          )}
        </div>

        {/* Desktop Stats Sidebar */}
        <DesktopStatsSidebar
          device={selectedDevice}
          displayData={displayData}
          isPlaybackMode={isPlaybackMode}
          isMinimized={isSidebarMinimized}
          onToggleMinimize={() => setIsSidebarMinimized(!isSidebarMinimized)}
        />

        {/* Mobile Stats Drawer */}
        <MobileStatsDrawer
          isOpen={showMobileStats}
          onClose={() => setShowMobileStats(false)}
          device={selectedDevice}
          displayData={displayData}
          isPlaybackMode={isPlaybackMode}
        />

        {/* Mobile Vehicle List Drawer */}
        {showMobileList && (
          <div className="lg:hidden fixed inset-0 z-[2000]">
            <div className="absolute inset-0 bg-black/50" onClick={() => setShowMobileList(false)} />
            <div className="absolute left-0 top-0 bottom-0 w-80 bg-white shadow-2xl overflow-y-auto">
              <div className="p-4 border-b sticky top-0 bg-white z-10">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold">Vehicles</h3>
                  <button onClick={() => setShowMobileList(false)} className="p-2">
                    <X size={20} />
                  </button>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search vehicles..."
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 rounded-xl text-sm"
                  />
                </div>
              </div>
              <div className="p-2">
                {filteredDevices.map((d) => {
                  const status = getDeviceStatus(d);
                  return (
                    <button
                      key={d.deviceNo || d.imei}
                      onClick={() => {
                        setSelectedDevice(d);
                        setShowMobileList(false);
                        exitPlaybackMode();
                      }}
                      className={`w-full p-3 rounded-xl text-left hover:bg-slate-50 transition-colors ${
                        (selectedDevice?.deviceNo === d.deviceNo || selectedDevice?.imei === d.imei) ? 'bg-indigo-50' : ''
                      }`}
                    >
                      <div className="font-medium">{d.vechileNo || "Unknown"}</div>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs text-slate-500">{d.deviceNo || d.imei}</span>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${status.bg} ${status.text}`}>
                          {status.label}
                        </span>
                      </div>
                      {d.lat && d.lng && <LocationDisplay lat={d.lat} lng={d.lng} isMinimized={true} />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Playback Progress Bar */}
        {isPlaybackMode && playbackRoute.length > 0 && (
          <div className="absolute bottom-4 left-4 right-4 z-[1001] lg:left-auto lg:right-4 lg:w-96">
            <div className="bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow-xl">
              <input
                type="range"
                min="0"
                max={playbackRoute.length - 1}
                value={playbackIndex}
                onChange={(e) => {
                  setPlaybackIndex(Number(e.target.value));
                  setIsPlaying(false);
                }}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
              <div className="flex justify-between mt-2 text-xs text-slate-500">
                <span>{playbackRoute[0]?.timestamp ? new Date(playbackRoute[0].timestamp).toLocaleTimeString() : 'Start'}</span>
                <span>{playbackRoute[playbackIndex]?.timestamp ? new Date(playbackRoute[playbackIndex].timestamp).toLocaleTimeString() : 'Current'}</span>
                <span>{playbackRoute[playbackRoute.length-1]?.timestamp ? new Date(playbackRoute[playbackRoute.length-1].timestamp).toLocaleTimeString() : 'End'}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // =========================================================
  // VIEW 2: FLEET LIST
  // =========================================================
  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6 font-sans">
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800">Fleet Command</h1>
          <p className="text-sm text-slate-500 mt-1">Real-time vehicle monitoring</p>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="bg-white rounded-lg border border-slate-200 p-1 flex items-center">
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'list' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <List size={18} />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'grid' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <Grid3x3 size={18} />
            </button>
          </div>
          
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 flex items-center gap-2 shadow-sm transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            <span className="text-sm font-medium">Refresh</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-7 gap-3 mb-6">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
          <div className="text-xs text-slate-500 mb-1">Total</div>
          <div className="text-2xl font-bold text-slate-800">{summary.total}</div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
          <div className="text-xs text-green-600 mb-1">Online</div>
          <div className="text-2xl font-bold text-green-600">{summary.online}</div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
          <div className="text-xs text-yellow-600 mb-1">IDLE</div>
          <div className="text-2xl font-bold text-yellow-600">{summary.idle}</div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
          <div className="text-xs text-red-600 mb-1">Offline</div>
          <div className="text-2xl font-bold text-red-600">{summary.offline}</div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
          <div className="text-xs text-gray-600 mb-1 flex items-center gap-1">
            <AlertTriangle size={12} /> No Signal
          </div>
          <div className="text-2xl font-bold text-gray-600">{summary.noSignal}</div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
          <div className="text-xs text-blue-600 mb-1">Moving</div>
          <div className="text-2xl font-bold text-blue-600">{summary.moving}</div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
          <div className="text-xs text-amber-600 mb-1">Stopped</div>
          <div className="text-2xl font-bold text-amber-600">{summary.stopped}</div>
        </div>
      </div>

      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by vehicle, IMEI, or type..."
            className="w-full pl-9 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-100"
          />
        </div>
      </div>

      {viewMode === 'list' ? (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="p-4 text-left text-xs font-medium text-slate-500 uppercase">Vehicle</th>
                  <th className="p-4 text-left text-xs font-medium text-slate-500 uppercase">Type</th>
                  <th className="p-4 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
                  <th className="p-4 text-left text-xs font-medium text-slate-500 uppercase">Speed</th>
                  <th className="p-4 text-left text-xs font-medium text-slate-500 uppercase">Location</th>
                  <th className="p-4 text-left text-xs font-medium text-slate-500 uppercase">Last Update</th>
                  <th className="p-4 text-right text-xs font-medium text-slate-500 uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDevices.map((d) => {
                  const status = getDeviceStatus(d);
                  return (
                    <tr key={d.deviceNo || d.imei} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${d.isStaticOnly ? 'bg-gray-100' : 'bg-indigo-50'}`}>
                            <Car size={18} className={d.isStaticOnly ? 'text-gray-400' : 'text-indigo-600'} />
                          </div>
                          <div>
                            <div className="font-medium text-slate-800">{d.vechileNo || "Unknown"}</div>
                            <div className="text-xs text-slate-500">IMEI: {d.deviceNo || d.imei}</div>
                          </div>
                        </div>
                       </td>
                      <td className="p-4">
                        <div className="text-sm text-slate-600">{d.deviceType || d.vechileType || "-"}</div>
                       </td>
                      <td className="p-4">
                        <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${status.bg} ${status.text}`}>
                          {status.label}
                        </span>
                       </td>
                      <td className="p-4">
                        <div className="font-medium">{d.isStaticOnly ? "-" : `${d.speed} km/h`}</div>
                       </td>
                      <td className="p-4 max-w-xs">
                        {d.lat && d.lng ? (
                          <LocationDisplay lat={d.lat} lng={d.lng} isMinimized={true} />
                        ) : (
                          <span className="text-xs text-slate-400">No location data</span>
                        )}
                       </td>
                      <td className="p-4">
                        <div className="text-sm text-slate-600">
                          {new Date(d.lastUpdate || Date.now()).toLocaleString()}
                        </div>
                       </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => setSelectedDevice(d)}
                          className="px-3 py-1.5 bg-indigo-50 text-indigo-600 text-xs font-medium rounded-lg hover:bg-indigo-100 transition-colors"
                        >
                          Track
                        </button>
                       </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredDevices.map((d) => {
            const status = getDeviceStatus(d);
            return (
              <div
                key={d.deviceNo || d.imei}
                className={`bg-white rounded-xl border p-4 hover:shadow-md transition-shadow cursor-pointer ${
                  d.isStaticOnly ? 'border-gray-200 bg-gray-50/30' : 'border-slate-200'
                }`}
                onClick={() => setSelectedDevice(d)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${d.isStaticOnly ? 'bg-gray-100' : 'bg-indigo-50'}`}>
                      <Car size={20} className={d.isStaticOnly ? 'text-gray-400' : 'text-indigo-600'} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-800">{d.vechileNo || "Unknown"}</h3>
                      <p className="text-xs text-slate-500">IMEI: {d.deviceNo || d.imei}</p>
                    </div>
                  </div>
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${status.bg} ${status.text}`}>
                    {status.label}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div>
                    <span className="text-xs text-slate-500 block">Type</span>
                    <span className="text-sm">{d.deviceType || d.vechileType || "-"}</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block">Speed</span>
                    <span className="text-sm">{d.isStaticOnly ? "-" : `${d.speed} km/h`}</span>
                  </div>
                </div>

                {d.lat && d.lng ? (
                  <LocationDisplay lat={d.lat} lng={d.lng} isMinimized={true} />
                ) : (
                  <p className="text-xs text-slate-400">No location data available</p>
                )}

                <div className="mt-3 pt-3 border-t border-slate-100 flex justify-between items-center">
                  <span className="text-xs text-slate-500">
                    {new Date(d.lastUpdate).toLocaleTimeString()}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedDevice(d);
                    }}
                    className="px-3 py-1.5 bg-indigo-50 text-indigo-600 text-xs font-medium rounded-lg hover:bg-indigo-100"
                  >
                    Track
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {filteredDevices.length === 0 && (
        <div className="text-center py-12">
          <div className="p-4 bg-slate-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <Search size={24} className="text-slate-400" />
          </div>
          <p className="text-slate-500">No vehicles found</p>
        </div>
      )}
    </div>
  );
};

export default CustomerDashboard;