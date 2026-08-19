import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import { Assignment, Order } from '../../services/api';
import { CheckCircle2, XCircle, Clock, MapPin, Search, Calendar, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function StaffCompletedDeliveries() {
  const { staff } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  // Fetch completed dispatches
  const { data: assignments = [], isLoading } = useQuery({
    queryKey: ['staffCompleted', staff?.id],
    queryFn: () => Assignment.list(),
    select: (list) => list.filter(
      a => a.agentId === staff?.id && ['Delivered', 'Unable To Deliver'].includes(a.status)
    ),
    enabled: !!staff?.id
  });

  // Fetch all orders
  const { data: orders = [] } = useQuery({
    queryKey: ['staffOrders'],
    queryFn: () => Order.list('-created_date', 1000)
  });

  const toggleExpand = (id) => {
    setExpandedId(prev => (prev === id ? null : id));
  };

  // Combine and filter dispatches
  const completedHistory = assignments.map(asg => {
    const order = orders.find(o => o.id === asg.orderId);
    return { ...asg, orderDetails: order };
  }).filter(item => {
    if (!item.orderDetails) return false;
    const term = searchTerm.toLowerCase();
    const custName = (item.orderDetails.customer_name || item.orderDetails.customerName || '').toLowerCase();
    const delivAddr = (item.orderDetails.delivery_address || item.orderDetails.deliveryAddress || '').toLowerCase();
    return (
      item.orderId.toLowerCase().includes(term) ||
      custName.includes(term) ||
      delivAddr.includes(term)
    );
  }).sort((a, b) => new Date(b.deliveredAt || b.failedAt || '') - new Date(a.deliveredAt || a.failedAt || ''));

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
          <h1 className="text-3xl font-extrabold font-display text-slate-900 leading-tight">Delivery Logs</h1>
          <p className="text-xs text-muted mt-1">Review your completed deliveries, signature receipts, and client handovers.</p>
        </div>
        <div className="relative w-full sm:w-64 flex-shrink-0">
          <input
            type="text"
            placeholder="Search by ID or customer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-3.5 pr-8 py-2 bg-white border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-sky-400/20 focus:border-sky-400 outline-none text-xs text-slate-800"
          />
          <Search size={14} className="absolute right-3.5 top-2.5 text-slate-400" />
        </div>
      </div>

      {isLoading ? (
        <div className="py-20 flex justify-center items-center">
          <Loader2 className="animate-spin text-primary" size={36} />
        </div>
      ) : completedHistory.length === 0 ? (
        <div className="glass bg-white p-16 text-center space-y-4 rounded-2xl border border-slate-100 max-w-lg mx-auto mt-8">
          <CheckCircle2 size={44} className="mx-auto text-slate-300" />
          <h3 className="text-sm font-bold text-slate-700">No logs found</h3>
          <p className="text-xs text-slate-400 max-w-xs mx-auto">
            Your finalized dispatches (delivered or unable to deliver) will accumulate here as records.
          </p>
        </div>
      ) : (
        <div className="space-y-4 max-w-4xl">
          {completedHistory.map(item => {
            const isDelivered = item.status === 'Delivered';
            const timestamp = isDelivered ? item.deliveredAt : item.failedAt;
            const shortId = item.orderId.substr(item.orderId.length - 8).toUpperCase();
            const formattedDate = timestamp 
              ? new Date(timestamp).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) 
              : 'N/A';

            return (
              <div 
                key={item.id}
                className={`glass bg-white border rounded-2xl shadow-sm overflow-hidden transition-all duration-300 ${
                  expandedId === item.id ? 'border-primary' : 'border-slate-100/80 hover:border-slate-200'
                }`}
              >
                {/* Accordion Row Header */}
                <div 
                  onClick={() => toggleExpand(item.id)}
                  className="p-5 flex flex-col sm:flex-row justify-between sm:items-center gap-4 cursor-pointer select-none"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      isDelivered ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                    }`}>
                      {isDelivered ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                        <span>{item.orderDetails?.customer_name}</span>
                        <span className="text-[10px] font-mono text-slate-400">#{shortId}</span>
                      </div>
                      <div className="flex items-center gap-3 text-[10px] text-slate-400 mt-0.5">
                        <span className="flex items-center gap-1">
                          <Calendar size={12} />
                          {formattedDate}
                        </span>
                        <span>•</span>
                        <span>Dist: {item.distance} km</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4">
                    <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg border ${
                      isDelivered ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-red-50 text-red-700 border-red-100'
                    }`}>
                      {item.status}
                    </span>
                    <button className="text-slate-400">
                      {expandedId === item.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                  </div>
                </div>

                {/* Collapsible Content */}
                <AnimatePresence>
                  {expandedId === item.id && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: 'auto' }}
                      exit={{ height: 0 }}
                      className="overflow-hidden border-t border-slate-100"
                    >
                      <div className="p-5 bg-slate-50/50 grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-slate-700 text-left">
                        {/* Left: General Order details */}
                        <div className="space-y-4">
                          <div className="space-y-1">
                            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Delivery Address</span>
                            <div className="flex items-start gap-1.5 font-medium leading-relaxed">
                              <MapPin size={14} className="text-slate-400 mt-0.5 flex-shrink-0" />
                              <span>{item.orderDetails?.delivery_address}</span>
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Items Invoiced</span>
                            <div className="space-y-2 bg-white p-3 rounded-xl border border-slate-100">
                              {item.orderDetails?.items.map((line, idx) => (
                                <div key={idx} className="flex justify-between items-center text-[11px]">
                                  <span className="font-bold truncate max-w-xs">{line.product_name}</span>
                                  <span className="font-mono text-slate-500">Qty: {line.quantity}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {item.notes && (
                            <div className="space-y-1 p-3 rounded-xl border border-slate-100 bg-white">
                              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Handover Notes</span>
                              <p className="italic text-slate-600 mt-0.5">{item.notes}</p>
                            </div>
                          )}
                        </div>

                        {/* Right: Signature & Photo Details (If delivered) */}
                        {isDelivered ? (
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Handover Signature</span>
                              <div className="border border-slate-200 bg-white p-2 rounded-xl flex items-center justify-center h-28 shadow-sm">
                                {item.signature ? (
                                  <img src={item.signature} alt="Receiver Signature" className="max-h-full max-w-full object-contain" />
                                ) : (
                                  <span className="text-[10px] text-slate-400">No Signature Recorded</span>
                                )}
                              </div>
                            </div>

                            <div className="space-y-2">
                              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Handover Photo</span>
                              <div className="border border-slate-200 bg-white overflow-hidden rounded-xl h-28 shadow-sm">
                                {item.photo ? (
                                  <img src={item.photo} alt="Receiver Photo" className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-400">No Photo Uploaded</div>
                                )}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="bg-red-50/50 border border-red-100 p-4 rounded-xl space-y-2 h-max">
                            <div className="font-bold text-red-700 flex items-center gap-1">
                              <ShieldAlert size={14} /> Failed Delivery Logs
                            </div>
                            <p className="text-slate-600 italic">Reason provided: {item.notes}</p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
