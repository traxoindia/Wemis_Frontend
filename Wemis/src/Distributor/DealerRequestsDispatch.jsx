import React, { useState } from 'react';
import DistributorNavbar from './DistributorNavbar';
import { X, Send } from 'lucide-react'; // Icons for the modal

function DealerRequestsDispatch() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        state: '',
        dealerName: '',
        qty: '',
        price: ''
    });

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log("Dispatching Request:", formData);
        // Add your API logic here
        setIsModalOpen(false);
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <DistributorNavbar />

            <div className="max-w-full mx-auto p-6">
                {/* Header from Sketch */}
                <div className="flex justify-between items-center mb-8 bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                    <h1 className="text-2xl font-bold text-gray-800 border-b-4 border-yellow-400 pb-1">
                        Dealer Requests
                    </h1>
                    
                    {/* "Send Dealer" Button from Sketch */}
                    <button 
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center gap-2 bg-black text-yellow-400 px-6 py-2.5 rounded-md font-bold hover:bg-neutral-800 transition-all shadow-md"
                    >
                        <Send size={18} /> Send Dealer
                    </button>
                </div>

                {/* "Show All Requests" Container from Sketch */}
                <div className="bg-white border-2 border-dashed border-gray-300 rounded-xl min-h-[400px] flex items-center justify-center">
                    <div className="text-center">
                        <div className="text-gray-400 mb-2">
                            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-semibold text-gray-500 uppercase tracking-widest">
                            Show All Requests
                        </h2>
                        <p className="text-gray-400 text-sm mt-2">No active requests found</p>
                    </div>
                </div>
            </div>

            {/* Modal - Opens when "Send Dealer" is clicked */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="bg-black p-4 flex justify-between items-center">
                            <h3 className="text-yellow-400 font-bold text-lg">Send New Request</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-white hover:text-yellow-400">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">State</label>
                                <input 
                                    type="text" name="state" required
                                    className="w-full border-b-2 border-gray-200 focus:border-yellow-400 outline-none py-2 transition-colors"
                                    placeholder="Enter State"
                                    onChange={handleInputChange}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Dealer Name</label>
                                <input 
                                    type="text" name="dealerName" required
                                    className="w-full border-b-2 border-gray-200 focus:border-yellow-400 outline-none py-2 transition-colors"
                                    placeholder="Enter Dealer Name"
                                    onChange={handleInputChange}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Quantity (Qty)</label>
                                    <input 
                                        type="number" name="qty" required
                                        className="w-full border-b-2 border-gray-200 focus:border-yellow-400 outline-none py-2 transition-colors"
                                        placeholder="0"
                                        onChange={handleInputChange}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Price</label>
                                    <input 
                                        type="number" name="price" required
                                        className="w-full border-b-2 border-gray-200 focus:border-yellow-400 outline-none py-2 transition-colors"
                                        placeholder="₹ 0.00"
                                        onChange={handleInputChange}
                                    />
                                </div>
                            </div>

                            <button 
                                type="submit"
                                className="w-full bg-black text-yellow-400 font-bold py-3 rounded-lg mt-4 hover:bg-neutral-800 transition-all uppercase tracking-widest shadow-lg"
                            >
                                Dispatch Request
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default DealerRequestsDispatch;