import React, { useEffect, useRef, useState, useCallback } from "react";
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
    Play,
    Pause,
    SkipBack,
    SkipForward,
    History,
    RotateCcw,
    ChevronRight,
    Calendar,
    Loader2,
    Map,
    Radio
} from "lucide-react";

// Logo import - Make sure the path is correct
import vehicleLogo from '../Images/car.png';

// Helper function to calculate the bearing (heading) between two coordinates
const calculateHeading = (from, to) => {
    if (!from || !to) return 0;
    const lat1 = from.lat * Math.PI / 180;
    const lat2 = to.lat * Math.PI / 180;
    const dLng = (to.lng - from.lng) * Math.PI / 180;

    const y = Math.sin(dLng) * Math.cos(lat2);
    const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);

    return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
};

// Helper function to format date to local datetime-local input format
const formatDateTimeForInput = (date) => {
    const d = new Date(date);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
};

// Helper function to format duration
const formatDuration = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

const Livetracking = () => {
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const deviceNosString = queryParams.get('deviceNos');
    const deviceNosList = deviceNosString ? deviceNosString.split(',').map(no => no.trim()).filter(no => no.length > 0) : [];
    
    const trackedDeviceNo = deviceNosList[0] || 'N/A';
    const [deviceInfo, setDeviceInfo] = useState({ 
        deviceNo: trackedDeviceNo, 
        vehicleNo: 'Loading...',
        vehicleType: 'Unknown'
    });

    // Core states
    const mapRef = useRef(null);
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

    // Route Playback States
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
    const [playbackStats, setPlaybackStats] = useState({
        totalDistance: 0,
        avgSpeed: 0,
        maxSpeed: 0,
        duration: 0
    });

    // Refs
    const loaderRef = useRef(null);
    const geoErrorRef = useRef(null);
    const geoErrorMessageRef = useRef(null);
    const pathCoordinates = useRef([]);
    const watchIdRef = useRef(null);
    const leafletMapRef = useRef(null);
    const leafletVehicleMarkerRef = useRef(null);
    const leafletPathRef = useRef(null);
    const playbackMarkerRef = useRef(null);
    const playbackPathRef = useRef(null);
    const startTime = useRef(Date.now());
    const [duration, setDuration] = useState(0);
    const pathAnimationTimer = useRef(null);
    const playbackTimer = useRef(null);
    const liveTrackingTimer = useRef(null);

    // Calculate distance between two coordinates (Haversine formula)
    const calculateDistance = (lat1, lon1, lat2, lon2) => {
        const R = 6371; // Earth's radius in km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    };

    // Calculate playback statistics
    const calculatePlaybackStats = (route) => {
        if (!route || route.length < 2) {
            return { totalDistance: 0, avgSpeed: 0, maxSpeed: 0, duration: 0 };
        }

        let totalDistance = 0;
        let totalSpeed = 0;
        let maxSpeed = 0;
        
        for (let i = 1; i < route.length; i++) {
            const prev = route[i-1];
            const curr = route[i];
            
            const distance = calculateDistance(
                prev.latitude, prev.longitude,
                curr.latitude, curr.longitude
            );
            totalDistance += distance;
            totalSpeed += curr.speed;
            maxSpeed = Math.max(maxSpeed, curr.speed);
        }

        const startTime = new Date(route[0].timestamp);
        const endTime = new Date(route[route.length-1].timestamp);
        const durationMs = endTime - startTime;
        const durationHours = durationMs / (1000 * 60 * 60);

        return {
            totalDistance: totalDistance.toFixed(2),
            avgSpeed: (totalSpeed / route.length).toFixed(1),
            maxSpeed: maxSpeed.toFixed(0),
            duration: durationHours.toFixed(2)
        };
    };

    // --- Core Effects and Map Setup ---

    useEffect(() => {
        // Set default playback times (last 24 hours)
        const now = new Date();
        const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        
        setPlaybackStartTime(formatDateTimeForInput(yesterday));
        setPlaybackEndTime(formatDateTimeForInput(now));

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
            if (pathAnimationTimer.current) {
                clearInterval(pathAnimationTimer.current);
            }
            if (playbackTimer.current) {
                clearInterval(playbackTimer.current);
            }
            if (liveTrackingTimer.current) {
                clearInterval(liveTrackingTimer.current);
            }
        };
    }, [trackedDeviceNo]);

    const loadLeafletMap = () => {
        const existingLeafletCSS = document.querySelector('link[href*="leaflet.css"]');
        if (!existingLeafletCSS) {
            const link = document.createElement("link");
            link.rel = "stylesheet";
            link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
            link.crossOrigin = "";
            document.head.appendChild(link);
        }

        if (!window.L) {
            const existingLeafletJS = document.querySelector('script[src*="leaflet.js"]');
            if (!existingLeafletJS) {
                const script = document.createElement("script");
                script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
                script.async = true;
                script.crossOrigin = "";
                script.onload = () => initLeafletMap();
                script.onerror = () => handleGeoError("Failed to load map library");
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
                },
                {
                    enableHighAccuracy: true,
                    timeout: 5000,
                    maximumAge: 0
                }
            );
        } else {
            setVehiclePosition(defaultLocation);
            initializeMap(defaultLocation);
        }
    };

    const initializeMap = (location) => {
        try {
            const mapInstance = window.L.map(mapRef.current, {
                zoomControl: false
            }).setView([location.lat, location.lng], 16);

            window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
                attribution: '© OpenStreetMap contributors',
                maxZoom: 19,
            }).addTo(mapInstance);

            // Add zoom control to top-right
            window.L.control.zoom({ position: 'topright' }).addTo(mapInstance);

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
        } catch (error) {
            console.error("Map initialization error:", error);
            handleGeoError("Failed to initialize map");
        }
    };

    // Creates the HTML structure for the vehicle icon with PNG LOGO
    const createVehicleIcon = (customSpeed = null, customHeading = null, isPlayback = false) => {
        const currentSpeed = customSpeed !== null ? customSpeed : speed;
        const currentHeading = customHeading !== null ? customHeading : heading;
        const isMoving = currentSpeed > 0.5;
        
        const batteryLevel = parseFloat(batteryVoltage);
        let batteryColor = "#F59E0B"; 
        if (batteryLevel >= 3.8) batteryColor = "#10B981"; 
        else if (batteryLevel < 3.5 && batteryLevel > 0) batteryColor = "#EF4444";

        const statusColor = isMoving ? '#10B981' : '#F59E0B';
        const bgColor = isPlayback ? '#DC2626' : '#1E293B';
        const labelText = isPlayback ? 'PLAYBACK' : '';

        return `
            <div style="position: relative; width: 60px; height: 60px;">
                <div style="position: absolute; top: -5px; left: 50%; transform: translateX(-50%); background: ${bgColor}; color: white; padding: 4px 8px; border-radius: 8px; font-size: 10px; font-weight: 700; box-shadow: 0 2px 8px rgba(0,0,0,0.3); white-space: nowrap; display: flex; align-items: center; gap: 4px; z-index: 1000;">
                    <div style="width: 6px; height: 6px; border-radius: 50%; background: ${statusColor};"></div>
                    ${currentSpeed.toFixed(0)} km/h
                </div>
                
                <div style="width: 40px; height: 40px; position: absolute; top: 10px; left: 10px; transform: rotate(${currentHeading}deg); filter: drop-shadow(0 3px 6px rgba(0,0,0,0.4)); transition: transform 0.3s ease;">
                    <img 
                        src="${vehicleLogo}" 
                        alt="Vehicle Logo" 
                        style="width: 100%; height: 100%; object-fit: contain;"
                        onerror="this.style.display='none'; this.parentElement.innerHTML='<div style=\\'width:40px;height:40px;background:#4F46E5;border-radius:8px;border:2px solid #3730A3;display:flex;align-items:center;justify-content:center;color:white;font-weight:bold;\\'>V</div>'"
                    />
                </div>
                ${labelText && `
                    <div style="position: absolute; bottom: -5px; left: 50%; transform: translateX(-50%); background: ${bgColor}; color: white; padding: 2px 6px; border-radius: 4px; font-size: 8px; font-weight: 700; white-space: nowrap; z-index: 1000;">
                        ${labelText}
                    </div>
                `}
            </div>
        `;
    };

    const initializeVehicleTracking = (mapInstance, initialPosition) => {
        try {
            const vehicleIcon = window.L.divIcon({
                className: 'vehicle-marker',
                html: createVehicleIcon(),
                iconSize: [60, 60],
                iconAnchor: [30, 30],
            });

            const vehicleMarker = window.L.marker(
                [initialPosition.lat, initialPosition.lng],
                { 
                    icon: vehicleIcon, 
                    zIndexOffset: 1000,
                    draggable: false
                }
            ).addTo(mapInstance).bindPopup(`
                <div style="font-weight: bold; min-width: 180px;">
                    <div style="color: #4F46E5; font-size: 14px; margin-bottom: 5px;">${deviceInfo.vehicleNo || 'Vehicle'}</div>
                    <div>Speed: ${speed.toFixed(0)} km/h</div>
                    <div>Battery: ${batteryVoltage}V</div>
                    <div>Signal: ${gsmSignal} RSSI</div>
                </div>
            `);

            leafletVehicleMarkerRef.current = vehicleMarker;

            const vehiclePath = window.L.polyline([], {
                color: '#4F46E5', 
                weight: 4,
                opacity: 0.7,
                lineJoin: 'round',
                lineCap: 'round'
            }).addTo(mapInstance);

            leafletPathRef.current = vehiclePath;

            startLiveTracking(mapInstance, vehicleMarker, vehiclePath);
            
            setStatus("Live");
        } catch (error) {
            console.error("Vehicle tracking initialization error:", error);
            setStatus("Error Initializing");
        }
    };

    const startLiveTracking = (mapInstance, vehicleMarker, vehiclePath) => {
        if (liveTrackingTimer.current) {
            clearInterval(liveTrackingTimer.current);
        }
        
        // Initial update
        updateVehicleFromAPI(mapInstance, vehicleMarker, vehiclePath);
        
        // Then set interval
        liveTrackingTimer.current = setInterval(() => {
            updateVehicleFromAPI(mapInstance, vehicleMarker, vehiclePath);
        }, 3000);

        mapInstance.liveTrackingInterval = liveTrackingTimer.current;
    };

    const stopLiveTracking = () => {
        if (liveTrackingTimer.current) {
            clearInterval(liveTrackingTimer.current);
            liveTrackingTimer.current = null;
        }
        
        if (pathAnimationTimer.current) {
            clearInterval(pathAnimationTimer.current);
            pathAnimationTimer.current = null;
        }
    };

    const hideLoader = () => {
        if (loaderRef.current) {
            loaderRef.current.style.opacity = "0";
            setTimeout(() => {
                if (loaderRef.current) {
                    loaderRef.current.classList.add("hidden");
                }
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
            
            // Store raw data for display
            setRawData(data.rawData || data);

            // Extract data from response structure
            const locationData = data.location || {};
            const rawDataFromAPI = data.rawData || data;
            const deviceDetails = data.deviceInfo || {};
            const vehicleType = data.VehicleType || 'Unknown';

            // Update device info
            setDeviceInfo(prev => ({
                ...prev,
                vehicleNo: deviceDetails.vehicleName || prev.vehicleNo || 'N/A',
                vehicleType: vehicleType
            }));

            // Parse values
            const lat = parseFloat(locationData.latitude || rawDataFromAPI.lat || 0);
            const lng = parseFloat(locationData.longitude || rawDataFromAPI.lng || 0);
            const speedValue = parseFloat(locationData.speed || rawDataFromAPI.speed || 0);
            const headingValue = parseFloat(locationData.heading || rawDataFromAPI.heading || rawDataFromAPI.headDegree || 0);
            
            // Get other metrics
            const satellitesValue = parseInt(rawDataFromAPI.satellites || 0);
            const batteryValue = rawDataFromAPI.batteryVoltage || "0";
            const gsmValue = rawDataFromAPI.gsmSignal || "0";
            const altitudeValue = parseFloat(rawDataFromAPI.altitude || 0);
            const deviceStatusValue = deviceDetails.status || rawDataFromAPI.packetStatus || "UNKNOWN";
            
            // Parse timestamp - try multiple possible fields
            let lastUpdateDate;
            if (rawDataFromAPI.timestamp) {
                lastUpdateDate = new Date(rawDataFromAPI.timestamp);
            } else if (rawDataFromAPI.lastUpdate) {
                lastUpdateDate = new Date(rawDataFromAPI.lastUpdate);
            } else if (data.timestamp?.lastUpdate) {
                lastUpdateDate = new Date(data.timestamp.lastUpdate);
            } else {
                lastUpdateDate = new Date();
            }

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
                    speed: speedValue,
                    heading: headingValue,
                    timestamp: Date.now(),
                };
            } else {
                setStatus("No GPS Fix");
                return null;
            }

        } catch (error) {
            console.error("API Fetch Error:", error);
            if (status !== "Unauthorized") {
                setStatus("Network Error");
            }
            return null;
        }
    }, [trackedDeviceNo, status]);

    const updateVehicleFromAPI = async (mapInstance, vehicleMarker, vehiclePath) => {
        if (isPlaybackMode) {
            return;
        }

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
            <div style="font-weight: bold; min-width: 180px;">
                <div style="color: #4F46E5; font-size: 14px; margin-bottom: 5px;">${deviceInfo.vehicleNo || 'Vehicle'}</div>
                <div>Speed: ${apiData.speed.toFixed(0)} km/h</div>
                <div>Battery: ${batteryVoltage}V</div>
                <div>Signal: ${gsmSignal} RSSI</div>
                <div style="margin-top: 5px; font-size: 11px; color: #6B7280;">Updated: ${new Date().toLocaleTimeString()}</div>
            </div>
        `);
        
        const newIcon = window.L.divIcon({
            className: 'vehicle-marker',
            html: createVehicleIcon(),
            iconSize: [60, 60],
            iconAnchor: [30, 30],
        });
        vehicleMarker.setIcon(newIcon);

        // Add to path
        pathCoordinates.current.push(newPosition);
        if (pathCoordinates.current.length > 200) {
            pathCoordinates.current.shift();
        }

        const latlngs = pathCoordinates.current.map(p => [p.lat, p.lng]);
        vehiclePath.setLatLngs(latlngs);

        // Smooth pan to new position
        mapInstance.panTo([newPosition.lat, newPosition.lng], {
            animate: true,
            duration: 1.0
        });

        setStatus("Live");
    };

    // --- Route Playback Functions ---

    const fetchRoutePlayback = async () => {
        if (!trackedDeviceNo || trackedDeviceNo === 'N/A') {
            alert("Device information is missing");
            return;
        }

        if (!playbackStartTime || !playbackEndTime) {
            alert("Please select both start and end times");
            return;
        }

        const start = new Date(playbackStartTime);
        const end = new Date(playbackEndTime);
        
        if (start >= end) {
            alert("Start time must be before end time");
            return;
        }

        const timeDiff = end - start;
        const maxDuration = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
        
        if (timeDiff > maxDuration) {
            alert("Maximum time range is 7 days");
            return;
        }

        const token = localStorage.getItem('token');
        if (!token) {
            alert("Authentication required");
            return;
        }

        setIsLoadingPlayback(true);

        try {
            const apiUrl = 'https://api.websave.in/api/manufactur/fetchSingleRoutePlayback';

            const requestData = {
                deviceNo: trackedDeviceNo,
                startTime: start.toISOString(),
                endTime: end.toISOString()
            };

            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(requestData),
            });

            if (!response.ok) {
                throw new Error(`API call failed with status: ${response.status}`);
            }

            const data = await response.json();

            if (data.success && data.route && data.route.length > 0) {
                setPlaybackRoute(data.route);
                setTotalPlaybackPoints(data.totalPoints || data.route.length);
                setCurrentPlaybackIndex(0);
                setPlaybackProgress(0);
                
                // Calculate statistics
                const stats = calculatePlaybackStats(data.route);
                setPlaybackStats(stats);

                visualizePlaybackRoute(data.route);

                setIsPlaybackMode(true);
                setStatus("Playback Mode");
            } else {
                setPlaybackRoute([]);
                setTotalPlaybackPoints(0);
                alert("No route data found for the selected time period");
            }
        } catch (error) {
            console.error("Route playback fetch error:", error);
            alert("Failed to fetch route playback data. Please check your connection.");
        } finally {
            setIsLoadingPlayback(false);
        }
    };

    const visualizePlaybackRoute = (route) => {
        if (!leafletMapRef.current || !route || route.length === 0) return;

        // Remove existing playback markers and path
        if (playbackMarkerRef.current) {
            leafletMapRef.current.removeLayer(playbackMarkerRef.current);
        }
        if (playbackPathRef.current) {
            leafletMapRef.current.removeLayer(playbackPathRef.current);
        }

        // Create path from route coordinates
        const pathCoords = route.map(point => [point.latitude, point.longitude]);
        
        // Add playback path to map
        const playbackPath = window.L.polyline(pathCoords, {
            color: '#DC2626',
            weight: 3,
            opacity: 0.6,
            lineJoin: 'round',
            dashArray: '5, 10'
        }).addTo(leafletMapRef.current);
        
        playbackPathRef.current = playbackPath;

        // Fit map to show the entire route
        const bounds = window.L.latLngBounds(pathCoords);
        leafletMapRef.current.fitBounds(bounds, { padding: [50, 50] });

        // Show first point as marker
        const firstPoint = route[0];
        const playbackIcon = window.L.divIcon({
            className: 'playback-marker',
            html: createVehicleIcon(firstPoint.speed, firstPoint.heading, true),
            iconSize: [60, 60],
            iconAnchor: [30, 30],
        });

        const playbackMarker = window.L.marker(
            [firstPoint.latitude, firstPoint.longitude],
            { 
                icon: playbackIcon, 
                zIndexOffset: 2000,
                draggable: false
            }
        ).addTo(leafletMapRef.current).bindPopup(`
            <div style="font-weight: bold; min-width: 220px;">
                <div style="color: #DC2626; font-size: 14px; margin-bottom: 5px;">📼 PLAYBACK MODE</div>
                <div style="border-bottom: 1px solid #E5E7EB; padding-bottom: 5px; margin-bottom: 5px;">
                    <strong>${deviceInfo.vehicleNo || 'Vehicle'}</strong><br/>
                    Speed: ${firstPoint.speed.toFixed(0)} km/h<br/>
                    Heading: ${firstPoint.heading.toFixed(1)}°
                </div>
                <div style="font-size: 12px; color: #6B7280;">
                    Time: ${new Date(firstPoint.timestamp).toLocaleString()}<br/>
                    Point: 1 of ${route.length}
                </div>
            </div>
        `);

        playbackMarkerRef.current = playbackMarker;
        
        // Stop live tracking when entering playback mode
        stopLiveTracking();
        
        // Update stats to first point
        setSpeed(firstPoint.speed);
        setHeading(firstPoint.heading);
        setVehiclePosition({ lat: firstPoint.latitude, lng: firstPoint.longitude });
    };

    const startPlayback = () => {
        if (!playbackRoute || playbackRoute.length === 0) {
            alert("No playback data loaded");
            return;
        }

        if (playbackTimer.current) {
            clearInterval(playbackTimer.current);
        }

        setIsPlaying(true);
        setPlaybackProgress(0);

        const startTimeStamp = Date.now();
        const totalDuration = (playbackRoute.length - 1) * (1000 / playbackSpeed);
        
        const playbackStep = () => {
            const elapsed = Date.now() - startTimeStamp;
            const progress = Math.min(elapsed / totalDuration, 1);
            
            const index = Math.floor(progress * (playbackRoute.length - 1));
            
            if (index >= playbackRoute.length) {
                stopPlayback();
                return;
            }

            setCurrentPlaybackIndex(index);
            setPlaybackProgress(progress * 100);

            const point = playbackRoute[index];
            
            // Update marker position
            if (playbackMarkerRef.current) {
                playbackMarkerRef.current.setLatLng([point.latitude, point.longitude]);
                
                // Update marker icon
                const newIcon = window.L.divIcon({
                    className: 'playback-marker',
                    html: createVehicleIcon(point.speed, point.heading, true),
                    iconSize: [60, 60],
                    iconAnchor: [30, 30],
                });
                playbackMarkerRef.current.setIcon(newIcon);
                
                // Update popup
                playbackMarkerRef.current.bindPopup(`
                    <div style="font-weight: bold; min-width: 220px;">
                        <div style="color: #DC2626; font-size: 14px; margin-bottom: 5px;">📼 PLAYBACK MODE</div>
                        <div style="border-bottom: 1px solid #E5E7EB; padding-bottom: 5px; margin-bottom: 5px;">
                            <strong>${deviceInfo.vehicleNo || 'Vehicle'}</strong><br/>
                            Speed: ${point.speed.toFixed(0)} km/h<br/>
                            Heading: ${point.heading.toFixed(1)}°
                        </div>
                        <div style="font-size: 12px; color: #6B7280;">
                            Time: ${new Date(point.timestamp).toLocaleString()}<br/>
                            Point: ${index + 1} of ${playbackRoute.length}
                        </div>
                    </div>
                `);
                
                playbackMarkerRef.current.openPopup();
            }

            // Smooth pan to current position
            leafletMapRef.current.panTo([point.latitude, point.longitude], {
                animate: true,
                duration: 0.5
            });

            // Update stats display
            setSpeed(point.speed);
            setHeading(point.heading);
            setVehiclePosition({ lat: point.latitude, lng: point.longitude });
        };

        playbackTimer.current = setInterval(playbackStep, 100);
    };

    const pausePlayback = () => {
        if (playbackTimer.current) {
            clearInterval(playbackTimer.current);
            playbackTimer.current = null;
        }
        setIsPlaying(false);
    };

    const stopPlayback = () => {
        if (playbackTimer.current) {
            clearInterval(playbackTimer.current);
            playbackTimer.current = null;
        }
        setIsPlaying(false);
        setCurrentPlaybackIndex(0);
        setPlaybackProgress(0);
        
        // Reset to first point
        if (playbackRoute.length > 0 && playbackMarkerRef.current) {
            const firstPoint = playbackRoute[0];
            playbackMarkerRef.current.setLatLng([firstPoint.latitude, firstPoint.longitude]);
            setSpeed(firstPoint.speed);
            setHeading(firstPoint.heading);
        }
    };

    const skipToPoint = (index) => {
        if (!playbackRoute || index < 0 || index >= playbackRoute.length) return;
        
        const point = playbackRoute[index];
        setCurrentPlaybackIndex(index);
        setPlaybackProgress((index / (playbackRoute.length - 1)) * 100);
        
        if (playbackMarkerRef.current) {
            playbackMarkerRef.current.setLatLng([point.latitude, point.longitude]);
            
            const newIcon = window.L.divIcon({
                className: 'playback-marker',
                html: createVehicleIcon(point.speed, point.heading, true),
                iconSize: [60, 60],
                iconAnchor: [30, 30],
            });
            playbackMarkerRef.current.setIcon(newIcon);
            
            leafletMapRef.current.panTo([point.latitude, point.longitude]);
        }
        
        setSpeed(point.speed);
        setHeading(point.heading);
        setVehiclePosition({ lat: point.latitude, lng: point.longitude });
    };

    const exitPlaybackMode = () => {
        // Stop any ongoing playback
        stopPlayback();
        
        // Remove playback elements from map
        if (playbackMarkerRef.current) {
            leafletMapRef.current.removeLayer(playbackMarkerRef.current);
            playbackMarkerRef.current = null;
        }
        if (playbackPathRef.current) {
            leafletMapRef.current.removeLayer(playbackPathRef.current);
            playbackPathRef.current = null;
        }
        
        // Clear playback route
        setPlaybackRoute([]);
        setCurrentPlaybackIndex(0);
        setPlaybackProgress(0);
        
        // Return to live tracking
        setStatus("Resuming Live...");
        
        // Restart live tracking
        if (leafletMapRef.current && leafletVehicleMarkerRef.current && leafletPathRef.current) {
            startLiveTracking(leafletMapRef.current, leafletVehicleMarkerRef.current, leafletPathRef.current);
        }
        
        // Reset to live vehicle position
        if (vehiclePosition && leafletMapRef.current) {
            leafletMapRef.current.setView([vehiclePosition.lat, vehiclePosition.lng], 16);
        }
        
        // Reset playback mode
        setIsPlaybackMode(false);
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

    const StatCard = ({ icon: Icon, label, value, unit, color = "indigo", subtitle, trend }) => (
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 transition-all duration-200 hover:shadow-md hover:border-slate-200">
            <div className="flex items-start justify-between mb-2">
                <div className={`p-2 rounded-lg ${color === "indigo" ? "bg-indigo-50 text-indigo-600" : 
                    color === "green" ? "bg-green-50 text-green-600" : 
                    color === "red" ? "bg-red-50 text-red-600" : 
                    "bg-blue-50 text-blue-600"}`}>
                    <Icon className="w-5 h-5" />
                </div>
                <span className="text-xs font-semibold text-slate-500">{label}</span>
            </div>
            <div className="flex items-end justify-between">
                <div>
                    <p className="text-2xl font-bold text-slate-900">{value}</p>
                    {unit && <span className="text-sm text-slate-500 ml-1">{unit}</span>}
                </div>
                {trend && (
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${trend > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
                    </span>
                )}
            </div>
            {subtitle && (
                <p className={`text-xs ${color === "indigo" ? "text-indigo-500" : 
                    color === "green" ? "text-green-500" : 
                    color === "red" ? "text-red-500" : 
                    "text-blue-500"} font-medium mt-2`}>
                    {subtitle}
                </p>
            )}
        </div>
    );

    const RawDataItem = ({ label, value, color = "slate" }) => (
        <div className="flex justify-between items-center py-2 border-b border-slate-100 last:border-b-0 hover:bg-slate-50 px-2 rounded">
            <span className="text-sm font-medium text-slate-600">{label}</span>
            <span className={`text-sm font-mono font-bold text-${color}-600 bg-slate-100 px-2 py-1 rounded`}> 
                {value}
            </span>
        </div>
    );
    
    const MapDataWidget = ({ speed, position, isPlayback = false, playbackInfo = null }) => (
        <div className="absolute top-4 right-4 bg-white/95 rounded-xl shadow-2xl p-4 z-10 border border-slate-200 backdrop-blur-sm w-80">
            <div className="flex justify-between items-center pb-3 mb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                    <div className={`p-2 rounded-lg ${isPlayback ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                        {isPlayback ? <History className="w-4 h-4" /> : <Car className="w-4 h-4" />}
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-800">{isPlayback ? "Playback Data" : "Live Data"}</h3>
                        <p className="text-xs text-slate-500">{deviceInfo.vehicleNo}</p>
                    </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${isPlayback ? "bg-red-100 text-red-700" : status === "Live" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                    {isPlayback ? "Playback" : status}
                </span>
            </div>
            
            {isPlayback && playbackInfo && (
                <div className="mb-3 bg-red-50 p-3 rounded-lg border border-red-200">
                    <div className="flex justify-between items-center text-sm">
                        <div>
                            <span className="text-red-700 font-medium">
                                Point {playbackInfo.currentIndex + 1} of {playbackInfo.totalPoints}
                            </span>
                            <div className="w-full bg-red-100 rounded-full h-1.5 mt-1">
                                <div 
                                    className="bg-red-600 h-1.5 rounded-full transition-all duration-300"
                                    style={{ width: `${(playbackInfo.currentIndex + 1) / playbackInfo.totalPoints * 100}%` }}
                                ></div>
                            </div>
                        </div>
                        <span className="text-red-600 text-xs">
                            {new Date(playbackInfo.timestamp).toLocaleTimeString()}
                        </span>
                    </div>
                </div>
            )}
            
            <div className="grid grid-cols-3 gap-3 text-center">
                <div className="border-r border-slate-100 pr-3">
                    <p className="text-xs font-medium text-slate-500 mb-1">Speed</p>
                    <p className="text-xl font-extrabold text-indigo-600">
                        {speed.toFixed(0)} <span className="text-sm font-semibold">km/h</span>
                    </p>
                </div>
                <div className="border-r border-slate-100 pr-3">
                    <p className="text-xs font-medium text-slate-500 mb-1">Latitude</p>
                    <p className="text-sm font-bold text-slate-800 font-mono">
                        {position ? position.lat.toFixed(6) : 'N/A'}
                    </p>
                </div>
                <div>
                    <p className="text-xs font-medium text-slate-500 mb-1">Longitude</p>
                    <p className="text-sm font-bold text-slate-800 font-mono">
                        {position ? position.lng.toFixed(6) : 'N/A'}
                    </p>
                </div>
            </div>
        </div>
    );

    const PlaybackControls = () => (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white/95 rounded-xl shadow-2xl p-4 z-10 border border-red-200 backdrop-blur-sm w-96">
            <div className="flex flex-col gap-3">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-red-100 rounded-lg">
                            <History className="w-5 h-5 text-red-600" />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg text-red-700">Route Playback</h3>
                            <p className="text-xs text-slate-500">Device: {trackedDeviceNo}</p>
                        </div>
                    </div>
                    <button
                        onClick={exitPlaybackMode}
                        className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold rounded-lg transition-colors flex items-center gap-1"
                    >
                        Exit <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
                
                {/* Progress Bar */}
                <div className="w-full">
                    <div className="flex justify-between text-xs text-slate-500 mb-1">
                        <span>Progress</span>
                        <span>{playbackProgress.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                        <div 
                            className="bg-gradient-to-r from-red-500 to-red-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${playbackProgress}%` }}
                        ></div>
                    </div>
                    <div className="flex justify-between text-xs text-slate-500 mt-1">
                        <span>Point {currentPlaybackIndex + 1} of {playbackRoute.length}</span>
                        {playbackRoute[currentPlaybackIndex] && (
                            <span>{new Date(playbackRoute[currentPlaybackIndex].timestamp).toLocaleTimeString()}</span>
                        )}
                    </div>
                </div>
                
                {/* Control Buttons */}
                <div className="flex justify-center items-center gap-2">
                    <button
                        onClick={() => skipToPoint(0)}
                        className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={currentPlaybackIndex === 0}
                        title="Go to start"
                    >
                        <SkipBack className="w-5 h-5" />
                    </button>
                    
                    <button
                        onClick={() => skipToPoint(Math.max(0, currentPlaybackIndex - 10))}
                        className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={currentPlaybackIndex === 0}
                        title="Skip back 10 points"
                    >
                        <RotateCcw className="w-5 h-5" />
                    </button>
                    
                    {isPlaying ? (
                        <button
                            onClick={pausePlayback}
                            className="p-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 rounded-full text-white shadow-lg transition-all"
                            title="Pause playback"
                        >
                            <Pause className="w-6 h-6" />
                        </button>
                    ) : (
                        <button
                            onClick={startPlayback}
                            className="p-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 rounded-full text-white shadow-lg transition-all"
                            title="Start playback"
                        >
                            <Play className="w-6 h-6" />
                        </button>
                    )}
                    
                    <button
                        onClick={() => skipToPoint(Math.min(playbackRoute.length - 1, currentPlaybackIndex + 10))}
                        className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={currentPlaybackIndex >= playbackRoute.length - 1}
                        title="Skip forward 10 points"
                    >
                        <RotateCcw className="w-5 h-5 transform rotate-180" />
                    </button>
                    
                    <button
                        onClick={() => skipToPoint(playbackRoute.length - 1)}
                        className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={currentPlaybackIndex >= playbackRoute.length - 1}
                        title="Go to end"
                    >
                        <SkipForward className="w-5 h-5" />
                    </button>
                </div>
                
                {/* Speed Controls */}
                <div className="flex justify-center gap-2">
                    {[0.5, 1, 2, 5].map(speedOption => (
                        <button
                            key={speedOption}
                            onClick={() => setPlaybackSpeed(speedOption)}
                            className={`px-3 py-1.5 text-sm font-semibold rounded-lg transition-colors ${playbackSpeed === speedOption ? 'bg-red-100 text-red-700 border border-red-300' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                        >
                            {speedOption}x
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );

    // --- Main Component Render ---

    return (
        <div className="flex h-screen bg-gradient-to-br from-slate-50 to-slate-100 overflow-hidden"> 
            {/* Sidebar */}
            <div className="w-96 bg-white shadow-2xl border-r border-slate-200 flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-indigo-500 to-indigo-600">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-lg">
                            <Navigation className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-extrabold text-white">Sentinel Track</h1>
                            <p className="text-sm text-indigo-100">Live Vehicle Monitoring</p>
                        </div>
                    </div>

                    {/* Vehicle Info Card */}
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                                <Car className="w-5 h-5 text-indigo-600" />
                            </div>
                            <div className="flex-1">
                                <h2 className="font-bold text-white text-lg">{deviceInfo.vehicleNo}</h2>
                                <p className="text-xs text-indigo-100">ID: {deviceInfo.deviceNo}</p>
                                {deviceInfo.vehicleType && deviceInfo.vehicleType !== 'Unknown' && (
                                    <div className="mt-1">
                                        <span className="text-xs bg-white/20 text-white px-2 py-0.5 rounded-full">
                                            {deviceInfo.vehicleType}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                        {deviceNosList.length > 1 && (
                            <div className="mt-3 text-xs bg-amber-500/20 text-amber-100 p-2 rounded-lg border border-amber-500/30">
                                ⚠️ Tracking the first device only (ID: {deviceInfo.deviceNo})
                            </div>
                        )}
                        {trackedDeviceNo === 'N/A' && (
                            <div className="mt-3 text-xs bg-red-500/20 text-red-100 p-2 rounded-lg border border-red-500/30">
                                ❌ No device ID received from navigation
                            </div>
                        )}
                    </div>
                </div>

                {/* Navigation Tabs */}
                <div className="flex border-b border-slate-200 bg-white">
                    <button
                        onClick={() => setActiveTab("tracking")}
                        className={`flex-1 py-3 text-sm font-semibold transition-all flex items-center justify-center gap-2 ${activeTab === "tracking"
                                ? "text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50"
                                : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                            }`}
                    >
                        <Activity className="w-4 h-4" />
                        Tracking
                    </button>
                    <button
                        onClick={() => setActiveTab("playback")}
                        className={`flex-1 py-3 text-sm font-semibold transition-all flex items-center justify-center gap-2 ${activeTab === "playback"
                                ? "text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50"
                                : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                            }`}
                    >
                        <History className="w-4 h-4" />
                        Playback
                    </button>
                    <button
                        onClick={() => setActiveTab("details")}
                        className={`flex-1 py-3 text-sm font-semibold transition-all flex items-center justify-center gap-2 ${activeTab === "details"
                                ? "text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50"
                                : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                            }`}
                    >
                        <Info className="w-4 h-4" />
                        Raw Data
                    </button>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto">
                    {activeTab === "tracking" ? (
                        <div className="p-6">
                            {/* Status Card */}
                            <div className="bg-white rounded-xl p-5 shadow-lg border border-slate-200 mb-6">
                                <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
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

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs text-slate-500 mb-1">Duration</p>
                                        <p className="font-bold text-slate-900 text-lg">{formatDuration(duration)}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 mb-1">Last Update</p>
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
                    ) : activeTab === "playback" ? (
                        <div className="p-6">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="p-2 bg-indigo-100 rounded-lg">
                                    <History className="w-5 h-5 text-indigo-600" />
                                </div>
                                <h3 className="font-bold text-lg text-slate-900">Route Playback</h3>
                            </div>

                            {/* Time Selection Card */}
                            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm mb-4">
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                                            <Calendar className="w-4 h-4" />
                                            Start Time
                                        </label>
                                        <input
                                            type="datetime-local"
                                            value={playbackStartTime}
                                            onChange={(e) => setPlaybackStartTime(e.target.value)}
                                            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50"
                                        />
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                                            <Calendar className="w-4 h-4" />
                                            End Time
                                        </label>
                                        <input
                                            type="datetime-local"
                                            value={playbackEndTime}
                                            onChange={(e) => setPlaybackEndTime(e.target.value)}
                                            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50"
                                        />
                                    </div>
                                    
                                    <button
                                        onClick={fetchRoutePlayback}
                                        disabled={isLoadingPlayback}
                                        className={`w-full py-3 px-4 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all ${isLoadingPlayback ? 'bg-indigo-400 cursor-not-allowed' : 'bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white shadow-md'}`}
                                    >
                                        {isLoadingPlayback ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                Loading...
                                            </>
                                        ) : (
                                            <>
                                                <History className="w-4 h-4" />
                                                Load Route Playback
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Playback Stats */}
                            {playbackRoute.length > 0 && (
                                <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm mb-4">
                                    <h4 className="font-bold text-slate-900 mb-4">Playback Statistics</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-slate-50 p-3 rounded-lg">
                                            <p className="text-xs text-slate-500">Total Distance</p>
                                            <p className="font-bold text-lg text-slate-900">{playbackStats.totalDistance} km</p>
                                        </div>
                                        <div className="bg-slate-50 p-3 rounded-lg">
                                            <p className="text-xs text-slate-500">Avg Speed</p>
                                            <p className="font-bold text-lg text-slate-900">{playbackStats.avgSpeed} km/h</p>
                                        </div>
                                        <div className="bg-slate-50 p-3 rounded-lg">
                                            <p className="text-xs text-slate-500">Max Speed</p>
                                            <p className="font-bold text-lg text-slate-900">{playbackStats.maxSpeed} km/h</p>
                                        </div>
                                        <div className="bg-slate-50 p-3 rounded-lg">
                                            <p className="text-xs text-slate-500">Duration</p>
                                            <p className="font-bold text-lg text-slate-900">{playbackStats.duration} hrs</p>
                                        </div>
                                    </div>
                                    
                                    {isPlaybackMode && (
                                        <div className="mt-4 pt-4 border-t border-slate-200">
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={exitPlaybackMode}
                                                    className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition-colors"
                                                >
                                                    Exit Playback
                                                </button>
                                                <button
                                                    onClick={isPlaying ? pausePlayback : startPlayback}
                                                    className={`flex-1 py-2.5 font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 ${isPlaying ? 'bg-yellow-500 hover:bg-yellow-600 text-white' : 'bg-green-500 hover:bg-green-600 text-white'}`}
                                                >
                                                    {isPlaying ? (
                                                        <>
                                                            <Pause className="w-4 h-4" /> Pause
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Play className="w-4 h-4" /> Start Playback
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="p-6">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="p-2 bg-indigo-100 rounded-lg">
                                    <Info className="w-5 h-5 text-indigo-600" />
                                </div>
                                <h3 className="font-bold text-lg text-slate-900">Raw Device Data</h3>
                            </div>

                            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
                                {rawData ? (
                                    <div className="space-y-1 max-h-[400px] overflow-y-auto pr-2">
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
                                        <p className="font-medium">No raw data available</p>
                                        <p className="text-sm mt-1">Data will appear when device is active</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-200 bg-slate-50">
                    <div className="text-center text-xs text-slate-500">
                        <p className="font-medium">Sentinel Track System</p>
                        <p className="mt-1">v2.0 · {new Date().getFullYear()}</p>
                    </div>
                </div>
            </div>

            {/* Map Area */}
            <div className="flex-1 relative">
                <div ref={mapRef} className="w-full h-full"></div>

                {/* TOP-RIGHT MAP DATA WIDGET */}
                {vehiclePosition && (
                    <MapDataWidget 
                        speed={speed} 
                        position={vehiclePosition} 
                        isPlayback={isPlaybackMode}
                        playbackInfo={isPlaybackMode && playbackRoute[currentPlaybackIndex] ? {
                            currentIndex: currentPlaybackIndex,
                            totalPoints: playbackRoute.length,
                            timestamp: playbackRoute[currentPlaybackIndex].timestamp
                        } : null}
                    />
                )}

                {/* PLAYBACK CONTROLS */}
                {isPlaybackMode && playbackRoute.length > 0 && (
                    <PlaybackControls />
                )}

                {/* Loader */}
                <div
                    ref={loaderRef}
                    className="absolute inset-0 flex flex-col items-center justify-center bg-white/95 z-30 transition-opacity duration-500"
                >
                    <div className="relative">
                        <div className="w-24 h-24 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                        <Navigation className="w-10 h-10 text-indigo-500 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                    </div>
                    <p className="mt-8 text-2xl font-bold text-slate-800">Initializing Live Tracker</p>
                    <p className="text-base text-slate-500 mt-3">Connecting to device: {trackedDeviceNo}</p>
                    <div className="mt-6 flex items-center gap-2">
                        <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></div>
                        <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse delay-150"></div>
                        <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse delay-300"></div>
                    </div>
                </div>

                {/* Geolocation Error */}
                <div
                    ref={geoErrorRef}
                    className="hidden absolute top-4 left-1/2 transform -translate-x-1/2 px-6 py-4 bg-white border-l-4 border-indigo-500 rounded-xl shadow-2xl z-40 transition-all duration-300 opacity-100 max-w-md"
                >
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <AlertCircle className="w-5 h-5 text-red-600" />
                        </div>
                        <div>
                            <p ref={geoErrorMessageRef} className="text-sm font-semibold text-slate-800"></p>
                            <p className="text-xs text-slate-500 mt-1">This may affect location accuracy</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Livetracking;