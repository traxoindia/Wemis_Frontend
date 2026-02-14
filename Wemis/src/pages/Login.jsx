
// import React, { useContext, useState } from "react";
// import { motion } from "framer-motion";
// import { FaEye, FaEyeSlash } from "react-icons/fa";
// import { toast } from "react-toastify";
// import Loginn from "../Images/Login2.png";
// import axios from "axios";
// import { UserAppContext } from "../contexts/UserAppProvider";
// import { useNavigate } from "react-router-dom";
// import "react-toastify/dist/ReactToastify.css";

// export default function Login() {
//   const [showPassword, setShowPassword] = useState(false);
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [loading, setLoading] = useState(false);
//   const { login } = useContext(UserAppContext);
//   const navigate = useNavigate();

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setLoading(true);
//     try {
//       const response = await axios.post(
//         "https://api.websave.in/api/superadmin/login",
//         { email, password }
//       );

//       if (response.data?.token && response.data?.user) {
//         login(response.data.token, response.data.user);
//         toast.success("Login Successful!", { position: "top-right" });

//         // Redirect after short delay
//         setTimeout(() => {
//           switch (response.data.user.role) {
//             case "superadmin":
//               navigate("/superadmin/dashboard");
//               break;
//             case "admin":
//               navigate("/admin/dashboard");
//               break;
//             case "wlp":
//               navigate("/wlp/dashboard");
//               break;
//             case "distibutor":
//               navigate("/distibutor/dashboard");
//               break;
//             case "oem":
//               navigate("/Oem/dashboard");
//               break;
//             case "dealer-oem":
//               navigate("/dealer-oem/dashboard");
//               break;
//             case "dealer-distributor":
//               navigate("distributor/dealer/dashboard");
//               break;
//                case "coustmer":
//               navigate("/customer/dashboard");
//               break;
//             default:
//               navigate("/manufacturer/dashboard");
//           }
//         }, 1500);
//       } else {
//         toast.error("Invalid credentials. Please try again.", {
//           position: "top-right",
//         });
//       }
//     } catch (error) {
//       toast.error("Login failed! " + error.message, { position: "top-right" });
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-yellow-200 via-yellow-500 to-yellow-600 flex items-center justify-center px-4 relative">
//       {/* Loading Overlay */}
//       {loading && (
//         <motion.div
//           className="absolute inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50"
//           initial={{ opacity: 0 }}
//           animate={{ opacity: 1 }}
//         >
//           <motion.div
//             className="w-16 h-16 border-4 border-yellow-300 border-t-transparent rounded-full animate-spin shadow-lg"
//             initial={{ scale: 0.8, rotate: 0 }}
//             animate={{ scale: 1, rotate: 360 }}
//             transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
//           />
//         </motion.div>
//       )}

//       <motion.div
//         initial={{ opacity: 0, scale: 0.95 }}
//         animate={{ opacity: 1, scale: 1 }}
//         transition={{ duration: 0.7, ease: "easeOut" }}
//         className="w-full max-w-6xl h-[90vh] flex flex-col md:flex-row rounded-2xl overflow-hidden shadow-2xl border border-black/40"
//       >
//         {/* Left Side Image */}
//         <div className="hidden md:flex md:flex-1 relative">
//           <img src={Loginn} alt="Login Visual" className="object-cover w-full h-full" />
//           <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>
//         </div>

//         {/* Right Side Form */}
//         <motion.div
//           initial={{ opacity: 0, x: 60 }}
//           animate={{ opacity: 1, x: 0 }}
//           transition={{ duration: 0.8, ease: "easeOut" }}
//           className="flex flex-col justify-center flex-1 px-8 sm:px-14 lg:px-20 bg-black/90 backdrop-blur-xl text-white"
//         >
//           <h2 className="text-3xl font-extrabold mb-2">Traxo India Automation</h2>
//           <h1 className="text-yellow-400 text-4xl font-bold mb-4">Login to Your Account</h1>
//           <form className="space-y-6 max-w-md w-full" onSubmit={handleSubmit}>
//             {/* Email Field */}
//             <div>
//               <label className="block mb-2 text-yellow-300 text-sm" htmlFor="email">
//                 Email Address
//               </label>
//               <input
//                 type="email"
//                 id="email"
//                 placeholder="Enter Your Email"
//                 value={email}
//                 onChange={(e) => setEmail(e.target.value)}
//                 className="w-full rounded-lg bg-black bg-opacity-80 border border-yellow-400 text-yellow-300 text-sm px-4 py-3"
//               />
//             </div>

