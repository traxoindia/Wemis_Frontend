// Test.jsx or any component file
import React, { useState, useEffect } from 'react';

const Test = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 🔧 REPLACE THIS WITH YOUR REAL TOKEN
  const API_TOKEN =localStorage.getItem("token") || "your_api_token_here";

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

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
        setData(result);
      } catch (err) {
        setError(err.message);
        console.error("API call error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []); // Empty array means this runs once when component mounts

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-lg text-gray-600">Loading data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-lg shadow">
          <h2 className="font-bold text-lg mb-2">Error</h2>
          <p>{error}</p>
          <p className="text-sm mt-2 text-gray-600">
            💡 Tip: Make sure your token is valid and has permission for this endpoint.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-2">
        Customer Data (Without Live Vehicle)
      </h1>

      <div className="bg-gray-50 rounded-lg shadow p-4 overflow-auto">
        <pre className="text-sm text-gray-700 whitespace-pre-wrap">
          {JSON.stringify(data, null, 2)}
        </pre>
      </div>

      {/* Optional: If data is an array, you can map it nicely */}
      {Array.isArray(data) && data.length > 0 && (
        <div className="mt-6 grid gap-3">
          <h2 className="text-xl font-semibold">List View</h2>
          {data.slice(0, 5).map((item, idx) => (
            <div key={idx} className="bg-white p-3 rounded shadow border">
              <p className="text-gray-800">{JSON.stringify(item)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Test;