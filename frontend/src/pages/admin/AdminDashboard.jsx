import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Product, Order, ContactMessage, User, DeliveryAgent, Assignment, LiveLocation } from '../../services/api';
import { Package, Users, ClipboardList, Mail, AlertTriangle, CheckCircle2, TrendingUp, Truck, Compass, Activity, MapPin } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { motion } from 'framer-motion';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('store');

  // TanStack Queries for admin metrics
  const { data: products = [] } = useQuery({
    queryKey: ['adminProducts'],
    queryFn: () => Product.list('-created_date', 1000)
  });

  const { data: orders = [] } = useQuery({
    queryKey: ['adminOrders'],
    queryFn: () => Order.list('-created_date', 1000)
  });

  const { data: messages = [] } = useQuery({
    queryKey: ['adminMessages'],
    queryFn: () => ContactMessage.list()
  });

  const { data: customers = [] } = useQuery({
    queryKey: ['adminCustomers'],
    queryFn: () => User.list()
  });

  // Logistics Queries
  const { data: agents = [] } = useQuery({
    queryKey: ['adminAgents'],
    queryFn: () => DeliveryAgent.list()
  });

  const { data: assignments = [] } = useQuery({
    queryKey: ['adminAssignments'],
    queryFn: () => Assignment.list()
  });

  const { data: liveLocations = [] } = useQuery({
    queryKey: ['liveLocations'],
    queryFn: () => LiveLocation.list()
  });

  // Store Analytics computations
  const totalProducts = products.length;
  const totalCustomers = customers.length;
  const totalOrders = orders.length;
  const totalMessages = messages.length;

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const currentMonthOrders = orders.filter(o => {
    if (!o.createdAt) return false;
    const orderDate = new Date(o.createdAt);
    return orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear;
  });

  const currentMonthRevenue = currentMonthOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
  const lowStock = products.filter(p => p.stock_quantity < 10);

  // Store Status Chart
  const statusCounts = orders.reduce((acc, o) => {
    acc[o.status] = (acc[o.status] || 0) + 1;
    return acc;
  }, {});

  const barChartData = [
    { name: 'Pending', count: statusCounts['Pending'] || 0 },
    { name: 'Viewed', count: statusCounts['Viewed'] || 0 },
    { name: 'Contacted', count: statusCounts['Contacted'] || 0 },
    { name: 'Confirmed', count: statusCounts['Confirmed'] || 0 },
    { name: 'Delivered', count: statusCounts['Delivered'] || 0 }
  ];

  const catCounts = products.reduce((acc, p) => {
    acc[p.category] = (acc[p.category] || 0) + 1;
    return acc;
  }, {});

  const pieChartData = Object.keys(catCounts).map(cat => ({
    name: cat,
    value: catCounts[cat]
  }));

  const PIE_COLORS = ['hsl(211,84%,45%)', 'hsl(200,95%,47%)', '#0d9488', '#7c3aed', '#ea580c'];

  // Logistics Analytics computations
  const totalAgents = agents.length;
  const activeAgentsCount = agents.filter(a => a.status === 'Active').length;
  const onlineAgentsCount = liveLocations.filter(l => l.status === 'Online' || l.status === 'Moving').length;
  
  const totalAssignments = assignments.length;
  const pendingAssignments = assignments.filter(a => ['Assigned', 'Accepted', 'Picked Up', 'Out For Delivery'].includes(a.status)).length;
  const completedAssignments = assignments.filter(a => a.status === 'Delivered').length;
  const failedAssignments = assignments.filter(a => a.status === 'Unable To Deliver').length;

  // Logistics charts: status breakdown
  const delStatusCounts = assignments.reduce((acc, a) => {
    acc[a.status] = (acc[a.status] || 0) + 1;
    return acc;
  }, {});

  const deliveryPieData = Object.keys(delStatusCounts).map(status => ({
    name: status,
    value: delStatusCounts[status]
  }));

  const DEL_COLORS = ['#3b82f6', '#6366f1', '#f97316', '#14b8a6', '#10b981', '#ef4444'];

  // Logistics charts: distance buckets
  const distanceBuckets = { '0-3 km': 0, '3-7 km': 0, '7+ km': 0 };
  assignments.forEach(a => {
    const dist = parseFloat(a.distance || 0);
    if (dist <= 3) distanceBuckets['0-3 km']++;
    else if (dist <= 7) distanceBuckets['3-7 km']++;
    else distanceBuckets['7+ km']++;
  });

  const deliveryDistanceData = Object.keys(distanceBuckets).map(key => ({
    name: key,
    count: distanceBuckets[key]
  }));

  // Store tab metrics layout
  const statCards = [
    { label: 'Total Products', value: totalProducts, icon: <Package className="text-primary" size={22} /> },
    { label: 'Total Hospital Partners', value: totalCustomers, icon: <Users className="text-sky-500" size={22} /> },
    { label: 'Purchase Inquiries', value: totalOrders, icon: <ClipboardList className="text-teal-600" size={22} /> },
    { label: 'Support Inbox', value: totalMessages, icon: <Mail className="text-violet-600" size={22} /> },
    { label: `Revenue (${new Date().toLocaleString('default', { month: 'short' })})`, value: `₹${currentMonthRevenue.toLocaleString('en-IN')}`, icon: <TrendingUp className="text-emerald-600" size={22} /> }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6 text-left font-sans"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold font-display text-slate-900 leading-tight">Dashboard</h1>
          <p className="text-xs text-muted">Welcome to NAB Admin Portal</p>
        </div>

        {/* Switcher Tab */}
        <div className="bg-slate-100 p-1 rounded-2xl flex gap-1 self-start sm:self-center border border-slate-200 shadow-sm">
          <button
            onClick={() => setActiveTab('store')}
            className={`py-1.5 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'store'
                ? 'bg-white text-slate-950 shadow-sm font-extrabold'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Store Overview
          </button>
          <button
            onClick={() => setActiveTab('logistics')}
            className={`py-1.5 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'logistics'
                ? 'bg-white text-slate-950 shadow-sm font-extrabold'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Logistics & Delivery
          </button>
        </div>
      </div>

      {activeTab === 'store' ? (
        <>
          {/* Low Stock Alert Box */}
          {lowStock.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-destructive/5 border border-destructive/20 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm relative overflow-hidden"
            >
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-destructive" />
              <div className="flex items-start gap-3 relative z-10">
                <AlertTriangle className="text-destructive flex-shrink-0 mt-0.5 animate-pulse" size={20} />
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-destructive uppercase tracking-wider">
                    Low Stock Warning ({lowStock.length} items)
                  </h4>
                  <p className="text-xs text-slate-600">
                    The following formulations have fallen below 10 units in warehouse reserve:{' '}
                    <span className="font-bold text-slate-900">
                      {lowStock.map(p => `${p.name} (${p.stock_quantity})`).join(', ')}
                    </span>
                    .
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Stats Cards Grid */}
          <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {statCards.map((c, idx) => (
              <motion.div
                key={idx}
                whileHover={{ y: -4 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="glass bg-white border border-slate-100 p-6 rounded-xl flex items-center justify-between hover:border-sky-400/80 hover:shadow-lg hover:shadow-sky-500/5 transition-all cursor-default"
              >
                <div className="space-y-2">
                  <span className="text-[10px] text-muted font-bold uppercase tracking-wider">{c.label}</span>
                  <div className="text-3xl font-black text-slate-900 tracking-tight font-display">{c.value}</div>
                </div>
                <div className="w-12 h-12 rounded-xl bg-sky-50/50 border border-sky-100/50 flex items-center justify-center">
                  {c.icon}
                </div>
              </motion.div>
            ))}
          </section>

          {/* 2 Charts side by side */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Order Status Overview (Bar Chart) */}
            <div className="glass bg-white border border-slate-100 p-6 rounded-xl flex flex-col justify-between h-[380px] hover:border-sky-400/50 hover:shadow-lg hover:shadow-sky-500/5 transition-all duration-300">
              <h3 className="font-display font-bold text-foreground text-sm border-b border-border pb-3">
                Order Status Overview
              </h3>
              <div className="h-64 w-full pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} allowDecimals={false} />
                    <Tooltip cursor={{ fill: '#f0f9ff/30' }} contentStyle={{ fontSize: '11px', borderRadius: '8px' }} />
                    <Bar 
                      dataKey="count" 
                      fill="hsl(211,84%,45%)" 
                      radius={[6, 6, 0, 0]} 
                      name="Orders Count"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Products by Category (Pie Chart) */}
            <div className="glass bg-white border border-slate-100 p-6 rounded-xl flex flex-col justify-between h-[380px] hover:border-sky-400/50 hover:shadow-lg hover:shadow-sky-500/5 transition-all duration-300">
              <h3 className="font-display font-bold text-foreground text-sm border-b border-border pb-3">
                Products by Category
              </h3>
              <div className="h-64 w-full pt-4">
                {pieChartData.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-xs text-muted">
                    No product categories seeded.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieChartData}
                        cx="50%"
                        cy="45%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {pieChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '8px' }} />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '10px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

          </section>

          {/* Recent Orders Table */}
          <section className="glass bg-white border border-slate-100 p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
            <h3 className="font-display font-bold text-foreground text-sm border-b border-border pb-3 mb-4">
              Recent Procurements
            </h3>
            <div className="overflow-x-auto">
              {orders.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">No recent orders yet.</div>
              ) : (
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="text-slate-400 font-bold uppercase tracking-wider border-b border-slate-100">
                      <th className="py-3">Order ID</th>
                      <th className="py-3">Customer</th>
                      <th className="py-3">Contact</th>
                      <th className="py-3">Total Amount</th>
                      <th className="py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {orders.slice(0, 5).map(o => (
                      <tr key={o.id} className="hover:bg-sky-50/40 transition-colors">
                        <td className="py-3 font-mono font-bold text-slate-900">#{o.id}</td>
                        <td className="py-3">{o.customer_name}</td>
                        <td className="py-3 text-slate-500">{o.customer_email}</td>
                        <td className="py-3 font-bold text-foreground">₹{o.total_amount.toLocaleString('en-IN')}</td>
                        <td className="py-3">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                            o.status === 'Pending'
                              ? 'bg-amber-100 text-amber-800'
                              : o.status === 'Confirmed'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-primary-100 text-primary-800'
                          }`}>
                            {o.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </section>
        </>
      ) : (
        <>
          {/* Logistics Dashboard Metrics */}
          <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { label: 'Registered Dispatchers', value: totalAgents, icon: <Users className="text-indigo-600" /> },
              { label: 'Dispatchers Online', value: onlineAgentsCount, icon: <Activity className="text-emerald-500 animate-pulse" /> },
              { label: 'Active Delivery Tasks', value: pendingAssignments, icon: <Truck className="text-sky-500" /> },
              { label: 'Finalized Handovers', value: completedAssignments, icon: <CheckCircle2 className="text-teal-600" /> }
            ].map((card, idx) => (
              <motion.div
                key={idx}
                whileHover={{ y: -4 }}
                className="glass bg-white border border-slate-100 p-6 rounded-xl flex items-center justify-between hover:shadow-lg transition-all"
              >
                <div className="space-y-1.5">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{card.label}</span>
                  <div className="text-3xl font-black text-slate-900 font-display">{card.value}</div>
                </div>
                <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center">
                  {card.icon}
                </div>
              </motion.div>
            ))}
          </section>

          {/* Logistics Charts */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Delivery Status (Pie chart) */}
            <div className="glass bg-white border border-slate-100 p-6 rounded-xl flex flex-col justify-between h-[380px] hover:shadow-lg transition-all duration-300">
              <h3 className="font-display font-bold text-slate-800 text-sm border-b border-slate-100 pb-3">
                Logistics Dispatch Status
              </h3>
              <div className="h-64 w-full pt-4">
                {deliveryPieData.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-xs text-slate-400">
                    No dispatches recorded in ledger.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={deliveryPieData}
                        cx="50%"
                        cy="45%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {deliveryPieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={DEL_COLORS[index % DEL_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '8px' }} />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '10px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Distance statistics */}
            <div className="glass bg-white border border-slate-100 p-6 rounded-xl flex flex-col justify-between h-[380px] hover:shadow-lg transition-all duration-300">
              <h3 className="font-display font-bold text-slate-800 text-sm border-b border-slate-100 pb-3">
                Delivery Range Buckets
              </h3>
              <div className="h-64 w-full pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={deliveryDistanceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} allowDecimals={false} />
                    <Tooltip cursor={{ fill: '#f1f5f9/30' }} contentStyle={{ fontSize: '11px', borderRadius: '8px' }} />
                    <Bar 
                      dataKey="count" 
                      fill="hsl(200,95%,47%)" 
                      radius={[6, 6, 0, 0]} 
                      name="Orders Count"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

          </section>

          {/* Active dispatches list table */}
          <section className="glass bg-white border border-slate-100 p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
            <h3 className="font-display font-bold text-slate-800 text-sm border-b border-slate-100 pb-3 mb-4">
              Active Logistics Task Ledger
            </h3>
            <div className="overflow-x-auto">
              {assignments.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">No dispatch handovers recorded yet.</div>
              ) : (
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="text-slate-400 font-bold uppercase tracking-wider border-b border-slate-100">
                      <th className="py-3">Order ID</th>
                      <th className="py-3">Agent</th>
                      <th className="py-3">Distance</th>
                      <th className="py-3">Priority</th>
                      <th className="py-3">Handoff Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {assignments.slice(0, 8).map(asg => (
                      <tr key={asg.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 font-mono font-bold text-slate-900">#{asg.orderId}</td>
                        <td className="py-3 font-bold text-primary">{asg.agentName}</td>
                        <td className="py-3">{asg.distance} km</td>
                        <td className="py-3 font-semibold uppercase">{asg.priority}</td>
                        <td className="py-3">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border ${
                            asg.status === 'Delivered'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : asg.status === 'Unable To Deliver'
                              ? 'bg-red-50 text-red-700 border-red-200'
                              : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                          }`}>
                            {asg.status || 'Assigned'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </section>
        </>
      )}

    </motion.div>
  );
}