//             {/* Password Field */}
//             <div>
//               <label className="block mb-2 text-yellow-300 text-sm" htmlFor="password">
//                 Password
//               </label>
//               <div className="relative">
//                 <input
//                   type={showPassword ? "text" : "password"}
//                   id="password"
//                   placeholder="Enter Your Password"
//                   value={password}
//                   onChange={(e) => setPassword(e.target.value)}
//                   className="w-full rounded-lg bg-black bg-opacity-80 border border-yellow-400 text-yellow-300 text-sm px-4 py-3 pr-10"
//                 />
//                 <button
//                   type="button"
//                   className="absolute inset-y-0 right-3 text-yellow-400"
//                   onClick={() => setShowPassword(!showPassword)}
//                 >
//                   {showPassword ? <FaEye /> : <FaEyeSlash />}
//                 </button>
//               </div>
//             </div>

//             {/* Login Button */}
//             <motion.button
//               whileHover={{ scale: 1.03 }}
//               whileTap={{ scale: 0.97 }}
//               type="submit"
//               disabled={loading}
//               className={`w-full bg-black text-yellow-400 border border-yellow-400 py-3 rounded-lg ${loading ? "opacity-50 cursor-not-allowed" : ""
//                 }`}
//             >
//               {loading ? "Logging in..." : "Login"}
//             </motion.button>
//           </form>
//         </motion.div>
//       </motion.div>
//     </div>
//   );
// }
import React, { useContext, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaEye, FaEyeSlash, FaShieldAlt, FaUser, FaLock, FaTerminal, FaFingerprint, FaMicrochip, FaNetworkWired } from "react-icons/fa";
import { toast, Toaster } from "react-hot-toast";
import Loginn from "../Images/Login2.png"; 
import axios from "axios";
import { UserAppContext } from "../contexts/UserAppProvider";
import { useNavigate } from "react-router-dom";

