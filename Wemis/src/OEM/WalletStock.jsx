import React, { useState, useEffect } from 'react';

const WalletStock = () => {
  const [walletData, setWalletData] = useState({ balance: 0, availableStock: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_URL = 'https://api.websave.in/api/manufactur/fetchOEMwalletValues';

  useEffect(() => {
    const controller = new AbortController();
    
    const fetchWalletValues = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error("Authentication token missing. Please log in.");

        const response = await fetch(API_URL, {
          method: 'GET',
          signal: controller.signal, // Clean up fetch on unmount
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
           throw new Error(`Server responded with ${response.status}`);
        }

        const result = await response.json();
        
        if (result.success) {
          setWalletData(result.walletValues);
        } else {
          throw new Error(result.message || "Failed to retrieve wallet data.");
        }
      } catch (err) {
        if (err.name !== 'AbortError') {
          setError(err.message);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchWalletValues();
    return () => controller.abort(); // Cleanup function
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 mx-auto max-w-2xl bg-red-50 border border-red-200 text-red-700 rounded-lg">
        <p className="font-medium">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="p-4 w-full max-w-2xl mx-auto">
      <div className="flex gap-4">
        {/* Balance Box */}
        <div className="flex-1 bg-white border border-gray-200 p-5 rounded-xl shadow-sm hover:shadow-md transition-shadow">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Balance</p>
          <p className="text-3xl font-extrabold text-gray-900 mt-1">
            ₹{Number(walletData.balance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </p>
        </div>

        {/* Stock Box */}
        <div className="flex-1 bg-white border border-gray-200 p-5 rounded-xl shadow-sm hover:shadow-md transition-shadow">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Available Stock</p>
          <p className="text-3xl font-extrabold text-gray-900 mt-1">
            {walletData.availableStock || 0} 
            <span className="text-sm font-medium text-gray-400 ml-2">Units</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default WalletStock;