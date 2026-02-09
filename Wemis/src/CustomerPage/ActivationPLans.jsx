import React from "react";
import Navbar from "./Navbar";

function ActivationPlans() {
  // Dummy data (replace with API later)
  const walletBalance = 17700;

  const activePlans = [
    {
      id: 1,
      planName: "Basic GPS Plan",
      devices: 3,
      amount: 5900,
      status: "Active",
      expiry: "31-12-2026",
    },
    {
      id: 2,
      planName: "Premium Tracking Plan",
      devices: 5,
      amount: 11800,
      status: "Active",
      expiry: "15-01-2027",
    },
  ];

  return (
    <>
        <Navbar/>
  
    <div className="min-h-screen bg-white text-black p-6">
      <div className="max-w-7xl mx-auto">

        {/* PAGE TITLE */}
        <h1 className="text-2xl font-semibold mb-6 border-b pb-2">
          Activation Plans
        </h1>

        {/* WALLET BALANCE */}
        <div className="bg-black text-white rounded-lg p-6 mb-8 shadow">
          <p className="text-sm uppercase tracking-wide text-gray-300">
            Wallet Balance
          </p>
          <h2 className="text-3xl font-bold mt-2">
            ₹ {walletBalance.toLocaleString()}
          </h2>
        </div>

        {/* ACTIVE PLANS TABLE */}
        <div className="overflow-x-auto border rounded-lg shadow-sm">
          <table className="min-w-full border-collapse">
            <thead className="bg-black text-white">
              <tr>
                <th className="px-4 py-3 text-left text-sm">Plan Name</th>
                <th className="px-4 py-3 text-left text-sm">Devices</th>
                <th className="px-4 py-3 text-left text-sm">Amount (₹)</th>
                <th className="px-4 py-3 text-left text-sm">Expiry Date</th>
                <th className="px-4 py-3 text-left text-sm">Status</th>
              </tr>
            </thead>
            <tbody>
              {activePlans.length > 0 ? (
                activePlans.map((plan) => (
                  <tr
                    key={plan.id}
                    className="border-b hover:bg-gray-100 transition"
                  >
                    <td className="px-4 py-3 text-sm">{plan.planName}</td>
                    <td className="px-4 py-3 text-sm">{plan.devices}</td>
                    <td className="px-4 py-3 text-sm">
                      {plan.amount.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-sm">{plan.expiry}</td>
                    <td className="px-4 py-3 text-sm font-medium text-green-600">
                      {plan.status}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="5"
                    className="px-4 py-6 text-center text-gray-500"
                  >
                    No active plans found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      </div>
    </div>
      </>
  );
}

export default ActivationPlans;
