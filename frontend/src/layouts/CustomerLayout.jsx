import React, { useState } from 'react';
import { NavLink, Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CartProvider, useCart } from '../context/CartContext';
import { ShoppingCart, User, LogOut, Menu, X, MapPin, Phone, Mail, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Logo from '../components/Logo';

function Navbar() {
  const { user, logout } = useAuth();
  const { totalItems } = useCart();
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navLinks = [
    { path: '/home', label: 'Home' },
    { path: '/about', label: 'About Us' },
    { path: '/products', label: 'Products' },
    { path: '/orders', label: 'Orders' },
    { path: '/contact', label: 'Contact Us' }
  ];

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-40 h-16 w-full bg-primary/95 backdrop-blur-[20px] border-b border-primary/20 shadow-md">
        <div className="max-w-[95%] mx-auto h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          
          {/* Left: Logo */}
          <Link to="/home" className="flex items-center gap-2">
            <div className="bg-white p-1 rounded-lg flex items-center justify-center shadow-sm">
              <Logo showText={false} height={32} />
            </div>
            <span className="hidden sm:inline-block font-display font-extrabold text-white text-lg tracking-tight">
              New Age Biologics
            </span>
          </Link>

          {/* Center: Desktop Navigation */}
          <div className="hidden md:flex items-center gap-2">
            {navLinks.map((link) => (
              <NavLink
                key={link.path}
                to={link.path}
                className={({ isActive }) =>
                  `px-4 py-2 rounded-lg text-sm font-semibold transition-colors duration-200 hover:bg-white/10 ${
                    isActive ? 'bg-white/20 text-white' : 'text-sky-100/80 hover:text-white'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </div>

          {/* Right: Actions */}
          <div className="hidden md:flex items-center gap-4">
            <NavLink
              to="/cart"
              className={({ isActive }) =>
                `p-2.5 rounded-lg border border-white/15 relative transition-colors duration-200 hover:bg-white/10 ${
                  isActive ? 'bg-white/20 text-white' : 'text-sky-100/80 hover:text-white'
                }`
              }
            >
              <ShoppingCart size={18} />
              {totalItems > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-destructive text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border-2 border-primary">
                  {totalItems}
                </span>
              )}
            </NavLink>

            <NavLink
              to="/profile"
              className={({ isActive }) =>
                `p-2.5 rounded-lg border border-white/15 transition-colors duration-200 hover:bg-white/10 ${
                  isActive ? 'bg-white/20 text-white' : 'text-sky-100/80 hover:text-white'
                }`
              }
              title="Profile"
            >
              <User size={18} />
            </NavLink>

            <button
              onClick={handleLogout}
              className="p-2.5 rounded-lg border border-white/15 hover:bg-white/10 text-sky-100/80 hover:text-rose-200 transition-colors duration-200 cursor-pointer"
              title="Log Out"
            >
              <LogOut size={18} />
            </button>
          </div>

          {/* Mobile Hamburger Trigger */}
          <div className="flex md:hidden items-center gap-3">
            <NavLink
              to="/cart"
              className="p-2.5 border border-white/15 rounded-lg relative text-sky-100/80 hover:text-white"
            >
              <ShoppingCart size={18} />
              {totalItems > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-destructive text-white w-4.5 h-4.5 rounded-full flex items-center justify-center text-[9px] font-bold">
                  {totalItems}
                </span>
              )}
            </NavLink>

            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="p-2 border border-white/15 rounded-lg text-sky-100/80 cursor-pointer hover:bg-white/10 hover:text-white"
            >
              {mobileOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Drawer from Right */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 mobile-nav-backdrop z-[90] md:hidden"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.3 }}
              className="fixed right-0 top-0 bottom-0 w-72 mobile-nav-drawer text-white z-[100] p-6 flex flex-col md:hidden shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
                <span className="font-display font-extrabold text-white text-md">Navigation</span>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex flex-col gap-2">
                {navLinks.map((link) => (
                  <NavLink
                    key={link.path}
                    to={link.path}
                    onClick={() => setMobileOpen(false)}
                    className={({ isActive }) =>
                      `py-2.5 px-4 rounded-lg text-sm font-semibold transition-all ${
                        isActive
                          ? 'bg-primary text-white shadow-md shadow-primary/20'
                          : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                      }`
                    }
                  >
                    {link.label}
                  </NavLink>
                ))}
              </div>

              <div className="mt-auto pt-6 border-t border-slate-800 flex flex-col gap-2">
                <NavLink
                  to="/profile"
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    `py-2.5 px-4 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all ${
                      isActive
                        ? 'bg-primary text-white shadow-md shadow-primary/20'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                    }`
                  }
                >
                  <User size={16} /> Profile
                </NavLink>

                <button
                  onClick={() => {
                    setMobileOpen(false);
                    handleLogout();
                  }}
                  className="py-2.5 px-4 text-left rounded-lg text-sm font-semibold text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <LogOut size={16} /> Log Out
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

function Footer() {
  return (
    <footer className="bg-foreground text-background mt-auto font-sans">
      <div className="max-w-[95%] mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 text-left">
          {/* Col 1: Logo & Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Logo showText={false} height={32} color="#FFFFFF" dnaColor="hsl(180, 25%, 12%)" />
              <span className="font-display font-extrabold text-md text-white">New Age Biologics</span>
            </div>
            <p className="text-[10px] text-sky-400 tracking-wider font-extrabold uppercase">
              The Name You Can Trust
            </p>
            <p className="text-sm text-background/70 leading-relaxed">
              Premium hospital-grade sanitizers, disinfectants, and biochemical cleaning formulations serving medical centers and clinical labs across India.
            </p>
          </div>

          {/* Col 2: Quick Links */}
          <div className="space-y-4">
            <h4 className="font-display font-bold text-sm text-primary">Quick Links</h4>
            <ul className="space-y-2 text-sm text-background/70">
              <li><Link to="/home" className="hover:text-primary transition-colors">Home</Link></li>
              <li><Link to="/about" className="hover:text-primary transition-colors">About Us</Link></li>
              <li><Link to="/products" className="hover:text-primary transition-colors">Products</Link></li>
              <li><Link to="/contact" className="hover:text-primary transition-colors">Contact Us</Link></li>
            </ul>
          </div>

          {/* Col 3: Product Types */}
          <div className="space-y-4">
            <h4 className="font-display font-bold text-sm text-primary">Our Products</h4>
            <ul className="space-y-2 text-sm text-background/50 cursor-default">
              <li>Surface Disinfectants</li>
              <li>Hand Sanitizers</li>
              <li>Hospital Cleaning Chemicals</li>
              <li>Equipment</li>
            </ul>
          </div>

          {/* Col 4: Contact info */}
          <div className="space-y-4">
            <h4 className="font-display font-bold text-sm text-primary">Contact Info</h4>
            <ul className="space-y-3 text-sm text-background/70">
              <li className="flex items-center gap-2">
                <User size={16} className="text-primary flex-shrink-0" />
                <span className="font-semibold text-white">K. Purushotham (PO)</span>
              </li>
              <li className="flex items-start gap-2">
                <MapPin size={16} className="text-primary flex-shrink-0 mt-0.5" />
                <a
                  href="https://www.google.com/maps/search/?api=1&query=9-9-10%2F1%2C+Ground+Floor%2C+Reddy+Plaza%2C+Reddy+Colony%2C+Champapet%2C+Hyderabad+500059"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="leading-snug hover:text-white hover:underline transition-colors"
                  title="Open location in Google Maps"
                >
                  9-9-10/1, Ground Floor, Reddy Plaza, Reddy Colony, Champapet, Hyderabad – 500059, Telangana, India
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Phone size={16} className="text-primary flex-shrink-0" />
                <a
                  href="https://wa.me/918897982828?text=Hello%20New%20Age%20Biologics%2C%20I%20would%20like%20to%20inquire%20about%20your%20products."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white hover:underline transition-colors"
                  title="Chat on WhatsApp"
                >
                  +91 8897982828
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Mail size={16} className="text-primary flex-shrink-0" />
                <a
                  href="https://mail.google.com/mail/?view=cm&fs=1&to=po@newagebiologics.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white hover:underline transition-colors"
                  title="Compose email in Gmail"
                >
                  po@newagebiologics.in
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Clock size={16} className="text-primary flex-shrink-0" />
                <span>Mon - Sat: 9:00 AM - 6:00 PM</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-background/10 mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-background/50 gap-4">
          <p>© {new Date().getFullYear()} New Age Biologics. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

function WhatsAppFloatingButton() {
  return (
    <motion.div
      className="fixed bottom-8 right-8 z-50 flex items-center justify-center select-none"
      animate={{ y: [0, -6, 0] }}
      transition={{
        duration: 2.2,
        repeat: Infinity,
        ease: 'easeInOut'
      }}
    >
      {/* Premium ambient pulsating aura waves behind the button */}
      <motion.div
        className="absolute w-16 h-16 bg-[#25D366]/40 rounded-full pointer-events-none"
        animate={{
          scale: [1, 1.5, 2.1],
          opacity: [0.6, 0.3, 0],
        }}
        transition={{
          duration: 2.2,
          repeat: Infinity,
          ease: "easeOut",
        }}
      />
      <motion.div
        className="absolute w-16 h-16 bg-[#25D366]/30 rounded-full pointer-events-none"
        animate={{
          scale: [1, 1.3, 1.6],
          opacity: [0.5, 0.2, 0],
        }}
        transition={{
          duration: 2.2,
          delay: 0.7,
          repeat: Infinity,
          ease: "easeOut",
        }}
      />

      {/* Main chatbot floating button */}
      <motion.a
        href="https://wa.me/918897982828?text=Hello!%20I%20am%20interested%20in%20New%20Age%20Biologics%20products."
        target="_blank"
        rel="noopener noreferrer"
        className="group w-16 h-16 bg-gradient-to-tr from-[#128C7E] to-[#25D366] text-white rounded-full flex items-center justify-center shadow-[0_6px_20px_rgba(37,211,102,0.45)] border-2 border-white/40 cursor-pointer relative z-10"
        whileHover={{
          scale: 1.18,
          boxShadow: "0 0 35px 12px rgba(37, 211, 102, 0.8), 0 0 60px 22px rgba(37, 211, 102, 0.45), inset 0 0 15px rgba(255, 255, 255, 0.6)",
          borderColor: "rgba(255, 255, 255, 1)",
        }}
        whileTap={{ scale: 0.95 }}
        transition={{
          type: "spring",
          stiffness: 400,
          damping: 15
        }}
        title="Chat on WhatsApp"
        aria-label="Chat on WhatsApp"
      >
        <svg
          className="w-8 h-8 fill-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.2)] transition-transform duration-500 ease-out group-hover:scale-110 group-hover:rotate-6"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
        </svg>
      </motion.a>
    </motion.div>
  );
}

export default function CustomerLayout() {
  return (
    <CartProvider>
      <div className="min-h-screen bg-background flex flex-col relative overflow-x-hidden">
        {/* Ambient light blue background glow backdrops (corners, middle, sides) */}
        <div className="fixed top-[-15%] left-[-10%] w-[600px] h-[600px] bg-primary/12 rounded-full blur-[140px] pointer-events-none z-0" />
        <div className="fixed top-[-15%] right-[-10%] w-[600px] h-[600px] bg-sky-500/10 rounded-full blur-[140px] pointer-events-none z-0" />
        <div className="fixed bottom-[-15%] right-[-10%] w-[600px] h-[600px] bg-accent/12 rounded-full blur-[140px] pointer-events-none z-0" />
        <div className="fixed bottom-[-15%] left-[-10%] w-[600px] h-[600px] bg-teal-400/8 rounded-full blur-[140px] pointer-events-none z-0" />
        <div className="fixed top-[20%] left-[-5%] w-[450px] h-[450px] bg-sky-400/9 rounded-full blur-[120px] pointer-events-none z-0" />
        <div className="fixed top-[45%] right-[-5%] w-[450px] h-[450px] bg-indigo-400/9 rounded-full blur-[120px] pointer-events-none z-0" />
        <div className="fixed top-[70%] left-[2%] w-[450px] h-[450px] bg-sky-300/9 rounded-full blur-[120px] pointer-events-none z-0" />
        <div className="fixed top-[85%] right-[2%] w-[450px] h-[450px] bg-teal-300/9 rounded-full blur-[120px] pointer-events-none z-0" />
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-sky-300/11 rounded-full blur-[140px] pointer-events-none z-0" />

        <Navbar />
        <main className="flex-1 w-full max-w-[95%] mx-auto px-4 sm:px-6 lg:px-8 py-8 mt-16 relative z-10">
          <Outlet />
        </main>
        <Footer />
        <WhatsAppFloatingButton />
      </div>
    </CartProvider>
  );
}
