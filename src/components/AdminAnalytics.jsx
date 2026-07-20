import React, { useEffect, useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar
} from 'recharts';
import { DollarSign, ShoppingCart, Users, Package } from 'lucide-react';

const AdminAnalytics = () => {
  const [salesData, setSalesData] = useState([]);
  const [kpis, setKpis] = useState({
    totalUsers: 0,
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0
  });

  useEffect(() => {
    // In a real scenario, this fetches from /api/v2/analytics/sales and /kpi
    // For this build, we simulate realistic data
    setKpis({
      totalUsers: 1420,
      totalProducts: 345,
      totalOrders: 890,
      totalRevenue: 450000
    });

    const mockSales = [];
    let currentRevenue = 15000;
    for (let i = 30; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      currentRevenue += (Math.random() * 5000) - 2000;
      mockSales.push({
        date: d.toISOString().split('T')[0],
        revenue: Math.floor(Math.max(5000, currentRevenue)),
        orders: Math.floor(Math.random() * 20) + 5
      });
    }
    setSalesData(mockSales);
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <div className="admin-panel-card" style={{ display: 'flex', alignItems: 'center', gap: '16px', transition: 'transform 0.2s', cursor: 'pointer' }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'} onMouseLeave={e => e.currentTarget.style.transform = 'none'}>
          <div style={{ padding: '14px', background: 'linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)', borderRadius: '12px', color: '#0284c7', boxShadow: '0 4px 12px rgba(2, 132, 199, 0.15)' }}>
            <DollarSign size={26} strokeWidth={2.5} />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: '13px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Revenue</p>
            <h3 style={{ margin: '4px 0 0', fontSize: '26px', color: '#0f172a', fontWeight: '800' }}>₹{(kpis.totalRevenue).toLocaleString()}</h3>
          </div>
        </div>

        <div className="admin-panel-card" style={{ display: 'flex', alignItems: 'center', gap: '16px', transition: 'transform 0.2s', cursor: 'pointer' }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'} onMouseLeave={e => e.currentTarget.style.transform = 'none'}>
          <div style={{ padding: '14px', background: 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)', borderRadius: '12px', color: '#16a34a', boxShadow: '0 4px 12px rgba(22, 163, 74, 0.15)' }}>
            <ShoppingCart size={26} strokeWidth={2.5} />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: '13px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Orders</p>
            <h3 style={{ margin: '4px 0 0', fontSize: '26px', color: '#0f172a', fontWeight: '800' }}>{kpis.totalOrders}</h3>
          </div>
        </div>

        <div className="admin-panel-card" style={{ display: 'flex', alignItems: 'center', gap: '16px', transition: 'transform 0.2s', cursor: 'pointer' }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'} onMouseLeave={e => e.currentTarget.style.transform = 'none'}>
          <div style={{ padding: '14px', background: 'linear-gradient(135deg, #fef08a 0%, #fde047 100%)', borderRadius: '12px', color: '#ca8a04', boxShadow: '0 4px 12px rgba(202, 138, 4, 0.15)' }}>
            <Users size={26} strokeWidth={2.5} />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: '13px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Customers</p>
            <h3 style={{ margin: '4px 0 0', fontSize: '26px', color: '#0f172a', fontWeight: '800' }}>{kpis.totalUsers}</h3>
          </div>
        </div>

        <div className="admin-panel-card" style={{ display: 'flex', alignItems: 'center', gap: '16px', transition: 'transform 0.2s', cursor: 'pointer' }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'} onMouseLeave={e => e.currentTarget.style.transform = 'none'}>
          <div style={{ padding: '14px', background: 'linear-gradient(135deg, #e9d5ff 0%, #d8b4fe 100%)', borderRadius: '12px', color: '#9333ea', boxShadow: '0 4px 12px rgba(147, 51, 234, 0.15)' }}>
            <Package size={26} strokeWidth={2.5} />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: '13px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Products</p>
            <h3 style={{ margin: '4px 0 0', fontSize: '26px', color: '#0f172a', fontWeight: '800' }}>{kpis.totalProducts}</h3>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
        
        {/* Sales Line Chart */}
        <div className="admin-panel-card">
          <h3 style={{ margin: '0 0 20px', fontSize: '18px', color: '#0f172a', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#4f46e5' }}></div>
            Revenue Over Last 30 Days
          </h3>
          <div style={{ width: '100%', height: '320px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={salesData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <Line type="monotone" dataKey="revenue" stroke="#4f46e5" strokeWidth={3} dot={{ r: 0 }} activeDot={{ r: 6, fill: '#4f46e5', stroke: '#fff', strokeWidth: 2 }} fillOpacity={1} fill="url(#colorRevenue)" />
                <CartesianGrid stroke="#e2e8f0" strokeDasharray="4 4" vertical={false} />
                <XAxis dataKey="date" tick={{fontSize: 12, fill: '#64748b'}} tickMargin={10} minTickGap={30} axisLine={false} tickLine={false} />
                <YAxis tick={{fontSize: 12, fill: '#64748b'}} tickFormatter={(value) => `₹${value/1000}k`} axisLine={false} tickLine={false} />
                <Tooltip 
                  formatter={(value) => [`₹${value.toLocaleString()}`, 'Revenue']}
                  labelStyle={{color: '#64748b', fontWeight: '600', marginBottom: '4px'}} 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

    </div>
  );
};

export default AdminAnalytics;
