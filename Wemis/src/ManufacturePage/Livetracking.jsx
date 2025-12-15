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
    Move,
    Play,
    Pause,
    SkipBack,
    SkipForward,
    Calendar,
    History,
    RotateCcw
} from "lucide-react";
import { useLocation } from "react-router-dom";

// Logo import
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

// Helper function to format date to local datetime-local input format
const formatDateTimeForInput = (date) => {
    const d = new Date(date);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
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
    const [heading, setHeading] = useState(0);
    const [satellites, setSatellites] = useState(0);
    const [batteryVoltage, setBatteryVoltage] = useState("0");
    const [gsmSignal, setGsmSignal] = useState("0");
    const [altitude, setAltitude] = useState(0);
    const [deviceStatus, setDeviceStatus] = useState("Unknown");
    const [lastUpdateTime, setLastUpdateTime] = useState(null);
    const [rawData, setRawData] = useState(null);
    const [activeTab, setActiveTab] = useState("tracking");
    const [smoothPathData, setSmoothPathData] = useState([]);

    // Route Playback States
    const [isPlaybackMode, setIsPlaybackMode] = useState(false);
    const [playbackData, setPlaybackData] = useState(null);
    const [playbackRoute, setPlaybackRoute] = useState([]);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentPlaybackIndex, setCurrentPlaybackIndex] = useState(0);
    const [playbackSpeed, setPlaybackSpeed] = useState(1);
    const [playbackStartTime, setPlaybackStartTime] = useState("");
    const [playbackEndTime, setPlaybackEndTime] = useState("");
    const [isLoadingPlayback, setIsLoadingPlayback] = useState(false);
    const [totalPlaybackPoints, setTotalPlaybackPoints] = useState(0);
    const [playbackProgress, setPlaybackProgress] = useState(0);

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
    const liveTrackingTimer = useRef(null); // Store live tracking interval
    const lastKnownVehiclePosition = useRef(null);

    // --- Core Effects and Map Setup ---

    useEffect(() => {
        // Set default playback times (last 1 hour)
        const now = new Date();
        const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
        
        setPlaybackStartTime(formatDateTimeForInput(oneHourAgo));
        setPlaybackEndTime(formatDateTimeForInput(now));

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
            // Cleanup playback timer
            if (playbackTimer.current) {
                clearInterval(playbackTimer.current);
            }
            // Cleanup live tracking timer
            if (liveTrackingTimer.current) {
                clearInterval(liveTrackingTimer.current);
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
                    setVehiclePosition(userLocation);
                    initializeMap(userLocation);
                },
                (err) => {
                    handleGeoError("Location access denied. Using default map center.");
                    setVehiclePosition(defaultLocation);
                    initializeMap(defaultLocation);
                }
            );
        } else {
            setVehiclePosition(defaultLocation);
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

    // Creates the HTML structure for the vehicle icon
    const createVehicleIcon = (customSpeed = null, customHeading = null) => {
        const currentSpeed = customSpeed !== null ? customSpeed : speed;
        const currentHeading = customHeading !== null ? customHeading : heading;
        const isMoving = currentSpeed > 0.5;
        let statusColor = isMoving ? '#10B981' : '#F59E0B';
        
        return `
            <div style="position: relative; width: 60px; height: 60px;">
                <div style="position: absolute; top: -5px; left: 50%; transform: translateX(-50%); background: #1F2937; color: white; padding: 4px 8px; border-radius: 8px; font-size: 10px; font-weight: 700; box-shadow: 0 2px 8px rgba(0,0,0,0.3); white-space: nowrap; display: flex; align-items: center; gap: 4px;">
                    <div style="width: 6px; height: 6px; border-radius: 50%; background: ${statusColor};"></div>
                    ${currentSpeed.toFixed(0)} km/h
                </div>
                
                <div style="width: 40px; height: 40px; position: absolute; top: 10px; left: 10px; transform: rotate(${currentHeading}deg); filter: drop-shadow(0 3px 6px rgba(0,0,0,0.4));">
                    <img 
                        src="${vehicleLogo}" 
                        alt="Vehicle Logo" 
                        style="width: 100%; height: 100%; object-fit: contain;"
                    />
                </div>
            </div>
        `;
    };
    
    const createPlaybackIcon = (speed, heading) => {
        const isMoving = speed > 0.5;
        let statusColor = isMoving ? '#10B981' : '#F59E0B';
        
        return `
            <div style="position: relative; width: 60px; height: 60px;">
                <div style="position: absolute; top: -5px; left: 50%; transform: translateX(-50%); background: #DC2626; color: white; padding: 4px 8px; border-radius: 8px; font-size: 10px; font-weight: 700; box-shadow: 0 2px 8px rgba(0,0,0,0.3); white-space: nowrap; display: flex; align-items: center; gap: 4px;">
                    <div style="width: 6px; height: 6px; border-radius: 50%; background: ${statusColor};"></div>
                    ${speed.toFixed(0)} km/h
                </div>
                
                <div style="width: 40px; height: 40px; position: absolute; top: 10px; left: 10px; transform: rotate(${heading}deg); filter: drop-shadow(0 3px 6px rgba(0,0,0,0.4));">
                    <img 
                        src="${vehicleLogo}" 
                        alt="Vehicle Logo" 
                        style="width: 100%; height: 100%; object-fit: contain; opacity: 0.9;"
                    />
                </div>
                <div style="position: absolute; bottom: -5px; left: 50%; transform: translateX(-50%); background: #DC2626; color: white; padding: 2px 6px; border-radius: 4px; font-size: 8px; font-weight: 700; white-space: nowrap;">
                    PLAYBACK
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

        // Start live tracking
        startLiveTracking(mapInstance, vehicleMarker, vehiclePath);
        
        setStatus("Live");
    };

    // New function to start live tracking
    const startLiveTracking = (mapInstance, vehicleMarker, vehiclePath) => {
        // Clear any existing live tracking timer
        if (liveTrackingTimer.current) {
            clearInterval(liveTrackingTimer.current);
        }
        
        // Set the API polling interval
        liveTrackingTimer.current = setInterval(() => {
            updateVehicleFromAPI(mapInstance, vehicleMarker, vehiclePath);
        }, 3000);

        // Store the timer reference on map instance for cleanup
        mapInstance.liveTrackingInterval = liveTrackingTimer.current;
    };

    // New function to stop live tracking
    const stopLiveTracking = () => {
        if (liveTrackingTimer.current) {
            clearInterval(liveTrackingTimer.current);
            liveTrackingTimer.current = null;
        }
        
        // Also stop any smooth path animation
        if (pathAnimationTimer.current) {
            clearInterval(pathAnimationTimer.current);
            pathAnimationTimer.current = null;
        }
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
            const previousLocation = data.previousLocation || {};

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
                        lat: parseFloat(previousLocation.latitude || vehiclePosition?.lat || lat),
                        lng: parseFloat(previousLocation.longitude || vehiclePosition?.lng || lng)
                    },
                    speed: speed,
                    heading: headingValue,
                    timestamp: Date.now(),
                    smoothPath: parsedSmoothPath,
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

    const animateVehiclePath = (mapInstance, vehicleMarker, path, durationMs, initialPosition) => {
        if (!path || path.length < 1 || !initialPosition) return;
        
        const startPoint = { lat: initialPosition.lat, lng: initialPosition.lng }; 
        const fullPath = [startPoint, ...path].filter((point, index, self) => 
            !(index > 0 && point.lat === self[0].lat && point.lng === self[0].lng)
        );
        
        if (fullPath.length < 2) {
             const finalPosition = fullPath[0] || initialPosition;
             setVehiclePosition(finalPosition);
             vehicleMarker.setLatLng([finalPosition.lat, finalPosition.lng]);
             mapInstance.panTo([finalPosition.lat, finalPosition.lng], { animate: true, duration: 0.5 });
             return;
        }

        if (pathAnimationTimer.current) {
            clearInterval(pathAnimationTimer.current);
        }

        const interval = durationMs / (fullPath.length - 1); 
        let stepIndex = 0;
        
        let lastPosition = initialPosition;

        vehicleMarker.setLatLng([initialPosition.lat, initialPosition.lng]);
        
        const animationStep = () => {
            if (stepIndex >= fullPath.length - 1) {
                clearInterval(pathAnimationTimer.current);
                const finalPosition = fullPath[fullPath.length - 1];
                setVehiclePosition(finalPosition);
                return;
            }

            const newPosition = fullPath[stepIndex + 1]; 
            
            let currentHeading = heading;
            
            if (lastPosition.lat !== newPosition.lat || lastPosition.lng !== newPosition.lng) {
                 currentHeading = calculateHeading(lastPosition, newPosition);
            }

            vehicleMarker.setLatLng([newPosition.lat, newPosition.lng]); 
            setVehiclePosition(newPosition);

            setHeading(currentHeading);
            const newIcon = window.L.divIcon({
                className: 'vehicle-marker',
                html: createVehicleIcon(), 
                iconSize: [60, 60],
                iconAnchor: [30, 30],
            });
            vehicleMarker.setIcon(newIcon);

            mapInstance.panTo([newPosition.lat, newPosition.lng], {
                animate: true,
                duration: interval / 1000 
            });

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
        // Don't update if we're in playback mode
        if (isPlaybackMode) {
            return;
        }

        const apiData = await fetchVehicleDataFromAPI(device);

        if (!apiData) {
            if (pathAnimationTimer.current) {
                clearInterval(pathAnimationTimer.current);
            }
            return;
        }

        setSpeed(apiData.speed);
        setStatus("Live");

        const smoothPath = apiData.smoothPath;
        setSmoothPathData(smoothPath);
        
        let animationStartPos;
        if (lastKnownVehiclePosition.current) {
            animationStartPos = lastKnownVehiclePosition.current; 
        } else {
            animationStartPos = apiData.previousPosition;
        }
        
        lastKnownVehiclePosition.current = apiData.position;

        if (smoothPath.length > 0) {
            animateVehiclePath(mapInstance, vehicleMarker, smoothPath, 3000, animationStartPos);
        } else {
             if (pathAnimationTimer.current) {
                clearInterval(pathAnimationTimer.current);
            }

            const newPosition = apiData.position;
            let finalHeading = apiData.heading;
            
            if (apiData.speed > 0.5 && finalHeading === 0 && vehiclePosition) {
                 finalHeading = calculateHeading(vehiclePosition, newPosition);
            } else if (apiData.speed <= 0.5) {
                finalHeading = heading;
            }

            setVehiclePosition(newPosition);
            setHeading(finalHeading);
            
            vehicleMarker.setLatLng([newPosition.lat, newPosition.lng]);
            const newIcon = window.L.divIcon({
                className: 'vehicle-marker',
                html: createVehicleIcon(),
                iconSize: [60, 60],
                iconAnchor: [30, 30],
            });
            vehicleMarker.setIcon(newIcon);

            mapInstance.panTo([newPosition.lat, newPosition.lng], {
                animate: true,
                duration: 1.0
            });

             pathCoordinates.current.push(newPosition);
             if (pathCoordinates.current.length > 200) {
                 pathCoordinates.current.shift();
             }
             const latlngs = pathCoordinates.current.map(p => [p.lat, p.lng]);
             vehiclePath.setLatLngs(latlngs);
        }
    };

    // --- Route Playback Functions ---

    const fetchRoutePlayback = async () => {
        if (!device || !device.deviceNo) {
            alert("Device information is missing");
            return;
        }

        if (!playbackStartTime || !playbackEndTime) {
            alert("Please select both start and end times");
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
                deviceNo: device.deviceNo,
                startTime: new Date(playbackStartTime).toISOString(),
                endTime: new Date(playbackEndTime).toISOString()
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
                setPlaybackData(data);
                setPlaybackRoute(data.route);
                setTotalPlaybackPoints(data.totalPoints || data.route.length);
                setCurrentPlaybackIndex(0);
                
                // Visualize the entire route on the map
                visualizePlaybackRoute(data.route);
                
                alert(`Route playback loaded successfully! Found ${data.route.length} points.`);
            } else {
                alert("No route data found for the selected time period");
            }
        } catch (error) {
            console.error("Route playback fetch error:", error);
            alert("Failed to fetch route playback data");
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
        const pathCoordinates = route.map(point => [point.latitude, point.longitude]);
        
        // Add playback path to map (different color than live tracking)
        const playbackPath = window.L.polyline(pathCoordinates, {
            color: '#DC2626',
            weight: 3,
            opacity: 0.6,
            lineJoin: 'round',
            dashArray: '5, 10'
        }).addTo(leafletMapRef.current);
        
        playbackPathRef.current = playbackPath;

        // Fit map to show the entire route
        const bounds = window.L.latLngBounds(pathCoordinates);
        leafletMapRef.current.fitBounds(bounds, { padding: [50, 50] });

        // Show first point as marker
        const firstPoint = route[0];
        const playbackIcon = window.L.divIcon({
            className: 'playback-marker',
            html: createPlaybackIcon(firstPoint.speed, firstPoint.heading),
            iconSize: [60, 60],
            iconAnchor: [30, 30],
        });

        const playbackMarker = window.L.marker(
            [firstPoint.latitude, firstPoint.longitude],
            { icon: playbackIcon, zIndexOffset: 2000 }
        ).addTo(leafletMapRef.current).bindPopup(`
            <div style="font-weight: bold;">
                <span style="color: #DC2626;">PLAYBACK MODE</span><br/>
                ${device?.vehicleNo || 'Vehicle'} - ${firstPoint.speed.toFixed(0)} km/h<br/>
                Time: ${new Date(firstPoint.timestamp).toLocaleString()}<br/>
                Heading: ${firstPoint.heading.toFixed(1)}°
            </div>
        `);

        playbackMarkerRef.current = playbackMarker;
        
        // Stop live tracking when entering playback mode
        stopLiveTracking();
        
        // Enter playback mode
        setIsPlaybackMode(true);
        setStatus("Playback Mode");
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

        const startTime = Date.now();
        const totalDuration = (playbackRoute.length - 1) * (1000 / playbackSpeed); // Based on speed multiplier
        
        const playbackStep = () => {
            const elapsed = Date.now() - startTime;
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
                
                // Update marker icon with current speed and heading
                const newIcon = window.L.divIcon({
                    className: 'playback-marker',
                    html: createPlaybackIcon(point.speed, point.heading),
                    iconSize: [60, 60],
                    iconAnchor: [30, 30],
                });
                playbackMarkerRef.current.setIcon(newIcon);
                
                // Update popup
                playbackMarkerRef.current.bindPopup(`
                    <div style="font-weight: bold;">
                        <span style="color: #DC2626;">PLAYBACK MODE</span><br/>
                        ${device?.vehicleNo || 'Vehicle'} - ${point.speed.toFixed(0)} km/h<br/>
                        Time: ${new Date(point.timestamp).toLocaleString()}<br/>
                        Heading: ${point.heading.toFixed(1)}°<br/>
                        Point: ${index + 1} of ${playbackRoute.length}
                    </div>
                `);
                
                playbackMarkerRef.current.openPopup();
            }

            // Pan map to current position
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
                html: createPlaybackIcon(point.speed, point.heading),
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
        
        // Reset states
        setIsPlaybackMode(false);
        setPlaybackData(null);
        setPlaybackRoute([]);
        setCurrentPlaybackIndex(0);
        setPlaybackProgress(0);
        
        // Return to live tracking
        setStatus("Resuming Live...");
        
        // Restart live tracking
        if (leafletMapRef.current && leafletVehicleMarkerRef.current && leafletPathRef.current) {
            startLiveTracking(leafletMapRef.current, leafletVehicleMarkerRef.current, leafletPathRef.current);
        }
        
        // Reset map view to current vehicle position or default
        if (vehiclePosition && leafletMapRef.current) {
            leafletMapRef.current.setView([vehiclePosition.lat, vehiclePosition.lng], 16);
        } else {
            // Fetch current position from API immediately
            fetchVehicleDataFromAPI(device).then(apiData => {
                if (apiData && apiData.position) {
                    setVehiclePosition(apiData.position);
                    leafletMapRef.current.setView([apiData.position.lat, apiData.position.lng], 16);
                }
            });
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
    
    const MapDataWidget = ({ speed, position, isPlayback = false, playbackInfo = null }) => (
        <div className="absolute top-4 right-4 bg-white/90 rounded-xl shadow-2xl p-4 z-10 border border-slate-200 backdrop-blur-sm w-80">
            <div className="flex justify-between items-center pb-2 mb-2 border-b border-slate-100">
                <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                    <Car className="w-5 h-5 text-indigo-500" />
                    {isPlayback ? "Playback Data" : "Live Data"}
                </h3>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${isPlayback ? "bg-red-100 text-red-700" : status === "Live" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                    {isPlayback ? "Playback" : status}
                </span>
            </div>
            
            {isPlayback && playbackInfo && (
                <div className="mb-3 bg-red-50 p-2 rounded-lg border border-red-200">
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-red-700 font-medium">
                            Point: {playbackInfo.currentIndex + 1} of {playbackInfo.totalPoints}
                        </span>
                        <span className="text-red-600">
                            {new Date(playbackInfo.timestamp).toLocaleTimeString()}
                        </span>
                    </div>
                </div>
            )}
            
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

    const PlaybackControls = () => (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white/95 rounded-xl shadow-2xl p-4 z-10 border border-red-200 backdrop-blur-sm w-96">
            <div className="flex flex-col gap-3">
                <div className="flex justify-between items-center">
                    <h3 className="font-bold text-lg text-red-700 flex items-center gap-2">
                        <History className="w-5 h-5" />
                        Route Playback
                    </h3>
                    <button
                        onClick={exitPlaybackMode}
                        className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold rounded-lg transition-colors"
                    >
                        Exit
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
                            className="bg-red-600 h-2 rounded-full transition-all duration-300"
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
                        className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-700"
                        disabled={currentPlaybackIndex === 0}
                    >
                        <SkipBack className="w-5 h-5" />
                    </button>
                    
                    <button
                        onClick={() => skipToPoint(Math.max(0, currentPlaybackIndex - 10))}
                        className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-700"
                        disabled={currentPlaybackIndex === 0}
                    >
                        <RotateCcw className="w-5 h-5" />
                    </button>
                    
                    {isPlaying ? (
                        <button
                            onClick={pausePlayback}
                            className="p-3 bg-red-600 hover:bg-red-700 rounded-full text-white"
                        >
                            <Pause className="w-6 h-6" />
                        </button>
                    ) : (
                        <button
                            onClick={startPlayback}
                            className="p-3 bg-red-600 hover:bg-red-700 rounded-full text-white"
                        >
                            <Play className="w-6 h-6" />
                        </button>
                    )}
                    
                    <button
                        onClick={() => skipToPoint(Math.min(playbackRoute.length - 1, currentPlaybackIndex + 10))}
                        className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-700"
                        disabled={currentPlaybackIndex >= playbackRoute.length - 1}
                    >
                        <RotateCcw className="w-5 h-5 transform rotate-180" />
                    </button>
                    
                    <button
                        onClick={() => skipToPoint(playbackRoute.length - 1)}
                        className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-700"
                        disabled={currentPlaybackIndex >= playbackRoute.length - 1}
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
                            className={`px-3 py-1 text-sm font-semibold rounded-lg ${playbackSpeed === speedOption ? 'bg-red-100 text-red-700 border border-red-300' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
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
                        onClick={() => setActiveTab("playback")}
                        className={`flex-1 py-3 text-sm font-semibold transition-all ${activeTab === "playback"
                                ? "text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50"
                                : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                            }`}
                    >
                        <History className="w-4 h-4 inline mr-2" />
                        Playback
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
                    ) : activeTab === "playback" ? (
                        <div className="p-6">
                            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                                <History className="w-5 h-5 text-indigo-500" />
                                Route Playback
                            </h3>

                            <div className="bg-white rounded-lg p-4 border border-slate-200 shadow-sm mb-4">
                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">
                                            Start Time
                                        </label>
                                        <input
                                            type="datetime-local"
                                            value={playbackStartTime}
                                            onChange={(e) => setPlaybackStartTime(e.target.value)}
                                            className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                        />
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">
                                            End Time
                                        </label>
                                        <input
                                            type="datetime-local"
                                            value={playbackEndTime}
                                            onChange={(e) => setPlaybackEndTime(e.target.value)}
                                            className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                        />
                                    </div>
                                    
                                    <button
                                        onClick={fetchRoutePlayback}
                                        disabled={isLoadingPlayback}
                                        className={`w-full py-2 px-4 rounded-lg font-semibold flex items-center justify-center gap-2 ${isLoadingPlayback ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                                    >
                                        {isLoadingPlayback ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
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

                            {playbackData && (
                                <div className="bg-white rounded-lg p-4 border border-slate-200 shadow-sm">
                                    <h4 className="font-bold text-slate-900 mb-3">Playback Information</h4>
                                    <div className="space-y-2">
                                        <div className="flex justify-between">
                                            <span className="text-sm text-slate-600">Total Points:</span>
                                            <span className="text-sm font-bold text-slate-900">{totalPlaybackPoints}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-sm text-slate-600">Time Range:</span>
                                            <span className="text-sm text-slate-900">
                                                {new Date(playbackStartTime).toLocaleString()} - {new Date(playbackEndTime).toLocaleString()}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-sm text-slate-600">Device:</span>
                                            <span className="text-sm font-bold text-slate-900">{playbackData.deviceNo}</span>
                                        </div>
                                    </div>
                                    
                                    {isPlaybackMode && (
                                        <div className="mt-4 pt-4 border-t border-slate-200">
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={exitPlaybackMode}
                                                    className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition-colors"
                                                >
                                                    Exit Playback
                                                </button>
                                                <button
                                                    onClick={isPlaying ? pausePlayback : startPlayback}
                                                    className={`flex-1 py-2 font-semibold rounded-lg transition-colors ${isPlaying ? 'bg-yellow-500 hover:bg-yellow-600 text-white' : 'bg-green-500 hover:bg-green-600 text-white'}`}
                                                >
                                                    {isPlaying ? 'Pause' : 'Start Playback'}
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
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
                    className="absolute inset-0 flex flex-col items-center justify-center bg-white bg-opacity-80 z-30 transition-opacity duration-500"
                >
                    <div className="relative">
                        <div className="w-20 h-20 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                        <Navigation className="w-8 h-8 text-indigo-500 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                    </div>
                    <p className="mt-6 text-xl font-bold text-slate-700">Connecting to GPS...</p>
                    <p className="text-sm text-slate-500 mt-2">Initializing live tracker</p>
                </div>

                {/* Geolocation Error */}
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