import React, { useState, useEffect } from 'react';

const WalletStock = () => {
  const [walletData, setWalletData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_URL = 'https://api.websave.in/api/manufactur/fetchdistributorwalletValues';

  useEffect(() => {
    const fetchWalletValues = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error("Token not found");

        const response = await fetch(API_URL, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        const result = await response.json();
        if (result.success) {
          setWalletData(result.walletValues);
        } else {
          throw new Error(result.message || "Fetch failed");
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchWalletValues();
  }, []);

  if (loading) return <div className="p-5 text-gray-500 text-center">Loading...</div>;
  if (error) return <div className="p-5 text-red-500 text-center">Error: {error}</div>;

  return (
    <div className="p-4 w-full max-w-2xl mx-auto">
      {/* Container for the single line layout */}
      <div className="flex gap-4">
        
        {/* Balance Box */}
        <div className="flex-1 bg-white border border-gray-200 p-4 rounded-lg shadow-sm">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Balance</p>
          <p className="text-2xl font-bold text-gray-800">
            ₹{walletData?.balance ? Number(walletData.balance).toFixed(2) : '0.00'}
          </p>
        </div>

        {/* Stock Box */}
        <div className="flex-1 bg-white border border-gray-200 p-4 rounded-lg shadow-sm">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Stock</p>
          <p className="text-2xl font-bold text-gray-800">
            {walletData?.availableStock || 0} <span className="text-sm font-normal text-gray-400">Units</span>
          </p>
        </div>

      </div>
    </div>
  );
};

export default WalletStock;