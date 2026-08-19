import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { User } from '../../services/api';
import { Users, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AdminCustomers() {
  // TanStack Query for customer user records
  const { data: customers = [], isLoading } = useQuery({
    queryKey: ['adminCustomers'],
    queryFn: () => User.list()
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6 text-left font-sans"
    >
      
      {/* Header */}
      <div className="border-b border-border pb-4">
        <h1 className="text-3xl font-extrabold font-display text-slate-900 leading-tight">Customers Ledger</h1>
        <p className="text-xs text-muted mt-1">Directory of registered institutional procurement managers, clinics, and labs.</p>
      </div>

      {/* Table grid */}
      <div className="glass-order-card border border-border/80 rounded-xl overflow-hidden hover:border-sky-400/40 hover:shadow-lg hover:shadow-sky-500/5 transition-all duration-300 shadow-sm">
        {isLoading ? (
          <div className="py-20 flex justify-center items-center">
            <Loader2 className="animate-spin text-primary" size={36} />
          </div>
        ) : customers.length === 0 ? (
          <div className="py-20 text-center text-xs text-muted">
            No customer accounts found in the registry.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-slate-50 text-muted font-bold uppercase tracking-wider select-none">
                  <th className="p-4 flex items-center gap-1.5"><Users size={14} /> Full Name</th>
                  <th className="p-4">Email Address</th>
                  <th className="p-4">Phone Number</th>
                  <th className="p-4">Occupation / Designation</th>
                  <th className="p-4">Gender</th>
                  <th className="p-4">Delivery Address</th>
                  <th className="p-4">Joined Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {customers.map((c) => {
                  const joinedDate = c.createdAt
                    ? new Date(c.createdAt).toLocaleDateString('en-IN', {
                        dateStyle: 'medium'
                      })
                    : 'N/A';

                  return (
                    <tr key={c.id} className="hover:bg-sky-50/40 border-b border-slate-100 transition-colors">
                      <td className="p-4 font-bold text-slate-900 truncate max-w-[150px]">{c.name}</td>
                      <td className="p-4 text-slate-600 font-semibold">{c.email}</td>
                      <td className="p-4 text-slate-600 font-semibold">{c.phone || 'N/A'}</td>
                      <td className="p-4 text-slate-500 font-semibold">{c.occupation || 'N/A'}</td>
                      <td className="p-4 text-slate-500">{c.gender || 'N/A'}</td>
                      <td className="p-4 text-slate-400 max-w-xs truncate font-normal" title={c.address}>
                        {c.address || 'N/A'}
                      </td>
                      <td className="p-4 text-slate-400 font-semibold">{joinedDate}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </motion.div>
  );
}
