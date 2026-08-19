import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ContactMessage } from '../../services/api';
import { Mail, Calendar, Phone, Check, Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

export default function AdminMessages() {
  const queryClient = useQueryClient();

  // Load support inquiries
  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['adminMessages'],
    queryFn: () => ContactMessage.list()
  });

  // Mark as read mutation
  const readMutation = useMutation({
    mutationFn: (id) => ContactMessage.update(id, { is_read: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminMessages'] });
      toast.success('Message marked as read.');
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to update message.');
    }
  });

  const handleMarkAsRead = (id) => {
    readMutation.mutate(id);
  };

  // Delete message mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => ContactMessage.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminMessages'] });
      toast.success('Inquiry message deleted successfully.');
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to delete message.');
    }
  });

  const handleDeleteMessage = (id) => {
    if (window.confirm('Are you sure you want to permanently delete this support inquiry?')) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6 text-left font-sans"
    >
      
      {/* Header */}
      <div className="border-b border-border pb-4">
        <h1 className="text-3xl font-extrabold font-display text-slate-900 leading-tight">Inquiries Inbox</h1>
        <p className="text-xs text-muted mt-1">Review clinical inquiries, corporate proposals, and general support messages.</p>
      </div>

      {isLoading ? (
        <div className="py-20 flex justify-center items-center">
          <Loader2 className="animate-spin text-primary" size={36} />
        </div>
      ) : messages.length === 0 ? (
        <div className="py-20 text-center text-xs text-muted">
          Your inbox is completely empty.
        </div>
      ) : (
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{
            visible: { transition: { staggerChildren: 0.05 } }
          }}
          className="space-y-4"
        >
          {messages.map((m) => {
            const formattedDate = m.createdAt
              ? new Date(m.createdAt).toLocaleString('en-IN', {
                  dateStyle: 'medium',
                  timeStyle: 'short'
                })
              : 'N/A';

            return (
              <motion.div
                key={m.id}
                variants={{
                  hidden: { opacity: 0, y: 15 },
                  visible: { opacity: 1, y: 0 }
                }}
                whileHover={{ y: -2 }}
                transition={{ type: "spring", stiffness: 300, damping: 22 }}
                className={`glass-order-card border rounded-xl p-5 relative flex flex-col justify-between md:flex-row gap-4 items-start md:items-center transition-all duration-300 ${
                  m.is_read 
                    ? 'border-slate-100 opacity-75 hover:border-slate-300 hover:shadow-md' 
                    : 'border-sky-400 bg-sky-50/10 shadow-[0_0_15px_rgba(56,189,248,0.1)] hover:border-sky-500 hover:shadow-lg hover:shadow-sky-500/10'
                }`}
              >
                <div className="space-y-3 text-left flex-1 min-w-0">
                  {/* Sender & Metadata header */}
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="font-bold text-slate-950 font-display text-sm">
                      {m.name}
                    </span>
                    {!m.is_read && (
                      <span className="bg-sky-500 text-white text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full animate-pulse">
                        Unread
                      </span>
                    )}
                  </div>

                  {/* Message body */}
                  <p className="text-xs text-slate-800 leading-relaxed font-medium bg-slate-50/50 p-3 rounded-lg border border-slate-100 whitespace-pre-line">
                    {m.message}
                  </p>

                  {/* Coordinates & Timestamp */}
                  <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                    <div className="flex items-center gap-1">
                      <Mail size={12} className="text-slate-400" />
                      <span className="normal-case">{m.email}</span>
                    </div>
                    {m.phone && (
                      <div className="flex items-center gap-1">
                        <Phone size={12} className="text-slate-400" />
                        <span>{m.phone}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Calendar size={12} className="text-slate-400" />
                      <span>{formattedDate}</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0 self-start md:self-center">
                  {!m.is_read && (
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => handleMarkAsRead(m.id)}
                      disabled={readMutation.isPending}
                      className="h-9 px-3 bg-primary hover:bg-primary/95 text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer"
                    >
                      {readMutation.isPending ? (
                        <Loader2 className="animate-spin" size={14} />
                      ) : (
                        <>
                          <Check size={14} /> Mark as Read
                        </>
                      )}
                    </motion.button>
                  )}
                  
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleDeleteMessage(m.id)}
                    disabled={deleteMutation.isPending}
                    className="p-2 border border-border text-muted hover:text-destructive hover:bg-slate-50 rounded-lg transition-colors cursor-pointer flex items-center justify-center h-9 w-9"
                    title="Delete Message"
                  >
                    <Trash2 size={14} />
                  </motion.button>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}

    </motion.div>
  );
}
