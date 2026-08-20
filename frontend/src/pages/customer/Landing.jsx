import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Logo from '../../components/Logo';
import { 
  ArrowRight, 
  LogIn, 
  UserPlus, 
  Shield, 
  ShieldCheck, 
  Truck, 
  Clock, 
  CheckCircle2, 
  Activity, 
  Building2, 
  ClipboardCheck, 
  Layers,
  ChevronDown
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function Landing() {
  const { user, admin, staff } = useAuth();
  const navigate = useNavigate();
  const canvasRef = useRef(null);

  // Redirect authenticated users to home or complete profile
  useEffect(() => {
    if (admin) {
      navigate('/admin');
      return;
    }
    if (staff) {
      navigate('/staff');
      return;
    }
    if (user) {
      if (!user.profileCompleted) {
        navigate('/complete-profile');
      } else {
        navigate('/home');
      }
    }
  }, [user, admin, staff, navigate]);

  // Interactive Background Particle Effect on Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Array for background constellation/stars
    const backgroundStars = [];

    // Initialize background stars in a radial dispersion
    const initBackgroundStars = () => {
      backgroundStars.length = 0;
      const count = Math.min(180, Math.floor((width * height) / 8000));
      const centerX = width / 2;
      const centerY = height / 2;

      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const distance = 80 + Math.random() * (Math.min(width, height) * 0.45);
        const x = centerX + Math.cos(angle) * distance;
        const y = centerY + Math.sin(angle) * distance;

        backgroundStars.push({
          x,
          y,
          centerX,
          centerY,
          angle,
          distance,
          speed: 0.0003 + Math.random() * 0.0005,
          size: 1 + Math.random() * 2,
          color: i % 2 === 0 ? 'rgba(99, 102, 241, 0.45)' : 'rgba(59, 130, 246, 0.45)',
          pulseSpeed: 0.02 + Math.random() * 0.03,
          pulseVal: Math.random() * Math.PI
        });
      }
    };

    initBackgroundStars();

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      initBackgroundStars();
    };

    window.addEventListener('resize', handleResize);

    const animate = () => {
      ctx.clearRect(0, 0, width, height);

      // 1. Draw and update background constellation stars
      backgroundStars.forEach((star) => {
        star.angle += star.speed;
        star.x = star.centerX + Math.cos(star.angle) * star.distance;
        star.y = star.centerY + Math.sin(star.angle) * star.distance;

        star.pulseVal += star.pulseSpeed;
        const currentAlpha = 0.2 + (Math.sin(star.pulseVal) + 1) * 0.3;

        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fillStyle = star.color;
        ctx.globalAlpha = currentAlpha;
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const features = [
    {
      icon: <ShieldCheck className="text-primary" size={24} />,
      title: "Hospital Grade Quality",
      description: "WHO-GMP, FDA, and ISO 9001:2015 certified formulations matching the highest clinical decontamination standards."
    },
    {
      icon: <Truck className="text-primary" size={24} />,
      title: "Telemetry Logistics",
      description: "Interactive Leaflet maps tracking dispatcher movements, shift availability, and courier routes in real-time."
    },
    {
      icon: <Clock className="text-primary" size={24} />,
      title: "Rapid B2B Procurement",
      description: "Direct wholesale quote compilation via one-click WhatsApp forwarding or built-in secure purchase desks."
    },
    {
      icon: <ClipboardCheck className="text-primary" size={24} />,
      title: "Verified Handoff Receipts",
      description: "Secure digital logs capturing client signatures, physical photo checks, dispatcher notes, and invoicing histories."
    }
  ];

  const categories = [
    {
      title: "Surface Disinfectants",
      count: "Hospital Grade",
      desc: "Quaternary ammonium compounds & fast-evaporating isopropyl-alcohol sprays for clinics, diagnostic probes, and surgical suites.",
      items: ["NAB Shield Pro", "SterilAll Spray"]
    },
    {
      title: "Hand Sanitizers",
      count: "WHO Standard",
      desc: "WHO-formulated premium hand rubs with 75% isopropyl alcohol, enriched with aloe vera moisturizers for frequent clinical sanitization.",
      items: ["NAB GelRub (5L)", "SaniGel Extra Soft", "NAB PureTouch Mist"]
    },
    {
      title: "Hospital Cleaning Chemicals",
      count: "Enzymatic",
      desc: "Triple-enzyme concentrates to break down bio-load, blood spills, and effervescent chlorine tablets for wards decontamination.",
      items: ["NAB BioClean Concentrate", "NAB Chlorine Tabs", "Instrument Soak Pro"]
    },
    {
      title: "Equipment & Stands",
      count: "Contactless",
      desc: "Infrared automatic sanitizing dispenser stands, ICU cold-fogging machines, and rapid UV-C sterilization chambers.",
      items: ["Auto-Dispenser Stand", "Fogging Machine Ultra", "UV-C Sterilizer Box"]
    }
  ];

  const steps = [
    {
      num: "01",
      title: "Submit Inquiry",
      desc: "Hospitals register, compile custom B2B formulations in the cart, and click Send to Owner."
    },
    {
      num: "02",
      title: "Sales Validation",
      desc: "Administrative officers review the reserve, call back leads, and finalize the price quotes."
    },
    {
      num: "03",
      title: "Logistics Dispatch",
      desc: "Admins assign active couriers via the dashboard, instantly notifying the courier's logistics console."
    },
    {
      num: "04",
      title: "Bedside Handover",
      desc: "Riders deliver the cargo, capture recipient signatures and photo receipts, and archive the invoice."
    }
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col bg-grid-pattern relative overflow-x-hidden font-sans scroll-smooth">
      
      {/* Background Interactive Canvas */}
      <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0" />

      {/* Ambient background decoration wrapped to prevent page height stretching */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] animate-pulse-slow" />
        <div className="absolute bottom-[10%] right-[-10%] w-[600px] h-[600px] bg-accent/10 rounded-full blur-[120px] animate-pulse-slow" />
        <div className="absolute top-[35%] left-[-10%] w-[500px] h-[500px] bg-sky-500/5 rounded-full blur-[140px]" />
        <div className="absolute top-[70%] right-[-10%] w-[500px] h-[500px] bg-primary/5 rounded-full blur-[140px]" />
      </div>

      {/* Floating abstract decorative badge */}
      <div className="absolute top-6 left-6 z-10 flex items-center gap-2 bg-white/60 backdrop-blur-md border border-border px-3 py-1.5 rounded-full text-xs font-bold shadow-sm">
        <Shield size={14} className="text-primary animate-pulse" />
        <span className="text-foreground/80">WHO-GMP & FDA Certified Standard</span>
      </div>

      {/* SECTION 1: HERO VIEWPORT */}
      <section className="min-h-screen flex flex-col justify-between py-12 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex-1 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="max-w-2xl w-full text-center space-y-10"
          >
            {/* Animated Emblem */}
            <div className="flex justify-center">
              <motion.div 
                whileHover={{ scale: 1.05, rotate: 5 }}
                className="relative p-6 bg-white rounded-3xl shadow-xl shadow-primary/5 border border-border/50"
              >
                <Logo showText={false} height={80} />
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-teal-400 rounded-full border-2 border-white animate-ping" />
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-teal-400 rounded-full border-2 border-white" />
              </motion.div>
            </div>

            {/* Branding Content */}
            <div className="space-y-6 relative">
              {/* Floating Feature Card 1: Beside Name Left (Top) */}
              <motion.div
                animate={{ 
                  y: [0, -12, 0],
                  rotate: [0, -1.5, 1.5, 0]
                }}
                transition={{ 
                  duration: 6, 
                  repeat: Infinity, 
                  ease: "easeInOut" 
                }}
                whileHover={{ 
                  scale: 1.08, 
                  rotate: -2, 
                  y: -5,
                  borderColor: "rgba(56, 189, 248, 0.45)",
                  boxShadow: "0 20px 25px -5px rgba(56, 189, 248, 0.15), 0 10px 10px -5px rgba(56, 189, 248, 0.1)"
                }}
                className="absolute left-[-210px] xl:left-[-290px] lg:left-[-240px] top-[-10px] hidden lg:flex items-center gap-2.5 bg-white/75 backdrop-blur-md border border-sky-100 rounded-2xl p-3 shadow-md shadow-sky-500/5 select-none transition-colors duration-300 pointer-events-auto cursor-pointer"
              >
                <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 flex-shrink-0">
                  <ShieldCheck size={16} />
                </div>
                <div className="text-left">
                  <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-widest block leading-none">Safety Compliance</span>
                  <span className="text-xs font-bold text-slate-800 leading-tight">FDA & WHO GMP</span>
                </div>
              </motion.div>

              {/* Floating Feature Card 2: Beside Name Left (Bottom) */}
              <motion.div
                animate={{ 
                  y: [0, -9, 0],
                  rotate: [0, 1.2, -1.2, 0]
                }}
                transition={{ 
                  duration: 5.2, 
                  repeat: Infinity, 
                  ease: "easeInOut",
                  delay: 1.2
                }}
                whileHover={{ 
                  scale: 1.08, 
                  rotate: 2, 
                  y: -5,
                  borderColor: "rgba(56, 189, 248, 0.45)",
                  boxShadow: "0 20px 25px -5px rgba(56, 189, 248, 0.15), 0 10px 10px -5px rgba(56, 189, 248, 0.1)"
                }}
                className="absolute left-[-230px] xl:left-[-310px] lg:left-[-260px] top-[96px] hidden lg:flex items-center gap-2.5 bg-white/75 backdrop-blur-md border border-sky-100 rounded-2xl p-3 shadow-md shadow-sky-500/5 select-none transition-colors duration-300 pointer-events-auto cursor-pointer"
              >
                <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 flex-shrink-0">
                  <Activity size={16} />
                </div>
                <div className="text-left">
                  <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-widest block leading-none">Formulations</span>
                  <span className="text-xs font-bold text-slate-800 leading-tight">Clinical Grade Efficacy</span>
                </div>
              </motion.div>

              {/* Floating Feature Card 3: Beside Name Right (Top) */}
              <motion.div
                animate={{ 
                  y: [0, -11, 0],
                  rotate: [0, 1.5, -1.5, 0]
                }}
                transition={{ 
                  duration: 5.6, 
                  repeat: Infinity, 
                  ease: "easeInOut",
                  delay: 0.6
                }}
                whileHover={{ 
                  scale: 1.08, 
                  rotate: 2, 
                  y: -5,
                  borderColor: "rgba(56, 189, 248, 0.45)",
                  boxShadow: "0 20px 25px -5px rgba(56, 189, 248, 0.15), 0 10px 10px -5px rgba(56, 189, 248, 0.1)"
                }}
                className="absolute right-[-210px] xl:right-[-290px] lg:right-[-240px] top-[-10px] hidden lg:flex items-center gap-2.5 bg-white/75 backdrop-blur-md border border-sky-100 rounded-2xl p-3 shadow-md shadow-sky-500/5 select-none transition-colors duration-300 pointer-events-auto cursor-pointer"
              >
                <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 flex-shrink-0">
                  <Shield size={16} />
                </div>
                <div className="text-left">
                  <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-widest block leading-none">Custody</span>
                  <span className="text-xs font-bold text-slate-800 leading-tight">Secure Chain of Custody</span>
                </div>
              </motion.div>

              {/* Floating Feature Card 4: Beside Name Right (Bottom) */}
              <motion.div
                animate={{ 
                  y: [0, -10, 0],
                  rotate: [0, -1.2, 1.2, 0]
                }}
                transition={{ 
                  duration: 6.2, 
                  repeat: Infinity, 
                  ease: "easeInOut",
                  delay: 1.8
                }}
                whileHover={{ 
                  scale: 1.08, 
                  rotate: -2, 
                  y: -5,
                  borderColor: "rgba(56, 189, 248, 0.45)",
                  boxShadow: "0 20px 25px -5px rgba(56, 189, 248, 0.15), 0 10px 10px -5px rgba(56, 189, 248, 0.1)"
                }}
                className="absolute right-[-230px] xl:right-[-310px] lg:right-[-260px] top-[96px] hidden lg:flex items-center gap-2.5 bg-white/75 backdrop-blur-md border border-sky-100 rounded-2xl p-3 shadow-md shadow-sky-500/5 select-none transition-colors duration-300 pointer-events-auto cursor-pointer"
              >
                <div className="w-8 h-8 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600 flex-shrink-0">
                  <ClipboardCheck size={16} />
                </div>
                <div className="text-left">
                  <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-widest block leading-none">Verification</span>
                  <span className="text-xs font-bold text-slate-800 leading-tight">Signed Delivery Logs</span>
                </div>
              </motion.div>

              <motion.h2
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.5 }}
                className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black font-display text-foreground tracking-tight"
              >
                New Age Biologics
              </motion.h2>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="flex justify-center pt-2"
              >
                <span className="text-lg sm:text-xl md:text-2xl text-slate-700 bg-secondary/85 border border-primary/15 rounded-full px-6 py-2.5 font-bold tracking-wide shadow-md backdrop-blur-sm">
                  The Name You Can Trust
                </span>
              </motion.div>
            </div>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto"
            >
              {/* Get Started Button (For New Users) */}
              <button
                onClick={() => navigate('/register')}
                className="w-full sm:w-auto flex-1 h-14 bg-primary text-white rounded-xl font-bold text-base shadow-lg shadow-primary/20 hover:shadow-2xl hover:shadow-primary/35 hover:-translate-y-0.5 hover:bg-primary/95 transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 group"
              >
                <UserPlus size={18} className="transition-transform group-hover:scale-110" />
                <span>Get Started</span>
                <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
              </button>

              {/* Sign In Button (For Returning Users) */}
              <button
                onClick={() => navigate('/login')}
                className="w-full sm:w-auto flex-1 h-14 bg-white hover:bg-slate-50 border-2 border-border text-foreground hover:border-slate-400 hover:-translate-y-0.5 rounded-xl font-bold text-base transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 shadow-sm hover:shadow-md group"
              >
                <LogIn size={18} className="text-primary transition-transform group-hover:scale-110" />
                <span>Sign In</span>
              </button>
            </motion.div>
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <div 
          onClick={() => document.getElementById('features-section')?.scrollIntoView({ behavior: 'smooth' })}
          className="text-center flex flex-col items-center justify-center gap-1.5 opacity-60 hover:opacity-100 transition-opacity cursor-pointer z-10"
        >
          <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold font-display select-none">
            Scroll to Explore
          </span>
          <motion.div
            animate={{ y: [0, 5, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          >
            <ChevronDown size={20} className="text-primary" />
          </motion.div>
        </div>
      </section>

      {/* SECTION 2: FEATURES SECTION */}
      <section id="features-section" className="py-24 px-4 sm:px-6 lg:px-8 relative z-10 border-t border-slate-200 bg-white/30 backdrop-blur-[4px]">
        <div className="max-w-6xl mx-auto space-y-16">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-[10px] font-black text-primary uppercase tracking-widest block">Core Platform Capabilities</span>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-foreground font-display">
              Advanced Clinical Supply Architecture
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
              NAB Connect bridges the gap between biochemical production lines and hospital procurement registries with dedicated sales tracking.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feat, idx) => (
              <motion.div
                key={idx}
                whileHover={{ y: -6 }}
                className="glass-order-card bg-white rounded-2xl p-6 flex flex-col justify-between text-left h-full border border-sky-100 shadow-sm"
              >
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    {feat.icon}
                  </div>
                  <h4 className="text-sm font-bold font-display text-slate-900">{feat.title}</h4>
                  <p className="text-xs text-slate-500 leading-relaxed font-semibold">{feat.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 3: AVAILABILITIES / CATEGORIES CATALOG */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 relative z-10 border-t border-slate-200">
        <div className="max-w-6xl mx-auto space-y-16">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-[10px] font-black text-primary uppercase tracking-widest block">Medical Availability Range</span>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-foreground font-display">
              Hygiene & Decontamination Formulations
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
              Explore the main chemical categories currently active for B2B procurement. Access restricted to verified hospital leads.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {categories.map((cat, idx) => (
              <div 
                key={idx} 
                className="glass bg-white/70 backdrop-blur-md rounded-3xl p-6 sm:p-8 text-left border border-slate-200 shadow-sm flex flex-col justify-between space-y-6"
              >
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="text-base sm:text-lg font-black font-display text-slate-900">{cat.title}</h4>
                    <span className="bg-sky-50 text-primary border border-sky-100 text-[10px] font-bold px-3 py-1 rounded-full">
                      {cat.count}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">{cat.desc}</p>
                </div>

                <div className="space-y-2.5 border-t border-slate-100 pt-4">
                  <span className="text-[9px] uppercase tracking-wider font-extrabold text-slate-400 block">Common Formulations</span>
                  <div className="flex flex-wrap gap-2">
                    {cat.items.map((item, i) => (
                      <span key={i} className="bg-secondary/80 text-foreground text-[10px] font-bold px-2.5 py-1 rounded-lg border border-slate-200/50">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 4: PROCUREMENT TIMELINE PIPELINE */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 relative z-10 border-t border-slate-200 bg-white/30 backdrop-blur-[4px]">
        <div className="max-w-6xl mx-auto space-y-16">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-[10px] font-black text-primary uppercase tracking-widest block">Workflow Timeline</span>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-foreground font-display">
              B2B Order Distribution Cycle
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
              Understanding how inquiries are processed, quotes are confirmed, and dispatch assignments are delivered to clinic hubs.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
            {steps.map((step, idx) => (
              <div 
                key={idx} 
                className="relative bg-white/50 border border-slate-100 p-6 rounded-2xl text-left space-y-4 shadow-sm"
              >
                <div className="absolute top-4 right-6 font-mono font-black text-slate-200 text-4xl select-none">
                  {step.num}
                </div>
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                  {step.num}
                </div>
                <h4 className="text-sm font-bold font-display text-slate-900 pt-2">{step.title}</h4>
                <p className="text-xs text-slate-500 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-slate-950 text-white py-16 px-4 sm:px-6 lg:px-8 border-t border-slate-800 relative z-10">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-10 text-left">
          
          {/* Brand Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="bg-white p-1 rounded-lg">
                <Logo showText={false} height={28} />
              </div>
              <span className="font-display font-black text-md text-white">New Age Biologics</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed max-w-xs">
              Decontamination standard trusted by 3500+ hospital networks. Registered wholesalers of hospital-grade disinfectants and biochemical products.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-3 text-xs">
            <h4 className="font-display font-bold text-primary tracking-wider uppercase">Portal Actions</h4>
            <div className="flex flex-col gap-2.5 text-slate-400">
              <button onClick={() => navigate('/login')} className="hover:text-white transition-colors cursor-pointer text-left">Institutional Sign In</button>
              <button onClick={() => navigate('/register')} className="hover:text-white transition-colors cursor-pointer text-left">Register Clinic Profile</button>
              <button onClick={() => document.getElementById('features-section')?.scrollIntoView({ behavior: 'smooth' })} className="hover:text-white transition-colors cursor-pointer text-left">Platform Capabilities</button>
            </div>
          </div>

          {/* Contact Details */}
          <div className="space-y-3 text-xs text-slate-400">
            <h4 className="font-display font-bold text-primary tracking-wider uppercase">Corporate Desk</h4>
            <a
              href="https://www.google.com/maps/search/?api=1&query=9-9-10%2F1%2C+Ground+Floor%2C+Reddy+Plaza%2C+Reddy+Colony%2C+Champapet%2C+Hyderabad+500059"
              target="_blank"
              rel="noopener noreferrer"
              className="leading-snug block hover:text-white hover:underline transition-colors"
              title="Open location in Google Maps"
            >
              Reddy Plaza, Champapet,<br />
              Hyderabad – 500059, Telangana, India
            </a>
            <p className="pt-1">
              <a
                href="https://mail.google.com/mail/?view=cm&fs=1&to=po@newagebiologics.in"
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-slate-300 hover:text-white hover:underline transition-colors"
                title="Compose email in Gmail"
              >
                po@newagebiologics.in
              </a>
            </p>
            <p>
              <a
                href="https://wa.me/918897982828?text=Hello%20New%20Age%20Biologics%2C%20I%20would%20like%20to%20inquire%20about%20your%20products."
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-300 hover:text-white hover:underline transition-colors"
                title="Chat on WhatsApp"
              >
                +91 8897982828
              </a>
            </p>
          </div>
        </div>

        <div className="max-w-6xl mx-auto border-t border-slate-900 mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} New Age Biologics. All rights reserved.</p>
          <p className="uppercase tracking-widest text-[9px]">Institutional B2B Procurement Desk</p>
        </div>
      </footer>

    </div>
  );
}
