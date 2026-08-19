import React from 'react';
import { motion } from 'framer-motion';
import { Target, Eye, Building2, Users, ShieldCheck, TrendingUp, Sparkles } from 'lucide-react';

export default function About() {
  const achievements = [
    { icon: <Building2 className="text-white" size={28} />, value: '3500+', label: 'Healthcare Partners' },
    { icon: <Users className="text-white" size={28} />, value: '50+', label: 'Team Members' },
    { icon: <ShieldCheck className="text-white" size={28} />, value: '250+', label: 'Products' },
    { icon: <TrendingUp className="text-white" size={28} />, value: '7+', label: 'Years Experience' }
  ];

  const milestones = [
    { title: 'Founded', desc: 'NAB was incorporated with a focus on institutional clinical hygiene formulations.' },
    { title: 'Expanded Everywhere', desc: 'Extended logistic distribution terminals to supply clinics and warehouses across India.' },
    { title: 'NAB Connect Launch', desc: 'Pioneered custom digital B2B procurements through our proprietary inquiry portal.' },
    { title: 'Industry Leader', desc: 'Honored as India’s most reliable biochemical formulation supplier in the hygiene sector.' }
  ];

  return (
    <div className="space-y-0 text-left overflow-x-hidden font-sans">
      
      {/* SECTION 1: HEADER */}
      <section className="bg-gradient-to-br from-primary/5 to-accent/5 py-12 px-6 sm:px-8 text-center rounded-2xl mb-10 border border-primary/5 shadow-sm">
        <div className="max-w-3xl mx-auto space-y-3">
          <span className="text-xs font-bold text-primary tracking-widest uppercase">About Us</span>
          <h1 className="text-4xl sm:text-5xl font-extrabold font-display text-foreground leading-tight">
            New Age Biologics
          </h1>
          <p className="text-sm sm:text-base text-muted max-w-xl mx-auto leading-relaxed">
            Delivering broad-spectrum medical grade safety, trust, and sanitary reliability across Indian hospitals for over 7 years.
          </p>
        </div>
      </section>

      {/* SECTION 2: MISSION, VISION & VALUES */}
      <section className="px-4 sm:px-6 lg:px-8 py-4 mb-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Mission card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="glass-order-card rounded-2xl p-8 space-y-4 flex flex-col justify-between"
          >
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <Target size={24} />
              </div>
              <h3 className="text-xl font-bold font-display text-foreground">Our Mission</h3>
              <p className="text-xs text-muted leading-relaxed">
                To provide world-class healthcare hygiene products and solutions that empower clinical staff, safeguard patients, and ensure completely sterile environments in every corner of India.
              </p>
            </div>
          </motion.div>

          {/* Vision card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="glass-order-card rounded-2xl p-8 space-y-4 flex flex-col justify-between"
          >
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
                <Eye size={24} />
              </div>
              <h3 className="text-xl font-bold font-display text-foreground">Our Vision</h3>
              <p className="text-xs text-muted leading-relaxed">
                To be the most trusted biochemical and decontamination brand in the nation, setting unprecedented benchmarks for quality, technological integration, and hospital health standards.
              </p>
            </div>
          </motion.div>

          {/* Core Values card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="glass-order-card rounded-2xl p-8 space-y-4 flex flex-col justify-between"
          >
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <Sparkles size={24} />
              </div>
              <h3 className="text-xl font-bold font-display text-foreground">Core Values</h3>
              <p className="text-xs text-muted leading-relaxed">
                Uncompromising purity, customer-first service, continuous chemical formulation research, and absolute integrity in all healthcare supply chain engagements.
              </p>
            </div>
          </motion.div>

        </div>
      </section>

      {/* SECTION 3: KEY ACHIEVEMENTS (STATS) */}
      <section className="px-4 sm:px-6 lg:px-8 py-8 mb-16 bg-gradient-to-r from-primary to-accent rounded-3xl text-white shadow-xl">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center divide-y lg:divide-y-0 lg:divide-x divide-white/10">
          {achievements.map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: idx * 0.1 }}
              className="pt-6 lg:pt-0 flex flex-col items-center space-y-2"
            >
              <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center mb-1 shadow-inner">
                {item.icon}
              </div>
              <div className="text-3xl sm:text-4xl font-extrabold font-display">{item.value}</div>
              <div className="text-xs uppercase tracking-wider font-semibold text-white/80">{item.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* SECTION 4: COMPANY TIMELINE (HORIZONTAL ON DESKTOP, ALTERNATING) */}
      <section className="px-4 sm:px-6 lg:px-8 py-10 mb-16">
        <div className="max-w-3xl mx-auto text-center space-y-3 mb-8">
          <span className="text-xs font-bold text-primary tracking-widest uppercase">Our Evolution</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold font-display text-foreground">
            Our Journey of Growth
          </h2>
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-sm sm:text-base text-muted max-w-xl mx-auto font-medium leading-relaxed"
          >
            A timeline of our regulatory milestones and distribution growths.
          </motion.p>
        </div>

        {/* Timeline Container */}
        <div className="relative">
          
          {/* Desktop/Tablet Horizontal Timeline */}
          <div className="hidden lg:block relative w-full pt-8 pb-8">
            <div className="absolute top-[179px] left-[12.5%] right-[12.5%] h-[2px] bg-primary/20 z-0" />
            
            <div className="grid grid-cols-4 gap-6 px-2 relative z-10">
              {milestones.map((m, idx) => {
                const isUp = idx % 2 === 0;
                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: isUp ? -25 : 25 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: idx * 0.08 }}
                    className="flex flex-col items-center justify-center relative min-h-[358px]"
                  >
                    <div className="w-full flex justify-center items-end h-[145px] mb-4">
                      {isUp ? (
                        <div className="glass-order-card rounded-xl p-4 w-full shadow-md text-left relative hover:-translate-y-1 transition-transform duration-300 border border-primary/10">
                          <h4 className="font-display font-bold text-foreground text-sm mb-1">
                            {m.title}
                          </h4>
                          <p className="text-[11px] text-muted leading-relaxed">
                            {m.desc}
                          </p>
                          <div className="absolute bottom-[-6px] left-1/2 -translate-x-1/2 w-3 h-3 rotate-45 bg-white/95 border-r border-b border-primary/10" />
                        </div>
                      ) : (
                        <div className="w-full h-full" />
                      )}
                    </div>

                    <div className="w-9 h-9 rounded-full bg-white border-2 border-primary flex items-center justify-center font-bold text-xs text-primary z-10 relative shadow-md ring-4 ring-primary/5 transition-transform duration-300 hover:scale-110">
                      {idx + 1}
                    </div>

                    <div className="w-full flex justify-center items-start h-[145px] mt-4">
                      {!isUp ? (
                        <div className="glass-order-card rounded-xl p-4 w-full shadow-md text-left relative hover:translate-y-1 transition-transform duration-300 border border-primary/10">
                          <h4 className="font-display font-bold text-foreground text-sm mb-1">
                            {m.title}
                          </h4>
                          <p className="text-[11px] text-muted leading-relaxed">
                            {m.desc}
                          </p>
                          <div className="absolute top-[-6px] left-1/2 -translate-x-1/2 w-3 h-3 rotate-45 bg-white/95 border-t border-l border-primary/10" />
                        </div>
                      ) : (
                        <div className="w-full h-full" />
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Mobile Vertical Timeline */}
          <div className="lg:hidden relative border-l-2 border-primary/20 ml-4 space-y-8 py-4">
            {milestones.map((m, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.05 }}
                className="relative pl-8"
              >
                <div className="absolute left-[-13px] top-1.5 w-6 h-6 rounded-full bg-white border-2 border-primary flex items-center justify-center font-bold text-[10px] text-primary z-10 shadow-sm">
                  {idx + 1}
                </div>

                <div className="glass-order-card rounded-xl p-5 shadow-sm text-left border border-primary/10">
                  <h4 className="font-display font-bold text-foreground text-sm mb-1.5">
                    {m.title}
                  </h4>
                  <p className="text-xs text-muted leading-relaxed">
                    {m.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

        </div>
      </section>

    </div>
  );
}
