
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Shield, 
  ArrowRight, 
  Package, 
  Users, 
  Award, 
  FlaskConical, 
  BadgePercent, 
  HeartPulse, 
  BadgeCheck, 
  Building2, 
  Stethoscope, 
  Pill 
} from 'lucide-react';

const fadeInUp = {
  hidden: { opacity: 0, y: 25 },
  visible: { opacity: 1, y: 0 }
};

export default function Home() {
  const navigate = useNavigate();

  const stats = [
    { icon: <Package className="text-primary" size={24} />, value: '250+', label: 'Products' },
    { icon: <Users className="text-primary" size={24} />, value: '3500+', label: 'Clients' },
    { icon: <Shield className="text-primary" size={24} />, value: '7+', label: 'Years Experience' },
    { icon: <Award className="text-primary" size={24} />, value: '25+', label: 'Certifications' }
  ];

  const features = [
    { 
      icon: <Shield size={24} />, 
      title: 'Hospital Grade Quality', 
      desc: 'Formulated to meet the highest sterilization standards required in surgical theatres and intensive care wards.' 
    },
    { 
      icon: <FlaskConical size={24} />, 
      title: 'Research Backed', 
      desc: 'Clinically tested chemical compositions engineered for broad-spectrum biological decontamination efficacy.' 
    },
    { 
      icon: <BadgePercent size={24} />, 
      title: 'Bulk Wholesale Pricing', 
      desc: 'Direct institutional-tier wholesale pricing with volume-based cost efficiencies for hospitals and clinics.' 
    },
    { 
      icon: <Award size={24} />, 
      title: 'Certified Products', 
      desc: 'ISO 9001:2015, WHO-GMP, and FDA compliant batches complete with analytical test certifications.' 
    },
    { 
      icon: <HeartPulse size={24} />, 
      title: 'Healthcare Focused', 
      desc: 'Dedicated support for emergency supplies, custom concentrations, and specialized hygiene systems.' 
    },
    { 
      icon: <BadgeCheck size={24} />, 
      title: 'Trusted Brand', 
      desc: 'Years of establishing institutional credentials under the emblem of reliability and clinical safety.' 
    }
  ];

  const industries = [
    { 
      icon: <Building2 className="text-primary" size={20} />, 
      title: 'Hospitals', 
      image: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=400&h=300&fit=crop' 
    },
    { 
      icon: <Stethoscope className="text-primary" size={20} />, 
      title: 'Clinics', 
      image: 'https://images.unsplash.com/photo-1631815588090-d4bfec5b1ccb?w=400&h=300&fit=crop' 
    },
    { 
      icon: <Pill className="text-primary" size={20} />, 
      title: 'Pharmacies', 
      image: 'https://images.unsplash.com/photo-1585435557343-3b092031a831?w=400&h=300&fit=crop' 
    },
    { 
      icon: <FlaskConical className="text-primary" size={20} />, 
      title: 'Laboratories', 
      image: 'https://images.unsplash.com/photo-1582719471384-894fbb16e074?w=400&h=300&fit=crop' 
    }
  ];



  return (
    <div className="space-y-0 text-left overflow-x-hidden font-sans">
      
      {/* === SECTION 1: HERO === */}
      <section className="relative bg-gradient-to-br from-primary/5 via-background to-accent/5 py-20 lg:py-28 px-4 sm:px-6 lg:px-8">
        
        {/* Decorative blobs */}
        <div className="absolute top-10 left-10 w-80 h-80 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 left-1/3 w-60 h-60 bg-teal-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-6xl mx-auto text-center space-y-8 relative z-10">
          
          {/* Trust badge pill */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0 }}
            className="inline-flex items-center gap-2 bg-primary/10 text-primary rounded-full px-4 py-1.5 text-xs font-bold"
          >
            <Shield size={14} />
            <span>Trusted by 3500+ Healthcare Institutions</span>
          </motion.div>

          {/* Heading */}
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-extrabold font-display text-foreground leading-tight tracking-tight"
          >
            Premium Healthcare{' '}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Solutions
            </span>{' '}
            You Can Trust
          </motion.h1>

          {/* Subtitle */}
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-sm sm:text-base text-muted max-w-2xl mx-auto leading-relaxed"
          >
            New Age Biologics delivers hospital-grade disinfectants, sanitizers, and cleaning solutions to hospitals, clinics, and pharmacies across India.
          </motion.p>

          {/* CTA Row */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-wrap items-center justify-center gap-4 pt-2"
          >
            <button
              onClick={() => navigate('/products')}
              className="px-8 py-4 bg-primary text-white rounded-lg shadow-xl shadow-primary/20 hover:shadow-2xl hover:shadow-primary/30 transition-all cursor-pointer font-bold text-sm flex items-center gap-2"
            >
              Browse Products <ArrowRight size={16} />
            </button>
            <button
              onClick={() => navigate('/contact')}
              className="px-8 py-4 border border-border hover:bg-secondary text-foreground rounded-lg transition-colors cursor-pointer font-bold text-sm"
            >
              Contact Sales
            </button>
          </motion.div>

          {/* Stats Grid */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-6 pt-12 text-left"
          >
            {stats.map((stat, idx) => (
              <div key={idx} className="glass-order-card rounded-2xl p-5 text-center space-y-2">
                <div className="mx-auto w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                  {stat.icon}
                </div>
                <div className="text-2xl font-black text-foreground font-display">{stat.value}</div>
                <div className="text-xs text-muted font-semibold tracking-wider uppercase">{stat.label}</div>
              </div>
            ))}
          </motion.div>

        </div>
      </section>

      {/* === SECTION 2: WHY CHOOSE NAB === */}
      <section className="py-20 bg-background px-4 sm:px-6 lg:px-8">
        <div className="max-w-none mx-auto space-y-12">
          
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <span className="text-xs font-bold text-primary tracking-widest uppercase">Why Choose NAB</span>
            <h2 className="text-3xl sm:text-4xl font-bold font-display text-foreground">
              The NAB Advantage
            </h2>
          </div>

          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={{
              visible: { transition: { staggerChildren: 0.05 } }
            }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {features.map((feat, idx) => (
              <motion.div
                key={idx}
                variants={fadeInUp}
                className="group glass-order-card rounded-2xl p-6 flex flex-col gap-4 text-left"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors duration-200">
                  {feat.icon}
                </div>
                <h3 className="text-lg font-bold font-display text-foreground">{feat.title}</h3>
                <p className="text-xs text-muted leading-relaxed">{feat.desc}</p>
              </motion.div>
            ))}
          </motion.div>

        </div>
      </section>

      {/* === SECTION 3: INDUSTRIES WE SERVE === */}
      <section className="py-20 bg-gradient-to-b from-secondary/50 to-background px-4 sm:px-6 lg:px-8">
        <div className="max-w-none mx-auto space-y-12">
          
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold font-display text-foreground">
              Healthcare Partners
            </h2>
          </div>

          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={{
              visible: { transition: { staggerChildren: 0.1 } }
            }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {industries.map((ind, idx) => (
              <motion.div
                key={idx}
                variants={fadeInUp}
                className="group glass-order-card rounded-2xl overflow-hidden flex flex-col"
              >
                {/* Image */}
                <div className="h-40 overflow-hidden relative">
                  <img
                    src={ind.image}
                    alt={ind.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                </div>
                {/* Icon Overlay & Title */}
                <div className="p-6 pt-0 flex flex-col items-center text-center relative">
                  <div className="w-12 h-12 rounded-full border-2 border-background bg-white flex items-center justify-center shadow-md -mt-6 z-10 relative">
                    {ind.icon}
                  </div>
                  <h3 className="mt-3 font-display font-bold text-foreground text-md">{ind.title}</h3>
                </div>
              </motion.div>
            ))}
          </motion.div>

        </div>
      </section>



      {/* === SECTION 5: CONTACT CTA === */}
      <section className="relative bg-gradient-to-r from-primary to-accent py-20 px-4 sm:px-6 lg:px-8 text-white overflow-hidden">
        
        {/* White decorative circles */}
        <div className="absolute top-[-50%] left-[-20%] w-[500px] h-[500px] bg-white/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-[-50%] right-[-20%] w-[500px] h-[500px] bg-white/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center space-y-6 relative z-10">
          <h2 className="text-3xl sm:text-4xl font-bold font-display text-white">
            Ready to Partner with NAB?
          </h2>
          <p className="text-sm sm:text-base text-white/80 max-w-xl mx-auto leading-relaxed">
            Get in touch with our sales team to discuss bulk orders, custom solutions, and partnership opportunities.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <button
              onClick={() => navigate('/contact')}
              className="px-8 py-3.5 bg-white text-primary rounded-lg font-bold text-sm shadow-lg hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Get In Touch
            </button>
            <a
              href="tel:+918897982828"
              className="px-8 py-3.5 border border-white hover:bg-white/10 text-white rounded-lg font-bold text-sm transition-colors"
            >
              Call Now
            </a>
          </div>
        </div>
      </section>

    </div>
  );
}
