import React, { useState, useEffect } from 'react';
import { 
  Wallet as WalletIcon, 
  Plus, 
  ArrowUpRight, 
  ArrowDownLeft, 
  X,
  Download,
  Filter,
  Search,
  ChevronRight,
  CreditCard,
  Receipt,
  User,
  Bell,
  RefreshCw,
  TrendingUp,
  History,
  Shield,
  CheckCircle,
  Settings
} from 'lucide-react';
import { format } from 'date-fns';
import ManufactureNavbar from './ManufactureNavbar';

const WalletSystem = () => {
  // State for Data
  // NOTE: Values are stored in PAISE (100 paise = 1 Rupee)
  const [balance, setBalance] = useState(24505000); // ₹2,45,050.00
  
  const [transactions, setTransactions] = useState([
    { 
      id: 1, 
      type: 'withdrawal', 
      label: 'Apple India', 
      description: 'iPhone 15 Pro Max',
      amount: 15990000, // ₹1,59,900.00
      date: new Date('2024-01-15T14:30:00'),
      status: 'completed',
      category: 'shopping',
      icon: '🛍️'
    },
    { 
      id: 2, 
      type: 'deposit', 
      label: 'UPI Top Up', 
      description: 'HDFC Bank - UPI',
      amount: 500000, // ₹5,000.00
      date: new Date('2024-01-14T10:15:00'),
      status: 'completed',
      category: 'deposit',
      icon: 'UPI'
    },
    { 
      id: 3, 
      type: 'deposit', 
      label: 'Myntra Refund', 
      description: 'Return Order #4451',
      amount: 450000, // ₹4,500.00
      date: new Date('2024-01-13T16:45:00'),
      status: 'completed',
      category: 'refund',
      icon: '🔄'
    },
    { 
      id: 4, 
      type: 'withdrawal', 
      label: 'Netflix', 
      description: 'Premium Subscription',
      amount: 64900, // ₹649.00
      date: new Date('2024-01-12T09:00:00'),
      status: 'completed',
      category: 'subscription',
      icon: '🎬'
    },
    { 
      id: 5, 
      type: 'deposit', 
      label: 'Salary Credit', 
      description: 'Infosys Ltd',
      amount: 8500000, // ₹85,000.00
      date: new Date('2024-01-10T14:00:00'),
      status: 'completed',
      category: 'salary',
      icon: '💼'
    },
    { 
      id: 6, 
      type: 'withdrawal', 
      label: 'Rahul Kumar', 
      description: 'Dinner Split',
      amount: 85000, // ₹850.00
      date: new Date('2024-01-09T11:30:00'),
      status: 'pending',
      category: 'transfer',
      icon: '👤'
    },
  ]);

  const [quickActions, setQuickActions] = useState([
    { id: 1, label: 'Add Money', icon: Plus, color: 'from-green-500 to-emerald-600' },
    { id: 2, label: 'UPI Send', icon: ArrowUpRight, color: 'from-blue-500 to-cyan-600' },
    { id: 3, label: 'Pay Bills', icon: Receipt, color: 'from-purple-500 to-pink-600' },
    { id: 4, label: 'SIP/Invest', icon: TrendingUp, color: 'from-orange-500 to-red-600' },
  ]);

  const [stats, setStats] = useState({
    monthlySpent: 4543000,    // ₹45,430
    monthlyReceived: 12500000, // ₹1,25,000
    totalTransactions: 42,
    averageTransaction: 250000 // ₹2,500
  });

  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedTab, setSelectedTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Helper: Format paise to Indian Currency
  const formatMoney = (paise) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(paise / 100);
  };

  // Helper: Format date
  const formatDate = (date) => {
    return format(date, 'MMM dd, yyyy');
  };

  const formatTime = (date) => {
    return format(date, 'hh:mm a');
  };

  const filteredTransactions = transactions.filter(tx => {
    const matchesTab = selectedTab === 'all' || tx.type === selectedTab;
    const matchesSearch = tx.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         tx.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const handleAddFunds = (amountInPaise) => {
    setBalance(prev => prev + amountInPaise);
    setTransactions(prev => [
      { 
        id: Date.now(), 
        type: 'deposit', 
        label: 'Quick Deposit', 
        description: 'UPI Deposit',
        amount: amountInPaise, 
        date: new Date(),
        status: 'completed',
        category: 'deposit',
        icon: '⚡'
      },
      ...prev
    ]);
    setShowAddModal(false);
  };

  const handleQuickAction = (actionId) => {
    if (actionId === 1) {
      setShowAddModal(true);
    }
  };

  return (
    <div>
   <ManufactureNavbar/>
   
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white p-4 md:p-6 font-sans">
      {/* Header */}
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold">Rupee Wallet</h1>
            <p className="text-gray-400 mt-2">Manage your Indian finances and track transactions</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="p-2 rounded-full bg-gray-800 hover:bg-gray-700 transition-colors relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            <button className="p-2 rounded-full bg-gray-800 hover:bg-gray-700 transition-colors">
              <Settings className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 bg-gray-800 rounded-full px-4 py-2 border border-gray-700">
              <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-black" />
              </div>
              <span className="font-medium">Aditya R.</span>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Balance & Quick Actions */}
          <div className="lg:col-span-1 space-y-6">
            {/* Balance Card */}
            <div className="bg-gradient-to-br from-yellow-500 via-yellow-600 to-yellow-700 rounded-2xl p-6 border border-yellow-400/30 shadow-lg shadow-yellow-500/10 relative overflow-hidden">
               {/* Decorative background pattern */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
              
              <div className="flex items-center justify-between mb-6 relative z-10">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-black/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                    <WalletIcon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-yellow-100 text-sm font-medium">Total Balance</p>
                    <p className="text-3xl font-bold text-white">{formatMoney(balance)}</p>
                  </div>
                </div>
                <button className="p-2 rounded-lg bg-black/20 hover:bg-black/30 transition-colors backdrop-blur-sm">
                  <RefreshCw className="w-5 h-5 text-white" />
                </button>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-6 relative z-10">
                <div className="bg-black/20 rounded-xl p-4 backdrop-blur-sm">
                  <p className="text-yellow-100 text-xs mb-1">Incoming</p>
                  <p className="text-lg font-bold text-white">{formatMoney(stats.monthlyReceived)}</p>
                </div>
                <div className="bg-black/20 rounded-xl p-4 backdrop-blur-sm">
                  <p className="text-yellow-100 text-xs mb-1">Outgoing</p>
                  <p className="text-lg font-bold text-white">{formatMoney(stats.monthlySpent)}</p>
                </div>
              </div>

              <div className="space-y-3 relative z-10">
                <button 
                  onClick={() => setShowAddModal(true)}
                  className="w-full bg-white text-yellow-700 font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors shadow-sm"
                >
                  <Plus className="w-5 h-5" />
                  Add Money
                </button>
                <button className="w-full bg-black/20 hover:bg-black/30 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors backdrop-blur-sm">
                  <ArrowUpRight className="w-5 h-5" />
                  Send via UPI
                </button>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-gray-900/50 rounded-2xl p-6 border border-gray-800">
              <h3 className="text-lg font-semibold mb-4 text-gray-200">Quick Actions</h3>
              <div className="grid grid-cols-2 gap-3">
                {quickActions.map(action => (
                  <button
                    key={action.id}
                    onClick={() => handleQuickAction(action.id)}
                    className={`bg-gradient-to-br ${action.color} p-4 rounded-xl hover:opacity-90 transition-opacity group relative overflow-hidden`}
                  >
                    <div className="relative z-10">
                        <action.icon className="w-6 h-6 mb-2 text-white" />
                        <span className="text-sm font-medium text-white">{action.label}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Statistics */}
            <div className="bg-gray-900/50 rounded-2xl p-6 border border-gray-800">
              <h3 className="text-lg font-semibold mb-4 text-gray-200">Monthly Overview</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-400">Transaction Count</span>
                    <span className="font-semibold text-white">{stats.totalTransactions}</span>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-2">
                    <div className="bg-yellow-500 h-2 rounded-full w-3/4 shadow-[0_0_10px_rgba(234,179,8,0.5)]"></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-400">Avg. Spend</span>
                    <span className="font-semibold text-white">{formatMoney(stats.averageTransaction)}</span>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full w-2/3 shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Transactions */}
          <div className="lg:col-span-2">
            <div className="bg-gray-900/50 rounded-2xl border border-gray-800 overflow-hidden h-full flex flex-col">
              {/* Transactions Header */}
              <div className="p-6 border-b border-gray-800">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-white">History</h2>
                    <p className="text-gray-400 text-sm">Recent transactions & transfers</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="relative hidden md:block">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <input
                        type="text"
                        placeholder="Search UPI / Merchant..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg w-64 text-sm focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 transition-all placeholder-gray-600"
                      />
                    </div>
                    <button className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors border border-gray-700">
                      <Filter className="w-4 h-4 text-gray-400" />
                    </button>
                    <button className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors border border-gray-700">
                      <Download className="w-4 h-4 text-gray-400" />
                    </button>
                  </div>
                </div>

                {/* Transaction Tabs */}
                <div className="flex space-x-2 mt-6 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
                  {['all', 'deposit', 'withdrawal', 'pending'].map(tab => (
                    <button
                      key={tab}
                      onClick={() => setSelectedTab(tab)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                        selectedTab === tab
                          ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/20'
                          : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
                      }`}
                    >
                      {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Transactions List */}
              <div className="divide-y divide-gray-800 overflow-y-auto flex-grow">
                {filteredTransactions.length === 0 ? (
                  <div className="p-12 text-center flex flex-col items-center justify-center h-64">
                    <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mb-4">
                      <Receipt className="w-8 h-8 text-gray-500" />
                    </div>
                    <p className="text-gray-300 font-medium">No transactions found</p>
                    <p className="text-sm text-gray-500 mt-1">Try changing your filters or search query</p>
                  </div>
                ) : (
                  filteredTransactions.map(tx => (
                    <div key={tx.id} className="p-4 hover:bg-gray-800/50 transition-colors cursor-pointer group">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl shrink-0 ${
                            tx.type === 'deposit' 
                              ? 'bg-green-500/10 text-green-400 ring-1 ring-green-500/20' 
                              : 'bg-red-500/10 text-red-400 ring-1 ring-red-500/20'
                          }`}>
                            {tx.icon === 'UPI' ? <span className="text-xs font-bold">UPI</span> : tx.icon}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold text-white">{tx.label}</h4>
                              {tx.status === 'pending' && (
                                <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-orange-500/10 text-orange-400 border border-orange-500/20">
                                  PENDING
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-400">{tx.description}</p>
                            <div className="flex items-center gap-3 mt-1">
                              <span className="text-xs text-gray-500 font-medium">{formatDate(tx.date)}</span>
                              <span className="text-xs text-gray-600">•</span>
                              <span className="text-xs text-gray-500">{formatTime(tx.date)}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                             <span className={`text-lg font-bold block ${
                                tx.type === 'deposit' ? 'text-green-400' : 'text-white'
                              }`}>
                                {tx.type === 'deposit' ? '+' : '-'}{formatMoney(tx.amount)}
                              </span>
                             <span className="text-xs text-gray-500 bg-gray-800 px-1.5 py-0.5 rounded">{tx.category}</span>
                          </div>
                          <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-yellow-500 transition-colors hidden sm:block" />
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* View All Button */}
              <div className="p-4 border-t border-gray-800 bg-gray-900">
                <button className="w-full py-3 bg-gray-800 hover:bg-gray-700 rounded-xl text-gray-300 font-medium transition-colors flex items-center justify-center gap-2 border border-gray-700 group">
                  <History className="w-4 h-4 group-hover:text-yellow-500 transition-colors" />
                  View Full Statement
                </button>
              </div>
            </div>

            {/* Payment Methods */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <div className="bg-gray-900/50 rounded-2xl p-6 border border-gray-800">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-white">
                  <CreditCard className="w-5 h-5 text-yellow-500" />
                  Saved Cards & UPI
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg border border-gray-700/50">
                     <div className="flex items-center gap-3">
                        <div className="w-8 h-5 bg-gradient-to-r from-blue-600 to-blue-800 rounded flex items-center justify-center text-[8px] font-bold text-white">HDFC</div>
                        <span className="text-sm text-gray-300">HDFC Regalia •••• 4242</span>
                     </div>
                     <span className="w-2 h-2 rounded-full bg-green-500"></span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg border border-gray-700/50">
                     <div className="flex items-center gap-3">
                        <div className="w-8 h-5 bg-white rounded flex items-center justify-center text-[8px] font-bold text-orange-600">UPI</div>
                        <span className="text-sm text-gray-300">aditya@oksbi</span>
                     </div>
                     <span className="w-2 h-2 rounded-full bg-green-500"></span>
                  </div>
                </div>
                <button className="w-full mt-4 py-2 border border-dashed border-gray-600 rounded-lg text-sm text-gray-400 hover:border-yellow-500 hover:text-yellow-500 transition-colors">
                  + Add New Payment Method
                </button>
              </div>

              <div className="bg-gray-900/50 rounded-2xl p-6 border border-gray-800">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-white">
                  <Shield className="w-5 h-5 text-green-500" />
                  Security
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 text-sm">Two-Factor Auth</span>
                    <div className="flex items-center gap-2 text-green-400 bg-green-400/10 px-2 py-1 rounded text-xs">
                        <CheckCircle className="w-3 h-3" /> Enabled
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 text-sm">Last Login</span>
                    <span className="text-sm text-white">Today, 2:30 PM (Mumbai)</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 text-sm">Payment Limit</span>
                    <span className="text-sm text-white">₹1,00,000 / day</span>
                  </div>
                </div>
                <button className="w-full mt-6 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg font-medium text-sm transition-colors text-white">
                  Manage Security Settings
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Funds Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-gray-800/50">
              <div>
                <h3 className="text-xl font-bold text-white">Add Funds</h3>
                <p className="text-gray-400 text-sm mt-1">Load money to your wallet</p>
              </div>
              <button 
                onClick={() => setShowAddModal(false)}
                className="p-2 rounded-lg hover:bg-gray-700 transition-colors text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-3 gap-3 mb-6">
                {[10000, 50000, 100000, 200000, 500000, 1000000].map(amount => (
                  <button
                    key={amount}
                    onClick={() => handleAddFunds(amount)}
                    className="py-3 px-2 bg-gray-800 hover:bg-yellow-500 hover:text-black border border-gray-700 hover:border-yellow-500 rounded-xl transition-all duration-200 font-semibold text-sm"
                  >
                    {formatMoney(amount)}
                  </button>
                ))}
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Custom Amount
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg font-serif">₹</span>
                  <input
                    type="number"
                    placeholder="0.00"
                    className="w-full pl-10 pr-4 py-3 bg-black/40 border border-gray-700 rounded-xl focus:outline-none focus:border-yellow-500 text-white font-medium"
                  />
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <h4 className="font-medium text-sm text-gray-400 uppercase tracking-wider">Pay Using</h4>
                <div className="space-y-2">
                  <label className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-xl cursor-pointer hover:bg-gray-800 border border-transparent hover:border-gray-600 transition-all">
                    <input type="radio" name="payment" className="text-yellow-500 focus:ring-yellow-500" defaultChecked />
                    <span className="text-sm font-medium">UPI (GPay / PhonePe)</span>
                  </label>
                  <label className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-xl cursor-pointer hover:bg-gray-800 border border-transparent hover:border-gray-600 transition-all">
                    <input type="radio" name="payment" className="text-yellow-500 focus:ring-yellow-500" />
                    <span className="text-sm font-medium">HDFC Bank •••• 4242</span>
                  </label>
                </div>
              </div>

              <button className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-3.5 rounded-xl transition-colors shadow-lg shadow-yellow-500/20">
                Proceed to Pay {formatMoney(500000)}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </div>
  );
};

export default WalletSystem;