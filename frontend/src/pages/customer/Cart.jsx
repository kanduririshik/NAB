import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { Order } from '../../services/api';
import { ShoppingCart, Plus, Minus, Trash2, Send, CheckCircle, Loader2, ArrowRight, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import SafeImage from '../../components/SafeImage';

export default function Cart() {
  const { cartItems, updateQuantity, removeFromCart, clearCart, totalAmount } = useCart();
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [successState, setSuccessState] = useState(false);
  const [sending, setSending] = useState(false);
  const [checkoutMethod, setCheckoutMethod] = useState('owner');

  // Form state pre-filled from user profile details
  const [form, setForm] = useState({
    customer_name: profile?.fullName || '',
    customer_phone: profile?.phone || '',
    customer_email: profile?.email || user?.email || '',
    delivery_address: profile?.address || ''
  });

  React.useEffect(() => {
    if (profile || user) {
      setForm(prev => ({
        customer_name: prev.customer_name || profile?.fullName || '',
        customer_phone: prev.customer_phone || profile?.phone || '',
        customer_email: prev.customer_email || profile?.email || user?.email || '',
        delivery_address: prev.delivery_address || profile?.address || ''
      }));
    }
  }, [profile, user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmitRequest = async (e) => {
    e.preventDefault();
    setSending(true);
    try {
      // items array mapping: product_id, product_name, product_image, quantity, price
      const orderItems = cartItems.map(item => ({
        product_id: item.product.id,
        product_name: item.product.name,
        product_image: item.product.image_url || item.product.image,
        quantity: item.quantity,
        price: item.product.price
      }));

      const payload = {
        customer_name: form.customer_name,
        customer_email: form.customer_email,
        customer_phone: form.customer_phone,
        delivery_address: form.delivery_address,
        items: orderItems,
        total_amount: totalAmount,
        status: 'Pending'
      };

      await Order.create(payload);

      if (checkoutMethod === 'whatsapp') {
        const formattedItems = cartItems.map((item, idx) => {
          const itemTotal = item.product.price * item.quantity;
          return `${idx + 1}. *${item.product.name}*\n   Qty: ${item.quantity} | Price: ₹${item.product.price.toLocaleString('en-IN')} | Total: ₹${itemTotal.toLocaleString('en-IN')}`;
        }).join('\n\n');

        const messageText = `*New Age Biologics - New Order Inquiry*\n` +
          `---------------------------------------\n` +
          `*Customer Details:*\n` +
          `• *Name:* ${form.customer_name}\n` +
          `• *Phone:* ${form.customer_phone}\n` +
          `• *Email:* ${form.customer_email}\n` +
          `• *Delivery Address:* ${form.delivery_address}\n\n` +
          `*Order Items:*\n` +
          `${formattedItems}\n` +
          `---------------------------------------\n` +
          `*Total Amount:* ₹${totalAmount.toLocaleString('en-IN')}\n\n` +
          `Thank you!`;

        const encodedMsg = encodeURIComponent(messageText);
        const ownerPhone = '918897982828';
        const whatsappUrl = `https://wa.me/${ownerPhone}?text=${encodedMsg}`;
        window.open(whatsappUrl, '_blank');
      }

      toast.success('Inquiry request submitted successfully!');
      clearCart();
      setDialogOpen(false);
      setSuccessState(true);
    } catch (err) {
      toast.error(err.message || 'Failed to submit order request.');
    } finally {
      setSending(false);
    }
  };

  if (successState) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md mx-auto glass rounded-2xl p-12 text-center space-y-6 shadow-xl border border-border mt-8"
      >
        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600">
          <CheckCircle size={36} />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-extrabold font-display text-foreground">Request Sent Successfully!</h2>
          <p className="text-xs text-muted leading-relaxed">
            Your wholesale inquiry has been dispatched to our sales desk. A procurement officer will contact you within 24 hours.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            onClick={() => navigate('/orders')}
            className="flex-1 py-3 px-4 bg-primary hover:bg-primary/95 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer transition-colors"
          >
            View Orders
          </button>
          <button
            onClick={() => navigate('/products')}
            className="flex-1 py-3 px-4 border border-border hover:bg-secondary text-foreground text-xs font-bold rounded-xl transition-colors cursor-pointer"
          >
            Continue Shopping
          </button>
        </div>
      </motion.div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="glass rounded-2xl p-16 text-center max-w-md mx-auto space-y-5 shadow-sm border border-border mt-8">
        <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto text-muted">
          <ShoppingCart size={28} />
        </div>
        <div className="space-y-1">
          <h3 className="text-lg font-bold text-foreground">Your Cart is Empty</h3>
          <p className="text-xs text-muted">
            You haven't added any clinical formulations to your inquiry list yet.
          </p>
        </div>
        <button
          onClick={() => navigate('/products')}
          className="py-2.5 px-6 bg-primary hover:bg-primary/95 text-white rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 mx-auto"
        >
          Browse Products <ArrowRight size={14} />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16 text-left font-sans">
      <h1 className="text-3xl font-extrabold font-display text-foreground border-b border-border pb-4">
        Shopping Cart
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Cart items list */}
        <div className="lg:col-span-2 space-y-4">
          <AnimatePresence>
            {cartItems.map((item) => {
              const lineTotal = item.product.price * item.quantity;
              return (
                <motion.div
                  key={item.product.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="glass-order-card rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-4 w-full sm:w-auto">
                    <SafeImage
                      src={item.product.image_url || item.product.image}
                      alt={item.product.name}
                      className="w-16 h-16 rounded-lg object-cover bg-slate-100 flex-shrink-0"
                    />
                    <div className="text-left space-y-0.5">
                      <h4 className="font-display font-bold text-foreground text-sm line-clamp-1">
                        {item.product.name}
                      </h4>
                      <p className="text-xs text-muted">
                        Unit Price: ₹{item.product.price.toLocaleString('en-IN')}
                      </p>
                    </div>
                  </div>

                  {/* Quantity Controls & Totals */}
                  <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto">
                    <div className="flex items-center gap-2 border border-border rounded-lg p-0.5">
                      <button
                        onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                        className="p-1 text-muted hover:text-foreground hover:bg-secondary rounded cursor-pointer transition-colors"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="text-xs font-bold w-6 text-center select-none">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                        className="p-1 text-muted hover:text-foreground hover:bg-secondary rounded cursor-pointer transition-colors"
                      >
                        <Plus size={14} />
                      </button>
                    </div>

                    <span className="text-sm font-bold w-24 text-right font-display text-foreground">
                      ₹{lineTotal.toLocaleString('en-IN')}
                    </span>

                    <button
                      onClick={() => removeFromCart(item.product.id)}
                      className="p-2 text-muted hover:text-destructive hover:bg-secondary rounded-lg transition-colors cursor-pointer"
                      title="Remove Item"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Total Summary Panel */}
        <div className="glass-login-card rounded-xl p-6 space-y-6">
          <h3 className="font-display font-bold text-foreground text-md border-b border-border pb-3">
            Inquiry Summary
          </h3>

          <div className="flex items-center justify-between text-xs text-muted font-semibold">
            <span>Total Items</span>
            <span>{cartItems.reduce((acc, item) => acc + item.quantity, 0)} units</span>
          </div>

          <div className="flex items-center justify-between border-t border-border pt-4">
            <span className="text-xs font-bold text-muted uppercase">Total Amount</span>
            <span className="text-3xl font-bold font-display text-foreground">
              ₹{totalAmount.toLocaleString('en-IN')}
            </span>
          </div>

          <div className="flex flex-col gap-3">
            <button
              onClick={() => {
                setCheckoutMethod('owner');
                setDialogOpen(true);
              }}
              className="w-full h-12 flex justify-center items-center gap-2 bg-primary hover:bg-primary/95 text-white rounded-xl font-bold text-xs shadow-lg hover:shadow-primary/20 transition-all cursor-pointer"
            >
              <Send size={14} /> Send to Owner
            </button>
            <button
              onClick={() => {
                setCheckoutMethod('whatsapp');
                setDialogOpen(true);
              }}
              className="w-full h-12 flex justify-center items-center gap-2 bg-[#25D366] hover:bg-[#20ba5a] text-white rounded-xl font-bold text-xs shadow-lg hover:shadow-emerald-500/10 transition-all cursor-pointer"
            >
              <MessageCircle size={14} className="fill-white stroke-none" /> Send via WhatsApp
            </button>
          </div>
        </div>
      </div>

      {/* Checkout Dialog Modal */}
      <AnimatePresence>
        {dialogOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl max-w-md w-full p-8 border border-border shadow-2xl space-y-6 text-left"
            >
              <div className="flex items-center justify-between border-b border-border pb-3">
                <h3 className="text-lg font-bold text-foreground font-display flex items-center gap-2">
                  {checkoutMethod === 'whatsapp' ? (
                    <>
                      <MessageCircle size={18} className="text-[#25D366] fill-[#25D366] stroke-none" /> Send via WhatsApp
                    </>
                  ) : (
                    <>
                      <Send size={18} className="text-primary" /> Send Order Request
                    </>
                  )}
                </h3>
                <button
                  onClick={() => setDialogOpen(false)}
                  className="text-muted hover:text-foreground text-sm cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmitRequest} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-1">
                    Full Representative Name
                  </label>
                  <input
                    type="text"
                    required
                    name="customer_name"
                    value={form.customer_name}
                    onChange={handleInputChange}
                    placeholder="Dr. Rajesh Kumar"
                    className="block w-full px-3 py-2 bg-secondary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-1">
                    Helpline Callbacks Phone
                  </label>
                  <input
                    type="text"
                    required
                    name="customer_phone"
                    value={form.customer_phone}
                    onChange={handleInputChange}
                    placeholder="+91 99887 76655"
                    className="block w-full px-3 py-2 bg-secondary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-1">
                    Institutional Email
                  </label>
                  <input
                    type="email"
                    required
                    name="customer_email"
                    value={form.customer_email}
                    onChange={handleInputChange}
                    placeholder="purchasing@hospital.com"
                    className="block w-full px-3 py-2 bg-secondary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-1">
                    Delivery Address
                  </label>
                  <textarea
                    required
                    rows={4}
                    name="delivery_address"
                    value={form.delivery_address}
                    onChange={handleInputChange}
                    placeholder="Enter full institutional shipping address..."
                    className="block w-full px-3 py-2 bg-secondary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-xs resize-none"
                  />
                </div>

                <div className="flex gap-3 pt-3 border-t border-border mt-6">
                  <button
                    type="button"
                    onClick={() => setDialogOpen(false)}
                    className="flex-1 py-2.5 border border-border hover:bg-secondary text-foreground text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={sending}
                    className={`flex-1 py-2.5 text-white text-xs font-bold rounded-lg transition-colors shadow-md flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 ${
                      checkoutMethod === 'whatsapp'
                        ? 'bg-[#25D366] hover:bg-[#20ba5a]'
                        : 'bg-primary hover:bg-primary/95'
                    }`}
                  >
                    {sending ? (
                      <>
                        <Loader2 className="animate-spin" size={14} /> Sending…
                      </>
                    ) : checkoutMethod === 'whatsapp' ? (
                      <>
                        <MessageCircle size={14} className="fill-white stroke-none" /> Submit & Open WhatsApp
                      </>
                    ) : (
                      'Submit Request'
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
