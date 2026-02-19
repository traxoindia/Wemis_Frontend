import React from "react";
import {
  Wallet,
  CreditCard,
  RefreshCw,
  TrendingUp,
  Shield,
  Bell,
  ChevronRight,
  BarChart3,
  Clock,
  CheckCircle,
  Settings,
  Download,
} from "lucide-react";
import ManufactureNavbar from "./ManufactureNavbar";

function Renewal() {
  const walletData = {
    balance: "24,850.75",
    currency: "INR",
    monthlyGrowth: "+12.5%",
    cards: [
      { id: 1, last4: "4589", expiry: "12/25", name: "Personal Card" },
      { id: 2, last4: "2234", expiry: "08/26", name: "Business Card" },
    ],
    recentTransactions: [
      { id: 1, name: "Netflix", date: "Today", amount: "-15.99" },
      { id: 2, name: "Freelance Payment", date: "2 days ago", amount: "+1,200.00" },
    ],
    upcomingRenewals: [
      { id: 1, service: "Spotify", date: "Dec 15", amount: "9.99" },
      { id: 2, service: "Adobe CC", date: "Dec 20", amount: "52.99" },
    ],
  };

  return (
    <>
      <ManufactureNavbar />

      <div className="min-h-screen bg-white p-6">
        <div className="max-w-6xl mx-auto space-y-8">
          
          {/* Header */}
          <header className="flex justify-between items-center border-b pb-4">
            <div className="flex items-center gap-3">
              <Wallet className="h-6 w-6" />
              <h1 className="text-xl font-semibold">Renewal Wallet</h1>
            </div>
            <Bell className="h-5 w-5" />
          </header>

          {/* Balance */}
          <div className="border rounded-lg p-6">
            <p className="text-sm text-gray-500">Total Balance</p>
            <h2 className="text-3xl font-semibold mt-2">
              {walletData.balance} {walletData.currency}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Growth: {walletData.monthlyGrowth}
            </p>

            <div className="flex gap-4 mt-6">
              <button className="border px-4 py-2 rounded">
                <CreditCard className="h-4 w-4 inline mr-2" />
                Add
              </button>
              <button className="border px-4 py-2 rounded">
                <RefreshCw className="h-4 w-4 inline mr-2" />
                Transfer
              </button>
              <button className="border px-4 py-2 rounded">
                <BarChart3 className="h-4 w-4 inline mr-2" />
                Invest
              </button>
            </div>
          </div>

          {/* Cards */}
          <div className="border rounded-lg p-6">
            <h3 className="font-semibold mb-4">Cards</h3>
            <div className="space-y-3">
              {walletData.cards.map((card) => (
                <div
                  key={card.id}
                  className="flex justify-between items-center border p-3 rounded"
                >
                  <div>
                    <p className="font-medium">{card.name}</p>
                    <p className="text-sm text-gray-500">
                      **** {card.last4} | {card.expiry}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4" />
                </div>
              ))}
            </div>
          </div>

          {/* Transactions */}
          <div className="border rounded-lg p-6">
            <h3 className="font-semibold mb-4">Recent Transactions</h3>
            <div className="space-y-3">
              {walletData.recentTransactions.map((txn) => (
                <div
                  key={txn.id}
                  className="flex justify-between items-center border-b pb-2"
                >
                  <div>
                    <p className="font-medium">{txn.name}</p>
                    <p className="text-sm text-gray-500">{txn.date}</p>
                  </div>
                  <p>{txn.amount}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Renewals */}
          <div className="border rounded-lg p-6">
            <h3 className="font-semibold mb-4">Upcoming Renewals</h3>
            <div className="space-y-3">
              {walletData.upcomingRenewals.map((renewal) => (
                <div
                  key={renewal.id}
                  className="flex justify-between items-center border-b pb-2"
                >
                  <div>
                    <p className="font-medium">{renewal.service}</p>
                    <p className="text-sm text-gray-500">{renewal.date}</p>
                  </div>
                  <p>{renewal.amount}</p>
                </div>
              ))}
            </div>

            <button className="border px-4 py-2 rounded mt-4">
              <CheckCircle className="h-4 w-4 inline mr-2" />
              Manage Renewals
            </button>
          </div>

          {/* Quick Actions */}
          <div className="border rounded-lg p-6">
            <h3 className="font-semibold mb-4">Quick Actions</h3>
            <div className="flex gap-4 flex-wrap">
              <button className="border px-4 py-2 rounded">
                <Settings className="h-4 w-4 inline mr-2" />
                Settings
              </button>
              <button className="border px-4 py-2 rounded">
                <Shield className="h-4 w-4 inline mr-2" />
                Security
              </button>
              <button className="border px-4 py-2 rounded">
                <Download className="h-4 w-4 inline mr-2" />
                Export
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center text-sm text-gray-400 pt-6 border-t">
            Renewal Wallet • {new Date().getFullYear()}
          </div>
        </div>
      </div>
    </>
  );
}

export default Renewal;
