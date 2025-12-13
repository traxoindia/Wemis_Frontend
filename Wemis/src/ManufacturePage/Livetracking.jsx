import React, { useEffect, useRef, useState } from "react";
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
    Move
} from "lucide-react";
import { useLocation } from "react-router-dom";

// 1. ADD THE LOGO IMPORT HERE 
import vehicleLogo from '../Images/car.png';

// Helper function to calculate the bearing (heading) between two coordinates
const calculateHeading = (from, to) => {
    // Convert degrees to radians
    const lat1 = from.lat * Math.PI / 180;
    const lat2 = to.lat * Math.PI / 180;
    const dLng = (to.lng - from.lng) * Math.PI / 180;

    const y = Math.sin(dLng) * Math.cos(lat2);
    const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);

    // Calculate initial bearing in radians and convert to degrees
    let heading = (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
    
    return heading;
};


const Livetracking = () => {
    const location = useLocation();
    const { device } = location.state || {}; 

    const mapRef = useRef(null);
    const [map, setMap] = useState(null);
    const [vehiclePosition, setVehiclePosition] = useState(null); 
    const [currentLocation, setCurrentLocation] = useState(null);
    const [status, setStatus] = useState("Initializing");
    const [speed, setSpeed] = useState(0);
    const [heading, setHeading] = useState(0); // Heading used for rotation
    const [satellites, setSatellites] = useState(0);
    const [batteryVoltage, setBatteryVoltage] = useState("0");
    const [gsmSignal, setGsmSignal] = useState("0");
    const [altitude, setAltitude] = useState(0);
    const [deviceStatus, setDeviceStatus] = useState("Unknown");
    const [lastUpdateTime, setLastUpdateTime] = useState(null);
    const [rawData, setRawData] = useState(null);
    const [activeTab, setActiveTab] = useState("tracking");
    const [smoothPathData, setSmoothPathData] = useState([]); // State to hold the path data

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
    
    const pathAnimationTimer = useRef(null); // Timer for smooth animation
    const lastKnownVehiclePosition = useRef(null); // Last known position (used for animation start)


    // --- Core Effects and Map Setup ---

    useEffect(() => {
        // Timer for session duration
        const timer = setInterval(() => {
            setDuration(Math.floor((Date.now() - startTime.current) / 1000));
        }, 1000);

        loadLeafletMap();

        return () => {
            // Cleanup on component unmount
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
            // Cleanup the path animation timer
            if (pathAnimationTimer.current) {
                clearInterval(pathAnimationTimer.current);
            }
        };
    }, []);

    const formatDuration = (seconds) => {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const loadLeafletMap = () => {
        if (typeof window.L === 'undefined' || !window.L) {
            const existingLeafletCSS = document.querySelector('link[href*="leaflet.css"]');
            if (!existingLeafletCSS) {
                const link = document.createElement("link");
                link.rel = "stylesheet";
                link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
                document.head.appendChild(link);
            }
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

        const defaultLocation = { lat: 20.2961, lng: 85.8245 };

        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const userLocation = {
                        lat: pos.coords.latitude,
                        lng: pos.coords.longitude,
                    };
                    setCurrentLocation(userLocation);
                    setVehiclePosition(userLocation); // Set initial vehicle pos to user pos
                    initializeMap(userLocation);
                },
                (err) => {
                    handleGeoError("Location access denied. Using default map center.");
                    setVehiclePosition(defaultLocation); // Set initial vehicle pos to default
                    initializeMap(defaultLocation);
                }
            );
        } else {
            setVehiclePosition(defaultLocation); // Set initial vehicle pos to default
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

    // Creates the HTML structure for the vehicle icon (USING PNG LOGO and current heading state)
    const createVehicleIcon = () => {
        const isMoving = speed > 0.5;
        let statusColor = isMoving ? '#10B981' : '#F59E0B'; // Green if moving, Amber if stopped
        
        // Use a wrapping div to position the label and an inner div to handle the rotation of the image.
        return `
            <div style="position: relative; width: 60px; height: 60px;">
                <div style="position: absolute; top: -5px; left: 50%; transform: translateX(-50%); background: #1F2937; color: white; padding: 4px 8px; border-radius: 8px; font-size: 10px; font-weight: 700; box-shadow: 0 2px 8px rgba(0,0,0,0.3); white-space: nowrap; display: flex; align-items: center; gap: 4px;">
                    <div style="width: 6px; height: 6px; border-radius: 50%; background: ${statusColor};"></div>
                    ${speed.toFixed(0)} km/h
                </div>
                
                <div style="width: 40px; height: 40px; position: absolute; top: 10px; left: 10px; transform: rotate(${heading}deg); filter: drop-shadow(0 3px 6px rgba(0,0,0,0.4));">
                    <img 
                        src="${vehicleLogo}" 
                        alt="Vehicle Logo" 
                        style="width: 100%; height: 100%; object-fit: contain;"
                    />
                </div>
            </div>
        `;
    };
    
    const initializeVehicleTracking = (mapInstance, initialPosition) => {
        // Create the initial vehicle marker icon
        const vehicleIcon = window.L.divIcon({
            className: 'vehicle-marker',
            html: createVehicleIcon(),
            iconSize: [60, 60],
            iconAnchor: [30, 30],
        });

        // Add the vehicle marker to the map
        const vehicleMarker = window.L.marker(
            [initialPosition.lat, initialPosition.lng],
            { icon: vehicleIcon, zIndexOffset: 1000 }
        ).addTo(mapInstance).bindPopup(`
            <div style="font-weight: bold;">
                ${device?.vehicleNo || 'Vehicle'} - ${speed.toFixed(0)} km/h<br/>
                Battery: ${batteryVoltage}V<br/>
                Signal: ${gsmSignal} RSSI
            </div>
        `);

        leafletVehicleMarkerRef.current = vehicleMarker;

        // Add the polyline for the historical path trail
        const vehiclePath = window.L.polyline([], {
            color: '#4F46E5', 
            weight: 4,
            opacity: 0.7,
            lineJoin: 'round'
        }).addTo(mapInstance);

        leafletPathRef.current = vehiclePath;

        // Set the API polling interval
        const trackingInterval = setInterval(() => {
            updateVehicleFromAPI(mapInstance, vehicleMarker, vehiclePath);
        }, 3000); // Poll API every 3 seconds

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

    const fetchVehicleDataFromAPI = async (device) => {
        if (!device || !device.deviceNo) {
            setStatus("Missing Device ID");
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
                body: JSON.stringify({ deviceNo: device.deviceNo }),
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
            
            // Extract data points
            const locationData = data.location || {};
            const rawData = data.rawData || data;
            const deviceInfo = data.deviceInfo || {};
            const previousLocation = data.previousLocation || {}; // Used for smooth path start

            // Safely parse primary location and speed
            const lat = parseFloat(locationData.latitude || rawData.lat || 0);
            const lng = parseFloat(locationData.longitude || rawData.lng || 0);
            const speed = parseFloat(locationData.speed || rawData.speed || 0);
            const headingValue = parseFloat(locationData.heading || rawData.headDegree || 0);
            
            // Other metrics
            const satellitesValue = parseInt(rawData.satellites || 0);
            const batteryValue = rawData.batteryVoltage || "0";
            const gsmValue = rawData.gsmSignal || "0";
            const altitudeValue = parseFloat(rawData.altitude || 0);
            const deviceStatusValue = deviceInfo.status || rawData.packetStatus || "UNKNOWN";
            const lastUpdateDate = new Date(data.timestamp?.lastUpdate || rawData.timestamp || Date.now());

            // Process smoothPath
            const smoothPath = data.smoothPath || [];
            
            if (lat !== 0 && lng !== 0) {
                setSatellites(satellitesValue);
                setBatteryVoltage(batteryValue);
                setGsmSignal(gsmValue);
                setAltitude(altitudeValue);
                setDeviceStatus(deviceStatusValue);
                setLastUpdateTime(lastUpdateDate);
                
                // Map the path to use 'lat'/'lng' keys and safely parse floats, filtering out invalid points.
                const parsedSmoothPath = smoothPath.map(p => ({ 
                    lat: parseFloat(p.latitude) || 0,
                    lng: parseFloat(p.longitude) || 0
                })).filter(p => p.lat !== 0 && p.lng !== 0);

                return {
                    position: { lat: lat, lng: lng },
                    previousPosition: { 
                        // Use previousLocation from API, or the current state position, for animation start
                        lat: parseFloat(previousLocation.latitude || vehiclePosition?.lat || lat),
                        lng: parseFloat(previousLocation.longitude || vehiclePosition?.lng || lng)
                    },
                    speed: speed,
                    heading: headingValue,
                    timestamp: Date.now(),
                    smoothPath: parsedSmoothPath, // Use the cleaned array
                };
            } else {
                setStatus("No GPS Fix");
                return null;
            }

        } catch (error) {
            console.error("Fetch API Error:", error);
            if (status !== "Unauthorized") {
                setStatus("Network Error");
            }
            return null;
        }
    };

    /**
     * Animates the vehicle marker along the smooth path.
     */
    const animateVehiclePath = (mapInstance, vehicleMarker, path, durationMs, initialPosition) => {
        if (!path || path.length < 1 || !initialPosition) return;
        
        // Use 'lat' and 'lng' keys for the start point
        const startPoint = { lat: initialPosition.lat, lng: initialPosition.lng }; 
        const fullPath = [startPoint, ...path].filter((point, index, self) => 
            // Deduplicate the start point if it's the same as the first path point
            !(index > 0 && point.lat === self[0].lat && point.lng === self[0].lng)
        );
        
        if (fullPath.length < 2) {
             // If path is too short, just jump to the final position.
             const finalPosition = fullPath[0] || initialPosition;
             setVehiclePosition(finalPosition);
             vehicleMarker.setLatLng([finalPosition.lat, finalPosition.lng]);
             mapInstance.panTo([finalPosition.lat, finalPosition.lng], { animate: true, duration: 0.5 });
             return;
        }

        // Clear any existing animation interval
        if (pathAnimationTimer.current) {
            clearInterval(pathAnimationTimer.current);
        }

        // Calculate the time interval between each step
        const interval = durationMs / (fullPath.length - 1); 
        let stepIndex = 0;
        
        // Start position is the initialPosition passed in
        let lastPosition = initialPosition; 

        // Set the marker to the absolute start position immediately
        vehicleMarker.setLatLng([initialPosition.lat, initialPosition.lng]);
        
        // --- Animation Step Function ---
        const animationStep = () => {
            if (stepIndex >= fullPath.length - 1) { // Stop one step before the end
                clearInterval(pathAnimationTimer.current);
                // Set the final state to the last point in the path from the API
                const finalPosition = fullPath[fullPath.length - 1];
                setVehiclePosition(finalPosition);
                return;
            }

            // Move from stepIndex (lastPosition) to stepIndex + 1 (newPosition)
            const newPosition = fullPath[stepIndex + 1]; 
            
            let currentHeading = heading;
            
            // Calculate instantaneous heading between steps for smooth rotation
            if (lastPosition.lat !== newPosition.lat || lastPosition.lng !== newPosition.lng) {
                 currentHeading = calculateHeading(lastPosition, newPosition);
                 // ONLY update the local heading variable for this step's rotation
            }

            // Update marker position
            vehicleMarker.setLatLng([newPosition.lat, newPosition.lng]); 
            setVehiclePosition(newPosition); // Update React state to trigger UI updates

            // Update heading state and marker icon rotation
            setHeading(currentHeading);
            const newIcon = window.L.divIcon({
                className: 'vehicle-marker',
                // createVehicleIcon uses the updated 'heading' state value
                html: createVehicleIcon(), 
                iconSize: [60, 60],
                iconAnchor: [30, 30],
            });
            vehicleMarker.setIcon(newIcon);

            // Center map on the vehicle's new position (smooth pan)
            mapInstance.panTo([newPosition.lat, newPosition.lng], {
                animate: true,
                duration: interval / 1000 
            });

            // Update map path trail 
            pathCoordinates.current.push(newPosition);
            if (pathCoordinates.current.length > 200) {
                pathCoordinates.current.shift();
            }
            const latlngs = pathCoordinates.current.map(p => [p.lat, p.lng]);
            leafletPathRef.current.setLatLngs(latlngs);


            lastPosition = newPosition;
            stepIndex++;
        };
        
        pathAnimationTimer.current = setInterval(animationStep, interval);
    };


    const updateVehicleFromAPI = async (mapInstance, vehicleMarker, vehiclePath) => {
        const apiData = await fetchVehicleDataFromAPI(device);

        if (!apiData) {
            // Stop animation if API call fails
            if (pathAnimationTimer.current) {
                clearInterval(pathAnimationTimer.current);
            }
            return;
        }

        setSpeed(apiData.speed);
        setStatus("Live");

        const smoothPath = apiData.smoothPath;
        setSmoothPathData(smoothPath);
        
        // Determine the animation start position
        let animationStartPos;
        if (lastKnownVehiclePosition.current) {
            animationStartPos = lastKnownVehiclePosition.current; 
        } else {
            animationStartPos = apiData.previousPosition;
        }
        
        // Store the final position from this API response for the next cycle's smooth start
        lastKnownVehiclePosition.current = apiData.position; 

        if (smoothPath.length > 0) {
            // Start path animation over the 3-second polling interval
            animateVehiclePath(mapInstance, vehicleMarker, smoothPath, 3000, animationStartPos);
        } else {
             // Handle cases where no smoothPath is provided (e.g., stopping or single point update)
            
            // Clear animation timer as there is no path to animate
            if (pathAnimationTimer.current) {
                clearInterval(pathAnimationTimer.current);
            }

            const newPosition = apiData.position;
            let finalHeading = apiData.heading;
            
            // Calculate heading if moving and API didn't provide one
            if (apiData.speed > 0.5 && finalHeading === 0 && vehiclePosition) {
                 finalHeading = calculateHeading(vehiclePosition, newPosition);
            } else if (apiData.speed <= 0.5) {
                // If stopped, maintain current heading
                finalHeading = heading;
            }

            setVehiclePosition(newPosition);
            setHeading(finalHeading);
            
            // Immediately update the marker position
            vehicleMarker.setLatLng([newPosition.lat, newPosition.lng]);
            const newIcon = window.L.divIcon({
                className: 'vehicle-marker',
                html: createVehicleIcon(),
                iconSize: [60, 60],
                iconAnchor: [30, 30],
            });
            vehicleMarker.setIcon(newIcon);

            // Pan the map to the new position
            mapInstance.panTo([newPosition.lat, newPosition.lng], {
                animate: true,
                duration: 1.0 // Slower pan for single update
            });

             // Update path trail for single point
             pathCoordinates.current.push(newPosition);
             if (pathCoordinates.current.length > 200) {
                 pathCoordinates.current.shift();
             }
             const latlngs = pathCoordinates.current.map(p => [p.lat, p.lng]);
             vehiclePath.setLatLngs(latlngs);
        }
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

    // --- Reusable Components ---

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
                                <h2 className="font-bold text-slate-900">{device?.vehicleNo || 'OD00000'}</h2>
                                <p className="text-xs text-slate-500">ID: {device?.deviceNo || 'N/A'}</p>
                            </div>
                        </div>
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
                                        <RawDataItem label="Alert ID" value={rawData.alertId} color="red" />
                                        <RawDataItem label="Battery Voltage" value={rawData.batteryVoltage} color="green" />
                                        <RawDataItem label="Date" value={rawData.date} color="indigo" />
                                        <RawDataItem label="Device ID" value={rawData.deviceId} color="slate" />
                                        <RawDataItem label="Firmware" value={rawData.firmware} color="slate" />
                                        <RawDataItem label="GPS Fix" value={rawData.gpsFix} color={rawData.gpsFix === "1" ? "green" : "red"} />
                                        <RawDataItem label="GSM Signal" value={rawData.gsmSignal} color="indigo" />
                                        <RawDataItem label="IMEI" value={rawData.imei} color="slate" />
                                        <RawDataItem label="Last Update" value={new Date(rawData.lastUpdate).toLocaleString()} color="indigo" />
                                        <RawDataItem label="Latitude" value={rawData.lat} color="green" />
                                        <RawDataItem label="Longitude" value={rawData.lng} color="green" />
                                        <RawDataItem label="Packet Status" value={rawData.packetStatus} color={rawData.packetStatus === "H" ? "green" : "yellow"} />
                                        <RawDataItem label="Satellites" value={rawData.satellites} color="indigo" />
                                        <RawDataItem label="Speed" value={rawData.speed} color="indigo" />
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
                {vehiclePosition && <MapDataWidget speed={speed} position={vehiclePosition} />}

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
                    <p className="text-sm text-slate-500 mt-2">Initializing live tracker</p>
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