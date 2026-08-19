import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import Logo from '../../components/Logo';
import { ShieldCheck, User, Lock, Loader2, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

export default function StaffLogin() {
  const { staffLogin } = useAuth();
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      await staffLogin(username, password);
      // Direct redirect to staff console
      window.location.href = '/staff';
    } catch (err) {
      setError(err.message || 'Invalid staff credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
      {/* Sky ambient neon light to demarcate Staff zone */}
      <div className="absolute top-[-30%] right-[-10%] w-[600px] h-[600px] bg-sky-500/10 rounded-full blur-[140px] pointer-events-none"></div>
      <div className="absolute bottom-[-30%] left-[-10%] w-[600px] h-[600px] bg-teal-500/5 rounded-full blur-[140px] pointer-events-none"></div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full space-y-8 relative z-10 text-left"
      >
        <div className="flex flex-col items-center">
          <div className="bg-white p-2 rounded-2xl flex items-center justify-center shadow-lg">
            <Logo showText={false} height={64} className="mx-auto" />
          </div>
          <div className="mt-6 inline-flex items-center gap-1.5 py-1 px-3 rounded-full bg-sky-500/10 border border-sky-500/20 text-[10px] font-bold tracking-widest text-sky-400 uppercase">
            <ShieldCheck size={12} /> SECURE STAFF GATEWAY
          </div>
        </div>

        <div className="bg-slate-800/80 backdrop-blur-md border border-slate-700/60 rounded-3xl shadow-2xl p-8 sm:p-10 text-white">
          <h2 className="text-xl font-bold font-display text-center mb-6">Staff Authentication</h2>
          
          {error && (
            <div className="mb-5 p-3.5 bg-red-950/50 border-l-4 border-red-500 text-red-200 text-xs rounded-r-lg font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username */}
            <div className="text-left">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Username</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <User size={16} />
                </div>
                <input
                  type="text"
                  required
                  id="nab_staff_user_input"
                  name="username"
                  autoComplete="off"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter staff username"
                  className="block w-full pl-10 pr-4 py-2.5 bg-slate-900/50 border border-slate-700 rounded-xl focus:bg-slate-900 focus:ring-2 focus:ring-sky-400/20 focus:border-sky-400 outline-none text-xs text-white placeholder-slate-600 transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div className="text-left">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock size={16} />
                </div>
                <input
                  type="password"
                  required
                  id="nab_staff_pass_input"
                  name="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter staff password"
                  className="block w-full pl-10 pr-4 py-2.5 bg-slate-900/50 border border-slate-700 rounded-xl focus:bg-slate-900 focus:ring-2 focus:ring-sky-400/20 focus:border-sky-400 outline-none text-xs text-white placeholder-slate-600 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-lg text-xs font-semibold text-white bg-primary hover:bg-sky-500 transition-all cursor-pointer disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin" size={16} /> : 'Access Dispatch Dashboard'}
              {!loading && <ArrowRight size={16} />}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
