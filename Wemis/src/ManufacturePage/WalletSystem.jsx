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

  const API_URL = "https://api.websave.in/api/manufactur/addWalletBalance";
  const FETCH_BALANCE_URL = "https://api.websave.in/api/manufactur/fetchWalletBalance";

  // 🔐 Token from localStorage
  const token = localStorage.getItem("token");

  // Format currency in INR
  const formatCurrency = (amount) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);

  const formatDate = (date) =>
    new Intl.DateTimeFormat('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(date));

  // ✅ FETCH WALLET BALANCE FROM API
  const fetchWalletBalance = async () => {
    if (!token) {
      console.error("No token found in localStorage");
      alert("Please login again. Token not found.");
      return;
    }

    try {
      setFetchingBalance(true);
      const response = await axios.get(FETCH_BALANCE_URL, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      console.log("Wallet balance response:", response.data);


      // Check different possible response structures
      if (response.data && response.data.success) {
        // If data contains walletData or directly balance
        const walletData = response.data.walletData || response.data.data;
        
        if (walletData && walletData.balance !== undefined) {
          setBalance(walletData.balance);
        } else if (response.data.balance !== undefined) {
          setBalance(response.data.balance);
        } else {
          console.warn("Balance not found in response:", response.data);
         
        }

        // Handle transactions if available
        if (response.data.transactions) {
          setTransactions(response.data.transactions);
        }
      } else {
        console.error("API did not return success:", response.data);
      }
    } catch (error) {
      console.error("Error fetching wallet balance:", error);
      if (error.response) {
        console.error("Response error:", error.response.data);
        alert(`Failed to fetch balance: ${error.response.data.message || 'Server error'}`);
      } else if (error.request) {
        console.error("Request error:", error.request);
        alert("Network error. Please check your connection.");
      } else {
        alert("Error fetching wallet balance. Please try again.");
      }
    } finally {
      setFetchingBalance(false);
    }
  };

  // ✅ ADD MONEY USING API
  const handleAddMoney = async (e) => {
    e.preventDefault();
    const amount = Number(newAmount);

    if (!amount || amount <= 0) {
      alert("Enter valid amount");
      return;
    }

    if (!token) {
      alert("Please login again. Token not found.");
      return;
    }

    try {
      setLoading(true);

      const payload = {
        amount: amount,
        reason: description || "Activation"
      };

      const res = await axios.post(API_URL, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      // ✅ On success
      const newTransaction = {
        id: Date.now(),
        type: "deposit",
        amount: amount,
        description: payload.reason,
        date: new Date(),
        status: "completed"
      };

      // Update balance locally
      setBalance(prev => prev + amount);
      
      // Add to transactions
      setTransactions(prev => [newTransaction, ...prev]);

      // Reset form
      setShowAddModal(false);
      setNewAmount('');
      setDescription('');

      // Show success message
      alert(res.data?.message || "Wallet balance added successfully");

      // Optional: Refresh balance from server to ensure consistency
      fetchWalletBalance();

    } catch (error) {
      console.error("Error adding money:", error);
      if (error.response) {
        alert(error.response?.data?.message || "Failed to add balance");
      } else if (error.request) {
        alert("Network error. Please check your connection.");
      } else {
        alert("Error adding money. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Delete transaction (local only - for demo)
  const deleteTransaction = (id) => {
    const tx = transactions.find(t => t.id === id);
    if (!tx) return;

    // Update balance when deleting
    setBalance(prev =>
      tx.type === "deposit" ? prev - tx.amount : prev + tx.amount
    );

    // Remove from transactions
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  // Filter transactions based on selected filter
  const filteredTransactions = transactions.filter(t => {
    if (filter === "all") return true;
    return t.type === filter;
  });

  // Fetch balance on component mount
  useEffect(() => {
    fetchWalletBalance();
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
                onClick={fetchWalletBalance}
                disabled={fetchingBalance}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                title="Refresh balance"
              >
                <RefreshCw size={18} className={fetchingBalance ? "animate-spin" : ""} />
                {fetchingBalance ? "Refreshing..." : "Refresh"}
              </button>
              
              <button
                onClick={() => setShowAddModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg flex items-center gap-2 transition-colors"
              >
                <Plus size={18} /> Add Money
              </button>
            </div>
          </div>

          {/* Balance Card */}
          <div className="mb-6">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-2xl shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <Wallet size={28} />
                  <div>
                    <p className="text-blue-100 text-sm">Current Balance</p>
                    <h2 className="text-3xl md:text-4xl font-bold">{formatCurrency(balance)}</h2>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-blue-100 text-sm">Last Updated</p>
                  <p className="font-medium">{new Date().toLocaleDateString('en-IN')}</p>
                </div>
              </div>
              
              <div className="mt-4 flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <ArrowUpRight size={16} />
                  <span>Total Deposits: {formatCurrency(
                    transactions.filter(t => t.type === 'deposit').reduce((sum, t) => sum + t.amount, 0)
                  )}</span>
                </div>
                <div className="flex items-center gap-2">
                  <ArrowDownLeft size={16} />
                  <span>Total Withdrawals: {formatCurrency(
                    transactions.filter(t => t.type === 'withdrawal').reduce((sum, t) => sum + t.amount, 0)
                  )}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Transactions Section */}
          <div className="bg-white rounded-xl shadow overflow-hidden">
            <div className="p-4 md:p-6 border-b flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex items-center gap-2">
                <History size={20} className="text-gray-600" />
                <h2 className="font-semibold text-lg text-gray-800">Transaction History</h2>
                <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-sm">
                  {transactions.length} transactions
                </span>
              </div>

              <div className="flex items-center gap-3 w-full md:w-auto">
                <div className="relative flex-1 md:flex-none">
                  <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search transactions..."
                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Transactions</option>
                  <option value="deposit">Deposits Only</option>
                  <option value="withdrawal">Withdrawals Only</option>
                </select>
              </div>
            </div>

            {/* Transactions List */}
            <div className="divide-y">
              {filteredTransactions.length === 0 ? (
                <div className="p-8 text-center">
                  <History size={48} className="mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500 text-lg">No transactions found</p>
                  <p className="text-gray-400 text-sm mt-2">Your transaction history will appear here</p>
                </div>
              ) : (
                filteredTransactions.map(tx => (
                  <div key={tx.id || tx._id} className="p-4 md:p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-full ${
                          tx.type === "deposit" 
                            ? "bg-green-100 text-green-600" 
                            : "bg-red-100 text-red-600"
                        }`}>
                          {tx.type === "deposit" ? <ArrowUpRight size={20} /> : <ArrowDownLeft size={20} />}
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">{tx.description || "Transaction"}</p>
                          <p className="text-sm text-gray-500">
                            {tx.date ? formatDate(tx.date) : "Date not available"}
                          </p>
                          {tx.status && (
                            <span className={`inline-block px-2 py-1 rounded text-xs mt-1 ${
                              tx.status === "completed" 
                                ? "bg-green-100 text-green-800" 
                                : tx.status === "pending"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                            }`}>
                              {tx.status}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <span className={`text-lg font-bold ${
                          tx.type === "deposit" ? "text-green-600" : "text-red-600"
                        }`}>
                          {tx.type === "deposit" ? "+" : "-"}{formatCurrency(tx.amount)}
                        </span>
                        
                        {/* Only show delete for locally added transactions */}
                        {tx.id && tx.id.toString().length < 13 && (
                          <button
                            onClick={() => deleteTransaction(tx.id)}
                            className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                            title="Delete transaction"
                          >
                            <Trash2 size={18} />
                          </button>
                        )}
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
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <form
              onSubmit={handleAddMoney}
              className="bg-white p-6 rounded-2xl w-full max-w-md shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Add Wallet Balance</h2>
                <p className="text-gray-600 text-sm mt-1">Add funds to your manufacture wallet</p>
              </div>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amount (₹)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₹</span>
                    <input
                      type="number"
                      placeholder="0.00"
                      value={newAmount}
                      onChange={(e) => setNewAmount(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                      min="1"
                      step="0.01"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reason (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Activation, Top-up, Payment"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setNewAmount('');
                    setDescription('');
                  }}
                  className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !newAmount}
                  className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <RefreshCw size={18} className="animate-spin" />
                      Processing...
                    </span>
                  ) : (
                    "Add Money"
                  )}
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