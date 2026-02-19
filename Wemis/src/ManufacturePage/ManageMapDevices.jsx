import React, { useState, useEffect, useCallback } from 'react';
import { X, MapPin, Package, User, Smartphone, Loader2, AlertTriangle, CheckCircle, XCircle, ShieldCheck, Send } from 'lucide-react';
import DeviceMapreport from './DeviceMapreport';
import ManufactureNavbar from './ManufactureNavbar';

// --- Components ---
const ToastNotification = ({ message, type, onClose }) => {
  if (!type || !message) return null;
  const styleMap = {
    success: { bgColor: 'bg-green-600/95', borderColor: 'border-green-400', icon: <CheckCircle size={24} /> },
    error: { bgColor: 'bg-red-600/95', borderColor: 'border-red-400', icon: <XCircle size={24} /> },
  };
  const { bgColor, borderColor, icon } = styleMap[type];
  return (
    <div className="fixed top-5 right-5 z-[100] p-4">
      <div className={`flex items-center gap-3 p-4 rounded-lg shadow-2xl border ${bgColor} ${borderColor} backdrop-blur-sm transform transition-all duration-300 animate-slideIn text-white`}>
        <div className="flex-shrink-0">{icon}</div>
        <div className="flex-grow">
          <p className="font-bold">{type === 'success' ? 'Success' : 'Error'}</p>
          <p className="text-sm opacity-90">{message}</p>
        </div>
        <button onClick={onClose} className="ml-4 hover:opacity-70 transition-opacity"><X size={20} /></button>
      </div>
      <style>{`
        @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        .animate-slideIn { animation: slideIn 0.5s ease-out forwards; }
      `}</style>
    </div>
  );
};

const SectionHeader = ({ icon: Icon, title }) => (
  <h3 className="text-xl font-bold text-yellow-400 mb-6 pb-2 border-b border-yellow-500/20 flex items-center gap-3">
    <Icon className="text-yellow-500" size={22} />
    {title}
  </h3>
);

const PackageDetailItem = ({ label, value }) => (
  <div className="flex items-center justify-between py-2 border-b border-yellow-500/10 last:border-b-0">
    <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">{label}</span>
    <span className="text-sm font-bold text-yellow-200 bg-black/30 px-3 py-1 rounded-full border border-yellow-500/20">
      {value || 'N/A'}
    </span>
  </div>
);

// --- APIs ---
const DISTRIBUTOR_API = 'https://api.websave.in/api/manufactur/fetchDistributorOnBasisOfState';
const DEALER_API = 'https://api.websave.in/api/manufactur/fetchdelerOnBasisOfDistributor';
const DEVICE_NO_API = 'https://api.websave.in/api/manufactur/fetchDeviceNoOnBasisOfDeler';
const SUBMIT_API = 'https://api.websave.in/api/manufactur/manuFacturMAPaDevice';
const FETCH_WALLET_HISTORY_API = "https://api.websave.in/api/manufactur/fetchManufacturActivatioWallet";

const initialFormData = {
  country: 'India', state: '', distributorName: '', delerName: '', vechileNo: '',
  deviceType: '', deviceNo: '', voltage: '', elementType: '', batchNo: '',
  simDetails: '', VechileBirth: '', RegistrationNo: '', date: '', ChassisNumber: '',
  EngineNumber: '', VehicleType: '', MakeModel: '', ModelYear: '', InsuranceRenewDate: '',
  PollutionRenewdate: '', VehicleKMReading: '', DriverLicenseNo: '', MappedDate: '',
  NoOfPanicButtons: '', fullName: '', email: '', mobileNo: '', GstinNo: '',
  Customercountry: 'India', Customerstate: '', Customerdistrict: '', Rto: '',
  PinCode: '', CompliteAddress: '', AdharNo: '', PanNo: '', Packages: '', InvoiceNo: '',
  deviceSendTo: '', // Added new field
  Vechile_Doc: null, Rc_Doc: null, Pan_Card: null, Device_Doc: null, Adhar_Card: null,
  Invious_Doc: null, Signature_Doc: null, Panic_Sticker: null,
};

