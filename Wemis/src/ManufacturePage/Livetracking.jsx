import React, { useEffect, useRef, useState } from "react";
import { Navigation, Zap, Route, MapPin, Clock, TrendingUp, Radio, Map as MapIcon } from "lucide-react";
import { useLocation } from "react-router-dom";

const Livetracking = () => {
    //recive the data when it passed through the devicereport page 
    const location = useLocation();
    const { device } = location.state || {};





    const mapRef = useRef(null);
    const [map, setMap] = useState(null);
    const [mapType, setMapType] = useState("google"); // google, osm, mapbox
    const [vehiclePosition, setVehiclePosition] = useState(null);
    const [currentLocation, setCurrentLocation] = useState(null);
    const [status, setStatus] = useState("Initializing");
    const [speed, setSpeed] = useState(0);
    const [distance, setDistance] = useState(0);
    const [duration, setDuration] = useState(0);
    const loaderRef = useRef(null);
    const geoErrorRef = useRef(null);
    const geoErrorMessageRef = useRef(null);
    const pathCoordinates = useRef([]);
    const vehicleMarkerRef = useRef(null);
    const currentLocationMarkerRef = useRef(null);
    const startTime = useRef(Date.now());
    const watchIdRef = useRef(null);
    const leafletMapRef = useRef(null);
    const leafletVehicleMarkerRef = useRef(null);
    const leafletCurrentMarkerRef = useRef(null);
    const leafletPathRef = useRef(null);

    useEffect(() => {
        if (mapType === "google") {
            loadGoogleMaps();
        } else {
            loadLeafletMap();
        }

        const timer = setInterval(() => {
            setDuration(Math.floor((Date.now() - startTime.current) / 1000));
        }, 1000);

        return () => {
            clearInterval(timer);
            if (watchIdRef.current) {
                navigator.geolocation.clearWatch(watchIdRef.current);
            }
        };
    }, [mapType]);

    const formatDuration = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const loadGoogleMaps = () => {
        const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
        if (existingScript) {
            initGoogleMap();
            return;
        }

        const script = document.createElement("script");
        script.src =
            "https://maps.googleapis.com/maps/api/js?key=AIzaSyD7RlJ9MCSVGnEp67jyqG6NIml94cz5a7g&libraries=geometry,marker";
        script.async = true;
        script.defer = true;
        script.onload = () => initGoogleMap();
        document.body.appendChild(script);
    };

    const loadLeafletMap = () => {
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
    };

    const initGoogleMap = () => {
        if (!window.google) return;

        const mapOptions = {
            disableDefaultUI: true,
            zoomControl: true,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: true,
            tilt: 0,
            styles: [
                { elementType: "geometry", stylers: [{ color: "#f5f5f5" }] },
                { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
                { elementType: "labels.text.fill", stylers: [{ color: "#616161" }] },
                { elementType: "labels.text.stroke", stylers: [{ color: "#f5f5f5" }] },
                { featureType: "poi", stylers: [{ visibility: "off" }] },
                { featureType: "road", elementType: "geometry", stylers: [{ color: "#ffffff" }] },
                { featureType: "road.arterial", elementType: "labels.text.fill", stylers: [{ color: "#757575" }] },
                { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#dadada" }] },
                { featureType: "transit", stylers: [{ visibility: "off" }] },
                { featureType: "water", elementType: "geometry", stylers: [{ color: "#c9e6ff" }] },
            ],
        };

        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const userLocation = {
                        lat: pos.coords.latitude,
                        lng: pos.coords.longitude,
                    };

                    setCurrentLocation(userLocation);
                    setVehiclePosition(userLocation);

                    const mapInstance = new window.google.maps.Map(mapRef.current, {
                        center: userLocation,
                        zoom: 16,
                        mapId: "4504f8b37365c3d0",
                        ...mapOptions,
                    });
                    setMap(mapInstance);

                    const currentMarker = new window.google.maps.Marker({
                        position: userLocation,
                        map: mapInstance,
                        icon: {
                            path: window.google.maps.SymbolPath.CIRCLE,
                            scale: 8,
                            fillColor: "#3B82F6",
                            fillOpacity: 1,
                            strokeColor: "#FFFFFF",
                            strokeWeight: 3,
                        },
                        zIndex: 1,
                        title: "Your Current Location"
                    });
                    currentLocationMarkerRef.current = currentMarker;

                    watchIdRef.current = navigator.geolocation.watchPosition(
                        (position) => {
                            const newLocation = {
                                lat: position.coords.latitude,
                                lng: position.coords.longitude,
                            };
                            setCurrentLocation(newLocation);
                            currentMarker.setPosition(newLocation);
                        },
                        (error) => console.error("Watch position error:", error),
                        { enableHighAccuracy: true, maximumAge: 5000 }
                    );

                    initializeGoogleVehicleTracking(mapInstance, userLocation);
                    hideLoader();
                },
                (err) => {
                    handleGeoError(`Location access denied. Using demo mode.`);
                    const defaultLocation = { lat: 20.2961, lng: 85.8245 };
                    setVehiclePosition(defaultLocation);
                    const mapInstance = new window.google.maps.Map(mapRef.current, {
                        center: defaultLocation,
                        zoom: 16,
                        mapId: "4504f8b37365c3d0",
                        ...mapOptions,
                    });
                    setMap(mapInstance);
                    initializeGoogleVehicleTracking(mapInstance, defaultLocation);
                    hideLoader();
                }
            );
        }
    };

    const initLeafletMap = () => {
        if (!window.L) return;

        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const userLocation = {
                        lat: pos.coords.latitude,
                        lng: pos.coords.longitude,
                    };

                    setCurrentLocation(userLocation);
                    setVehiclePosition(userLocation);

                    const mapInstance = window.L.map(mapRef.current).setView(
                        [userLocation.lat, userLocation.lng],
                        16
                    );

                    // Choose tile layer based on mapType
                    if (mapType === "osm") {
                        window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
                            attribution: '© OpenStreetMap contributors',
                            maxZoom: 19,
                        }).addTo(mapInstance);
                    } else if (mapType === "mapbox") {
                        // Using CartoDB for better compatibility
                        window.L.tileLayer(
                            "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
                            {
                                attribution: '© OpenStreetMap contributors © CARTO',
                                maxZoom: 19,
                                subdomains: 'abcd',
                            }
                        ).addTo(mapInstance);
                    }

                    leafletMapRef.current = mapInstance;

                    // Current location marker
                    const currentIcon = window.L.divIcon({
                        className: 'current-location-marker',
                        html: `<div style="width: 20px; height: 20px; background: #3B82F6; border: 3px solid white; border-radius: 50%; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"></div>`,
                        iconSize: [20, 20],
                        iconAnchor: [10, 10],
                    });

                    const currentMarker = window.L.marker([userLocation.lat, userLocation.lng], {
                        icon: currentIcon,
                        zIndexOffset: 1,
                    }).addTo(mapInstance);
                    leafletCurrentMarkerRef.current = currentMarker;

                    watchIdRef.current = navigator.geolocation.watchPosition(
                        (position) => {
                            const newLocation = {
                                lat: position.coords.latitude,
                                lng: position.coords.longitude,
                            };
                            setCurrentLocation(newLocation);
                            currentMarker.setLatLng([newLocation.lat, newLocation.lng]);
                        },
                        (error) => console.error("Watch position error:", error),
                        { enableHighAccuracy: true, maximumAge: 5000 }
                    );

                    initializeLeafletVehicleTracking(mapInstance, userLocation);
                    hideLoader();
                },
                (err) => {
                    handleGeoError(`Location access denied. Using demo mode.`);
                    const defaultLocation = { lat: 20.2961, lng: 85.8245 };
                    setVehiclePosition(defaultLocation);

                    const mapInstance = window.L.map(mapRef.current).setView(
                        [defaultLocation.lat, defaultLocation.lng],
                        16
                    );

                    if (mapType === "osm") {
                        window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
                            attribution: '© OpenStreetMap contributors',
                            maxZoom: 19,
                        }).addTo(mapInstance);
                    } else if (mapType === "mapbox") {
                        // Using CartoDB for better compatibility  
                        window.L.tileLayer(
                            "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
                            {
                                attribution: '© OpenStreetMap contributors © CARTO',
                                maxZoom: 19,
                                subdomains: 'abcd',
                            }
                        ).addTo(mapInstance);
                    }

                    leafletMapRef.current = mapInstance;
                    initializeLeafletVehicleTracking(mapInstance, defaultLocation);
                    hideLoader();
                }
            );
        }
    };

    const createVehicleIcon = () => {
        return `
      <div style="position: relative; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center;">
        <svg width="40" height="40" viewBox="0 0 64 64" style="filter: drop-shadow(0 3px 6px rgba(0,0,0,0.3));">
          <path d="M32 8 L24 16 L20 32 L20 48 L24 52 L40 52 L44 48 L44 32 L40 16 Z" 
                fill="#EF4444" stroke="#B91C1C" stroke-width="1.5"/>
          <path d="M32 12 L26 18 L22 28 L32 28 Z" 
                fill="#60A5FA" opacity="0.7" stroke="#3B82F6" stroke-width="0.5"/>
          <path d="M32 12 L38 18 L42 28 L32 28 Z" 
                fill="#60A5FA" opacity="0.7" stroke="#3B82F6" stroke-width="0.5"/>
          <rect x="28" y="30" width="8" height="12" fill="#DC2626" rx="1"/>
          <circle cx="28" cy="16" r="2" fill="#FCD34D"/>
          <circle cx="36" cy="16" r="2" fill="#FCD34D"/>
          <circle cx="20" cy="28" r="2.5" fill="#DC2626" stroke="#B91C1C" stroke-width="1"/>
          <circle cx="44" cy="28" r="2.5" fill="#DC2626" stroke="#B91C1C" stroke-width="1"/>
          <circle cx="24" cy="20" r="4" fill="#1F2937" stroke="#000" stroke-width="1"/>
          <circle cx="40" cy="20" r="4" fill="#1F2937" stroke="#000" stroke-width="1"/>
          <circle cx="24" cy="44" r="4" fill="#1F2937" stroke="#000" stroke-width="1"/>
          <circle cx="40" cy="44" r="4" fill="#1F2937" stroke="#000" stroke-width="1"/>
          <circle cx="24" cy="20" r="1.5" fill="#6B7280"/>
          <circle cx="40" cy="20" r="1.5" fill="#6B7280"/>
          <circle cx="24" cy="44" r="1.5" fill="#6B7280"/>
          <circle cx="40" cy="44" r="1.5" fill="#6B7280"/>
          <rect x="28" y="44" width="8" height="6" fill="#B91C1C" rx="1"/>
          <rect x="26" y="49" width="3" height="2" fill="#DC2626" rx="0.5"/>
          <rect x="35" y="49" width="3" height="2" fill="#DC2626" rx="0.5"/>
        </svg>
        <div style="position: absolute; top: -24px; background: linear-gradient(135deg, #0F172A 0%, #1E293B 100%); color: white; padding: 4px 10px; border-radius: 12px; font-size: 11px; font-weight: 700; box-shadow: 0 3px 10px rgba(0, 0, 0, 0.3); white-space: nowrap; border: 1px solid rgba(239, 68, 68, 0.4);">
          <span style="color: #10B981;">⚡</span> ${speed.toFixed(0)} km/h
        </div>
      </div>
    `;
    };

    const initializeGoogleVehicleTracking = (mapInstance, initialPosition) => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(createVehicleIcon(), "text/html");
        const vehicle3DElement = doc.body.firstChild;

        const vehicleMarker = new window.google.maps.marker.AdvancedMarkerElement({
            position: initialPosition,
            map: mapInstance,
            content: vehicle3DElement,
            title: "Tracking Vehicle",
            zIndex: 1000,
        });

        vehicleMarkerRef.current = { marker: vehicleMarker, element: vehicle3DElement };

        const vehiclePath = new window.google.maps.Polyline({
            path: pathCoordinates.current,
            geodesic: true,
            strokeColor: "#EF4444",
            strokeOpacity: 1,
            strokeWeight: 4,
            map: mapInstance,
            zIndex: 10,
        });

        setInterval(() => {
            updateVehicleFromAPI(mapInstance, vehicleMarker, vehiclePath, vehicle3DElement, 'google');
        }, 2000);

        setStatus("Live");
    };

    const initializeLeafletVehicleTracking = (mapInstance, initialPosition) => {
        const vehicleIcon = window.L.divIcon({
            className: 'vehicle-marker',
            html: createVehicleIcon(),
            iconSize: [44, 44],
            iconAnchor: [22, 22],
        });

        const vehicleMarker = window.L.marker(
            [initialPosition.lat, initialPosition.lng],
            { icon: vehicleIcon, zIndexOffset: 1000 }
        ).addTo(mapInstance);

        leafletVehicleMarkerRef.current = vehicleMarker;

        const vehiclePath = window.L.polyline([], {
            color: '#EF4444',
            weight: 4,
            opacity: 1,
        }).addTo(mapInstance);

        leafletPathRef.current = vehiclePath;

        setInterval(() => {
            updateVehicleFromAPI(mapInstance, vehicleMarker, vehiclePath, null, 'leaflet');
        }, 2000);

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
            setTimeout(() => {
                geoErrorRef.current.style.opacity = "0";
                setTimeout(() => geoErrorRef.current.classList.add("hidden"), 300);
            }, 4000);
        }
    };

    const updateVehicleFromAPI = (mapInstance, vehicleMarker, vehiclePath, vehicleElement, type) => {
        const apiData = fetchVehicleDataFromAPI();

        if (!apiData) return;

        const prevPosition = vehiclePosition;
        const newPosition = apiData.position;

        if (prevPosition) {
            let distanceMeters;

            if (type === 'google' && window.google) {
                distanceMeters = window.google.maps.geometry.spherical.computeDistanceBetween(
                    new window.google.maps.LatLng(prevPosition.lat, prevPosition.lng),
                    new window.google.maps.LatLng(newPosition.lat, newPosition.lng)
                );
            } else if (type === 'leaflet' && window.L) {
                const from = window.L.latLng(prevPosition.lat, prevPosition.lng);
                const to = window.L.latLng(newPosition.lat, newPosition.lng);
                distanceMeters = from.distanceTo(to);
            }

            setDistance(prev => prev + (distanceMeters / 1000));

            const heading = calculateHeading(prevPosition, newPosition);

            if (type === 'google' && vehicleElement) {
                vehicleElement.style.transform = `rotate(${heading}deg)`;
            } else if (type === 'leaflet') {
                const newIcon = window.L.divIcon({
                    className: 'vehicle-marker',
                    html: createVehicleIcon(),
                    iconSize: [44, 44],
                    iconAnchor: [22, 22],
                });
                vehicleMarker.setIcon(newIcon);
                vehicleMarker._icon.style.transform += ` rotate(${heading}deg)`;
            }
        }

        setSpeed(apiData.speed);
        setVehiclePosition(newPosition);

        if (type === 'google') {
            vehicleMarker.position = newPosition;
        } else if (type === 'leaflet') {
            vehicleMarker.setLatLng([newPosition.lat, newPosition.lng]);
        }

        pathCoordinates.current.push(newPosition);
        if (pathCoordinates.current.length > 120) {
            pathCoordinates.current.shift();
        }

        if (type === 'google') {
            vehiclePath.setPath(pathCoordinates.current);
            mapInstance.panTo(newPosition);
        } else if (type === 'leaflet') {
            const latlngs = pathCoordinates.current.map(p => [p.lat, p.lng]);
            vehiclePath.setLatLngs(latlngs);
            mapInstance.panTo([newPosition.lat, newPosition.lng]);
        }
    };

    const calculateHeading = (from, to) => {
        const dLng = (to.lng - from.lng) * Math.PI / 180;
        const lat1 = from.lat * Math.PI / 180;
        const lat2 = to.lat * Math.PI / 180;

        const y = Math.sin(dLng) * Math.cos(lat2);
        const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);

        return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
    };

    const fetchVehicleDataFromAPI = () => {
        if (!vehiclePosition) return null;

        const angle = Math.random() * Math.PI * 2;
        const radius = 0.0005;
        const deltaLat = Math.cos(angle) * radius;
        const deltaLng = Math.sin(angle) * radius;

        return {
            position: {
                lat: vehiclePosition.lat + deltaLat,
                lng: vehiclePosition.lng + deltaLng,
            },
            speed: Math.min(Math.random() * 70 + 10, 80),
            timestamp: Date.now(),
        };
    };

    const switchMap = (type) => {
        if (mapRef.current) {
            mapRef.current.innerHTML = '';
        }
        pathCoordinates.current = [];
        setMapType(type);
        setStatus("Switching...");
    };

    return (
        <div className="flex flex-col h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
            {/* Modern Header */}
            <header className="bg-white shadow-md border-b border-slate-200 backdrop-blur-lg bg-opacity-95">
                <div className="px-5 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-11 h-11 bg-gradient-to-br from-red-500 via-red-600 to-rose-600 rounded-xl flex items-center justify-center shadow-lg">
                            <Navigation className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Live Tracker</h1>
                            <p className="text-xs text-slate-500 flex items-center gap-1">
                                <Radio className="w-3 h-3" />
                                {mapType === "google" ? "Google Maps" : mapType === "osm" ? "OpenStreetMap" : "Mapbox"}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg">
                            <button
                                onClick={() => switchMap("google")}
                                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${mapType === "google"
                                    ? "bg-white text-red-600 shadow-sm"
                                    : "text-slate-600 hover:text-slate-900"
                                    }`}
                            >
                                Google
                            </button>
                            <button
                                onClick={() => switchMap("osm")}
                                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${mapType === "osm"
                                    ? "bg-white text-red-600 shadow-sm"
                                    : "text-slate-600 hover:text-slate-900"
                                    }`}
                            >
                                OSM
                            </button>
                            <button
                                onClick={() => switchMap("mapbox")}
                                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${mapType === "mapbox"
                                    ? "bg-white text-red-600 shadow-sm"
                                    : "text-slate-600 hover:text-slate-900"
                                    }`}
                            >
                                Mapbox
                            </button>
                        </div>

                        <div className="flex items-center gap-2 bg-gradient-to-r from-green-50 to-emerald-50 px-4 py-2 rounded-full border border-green-300 shadow-sm">
                            <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse shadow-lg shadow-green-500/50"></div>
                            <span className="text-sm font-bold text-green-700">{status}</span>
                        </div>
                    </div>
                </div>
            </header>

            {/* Enhanced Stats Grid */}
            <div className="bg-white shadow-md border-b border-slate-200 px-5 py-4">
                <div className="grid grid-cols-4 gap-4">
                    <div className="relative overflow-hidden bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-4 shadow-lg">
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-8 h-8 bg-white bg-opacity-20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                                    <Zap className="w-4 h-4 text-white" />
                                </div>
                                <span className="text-xs font-semibold text-blue-100">Speed</span>
                            </div>
                            <p className="text-3xl font-bold text-white">{speed.toFixed(0)}</p>
                            <p className="text-xs text-blue-100 mt-1">km/h</p>
                        </div>
                        <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-white opacity-10 rounded-full"></div>
                    </div>

                    <div className="relative overflow-hidden bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-4 shadow-lg">
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-8 h-8 bg-white bg-opacity-20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                                    <Route className="w-4 h-4 text-white" />
                                </div>
                                <span className="text-xs font-semibold text-purple-100">Distance</span>
                            </div>
                            <h2>Live Tracking for Device: {device?.deviceNo}</h2>
                            <p className="text-3xl font-bold text-white">{distance.toFixed(2)}</p>
                            <p className="text-xs text-purple-100 mt-1">km</p>
                        </div>
                        <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-white opacity-10 rounded-full"></div>
                    </div>

                    <div className="relative overflow-hidden bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl p-4 shadow-lg">
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-8 h-8 bg-white bg-opacity-20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                                    <Clock className="w-4 h-4 text-white" />
                                </div>
                                <span className="text-xs font-semibold text-amber-100">Duration</span>
                            </div>
                            <p className="text-3xl font-bold text-white">{formatDuration(duration)}</p>
                            <p className="text-xs text-amber-100 mt-1">min:sec</p>
                        </div>
                        <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-white opacity-10 rounded-full"></div>
                    </div>

                    <div className="relative overflow-hidden bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-4 shadow-lg">
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-8 h-8 bg-white bg-opacity-20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                                    <TrendingUp className="w-4 h-4 text-white" />
                                </div>
                                <span className="text-xs font-semibold text-emerald-100">Avg Speed</span>
                            </div>
                            <p className="text-3xl font-bold text-white">
                                {duration > 0 ? ((distance / (duration / 3600))).toFixed(0) : '0'}
                            </p>
                            <p className="text-xs text-emerald-100 mt-1">km/h</p>
                        </div>
                        <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-white opacity-10 rounded-full"></div>
                    </div>
                </div>
            </div>

            {/* Map Container */}
            <main className="flex-grow relative">
                {/* Loader */}
                <div
                    ref={loaderRef}
                    className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 z-30 transition-opacity duration-500"
                >
                    <div className="relative">
                        <div className="w-20 h-20 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                        <Navigation className="w-8 h-8 text-red-500 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                    </div>
                    <p className="mt-6 text-xl font-bold text-white">Connecting to GPS...</p>
                    <p className="text-sm text-slate-400 mt-2">Initializing live tracker</p>
                </div>

                {/* Geolocation Error */}
                <div
                    ref={geoErrorRef}
                    className="hidden absolute top-4 left-1/2 transform -translate-x-1/2 px-5 py-3 bg-gradient-to-r from-amber-50 to-orange-50 border-l-4 border-amber-500 rounded-lg shadow-2xl z-40 transition-all duration-300 opacity-100"
                >
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">⚠️</span>
                        <p ref={geoErrorMessageRef} className="text-sm font-semibold text-amber-900"></p>
                    </div>
                </div>

                {/* Current Location Badge */}
                {currentLocation && (
                    <div className="absolute top-4 left-4 bg-white rounded-xl shadow-xl px-4 py-3 z-10 border border-blue-200">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                                <MapPin className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 font-semibold">Your Location</p>
                                <p className="text-xs font-mono font-bold text-slate-700">
                                    {currentLocation.lat.toFixed(5)}, {currentLocation.lng.toFixed(5)}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Vehicle Position Badge */}
                {vehiclePosition && (
                    <div className="absolute bottom-4 left-4 bg-white rounded-xl shadow-xl px-4 py-3 z-10 border border-red-200">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center">
                                <Navigation className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 font-semibold">Vehicle Position</p>
                                <p className="text-xs font-mono font-bold text-slate-700">
                                    {vehiclePosition.lat.toFixed(5)}, {vehiclePosition.lng.toFixed(5)}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Map */}
                <div id="map" ref={mapRef} className="w-full h-full"></div>
            </main>
        </div>
    );
};

export default Livetracking;