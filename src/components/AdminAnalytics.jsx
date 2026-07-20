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
        <div className="admin-panel-card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ padding: '12px', background: '#e3f2fd', borderRadius: '8px', color: '#1976d2' }}>
            <DollarSign size={24} />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: '13px', color: '#666' }}>Total Revenue</p>
            <h3 style={{ margin: '4px 0 0', fontSize: '24px' }}>₹{(kpis.totalRevenue).toLocaleString()}</h3>
          </div>
        </div>

        <div className="admin-panel-card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ padding: '12px', background: '#e8f5e9', borderRadius: '8px', color: '#388e3c' }}>
            <ShoppingCart size={24} />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: '13px', color: '#666' }}>Total Orders</p>
            <h3 style={{ margin: '4px 0 0', fontSize: '24px' }}>{kpis.totalOrders}</h3>
          </div>
        </div>

        <div className="admin-panel-card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ padding: '12px', background: '#fff3e0', borderRadius: '8px', color: '#f57c00' }}>
            <Users size={24} />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: '13px', color: '#666' }}>Total Customers</p>
            <h3 style={{ margin: '4px 0 0', fontSize: '24px' }}>{kpis.totalUsers}</h3>
          </div>
        </div>

        <div className="admin-panel-card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ padding: '12px', background: '#f3e5f5', borderRadius: '8px', color: '#7b1fa2' }}>
            <Package size={24} />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: '13px', color: '#666' }}>Total Products</p>
            <h3 style={{ margin: '4px 0 0', fontSize: '24px' }}>{kpis.totalProducts}</h3>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
        
        {/* Sales Line Chart */}
        <div className="admin-panel-card">
          <h3 style={{ margin: '0 0 20px', fontSize: '16px', color: '#333' }}>Revenue Over Last 30 Days</h3>
          <div style={{ width: '100%', height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={salesData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <Line type="monotone" dataKey="revenue" stroke="#2874f0" strokeWidth={3} dot={false} />
                <CartesianGrid stroke="#ccc" strokeDasharray="5 5" vertical={false} />
                <XAxis dataKey="date" tick={{fontSize: 12}} tickMargin={10} minTickGap={30} />
                <YAxis tick={{fontSize: 12}} tickFormatter={(value) => `₹${value/1000}k`} />
                <Tooltip formatter={(value) => `₹${value}`} labelStyle={{color: '#333'}} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

    </div>
  );
};

export default AdminAnalytics;
