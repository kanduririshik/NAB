import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import { Assignment, Order } from '../../services/api';
import { Clock, MapPin, Phone, Clipboard, Check, X, Eye, ShieldAlert, Loader2, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import SafeImage from '../../components/SafeImage';

export default function StaffAssignedOrders() {
  const { staff } = useAuth();
  const queryClient = useQueryClient();
  
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Fetch all assignments for the current staff member
  const { data: assignments = [], isLoading } = useQuery({
    queryKey: ['staffAssignments', staff?.id],
    queryFn: () => Assignment.list(),
    select: (list) => list.filter(a => a.agentId === staff?.id && (a.status === 'Assigned' || !a.status)),
    enabled: !!staff?.id
  });

  // Fetch all orders to get B2B buyer details
  const { data: orders = [] } = useQuery({
    queryKey: ['staffOrders'],
    queryFn: () => Order.list('-created_date', 1000)
  });

  // Accept Order Mutation
  const acceptMutation = useMutation({
    mutationFn: (orderId) => Assignment.updateStatus(orderId, 'Accepted'),
    onSuccess: (_, orderId) => {
      queryClient.invalidateQueries({ queryKey: ['staffAssignments'] });
      queryClient.invalidateQueries({ queryKey: ['staffActive'] });
      toast.success(`Order #${orderId.toUpperCase()} accepted successfully!`);
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to accept order.');
    }
  });

  // Reject Order Mutation
  const rejectMutation = useMutation({
    mutationFn: async (orderId) => {
      // Revert status of order to Confirmed, clear assignment from array
      const saved = JSON.parse(localStorage.getItem('nab_assignments') || '[]');
      const filtered = saved.filter(a => a.orderId !== orderId);
      localStorage.setItem('nab_assignments', JSON.stringify(filtered));

      const ordersList = JSON.parse(localStorage.getItem('nab_orders') || '[]');
      const updatedOrders = ordersList.map(o => o.id === orderId ? { ...o, status: 'Confirmed' } : o);
      localStorage.setItem('nab_orders', JSON.stringify(updatedOrders));

      return { success: true };
    },
    onSuccess: (_, orderId) => {
      queryClient.invalidateQueries({ queryKey: ['staffAssignments'] });
      queryClient.invalidateQueries({ queryKey: ['adminOrders'] });
      toast.info(`Order #${orderId.toUpperCase()} assignment rejected.`);
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to reject assignment.');
    }
  });

  const handleAccept = (orderId) => {
    acceptMutation.mutate(orderId);
  };

  const handleReject = (orderId) => {
    if (window.confirm('Are you sure you want to reject this delivery assignment? It will return to the Admin orders pool.')) {
      rejectMutation.mutate(orderId);
    }
  };

  // Combine assignments with order details
  const assignedOrders = assignments.map(asg => {
    const matchedOrder = orders.find(o => o.id === asg.orderId);
    return {
      ...asg,
      orderDetails: matchedOrder
    };
  }).filter(item => !!item.orderDetails);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6 text-left font-sans"
    >
      {/* Header */}
      <div className="border-b border-slate-200 pb-4 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
        <div>
          <h1 className="text-3xl font-extrabold font-display text-slate-900 leading-tight">Assigned Board</h1>
          <p className="text-xs text-muted mt-1">Review new logistics dispatches, check distances, and accept tasks to begin routing.</p>
        </div>
        <div className="bg-sky-500/10 text-sky-700 px-3 py-1.5 rounded-xl border border-sky-100 text-xs font-bold w-max">
          Assigned Tasks: {assignedOrders.length}
        </div>
      </div>

      {isLoading ? (
        <div className="py-20 flex justify-center items-center">
          <Loader2 className="animate-spin text-primary" size={36} />
        </div>
      ) : assignedOrders.length === 0 ? (
        <div className="glass bg-white p-16 text-center space-y-4 rounded-2xl border border-slate-100 max-w-lg mx-auto mt-8">
          <Clipboard size={44} className="mx-auto text-slate-300" />
          <h3 className="text-sm font-bold text-slate-700">Clear Board!</h3>
          <p className="text-xs text-slate-400 max-w-xs mx-auto">
            You do not have any pending dispatches. New order assignments will pop up here in real-time.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {assignedOrders.map(item => {
            const order = item.orderDetails;
            const shortId = order.id ? order.id.substr(order.id.length - 8).toUpperCase() : 'N/A';
            const formattedDate = order.createdAt 
              ? new Date(order.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) 
              : 'N/A';

            return (
              <motion.div 
                key={item.id}
                whileHover={{ y: -3 }}
                transition={{ type: "spring", stiffness: 300, damping: 22 }}
                className="glass bg-white border border-sky-100/60 rounded-2xl p-6 shadow-sm hover:border-sky-400 hover:shadow-md transition-all duration-300 flex flex-col justify-between"
              >
                <div className="space-y-4">
                  {/* Card Top Reference & Status */}
                  <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                    <div>
                      <span className="text-xs font-black text-slate-900 font-mono">
                        # {shortId}
                      </span>
                      <span className="text-[10px] text-slate-400 block font-semibold mt-0.5">
                        Assigned {formattedDate}
                      </span>
                    </div>
                    <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                      item.priority === 'High' ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-slate-100 text-slate-700 border border-slate-200'
                    }`}>
                      {item.priority} Priority
                    </span>
                  </div>

                  {/* Customer Information */}
                  <div className="space-y-2 bg-slate-50/50 p-4 rounded-xl text-xs leading-relaxed border border-slate-100/80">
                    <div className="font-bold text-slate-900 truncate">{order.customer_name}</div>
                    <div className="space-y-1 mt-1.5 text-slate-600">
                      <div className="flex items-center gap-2">
                        <Phone size={12} className="text-slate-400" />
                        <span>{order.customer_phone}</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <MapPin size={12} className="text-slate-400 flex-shrink-0 mt-0.5" />
                        <span className="line-clamp-2">{order.delivery_address}</span>
                      </div>
                    </div>
                  </div>

                  {/* Distance & Gross Pricing Details */}
                  <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50/20 border border-slate-100 p-3 rounded-xl font-medium">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[9px] text-slate-400 font-bold uppercase">Simulated Distance</span>
                      <span className="font-bold text-slate-800 font-display flex items-center gap-1">
                        <MapPin size={12} className="text-indigo-400" /> {item.distance} km
                      </span>
                    </div>
                    <div className="flex flex-col gap-0.5 text-right">
                      <span className="text-[9px] text-slate-400 font-bold uppercase">COD Gross Amount</span>
                      <span className="font-extrabold text-slate-950 text-sm">
                        ₹{order.total_amount.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Accept/Reject and details Buttons */}
                <div className="border-t border-slate-100 mt-5 pt-4 flex items-center justify-between gap-2.5">
                  <button
                    onClick={() => setSelectedOrder(order)}
                    className="p-2 border border-slate-200 hover:border-slate-300 text-slate-500 hover:text-slate-700 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold"
                    title="View Product Invoices"
                  >
                    <Eye size={14} /> View Details
                  </button>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleReject(order.id)}
                      disabled={rejectMutation.isPending}
                      className="py-2 px-3.5 border border-red-100 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition-all text-xs font-bold rounded-xl shadow-sm cursor-pointer flex items-center gap-1"
                    >
                      <X size={14} /> Reject
                    </button>
                    <button
                      onClick={() => handleAccept(order.id)}
                      disabled={acceptMutation.isPending}
                      className="py-2 px-4 bg-primary hover:bg-sky-500 text-white transition-all text-xs font-bold rounded-xl shadow cursor-pointer flex items-center gap-1"
                    >
                      <Check size={14} /> Accept
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Details Modal */}
      <AnimatePresence>
        {selectedOrder && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedOrder(null)}
              className="fixed inset-0 bg-black z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="fixed inset-x-4 bottom-4 top-4 md:inset-auto md:w-[500px] md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 bg-white rounded-3xl z-50 p-6 shadow-2xl flex flex-col justify-between border border-slate-100 text-slate-800"
            >
              <div className="overflow-y-auto space-y-5 flex-1 pr-1 text-left">
                {/* Modal Title */}
                <div className="flex justify-between items-start border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="font-display font-black text-lg">Inquiry Specifications</h3>
                    <span className="text-[10px] text-slate-400 block font-mono mt-0.5">ORDER ID: {selectedOrder.id.toUpperCase()}</span>
                  </div>
                  <button
                    onClick={() => setSelectedOrder(null)}
                    className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Institutional Details */}
                <div className="space-y-2 bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs">
                  <div className="font-bold text-slate-900 text-sm">{selectedOrder.customer_name}</div>
                  <div className="space-y-1 text-slate-600 mt-1">
                    <div className="flex items-center gap-2">
                      <Phone size={12} className="text-slate-400" />
                      <span>{selectedOrder.customer_phone}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <MapPin size={12} className="text-slate-400 flex-shrink-0 mt-0.5" />
                      <span>{selectedOrder.delivery_address}</span>
                    </div>
                  </div>
                </div>

                {/* Product lines */}
                <div className="space-y-3.5">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Requested Items</span>
                  <div className="space-y-3 max-h-56 overflow-y-auto">
                    {selectedOrder.items.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs gap-3 p-2 bg-slate-50/30 border border-slate-50 rounded-xl">
                        <div className="flex items-center gap-2 min-w-0">
                          <SafeImage
                            src={item.product_image}
                            alt={item.product_name}
                            className="w-10 h-10 rounded-md object-cover bg-slate-100 flex-shrink-0 border border-border"
                          />
                          <span className="font-bold text-slate-800 truncate pr-2">
                            {item.product_name}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-right flex-shrink-0">
                          <span className="text-[10px] text-slate-400 font-bold">
                            {item.quantity} × ₹{item.price.toLocaleString('en-IN')}
                          </span>
                          <span className="font-black text-slate-950 font-display w-16">
                            ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Total footer */}
              <div className="border-t border-slate-100 pt-4 mt-4 flex justify-between items-center text-xs">
                <div className="text-left">
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wide">COD Gross Total</span>
                  <span className="text-xl font-black text-slate-950 block font-display">
                    ₹{selectedOrder.total_amount.toLocaleString('en-IN')}
                  </span>
                </div>
                <button
                  onClick={() => {
                    handleAccept(selectedOrder.id);
                    setSelectedOrder(null);
                  }}
                  className="py-2.5 px-5 bg-primary hover:bg-sky-500 text-white font-bold text-xs rounded-xl shadow transition-all cursor-pointer flex items-center gap-1.5"
                >
                  Accept Dispatch <ArrowRight size={14} />
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
