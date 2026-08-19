import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DeliveryAgent } from '../../services/api';
import { Search, Plus, Edit2, Trash2, Shield, User, MapPin, Truck, Calendar, ToggleLeft, ToggleRight, Loader2, X, Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

export default function AdminDeliveryAgents() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  
  // Dialog/Modal State
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  // Form state
  const [form, setForm] = useState({
    fullName: '',
    username: '',
    password: '',
    phone: '',
    email: '',
    address: '',
    vehicleType: 'Bike',
    vehicleNumber: '',
    employeeId: '',
    profilePhoto: '',
    status: 'Active'
  });

  // Fetch agents list
  const { data: agents = [], isLoading } = useQuery({
    queryKey: ['adminAgents'],
    queryFn: () => DeliveryAgent.list()
  });

  // Mutation for adding agent
  const createMutation = useMutation({
    mutationFn: (data) => DeliveryAgent.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminAgents'] });
      setDialogOpen(false);
      resetForm();
      toast.success('Delivery agent created successfully!');
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to create agent.');
    }
  });

  // Mutation for updating agent
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => DeliveryAgent.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminAgents'] });
      setDialogOpen(false);
      setEditingAgent(null);
      resetForm();
      toast.success('Delivery agent details updated!');
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to update agent details.');
    }
  });

  // Mutation for deleting agent
  const deleteMutation = useMutation({
    mutationFn: (id) => DeliveryAgent.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminAgents'] });
      toast.success('Agent removed from ledger.');
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to delete agent.');
    }
  });

  const resetForm = () => {
    setShowPassword(false);
    setForm({
      fullName: '',
      username: '',
      password: '',
      phone: '',
      email: '',
      address: '',
      vehicleType: 'Bike',
      vehicleNumber: '',
      employeeId: '',
      profilePhoto: '',
      status: 'Active'
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleStartEdit = (agent) => {
    setShowPassword(false);
    setEditingAgent(agent.id);
    setForm({
      fullName: agent.fullName || '',
      username: agent.username || '',
      password: agent.password || '',
      phone: agent.phone || '',
      email: agent.email || '',
      address: agent.address || '',
      vehicleType: agent.vehicleType || 'Bike',
      vehicleNumber: agent.vehicleNumber || '',
      employeeId: agent.employeeId || '',
      profilePhoto: agent.profilePhoto || '',
      status: agent.status || 'Active'
    });
    setDialogOpen(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to permanently delete this delivery agent?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleToggleStatus = (agent) => {
    const nextStatus = agent.status === 'Active' ? 'Inactive' : 'Active';
    updateMutation.mutate({
      id: agent.id,
      data: { status: nextStatus }
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingAgent) {
      updateMutation.mutate({ id: editingAgent, data: form });
    } else {
      createMutation.mutate(form);
    }
  };

  const filteredAgents = agents.filter(a => {
    const term = searchTerm.toLowerCase();
    return (
      a.fullName.toLowerCase().includes(term) ||
      a.employeeId.toLowerCase().includes(term) ||
      a.username.toLowerCase().includes(term)
    );
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6 text-left font-sans"
    >
      {/* Header */}
      <div className="border-b border-slate-200 pb-4 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold font-display text-slate-900 leading-tight">Delivery Agents Ledger</h1>
          <p className="text-xs text-muted mt-1">Manage institutional delivery personnel, allocate vehicles, and update shift states.</p>
        </div>

        <div className="flex gap-3 items-center w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-initial">
            <input
              type="text"
              placeholder="Search agents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-3.5 pr-8 py-2 bg-white border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-sky-400/20 focus:border-sky-400 outline-none text-xs text-slate-800"
            />
            <Search size={14} className="absolute right-3.5 top-2.5 text-slate-400" />
          </div>

          <button
            onClick={() => {
              setEditingAgent(null);
              resetForm();
              setDialogOpen(true);
            }}
            className="py-2 px-4 bg-primary hover:bg-sky-500 text-white font-bold text-xs rounded-xl shadow cursor-pointer flex items-center gap-1.5 flex-shrink-0"
          >
            <Plus size={16} /> Add Agent
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="py-20 flex justify-center items-center">
          <Loader2 className="animate-spin text-primary" size={36} />
        </div>
      ) : filteredAgents.length === 0 ? (
        <div className="py-20 text-center text-xs text-slate-400 bg-white border border-slate-100 rounded-2xl p-6">No delivery agents found.</div>
      ) : (
        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-slate-50 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-100">
                <th className="px-6 py-4">Agent</th>
                <th className="px-6 py-4">Employee ID</th>
                <th className="px-6 py-4">Contact Info</th>
                <th className="px-6 py-4">Vehicle Details</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filteredAgents.map(agent => (
                <tr key={agent.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={agent.profilePhoto || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200'}
                        alt={agent.fullName}
                        className="w-10 h-10 rounded-full object-cover border border-slate-100 shadow-sm"
                      />
                      <div>
                        <div className="font-bold text-slate-900 text-sm">{agent.fullName}</div>
                        <span className="text-[10px] text-slate-400 font-mono block mt-0.5">@{agent.username}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-mono font-bold text-slate-600">{agent.employeeId}</td>
                  <td className="px-6 py-4 leading-normal">
                    <div>{agent.email}</div>
                    <div className="text-slate-400 font-semibold mt-0.5">{agent.phone}</div>
                  </td>
                  <td className="px-6 py-4 leading-normal">
                    <div className="flex items-center gap-1">
                      <Truck size={12} className="text-slate-400" />
                      <span>{agent.vehicleType}</span>
                    </div>
                    <div className="font-mono text-slate-400 font-bold mt-0.5">{agent.vehicleNumber}</div>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleToggleStatus(agent)}
                      className={`inline-flex items-center gap-1.5 py-1 px-2.5 rounded-full text-[10px] font-black uppercase border cursor-pointer select-none transition-all ${
                        agent.status === 'Active'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                          : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                      }`}
                    >
                      {agent.status}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleStartEdit(agent)}
                        className="p-1.5 border border-slate-200 hover:border-primary text-slate-500 hover:text-primary rounded-lg transition-colors cursor-pointer"
                        title="Edit Details"
                      >
                        <Edit2 size={12} />
                      </button>
                      <button
                        onClick={() => handleDelete(agent.id)}
                        className="p-1.5 border border-slate-200 hover:border-destructive hover:bg-red-50 text-slate-500 hover:text-destructive rounded-lg transition-colors cursor-pointer"
                        title="Delete Agent"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add / Edit Dialog */}
      <AnimatePresence>
        {dialogOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={() => setDialogOpen(false)}
              className="fixed inset-0 bg-black z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="fixed inset-x-4 bottom-4 top-4 md:inset-auto md:w-[600px] md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 bg-white rounded-3xl z-50 p-6 shadow-2xl flex flex-col justify-between border border-slate-100 text-slate-800"
            >
              <div className="overflow-y-auto space-y-4 flex-1 pr-1 text-left">
                {/* Modal Title */}
                <div className="flex justify-between items-start border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="font-display font-black text-lg text-slate-900">
                      {editingAgent ? 'Edit Dispatcher Profile' : 'Register Logistics Agent'}
                    </h3>
                    <p className="text-[10px] text-slate-400 font-medium">Create staff login credentials and define transport rules.</p>
                  </div>
                  <button onClick={() => setDialogOpen(false)} className="p-1 text-slate-400 hover:text-slate-600"><X size={18} /></button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4 text-xs font-semibold text-slate-700">
                  {/* Grid Fields */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    
                    {/* General details */}
                    <div>
                      <label className="block text-[10px] text-slate-400 uppercase font-black tracking-wide mb-1">Full Name</label>
                      <input
                        type="text"
                        name="fullName"
                        required
                        placeholder="E.g. Ravi Kumar"
                        value={form.fullName}
                        onChange={handleInputChange}
                        className="block w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] text-slate-400 uppercase font-black tracking-wide mb-1">Employee ID</label>
                      <input
                        type="text"
                        name="employeeId"
                        required
                        placeholder="E.g. EMP-041"
                        value={form.employeeId}
                        onChange={handleInputChange}
                        className="block w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white outline-none font-mono font-bold"
                      />
                    </div>

                    {/* Contact details */}
                    <div>
                      <label className="block text-[10px] text-slate-400 uppercase font-black tracking-wide mb-1">Phone Number</label>
                      <input
                        type="tel"
                        name="phone"
                        required
                        placeholder="E.g. +91 98765 43210"
                        value={form.phone}
                        onChange={handleInputChange}
                        className="block w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] text-slate-400 uppercase font-black tracking-wide mb-1">Email Address</label>
                      <input
                        type="email"
                        name="email"
                        required
                        placeholder="E.g. ravi@nab.in"
                        value={form.email}
                        onChange={handleInputChange}
                        className="block w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white outline-none"
                      />
                    </div>

                    {/* Authentication details */}
                    <div>
                      <label className="block text-[10px] text-slate-400 uppercase font-black tracking-wide mb-1">Login Username</label>
                      <input
                        type="text"
                        name="username"
                        required
                        disabled={!!editingAgent}
                        placeholder="Username for staff portal"
                        value={form.username}
                        onChange={handleInputChange}
                        className="block w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white outline-none disabled:opacity-60"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] text-slate-400 uppercase font-black tracking-wide mb-1">Login Password</label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          name="password"
                          required={!editingAgent}
                          placeholder="Secure password"
                          value={form.password}
                          onChange={handleInputChange}
                          className="block w-full pl-3 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors focus:outline-none cursor-pointer"
                        >
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>

                    {/* Transport details */}
                    <div>
                      <label className="block text-[10px] text-slate-400 uppercase font-black tracking-wide mb-1">Vehicle Type</label>
                      <select
                        name="vehicleType"
                        value={form.vehicleType}
                        onChange={handleInputChange}
                        className="block w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white outline-none"
                      >
                        <option value="Bike">Bike</option>
                        <option value="Scooter">Scooter</option>
                        <option value="Mini-Van">Mini-Van</option>
                        <option value="Three-Wheeler">Three-Wheeler</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] text-slate-400 uppercase font-black tracking-wide mb-1">License Plate Number</label>
                      <input
                        type="text"
                        name="vehicleNumber"
                        required
                        placeholder="E.g. TS-09-EA-1234"
                        value={form.vehicleNumber}
                        onChange={handleInputChange}
                        className="block w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white outline-none font-mono"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-[10px] text-slate-400 uppercase font-black tracking-wide mb-1">Node Address</label>
                      <input
                        type="text"
                        name="address"
                        required
                        placeholder="Agent physical area details"
                        value={form.address}
                        onChange={handleInputChange}
                        className="block w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white outline-none"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-[10px] text-slate-400 uppercase font-black tracking-wide mb-1">Avatar Photo (URL Link)</label>
                      <input
                        type="url"
                        name="profilePhoto"
                        placeholder="HTTPS URL to photo"
                        value={form.profilePhoto}
                        onChange={handleInputChange}
                        className="block w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white outline-none font-mono text-[11px]"
                      />
                    </div>
                  </div>

                  <div className="border-t border-slate-100 pt-4 mt-5 flex justify-end gap-2.5">
                    <button
                      type="button"
                      onClick={() => setDialogOpen(false)}
                      className="py-2 px-4 border border-slate-200 text-slate-500 hover:bg-slate-50 font-bold text-xs rounded-xl cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={createMutation.isPending || updateMutation.isPending}
                      className="py-2 px-5 bg-primary hover:bg-sky-500 text-white font-bold text-xs rounded-xl shadow cursor-pointer flex items-center gap-1.5"
                    >
                      {editingAgent ? 'Save Changes' : 'Register Agent'}
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
