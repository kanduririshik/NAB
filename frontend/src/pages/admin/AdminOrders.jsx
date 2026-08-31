import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Order, DeliveryAgent, Assignment } from '../../services/api';
import { Clock, Eye, PhoneCall, CheckCircle, Truck, Loader2, Mail, Phone, MapPin, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import SafeImage from '../../components/SafeImage';

export default function AdminOrders() {
  const queryClient = useQueryClient();

  // Load all client orders
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['adminOrders'],
    queryFn: () => Order.list('-created_date', 1000),
  });

  // Load active delivery agents
  const { data: agents = [] } = useQuery({
    queryKey: ['adminAgents'],
    queryFn: () => DeliveryAgent.list()
  });

  // Load assignments
  const { data: assignments = [] } = useQuery({
    queryKey: ['adminAssignments'],
    queryFn: () => Assignment.list()
  });

  const assignMutation = useMutation({
    mutationFn: ({ orderId, agentId }) => Assignment.assign(orderId, agentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminOrders'] });
      queryClient.invalidateQueries({ queryKey: ['adminAssignments'] });
      toast.success('Delivery agent assigned successfully.');
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to assign agent.');
    }
  });

  const handleAssignOrder = (orderId, agentId) => {
    assignMutation.mutate({ orderId, agentId });
  };

  // Update status mutation
  const statusMutation = useMutation({
    mutationFn: ({ id, status }) => Order.update(id, { status }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['adminOrders'] });
      queryClient.invalidateQueries({ queryKey: ['myOrders'] });
      toast.success(`Inquiry status updated to ${variables.status}`);
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to update order status.');
    }
  });

  const handleStatusChange = (id, newStatus) => {
    statusMutation.mutate({ id, status: newStatus });
  };

  // Delete order mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => Order.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminOrders'] });
      queryClient.invalidateQueries({ queryKey: ['myOrders'] });
      toast.success('Inquiry order request deleted successfully.');
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to delete order request.');
    }
  });

  const handleDeleteOrder = (id) => {
    if (window.confirm('Are you sure you want to permanently delete this order request?')) {
      deleteMutation.mutate(id);
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'Pending':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Viewed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Contacted':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Confirmed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Assigned':
        return 'bg-sky-100 text-sky-800 border-sky-200';
      case 'Accepted':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'Picked Up':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Out For Delivery':
        return 'bg-teal-100 text-teal-800 border-teal-200';
      case 'Delivered':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Unable To Deliver':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'Cancelled':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const statusList = [
    'Pending',
    'Viewed',
    'Contacted',
    'Confirmed',
    'Assigned',
    'Accepted',
    'Picked Up',
    'Out For Delivery',
    'Delivered',
    'Unable To Deliver',
    'Cancelled'
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6 text-left font-sans"
    >
      
      {/* Header */}
      <div className="border-b border-border pb-4">
        <h1 className="text-3xl font-extrabold font-display text-slate-900 leading-tight">Requests Desk</h1>
        <p className="text-xs text-muted mt-1">Review incoming B2B procurements, call back institutional leads, and coordinate shipping status.</p>
      </div>

      {isLoading ? (
        <div className="py-20 flex justify-center items-center">
          <Loader2 className="animate-spin text-primary" size={36} />
        </div>
      ) : orders.length === 0 ? (
        <div className="py-20 text-center text-xs text-muted">
          No order requests found.
        </div>
      ) : (
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{
            visible: { transition: { staggerChildren: 0.05 } }
          }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        >
          {orders.map((o) => {
            const shortId = o.id ? o.id.substr(o.id.length - 8).toUpperCase() : 'N/A';
            const formattedDate = o.createdAt
              ? new Date(o.createdAt).toLocaleString('en-IN', {
                  dateStyle: 'medium',
                  timeStyle: 'short'
                })
              : 'N/A';

            return (
              <motion.div
                key={o.id}
                variants={{
                  hidden: { opacity: 0, y: 15 },
                  visible: { opacity: 1, y: 0 }
                }}
                whileHover={{ y: -3 }}
                transition={{ type: "spring", stiffness: 300, damping: 22 }}
                className="glass-order-card border border-sky-100/60 rounded-xl p-6 flex flex-col justify-between hover:border-sky-400/80 hover:shadow-lg hover:shadow-sky-500/5 transition-all duration-300 relative overflow-hidden"
              >
                <div className="space-y-4">
                  
                  {/* Card Header: Order Reference & Status Dropdown */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-border pb-3 gap-2">
                    <div className="text-left">
                      <span className="text-xs font-black text-slate-900 font-mono">
                        # {shortId}
                      </span>
                      <span className="text-[10px] text-slate-400 block font-semibold">
                        Received {formattedDate}
                      </span>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-muted font-bold uppercase">Update status:</span>
                        <select
                          value={o.status}
                          onChange={(e) => handleStatusChange(o.id, e.target.value)}
                          className={`text-xs font-bold border rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-sky-400/30 ${getStatusStyle(o.status)}`}
                        >
                          {statusList.map(st => (
                            <option key={st} value={st}>{st}</option>
                          ))}
                        </select>
                      </div>

                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleDeleteOrder(o.id)}
                        disabled={deleteMutation.isPending}
                        className="p-2 text-muted hover:text-destructive hover:bg-slate-50 rounded-lg transition-colors cursor-pointer border border-border flex items-center justify-center"
                        title="Delete Order Request"
                      >
                        <Trash2 size={14} />
                      </motion.button>
                    </div>
                  </div>

                  {/* Representative Contact details */}
                  <div className="space-y-2 bg-slate-50/50 p-3.5 rounded-lg text-xs leading-relaxed border border-slate-100">
                    <div className="font-bold text-slate-900 truncate">{o.customer_name}</div>
                    <div className="space-y-1 mt-1 text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <Mail size={12} className="text-slate-400 flex-shrink-0" />
                        <span className="truncate">{o.customer_email}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Phone size={12} className="text-slate-400 flex-shrink-0" />
                        <span>{o.customer_phone}</span>
                      </div>
                      <div className="flex items-start gap-1.5">
                        <MapPin size={12} className="text-slate-400 flex-shrink-0 mt-0.5" />
                        <span className="whitespace-pre-line">{o.delivery_address}</span>
                      </div>
                    </div>
                  </div>

                  {/* Items List */}
                  <div className="space-y-3 pt-1">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Requested Items</span>
                    {(o.items || []).map((item, idx) => {
                      const itemPrice = Number(item.price) || 0;
                      const itemQty = Number(item.quantity) || 1;
                      const lineTotal = itemPrice * itemQty;
                      return (
                        <div key={idx} className="flex items-center justify-between text-xs gap-3">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <SafeImage
                              src={item.product_image}
                              alt={item.product_name}
                              className="w-8 h-8 rounded-md object-cover bg-slate-100 flex-shrink-0 border border-border"
                            />
                            <span className="font-semibold text-slate-800 truncate pr-2">
                              {item.product_name || 'Product'}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-right flex-shrink-0">
                            <span className="text-[10px] text-slate-400">
                              {itemQty} × ₹{itemPrice.toLocaleString('en-IN')}
                            </span>
                            <span className="font-bold text-slate-950 font-display w-16">
                              ₹{lineTotal.toLocaleString('en-IN')}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Assignment Section */}
                  {['Confirmed', 'Assigned', 'Accepted', 'Picked Up', 'Out For Delivery', 'Unable To Deliver', 'Delivered'].includes(o.status) && (
                    <div className="mt-4 pt-3.5 border-t border-slate-100 space-y-2">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                        Logistics Handoff
                      </span>
                      {(() => {
                        const activeAsg = assignments.find(a => a.orderId === o.id);
                        if (activeAsg) {
                          return (
                            <div className="flex items-center justify-between text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                              <span className="font-semibold text-slate-700">
                                Assigned to: <b className="text-primary">{activeAsg.agentName}</b>
                              </span>
                              <span className="text-[10px] font-bold text-slate-500 bg-slate-200/50 px-2 py-0.5 rounded">
                                {activeAsg.status || 'Assigned'}
                              </span>
                            </div>
                          );
                        } else {
                          const activeAgents = agents.filter(a => a.status === 'Active');
                          return (
                            <div className="flex gap-2">
                              <select 
                                className="flex-1 text-xs border border-slate-200 rounded-xl p-2 bg-slate-50 focus:bg-white focus:outline-none"
                                defaultValue=""
                                id={`assign_agent_${o.id}`}
                              >
                                <option value="" disabled>Select Delivery Agent</option>
                                {activeAgents.map(agent => (
                                  <option key={agent.id} value={agent.id}>{agent.fullName} ({agent.vehicleType})</option>
                                ))}
                              </select>
                              <button
                                onClick={() => {
                                  const selectEl = document.getElementById(`assign_agent_${o.id}`);
                                  if (selectEl && selectEl.value) {
                                    handleAssignOrder(o.id, selectEl.value);
                                  } else {
                                    toast.warning('Please select an agent first.');
                                  }
                                }}
                                className="py-2 px-3.5 bg-primary text-white text-xs font-bold rounded-xl shadow cursor-pointer hover:bg-sky-500 transition-all"
                              >
                                Assign
                              </button>
                            </div>
                          );
                        }
                      })()}
                    </div>
                  )}

                </div>

                {/* Footer total */}
                <div className="border-t border-border mt-4 pt-3 flex justify-between items-center text-xs">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Estimated Gross Value</span>
                  <span className="text-base font-black text-slate-950 font-display">
                    ₹{(Number(o.total_amount) || 0).toLocaleString('en-IN')}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}

    </motion.div>
  );
}
