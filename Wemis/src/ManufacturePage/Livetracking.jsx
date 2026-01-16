import React, { useEffect, useRef, useState, useCallback } from "react";
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
    Play,
    Pause,
    SkipBack,
    SkipForward,
    Calendar,
    History,
    RotateCcw,
    Map,
    Layers,
    Maximize2,
    Minimize2,
    Target,
    Database,
    Thermometer,
    Wifi,
    Cpu,
    Shield,
    Eye,
    EyeOff,
    Navigation2,
    Wind,
    TrendingUp,
    BarChart3,
    Map as MapIcon,
    Route,
    Package,
    User,
    Phone,
    Mail,
    Globe,
    Download,
    Upload,
    HardDrive,
    MemoryStick,
    CalendarDays,
    Timer,
    BatteryCharging,
    RefreshCw,
    StopCircle,
    Power,
    BatteryWarning,
    Radio,
    WifiOff,
    Cloud,
    Server,
    Smartphone,
    Bluetooth,
    RadioTower,
    SignalHigh,
    SignalMedium,
    SignalLow,
    SignalZero,
    BatteryFull,
    BatteryMedium,
    BatteryLow,
    LocateFixed, // Replaced Gps
    SatelliteDish,
    Rotate3D
} from "lucide-react";
import { data, useLocation } from "react-router-dom";

// Logo import
import vehicleLogo from '../Images/car.png';

// =========================================================================
// Math & Helper Functions
// =========================================================================

const calculateHeading = (from, to) => {
    const lat1 = from.lat * Math.PI / 180;
    const lat2 = to.lat * Math.PI / 180;
    const dLng = (to.lng - from.lng) * Math.PI / 180;
    const y = Math.sin(dLng) * Math.cos(lat2);
    const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
    return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
};

const getShortestRotation = (currentHeading, targetHeading) => {
    let delta = targetHeading - currentHeading;
    if (delta > 180) delta -= 360;
    if (delta < -180) delta += 360;
    return currentHeading + delta;
};

const lerp = (start, end, t) => {
    return start * (1 - t) + end * t;
};

const calculateDistance = (coord1, coord2) => {
    const R = 6371000; 
    const dLat = (coord2.lat - coord1.lat) * Math.PI / 180;
    const dLng = (coord2.lng - coord1.lng) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(coord1.lat * Math.PI / 180) * Math.cos(coord2.lat * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; 
};

const formatDateTimeForInput = (date) => {
    const d = new Date(date);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
};

const formatDuration = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) return `${hrs}h ${mins}m ${secs}s`;
    if (mins > 0) return `${mins}m ${secs}s`;
    return `${secs}s`;
};

const formatDistance = (meters) => {
    if (meters < 1000) return `${meters.toFixed(0)} m`;
    return `${(meters / 1000).toFixed(2)} km`;
};

const formatSpeed = (speed) => {
    return `${speed.toFixed(1)} km/h`;
};

const formatVoltage = (voltage) => {
    return `${parseFloat(voltage).toFixed(2)}V`;
};

const formatDateTime = (date) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleString();
};

// =========================================================================
// Main Component
// =========================================================================

