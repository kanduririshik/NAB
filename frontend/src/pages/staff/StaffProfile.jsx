import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { StaffAuth } from '../../services/api';
import { User, Phone, Mail, MapPin, Truck, Calendar, Shield, Lock, Loader2, Key, Edit2, Camera, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

export default function StaffProfile() {
  const { staff, updateStaffProfileState } = useAuth();
  
  // Password form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Edit details form state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [editForm, setEditForm] = useState({
    fullName: '',
    phone: '',
    email: '',
    address: '',
    profilePhoto: ''
  });

  const handleStartEdit = () => {
    setEditForm({
      fullName: staff?.fullName || '',
      phone: staff?.phone || '',
      email: staff?.email || '',
      address: staff?.address || '',
      profilePhoto: staff?.profilePhoto || ''
    });
    setEditDialogOpen(true);
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.warning('Image file must be smaller than 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setEditForm(prev => ({ ...prev, profilePhoto: reader.result }));
      toast.success('Avatar image uploaded!');
    };
    reader.readAsDataURL(file);
  };

  const handleSaveDetails = async (e) => {
    e.preventDefault();
    setLoadingDetails(true);
    try {
      const updatedAgent = {
        ...staff,
        fullName: editForm.fullName,
        phone: editForm.phone,
        email: editForm.email,
        address: editForm.address,
        profilePhoto: editForm.profilePhoto
      };

      // 1. Update local storage database
      const saved = JSON.parse(localStorage.getItem('nab_agents') || '[]');
      const updated = saved.map(a => a.id === staff.id ? updatedAgent : a);
      localStorage.setItem('nab_agents', JSON.stringify(updated));

      // 2. Broadcast local update to react context session
      updateStaffProfileState(updatedAgent);

      toast.success('Profile details updated successfully!');
      setEditDialogOpen(false);
    } catch (err) {
      toast.error(err.message || 'Failed to update profile.');
    } finally {
      setLoadingDetails(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.warning('New passwords do not match.');
      return;
    }
    if (newPassword.length < 6) {
      toast.warning('New password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    try {
      await StaffAuth.changePassword(staff.id, currentPassword, newPassword);
      
      // Update local storage password
      const saved = JSON.parse(localStorage.getItem('nab_agents') || '[]');
      const updated = saved.map(a => a.id === staff.id ? { ...a, password: newPassword } : a);
      localStorage.setItem('nab_agents', JSON.stringify(updated));

      toast.success('Password updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      toast.error(err.message || 'Failed to change password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6 text-left font-sans max-w-4xl relative"
    >
      {/* Header */}
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-3xl font-extrabold font-display text-slate-900 leading-tight">Staff Settings</h1>
        <p className="text-xs text-muted mt-1">Check your logistics registration details, shifts, and update password parameters.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Left Side: Avatar & Details Cards (col-span-2) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass bg-white border border-slate-100 p-6 rounded-2xl shadow-sm space-y-6 relative">
            
            {/* Edit Button */}
            <button 
              onClick={handleStartEdit} 
              className="absolute top-6 right-6 inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 hover:border-slate-350 hover:bg-slate-100 rounded-xl text-slate-600 hover:text-slate-900 transition-all font-bold text-[10px] uppercase cursor-pointer"
            >
              <Edit2 size={11} /> Edit Profile
            </button>

            <div className="flex flex-col sm:flex-row items-center gap-5 pb-5 border-b border-slate-100">
              <img
                src={staff?.profilePhoto || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200'}
                alt={staff?.fullName}
                className="w-20 h-20 rounded-2xl object-cover border-2 border-primary/20 shadow-sm flex-shrink-0"
              />
              <div className="text-center sm:text-left space-y-1 truncate w-full">
                <h3 className="font-display font-black text-slate-900 text-lg leading-snug">{staff?.fullName}</h3>
                <span className="text-xs text-slate-400 font-mono block">EMPLOYEE ID: {staff?.employeeId || 'N/A'}</span>
                <span className={`inline-flex items-center gap-1 text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                  staff?.availabilityStatus === 'Online' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-500'
                }`}>
                  Shift Status: {staff?.availabilityStatus || 'Offline'}
                </span>
              </div>
            </div>

            {/* Profile fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs text-slate-700 font-medium">
              {[
                { label: 'Registered Email', value: staff?.email, icon: <Mail size={14} className="text-slate-400" /> },
                { label: 'Telephone Contact', value: staff?.phone, icon: <Phone size={14} className="text-slate-400" /> },
                { label: 'Vehicle Allocation', value: staff?.vehicleType, icon: <Truck size={14} className="text-slate-400" /> },
                { label: 'License Plate Number', value: staff?.vehicleNumber, icon: <Shield size={14} className="text-slate-400" /> },
                { label: 'Primary Node Address', value: staff?.address, icon: <MapPin size={14} className="text-slate-400" />, span: true },
                { label: 'Joining Date', value: staff?.joiningDate, icon: <Calendar size={14} className="text-slate-400" /> },
                { label: 'Username (Auth)', value: staff?.username, icon: <User size={14} className="text-slate-400" /> }
              ].map((field, idx) => (
                <div key={idx} className={`space-y-1.5 p-3 rounded-xl border border-slate-50 bg-slate-50/30 ${field.span ? 'sm:col-span-2' : ''}`}>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">{field.label}</span>
                  <div className="flex items-center gap-2 text-slate-800 leading-normal">
                    {field.icon}
                    <span>{field.value || 'Not provided'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side: Change Password Form */}
        <div className="glass bg-white border border-slate-100 p-5 rounded-2xl shadow-sm text-left">
          <h3 className="font-display font-black text-slate-900 text-sm border-b border-slate-100 pb-3 mb-4 flex items-center gap-1.5">
            <Key size={16} className="text-primary" /> Update Password
          </h3>

          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Current Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock size={14} />
                </div>
                <input
                  type="password"
                  required
                  placeholder="Enter current password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="block w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-primary outline-none text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">New Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock size={14} />
                </div>
                <input
                  type="password"
                  required
                  placeholder="At least 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="block w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-primary outline-none text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Confirm New Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock size={14} />
                </div>
                <input
                  type="password"
                  required
                  placeholder="Repeat new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="block w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-primary outline-none text-xs"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer transition-all flex items-center justify-center gap-1.5"
            >
              {loading && <Loader2 className="animate-spin" size={14} />}
              Update Credentials
            </button>
          </form>
        </div>

      </div>

      {/* Edit Details Dialog Modal */}
      <AnimatePresence>
        {editDialogOpen && (
          <>
            {/* Backdrop */}
            <div 
              onClick={() => setEditDialogOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 pointer-events-auto"
            />
            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="fixed inset-x-4 bottom-4 top-4 md:inset-auto md:w-[500px] md:h-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 bg-white rounded-3xl z-50 p-6 shadow-2xl flex flex-col justify-between border border-slate-100 text-slate-800 pointer-events-auto"
            >
              <div className="overflow-y-auto space-y-4 flex-1 pr-1 text-left">
                {/* Modal Title */}
                <div className="flex justify-between items-start border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="font-display font-black text-lg text-slate-900">Edit Profile Details</h3>
                    <p className="text-[10px] text-slate-400 font-medium">Update your logistics contact details and avatar photo.</p>
                  </div>
                  <button onClick={() => setEditDialogOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer">
                    <X size={18} />
                  </button>
                </div>

                <form onSubmit={handleSaveDetails} className="space-y-4 text-xs font-semibold text-slate-700">
                  
                  {/* Profile Photo Upload Block */}
                  <div className="flex items-center gap-4 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                    <img
                      src={editForm.profilePhoto || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200'}
                      alt="Avatar Preview"
                      className="w-14 h-14 rounded-xl object-cover border border-slate-200 shadow-sm flex-shrink-0"
                    />
                    <div className="space-y-1.5 flex-1">
                      <span className="block text-[10px] text-slate-400 uppercase font-black tracking-wide leading-none">Avatar Photo</span>
                      <div className="flex items-center gap-2">
                        <label className="inline-flex items-center gap-1 px-3 py-1.5 bg-primary text-white text-[10px] font-bold uppercase rounded-lg hover:bg-primary/95 cursor-pointer shadow-sm">
                          <Camera size={12} /> Upload File
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handlePhotoUpload}
                            className="hidden"
                          />
                        </label>
                        {editForm.profilePhoto && (
                          <button
                            type="button"
                            onClick={() => setEditForm(prev => ({ ...prev, profilePhoto: '' }))}
                            className="px-2.5 py-1.5 bg-white border border-slate-200 text-slate-500 hover:text-red-500 rounded-lg text-[10px] font-bold uppercase cursor-pointer"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Input Fields */}
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[10px] text-slate-400 uppercase font-black tracking-wide mb-1">Full Name</label>
                      <input
                        type="text"
                        required
                        value={editForm.fullName}
                        onChange={(e) => setEditForm(prev => ({ ...prev, fullName: e.target.value }))}
                        className="block w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] text-slate-400 uppercase font-black tracking-wide mb-1">Phone Number</label>
                      <input
                        type="tel"
                        required
                        value={editForm.phone}
                        onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                        className="block w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] text-slate-400 uppercase font-black tracking-wide mb-1">Email Address</label>
                      <input
                        type="email"
                        required
                        value={editForm.email}
                        onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                        className="block w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] text-slate-400 uppercase font-black tracking-wide mb-1">Node Address</label>
                      <textarea
                        required
                        rows={2}
                        value={editForm.address}
                        onChange={(e) => setEditForm(prev => ({ ...prev, address: e.target.value }))}
                        className="block w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white outline-none resize-none font-sans"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] text-slate-400 uppercase font-black tracking-wide mb-1">Or Avatar URL Link</label>
                      <input
                        type="text"
                        placeholder="https://images.unsplash.com/..."
                        value={editForm.profilePhoto && editForm.profilePhoto.startsWith('data:') ? '' : editForm.profilePhoto}
                        onChange={(e) => setEditForm(prev => ({ ...prev, profilePhoto: e.target.value }))}
                        className="block w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white outline-none font-mono text-[10px]"
                      />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 border-t border-slate-100 pt-4 mt-2">
                    <button
                      type="button"
                      onClick={() => setEditDialogOpen(false)}
                      className="flex-1 py-2.5 border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-500 font-bold uppercase tracking-wider text-[10px] cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loadingDetails}
                      className="flex-1 py-2.5 bg-primary hover:bg-primary/95 text-white font-bold rounded-xl uppercase tracking-wider text-[10px] cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      {loadingDetails && <Loader2 className="animate-spin" size={12} />}
                      Save Details
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </motion.div>
  );
}
