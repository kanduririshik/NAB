import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { updateMe } from '../../services/api';
import Logo from '../../components/Logo';
import { Lock, Loader2, ArrowRight, ClipboardList, User, Building2, Phone, MapPin, Briefcase } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

export default function CompleteProfile() {
  const { user, logout, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    fullName: '',
    institutionType: 'Hospital',
    phone: '',
    gender: 'Other',
    occupation: 'Purchasing Representative',
    address: ''
  });

  // Handle auth loading while restoring session on mount/refresh
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="animate-spin text-primary" size={36} />
          <p className="text-xs text-muted font-medium">Verifying authorization...</p>
        </div>
      </div>
    );
  }

  // If unauthenticated -> redirect to /login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If already completed profile -> redirect to /home
  if (user.profileCompleted) {
    return <Navigate to="/home" replace />;
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleLogout = () => {
    logout();
    window.location.href = '/';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.fullName || !form.phone || !form.occupation || !form.address) {
      toast.error('Please fill in all mandatory fields.');
      return;
    }
    setLoading(true);
    try {
      // updates profile Completed to true and syncs with storage
      await updateMe({
        ...form,
        profile_completed: true
      });
      toast.success('Onboarding complete! Welcome to NAB Connect.');
      // Hard redirect
      window.location.href = '/';
    } catch (err) {
      toast.error(err.message || 'Onboarding failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-grid-pattern relative overflow-hidden text-left font-sans">
      {/* Background Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[400px] h-[400px] bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] bg-accent/10 rounded-full blur-[100px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full space-y-8 relative z-10"
      >
        <div className="text-center">
          <Logo showText={false} height={64} className="mx-auto" />
          <h2 className="mt-6 text-center text-3xl font-extrabold text-foreground font-display">
            Onboarding Profile
          </h2>
          <p className="mt-2 text-center text-sm text-muted">
            Mandatory setup required to access the B2B catalog
          </p>
        </div>

        <div className="glass-login-card rounded-xl p-8">
          <div className="mb-6 p-4 bg-primary/10 text-primary border-l-4 border-primary rounded-r text-xs font-semibold leading-relaxed flex items-start gap-2.5">
            <ClipboardList size={18} className="flex-shrink-0 mt-0.5" />
            <span>
              Welcome to NAB Connect, <strong>{user?.email}</strong>. To comply with wholesale drug licensing and chemical distribution rules, please provide representative registration credentials.
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Full Name */}
            <div>
              <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-1">
                Representative Full Name*
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted">
                  <User size={14} />
                </span>
                <input
                  type="text"
                  required
                  name="fullName"
                  value={form.fullName}
                  onChange={handleInputChange}
                  placeholder="John Doe"
                  className="block w-full pl-9 pr-3 py-2 bg-secondary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-xs"
                />
              </div>
            </div>

            {/* Institution Type selection */}
            <div>
              <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-1">
                Institution Type*
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted">
                  <Building2 size={14} />
                </span>
                <select
                  name="institutionType"
                  value={form.institutionType}
                  onChange={handleInputChange}
                  className="block w-full pl-9 pr-3 py-2 bg-secondary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-xs appearance-none"
                >
                  <option value="Hospital">Hospital</option>
                  <option value="Pharmacy">Pharmacy</option>
                  <option value="Clinic">Clinic</option>
                  <option value="Laboratory">Laboratory</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            {/* Designation / Occupation */}
            <div>
              <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-1">
                Designation / Occupation*
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted">
                  <Briefcase size={14} />
                </span>
                <input
                  type="text"
                  required
                  name="occupation"
                  value={form.occupation}
                  onChange={handleInputChange}
                  placeholder="Institutional Purchasing Manager"
                  className="block w-full pl-9 pr-3 py-2 bg-secondary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-xs"
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-1">
                Helpline Callback Phone*
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted">
                  <Phone size={14} />
                </span>
                <input
                  type="text"
                  required
                  name="phone"
                  value={form.phone}
                  onChange={handleInputChange}
                  placeholder="+91 99887 76655"
                  className="block w-full pl-9 pr-3 py-2 bg-secondary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-xs"
                />
              </div>
            </div>

            {/* Address Textarea */}
            <div>
              <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-1">
                Default Shipping Address*
              </label>
              <div className="relative">
                <span className="absolute top-2.5 left-3 pointer-events-none text-muted">
                  <MapPin size={14} />
                </span>
                <textarea
                  required
                  name="address"
                  rows={3}
                  value={form.address}
                  onChange={handleInputChange}
                  placeholder="Enter complete institutional address..."
                  className="block w-full pl-9 pr-3 py-2 bg-secondary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-xs resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={handleLogout}
                className="flex-1 h-11 border border-border hover:bg-secondary text-slate-700 text-xs font-semibold rounded-lg transition-all cursor-pointer"
              >
                Sign Out
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-[2] h-11 flex justify-center items-center gap-2 rounded-lg bg-primary hover:bg-primary/95 text-white text-xs font-bold transition-all shadow-md cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" size={14} /> Activating...
                  </>
                ) : (
                  <>
                    Complete <ArrowRight size={14} />
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-6 pt-4 border-t border-border flex justify-center items-center gap-1.5 text-[10px] text-muted">
            <Lock size={12} className="text-slate-400" /> Authorized pharmaceutical network check
          </div>
        </div>
      </motion.div>
    </div>
  );
}
