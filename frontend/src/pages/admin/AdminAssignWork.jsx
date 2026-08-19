import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Order, DeliveryAgent, Assignment } from '../../services/api';
import { ClipboardList, UserCheck, ShieldCheck, MapPin, Clock, Calendar, Check, AlertTriangle, ChevronRight, User, Loader2, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

export default function AdminAssignWork() {
  const queryClient = useQueryClient();
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedAgent, setSelectedAgent] = useState('');
  const [priority, setPriority] = useState('Normal');

  // Load all orders
  const { data: orders = [], isLoading: loadingOrders } = useQuery({
    queryKey: ['adminOrders'],
    queryFn: () => Order.list('-created_date', 1000)
  });

  // Load delivery agents
  const { data: agents = [], isLoading: loadingAgents } = useQuery({
    queryKey: ['adminAgents'],
    queryFn: () => DeliveryAgent.list()
  });

  // Load assignments
  const { data: assignments = [], isLoading: loadingAssignments } = useQuery({
    queryKey: ['adminAssignments'],
    queryFn: () => Assignment.list()
  });

  // Filter orders that are 'Confirmed' and do NOT have an active assignment
  const unassignedOrders = orders.filter(o => 
    o.status === 'Confirmed' && !assignments.some(a => a.orderId === o.id)
  );

  // Filter active agents and count their active assignments
  const activeAgents = agents.filter(a => a.status === 'Active').map(agent => {
    const activeTasks = assignments.filter(asg => 
      asg.agentId === agent.id && ['Assigned', 'Accepted', 'Picked Up', 'Out For Delivery'].includes(asg.status)
    ).length;
    return { ...agent, activeTasks };
  });

  // Assign work mutation
  const assignMutation = useMutation({
    mutationFn: ({ orderId, agentId, priority }) => {
      // In db.js, assignOrder generates a default priority, let's override/ensure the priority matches choice
      return Assignment.assign(orderId, agentId).then(res => {
        // Retrieve and update priority in local storage
        const saved = JSON.parse(localStorage.getItem('nab_assignments') || '[]');
        const updated = saved.map(a => a.orderId === orderId ? { ...a, priority } : a);
        localStorage.setItem('nab_assignments', JSON.stringify(updated));
        return updated.find(a => a.orderId === orderId);
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminOrders'] });
      queryClient.invalidateQueries({ queryKey: ['adminAssignments'] });
      setSelectedOrder(null);
      setSelectedAgent('');
      setPriority('Normal');
      toast.success('Work assigned and dispatched successfully!');
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to assign work.');
    }
  });

  const handleAssign = (e) => {
    e.preventDefault();
    if (!selectedOrder) {
      toast.warning('Please select an order to assign.');
      return;
    }
    if (!selectedAgent) {
      toast.warning('Please select a delivery agent.');
      return;
    }

    assignMutation.mutate({
      orderId: selectedOrder.id,
      agentId: selectedAgent,
      priority
    });
  };

  // Compile active assignments summary table
  const activeAssignmentsList = assignments.filter(asg => 
    ['Assigned', 'Accepted', 'Picked Up', 'Out For Delivery'].includes(asg.status)
  ).map(asg => {
    const orderDetails = orders.find(o => o.id === asg.orderId);
    return { ...asg, orderDetails };
  }).filter(item => !!item.orderDetails);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6 text-left font-sans"
    >
      {/* Header */}
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-3xl font-extrabold font-display text-slate-900 leading-tight">Assign Work</h1>
        <p className="text-xs text-muted mt-1">Dispatches new confirmed hospital procurement inquiries to delivery personnel.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Side: Unassigned orders list (col-span-2) */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wide flex justify-between items-center">
            <span>Pending Dispatch Pool</span>
            <span className="bg-sky-50 text-sky-600 px-2.5 py-0.5 rounded-full font-bold text-[10px] border border-sky-100">
              {unassignedOrders.length} orders
            </span>
          </h2>

          {loadingOrders || loadingAssignments ? (
            <div className="py-16 flex justify-center"><Loader2 className="animate-spin text-primary" /></div>
          ) : unassignedOrders.length === 0 ? (
            <div className="glass bg-white border border-slate-100 p-12 rounded-2xl text-center space-y-3">
              <ClipboardList size={38} className="mx-auto text-slate-300" />
              <div className="text-xs font-bold text-slate-700">All dispatches assigned!</div>
              <p className="text-[10px] text-slate-400 max-w-xs mx-auto">
                There are no confirmed orders pending delivery agent allocations.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {unassignedOrders.map(order => {
                const isSelected = selectedOrder?.id === order.id;
                const shortId = order.id.substr(order.id.length - 8).toUpperCase();
                const formattedDate = new Date(order.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

                return (
                  <div
                    key={order.id}
                    onClick={() => setSelectedOrder(order)}
                    className={`glass border rounded-2xl p-5 cursor-pointer transition-all select-none text-left relative flex flex-col justify-between ${
                      isSelected 
                        ? 'bg-primary/5 border-primary shadow-md shadow-sky-500/5' 
                        : 'bg-white border-slate-100/80 hover:border-slate-200 hover:shadow-sm'
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute top-4 right-4 bg-primary text-white p-1 rounded-full flex items-center justify-center">
                        <Check size={12} strokeWidth={3} />
                      </div>
                    )}

                    <div className="space-y-3">
                      <div>
                        <span className="text-[10px] font-black text-slate-400 font-mono">#{shortId}</span>
                        <h4 className="font-bold text-slate-900 text-sm mt-0.5 leading-snug truncate pr-6">{order.customer_name}</h4>
                      </div>

                      <div className="space-y-1 text-slate-500 text-[11px] leading-relaxed">
                        <div className="flex items-center gap-1.5">
                          <Clock size={12} className="text-slate-400" />
                          <span>Confirmed: {formattedDate}</span>
                        </div>
                        <div className="flex items-start gap-1.5">
                          <MapPin size={12} className="text-slate-400 mt-0.5 flex-shrink-0" />
                          <span className="line-clamp-2">{order.delivery_address}</span>
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-slate-100 pt-3 mt-4 flex justify-between items-center text-xs font-semibold text-slate-700">
                      <span>Value:</span>
                      <span className="font-black text-slate-900">₹{order.total_amount.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Side: Assignment form control */}
        <div className="space-y-6">
          <div className="glass bg-white border border-slate-100 p-5 rounded-2xl shadow-sm text-left">
            <h3 className="font-display font-black text-slate-900 text-sm border-b border-slate-100 pb-3 mb-4 flex items-center gap-1.5">
              <UserCheck size={16} className="text-primary" /> Dispatch Assignment
            </h3>

            <form onSubmit={handleAssign} className="space-y-4">
              {/* Selected Order Summary Card */}
              {selectedOrder ? (
                <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl space-y-1.5 text-xs">
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Target Order</span>
                  <div className="font-bold text-slate-900 truncate">{selectedOrder.customer_name}</div>
                  <div className="text-[10px] text-slate-400 font-mono">ID: #{selectedOrder.id.toUpperCase()}</div>
                </div>
              ) : (
                <div className="p-4 bg-slate-50/50 border border-dashed border-slate-200 rounded-xl text-center text-xs text-slate-400">
                  Select a pending order from the left pool to assign.
                </div>
              )}

              {/* Select Agent dropdown */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Select Agent</label>
                <select
                  required
                  value={selectedAgent}
                  onChange={(e) => setSelectedAgent(e.target.value)}
                  className="block w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-primary outline-none text-xs text-slate-700"
                >
                  <option value="" disabled>Choose Delivery Personnel</option>
                  {activeAgents.map(agent => (
                    <option key={agent.id} value={agent.id}>
                      {agent.fullName} ({agent.vehicleType}) — Active tasks: {agent.activeTasks}
                    </option>
                  ))}
                </select>
              </div>

              {/* Set Priority */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Set Dispatch Priority</label>
                <div className="grid grid-cols-2 gap-2">
                  {['Normal', 'High'].map(opt => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setPriority(opt)}
                      className={`py-2 px-4 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        priority === opt
                          ? 'bg-primary border-primary text-white shadow-sm shadow-sky-500/10'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {opt} Priority
                    </button>
                  ))}
                </div>
              </div>

              {/* Submit button */}
              <button
                type="submit"
                disabled={assignMutation.isPending || !selectedOrder || !selectedAgent}
                className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow cursor-pointer transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {assignMutation.isPending ? (
                  <Loader2 className="animate-spin" size={14} />
                ) : (
                  <>Assign Order & Dispatch <ArrowRight size={14} /></>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Active Assignments Overview Table */}
      <section className="glass bg-white border border-slate-100 p-6 rounded-xl shadow-sm">
        <h3 className="font-display font-bold text-slate-800 text-sm border-b border-slate-100 pb-3 mb-4">
          Current Dispatches In Transit
        </h3>
        <div className="overflow-x-auto">
          {loadingAssignments || loadingOrders ? (
            <div className="py-8 flex justify-center"><Loader2 className="animate-spin text-primary" /></div>
          ) : activeAssignmentsList.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">No active dispatches in transit.</div>
          ) : (
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="text-slate-400 font-bold uppercase tracking-wider border-b border-slate-100">
                  <th className="py-3">Order ID</th>
                  <th className="py-3">Hospital Partner</th>
                  <th className="py-3">Assigned Dispatcher</th>
                  <th className="py-3">Distance</th>
                  <th className="py-3">Priority</th>
                  <th className="py-3">Handoff Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {activeAssignmentsList.map(asg => (
                  <tr key={asg.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 font-mono font-bold text-slate-900">#{asg.orderId}</td>
                    <td className="py-3 font-bold text-slate-700">{asg.orderDetails?.customer_name}</td>
                    <td className="py-3 text-primary font-bold">{asg.agentName}</td>
                    <td className="py-3 font-semibold">{asg.distance} km</td>
                    <td className="py-3 font-bold uppercase tracking-wide">
                      <span className={`px-1.5 py-0.5 rounded text-[9px] ${
                        asg.priority === 'High' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-slate-50 text-slate-600'
                      }`}>
                        {asg.priority}
                      </span>
                    </td>
                    <td className="py-3">
                      <span className="px-2 py-0.5 bg-indigo-50 border border-indigo-100 text-indigo-700 font-bold uppercase text-[9px] rounded-full">
                        {asg.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </motion.div>
  );
}
