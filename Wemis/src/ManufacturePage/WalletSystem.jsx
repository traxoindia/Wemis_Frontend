import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Wallet, Plus, History, ArrowUpRight, ArrowDownLeft,
  CreditCard, Trash2, Filter, Search, RefreshCw
} from 'lucide-react';
import ManufactureNavbar from './ManufactureNavbar';

const WalletSystem = () => {
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newAmount, setNewAmount] = useState('');
  const [description, setDescription] = useState('');
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [fetchingBalance, setFetchingBalance] = useState(false);
  const [fetchingHistory, setFetchingHistory] = useState(false);

  // API URLs
  const ADD_MONEY_URL = "https://api.websave.in/api/manufactur/addWalletBalance";
  const FETCH_BALANCE_URL = "https://api.websave.in/api/manufactur/fetchWalletBalance";
  const FETCH_HISTORY_URL = "https://api.websave.in/api/manufactur/fetchManufacturPaymentHistory";

  // 🔐 Token from localStorage
  const token = localStorage.getItem("token");

  // Format currency in INR
  const formatCurrency = (amount) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);

  const formatDate = (dateString) => {
    if (!dateString) return "Date not available";
    return new Intl.DateTimeFormat('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(dateString));
  };

  // ✅ 1. FETCH WALLET BALANCE
  const fetchWalletBalance = async () => {
    if (!token) return;

    try {
      setFetchingBalance(true);
      const response = await axios.get(FETCH_BALANCE_URL, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (response.data && response.data.success) {
        // Adjust depending on where balance sits in this specific API response
        // Common patterns: response.data.balance OR response.data.wallet.balance
        const bal = response.data.balance || response.data.walletData?.balance || 0;
        setBalance(bal);
      }
    } catch (error) {
      console.error("Error fetching wallet balance:", error);
    } finally {
      setFetchingBalance(false);
    }
  };

  // ✅ 2. FETCH TRANSACTION HISTORY (Updated for your specific JSON)
  const fetchTransactionHistory = async () => {
    if (!token) return;

    try {
      setFetchingHistory(true);
      const response = await axios.get(FETCH_HISTORY_URL, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      console.log("History Response:", response.data);

      if (response.data && response.data.success) {
        // The array is in response.data.transactions based on your snippet
        const historyData = response.data.transactions || [];
        
        const formattedTransactions = historyData.map((tx, index) => ({
          // Use index as ID since API doesn't provide unique ID in snippet
          id: index, 
          amount: tx.amount,
          // Map 'CREDIT' to 'deposit' for UI logic
          type: tx.type === 'CREDIT' ? 'deposit' : 'withdrawal', 
          description: tx.reason || "Transaction",
          date: tx.createdAt,
          balanceAfter: tx.balanceAfter, // Store this if you want to show running balance
          status: "completed" // API implies completed transactions
        }));

        setTransactions(formattedTransactions);
      }
    } catch (error) {
      console.error("Error fetching transaction history:", error);
    } finally {
      setFetchingHistory(false);
    }
  };

  // ✅ 3. ADD MONEY
  const handleAddMoney = async (e) => {
    e.preventDefault();
    const amount = Number(newAmount);

    if (!amount || amount <= 0) {
      alert("Enter valid amount");
      return;
    }

    try {
      setLoading(true);

      const payload = {
        amount: amount,
        reason: description || "Wallet Top-up"
      };

      const res = await axios.post(ADD_MONEY_URL, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (res.data && res.data.success) {
        alert(res.data.message || "Wallet balance added successfully");
        setShowAddModal(false);
        setNewAmount('');
        setDescription('');
        handleRefresh(); // Refresh data
      } else {
        alert(res.data?.message || "Failed to add balance");
      }

    } catch (error) {
      console.error("Error adding money:", error);
      alert("Failed to add money. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchWalletBalance();
    fetchTransactionHistory();
  };

  // Filter Logic
  const filteredTransactions = transactions.filter(t => {
    if (filter === "all") return true;
    return t.type === filter;
  });

  // Initial Load
  useEffect(() => {
    handleRefresh();
  }, []);

  return (
    <div>
      <ManufactureNavbar />

      <div className="min-h-screen bg-gray-50 p-4 md:p-6">
        <div className="max-w-5xl mx-auto">
          
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Manufacture Wallet</h1>
            
            <div className="flex items-center gap-3">
              <button
                onClick={handleRefresh}
                disabled={fetchingBalance || fetchingHistory}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                <RefreshCw size={18} className={(fetchingBalance || fetchingHistory) ? "animate-spin" : ""} />
                {(fetchingBalance || fetchingHistory) ? "Refreshing..." : "Refresh"}
              </button>
              
              <button
                onClick={() => setShowAddModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm"
              >
                <Plus size={18} /> Add Money
              </button>
            </div>
          </div>

          {/* Balance Card */}
          <div className="mb-6">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-2xl shadow-lg relative overflow-hidden">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
              
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 relative z-10">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                    <Wallet size={32} className="text-white" />
                  </div>
                  <div>
                    <p className="text-blue-100 text-sm font-medium">Available Balance</p>
                    <h2 className="text-4xl font-bold tracking-tight">{formatCurrency(balance)}</h2>
                  </div>
                </div>
                <div className="mt-4 md:mt-0 text-right">
                  <p className="text-blue-100 text-xs uppercase tracking-wider">Sync Status</p>
                  <p className="font-medium font-mono text-sm flex items-center justify-end gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                    Live
                  </p>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-6 text-sm relative z-10 border-t border-white/20 pt-4">
                <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-lg">
                  <div className="p-1 bg-green-400/20 rounded-full">
                    <ArrowUpRight size={14} className="text-green-300" />
                  </div>
                  <div>
                    <span className="block text-blue-100 text-xs">Total Credits</span>
                    <span className="font-semibold">
                      {formatCurrency(transactions.filter(t => t.type === 'deposit').reduce((sum, t) => sum + Number(t.amount), 0))}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Transactions Section */}
          <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
            <div className="p-4 md:p-6 border-b border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <History size={20} className="text-gray-600" />
                </div>
                <div>
                  <h2 className="font-semibold text-lg text-gray-800">Payment History</h2>
                  <p className="text-xs text-gray-500">{transactions.length} records</p>
                </div>
              </div>

              <div className="flex items-center gap-3 w-full md:w-auto">
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
                >
                  <option value="all">All Transactions</option>
                  <option value="deposit">Credits (Deposits)</option>
                  <option value="withdrawal">Debits (Withdrawals)</option>
                </select>
              </div>
            </div>

            {/* Transactions List */}
            <div className="divide-y divide-gray-50 max-h-[600px] overflow-y-auto">
              {fetchingHistory ? (
                <div className="p-12 text-center">
                  <RefreshCw size={32} className="mx-auto text-blue-500 animate-spin mb-3" />
                  <p className="text-gray-500">Loading history...</p>
                </div>
              ) : filteredTransactions.length === 0 ? (
                <div className="p-12 text-center">
                  <History size={32} className="mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-500 font-medium">No transactions found</p>
                </div>
              ) : (
                filteredTransactions.map((tx, index) => (
                  <div key={index} className="p-4 hover:bg-gray-50 transition-colors group border-l-4 border-transparent hover:border-blue-500">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-full flex-shrink-0 ${
                          tx.type === "deposit" ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
                        }`}>
                          {tx.type === "deposit" ? <ArrowUpRight size={20} /> : <ArrowDownLeft size={20} />}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{tx.description}</p>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-xs text-gray-500">{formatDate(tx.date)}</span>
                            {/* Optional: Show running balance if available */}
                            {tx.balanceAfter !== undefined && (
                              <span className="text-xs font-mono text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                                Bal: ₹{tx.balanceAfter}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <span className={`text-lg font-bold block ${
                          tx.type === "deposit" ? "text-green-600" : "text-gray-800"
                        }`}>
                          {tx.type === "deposit" ? "+" : "-"}{formatCurrency(tx.amount)}
                        </span>
                        <span className={`text-[10px] uppercase font-bold tracking-wider ${
                          tx.type === "deposit" ? "text-green-500" : "text-red-400"
                        }`}>
                          {tx.type === "deposit" ? "CREDIT" : "DEBIT"}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* ADD MONEY MODAL */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <form
              onSubmit={handleAddMoney}
              className="bg-white p-6 rounded-2xl w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-6 flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold text-gray-800">Add Balance</h2>
                  <p className="text-gray-500 text-sm">Add funds to your wallet</p>
                </div>
                <div className="p-2 bg-blue-50 rounded-full">
                  <CreditCard size={20} className="text-blue-600" />
                </div>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Amount</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-bold text-lg">₹</span>
                    <input
                      type="number"
                      placeholder="0.00"
                      value={newAmount}
                      onChange={(e) => setNewAmount(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg font-medium"
                      required
                      min="1"
                      autoFocus
                    />
                  </div>
                  <div className="flex gap-2 mt-3">
                    {[500, 1000, 2000, 5000].map(amt => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setNewAmount(amt)}
                        className="px-3 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-md hover:bg-blue-50 hover:text-blue-600 transition-colors"
                      >
                        +₹{amt}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                  <input
                    type="text"
                    placeholder="e.g., Monthly Top-up"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-8">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-xl hover:bg-gray-50 font-medium transition-colors"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !newAmount}
                  className="flex-1 bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700 font-medium transition-all shadow-md hover:shadow-lg disabled:opacity-50"
                >
                  {loading ? "Processing..." : "Proceed to Pay"}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default WalletSystem;