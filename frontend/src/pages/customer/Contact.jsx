import React, { useState } from 'react';
import { ContactMessage } from '../../services/api';
import { MapPin, Phone, Mail, Clock, CheckCircle, Loader2, User } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

export default function Contact() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await ContactMessage.create(form);
      toast.success('Message sent successfully!');
      setSuccess(true);
    } catch (err) {
      toast.error(err.message || 'Failed to dispatch message.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({ name: '', email: '', phone: '', message: '' });
    setSuccess(false);
  };

  const coordinates = [
    {
      icon: <User size={20} />,
      title: 'Contact Person',
      value: 'K. Purushotham'
    },
    {
      icon: <MapPin size={20} />,
      title: 'Office Address (Business Card)',
      value: '9-9-10/1, Ground Floor,\nReddy Plaza, Reddy Colony,\nChampapet, Hyderabad – 500059,\nTelangana, India',
      link: 'https://www.google.com/maps/search/?api=1&query=9-9-10%2F1%2C+Ground+Floor%2C+Reddy+Plaza%2C+Reddy+Colony%2C+Champapet%2C+Hyderabad+500059'
    },
    {
      icon: <MapPin size={20} />,
      title: 'Additional Address',
      value: '9-9-3/4, Malla Reddy Nagar,\nSaroor Nagar West, Saidabad,\nChampapet, Hyderabad,\nTelangana – 500059, India',
      link: 'https://www.google.com/maps/search/?api=1&query=9-9-3%2F4%2C+Malla+Reddy+Nagar%2C+Saroor+Nagar+West%2C+Champapet%2C+Hyderabad+500059'
    },
    {
      icon: <Phone size={20} />,
      title: 'Phone (WhatsApp)',
      value: '+91 8897982828',
      link: 'https://wa.me/918897982828?text=Hello%20New%20Age%20Biologics%2C%20I%20would%20like%20to%20inquire%20about%20your%20products.'
    },
    {
      icon: <Mail size={20} />,
      title: 'Email (Gmail)',
      value: 'po@newagebiologics.in',
      link: 'https://mail.google.com/mail/?view=cm&fs=1&to=po@newagebiologics.in'
    },
    {
      icon: <Clock size={20} />,
      title: 'Business Hours',
      value: 'Mon - Sat: 9:00 AM - 6:00 PM'
    }
  ];

  return (
    <div className="space-y-8 pb-16 text-left font-sans">
      
      {/* Header */}
      <section className="bg-gradient-to-br from-primary/5 to-accent/5 py-12 px-4 sm:px-6 lg:px-8 text-center rounded-2xl">
        <h1 className="text-3xl font-bold font-display text-foreground">Contact Us</h1>
        <p className="text-xs text-muted mt-1">Get in touch with our institutional support and sales desks.</p>
      </section>

      {/* Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 items-start">
        
        {/* Left Side (col-span-2) */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="lg:col-span-2 space-y-6"
        >
          <div className="space-y-4">
            {coordinates.map((item, idx) => (
              <div key={idx} className="flex gap-4 items-start glass-order-card p-4 rounded-xl">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                  {item.icon}
                </div>
                <div className="text-left space-y-0.5">
                  <h4 className="font-display font-bold text-xs text-foreground uppercase tracking-wider">
                    {item.title}
                  </h4>
                  {item.link ? (
                    <a
                      href={item.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-muted hover:text-primary hover:underline leading-relaxed font-semibold whitespace-pre-line block transition-colors"
                    >
                      {item.value}
                    </a>
                  ) : (
                    <p className="text-xs text-muted leading-relaxed font-semibold whitespace-pre-line">
                      {item.value}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Google Maps iframe embed */}
          <div className="overflow-hidden rounded-xl shadow-sm border border-border">
            <iframe
              title="Hyderabad Office"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3809.054378772322!2d78.51458927515082!3d17.336980583540608!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bcb997f7ab2c10b%3A0xe37a912bbcb64326!2sChampapet%2C%20Hyderabad%2C%20Telangana%20500059!5e0!3m2!1sen!2sin!4v1700000000000!5m2!1sen!2sin"
              width="100%"
              height="192"
              style={{ border: 0 }}
              allowFullScreen=""
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </motion.div>

        {/* Right Side (col-span-3) */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="lg:col-span-3"
        >
          <div className="glass-login-card rounded-2xl p-6 sm:p-8">
            {success ? (
              <div className="text-center py-10 space-y-5">
                <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600">
                  <CheckCircle size={28} />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-foreground">Message Sent!</h3>
                  <p className="text-xs text-muted max-w-sm mx-auto leading-relaxed">
                    Thank you for contacting New Age Biologics. We have received your inquiry and a staff chemist or sales rep will reply shortly.
                  </p>
                </div>
                <button
                  onClick={resetForm}
                  className="py-2.5 px-6 bg-primary hover:bg-primary/95 text-white rounded-lg text-xs font-bold transition-all cursor-pointer shadow-sm"
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <h3 className="text-lg font-bold font-display text-foreground border-b border-border pb-3 mb-2">
                  Submit B2B Inquiry Form
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-muted uppercase tracking-wider mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      required
                      name="name"
                      value={form.name}
                      onChange={handleInputChange}
                      placeholder="Vikram Singh"
                      className="block w-full px-3 py-2 bg-secondary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-muted uppercase tracking-wider mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      required
                      name="email"
                      value={form.email}
                      onChange={handleInputChange}
                      placeholder="procurement@pharmacy.com"
                      className="block w-full px-3 py-2 bg-secondary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-muted uppercase tracking-wider mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    name="phone"
                    value={form.phone}
                    onChange={handleInputChange}
                    placeholder="+91 98765 43210 (Optional)"
                    className="block w-full px-3 py-2 bg-secondary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-muted uppercase tracking-wider mb-1">
                    Inquiry Message
                  </label>
                  <textarea
                    required
                    name="message"
                    rows={5}
                    value={form.message}
                    onChange={handleInputChange}
                    placeholder="Describe your bulk chemical quantity requirements or private labeling specifications..."
                    className="block w-full px-3 py-2 bg-secondary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-xs resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 bg-primary hover:bg-primary/95 text-white rounded-lg text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin" size={14} /> Dispatching…
                    </>
                  ) : (
                    'Submit Inquiry'
                  )}
                </button>
              </form>
            )}
          </div>
        </motion.div>

      </div>
    </div>
  );
}
