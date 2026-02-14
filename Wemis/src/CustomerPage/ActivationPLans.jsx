import React, { useState, useEffect } from "react";
import Navbar from "./Navbar";

function ActivationPlans() {
  const [activePlans, setActivePlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchWalletData = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        setError("Authentication token not found. Please log in.");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(
          "https://api.websave.in/api/manufactur/fetchCoustmerActivationWallet",
          {
            method: "GET",
            headers: {
              "Authorization": `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        const data = await response.json();
   

        if (data.success) {
          // Setting the 'package' array from response to our state
          setActivePlans(data.package || []);
        } else {
          throw new Error("Failed to fetch data from server");
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchWalletData();
  }, []);

  return (
    <>
      <Navbar />

      <div className="min-h-screen bg-white text-black p-6">
        <div className="max-w-7xl mx-auto">
          {/* PAGE TITLE */}
          <h1 className="text-2xl font-semibold mb-6 border-b pb-2">
            All Packages
          </h1>

          {/* ERROR HANDLING */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700">
              <p>{error}</p>
            </div>
          )}

          {/* LOADING STATE */}
          {loading ? (
            <div className="text-center py-10">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-black mx-auto"></div>
              <p className="mt-4 text-gray-500">Loading plans...</p>
            </div>
          ) : (
            /* ACTIVE PLANS TABLE */
            <div className="overflow-x-auto border rounded-lg shadow-sm">
              <table className="min-w-full border-collapse">
                <thead className="bg-black text-white">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm uppercase">Package Name</th>
                    <th className="px-4 py-3 text-left text-sm uppercase">Type</th>
                    <th className="px-4 py-3 text-left text-sm uppercase">Billing Cycle</th>
                    <th className="px-4 py-3 text-left text-sm uppercase">Price (₹)</th>
                   
                  </tr>
                </thead>
                <tbody>
                  {activePlans.length > 0 ? (
                    activePlans.map((item) => {
                      // Calculate Price: delerMarginPrice + price
                      const displayPrice = (item.delerMarginPrice || 0) + (item.price || 0);
                      
                      return (
                        <tr key={item._id} className="border-b hover:bg-gray-50 transition">
                          <td className="px-4 py-4">
                            <div className="font-medium">{item.packageName}</div>
                            <div className="text-xs text-gray-500">{item.description}</div>
                          </td>
                          <td className="px-4 py-4 text-sm">{item.packageType}</td>
                          <td className="px-4 py-4 text-sm">{item.billingCycle}</td>
                          <td className="px-4 py-4 text-sm font-semibold">
                            ₹ {displayPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                         
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="5" className="px-4 py-10 text-center text-gray-500">
                        No packages available at the moment.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default ActivationPlans;