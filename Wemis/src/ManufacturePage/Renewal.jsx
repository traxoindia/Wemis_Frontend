import React, { useState } from 'react';
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
  Download
} from 'lucide-react';
import ManufactureNavbar from './ManufactureNavbar';

function Renewal() {
  const [activeTab, setActiveTab] = useState('overview');
  
  // Mock data
  const walletData = {
    balance: '24,850.75',
    currency: 'INR',
    monthlyGrowth: '+12.5%',
    cards: [
      { id: 1, type: 'visa', last4: '4589', expiry: '12/25', name: 'Personal Card' },
      { id: 2, type: 'mastercard', last4: '2234', expiry: '08/26', name: 'Business Card' },
      { id: 3, type: 'amex', last4: '9012', expiry: '03/27', name: 'Travel Card' }
    ],
    recentTransactions: [
      { id: 1, name: 'Netflix', date: 'Today', amount: '-15.99', type: 'subscription' },
      { id: 2, name: 'Starbucks', date: 'Yesterday', amount: '-5.75', type: 'food' },
      { id: 3, name: 'Freelance Payment', date: '2 days ago', amount: '+1,200.00', type: 'income' },
      { id: 4, name: 'Amazon', date: '3 days ago', amount: '-89.99', type: 'shopping' }
    ],
    upcomingRenewals: [
      { id: 1, service: 'Spotify Premium', date: 'Dec 15', amount: '9.99', status: 'pending' },
      { id: 2, service: 'Adobe Creative Cloud', date: 'Dec 20', amount: '52.99', status: 'pending' },
      { id: 3, service: 'Gym Membership', date: 'Jan 1', amount: '29.99', status: 'upcoming' }
    ],
    stats: {
      monthlySpending: '1,245.60',
      savings: '4,850.20',
      investment: '8,750.00'
    }
  };

  return (
<>
    <ManufactureNavbar/>

    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6">
    
      {/* Header */}
      <div className="max-w-7xl mx-auto">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div className="flex items-center gap-3 mb-4 md:mb-0">
            <div className="p-2 bg-blue-600 rounded-xl">
              <Wallet className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Renewal Wallet</h1>
              <p className="text-gray-600">Manage your finances and subscriptions</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button className="p-2 rounded-full hover:bg-gray-200 transition">
              <Bell className="h-5 w-5 text-gray-600" />
            </button>
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
              <span className="text-blue-600 font-semibold">JD</span>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Balance & Cards */}
          <div className="lg:col-span-2 space-y-6">
            {/* Balance Card */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 text-white shadow-lg">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <p className="text-blue-100 mb-2">Total Balance</p>
                  <h2 className="text-3xl md:text-4xl font-bold">
                    {walletData.balance}
                    <span className="text-sm font-normal ml-2 opacity-90">{walletData.currency}</span>
                  </h2>
                </div>
                <div className="flex items-center gap-2 bg-white/20 rounded-full px-3 py-1">
                  <TrendingUp className="h-4 w-4" />
                  <span className="text-sm">{walletData.monthlyGrowth}</span>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-4">
                <button className="flex items-center gap-2 bg-white text-blue-600 px-4 py-2 rounded-lg font-medium hover:bg-blue-50 transition">
                  <CreditCard className="h-4 w-4" />
                  Add Money
                </button>
                <button className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-lg font-medium hover:bg-white/30 transition">
                  <RefreshCw className="h-4 w-4" />
                  Transfer
                </button>
                <button className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-lg font-medium hover:bg-white/30 transition">
                  <BarChart3 className="h-4 w-4" />
                  Invest
                </button>
              </div>
            </div>

            {/* Cards Section */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-gray-800">Your Cards</h3>
                <button className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
                  View All <ChevronRight className="h-4 w-4" />
                </button>
              </div>
              
              <div className="space-y-4">
                {walletData.cards.map(card => (
                  <div key={card.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:border-blue-300 transition">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-8 bg-gradient-to-r from-blue-400 to-blue-600 rounded flex items-center justify-center">
                        <CreditCard className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-800">{card.name}</h4>
                        <p className="text-sm text-gray-600">•••• {card.last4} | Expires {card.expiry}</p>
                      </div>
                    </div>
                    <button className="text-blue-600 hover:text-blue-700">
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </div>
                ))}
              </div>
              
              <button className="w-full mt-6 py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:text-blue-600 hover:border-blue-400 transition flex items-center justify-center gap-2">
                <CreditCard className="h-5 w-5" />
                Add New Card
              </button>
            </div>

            {/* Recent Transactions */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h3 className="text-xl font-semibold text-gray-800 mb-6">Recent Transactions</h3>
              <div className="space-y-4">
                {walletData.recentTransactions.map(transaction => (
                  <div key={transaction.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg {
                        transaction.type === 'income' ? 'bg-green-100 text-green-600' :
                        transaction.type === 'subscription' ? 'bg-purple-100 text-purple-600' :
                        'bg-blue-100 text-blue-600'
                      }`}>
                        {transaction.type === 'subscription' ? 
                          <RefreshCw className="h-4 w-4" /> : 
                          <CreditCard className="h-4 w-4" />
                        }
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-800">{transaction.name}</h4>
                        <p className="text-sm text-gray-500">{transaction.date}</p>
                      </div>
                    </div>
                    <span className={`font-semibold {
                      transaction.amount.startsWith('+') ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {transaction.amount}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Stats & Upcoming */}
          <div className="space-y-6">
            {/* Stats */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h3 className="text-xl font-semibold text-gray-800 mb-6">Monthly Stats</h3>
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-xl">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-600">Monthly Spending</span>
                    <BarChart3 className="h-5 w-5 text-blue-600" />
                  </div>
                  <p className="text-2xl font-bold text-gray-800">{walletData.stats.monthlySpending}</p>
                </div>
                
                <div className="p-4 bg-green-50 rounded-xl">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-600">Total Savings</span>
                    <Shield className="h-5 w-5 text-green-600" />
                  </div>
                  <p className="text-2xl font-bold text-gray-800">{walletData.stats.savings}</p>
                </div>
                
                <div className="p-4 bg-purple-50 rounded-xl">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-600">Investments</span>
                    <TrendingUp className="h-5 w-5 text-purple-600" />
                  </div>
                  <p className="text-2xl font-bold text-gray-800">{walletData.stats.investment}</p>
                </div>
              </div>
            </div>

            {/* Upcoming Renewals */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-gray-800">Upcoming Renewals</h3>
                <Clock className="h-5 w-5 text-gray-400" />
              </div>
              
              <div className="space-y-4">
                {walletData.upcomingRenewals.map(renewal => (
                  <div key={renewal.id} className="p-4 border border-gray-200 rounded-xl hover:border-blue-300 transition">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-medium text-gray-800">{renewal.service}</h4>
                      <span className={`text-sm px-2 py-1 rounded-full {
                        renewal.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {renewal.status}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Clock className="h-4 w-4" />
                        <span className="text-sm">{renewal.date}</span>
                      </div>
                      <span className="font-semibold">{renewal.amount}</span>
                    </div>
                  </div>
                ))}
              </div>
              
              <button className="w-full mt-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition flex items-center justify-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Manage Renewals
              </button>
            </div>

            {/* Quick Actions */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 shadow-sm">
              <h3 className="text-xl font-semibold text-gray-800 mb-6">Quick Actions</h3>
              <div className="grid grid-cols-2 gap-3">
                <button className="p-4 bg-white rounded-xl hover:shadow-md transition flex flex-col items-center justify-center gap-2">
                  <Settings className="h-5 w-5 text-blue-600" />
                  <span className="text-sm font-medium text-gray-700">Settings</span>
                </button>
                <button className="p-4 bg-white rounded-xl hover:shadow-md transition flex flex-col items-center justify-center gap-2">
                  <Shield className="h-5 w-5 text-green-600" />
                  <span className="text-sm font-medium text-gray-700">Security</span>
                </button>
                <button className="p-4 bg-white rounded-xl hover:shadow-md transition flex flex-col items-center justify-center gap-2">
                  <Download className="h-5 w-5 text-purple-600" />
                  <span className="text-sm font-medium text-gray-700">Export</span>
                </button>
                <button className="p-4 bg-white rounded-xl hover:shadow-md transition flex flex-col items-center justify-center gap-2">
                  <CreditCard className="h-5 w-5 text-orange-600" />
                  <span className="text-sm font-medium text-gray-700">Statements</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="mt-8 text-center text-gray-500 text-sm">
          <p>Renewal Wallet • Protected by 256-bit encryption • {new Date().getFullYear()}</p>
        </div>
      </div>
    </div>
    </>
  );
}

export default Renewal;