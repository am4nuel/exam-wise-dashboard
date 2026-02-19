import React, { useState, useEffect } from 'react';
import API from '../api/axios';
import ROUTES from '../api/routes';
import {
  LineChart, Line, AreaChart, Area, PieChart, Pie, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell
} from 'recharts';
import { TrendingUp, Users, CreditCard, Package as PackageIcon, DollarSign, Activity } from 'lucide-react';
import './AnalyticsPage.css';

const AnalyticsPage = () => {
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const response = await API.get(ROUTES.ADMIN.ANALYTICS);
      setAnalytics(response.data);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !analytics) {
    return <div className="analytics-loading">Loading analytics...</div>;
  }

  const COLORS = ['#4f46e5', '#4338ca', '#ec4899', '#10b981', '#f59e0b'];

  // Prepare pie chart data for revenue by source
  const revenueBySourceData = [
    { name: 'Exams', value: analytics.revenue.bySource.exams },
    { name: 'Files', value: analytics.revenue.bySource.files },
    { name: 'Packages', value: analytics.revenue.bySource.packages }
  ].filter(item => item.value > 0);

  return (
    <div className="page-container analytics-page">
      <div className="analytics-header">
        <div className="header-title">
          <h1>Analytics Dashboard</h1>
          <p>Comprehensive business metrics and insights</p>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="metrics-grid">
        <div className="metric-card balance-highlight">
          <div className="metric-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
            <TrendingUp size={24} />
          </div>
          <div className="metric-content">
            <span className="metric-label">Net Balance</span>
            <span className="metric-value">{(analytics.revenue.netBalance || 0).toLocaleString()} ETB</span>
            <span className="metric-sub">Withdrawable Funds</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon" style={{ background: 'rgba(79, 70, 229, 0.1)', color: '#4f46e5' }}>
            <DollarSign size={24} />
          </div>
          <div className="metric-content">
            <span className="metric-label">Total Revenue</span>
            <span className="metric-value">{analytics.revenue.total.toLocaleString()} ETB</span>
            <span className="metric-sub">Gross Earnings</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
            <CreditCard size={24} />
          </div>
          <div className="metric-content">
            <span className="metric-label">Total Withdrawn</span>
            <span className="metric-value">{(analytics.revenue.totalWithdrawals || 0).toLocaleString()} ETB</span>
            <span className="metric-sub">Successful Payouts</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon" style={{ background: 'rgba(79, 70, 229, 0.1)', color: '#4f46e5' }}>
            <PackageIcon size={24} />
          </div>
          <div className="metric-content">
            <span className="metric-label">Active Subscriptions</span>
            <span className="metric-value">{analytics.subscriptions.active}</span>
            <span className="metric-sub">New this month: {analytics.subscriptions.new}</span>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="charts-grid">
        {/* Revenue Trend Chart */}
        <div className="chart-card full-width">
          <div className="chart-header">
            <h3>Revenue Trend (Last 12 Months)</h3>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analytics.revenue.trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#373d4f" />
                <XAxis dataKey="month" stroke="#8b92ab" />
                <YAxis stroke="#8b92ab" />
                <Tooltip 
                  contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                  labelStyle={{ color: '#e5e7eb' }}
                />
                <Legend />
                <Line type="monotone" dataKey="revenue" stroke="#4f46e5" strokeWidth={2} name="Revenue (ETB)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Revenue by Source - Pie Chart */}
        <div className="chart-card">
          <div className="chart-header">
            <h3>Revenue by Source</h3>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={revenueBySourceData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {revenueBySourceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* User Growth Trend */}
        <div className="chart-card">
          <div className="chart-header">
            <h3>User Growth</h3>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={analytics.users.growthTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#373d4f" />
                <XAxis dataKey="month" stroke="#8b92ab" />
                <YAxis stroke="#8b92ab" />
                <Tooltip 
                  contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                  labelStyle={{ color: '#e5e7eb' }}
                />
                <Area type="monotone" dataKey="users" stroke="#10b981" fill="#10b981" fillOpacity={0.6} name="New Users" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Tables Section */}
      <div className="tables-grid">
        {/* Top Packages */}
        <div className="table-card">
          <div className="table-header">
            <h3>Top Packages</h3>
          </div>
          <table className="mini-table">
            <thead>
              <tr>
                <th>Package Name</th>
                <th>Subscribers</th>
                <th>Revenue</th>
              </tr>
            </thead>
            <tbody>
              {analytics.topPackages.slice(0, 5).map(pkg => (
                <tr key={pkg.id}>
                  <td>{pkg.name}</td>
                  <td>{pkg.subscriberCount}</td>
                  <td>{pkg.revenue.toLocaleString()} ETB</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Recent Transactions */}
        <div className="table-card">
          <div className="table-header">
            <h3>Recent Transactions</h3>
          </div>
          <table className="mini-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {analytics.recentTransactions.slice(0, 5).map(txn => (
                <tr key={txn.id}>
                  <td>{txn.user?.fullName || 'Unknown'}</td>
                  <td>{txn.amount} ETB</td>
                  <td>
                    <span className={`status-badge ${txn.status}`}>{txn.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Recent Withdrawals */}
        <div className="table-card">
          <div className="table-header">
            <h3>Recent Withdrawals</h3>
          </div>
          <table className="mini-table">
            <thead>
              <tr>
                <th>Reference</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {(analytics.withdrawals?.recent || []).slice(0, 5).map(wd => (
                <tr key={wd.id}>
                  <td>{wd.reference}</td>
                  <td>{wd.amount} ETB</td>
                  <td>
                    <span className={`status-badge ${wd.status}`}>{wd.status}</span>
                  </td>
                </tr>
              ))}
              {(analytics.withdrawals?.recent || []).length === 0 && (
                <tr>
                  <td colSpan="3" style={{ textAlign: 'center', py: '20px' }}>No withdrawals yet</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Additional Metrics */}
      <div className="additional-metrics">
        <div className="metric-box">
          <h4>Content Library</h4>
          <div className="metric-stats">
            <div className="stat-item">
              <span className="stat-label">Exams</span>
              <span className="stat-value">{analytics.content.exams}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Files</span>
              <span className="stat-value">{analytics.content.files}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Notes</span>
              <span className="stat-value">{analytics.content.notes}</span>
            </div>
          </div>
        </div>

        <div className="metric-box">
          <h4>Subscriptions</h4>
          <div className="metric-stats">
            <div className="stat-item">
              <span className="stat-label">Active</span>
              <span className="metric-value">{analytics.subscriptions.active}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">New</span>
              <span className="stat-value">{analytics.subscriptions.new}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Expiring Soon</span>
              <span className="stat-value warning">{analytics.subscriptions.expiring}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