// Helper for the "Hacker" terminal logs
const BOOT_LOGS = [
 "Traxo India Automation Pvt Ltd - WEMIS SECURE BOOT SEQUENCE INITIATED",
];

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isBooting, setIsBooting] = useState(true);
  const [logIndex, setLogIndex] = useState(0);
  
  const { login } = useContext(UserAppContext);
  const navigate = useNavigate();

  // Boot Sequence Logic
  useEffect(() => {
    if (logIndex < BOOT_LOGS.length) {
      const timer = setTimeout(() => setLogIndex(prev => prev + 1), 400);
      return () => clearTimeout(timer);
    } else {
      setTimeout(() => setIsBooting(false), 800);
    }
  }, [logIndex]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return toast.error("ACCESS_DENIED: CREDENTIALS_MISSING");
    
    setLoading(true);
    try {
      const response = await axios.post("https://api.websave.in/api/superadmin/login", { email, password });
      if (response.data?.token && response.data?.user) {
        login(response.data.token, response.data.user);
        toast.success("IDENTITY_CONFIRMED", { 
            style: { background: '#000', color: '#fbbf24', border: '1px solid #fbbf24' } 
        });
        
        setTimeout(() => {
          const roleMap = {
            superadmin: "/superadmin/dashboard",
            admin: "/admin/dashboard",
            wlp: "/wlp/dashboard",
            distibutor: "/distibutor/dashboard",
            oem: "/Oem/dashboard",
            "dealer-oem": "/dealer-oem/dashboard",
            "dealer-distributor": "distributor/dealer/dashboard",
            customer: "/customer/dashboard"
          };
          navigate(roleMap[response.data.user.role] || "/manufacturer/dashboard");
        }, 1500);
      }
    } catch (error) {
      toast.error("ENCRYPTION_MISMATCH");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020202] flex items-center justify-center p-4 selection:bg-yellow-500/40 overflow-hidden font-mono">
      <Toaster position="top-right" />
      
      {/* BACKGROUND DATA STREAM */}
      <div className="fixed inset-0 pointer-events-none opacity-20">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] brightness-50" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px]" />
      </div>

      <AnimatePresence mode="wait">
        {isBooting ? (
          /* --- ADVANCED BOOT LOADER --- */
          <motion.div 
            key="boot"
            exit={{ opacity: 0, scale: 0.9, filter: "blur(10px)" }}
            className="z-50 w-full max-w-md"
          >
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-yellow-500/10 border border-yellow-500/50 rounded-full animate-pulse">
                    <FaMicrochip className="text-yellow-500 text-xl" />
                </div>
                <div>
                    <h3 className="text-white text-xl font-black tracking-[0.3em]">WEMIS_SECURE_BOOT</h3>
                  
                </div>
              </div>
              
              <div className="bg-white/[0.03] border border-white/10 p-6 rounded-lg backdrop-blur-md">
                {BOOT_LOGS.slice(0, logIndex).map((log, i) => (
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }} 
                    animate={{ opacity: 1, x: 0 }} 
                    key={i} 
                    className="flex gap-3 text-[10px] mb-2"
                  >
                    <span className="text-yellow-500/40">[{i+1}0%]</span>
                    <span className="text-white/70 tracking-tighter">{log}</span>
                  </motion.div>
                ))}
                <motion.div 
                    animate={{ opacity: [0, 1] }} 
                    transition={{ repeat: Infinity, duration: 0.8 }}
                    className="w-2 h-4 bg-yellow-500 inline-block ml-10 mt-2"
                />
              </div>
            </div>
          </motion.div>
        ) : (
          /* --- MAIN INTERFACE --- */
          <motion.div 
            key="login"
            initial={{ opacity: 0, clipPath: "inset(50% 0 50% 0)" }}
            animate={{ opacity: 1, clipPath: "inset(0% 0 0% 0)" }}
            transition={{ duration: 0.6, ease: "circOut" }}
            className="relative w-full max-w-5xl flex flex-col md:flex-row bg-[#080808] border border-white/10 shadow-[0_0_100px_rgba(0,0,0,1)]"
          >
            {/* Visual Side Bar */}
            <div className="hidden md:flex w-[100px] border-r border-white/5 flex-col items-center py-10 justify-between bg-black">
                <FaNetworkWired className="text-yellow-500 text-xl" />
                <div className="rotate-90 text-[10px] tracking-[1em] text-white/20 whitespace-nowrap uppercase font-black">
                    Secure_Access_Point
                </div>
                <div className="w-1 h-12 bg-gradient-to-b from-yellow-500 to-transparent" />
            </div>

            {/* Content Area */}
            <div className="flex-1 flex flex-col md:flex-row">
                <div className="hidden md:block w-5/12 relative overflow-hidden group">
                    <img 
                        src={Loginn} 
                        alt="Hero" 
                        className="h-full w-full object-cover grayscale transition-transform duration-700 group-hover:scale-110 opacity-40" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-black via-transparent to-transparent" />
                    <div className="absolute bottom-10 left-10">
                        <h2 className="text-white text-5xl font-black italic leading-none">
                            WEMIS<span className="text-yellow-500">.</span>
                        </h2>
                        <p className="text-white/30 text-[9px] mt-4 tracking-[0.2em]">OPERATING SINCE 2026</p>
                    </div>
                </div>

                <div className="flex-1 p-8 md:p-16 relative">
                    {/* Interactive Fingerprint Loader */}
                    <AnimatePresence>
                        {loading && (
                            <motion.div 
                                initial={{ opacity: 0 }} 
                                animate={{ opacity: 1 }} 
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center"
                            >
                                <div className="relative">
                                    <motion.div 
                                        animate={{ rotate: 360 }}
                                        transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
                                        className="w-24 h-24 border-t-2 border-b-2 border-yellow-500 rounded-full"
                                    />
                                    <FaFingerprint className="absolute inset-0 m-auto text-4xl text-yellow-500 animate-pulse" />
                                </div>
                                <p className="mt-6 text-yellow-500 text-[10px] font-black tracking-[0.5em] uppercase">Authenticating Biometrics</p>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="mb-12">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                            <h1 className="text-white text-lg font-black uppercase tracking-widest">Operator Login</h1>
                        </div>
                        <p className="text-white/20 text-[9px] uppercase">Verify credentials to initialize session</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-8">
                        <div className="space-y-6">
                            <div className="group relative">
                                <label className="text-white/30 text-[8px] font-black uppercase tracking-[0.3em] mb-2 block group-focus-within:text-yellow-500 transition-colors">Operator_UID</label>
                                <div className="flex items-center gap-3 border border-white/10 bg-white/[0.02] p-4 group-focus-within:border-yellow-500 transition-all">
                                    <FaUser className="text-white/10 group-focus-within:text-yellow-500" />
                                    <input 
                                        type="email" 
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="bg-transparent w-full outline-none text-white text-xs uppercase" 
                                        placeholder="user@wemis.systems"
                                    />
                                </div>
                            </div>

                            <div className="group relative">
                                <label className="text-white/30 text-[8px] font-black uppercase tracking-[0.3em] mb-2 block group-focus-within:text-yellow-500 transition-colors">Access_Hash</label>
                                <div className="flex items-center gap-3 border border-white/10 bg-white/[0.02] p-4 group-focus-within:border-yellow-500 transition-all">
                                    <FaShieldAlt className="text-white/10 group-focus-within:text-yellow-500" />
                                    <input 
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="bg-transparent w-full outline-none text-white text-xs" 
                                        placeholder="••••••••••••"
                                    />
                                    <button 
                                        type="button" 
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="text-white/20 hover:text-white transition-colors"
                                    >
                                        {showPassword ? <FaEyeSlash /> : <FaEye />}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <button 
                            disabled={loading}
                            className="w-full bg-yellow-500 p-5 text-black font-black text-[10px] tracking-[0.5em] uppercase hover:bg-yellow-400 transition-all active:scale-95 disabled:opacity-50"
                        >
                            Establish Link
                        </button>
                    </form>

                    <div className="mt-12 pt-8 border-t border-white/5 flex justify-between items-center text-[8px] font-black text-white/20">
                        <div className="hover:text-yellow-500 cursor-pointer transition-colors uppercase">System Reset</div>
                        <div className="flex items-center gap-4">
                            <span>V4.0.2_STABLE</span>
                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        </div>
                    </div>
                </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