const Livetracking = () => {
    const location = useLocation();
    const { device } = location.state || {};

    // --- State Variables ---
    const [vehiclePosition, setVehiclePosition] = useState(null);
    const [currentLocation, setCurrentLocation] = useState(null);
    const [status, setStatus] = useState("Initializing");
    const [speed, setSpeed] = useState(0);
    const [heading, setHeading] = useState(0);
    const [satellites, setSatellites] = useState(0);
    const [batteryVoltage, setBatteryVoltage] = useState("0");
    const [gsmSignal, setGsmSignal] = useState("0");
    const [altitude, setAltitude] = useState(0);
    const [temperature, setTemperature] = useState(0);
    const [humidity, setHumidity] = useState(0);
    const [lastUpdateTime, setLastUpdateTime] = useState(null);
    const [rawData, setRawData] = useState(null);
    const [activeTab, setActiveTab] = useState("overview");
    const [duration, setDuration] = useState(0);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [mapType, setMapType] = useState("roadmap");
    const [showRawData, setShowRawData] = useState(false);
    
    // Vehicle metrics
    const [totalDistance, setTotalDistance] = useState(0);
    const [maxSpeed, setMaxSpeed] = useState(0);
    const [averageSpeed, setAverageSpeed] = useState(0);
    const [engineStatus, setEngineStatus] = useState("OFF");
    const [fuelLevel, setFuelLevel] = useState(0);
    const [odometer, setOdometer] = useState(0);
    const [deviceTemp, setDeviceTemp] = useState(0);
    const [networkType, setNetworkType] = useState("4G");
    const [deviceStatus, setDeviceStatus] = useState("Online");
    const [ignition, setIgnition] = useState(false);
    const [movement, setMovement] = useState(false);
    const [gpsAccuracy, setGpsAccuracy] = useState(0);
    const [dataUsage, setDataUsage] = useState(0);

    // --- Route Playback States ---
    const [isPlaybackMode, setIsPlaybackMode] = useState(false);
    const [playbackRoute, setPlaybackRoute] = useState([]);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentPlaybackIndex, setCurrentPlaybackIndex] = useState(0);
    const [playbackSpeed, setPlaybackSpeed] = useState(1);
    const [playbackStartTime, setPlaybackStartTime] = useState("");
    const [playbackEndTime, setPlaybackEndTime] = useState("");
    const [isLoadingPlayback, setIsLoadingPlayback] = useState(false);
    const [totalPlaybackPoints, setTotalPlaybackPoints] = useState(0);
    const [playbackProgress, setPlaybackProgress] = useState(0);
    const [playbackDistance, setPlaybackDistance] = useState(0);

    // --- Refs ---
    const mapRef = useRef(null);
    const leafletMapRef = useRef(null);
    const leafletVehicleMarkerRef = useRef(null);
    // Removed: leafletPathRef (No live trail anymore)
    const playbackMarkerRef = useRef(null);
    const playbackPathRef = useRef(null);
    
    // Animation Engine Refs
    const playbackAnimationFrameRef = useRef(null);
    const playbackAnimationQueue = useRef([]);
    const playbackCurrentState = useRef(null);
    const playbackSpeedRef = useRef(1);

    const animationFrameRef = useRef(null);
    const animationQueue = useRef([]); 
    const currentRenderState = useRef({ lat: 0, lng: 0, heading: 0 }); 
    // Removed: pathHistory (No live trail anymore)
    const initialCenterSet = useRef(false);

    const startTimeRef = useRef(Date.now());
    const liveTrackingTimer = useRef(null);

    // Update refs when state changes
    useEffect(() => { playbackSpeedRef.current = playbackSpeed; }, [playbackSpeed]);

    // =========================================================================
    // UI Helpers & Status Functions
    // =========================================================================

    const getSignalStrength = (signal) => {
        const signalNum = parseInt(signal);
        if (signalNum >= 25) return { text: "Excellent", color: "text-emerald-600", bg: "bg-emerald-100", icon: SignalHigh, level: 4 };
        if (signalNum >= 20) return { text: "Good", color: "text-blue-600", bg: "bg-blue-100", icon: SignalMedium, level: 3 };
        if (signalNum >= 15) return { text: "Fair", color: "text-amber-600", bg: "bg-amber-100", icon: SignalLow, level: 2 };
        if (signalNum >= 10) return { text: "Poor", color: "text-orange-600", bg: "bg-orange-100", icon: SignalZero, level: 1 };
        return { text: "No Signal", color: "text-rose-600", bg: "bg-rose-100", icon: WifiOff, level: 0 };
    };

    const getBatteryStatus = (voltage) => {
        const volt = parseFloat(voltage);
        if (volt >= 4.0) return { text: "High", color: "text-emerald-600", bg: "bg-emerald-100", icon: BatteryFull, level: 100 };
        if (volt >= 3.8) return { text: "Normal", color: "text-blue-600", bg: "bg-blue-100", icon: BatteryMedium, level: 75 };
        if (volt >= 3.6) return { text: "Low", color: "text-amber-600", bg: "bg-amber-100", icon: BatteryLow, level: 50 };
        if (volt >= 3.4) return { text: "Critical", color: "text-orange-600", bg: "bg-orange-100", icon: BatteryWarning, level: 25 };
        return { text: "External", color: "text-gray-600", bg: "bg-gray-100", icon: BatteryCharging, level: 0 };
    };

    const getSpeedColor = (speed) => {
        if (speed < 30) return { color: "text-emerald-600", bg: "bg-emerald-100", status: "Slow" };
        if (speed < 60) return { color: "text-blue-600", bg: "bg-blue-100", status: "Normal" };
        if (speed < 90) return { color: "text-amber-600", bg: "bg-amber-100", status: "Fast" };
        if (speed < 120) return { color: "text-orange-600", bg: "bg-orange-100", status: "High" };
        return { color: "text-rose-600", bg: "bg-rose-100", status: "Very High" };
    };

    const getEngineStatusIcon = (status) => {
        switch(status.toLowerCase()) {
            case "on": return { icon: Power, color: "text-emerald-600", bg: "bg-emerald-100" };
            case "off": return { icon: StopCircle, color: "text-gray-600", bg: "bg-gray-100" };
            case "idle": return { icon: Gauge, color: "text-amber-600", bg: "bg-amber-100" };
            default: return { icon: Power, color: "text-gray-600", bg: "bg-gray-100" };
        }
    };

    const getMovementStatus = (moving) => {
        return moving 
            ? { icon: Move, color: "text-emerald-600", bg: "bg-emerald-100", text: "Moving" }
            : { icon: AlertCircle, color: "text-gray-600", bg: "bg-gray-100", text: "Stopped" };
    };

    const getGpsAccuracyLevel = (accuracy) => {
        if (accuracy < 5) return { color: "text-emerald-600", text: "High Precision" };
        if (accuracy < 15) return { color: "text-blue-600", text: "Good" };
        if (accuracy < 30) return { color: "text-amber-600", text: "Moderate" };
        return { color: "text-rose-600", text: "Low" };
    };

    const getTemperatureColor = (temp) => {
        if (temp < 0) return "text-blue-500";
        if (temp < 20) return "text-emerald-500";
        if (temp < 40) return "text-amber-500";
        return "text-rose-500";
    };

    const signalInfo = getSignalStrength(gsmSignal);
    const batteryInfo = getBatteryStatus(batteryVoltage);
    const speedInfo = getSpeedColor(speed);
    const engineInfo = getEngineStatusIcon(engineStatus);
    const movementInfo = getMovementStatus(movement);
    const gpsAccuracyInfo = getGpsAccuracyLevel(gpsAccuracy);

    // =========================================================================
    // Map Controls
    // =========================================================================

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
            setIsFullscreen(true);
        } else {
            document.exitFullscreen();
            setIsFullscreen(false);
        }
    };

    const centerMap = () => {
        if (leafletMapRef.current && vehiclePosition) {
            leafletMapRef.current.setView([vehiclePosition.lat, vehiclePosition.lng], 16, {
                animate: true,
                duration: 1
            });
        }
    };

    const changeMapType = (type) => {
        setMapType(type);
        if (leafletMapRef.current) {
            leafletMapRef.current.eachLayer((layer) => {
                if (layer._url && layer._url.includes('google.com')) {
                    leafletMapRef.current.removeLayer(layer);
                }
            });

            const L = window.L;
            let tileLayer;
            const baseUrl = 'http://{s}.google.com/vt/lyrs=';
            const suffix = '&x={x}&y={y}&z={z}';
            
            switch (type) {
                case "satellite": tileLayer = L.tileLayer(`${baseUrl}s${suffix}`, { maxZoom: 20, subdomains: ['mt0', 'mt1', 'mt2', 'mt3'] }); break;
                case "terrain": tileLayer = L.tileLayer(`${baseUrl}p${suffix}`, { maxZoom: 20, subdomains: ['mt0', 'mt1', 'mt2', 'mt3'] }); break;
                case "hybrid": tileLayer = L.tileLayer(`${baseUrl}y${suffix}`, { maxZoom: 20, subdomains: ['mt0', 'mt1', 'mt2', 'mt3'] }); break;
                default: tileLayer = L.tileLayer(`${baseUrl}m${suffix}`, { maxZoom: 20, subdomains: ['mt0', 'mt1', 'mt2', 'mt3'] });
            }
            tileLayer.addTo(leafletMapRef.current);
        }
    };

    // =========================================================================
    // Marker & Icon Logic
    // =========================================================================

    const createVehicleIcon = (customSpeed, customHeading, isPlayback = false) => {
        const isMoving = customSpeed > 0.5;
        let statusColor = isMoving ? '#10B981' : '#F59E0B';
        const bgColor = isPlayback ? '#DC2626' : '#1F2937';

        return `
            <div style="position: relative; width: 70px; height: 70px;">
                <div style="position: absolute; top: -12px; left: 50%; transform: translateX(-50%); background: ${bgColor}; color: white; padding: 4px 10px; border-radius: 10px; font-size: 11px; font-weight: 700; box-shadow: 0 3px 10px rgba(0,0,0,0.3); white-space: nowrap; display: flex; align-items: center; gap: 5px; z-index: 10; border: 2px solid ${statusColor};">
                    <div style="width: 8px; height: 8px; border-radius: 50%; background: ${statusColor}; animation: ${isMoving ? 'pulse 1.5s infinite' : 'none'};"></div>
                    ${customSpeed.toFixed(0)} km/h
                </div>
                <div style="width: 50px; height: 50px; position: absolute; top: 10px; left: 10px; transition: transform 0.1s linear; transform: rotate(${customHeading}deg); filter: drop-shadow(0 4px 8px rgba(0,0,0,0.3));">
                    <img src="${vehicleLogo}" alt="Vehicle" style="width: 100%; height: 100%; object-fit: contain; ${isPlayback ? 'opacity: 0.9;' : ''}" />
                </div>
            </div>
        `;
    };

    const updateMarkerVisuals = (lat, lng, currentSpeed, currentHeading, isPlayback = false) => {
        const L = window.L;
        const marker = isPlayback ? playbackMarkerRef.current : leafletVehicleMarkerRef.current;
        // Removed path ref usage here
        
        if (!L || !marker) return;

        marker.setLatLng([lat, lng]);

        const newIcon = L.divIcon({
            className: isPlayback ? 'playback-marker' : 'vehicle-marker',
            html: createVehicleIcon(currentSpeed, currentHeading, isPlayback),
            iconSize: [70, 70],
            iconAnchor: [35, 35],
        });
        marker.setIcon(newIcon);

        if (!isPlayback) {
            // Live tracking smooth pan
            if(leafletMapRef.current) leafletMapRef.current.panTo([lat, lng], { animate: true, duration: 0.8, easeLinearity: 0.5 });
            
            // Removed: pathHistory.current.push(...)
            // Removed: path.setLatLngs(...)
            
            setVehiclePosition({ lat, lng });
            setHeading(currentHeading);
            setSpeed(currentSpeed);
        }
    };

    // =========================================================================
    // Animation Engines
    // =========================================================================

    const startLiveAnimationLoop = () => {
        let lastTime = performance.now();
        const animate = (time) => {
            const deltaTime = Math.min(time - lastTime, 100); 
            lastTime = time;

            if (animationQueue.current.length > 0) {
                const target = animationQueue.current[0];
                const start = currentRenderState.current;
                const distLat = target.lat - start.lat;
                const distLng = target.lng - start.lng;
                const distance = Math.sqrt(distLat * distLat + distLng * distLng);

                if (distance < 0.00001) {
                    currentRenderState.current = { lat: target.lat, lng: target.lng, heading: target.heading };
                    animationQueue.current.shift(); 
                } else {
                    const baseSpeed = 0.00001; 
                    const catchUpFactor = Math.max(1, animationQueue.current.length * 2);
                    const moveStep = baseSpeed * deltaTime * catchUpFactor;
                    const t = Math.min(1, moveStep / distance);

                    const newLat = lerp(start.lat, target.lat, t);
                    const newLng = lerp(start.lng, target.lng, t);
                    const targetRotation = getShortestRotation(start.heading, target.heading);
                    const newHeading = lerp(start.heading, targetRotation, 0.05);

                    currentRenderState.current = { lat: newLat, lng: newLng, heading: newHeading };
                }

                updateMarkerVisuals(
                    currentRenderState.current.lat,
                    currentRenderState.current.lng,
                    target.speed,
                    currentRenderState.current.heading,
                    false
                );
            }
            animationFrameRef.current = requestAnimationFrame(animate);
        };
        animationFrameRef.current = requestAnimationFrame(animate);
    };

    const startPlaybackAnimationLoop = () => {
        if (playbackAnimationFrameRef.current) cancelAnimationFrame(playbackAnimationFrameRef.current);
        let lastTime = performance.now();
        
        const animatePlayback = (time) => {
            const deltaTime = Math.min(time - lastTime, 60);
            lastTime = time;

            if (playbackAnimationQueue.current.length > 0) {
                const target = playbackAnimationQueue.current[0];
                const start = playbackCurrentState.current;
                
                const distLat = target.lat - start.lat;
                const distLng = target.lng - start.lng;
                const distance = Math.sqrt(distLat * distLat + distLng * distLng);

                // --- KEY FIX FOR STOPPED VEHICLE ---
                if (distance < 0.000005) {
                    playbackCurrentState.current = { ...target };
                    const progress = (target.index / (playbackRoute.length - 1)) * 100;
                    setPlaybackProgress(progress);
                    setCurrentPlaybackIndex(target.index);
                    playbackAnimationQueue.current.shift();
                } else {
                    const speedMultiplier = playbackSpeedRef.current;
                    const baseMovementPerMs = 0.000005 * speedMultiplier; 
                    const moveStep = baseMovementPerMs * deltaTime;
                    
                    const t = Math.min(1, moveStep / distance);

                    const newLat = lerp(start.lat, target.lat, t);
                    const newLng = lerp(start.lng, target.lng, t);
                    
                    const targetRotation = getShortestRotation(start.heading, target.heading);
                    const newHeading = lerp(start.heading, targetRotation, 0.1);

                    playbackCurrentState.current = { lat: newLat, lng: newLng, heading: newHeading, index: start.index };

                    updateMarkerVisuals(newLat, newLng, target.speed, newHeading, true);
                    
                    if (leafletMapRef.current) {
                        leafletMapRef.current.panTo([newLat, newLng], { animate: true, duration: 0.1, easeLinearity: 1, noMoveStart: true });
                    }
                }
            } else if (playbackAnimationQueue.current.length === 0) {
               setIsPlaying(false);
            }
            
            if (playbackAnimationQueue.current.length > 0) {
                playbackAnimationFrameRef.current = requestAnimationFrame(animatePlayback);
            }
        };
        playbackAnimationFrameRef.current = requestAnimationFrame(animatePlayback);
    };

    // =========================================================================
    // API Handling
    // =========================================================================

    const fetchVehicleDataFromAPI = useCallback(async () => {
        if (!device?.deviceNo) return;
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('https://api.websave.in/api/manufactur/liveTrackingSingleDevice', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ deviceNo: device.deviceNo }),
            });

            if (!response.ok) throw new Error("API Error");
            const data = await response.json();
            processLiveTrackingData(data);
        } catch (error) {
            console.error("Tracking Error:", error);
            setStatus("Network Error");
        }
    }, [device]);
    console.log(data)

    const processLiveTrackingData = (data) => {
        if (isPlaybackMode) return;

        setRawData(data.rawData || data);
        setStatus("Live");

        const locationData = data.location || {};
        const rawData = data.rawData || data;
        const smoothPath = data.smoothPath || [];

        // Update all metrics from API
        setSatellites(parseInt(rawData.satellites || 0));
        setBatteryVoltage(rawData.batteryVoltage || "0");
        setGsmSignal(rawData.gsmSignal || "0");
        setAltitude(parseFloat(rawData.altitude || 0));
        setTemperature(parseFloat(rawData.temperature || 25));
        setHumidity(parseFloat(rawData.humidity || 50));
        setLastUpdateTime(new Date());
        
        // Simulate additional data (in real app, these would come from API)
        setTotalDistance(prev => prev + (Math.random() * 0.5));
        setMaxSpeed(prev => Math.max(prev, parseFloat(rawData.speed || 0)));
        setAverageSpeed(prev => (prev + parseFloat(rawData.speed || 0)) / 2);
        setEngineStatus(rawData.ignition === "ON" ? "ON" : "OFF");
        setFuelLevel(parseFloat(rawData.fuel || 75));
        setOdometer(parseFloat(rawData.odometer || 12500));
        setDeviceTemp(parseFloat(rawData.deviceTemp || 35));
        setNetworkType(rawData.networkType || "4G");
        setDeviceStatus(rawData.deviceStatus || "Online");
        setIgnition(rawData.ignition === "ON");
        setMovement(parseFloat(rawData.speed || 0) > 5);
        setGpsAccuracy(parseFloat(rawData.accuracy || 5));
        setDataUsage(prev => prev + 0.1);

        const finalSpeed = parseFloat(locationData.speed || rawData.speed || 0);
        
        // Initial Snap
        const lat = parseFloat(locationData.latitude || rawData.lat);
        const lng = parseFloat(locationData.longitude || rawData.lng);
        
        if (lat && lng && !initialCenterSet.current) {
            if (leafletMapRef.current) {
                leafletMapRef.current.setView([lat, lng], 16);
                currentRenderState.current = { lat, lng, heading: 0 };
                if(leafletVehicleMarkerRef.current) leafletVehicleMarkerRef.current.setLatLng([lat,lng]);
                initialCenterSet.current = true;
            }
        }

        if (smoothPath.length > 0) {
            smoothPath.forEach(point => {
                animationQueue.current.push({
                    lat: parseFloat(point.latitude),
                    lng: parseFloat(point.longitude),
                    heading: parseFloat(point.heading || 0),
                    speed: finalSpeed
                });
            });
        } else if (lat && lng) {
            let calculatedHeading = parseFloat(locationData.heading || rawData.headDegree || 0);
            if (currentRenderState.current.lat !== 0 && finalSpeed > 1 && calculatedHeading === 0) {
                calculatedHeading = calculateHeading(currentRenderState.current, {lat, lng});
            }
            animationQueue.current.push({
                lat: lat,
                lng: lng,
                heading: calculatedHeading,
                speed: finalSpeed
            });
        }
    };

    // =========================================================================
    // Initialization
    // =========================================================================

    const initMap = () => {
        if (!mapRef.current || leafletMapRef.current) return;
        const L = window.L;
        if (!L) return;

        const startLat = currentLocation?.lat || 20.2961;
        const startLng = currentLocation?.lng || 85.8245;

        const map = L.map(mapRef.current, {
            center: [startLat, startLng],
            zoom: 16,
            zoomControl: false,
            attributionControl: false,
        });

        L.tileLayer('http://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
            maxZoom: 20,
            subdomains: ['mt0', 'mt1', 'mt2', 'mt3']
        }).addTo(map);

        leafletMapRef.current = map;
        L.control.zoom({ position: 'bottomright' }).addTo(map);

        const initialIcon = L.divIcon({
            className: 'vehicle-marker',
            html: createVehicleIcon(0, 0, false),
            iconSize: [70, 70],
            iconAnchor: [35, 35],
        });

        const marker = L.marker([startLat, startLng], { icon: initialIcon, zIndexOffset: 1000 }).addTo(map);
        leafletVehicleMarkerRef.current = marker;

        // REMOVED POLYLINE INITIALIZATION HERE

        currentRenderState.current = { lat: startLat, lng: startLng, heading: 0 };
        // REMOVED pathHistory initialization

        startLiveAnimationLoop();
        fetchVehicleDataFromAPI();
        liveTrackingTimer.current = setInterval(fetchVehicleDataFromAPI, 5000);
        setStatus("Live");
    };

    useEffect(() => {
        if (!document.getElementById('leaflet-css')) {
            const link = document.createElement("link");
            link.id = 'leaflet-css';
            link.rel = "stylesheet";
            link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
            document.head.appendChild(link);
        }
        
        if (!window.L) {
            const script = document.createElement("script");
            script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
            script.async = true;
            script.onload = initMap;
            document.body.appendChild(script);
        } else {
            initMap();
        }

        const now = new Date();
        const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
        setPlaybackStartTime(formatDateTimeForInput(oneHourAgo));
        setPlaybackEndTime(formatDateTimeForInput(now));

        const dTimer = setInterval(() => {
            setDuration(Math.floor((Date.now() - startTimeRef.current) / 1000));
        }, 1000);

        return () => {
            if (liveTrackingTimer.current) clearInterval(liveTrackingTimer.current);
            if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
            if (playbackAnimationFrameRef.current) cancelAnimationFrame(playbackAnimationFrameRef.current);
            clearInterval(dTimer);
            if (leafletMapRef.current) {
                leafletMapRef.current.remove();
                leafletMapRef.current = null;
            }
        };
    }, []);

    // =========================================================================
    // Playback Logic
    // =========================================================================

    const fetchRoutePlayback = async () => {
        if (!device?.deviceNo || !playbackStartTime || !playbackEndTime) return alert("Select device and time");
        setIsLoadingPlayback(true);
        const token = localStorage.getItem('token');
        
        try {
            const response = await fetch('https://api.websave.in/api/manufactur/fetchSingleRoutePlayback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ 
                    deviceNo: device.deviceNo, 
                    startTime: new Date(playbackStartTime).toISOString(),
                    endTime: new Date(playbackEndTime).toISOString()
                }),
            });
            const data = await response.json();
            console.log(data)
            
            if (data.success && data.route?.length > 0) {
                const cleanRoute = data.route.map(p => ({
                    ...p,
                    latitude: parseFloat(p.latitude),
                    longitude: parseFloat(p.longitude),
                    speed: parseFloat(p.speed || 0),
                    heading: parseFloat(p.heading || 0)
                })).filter(p => !isNaN(p.latitude) && !isNaN(p.longitude));

                setPlaybackRoute(cleanRoute);
                setTotalPlaybackPoints(cleanRoute.length);
                setIsPlaybackMode(true);
                setStatus("Playback Mode");
                
                if (liveTrackingTimer.current) {
                    clearInterval(liveTrackingTimer.current);
                    liveTrackingTimer.current = null;
                }
                
                setupPlaybackVisualization(cleanRoute);
                
                let totalDist = 0;
                for (let i = 1; i < cleanRoute.length; i++) {
                    totalDist += calculateDistance(
                        { lat: cleanRoute[i-1].latitude, lng: cleanRoute[i-1].longitude },
                        { lat: cleanRoute[i].latitude, lng: cleanRoute[i].longitude }
                    );
                }
                setPlaybackDistance(totalDist);
                alert(`Route loaded: ${cleanRoute.length} points.`);
            } else {
                alert("No route data found.");
            }
        } catch(e) { console.error(e); alert("Failed to fetch playback"); } 
        finally { setIsLoadingPlayback(false); }
    };

    const setupPlaybackVisualization = (route) => {
        const L = window.L;
        if (!L || !leafletMapRef.current || route.length === 0) return;

        if (leafletVehicleMarkerRef.current) leafletVehicleMarkerRef.current.setOpacity(0);
        // No need to hide live path as it doesn't exist

        if (playbackMarkerRef.current) leafletMapRef.current.removeLayer(playbackMarkerRef.current);
        if (playbackPathRef.current) leafletMapRef.current.removeLayer(playbackPathRef.current);

        const points = route.map(p => [p.latitude, p.longitude]);
        const pbPath = L.polyline(points, { 
            color: '#DC2626', 
            weight: 4, 
            opacity: 0.8, 
            lineJoin: 'round' 
        }).addTo(leafletMapRef.current);
        playbackPathRef.current = pbPath;

        if(points.length > 0) {
            const bounds = L.latLngBounds(points);
            leafletMapRef.current.fitBounds(bounds, { padding: [50, 50] });
        }

        const startPoint = route[0];
        const pbIcon = L.divIcon({
            className: 'playback-marker',
            html: createVehicleIcon(startPoint.speed, startPoint.heading, true),
            iconSize: [70, 70],
            iconAnchor: [35, 35],
        });

        const marker = L.marker([startPoint.latitude, startPoint.longitude], { 
            icon: pbIcon, 
            zIndexOffset: 9999
        }).addTo(leafletMapRef.current);
        playbackMarkerRef.current = marker;

        playbackCurrentState.current = { lat: startPoint.latitude, lng: startPoint.longitude, heading: startPoint.heading, index: 0 };
        
        playbackAnimationQueue.current = route.map((point, index) => ({
            lat: point.latitude,
            lng: point.longitude,
            heading: point.heading,
            speed: point.speed,
            index: index
        }));

        setVehiclePosition({ lat: startPoint.latitude, lng: startPoint.longitude });
        setSpeed(startPoint.speed);
        setHeading(startPoint.heading);
        setCurrentPlaybackIndex(0);
        setPlaybackProgress(0);
    };

    const togglePlayback = () => isPlaying ? pausePlayback() : startPlayback();
    
    const startPlayback = () => {
        if (playbackRoute.length === 0) return alert("No data");
        setIsPlaying(true);
        if (playbackAnimationQueue.current.length === 0) {
             skipToPlaybackPoint(0);
        }
        startPlaybackAnimationLoop();
    };

    const pausePlayback = () => {
        setIsPlaying(false);
        if (playbackAnimationFrameRef.current) {
            cancelAnimationFrame(playbackAnimationFrameRef.current);
            playbackAnimationFrameRef.current = null;
        }
    };

    const stopPlayback = () => {
        setIsPlaying(false);
        setCurrentPlaybackIndex(0);
        setPlaybackProgress(0);
        if (playbackRoute.length > 0) skipToPlaybackPoint(0);
    };

    const skipToPlaybackPoint = (index) => {
        if (index < 0 || index >= playbackRoute.length) return;
        const point = playbackRoute[index];
        playbackCurrentState.current = { lat: point.latitude, lng: point.longitude, heading: point.heading, index: index };
        
        playbackAnimationQueue.current = playbackRoute.slice(index).map((p, i) => ({
            lat: p.latitude, lng: p.longitude, heading: p.heading, speed: p.speed, index: index + i
        }));

        if (playbackMarkerRef.current) {
            playbackMarkerRef.current.setLatLng([point.latitude, point.longitude]);
            updateMarkerVisuals(point.latitude, point.longitude, point.speed, point.heading, true);
        }
        
        setCurrentPlaybackIndex(index);
        setPlaybackProgress((index / (playbackRoute.length - 1)) * 100);
        if(leafletMapRef.current) leafletMapRef.current.panTo([point.latitude, point.longitude]);
    };

    const exitPlaybackMode = () => {
        stopPlayback();
        if (playbackMarkerRef.current) leafletMapRef.current.removeLayer(playbackMarkerRef.current);
        if (playbackPathRef.current) leafletMapRef.current.removeLayer(playbackPathRef.current);
        
        setIsPlaybackMode(false);
        setPlaybackRoute([]);
        setPlaybackDistance(0);

        if (leafletVehicleMarkerRef.current) leafletVehicleMarkerRef.current.setOpacity(1);
        // No path style restoration needed
        
        setStatus("Resuming Live...");
        initialCenterSet.current = false;
        fetchVehicleDataFromAPI();
        liveTrackingTimer.current = setInterval(fetchVehicleDataFromAPI, 5000);
    };

    // =========================================================================
    // Render Functions
    // =========================================================================

    const renderOverviewTab = () => (
        <div className="space-y-6">
            {/* Status Card */}
            <div className="bg-white rounded-xl p-4 shadow-lg border border-slate-200">
                <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 text-xs font-bold rounded-full ${status === "Live" ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                            {status}
                        </span>
                        <span className="text-xs font-mono font-bold text-slate-500">{formatDuration(duration)}</span>
                    </div>
                    <span className="text-xs text-slate-500">Last: {lastUpdateTime ? formatDateTime(lastUpdateTime) : 'N/A'}</span>
                </div>
                
                {/* Speed & Heading Row */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="p-4 bg-gradient-to-r from-blue-50 to-white rounded-xl border border-blue-100">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-600 font-medium mb-1">Speed</p>
                                <p className={`text-2xl font-bold ${speedInfo.color}`}>
                                    {speed.toFixed(1)} <span className="text-lg">km/h</span>
                                </p>
                                <p className="text-xs text-slate-500 mt-1">{speedInfo.status}</p>
                            </div>
                            <Gauge className="w-8 h-8 text-blue-500" />
                        </div>
                    </div>
                    <div className="p-4 bg-gradient-to-r from-purple-50 to-white rounded-xl border border-purple-100">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-600 font-medium mb-1">Heading</p>
                                <p className="text-2xl font-bold text-purple-600">
                                    {heading.toFixed(0)}° <span className="text-lg">N</span>
                                </p>
                                <div className="flex items-center gap-1 mt-1">
                                    <Compass className="w-4 h-4 text-slate-400" />
                                    <span className="text-xs text-slate-500">
                                        {heading >= 0 && heading < 90 ? 'NE' : heading >= 90 && heading < 180 ? 'SE' : heading >= 180 && heading < 270 ? 'SW' : 'NW'}
                                    </span>
                                </div>
                            </div>
                            <Compass className="w-8 h-8 text-purple-500" />
                        </div>
                    </div>
                </div>

                {/* GPS & Satellite Row */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="p-3 bg-slate-50 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                            <Satellite className="w-4 h-4 text-indigo-500" />
                            <span className="text-xs font-bold text-slate-700">GPS Satellites</span>
                        </div>
                        <div className="flex items-end gap-2">
                            <p className="text-xl font-bold text-indigo-600">{satellites}</p>
                            <span className="text-xs text-slate-500 mb-1">locked</span>
                        </div>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                            <LocateFixed className="w-4 h-4 text-emerald-500" />
                            <span className="text-xs font-bold text-slate-700">Accuracy</span>
                        </div>
                        <p className={`text-xl font-bold ${gpsAccuracyInfo.color}`}>
                            {gpsAccuracy.toFixed(1)}m
                        </p>
                        <p className="text-xs text-slate-500">{gpsAccuracyInfo.text}</p>
                    </div>
                </div>

                {/* Engine & Movement Status */}
                <div className="grid grid-cols-2 gap-3">
                    <div className={`p-3 rounded-lg ${engineInfo.bg}`}>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <engineInfo.icon className={`w-4 h-4 ${engineInfo.color}`} />
                                <span className="text-sm font-medium text-slate-700">Engine</span>
                            </div>
                            <span className={`text-sm font-bold ${engineInfo.color}`}>{engineStatus}</span>
                        </div>
                        <div className="mt-2">
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-slate-600">Ignition</span>
                                <span className={`font-bold ${ignition ? 'text-emerald-600' : 'text-slate-500'}`}>
                                    {ignition ? 'ON' : 'OFF'}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className={`p-3 rounded-lg ${movementInfo.bg}`}>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <movementInfo.icon className={`w-4 h-4 ${movementInfo.color}`} />
                                <span className="text-sm font-medium text-slate-700">Movement</span>
                            </div>
                            <span className={`text-sm font-bold ${movementInfo.color}`}>{movementInfo.text}</span>
                        </div>
                        <div className="mt-2">
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-slate-600">Distance Today</span>
                                <span className="font-bold text-slate-700">{formatDistance(totalDistance * 1000)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Signal & Battery Cards */}
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <Signal className="w-5 h-5 text-slate-600" />
                            <h3 className="font-bold text-slate-800">Network</h3>
                        </div>
                        <span className={`text-xs font-bold px-2 py-1 rounded ${signalInfo.bg} ${signalInfo.color}`}>
                            {signalInfo.text}
                        </span>
                    </div>
                    <div className="space-y-3">
                        <div>
                            <p className="text-xs text-slate-500 mb-1">Signal Strength</p>
                            <div className="flex items-center gap-2">
                                <div className="flex-1 bg-slate-200 rounded-full h-2">
                                    <div 
                                        className="bg-blue-600 h-2 rounded-full transition-all" 
                                        style={{ width: `${(parseInt(gsmSignal) / 31) * 100}%` }}
                                    ></div>
                                </div>
                                <span className="text-sm font-bold text-slate-700">{gsmSignal} dB</span>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <p className="text-xs text-slate-500">Network Type</p>
                                <p className="font-bold text-slate-800">{networkType}</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500">Data Usage</p>
                                <p className="font-bold text-slate-800">{dataUsage.toFixed(1)} MB</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <Battery className="w-5 h-5 text-slate-600" />
                            <h3 className="font-bold text-slate-800">Power</h3>
                        </div>
                        <span className={`text-xs font-bold px-2 py-1 rounded ${batteryInfo.bg} ${batteryInfo.color}`}>
                            {batteryInfo.text}
                        </span>
                    </div>
                    <div className="space-y-3">
                        <div>
                            <p className="text-xs text-slate-500 mb-1">Battery Voltage</p>
                            <p className="text-2xl font-bold text-emerald-600">{formatVoltage(batteryVoltage)}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <p className="text-xs text-slate-500">Device Temp</p>
                                <p className={`font-bold ${getTemperatureColor(deviceTemp)}`}>{deviceTemp.toFixed(1)}°C</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500">Power Source</p>
                                <p className="font-bold text-slate-800">Internal</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Additional Metrics */}
            <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-indigo-500" />
                    Vehicle Metrics
                </h3>
                <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-gradient-to-r from-slate-50 to-white rounded-lg border border-slate-100">
                        <div className="flex items-center gap-2 mb-2">
                            <Gauge className="w-4 h-4 text-blue-500" />
                            <span className="text-sm font-medium text-slate-700">Max Speed</span>
                        </div>
                        <p className="text-xl font-bold text-blue-600">{maxSpeed.toFixed(1)} km/h</p>
                    </div>
                    <div className="p-3 bg-gradient-to-r from-slate-50 to-white rounded-lg border border-slate-100">
                        <div className="flex items-center gap-2 mb-2">
                            <TrendingUp className="w-4 h-4 text-emerald-500" />
                            <span className="text-sm font-medium text-slate-700">Avg Speed</span>
                        </div>
                        <p className="text-xl font-bold text-emerald-600">{averageSpeed.toFixed(1)} km/h</p>
                    </div>
                    <div className="p-3 bg-gradient-to-r from-slate-50 to-white rounded-lg border border-slate-100">
                        <div className="flex items-center gap-2 mb-2">
                            <MapPin className="w-4 h-4 text-purple-500" />
                            <span className="text-sm font-medium text-slate-700">Altitude</span>
                        </div>
                        <p className="text-xl font-bold text-purple-600">{altitude.toFixed(0)} m</p>
                    </div>
                    <div className="p-3 bg-gradient-to-r from-slate-50 to-white rounded-lg border border-slate-100">
                        <div className="flex items-center gap-2 mb-2">
                            <Thermometer className="w-4 h-4 text-orange-500" />
                            <span className="text-sm font-medium text-slate-700">Temperature</span>
                        </div>
                        <p className={`text-xl font-bold ${getTemperatureColor(temperature)}`}>{temperature.toFixed(1)}°C</p>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderDetailsTab = () => (
        <div className="space-y-6">
            {/* Device Information */}
            <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <Database className="w-5 h-5 text-indigo-500" />
                    Device Details
                </h3>
                <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-slate-50 rounded-lg">
                        <p className="text-xs text-slate-500 mb-1">Device Number</p>
                        <p className="font-bold text-slate-800">{device?.deviceNo || 'N/A'}</p>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-lg">
                        <p className="text-xs text-slate-500 mb-1">Vehicle Number</p>
                        <p className="font-bold text-slate-800">{device?.vehicleNo || 'N/A'}</p>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-lg">
                        <p className="text-xs text-slate-500 mb-1">Device Status</p>
                        <span className={`px-2 py-1 text-xs font-bold rounded-full ${deviceStatus === "Online" ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                            {deviceStatus}
                        </span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-lg">
                        <p className="text-xs text-slate-500 mb-1">Odometer</p>
                        <p className="font-bold text-slate-800">{odometer.toFixed(0)} km</p>
                    </div>
                </div>
            </div>

            {/* Fuel Information */}
            <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <Zap className="w-5 h-5 text-amber-500" />
                    Fuel Information
                </h3>
                <div className="space-y-3">
                    <div>
                        <div className="flex justify-between text-sm mb-1">
                            <span className="text-slate-600">Fuel Level</span>
                            <span className="font-bold text-slate-800">{fuelLevel.toFixed(0)}%</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2">
                            <div 
                                className={`h-2 rounded-full transition-all ${fuelLevel > 50 ? 'bg-emerald-500' : fuelLevel > 20 ? 'bg-amber-500' : 'bg-rose-500'}`}
                                style={{ width: `${fuelLevel}%` }}
                            ></div>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 bg-gradient-to-r from-amber-50 to-white rounded-lg border border-amber-100">
                            <p className="text-xs text-slate-500 mb-1">Estimated Range</p>
                            <p className="font-bold text-slate-800">{(fuelLevel * 15).toFixed(0)} km</p>
                        </div>
                        <div className="p-3 bg-gradient-to-r from-blue-50 to-white rounded-lg border border-blue-100">
                            <p className="text-xs text-slate-500 mb-1">Fuel Consumption</p>
                            <p className="font-bold text-slate-800">8.5 km/L</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Environmental Data */}
            <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <Globe className="w-5 h-5 text-emerald-500" />
                    Environmental Data
                </h3>
                <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-gradient-to-r from-emerald-50 to-white rounded-lg border border-emerald-100">
                        <div className="flex items-center gap-2 mb-2">
                            <Thermometer className="w-4 h-4 text-emerald-500" />
                            <span className="text-sm font-medium text-slate-700">Temperature</span>
                        </div>
                        <p className={`text-2xl font-bold ${getTemperatureColor(temperature)}`}>
                            {temperature.toFixed(1)}°C
                        </p>
                        <p className="text-xs text-slate-500 mt-1">Ambient</p>
                    </div>
                    <div className="p-3 bg-gradient-to-r from-blue-50 to-white rounded-lg border border-blue-100">
                        <div className="flex items-center gap-2 mb-2">
                            <Wind className="w-4 h-4 text-blue-500" />
                            <span className="text-sm font-medium text-slate-700">Humidity</span>
                        </div>
                        <p className="text-2xl font-bold text-blue-600">
                            {humidity.toFixed(0)}%
                        </p>
                        <p className="text-xs text-slate-500 mt-1">Relative</p>
                    </div>
                </div>
            </div>

            {/* Raw Data Toggle */}
            <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                        <Code className="w-5 h-5 text-slate-600" />
                        Raw Data
                    </h3>
                    <button 
                        onClick={() => setShowRawData(!showRawData)}
                        className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700"
                    >
                        {showRawData ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        {showRawData ? 'Hide Raw Data' : 'Show Raw Data'}
                    </button>
                </div>
                {showRawData && rawData && (
                    <div className="mt-3 bg-slate-900 rounded-lg p-3 overflow-auto max-h-60">
                        <pre className="text-xs text-slate-200 whitespace-pre-wrap">
                            {JSON.stringify(rawData, null, 2)}
                        </pre>
                    </div>
                )}
            </div>
        </div>
    );

    const renderPlaybackTab = () => (
        <div className="space-y-6">
            {!isPlaybackMode ? (
                <div className="bg-gradient-to-r from-indigo-50 to-white p-4 rounded-xl shadow-sm border border-indigo-100 space-y-4">
                    <h3 className="font-bold text-indigo-800 flex items-center gap-2">
                        <History className="w-5 h-5" />
                        Route Playback
                    </h3>
                    <div className="space-y-3">
                        <div>
                            <label className="text-sm font-bold text-slate-700">Start Time</label>
                            <input 
                                type="datetime-local" 
                                value={playbackStartTime} 
                                onChange={e => setPlaybackStartTime(e.target.value)} 
                                className="w-full mt-1 p-2 border rounded-md bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-bold text-slate-700">End Time</label>
                            <input 
                                type="datetime-local" 
                                value={playbackEndTime} 
                                onChange={e => setPlaybackEndTime(e.target.value)} 
                                className="w-full mt-1 p-2 border rounded-md bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            />
                        </div>
                        <button 
                            onClick={fetchRoutePlayback} 
                            disabled={isLoadingPlayback}
                            className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-md font-bold hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                        >
                            {isLoadingPlayback ? (
                                <>
                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                    Loading...
                                </>
                            ) : (
                                <>
                                    <Play className="w-4 h-4" />
                                    Load Route Playback
                                </>
                            )}
                        </button>
                    </div>
                    <div className="text-xs text-slate-500">
                        <p>• Load historical route data for playback</p>
                        <p>• Adjust playback speed from 1x to 5x</p>
                        <p>• View complete journey with time stamps</p>
                    </div>
                </div>
            ) : (
                <div className="bg-gradient-to-r from-rose-50 to-white p-4 rounded-xl shadow-sm border border-rose-100 space-y-4">
                    <div className="flex justify-between items-center">
                        <h3 className="font-bold text-rose-800 flex items-center gap-2">
                            <History className="w-5 h-5" />
                            Playback Active
                        </h3>
                        <button 
                            onClick={exitPlaybackMode}
                            className="text-sm bg-slate-100 px-3 py-1 rounded hover:bg-slate-200 font-medium"
                        >
                            Exit Playback
                        </button>
                    </div>
                    
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-600">Progress</span>
                            <span className="font-bold text-rose-600">
                                {currentPlaybackIndex + 1} / {playbackRoute.length}
                            </span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2">
                            <div 
                                className="bg-gradient-to-r from-rose-500 to-pink-500 h-2 rounded-full transition-all duration-300" 
                                style={{width: `${playbackProgress}%`}}
                            ></div>
                        </div>
                    </div>

                    <div className="flex justify-center gap-4">
                        <button 
                            onClick={() => skipToPlaybackPoint(Math.max(0, currentPlaybackIndex - 10))}
                            className="p-2 bg-slate-100 rounded-full hover:bg-slate-200"
                            title="Skip Back"
                        >
                            <SkipBack className="w-5 h-5 text-slate-600" />
                        </button>
                        <button 
                            onClick={togglePlayback} 
                            className="p-3 bg-gradient-to-r from-rose-600 to-pink-600 rounded-full text-white hover:from-rose-700 hover:to-pink-700"
                        >
                            {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
                        </button>
                        <button 
                            onClick={() => skipToPlaybackPoint(Math.min(playbackRoute.length - 1, currentPlaybackIndex + 10))}
                            className="p-2 bg-slate-100 rounded-full hover:bg-slate-200"
                            title="Skip Forward"
                        >
                            <SkipForward className="w-5 h-5 text-slate-600" />
                        </button>
                    </div>

                    <div className="flex justify-center gap-2 pt-2 border-t border-rose-100">
                        {[1, 2, 5].map(x => (
                            <button 
                                key={x}
                                onClick={() => setPlaybackSpeed(x)}
                                className={`px-3 py-1 text-sm rounded-lg transition-all ${playbackSpeed === x ? 'bg-rose-100 text-rose-700 font-bold' : 'bg-slate-100 hover:bg-slate-200'}`}
                            >
                                {x}x Speed
                            </button>
                        ))}
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-3 border-t border-rose-100">
                        <div className="text-center">
                            <p className="text-xs text-slate-500">Distance</p>
                            <p className="font-bold text-slate-800">{formatDistance(playbackDistance)}</p>
                        </div>
                        <div className="text-center">
                            <p className="text-xs text-slate-500">Points</p>
                            <p className="font-bold text-slate-800">{playbackRoute.length}</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );

    return (
        <div className="flex h-screen bg-gradient-to-br from-slate-50 to-slate-100">
            {/* Sidebar */}
            <div className="w-[450px] bg-white shadow-2xl border-r border-slate-200 flex flex-col z-20">
                <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-indigo-50 to-white">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                            <Navigation className="w-7 h-7 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-extrabold text-slate-900">Sentinel Track Pro</h1>
                            <p className="text-sm text-slate-500">Advanced Vehicle Tracking System</p>
                        </div>
                    </div>
                    
                    <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-indigo-100 shadow-sm">
                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg shadow">
                                <Car className="w-6 h-6 text-white" />
                            </div>
                            <div className="flex-1">
                                <h2 className="font-bold text-lg text-slate-900">{device?.vehicleNo || 'Unknown Vehicle'}</h2>
                                <p className="text-xs text-slate-500 mb-2">{device?.deviceNo}</p>
                                <div className="flex items-center gap-2 text-xs">
                                    <span className={`px-2 py-1 rounded-full ${deviceStatus === "Online" ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                        {deviceStatus}
                                    </span>
                                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                                        {networkType}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-slate-200 bg-white">
                    {[
                        { id: 'overview', label: 'Overview', icon: Activity },
                        { id: 'playback', label: 'Playback', icon: History },
                        { id: 'details', label: 'Details', icon: Database }
                    ].map(tab => (
                        <button 
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex-1 py-4 text-sm font-semibold capitalize flex items-center justify-center gap-2 transition-all ${activeTab === tab.id 
                                ? "text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50" 
                                : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                            }`}
                        >
                            <tab.icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {activeTab === 'overview' && renderOverviewTab()}
                    {activeTab === 'playback' && renderPlaybackTab()}
                    {activeTab === 'details' && renderDetailsTab()}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-200 bg-slate-50">
                    <div className="text-xs text-slate-500 text-center">
                        <p>Last Updated: {lastUpdateTime ? formatDateTime(lastUpdateTime) : 'Never'}</p>
                        <p className="mt-1">Connection: {status} • Duration: {formatDuration(duration)}</p>
                    </div>
                </div>
            </div>

            {/* Map Container */}
            <div className="flex-1 relative">
                <div ref={mapRef} className="w-full h-full" />
                
                {/* Map Controls */}
                <div className="absolute top-4 right-4 flex flex-col gap-3 z-30">
                    <div className="bg-white/90 backdrop-blur-sm p-2 rounded-xl shadow-lg border border-slate-200 flex flex-col gap-1">
                        <button 
                            onClick={() => changeMapType("roadmap")} 
                            className={`p-2 rounded-lg hover:bg-slate-100 transition-all ${mapType === 'roadmap' ? 'text-indigo-600 bg-indigo-50' : 'text-slate-600'}`} 
                            title="Road Map"
                        >
                            <MapIcon className="w-5 h-5" />
                        </button>
                        <button 
                            onClick={() => changeMapType("satellite")} 
                            className={`p-2 rounded-lg hover:bg-slate-100 transition-all ${mapType === 'satellite' ? 'text-indigo-600 bg-indigo-50' : 'text-slate-600'}`} 
                            title="Satellite"
                        >
                            <Satellite className="w-5 h-5" />
                        </button>
                        <button 
                            onClick={() => changeMapType("hybrid")} 
                            className={`p-2 rounded-lg hover:bg-slate-100 transition-all ${mapType === 'hybrid' ? 'text-indigo-600 bg-indigo-50' : 'text-slate-600'}`} 
                            title="Hybrid"
                        >
                            <Layers className="w-5 h-5" />
                        </button>
                    </div>
                    <button 
                        onClick={centerMap} 
                        className="bg-white/90 backdrop-blur-sm p-3 rounded-xl shadow-lg text-slate-600 hover:text-indigo-600 hover:bg-white border border-slate-200 transition-all"
                        title="Center Map"
                    >
                        <Target className="w-5 h-5" />
                    </button>
                    <button 
                        onClick={toggleFullscreen} 
                        className="bg-white/90 backdrop-blur-sm p-3 rounded-xl shadow-lg text-slate-600 hover:text-indigo-600 hover:bg-white border border-slate-200 transition-all"
                        title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
                    >
                        {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
                    </button>
                </div>

                {/* Overlay Loader */}
                {status === "Initializing" && (
                    <div className="absolute inset-0 bg-white/90 z-40 flex flex-col items-center justify-center">
                        <div className="relative">
                            <div className="w-20 h-20 border-4 border-indigo-200 rounded-full"></div>
                            <div className="absolute top-0 left-0 w-20 h-20 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                        <p className="mt-6 font-bold text-indigo-900 text-lg">Connecting to Vehicle...</p>
                        <p className="mt-2 text-slate-600 text-sm">Initializing GPS and sensor data</p>
                    </div>
                )}

                <style>{`
                    @keyframes pulse { 
                        0% { opacity: 1; } 
                        50% { opacity: 0.5; } 
                        100% { opacity: 1; } 
                    }
                    .leaflet-control-zoom { margin-bottom: 20px !important; }
                    .vehicle-marker { z-index: 1000 !important; }
                    .playback-marker { z-index: 9999 !important; }
                `}</style>
            </div>
        </div>
    );
};

// Helper component for Code icon
const Code = ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
    </svg>
);

export default Livetracking;