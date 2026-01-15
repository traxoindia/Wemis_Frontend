import React, { useState, useEffect, useCallback } from 'react';

const VehicleDataTable = () => {
    const [vehicleData, setVehicleData] = useState(null);
    const [rawData, setRawData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [lastUpdate, setLastUpdate] = useState(null);

    const STORAGE_KEY = 'vehicle_tracking_data';
    const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

    // Check if cached data is still valid
    const getCachedData = () => {
        const cached = localStorage.getItem(STORAGE_KEY);
        if (!cached) return null;

        try {
            const { data, timestamp } = JSON.parse(cached);
            const now = new Date().getTime();

            // Check if cache is still valid (less than 5 minutes old)
            if (now - timestamp < CACHE_DURATION) {
                return data;
            } else {
                // Cache expired, remove it
                localStorage.removeItem(STORAGE_KEY);
                return null;
            }
        } catch (e) {
            console.error('Error reading cache:', e);
            localStorage.removeItem(STORAGE_KEY);
            return null;
        }
    };

    // Save data to cache with timestamp
    const saveToCache = (data) => {
        const cacheData = {
            data: data,
            timestamp: new Date().getTime()
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(cacheData));
    };

    // Clear old cache data (older than 5 minutes)
    const clearOldCache = () => {
        const cached = localStorage.getItem(STORAGE_KEY);
        if (!cached) return;

        try {
            const { timestamp } = JSON.parse(cached);
            const now = new Date().getTime();

            if (now - timestamp >= CACHE_DURATION) {
                localStorage.removeItem(STORAGE_KEY);
                console.log('Cleared expired cache');
            }
        } catch (e) {
            localStorage.removeItem(STORAGE_KEY);
        }
       
    };

    // Set up cache cleanup interval
    useEffect(() => {
        clearOldCache(); // Initial cleanup
        const interval = setInterval(clearOldCache, 60000); // Check every minute
        return () => clearInterval(interval);
    }, []);

    const fetchVehicleData = useCallback(async (forceRefresh = false) => {
        const trackedDeviceNo = "862567077901184"; // Replace with your actual device number
        const token = localStorage.getItem('token');

        if (!trackedDeviceNo) return;

        // Try cache first if not forcing refresh
        if (!forceRefresh) {
            const cachedData = getCachedData();
            if (cachedData) {
                console.log("Loading from cache");
                setVehicleData(cachedData.vehicleData);
                setRawData(cachedData.rawData);
                setLastUpdate(new Date(cachedData.timestamp).toLocaleTimeString());
                setLoading(false);
                return;
            }
        }

        setLoading(true);

        try {
            const res = await fetch('https://api.websave.in/api/manufactur/liveTrackingSingleDevice', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ deviceNo: trackedDeviceNo }),
            });

            if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`);
            }

            const data = await res.json();
            console.log(data)
            console.log("first")
            const loc = data.location || data.rawData || {};
            const raw = data.rawData || data;

            console.log("API Response:", raw);

            setRawData(raw);
            const updateTime = new Date();
            setLastUpdate(updateTime.toLocaleTimeString());

            // Prepare vehicle data
            const vehicleDataObj = {
                // Device Information
                deviceId: raw.deviceId || 'N/A',
                imei: raw.imei || 'N/A',
                vehicleNo: raw.vehicleNo || 'N/A',
                firmware: raw.firmware || 'N/A',
                vendorId: raw.vendorId || 'N/A',

                // Location Data
                latitude: raw.lat || loc.latitude || 'N/A',
                latDir: raw.latDir || 'N/A',
                longitude: raw.lng || loc.longitude || 'N/A',
                lngDir: raw.lngDir || 'N/A',
                altitude: raw.altitude || 'N/A',

                // Movement Data
                speed: raw.speed || loc.speed || '0',
                heading: raw.headDegree || loc.heading || '0',
                date: raw.date || 'N/A',
                time: raw.time || 'N/A',
                timestamp: raw.timestamp || new Date().toISOString(),

                // GPS Information
                gpsFix: raw.gpsFix || '0',
                satellites: raw.satellites || '0',
                hdop: raw.hdop || 'N/A',
                pdop: raw.pdop || 'N/A',

                // Power Information
                batteryVoltage: raw.batteryVoltage || '0',
                mainsVoltage: raw.mainsVoltage || '0',
                mainsPowerStatus: raw.mainsPowerStatus || '0',

                // Network Information
                gsmSignal: raw.gsmSignal || '0',
                networkOperator: raw.networkOperator || 'N/A',
                mcc: raw.mcc || 'N/A',
                mnc: raw.mnc || 'N/A',
                lac: raw.lac || 'N/A',
                cellId: raw.cellId || 'N/A',

                // Status Information
                ignition: raw.ignition || '0',
                sosStatus: raw.sosStatus || '0',
                tamperAlert: raw.tamperAlert || 'N/A',
                alertId: raw.alertId || 'N/A',
                packetStatus: raw.packetStatus || 'N/A',
                packetType: raw.packetType || 'N/A',
                packetHeader: raw.packetHeader || 'N/A'
            };

            setVehicleData(vehicleDataObj);

            // Save to cache
            const cacheData = {
                vehicleData: vehicleDataObj,
                rawData: raw,
                timestamp: updateTime.getTime()
            };
            saveToCache(cacheData);

            setLoading(false);
            setError(null);

        } catch (e) {
            console.error("Error fetching vehicle data:", e);

            // Try cache on error
            const cachedData = getCachedData();
            if (cachedData) {
                console.log("Falling back to cached data");
                setVehicleData(cachedData.vehicleData);
                setRawData(cachedData.rawData);
                setLastUpdate(new Date(cachedData.timestamp).toLocaleTimeString());
                setError('Network error - showing cached data');
            } else {
                setError(e.message);
            }
            setLoading(false);
        }
    }, []);

    // Fetch data on component mount
    useEffect(() => {
        fetchVehicleData();

        // Set up refresh interval (every 30 seconds)
        const interval = setInterval(() => {
            fetchVehicleData();
        }, 30000);

        return () => clearInterval(interval);
    }, [fetchVehicleData]);

    // Helper function to format status values
    const formatStatus = (value, type) => {
        if (value === undefined || value === null || value === 'N/A') return 'N/A';

        switch (type) {
            case 'boolean':
                return value === '1' || value === 1 ? 'Yes' : 'No';
            case 'speed':
                return `${value} km/h`;
            case 'voltage':
                return `${value} V`;
            case 'signal':
                return `${value}%`;
            case 'coordinate':
                const num = parseFloat(value);
                return isNaN(num) ? 'N/A' : num.toFixed(6);
            default:
                return value;
        }
    };

    // Clear cache manually
    const clearCache = () => {
        localStorage.removeItem(STORAGE_KEY);
        fetchVehicleData(true); // Force refresh
    };

    // Get cache age
    const getCacheAge = () => {
        const cached = localStorage.getItem(STORAGE_KEY);
        if (!cached) return null;

        try {
            const { timestamp } = JSON.parse(cached);
            const age = new Date().getTime() - timestamp;
            const minutes = Math.floor(age / 60000);
            const seconds = Math.floor((age % 60000) / 1000);
            return { minutes, seconds };
        } catch (e) {
            return null;
        }
    };

    const cacheAge = getCacheAge();

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
                    <p className="text-gray-600">Loading vehicle data...</p>
                    {cacheAge && (
                        <p className="text-sm text-gray-500 mt-2">
                            Cache age: {cacheAge.minutes}m {cacheAge.seconds}s
                        </p>
                    )}
                </div>
            </div>
        );
    }

    if (error && !vehicleData) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-xl shadow-lg p-8 max-w-md text-center">
                    <div className="text-4xl mb-4">⚠️</div>
                    <h3 className="text-xl font-semibold text-red-600 mb-2">Error Loading Data</h3>
                    <p className="text-gray-600 mb-6">{error}</p>
                    <div className="space-y-3">
                        <button
                            onClick={() => fetchVehicleData(true)}
                            className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors"
                        >
                            Retry Fresh Data
                        </button>
                        <button
                            onClick={clearCache}
                            className="w-full bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
                        >
                            Clear Cache
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-800">Vehicle Tracking Data</h2>
                            <div className="flex items-center gap-4 mt-2">
                                <div className="text-sm">
                                    <span className="text-gray-500">Last Updated: </span>
                                    <span className="font-semibold text-green-600">{lastUpdate}</span>
                                </div>
                                {cacheAge && (
                                    <div className="text-sm">
                                        <span className="text-gray-500">Cache age: </span>
                                        <span className={`font-semibold ${cacheAge.minutes >= 5 ? 'text-red-600' : 'text-yellow-600'}`}>
                                            {cacheAge.minutes}m {cacheAge.seconds}s
                                        </span>
                                        <span className="text-xs text-gray-500 ml-1">(expires in {5 - cacheAge.minutes}m)</span>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => fetchVehicleData(true)}
                                className="flex items-center gap-2 bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                Refresh
                            </button>
                            <button
                                onClick={clearCache}
                                className="flex items-center gap-2 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                Clear Cache
                            </button>
                        </div>
                    </div>
                </div>

                {/* Summary Cards */}
                {vehicleData && (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                            {/* Location Card */}
                            <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
                                <div className="flex items-start gap-4">
                                    <div className="bg-blue-100 p-3 rounded-lg">
                                        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500 mb-1">Location</p>
                                        <p className="font-semibold text-gray-800">
                                            {formatStatus(vehicleData.latitude, 'coordinate')} {vehicleData.latDir}
                                        </p>
                                        <p className="font-semibold text-gray-800">
                                            {formatStatus(vehicleData.longitude, 'coordinate')} {vehicleData.lngDir}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Speed Card */}
                            <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
                                <div className="flex items-start gap-4">
                                    <div className="bg-green-100 p-3 rounded-lg">
                                        <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500 mb-1">Speed</p>
                                        <p className="text-2xl font-bold text-gray-800">
                                            {formatStatus(vehicleData.speed, 'speed')}
                                        </p>
                                        <p className="text-sm text-gray-600">Heading: {vehicleData.heading}°</p>
                                    </div>
                                </div>
                            </div>

                            {/* Battery Card */}
                            <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
                                <div className="flex items-start gap-4">
                                    <div className="bg-yellow-100 p-3 rounded-lg">
                                        <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500 mb-1">Battery</p>
                                        <p className="text-2xl font-bold text-gray-800">
                                            {formatStatus(vehicleData.batteryVoltage, 'voltage')}
                                        </p>
                                        <p className="text-sm text-gray-600">Mains: {formatStatus(vehicleData.mainsVoltage, 'voltage')}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Signal Card */}
                            <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
                                <div className="flex items-start gap-4">
                                    <div className="bg-purple-100 p-3 rounded-lg">
                                        <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500 mb-1">Signal</p>
                                        <div className="flex items-center gap-3">
                                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                                                <div
                                                    className="bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 h-2 rounded-full"
                                                    style={{ width: `${Math.min(parseInt(vehicleData.gsmSignal) || 0, 100)}%` }}
                                                ></div>
                                            </div>
                                            <span className="font-bold text-gray-800">
                                                {formatStatus(vehicleData.gsmSignal, 'signal')}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-600 mt-2">{vehicleData.networkOperator}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Data Table */}
                        <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-6">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-gradient-to-r from-blue-600 to-purple-600">
                                        <th colSpan="2" className="text-left p-4 text-white font-semibold">
                                            Device Information
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {[
                                        ['Vehicle Number', vehicleData.vehicleNo],
                                        ['Device ID', vehicleData.deviceId],
                                        ['IMEI', vehicleData.imei],
                                        ['Firmware', vehicleData.firmware],
                                        ['Vendor ID', vehicleData.vendorId]
                                    ].map(([label, value]) => (
                                        <tr key={label} className="border-b border-gray-100 hover:bg-gray-50">
                                            <td className="p-4 font-semibold text-gray-700 bg-gray-50 w-1/3">{label}</td>
                                            <td className="p-4 text-gray-800">{value}</td>
                                        </tr>
                                    ))}

                                    <tr>
                                        <th colSpan="2" className="bg-gradient-to-r from-green-600 to-teal-600 text-left p-4 text-white font-semibold">
                                            Location & Navigation
                                        </th>
                                    </tr>
                                    {[
                                        ['Latitude', `${formatStatus(vehicleData.latitude, 'coordinate')} ${vehicleData.latDir}`],
                                        ['Longitude', `${formatStatus(vehicleData.longitude, 'coordinate')} ${vehicleData.lngDir}`],
                                        ['Altitude', `${vehicleData.altitude} m`],
                                        ['Speed', formatStatus(vehicleData.speed, 'speed')],
                                        ['Heading', `${vehicleData.heading}°`],
                                        ['Date & Time', `${vehicleData.date} ${vehicleData.time}`]
                                    ].map(([label, value]) => (
                                        <tr key={label} className="border-b border-gray-100 hover:bg-gray-50">
                                            <td className="p-4 font-semibold text-gray-700 bg-gray-50 w-1/3">{label}</td>
                                            <td className="p-4 text-gray-800">{value}</td>
                                        </tr>
                                    ))}

                                    <tr>
                                        <th colSpan="2" className="bg-gradient-to-r from-indigo-600 to-blue-600 text-left p-4 text-white font-semibold">
                                            GPS Information
                                        </th>
                                    </tr>
                                    {[
                                        ['GPS Fix', vehicleData.gpsFix === '1' ? '✅ Active' : '❌ Inactive'],
                                        ['Satellites', vehicleData.satellites],
                                        ['HDOP', vehicleData.hdop],
                                        ['PDOP', vehicleData.pdop]
                                    ].map(([label, value]) => (
                                        <tr key={label} className="border-b border-gray-100 hover:bg-gray-50">
                                            <td className="p-4 font-semibold text-gray-700 bg-gray-50 w-1/3">{label}</td>
                                            <td className="p-4 text-gray-800">{value}</td>
                                        </tr>
                                    ))}

                                    <tr>
                                        <th colSpan="2" className="bg-gradient-to-r from-yellow-600 to-orange-600 text-left p-4 text-white font-semibold">
                                            Power Information
                                        </th>
                                    </tr>
                                    {[
                                        ['Battery Voltage', formatStatus(vehicleData.batteryVoltage, 'voltage')],
                                        ['Mains Voltage', formatStatus(vehicleData.mainsVoltage, 'voltage')],
                                        ['Mains Power', vehicleData.mainsPowerStatus === '1' ? '✅ Connected' : '❌ Disconnected']
                                    ].map(([label, value]) => (
                                        <tr key={label} className="border-b border-gray-100 hover:bg-gray-50">
                                            <td className="p-4 font-semibold text-gray-700 bg-gray-50 w-1/3">{label}</td>
                                            <td className="p-4 text-gray-800">{value}</td>
                                        </tr>
                                    ))}

                                    <tr>
                                        <th colSpan="2" className="bg-gradient-to-r from-purple-600 to-pink-600 text-left p-4 text-white font-semibold">
                                            Network Information
                                        </th>
                                    </tr>
                                    {[
                                        ['GSM Signal', formatStatus(vehicleData.gsmSignal, 'signal')],
                                        ['Network Operator', vehicleData.networkOperator],
                                        ['MCC/MNC', `${vehicleData.mcc}/${vehicleData.mnc}`],
                                        ['LAC/Cell ID', `${vehicleData.lac}/${vehicleData.cellId}`]
                                    ].map(([label, value]) => (
                                        <tr key={label} className="border-b border-gray-100 hover:bg-gray-50">
                                            <td className="p-4 font-semibold text-gray-700 bg-gray-50 w-1/3">{label}</td>
                                            <td className="p-4 text-gray-800">{value}</td>
                                        </tr>
                                    ))}

                                    <tr>
                                        <th colSpan="2" className="bg-gradient-to-r from-red-600 to-pink-600 text-left p-4 text-white font-semibold">
                                            Status & Alerts
                                        </th>
                                    </tr>
                                    {[
                                        ['Ignition', vehicleData.ignition === '1' ? '✅ On' : '❌ Off'],
                                        ['SOS Status', vehicleData.sosStatus === '1' ? '🚨 Active' : '✅ Normal'],
                                        ['Tamper Alert', vehicleData.tamperAlert === 'C' ? '✅ Closed' : '⚠️ Tampered'],
                                        ['Alert ID', vehicleData.alertId],
                                        ['Packet Status', vehicleData.packetStatus],
                                        ['Packet Type', vehicleData.packetType],
                                        ['Packet Header', vehicleData.packetHeader]
                                    ].map(([label, value]) => (
                                        <tr key={label} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                                            <td className="p-4 font-semibold text-gray-700 bg-gray-50 w-1/3">{label}</td>
                                            <td className="p-4 text-gray-800">{value}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Raw Data */}
                        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                            <details>
                                <summary className="cursor-pointer p-4 bg-gray-800 text-white font-semibold flex items-center justify-between hover:bg-gray-900">
                                    <span className="flex items-center gap-2">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                        View Raw JSON Data
                                    </span>
                                    <svg className="w-5 h-5 transform transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </summary>
                                <div className="p-4 bg-gray-900">
                                    <pre className="text-sm text-gray-300 overflow-x-auto max-h-96 bg-gray-800 p-4 rounded-lg">
                                        {JSON.stringify(rawData, null, 2)}
                                    </pre>
                                </div>
                            </details>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default VehicleDataTable;