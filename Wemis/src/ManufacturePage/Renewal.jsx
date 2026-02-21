import React, { useState, useEffect } from "react";
import {
  Wallet,
  Package,
  Calendar,
  Tag,
  Info,
  Loader2,
  AlertCircle,
  Building2,
  ArrowRight
} from "lucide-react";
import ManufactureNavbar from "./ManufactureNavbar";

function Renewal() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRenewalData = async () => {
      try {
        setLoading(true);
        // Replace with your actual token retrieval logic
        const token = localStorage.getItem("token") || "YOUR_TOKEN_HERE";

        const response = await fetch(
          "https://api.websave.in/api/manufactur/fetchManufacturRenewalWalletPackage",
          {
            method: "GET",
            headers: {
              "Authorization": `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          throw new Error(`Error: ${response.status} - ${response.statusText}`);
        }

        const result = await response.json();
        console.log(result)
        
        if (result.success) {
          setData(result);
        } else {
          throw new Error(result.message || "Failed to fetch data");
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchRenewalData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
        <p className="mt-4 text-gray-600 font-medium">Fetching Renewal Packages...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-red-100 text-center max-w-md">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-900">Request Failed</h2>
          <p className="text-gray-500 mt-2">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-6 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <ManufactureNavbar />

      <div className="min-h-screen bg-gray-50/50 p-4 md:p-8">
        <div className="max-w-full mx-auto space-y-6">
          
          {/* Top Info Cards */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-white border rounded-xl p-5 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-blue-50 rounded-lg">
                <Building2 className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Manufacturer</p>
                <h2 className="text-lg font-bold text-gray-800">{data?.manufacturerName}</h2>
              </div>
            </div>
            <div className="bg-white border rounded-xl p-5 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-purple-50 rounded-lg">
                <Info className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">WLP Name</p>
                <h2 className="text-sm font-medium text-gray-700">{data?.wlpName}</h2>
              </div>
            </div>
          </div>

          {/* Renewal Packages Table Section */}
          <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
            <div className="p-6 border-b flex justify-between items-center bg-white">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-gray-600" />
                <h3 className="text-xl font-bold text-gray-800">Renewal Packages</h3>
              </div>
              <span className="bg-green-100 text-green-700 text-xs px-3 py-1 rounded-full font-medium">
                {data?.renewalPackages?.length} Available
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-gray-600 text-sm uppercase">
                    <th className="px-6 py-4 font-semibold">Package Name</th>
                    <th className="px-6 py-4 font-semibold">Element</th>
                    <th className="px-6 py-4 font-semibold">Type</th>
                    <th className="px-6 py-4 font-semibold">Billing Cycle</th>
                    <th className="px-6 py-4 font-semibold text-right">Price (INR)</th>
                    <th className="px-6 py-4 font-semibold text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data?.renewalPackages?.map((pkg) => (
                    <tr key={pkg._id} className="hover:bg-gray-50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-gray-900">{pkg.packageName}</div>
                        <div className="text-xs text-gray-500">{pkg.description}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-blue-50 text-blue-700">
                          {pkg.elementName}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {pkg.packageType}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center text-sm text-gray-700">
                          <Calendar className="h-3.5 w-3.5 mr-1.5 text-gray-400" />
                          {pkg.billingCycle} Months
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="font-bold text-gray-900">₹{pkg.totalPrice}</div>
                        {pkg.price > 0 && (
                          <div className="text-xs text-gray-400 line-through">₹{pkg.price}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button className="inline-flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors">
                          Select <ArrowRight className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {data?.renewalPackages?.length === 0 && (
              <div className="p-12 text-center text-gray-500">
                No renewal packages found for this manufacturer.
              </div>
            )}
          </div>

          {/* Footer Footer */}
          <div className="flex justify-between items-center text-xs text-gray-400 pt-4">
            <p>System Status: Online</p>
            <p>© {new Date().getFullYear()} Renewal Management Portal</p>
          </div>
        </div>
      </div>
    </>
  );
}

export default Renewal;