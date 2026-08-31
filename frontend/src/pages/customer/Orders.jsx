import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Order } from '../../services/api';
import { Clock, Eye, PhoneCall, CheckCircle, Truck, ClipboardList } from 'lucide-react';
import { motion } from 'framer-motion';
import SafeImage from '../../components/SafeImage';

export default function Orders() {
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['myOrders'],
    queryFn: () => Order.list('-created_date', 50),
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Pending':
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
            <Clock size={12} /> Pending
          </span>
        );
      case 'Viewed':
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
            <Eye size={12} /> Viewed
          </span>
        );
      case 'Contacted':
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200">
            <PhoneCall size={12} /> Contacted
          </span>
        );
      case 'Confirmed':
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800 border border-green-200">
            <CheckCircle size={12} /> Confirmed
          </span>
        );
      case 'Delivered':
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <Truck size={12} /> Delivered
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-800">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-8 pb-16 text-left font-sans">
      <div>
        <h1 className="text-3xl font-extrabold font-display text-foreground">My Orders</h1>
        <p className="text-xs text-muted mt-1">Track the status of your order requests.</p>
      </div>

      {isLoading ? (
        // 3 Skeleton cards
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, idx) => (
            <div key={idx} className="bg-white border border-border rounded-xl p-6 h-48 animate-pulse flex flex-col justify-between max-w-md mx-auto w-full">
              <div className="flex items-center justify-between">
                <div className="h-5 bg-slate-200 rounded w-1/3" />
                <div className="h-5 bg-slate-200 rounded-full w-20" />
              </div>
              <div className="h-12 bg-slate-200 rounded w-full" />
              <div className="h-4 bg-slate-200 rounded w-1/4" />
            </div>
          ))}
        </div>
      ) : orders.length === 0 ? (
        // Empty state
        <div className="glass rounded-xl p-16 text-center max-w-md mx-auto space-y-4 shadow-sm border border-border mt-8">
          <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto text-muted">
            <ClipboardList size={28} />
          </div>
          <h3 className="text-lg font-bold text-foreground">No Order History</h3>
          <p className="text-xs text-muted">
            You have not submitted any B2B inquiry requests yet.
          </p>
        </div>
      ) : (
        // Orders List
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{
            visible: { transition: { staggerChildren: 0.05 } }
          }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {orders.map((o) => {
            // Get last 8 characters of ID, uppercase
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
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0 }
                }}
                className="glass-order-card rounded-xl p-6 space-y-4 max-w-md mx-auto w-full"
              >
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-border pb-3 gap-2">
                  <div className="space-y-0.5">
                    <h3 className="font-display font-bold text-foreground text-sm">
                      Order #{shortId}
                    </h3>
                    <p className="text-[11px] text-muted font-medium">
                      Submitted on {formattedDate}
                    </p>
                  </div>
                  <div className="w-fit">{getStatusBadge(o.status)}</div>
                </div>

                {/* Items list */}
                <div className="space-y-3">
                  {(o.items || []).map((item, idx) => {
                    const itemPrice = Number(item.price) || 0;
                    const itemQty = Number(item.quantity) || 1;
                    const lineTotal = itemPrice * itemQty;
                    return (
                      <div key={idx} className="flex items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <SafeImage
                            src={item.product_image}
                            alt={item.product_name}
                            className="w-10 h-10 rounded-md object-cover bg-slate-100 flex-shrink-0"
                          />
                          <span className="font-semibold text-foreground truncate">
                            {item.product_name || 'Product'}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-right flex-shrink-0">
                          <span className="text-muted text-[11px] font-medium whitespace-nowrap">
                            {itemQty} × ₹{itemPrice.toLocaleString('en-IN')}
                          </span>
                          <span className="font-bold text-foreground w-16 font-display whitespace-nowrap">
                            ₹{lineTotal.toLocaleString('en-IN')}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Footer */}
                <div className="border-t border-border pt-3 flex justify-between items-center text-xs">
                  <span className="text-muted font-bold uppercase tracking-wider text-[10px]">Estimated Total</span>
                  <span className="text-base font-black text-foreground font-display">
                    ₹{(Number(o.total_amount) || 0).toLocaleString('en-IN')}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}