function App() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState(initialFormData);
  const [distributors, setDistributors] = useState([]);
  const [dealers, setDealers] = useState([]);
  const [deviceNumbers, setDeviceNumbers] = useState([]);
  const [mappedSims, setMappedSims] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ message: '', type: null });
  const [walletHistory, setWalletHistory] = useState([]);
  const [walletLoading, setWalletLoading] = useState(false);

  // --- Data Fetching ---
  const fetchWalletPlans = useCallback(async () => {
    setWalletLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(FETCH_WALLET_HISTORY_API, { headers: { Authorization: `Bearer ${token}` } });
      const result = await response.json();
      if (result.success) setWalletHistory(result.activationWallets || []);
    } catch (error) { console.error("Plan Fetch Error:", error); } 
    finally { setWalletLoading(false); }
  }, []);

  const fetchDistributors = useCallback(async (selectedState) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(DISTRIBUTOR_API, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ state: selectedState })
      });
      const data = await response.json();
      setDistributors(data.distributors || []);
    } catch (error) { console.error(error); }
  }, []);

  const fetchDealers = useCallback(async (distId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(DEALER_API, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ distributorId: distId })
      });
      const data = await response.json();
      setDealers(data.delers || data.dealers || []);
    } catch (error) { console.error(error); }
  }, []);

  const fetchDevices = useCallback(async (dlrName) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(DEVICE_NO_API, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ delerName: dlrName })
      });
      const data = await response.json();
      setDeviceNumbers(data.devices || []);
    } catch (error) { console.error(error); }
  }, []);

  useEffect(() => { fetchWalletPlans(); }, [fetchWalletPlans]);
  useEffect(() => { if (formData.state) fetchDistributors(formData.state); }, [formData.state, fetchDistributors]);
  useEffect(() => { if (formData.distributorName) fetchDealers(formData.distributorName); }, [formData.distributorName, fetchDealers]);
  useEffect(() => { if (formData.delerName) fetchDevices(formData.delerName); }, [formData.delerName, fetchDevices]);

  // --- Handlers ---
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (name === 'deviceNo') {
      const selected = deviceNumbers.find(d => d.barCodeNo === value);
      const sims = selected?.simDetails || [];
      setMappedSims(sims);
      setFormData(prev => ({ 
        ...prev, 
        simDetails: sims.map(s => s.simNo || s.iccidNo).join(', '),
        deviceType: selected?.deviceType || '',
        voltage: selected?.voltage || '',
        elementType: selected?.elementType || '',
        batchNo: selected?.batchNo || ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setToast({ message: '', type: null });

    try {
      const payload = {};
      for (const key in formData) {
        const value = formData[key];
        // Skip file fields
        if (value instanceof File || key.endsWith('_Doc') || key.endsWith('_Card') || key.endsWith('_Sticker')) {
          continue;
        }
        payload[key] = value ? String(value).trim() : "";
      }

      payload.simDetails = mappedSims || [];
      payload.packagePlanId = formData.Packages;

      const token = localStorage.getItem("token");
      if (!token) throw new Error("Authentication token missing");

      const response = await fetch(SUBMIT_API, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (!response.ok || result.success === false) throw new Error(result.message || "Submission failed");

      setToast({ message: "Device mapped successfully!", type: "success" });
      setIsModalOpen(false);
      setFormData(initialFormData);
      setMappedSims([]);
    } catch (error) {
      setToast({ message: error.message, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const renderFormInput = (name, label, type = "text", required = false) => (
    <div className="flex flex-col gap-2">
      <label className="text-xs font-bold text-yellow-500/80 uppercase tracking-wider">{label} {required && '*'}</label>
      <input
        type={type} name={name} value={formData[name] || ''} onChange={handleChange} required={required}
        placeholder={`Enter ${label}`}
        className="bg-black/40 border border-yellow-500/20 rounded-lg px-4 py-2.5 text-yellow-100 focus:border-yellow-500 outline-none transition-all placeholder:text-gray-600"
      />
    </div>
  );

  return (
    <div className="font-sans text-gray-200 min-h-screen bg-black">
      <ManufactureNavbar />
      <ToastNotification message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: null })} />

      <nav className="bg-black/80 backdrop-blur-xl border-b border-yellow-500/30 sticky top-0 z-40 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-yellow-500 p-2 rounded-lg text-black shadow-lg shadow-yellow-500/20"><MapPin size={24} /></div>
          <h1 className="text-2xl font-black bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">WEMIS MAPPING</h1>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="bg-yellow-500 text-black font-bold px-6 py-2.5 rounded-full hover:scale-105 transition-all flex items-center gap-2">
          <Smartphone size={18}/> Map Device
        </button>
      </nav>

      <div className="p-8"><DeviceMapreport /></div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-yellow-500/30 rounded-3xl w-full max-w-7xl max-h-[95vh] overflow-hidden flex flex-col shadow-2xl">
            
            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-gradient-to-b from-white/5 to-transparent">
              <div className="flex items-center gap-4">
                <div className="bg-yellow-500/10 p-3 rounded-2xl text-yellow-500"><ShieldCheck size={28}/></div>
                <div>
                  <h2 className="text-2xl font-black text-white">Map New Device</h2>
                  <p className="text-xs text-gray-500 font-medium">Link hardware to vehicle and customer profile</p>
                </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white p-2 rounded-full hover:bg-white/5"><X size={28}/></button>
            </div>

            <form id="mappingForm" onSubmit={handleSubmit} className="flex-grow overflow-y-auto p-8 space-y-12 custom-scrollbar">
              
              <section>
                <SectionHeader icon={MapPin} title="Hardware Allocation" />
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-yellow-500/80 uppercase">State *</label>
                    <select name="state" value={formData.state} onChange={handleChange} required className="bg-black/40 border border-yellow-500/20 rounded-lg px-4 py-2.5 text-yellow-100">
                      <option value="">Select State</option>
                      {['Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal'].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-yellow-500/80 uppercase">Distributor *</label>
                    <select name="distributorName" value={formData.distributorName} onChange={handleChange} required className="bg-black/40 border border-yellow-500/20 rounded-lg px-4 py-2.5 text-yellow-100">
                      <option value="">Select Distributor</option>
                      {distributors.map(d => <option key={d._id} value={d._id}>{d.contact_Person_Name}</option>)}
                    </select>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-yellow-500/80 uppercase">Dealer *</label>
                    <select name="delerName" value={formData.delerName} onChange={handleChange} required className="bg-black/40 border border-yellow-500/20 rounded-lg px-4 py-2.5 text-yellow-100">
                      <option value="">Select Dealer</option>
                      {dealers.map(d => <option key={d._id} value={d.name || d.business_Name}>{d.name || d.business_Name}</option>)}
                    </select>
                  </div>
                  {/* --- NEW FIELD ADDED HERE --- */}
                  {renderFormInput('deviceSendTo', 'Device Send To', 'text', true)}
                </div>
                
                <div className="max-w-md">
                   <label className="text-xs font-bold text-yellow-500/80 uppercase block mb-2">Package Plan *</label>
                   <select name="Packages" value={formData.Packages} onChange={handleChange} required className="w-full bg-black/60 border border-yellow-500/40 rounded-xl px-4 py-4 text-yellow-400 font-bold outline-none ring-2 ring-yellow-500/10">
                      <option value="">{walletLoading ? "Fetching..." : "Select Service Plan"}</option>
                      {walletHistory.map(p => <option key={p._id} value={p._id}>{p.packageName} — {p.elementName}</option>)}
                   </select>
                </div>
              </section>

              <section>
                <SectionHeader icon={Smartphone} title="Device & SIM Hardware" />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-yellow-500/80 uppercase">Device Serial *</label>
                    <select name="deviceNo" value={formData.deviceNo} onChange={handleChange} required className="bg-black/40 border border-yellow-500/40 rounded-lg px-4 py-2.5 text-yellow-400 font-bold">
                      <option value="">Select Serial</option>
                      {deviceNumbers.map(d => <option key={d.barCodeNo} value={d.barCodeNo}>{d.barCodeNo}</option>)}
                    </select>
                  </div>
                  {renderFormInput('deviceType', 'Device Type')}
                  {renderFormInput('voltage', 'Voltage')}
                  {renderFormInput('elementType', 'Element Type')}
                  {renderFormInput('batchNo', 'Batch No')}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 bg-black/20 p-6 rounded-2xl border border-white/5">
                  {!formData.deviceNo ? (
                    <p className="col-span-full text-center text-gray-500 py-4 italic">Select a device to view SIM details</p>
                  ) : mappedSims.length > 0 ? (
                    mappedSims.map((sim, i) => (
                      <div key={i} className="bg-black/40 border border-yellow-500/20 p-5 rounded-xl">
                        <h4 className="text-yellow-500 font-black mb-3 text-sm flex items-center gap-2"><Smartphone size={14}/> SIM {i+1}</h4>
                        <div className="space-y-1">
                          <PackageDetailItem label="SIM No" value={sim.simNo} />
                          <PackageDetailItem label="ICCID" value={sim.iccidNo} />
                          <PackageDetailItem label="Operator" value={sim.operator} />
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="col-span-full text-center text-red-400 py-4">No SIM records found for this device</p>
                  )}
                </div>
              </section>

              <section>
                <SectionHeader icon={Package} title="Vehicle Details" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {renderFormInput('vechileNo', 'Vehicle No', 'text', true)}
                  {renderFormInput('RegistrationNo', 'Registration No', 'text', true)}
                  {renderFormInput('VechileBirth', 'Vehicle Birth')}
                  {renderFormInput('date', 'Installation Date', 'date')}
                  {renderFormInput('ChassisNumber', 'Chassis Number')}
                  {renderFormInput('EngineNumber', 'Engine Number')}
                  {renderFormInput('VehicleType', 'Vehicle Type')}
                  {renderFormInput('MakeModel', 'Make/Model')}
                  {renderFormInput('ModelYear', 'Model Year')}
                  {renderFormInput('InsuranceRenewDate', 'Insurance Renew Date', 'date')}
                  {renderFormInput('PollutionRenewdate', 'Pollution Renew Date', 'date')}
                  {renderFormInput('VehicleKMReading', 'KM Reading')}
                  {renderFormInput('DriverLicenseNo', 'Driver License No')}
                  {renderFormInput('MappedDate', 'Mapped Date', 'date')}
                  {renderFormInput('NoOfPanicButtons', 'No. of Panic Buttons')}
                </div>
              </section>

              <section>
                <SectionHeader icon={User} title="Customer Profile" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {renderFormInput('fullName', 'Full Name', 'text', true)}
                  {renderFormInput('email', 'Email Address')}
                  {renderFormInput('mobileNo', 'Mobile Number')}
                  {renderFormInput('GstinNo', 'GSTIN')}
                  {renderFormInput('Customercountry', 'Country')}
                  {renderFormInput('Customerstate', 'State')}
                  {renderFormInput('Customerdistrict', 'District')}
                  {renderFormInput('Rto', 'RTO')}
                  {renderFormInput('PinCode', 'Pin Code')}
                  {renderFormInput('CompliteAddress', 'Complete Address')}
                  {renderFormInput('AdharNo', 'Aadhar No')}
                  {renderFormInput('PanNo', 'PAN No')}
                  {renderFormInput('InvoiceNo', 'Invoice No')}
                </div>
              </section>
            </form>

            <div className="p-8 border-t border-white/5 bg-black/40 backdrop-blur-md flex gap-4">
              <button onClick={() => setIsModalOpen(false)} className="px-8 py-3 rounded-xl border border-white/10 text-white font-bold hover:bg-white/5 transition-all flex-1">Cancel</button>
              <button type="submit" form="mappingForm" disabled={loading} className="flex-grow bg-gradient-to-r from-yellow-500 to-orange-500 text-black font-black text-lg py-3 rounded-xl shadow-xl flex items-center justify-center gap-3 disabled:opacity-50">
                {loading ? <Loader2 className="animate-spin"/> : <CheckCircle/>}
                CONFIRM MAPPING
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #333; border-radius: 10px; }
      `}</style>
    </div>
  );
}

export default App;