import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import Logo from '../../components/Logo';
import { ShieldAlert, User, Lock, Loader2, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AdminLogin() {
  const { adminLogin } = useAuth();
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      await adminLogin(username, password);
      // Direct redirect to admin console
      window.location.href = '/admin';
    } catch (err) {
      setError(err.message || 'Invalid administrator credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-grid-pattern relative overflow-hidden font-sans">
      {/* Red ambient neon light to demarcate Secure Admin zone */}
      <div className="absolute top-[-30%] right-[-10%] w-[600px] h-[600px] bg-red-500/10 rounded-full blur-[140px] pointer-events-none"></div>
      <div className="absolute bottom-[-30%] left-[-10%] w-[600px] h-[600px] bg-primary/5 rounded-full blur-[140px] pointer-events-none"></div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full space-y-8 relative z-10 text-left"
      >
        <div className="flex flex-col items-center">
          <Logo showText={false} height={64} color="#FFFFFF" dnaColor="#0f172a" className="mx-auto" />
          <div className="mt-6 inline-flex items-center gap-1.5 py-1 px-3 rounded-full bg-red-500/10 border border-red-500/20 text-[10px] font-bold tracking-widest text-red-400 uppercase">
            <ShieldAlert size={12} /> SECURE ADMINISTRATOR GATEWAY
          </div>
        </div>

        <div className="bg-slate-800/80 backdrop-blur-md border border-slate-700/60 rounded-3xl shadow-2xl p-8 sm:p-10 text-white">
          <h2 className="text-xl font-bold font-display text-center mb-6">Admin Authentication</h2>
          
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
                  id="nab_admin_user_input"
                  name="nab_admin_user_input"
                  autoComplete="off"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter administrator username"
                  className="block w-full pl-10 pr-4 py-2.5 bg-slate-900/50 border border-slate-700 rounded-xl focus:bg-slate-900 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-xs text-white placeholder-slate-600 transition-all"
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
                  id="nab_admin_pass_input"
                  name="nab_admin_pass_input"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter administrator password"
                  className="block w-full pl-10 pr-4 py-2.5 bg-slate-900/50 border border-slate-700 rounded-xl focus:bg-slate-900 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-xs text-white placeholder-slate-600 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-lg text-xs font-semibold text-white bg-primary hover:bg-primary/95 transition-all cursor-pointer disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin" size={16} /> : 'Access Command Board'}
              {!loading && <ArrowRight size={16} />}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
