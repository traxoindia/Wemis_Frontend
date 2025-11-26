import React, { useEffect, useRef, useState, useCallback } from "react";
// 🎯 NEW: Import useLocation from react-router-dom
import { useLocation } from "react-router-dom"; 
import {
    Navigation,
    Zap,
    MapPin,
    Clock,
    Satellite,
    Battery,
    Signal,
    Activity,
    Compass,
    AlertCircle,
    Car,
    Gauge,
    Info,
    Move,
    Loader2
} from "lucide-react";

const Livetracking = () => {
    // 🎯 FIX 1: Use useLocation to get query params
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const deviceNosString = queryParams.get('deviceNos');
    const deviceNosList = deviceNosString ? deviceNosString.split(',').map(no => no.trim()).filter(no => no.length > 0) : [];
    
    // 🎯 FIX 2: Determine the single device to track (the first one)
    const trackedDeviceNo = deviceNosList[0] || 'N/A';
    const initialDevice = { deviceNo: trackedDeviceNo, vehicleNo: 'Loading...' };

    const mapRef = useRef(null);
    const [map, setMap] = useState(null);
    const [vehiclePosition, setVehiclePosition] = useState(null);
    const [currentLocation, setCurrentLocation] = useState(null);
    const [status, setStatus] = useState("Initializing");
    const [speed, setSpeed] = useState(0);
    const [heading, setHeading] = useState(0);
    const [satellites, setSatellites] = useState(0);
    const [batteryVoltage, setBatteryVoltage] = useState("0");
    const [gsmSignal, setGsmSignal] = useState("0");
    const [altitude, setAltitude] = useState(0);
    const [deviceStatus, setDeviceStatus] = useState("Unknown");
    const [lastUpdateTime, setLastUpdateTime] = useState(null);
    const [rawData, setRawData] = useState(null);
    const [activeTab, setActiveTab] = useState("tracking");
    const [deviceInfo, setDeviceInfo] = useState(initialDevice); // State for device/vehicle info

    const loaderRef = useRef(null);
    const geoErrorRef = useRef(null);
    const geoErrorMessageRef = useRef(null);
    const pathCoordinates = useRef([]);
    const watchIdRef = useRef(null);
    const leafletMapRef = useRef(null);
    const leafletVehicleMarkerRef = useRef(null);
    const leafletPathRef = useRef(null);
    const startTime = useRef(Date.now());
    const [duration, setDuration] = useState(0);

    // --- Core Effects and Map Setup ---

    useEffect(() => {
        // If no device is passed, stop initialization and show error
        if (trackedDeviceNo === 'N/A') {
            setStatus("No Device Selected");
            hideLoader();
            return;
        }

        const timer = setInterval(() => {
            setDuration(Math.floor((Date.now() - startTime.current) / 1000));
        }, 1000);

        loadLeafletMap();

        return () => {
            clearInterval(timer);
            if (watchIdRef.current) {
                navigator.geolocation.clearWatch(watchIdRef.current);
            }
            if (leafletMapRef.current) {
                if (leafletMapRef.current.trackingInterval) {
                     clearInterval(leafletMapRef.current.trackingInterval);
                }
                leafletMapRef.current.remove();
            }
        };
    }, [trackedDeviceNo]); // Depend on trackedDeviceNo to initialize

    const formatDuration = (seconds) => {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const loadLeafletMap = () => {
        const existingLeafletCSS = document.querySelector('link[href*="leaflet.css"]');
        if (!existingLeafletCSS) {
            const link = document.createElement("link");
            link.rel = "stylesheet";
            link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
            document.head.appendChild(link);
        }

        // Use a flag to prevent multiple script loads if initLeafletMap is called multiple times
        if (!window.L) {
             const existingLeafletJS = document.querySelector('script[src*="leaflet.js"]');
             if (!existingLeafletJS) {
                const script = document.createElement("script");
                script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
                script.async = true;
                script.onload = () => initLeafletMap();
                document.body.appendChild(script);
            } else {
                initLeafletMap();
            }
        } else {
            initLeafletMap();
        }
    };

    const initLeafletMap = () => {
        if (!window.L || !mapRef.current) return;

        if (leafletMapRef.current) {
             leafletMapRef.current.remove();
        }

        const defaultLocation = { lat: 20.2961, lng: 85.8245 }; // Bhubaneswar, Odisha

        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const userLocation = {
                        lat: pos.coords.latitude,
                        lng: pos.coords.longitude,
                    };
                    setCurrentLocation(userLocation);
                    setVehiclePosition(userLocation);
                    initializeMap(userLocation);
                },
                (err) => {
                    handleGeoError("Location access denied. Using default location.");
                    setVehiclePosition(defaultLocation);
                    initializeMap(defaultLocation);
                }
            );
        } else {
            initializeMap(defaultLocation);
        }
    };

    const initializeMap = (location) => {
        const mapInstance = window.L.map(mapRef.current).setView(
            [location.lat, location.lng],
            16
        );

        window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19,
        }).addTo(mapInstance);

        leafletMapRef.current = mapInstance;

        if (currentLocation) {
            const currentIcon = window.L.divIcon({
                className: 'current-location-marker',
                html: `<div style="width: 16px; height: 16px; background: #3B82F6; border: 3px solid white; border-radius: 50%; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"></div>`,
                iconSize: [16, 16],
                iconAnchor: [8, 8],
            });

            window.L.marker([currentLocation.lat, currentLocation.lng], {
                icon: currentIcon,
            }).addTo(mapInstance).bindPopup("Your Location");
        }

        initializeVehicleTracking(mapInstance, location);
        hideLoader();
    };

    const createVehicleIcon = () => {
        const isMoving = speed > 0.5;
        const batteryLevel = parseFloat(batteryVoltage);
        let batteryColor = "#F59E0B"; 
        if (batteryLevel >= 3.8) batteryColor = "#10B981"; 
        else if (batteryLevel < 3.5 && batteryLevel > 0) batteryColor = "#EF4444"; 

        return `
            <div style="position: relative; width: 60px; height: 60px;">
                <div style="position: absolute; top: -5px; left: 50%; transform: translateX(-50%); background: #1E293B; color: white; padding: 4px 8px; border-radius: 8px; font-size: 10px; font-weight: 700; box-shadow: 0 2px 8px rgba(0,0,0,0.3); white-space: nowrap; display: flex; align-items: center; gap: 4px;">
                    <div style="width: 6px; height: 6px; border-radius: 50%; background: ${isMoving ? '#10B981' : '#F59E0B'};"></div>
                    ${speed.toFixed(0)} km/h
                </div>
                
                <svg width="60" height="60" viewBox="0 0 64 64" style="filter: drop-shadow(0 3px 6px rgba(0,0,0,0.3)); transform: rotate(${heading}deg);">
                    <path d="M20 24 L44 24 L48 32 L48 44 L44 48 L20 48 L16 44 L16 32 Z" 
                          fill="#4F46E5" stroke="#3730A3" stroke-width="1.5"/>
                    
                    <path d="M22 24 L26 28 L26 32 L22 32 Z" 
                          fill="#93C5FD" opacity="0.8" stroke="#60A5FA" stroke-width="0.5"/>
                    <path d="M42 24 L38 28 L38 32 L42 32 Z" 
                          fill="#93C5FD" opacity="0.8" stroke="#60A5FA" stroke-width="0.5"/>
                    
                    <rect x="26" y="24" width="12" height="8" fill="#1E293B" opacity="0.7"/>
                    
                    <circle cx="22" cy="28" r="2" fill="#FCD34D" opacity="0.9"/>
                    <circle cx="42" cy="28" r="2" fill="#FCD34D" opacity="0.9"/>
                    
                    <circle cx="22" cy="40" r="4" fill="#1F2937" stroke="#000" stroke-width="1"/>
                    <circle cx="42" cy="40" r="4" fill="#1F2937" stroke="#000" stroke-width="1"/>
                    
                    <rect x="52" y="8" width="8" height="4" fill="${batteryColor}" rx="1" stroke="#1F2937" stroke-width="0.5"/>
                    <path d="M4 12 L8 8 L8 16 Z" fill="${gsmSignal > 15 ? '#10B981' : '#EF4444'}" opacity="0.8"/>
                </svg>
            </div>
        `;
    };
    
    const initializeVehicleTracking = (mapInstance, initialPosition) => {
        const vehicleIcon = window.L.divIcon({
            className: 'vehicle-marker',
            html: createVehicleIcon(),
            iconSize: [60, 60],
            iconAnchor: [30, 30],
        });

        const vehicleMarker = window.L.marker(
            [initialPosition.lat, initialPosition.lng],
            { icon: vehicleIcon, zIndexOffset: 1000 }
        ).addTo(mapInstance).bindPopup(`
            <div style="font-weight: bold;">
                ${deviceInfo.vehicleNo || 'Vehicle'} - ${speed.toFixed(0)} km/h<br/>
                Battery: ${batteryVoltage}V<br/>
                Signal: ${gsmSignal} RSSI
            </div>
        `);

        leafletVehicleMarkerRef.current = vehicleMarker;

        const vehiclePath = window.L.polyline([], {
            color: '#4F46E5', 
            weight: 4,
            opacity: 0.7,
            lineJoin: 'round'
        }).addTo(mapInstance);

        leafletPathRef.current = vehiclePath;

        // Immediately update once map is initialized
        updateVehicleFromAPI(mapInstance, vehicleMarker, vehiclePath);

        const trackingInterval = setInterval(() => {
            updateVehicleFromAPI(mapInstance, vehicleMarker, vehiclePath);
        }, 3000);

        mapInstance.trackingInterval = trackingInterval;
        setStatus("Live");
    };

    const hideLoader = () => {
        if (loaderRef.current) {
            loaderRef.current.style.opacity = "0";
            setTimeout(() => {
                loaderRef.current.classList.add("hidden");
            }, 500);
        }
    };

    const handleGeoError = (message) => {
        if (geoErrorRef.current && geoErrorMessageRef.current) {
            geoErrorMessageRef.current.textContent = message;
            geoErrorRef.current.classList.remove("hidden");
            geoErrorRef.current.style.opacity = "1";
            setTimeout(() => {
                geoErrorRef.current.style.opacity = "0";
                setTimeout(() => geoErrorRef.current.classList.add("hidden"), 300);
            }, 4000);
        }
    };

    // --- API and Update Logic ---

    // Use useCallback to memoize the API function
    const fetchVehicleDataFromAPI = useCallback(async () => {
        if (trackedDeviceNo === 'N/A') {
            setStatus("No Device ID");
            return null;
        }

        const token = localStorage.getItem('token');
        if (!token) {
            setStatus("Auth Required");
            return null;
        }

        try {
            const apiUrl = 'https://api.websave.in/api/manufactur/liveTrackingSingleDevice';

            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ deviceNo: trackedDeviceNo }),
            });

            if (!response.ok) {
                if (response.status === 401 || response.status === 403) {
                    setStatus("Unauthorized");
                } else {
                    setStatus("API Error");
                }
                throw new Error(`API call failed with status: ${response.status}`);
            }

            const data = await response.json();
            setRawData(data.rawData || data);

            const locationData = data.location || {};
            const rawData = data.rawData || data;
            const deviceStatusData = data.deviceStatus || {};
            const deviceDetails = data.deviceInfo || {}; // Assuming this object holds vehicle/device info

            // 🎯 Update device/vehicle info state
            setDeviceInfo({
                deviceNo: trackedDeviceNo,
                vehicleNo: deviceDetails.vechileNo || deviceDetails.vehicleNo || 'N/A', // Assuming API returns vehicleNo
            });

            const lat = parseFloat(locationData.latitude || rawData.lat || 0);
            const lng = parseFloat(locationData.longitude || rawData.lng || 0);
            const speed = parseFloat(locationData.speed || rawData.speed || 0);
            const headingValue = parseFloat(locationData.heading || rawData.heading || 0);
            const satellitesValue = parseInt(deviceStatusData.satellites || rawData.satellites || 0);
            const batteryValue = deviceStatusData.batteryVoltage || rawData.batteryVoltage || "0";
            const gsmValue = deviceStatusData.gsmSignal || rawData.gsmSignal || "0";
            const altitudeValue = parseFloat(locationData.altitude || rawData.altitude || 0);
            const deviceStatusValue = deviceDetails.status || rawData.packetStatus || "UNKNOWN";
            const lastUpdateDate = new Date(rawData.timestamp || rawData.lastUpdate || Date.now());

            if (lat !== 0 && lng !== 0) {
                setSatellites(satellitesValue);
                setBatteryVoltage(batteryValue);
                setGsmSignal(gsmValue);
                setAltitude(altitudeValue);
                setDeviceStatus(deviceStatusValue);
                setLastUpdateTime(lastUpdateDate);
                setHeading(headingValue);

                return {
                    position: { lat: lat, lng: lng },
                    speed: speed,
                    heading: headingValue,
                    timestamp: Date.now(),
                };
            } else {
                setStatus("No GPS Fix");
                return null;
            }

        } catch (error) {
            if (status !== "Unauthorized") {
                setStatus("Network Error");
            }
            return null;
        }
    }, [trackedDeviceNo, status]);


    const updateVehicleFromAPI = async (mapInstance, vehicleMarker, vehiclePath) => {
        const apiData = await fetchVehicleDataFromAPI();

        if (!apiData) {
            return;
        }

        const prevPosition = vehiclePosition;
        const newPosition = apiData.position;

        let finalHeading = apiData.heading;

        if (prevPosition && apiData.speed > 0.5) {
            if (finalHeading === 0) {
                finalHeading = calculateHeading(prevPosition, newPosition);
            }
            setHeading(finalHeading);
        } else if (apiData.speed <= 0.5) {
            finalHeading = heading;
        }

        setSpeed(apiData.speed);
        setVehiclePosition(newPosition);

        // Update map elements
        vehicleMarker.setLatLng([newPosition.lat, newPosition.lng]);
        vehicleMarker.setPopupContent(`
            <div style="font-weight: bold;">
                ${deviceInfo.vehicleNo || 'Vehicle'} - ${apiData.speed.toFixed(0)} km/h<br/>
                Battery: ${batteryVoltage}V<br/>
                Signal: ${gsmSignal} RSSI
            </div>
        `);
        
        const newIcon = window.L.divIcon({
            className: 'vehicle-marker',
            html: createVehicleIcon(),
            iconSize: [60, 60],
            iconAnchor: [30, 30],
        });
        vehicleMarker.setIcon(newIcon);

        pathCoordinates.current.push(newPosition);
        if (pathCoordinates.current.length > 100) {
            pathCoordinates.current.shift();
        }

        const latlngs = pathCoordinates.current.map(p => [p.lat, p.lng]);
        vehiclePath.setLatLngs(latlngs);

        mapInstance.panTo([newPosition.lat, newPosition.lng], {
            animate: true,
            duration: 1.0
        });

        setStatus("Live");
    };

    const calculateHeading = (from, to) => {
        const dLng = (to.lng - from.lng) * Math.PI / 180;
        const lat1 = from.lat * Math.PI / 180;
        const lat2 = to.lat * Math.PI / 180;

        const y = Math.sin(dLng) * Math.cos(lat2);
        const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);

        return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
    };

    const getSignalStrength = (signal) => {
        const signalNum = parseInt(signal);
        if (signalNum >= 20) return { text: "Excellent", color: "text-green-600", bg: "bg-green-100" };
        if (signalNum >= 15) return { text: "Good", color: "text-blue-600", bg: "bg-blue-100" };
        if (signalNum >= 10) return { text: "Fair", color: "text-yellow-600", bg: "bg-yellow-100" };
        return { text: "Poor", color: "text-red-600", bg: "bg-red-100" };
    };

    const getBatteryStatus = (voltage) => {
        const volt = parseFloat(voltage);
        if (volt >= 4.0) return { text: "High", color: "text-green-600", bg: "bg-green-100" };
        if (volt >= 3.7) return { text: "Normal", color: "text-blue-600", bg: "bg-blue-100" };
        if (volt > 0) return { text: "Low", color: "text-yellow-600", bg: "bg-yellow-100" };
        return { text: "External", color: "text-gray-600", bg: "bg-gray-100" };
    };

    const signalInfo = getSignalStrength(gsmSignal);
    const batteryInfo = getBatteryStatus(batteryVoltage);

    // --- Reusable Components (from previous elegant refactor) ---

    const StatCard = ({ icon: Icon, label, value, unit, color = "indigo", subtitle }) => (
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 transition-all duration-200 hover:shadow-md">
            <div className="flex items-center justify-between mb-2">
                <div className={`p-1 rounded-full border border-slate-200`}> 
                    <Icon className={`w-5 h-5 text-${color}-600`} />
                </div>
                <span className="text-xs font-semibold text-slate-500">{label}</span>
            </div>
            <div className="flex items-end gap-1">
                <p className="text-2xl font-bold text-slate-900">{value}</p>
                {unit && <span className="text-sm text-slate-500 mb-1">{unit}</span>}
            </div>
            {subtitle && (
                <p className={`text-xs text-${color}-500 font-medium mt-1`}>
                    {subtitle}
                </p>
            )}
        </div>
    );

    const RawDataItem = ({ label, value, color = "slate" }) => (
        <div className="flex justify-between items-center py-2 border-b border-slate-100 last:border-b-0">
            <span className="text-sm font-medium text-slate-600">{label}</span>
            <span className={`text-sm font-mono font-bold text-${color}-600 bg-slate-100 px-2 py-0.5 rounded`}> 
                {value}
            </span>
        </div>
    );
    
    // --- NEW Map Data Widget Component (Top Right) ---

    const MapDataWidget = ({ speed, position }) => (
        <div className="absolute top-4 right-4 bg-white/90 rounded-xl shadow-2xl p-4 z-10 border border-slate-200 backdrop-blur-sm w-80">
            <div className="flex justify-between items-center pb-2 mb-2 border-b border-slate-100">
                <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                    <Car className="w-5 h-5 text-indigo-500" />
                    Live Data
                </h3>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${status === "Live" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                    {status}
                </span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
                <div className="border-r border-slate-100">
                    <p className="text-xs font-medium text-slate-500">Speed</p>
                    <p className="text-xl font-extrabold text-indigo-600">
                        {speed.toFixed(0)} <span className="text-sm font-semibold">km/h</span>
                    </p>
                </div>
                <div className="border-r border-slate-100">
                    <p className="text-xs font-medium text-slate-500">Latitude</p>
                    <p className="text-sm font-bold text-slate-800 font-mono">
                        {position ? position.lat.toFixed(5) : 'N/A'}
                    </p>
                </div>
                <div>
                    <p className="text-xs font-medium text-slate-500">Longitude</p>
                    <p className="text-sm font-bold text-slate-800 font-mono">
                        {position ? position.lng.toFixed(5) : 'N/A'}
                    </p>
                </div>
            </div>
        </div>
    );

    // --- Main Component Render ---

    return (
        <div className="flex h-screen bg-slate-50"> 
            {/* Sidebar */}
            <div className="w-96 bg-white shadow-xl border-r border-slate-200 flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-slate-200">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                            <Navigation className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-extrabold text-slate-900">Sentinel Track</h1>
                            <p className="text-sm text-slate-500">Live Vehicle Monitoring</p>
                        </div>
                    </div>

                    {/* Vehicle Info */}
                    <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                        <div className="flex items-center gap-3">
                            <Car className="w-8 h-8 text-indigo-500" />
                            <div>
                                <h2 className="font-bold text-slate-900">{deviceInfo.vehicleNo}</h2>
                                <p className="text-xs text-slate-500">ID: {deviceInfo.deviceNo}</p>
                            </div>
                        </div>
                        {deviceNosList.length > 1 && (
                            <div className="mt-2 text-xs text-orange-600 bg-orange-100 p-2 rounded">
                                ⚠️ Tracking the first device only (ID: {deviceInfo.deviceNo}).
                            </div>
                        )}
                         {trackedDeviceNo === 'N/A' && (
                            <div className="mt-2 text-xs text-red-600 bg-red-100 p-2 rounded">
                                ❌ No device ID received from navigation.
                            </div>
                        )}
                    </div>
                </div>

                {/* Navigation Tabs */}
                <div className="flex border-b border-slate-200">
                    <button
                        onClick={() => setActiveTab("tracking")}
                        className={`flex-1 py-3 text-sm font-semibold transition-all ${activeTab === "tracking"
                                ? "text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50"
                                : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                            }`}
                    >
                        <Activity className="w-4 h-4 inline mr-2" />
                        Tracking
                    </button>
                    <button
                        onClick={() => setActiveTab("details")}
                        className={`flex-1 py-3 text-sm font-semibold transition-all ${activeTab === "details"
                                ? "text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50"
                                : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                            }`}
                    >
                        <Info className="w-4 h-4 inline mr-2" />
                        Raw Data
                    </button>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto">
                    {activeTab === "tracking" ? (
                        <div className="p-6">
                            {/* Status Card */}
                            <div className="bg-white rounded-xl p-4 shadow-md border border-slate-200 mb-6">
                                <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-3 h-3 rounded-full ${status === "Live" ? "bg-green-500 animate-pulse" : "bg-red-500"
                                            }`}></div>
                                        <span className="font-semibold text-slate-700">System Status</span>
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${status === "Live"
                                            ? "bg-green-100 text-green-700"
                                            : "bg-red-100 text-red-700"
                                        }`}>
                                        {status}
                                    </span>
                                </div>

                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className="text-slate-500">Duration</span>
                                        <p className="font-bold text-slate-900 text-lg">{formatDuration(duration)}</p>
                                    </div>
                                    <div>
                                        <span className="text-slate-500">Last Update</span>
                                        <p className="font-bold text-slate-900 text-lg">
                                            {lastUpdateTime ? lastUpdateTime.toLocaleTimeString() : 'N/A'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Key Metrics Grid */}
                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <StatCard
                                    icon={Zap}
                                    label="Speed"
                                    value={speed.toFixed(0)}
                                    unit="km/h"
                                    color="indigo"
                                    subtitle={speed > 0.5 ? "Moving" : "Stopped"}
                                />
                                <StatCard
                                    icon={Compass}
                                    label="Heading"
                                    value={heading.toFixed(0)}
                                    unit="°"
                                    color="indigo"
                                    subtitle="Direction"
                                />
                                <StatCard
                                    icon={Battery}
                                    label="Battery"
                                    value={parseFloat(batteryVoltage).toFixed(2)}
                                    unit="V"
                                    color="green"
                                    subtitle={batteryInfo.text}
                                />
                                <StatCard
                                    icon={Signal}
                                    label="GSM Signal"
                                    value={gsmSignal}
                                    unit="RSSI"
                                    color="green"
                                    subtitle={signalInfo.text}
                                />
                            </div>

                            {/* Additional Info */}
                            <div className="grid grid-cols-2 gap-4">
                                <StatCard
                                    icon={Satellite}
                                    label="Satellites"
                                    value={satellites}
                                    color="indigo"
                                    subtitle="GPS Fix"
                                />
                                <StatCard
                                    icon={Gauge}
                                    label="Altitude"
                                    value={altitude.toFixed(0)}
                                    unit="m"
                                    color="indigo"
                                    subtitle="Above sea level"
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="p-6">
                            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                                <Info className="w-5 h-5 text-indigo-500" />
                                Raw Device Data
                            </h3>

                            <div className="bg-white rounded-lg p-4 border border-slate-200 shadow-sm">
                                {rawData ? (
                                    <div className="space-y-1">
                                        {/* Use Object.keys to dynamically list data */}
                                        {Object.keys(rawData).map((key) => (
                                            <RawDataItem 
                                                key={key} 
                                                label={key.charAt(0).toUpperCase() + key.slice(1)} 
                                                value={String(rawData[key])} 
                                                color="slate" 
                                            />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8 text-slate-500">
                                        <AlertCircle className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                                        <p>No raw data available</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-200 bg-slate-50">
                    <div className="text-center text-xs text-slate-500">
                        <p>Sentinel Track System</p>
                        <p>v1.0 · {new Date().getFullYear()}</p>
                    </div>
                </div>
            </div>

            {/* Map Area */}
            <div className="flex-1 relative">
                <div ref={mapRef} className="w-full h-full"></div>

                {/* 1. TOP-RIGHT MAP DATA WIDGET */}
                <MapDataWidget speed={speed} position={vehiclePosition} />

                {/* 2. Loader */}
                <div
                    ref={loaderRef}
                    className="absolute inset-0 flex flex-col items-center justify-center bg-white bg-opacity-80 z-30 transition-opacity duration-500"
                >
                    <div className="relative">
                        <div className="w-20 h-20 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                        <Navigation className="w-8 h-8 text-indigo-500 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                    </div>
                    <p className="mt-6 text-xl font-bold text-slate-700">Connecting to GPS...</p>
                    <p className="text-sm text-slate-500 mt-2">Initializing live tracker for device: {trackedDeviceNo}</p>
                </div>

                {/* 3. Geolocation Error */}
                <div
                    ref={geoErrorRef}
                    className="hidden absolute top-4 left-1/2 transform -translate-x-1/2 px-5 py-3 bg-white border-l-4 border-indigo-500 rounded-lg shadow-2xl z-40 transition-all duration-300 opacity-100"
                >
                    <div className="flex items-center gap-3">
                        <span className="text-2xl text-indigo-500">⚠️</span>
                        <p ref={geoErrorMessageRef} className="text-sm font-semibold text-slate-800"></p>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default Livetracking;