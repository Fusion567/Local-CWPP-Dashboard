import React, { useState, useEffect } from 'react';
import {
  ShieldCheck, Lock, User, ArrowRight, CheckCircle2,
  Globe, Zap, Eye, EyeOff, Activity, Search, Server
} from 'lucide-react';
import { motion } from 'framer-motion';

const FEATURES = [
  'Multi-account AWS scanning',
  'Real-time CVE detection',
  'Cross-region workload inventory',
  'IAM zero-trust access',
];

export default function LoginPage({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // Parallax effect for the left background
  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePos({
        x: (e.clientX / window.innerWidth - 0.5) * 20,
        y: (e.clientY / window.innerHeight - 0.5) * 20
      });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      onLogin();
    }, 1500);
  };

  return (
    <div className="flex w-full h-screen overflow-hidden bg-white text-slate-900 font-sans selection:bg-orange-500/30">
      
      {/* ─────────────────────────────────────────
          LEFT PANEL: Immersive Cyber/Cloud visual 
          ───────────────────────────────────────── */}
      <div className="relative hidden lg:flex flex-col justify-center w-[45%] lg:w-[50%] min-w-[480px] bg-[#0a0f1c] overflow-hidden border-r border-white/5">
        
        {/* Animated Background Mesh */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-[#0a0f1c] mix-blend-multiply opacity-50" />
          
          {/* Subtle Grid */}
          <div 
            className="absolute inset-0 opacity-[0.03]"
            style={{ 
              backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)',
              backgroundSize: '32px 32px' 
            }}
          />

          {/* Glowing Orbs with Parallax */}
          <div 
            className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full bg-indigo-600/20 blur-[140px] transition-transform duration-1000 ease-out"
            style={{ transform: `translate(${mousePos.x}px, ${mousePos.y}px)` }}
          />
          <div 
            className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-orange-600/15 blur-[120px] transition-transform duration-1000 ease-out"
            style={{ transform: `translate(${-mousePos.x}px, ${-mousePos.y}px)` }}
          />
        </div>

        {/* Floating Scanner Visuals */}
        <div className="absolute top-1/2 right-0 -translate-y-1/2 translate-x-1/4 w-[500px] h-[500px] pointer-events-none z-0 opacity-40">
           <div className="absolute inset-0 border border-white/10 rounded-full animate-[spin_60s_linear_infinite]" />
           <div className="absolute inset-8 border border-white/5 rounded-full animate-[spin_40s_linear_infinite_reverse]" />
           <div className="absolute top-1/4 right-1/4 w-3 h-3 bg-orange-500 rounded-full shadow-[0_0_15px_#f97316] animate-pulse" />
           <div className="absolute bottom-1/3 left-1/4 w-2 h-2 bg-indigo-500 rounded-full shadow-[0_0_10px_#6366f1] animate-[ping_3s_cubic-bezier(0,0,0.2,1)_infinite]" />
        </div>

        {/* Left Content */}
        <div className="relative z-10 px-12 lg:px-20">
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}
            className="flex items-center gap-4 mb-10"
          >
            <div className="w-12 h-12 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center shadow-[0_0_30px_rgba(249,115,22,0.15)]">
              <ShieldCheck className="text-orange-500" size={28} strokeWidth={2} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight">trigo</h2>
              <p className="text-[10px] font-bold text-slate-500 tracking-[0.2em] uppercase">Cloud Protection</p>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.1 }}>
            <h1 className="text-4xl lg:text-5xl font-black text-white leading-[1.15] tracking-tight mb-6">
              Agentless Security<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-300">
                At Cloud Scale
              </span>
            </h1>
            <p className="text-sm lg:text-base text-slate-400 leading-relaxed max-w-[420px] mb-12">
              Discover, prioritize, and remediate vulnerabilities across your AWS footprint in minutes. Zero agents, zero friction.
            </p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.7, delay: 0.3 }}
            className="space-y-4 mb-8"
          >
            {FEATURES.map((feat, i) => (
              <div key={i} className="flex items-center gap-3">
                <CheckCircle2 size={16} className="text-emerald-400" />
                <span className="text-sm text-slate-300">{feat}</span>
              </div>
            ))}
          </motion.div>

          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.7, delay: 0.5 }}
            className="flex flex-wrap gap-3"
          >
             <div className="px-3 py-1.5 rounded-full border border-white/10 bg-white/5 text-[10px] font-bold text-slate-400 uppercase tracking-widest backdrop-blur-sm">
                SOC 2 Type II
             </div>
             <div className="px-3 py-1.5 rounded-full border border-white/10 bg-white/5 text-[10px] font-bold text-slate-400 uppercase tracking-widest backdrop-blur-sm">
                ISO 27001
             </div>
          </motion.div>
        </div>
      </div>

      {/* ─────────────────────────────────────────
          RIGHT PANEL: Clean, crisp enterprise Form
          ───────────────────────────────────────── */}
      <div className="flex-1 flex flex-col justify-center items-center px-6 sm:px-12 bg-slate-50 relative">
        
        {/* Subtle top decoration for form panel */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 via-indigo-500 to-transparent opacity-20" />

        <div className="w-full max-w-[380px]">
          {/* Mobile Header (only shows < lg) */}
          <div className="flex lg:hidden items-center gap-3 mb-10">
            <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
              <ShieldCheck className="text-orange-500" size={24} strokeWidth={2} />
            </div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">trigo</h2>
          </div>

          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <h2 className="text-[26px] font-extrabold text-slate-900 tracking-tight mb-2">Welcome back</h2>
            <p className="text-sm text-slate-500 mb-8">Sign in to your security operations console.</p>
          </motion.div>

          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* Enterprise ID */}
            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4, delay: 0.1 }}>
              <label className="block text-[11px] font-bold tracking-widest uppercase text-slate-500 mb-1.5" htmlFor="username">
                Enterprise ID
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <User size={16} className="text-slate-400 group-focus-within:text-orange-500 transition-colors" />
                </div>
                <input
                  id="username"
                  type="text"
                  required
                  placeholder="name@company.com"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 outline-none transition-all placeholder:font-normal placeholder:text-slate-400 shadow-sm"
                />
              </div>
            </motion.div>

            {/* Password */}
            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4, delay: 0.2 }}>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[11px] font-bold tracking-widest uppercase text-slate-500" htmlFor="password">
                  Password
                </label>
                <button type="button" className="text-[11px] font-bold text-orange-500 hover:text-orange-600 transition-colors">
                  Forgot?
                </button>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Lock size={16} className="text-slate-400 group-focus-within:text-orange-500 transition-colors" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 outline-none transition-all placeholder:font-normal placeholder:text-slate-400 shadow-sm font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </motion.div>

            {/* Submit Button */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.3 }} className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="relative w-full py-3.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-bold shadow-[0_4px_14px_rgba(0,0,0,0.1)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.15)] transition-all flex items-center justify-center overflow-hidden disabled:opacity-80 disabled:cursor-not-allowed group"
              >
                {/* Button shine effect */}
                <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Authenticating...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span>Authorize Session</span>
                    <ArrowRight size={16} />
                  </div>
                )}
              </button>
            </motion.div>
          </form>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.4 }}>
            {/* Divider */}
            <div className="flex items-center gap-4 my-8">
              <div className="flex-1 h-px bg-slate-200" />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Or continue with</span>
              <div className="flex-1 h-px bg-slate-200" />
            </div>

            {/* SSO Options */}
            <div className="grid grid-cols-2 gap-3 mb-8">
              <button className="flex items-center justify-center gap-2 py-2.5 px-4 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm">
                <Globe size={14} className="text-indigo-500" />
                <span className="text-xs font-bold text-slate-700">SAML 2.0</span>
              </button>
              <button className="flex items-center justify-center gap-2 py-2.5 px-4 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm">
                <Zap size={14} className="text-amber-500" />
                <span className="text-xs font-bold text-slate-700">IAM Role</span>
              </button>
            </div>

            {/* Footer */}
            <p className="text-center text-xs text-slate-500 leading-relaxed">
              By signing in, you agree to our{' '}
              <a href="#" className="font-semibold text-slate-700 hover:text-orange-500 transition-colors">Terms of Service</a>
              {' '}and{' '}
              <a href="#" className="font-semibold text-slate-700 hover:text-orange-500 transition-colors">Privacy Policy</a>.
            </p>
          </motion.div>

        </div>
      </div>
      
      {/* Required for the button shimmer effect */}
      <style>{`
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}
