import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { base44 } from '../../services/api';
import { User, ShieldCheck, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

export default function Profile() {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    phone: profile?.phone || '',
    gender: profile?.gender || 'Male',
    occupation: profile?.occupation || '',
    address: profile?.address || ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await base44.auth.updateMe({
        ...form,
        fullName: profile?.fullName, // retain read-only name
        email: profile?.email || user?.email
      });
      toast.success('Profile updated!');
    } catch (err) {
      toast.error(err.message || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 pb-16 text-left font-sans">
      <div>
        <h1 className="text-3xl font-extrabold font-display text-foreground border-b border-border pb-4 flex items-center gap-2">
          <User className="text-primary" /> Profile Management
        </h1>
        <p className="text-xs text-muted mt-1">Manage institutional representative settings and delivery locations.</p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-login-card rounded-2xl p-6 sm:p-8 space-y-6"
      >
        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            
            {/* Full Name (Read-only) */}
            <div>
              <label className="block text-[10px] font-bold text-muted uppercase tracking-wider mb-1.5">
                Full Representative Name (Read-only)
              </label>
              <input
                type="text"
                readOnly
                value={profile?.fullName || ''}
                className="block w-full px-3.5 py-2.5 bg-secondary border border-border rounded-xl focus:outline-none text-xs text-slate-500 font-semibold cursor-not-allowed"
              />
            </div>

            {/* Email (Read-only) */}
            <div>
              <label className="block text-[10px] font-bold text-muted uppercase tracking-wider mb-1.5">
                Institutional Email (Read-only)
              </label>
              <input
                type="email"
                readOnly
                value={profile?.email || user?.email || ''}
                className="block w-full px-3.5 py-2.5 bg-secondary border border-border rounded-xl focus:outline-none text-xs text-slate-500 font-semibold cursor-not-allowed"
              />
            </div>

            {/* Phone (Editable) */}
            <div>
              <label className="block text-[10px] font-bold text-muted uppercase tracking-wider mb-1.5">
                Helpline Callbacks Phone
              </label>
              <input
                type="text"
                required
                name="phone"
                value={form.phone}
                onChange={handleInputChange}
                placeholder="+91 99887 76655"
                className="block w-full px-3.5 py-2.5 bg-white border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-xs"
              />
            </div>

            {/* Gender (Select) */}
            <div>
              <label className="block text-[10px] font-bold text-muted uppercase tracking-wider mb-1.5">
                Gender Designation
              </label>
              <select
                name="gender"
                value={form.gender}
                onChange={handleInputChange}
                className="block w-full px-3.5 py-2.5 bg-white border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-xs"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Occupation (Editable) */}
            <div className="sm:col-span-2">
              <label className="block text-[10px] font-bold text-muted uppercase tracking-wider mb-1.5">
                Occupation / Designation
              </label>
              <input
                type="text"
                required
                name="occupation"
                value={form.occupation}
                onChange={handleInputChange}
                placeholder="Institutional Procurement Officer"
                className="block w-full px-3.5 py-2.5 bg-white border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-xs"
              />
            </div>

            {/* Address (Textarea, Editable) */}
            <div className="sm:col-span-2">
              <label className="block text-[10px] font-bold text-muted uppercase tracking-wider mb-1.5">
                Default Shipping Address
              </label>
              <textarea
                required
                name="address"
                rows={4}
                value={form.address}
                onChange={handleInputChange}
                placeholder="Enter full shipping credentials..."
                className="block w-full px-3.5 py-2.5 bg-white border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-xs resize-none"
              />
            </div>

          </div>

          <div className="border-t border-border pt-6 flex justify-between items-center text-[11px] text-muted">
            <span className="flex items-center gap-1">
              <ShieldCheck size={14} className="text-emerald-600" /> Fully Encrypted Procurement
            </span>

            <button
              type="submit"
              disabled={loading}
              className="py-3 px-6 bg-primary hover:bg-primary/95 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer transition-colors flex items-center gap-1.5"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={14} /> Saving…
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
