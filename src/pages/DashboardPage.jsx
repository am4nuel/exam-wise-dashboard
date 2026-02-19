import React from 'react';
import { useNavigate, Routes, Route, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import API from '../api/axios';
import ROUTES from '../api/routes';
import UsersPage from './UsersPage';
import ContentPage from './ContentPage';
import PackagesPage from './PackagesPage';
import AnalyticsPage from './AnalyticsPage';
import UniversitiesPage from './UniversitiesPage';
import CoursesPage from './CoursesPage';
import SettingsPage from './SettingsPage';
import TransactionsPage from './TransactionsPage';
import UserDetailPage from './UserDetailPage';
import PackageDetailPage from './PackageDetailPage';
import NotificationsPage from './NotificationsPage';
import DepartmentsPage from './DepartmentsPage';
import DepartmentDetailPage from './DepartmentDetailPage';
import FieldDetailPage from './FieldDetailPage';
import CourseDetailPage from './CourseDetailPage';
import UniversityDetailPage from './UniversityDetailPage';
import BankPaymentsPage from './BankPaymentsPage';

import {
  LineChart, Line, AreaChart, Area, PieChart, Pie, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell
} from 'recharts';

import {
  FileText, 
  Users,
  BookOpen, // Added missing import
  Settings, 
  LogOut, 
  LayoutDashboard,
  Box,
  BarChart3,
  Bell,
  Sun,
  Moon,
  Building2,
  GraduationCap,
  Wallet,
  ArrowDownCircle,
  RefreshCw,
  Banknote,
  CreditCard,
  TrendingUp,
  Receipt,
  Menu,
  X,
  Play,
  Landmark
} from 'lucide-react';
import './DashboardPage.css';

import NotificationPanel from '../components/NotificationPanel';

const Overview = ({ admin, stats, analytics, theme, toggleTheme, loading }) => {
  const COLORS = ['#4f46e5', '#4338ca', '#ec4899', '#10b981', '#f59e0b'];
  


  // Prepare pie chart data
  const revenueBySourceData = analytics ? [
    { name: 'Exams', value: analytics.revenue?.bySource?.exams || 0 },
    { name: 'Files', value: analytics.revenue?.bySource?.files || 0 },
    { name: 'Packages', value: analytics.revenue?.bySource?.packages || 0 }
  ].filter(item => item.value > 0) : [];

  return (
  <div className="page-container overview-page">

    <div className="overview-scroll-area">
      <header className="content-header">
        <div className="header-left">
          <h1>Dashboard Overview</h1>
          <p>Welcome back, {admin?.username}!</p>
        </div>
      </header>

      <section className="dashboard-footer" style={{ marginBottom: '24px' }}>
        <div className="welcome-banner">
          <h2>Ready to manage Exam Wise?</h2>
          <p>You have full access to users, content, and system settings.</p>
        </div>
      </section>

      {!loading && analytics && (
        <>
          <section className="stats-grid">
            {stats.map((stat, idx) => {
              const isFinance = stat.label === 'Net Balance' || stat.label === 'Withdrawals';
              const CardContent = (
                <div className="stat-card">
                  <div className="stat-icon" style={{ backgroundColor: `${stat.color}15`, color: stat.color }}>
                    {stat.icon}
                  </div>
                  <div className="stat-info">
                    <span className="stat-label">{stat.label}</span>
                    <span className="stat-value">{stat.value}</span>
                  </div>
                </div>
              );

              return isFinance ? (
                <Link to="/dashboard/settings" key={idx} onClick={() => {
                  localStorage.setItem('settingsInitialSegment', 'finance');
                }}>
                  {CardContent}
                </Link>
              ) : (
                <div key={idx}>{CardContent}</div>
              );
            })}
          </section>

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
              <div className="table-wrapper">
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
            </div>

            {/* Recent Transactions */}
            <div className="table-card">
              <div className="table-header">
                <h3>Recent Transactions</h3>
              </div>
              <div className="table-wrapper">
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
            </div>
          </div>
        </>
      )}

      {loading && (
        <>
          <section className="stats-grid">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
              <div key={item} className="stat-card skeleton-stat">
                <div className="skeleton-icon pulse" />
                <div className="stat-info">
                  <div className="skeleton-line pulse" style={{ width: '60px', height: '12px', marginBottom: '8px' }} />
                  <div className="skeleton-line pulse" style={{ width: '100px', height: '20px' }} />
                </div>
              </div>
            ))}
          </section>

          <section className="charts-grid">
            <div className="chart-card full-width">
              <div className="skeleton-line pulse" style={{ width: '120px', height: '20px', marginBottom: '20px' }} />
              <div className="skeleton-chart pulse" style={{ height: '300px' }} />
            </div>
            <div className="chart-card">
              <div className="skeleton-line pulse" style={{ width: '120px', height: '20px', marginBottom: '20px' }} />
              <div className="skeleton-chart pulse" style={{ height: '300px' }} />
            </div>
            <div className="chart-card">
              <div className="skeleton-line pulse" style={{ width: '120px', height: '20px', marginBottom: '20px' }} />
              <div className="skeleton-chart pulse" style={{ height: '300px' }} />
            </div>
          </section>
        </>
      )}
    </div>
  </div>
  );
}; 
const DashboardPage = () => {
  const { admin, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  
  // Mobile Sidebar State
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

  // Close sidebar on route change
  React.useEffect(() => {
    setIsSidebarOpen(false);
  }, [location]);

  const [analyticsData, setAnalyticsData] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  
  // Notification State
  const [isNotificationOpen, setIsNotificationOpen] = React.useState(false);
  const [unreadCount, setUnreadCount] = React.useState(0);

  React.useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        const response = await API.get(ROUTES.ADMIN.ANALYTICS);
        setAnalyticsData(response.data);
      } catch (error) {
        console.error('Failed to fetch analytics:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  const stats = analyticsData ? [
    { label: 'Net Balance', value: `ETB ${analyticsData.revenue?.netBalance?.toLocaleString() || 0}`, icon: <CreditCard />, color: '#10b981' },
    { label: 'Total Revenue', value: `ETB ${analyticsData.revenue?.total?.toLocaleString() || 0}`, icon: <TrendingUp />, color: '#4f46e5' },
    { label: 'Withdrawals', value: `ETB ${analyticsData.revenue?.totalWithdrawals?.toLocaleString() || 0}`, icon: <BarChart3 />, color: '#f59e0b' },
    { label: 'Total Users', value: analyticsData.users?.total?.toLocaleString() || 0, icon: <Users />, color: '#4f46e5' },
    { label: 'Packages', value: analyticsData.content?.packages?.toLocaleString() || 0, icon: <Box />, color: '#ec4899' },
    { label: 'Universities', value: analyticsData.content?.universities?.toLocaleString() || 0, icon: <Building2 />, color: '#06b6d4' },
    { label: 'Courses', value: analyticsData.content?.courses?.toLocaleString() || 0, icon: <GraduationCap />, color: '#8b5cf6' },
    { label: 'Exams', value: analyticsData.content?.exams?.toLocaleString() || 0, icon: <FileText />, color: '#ef4444' },
    { label: 'Short Notes', value: analyticsData.content?.notes?.toLocaleString() || 0, icon: <BookOpen />, color: '#14b8a6' },
    { label: 'Files', value: analyticsData.content?.files?.toLocaleString() || 0, icon: <FileText />, color: '#64748b' },
  ] : [];

  return (
    <div className="dashboard-container">
      <NotificationPanel 
        isOpen={isNotificationOpen} 
        onClose={() => setIsNotificationOpen(false)}
        onUnreadCountChange={setUnreadCount}
      />
      {/* Mobile Overlay */}
      <div 
        className={`sidebar-overlay ${isSidebarOpen ? 'open' : ''}`}
        onClick={() => setIsSidebarOpen(false)}
      />

      {/* Sidebar */}
      <aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="logo-badge-sm">EW</div>
          <span>Exam Wise Admin</span>
          <button className="close-sidebar-btn" onClick={() => setIsSidebarOpen(false)}>
            <X size={20} />
          </button>
        </div>
        
        <nav className="sidebar-nav">
          <Link to="/dashboard" className={`nav-item ${location.pathname === '/dashboard' ? 'active' : ''}`}>
            <LayoutDashboard size={20} />
            <span>Overview</span>
          </Link>
          <Link to="/dashboard/users" className={`nav-item ${location.pathname === '/dashboard/users' ? 'active' : ''}`}>
            <Users size={20} />
            <span>Users</span>
          </Link>
          <Link to="/dashboard/packages" className={`nav-item ${location.pathname === '/dashboard/packages' ? 'active' : ''}`}>
            <Box size={20} />
            <span>Packages</span>
          </Link>
          
          <div className="nav-divider" />
          <div className="nav-label">Curriculum</div>

          <Link to="/dashboard/content" className={`nav-item ${location.pathname === '/dashboard/content' ? 'active' : ''}`}>
            <FileText size={20} />
            <span>Content</span>
          </Link>
          <Link to="/dashboard/universities" className={`nav-item ${location.pathname === '/dashboard/universities' ? 'active' : ''}`}>
             <Building2 size={20} />
             <span>Universities</span>
           </Link>
           <Link to="/dashboard/courses" className={`nav-item ${location.pathname === '/dashboard/courses' ? 'active' : ''}`}>
             <GraduationCap size={20} />
             <span>Courses</span>
           </Link>
           <Link to="/dashboard/departments" className={`nav-item ${location.pathname === '/dashboard/departments' ? 'active' : ''}`}>
             <Building2 size={20} />
             <span>Departments</span>
           </Link>
          <div className="nav-divider" />
          <div className="nav-label">Finance</div>
          
          <Link to="/dashboard/transactions" className={`nav-item ${location.pathname === '/dashboard/transactions' ? 'active' : ''}`}>
            <Receipt size={20} />
            <span>Transactions</span>
          </Link>
          <Link to="/dashboard/bank-payments" className={`nav-item ${location.pathname === '/dashboard/bank-payments' ? 'active' : ''}`}>
            <Landmark size={20} />
            <span>Bank Payments</span>
          </Link>
          <Link to="/dashboard/notifications" className={`nav-item ${location.pathname === '/dashboard/notifications' ? 'active' : ''}`}>
            <Bell size={20} />
            <span>Push Notifications</span>
          </Link>

          <div className="nav-divider" />
          <Link to="/dashboard/settings" className={`nav-item ${location.pathname === '/dashboard/settings' ? 'active' : ''}`}>
            <Settings size={20} />
            <span>Settings</span>
          </Link>
        </nav>
      </aside>

      {/* Dynamic Content Area */}
      <main className="main-content">
        <div className="dashboard-top-nav">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button className="menu-btn" onClick={() => setIsSidebarOpen(true)}>
              <Menu size={24} />
            </button>
            <div className="nav-left">
              <h2 style={{ fontSize: '18px', fontWeight: '700', margin: 0, color: 'var(--text-primary)' }}>ExamBank Admin</h2>
            </div>
          </div>
          <div className="nav-right" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
             <button className="icon-btn" onClick={toggleTheme} title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}>
               {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
             </button>
             <button className="icon-btn" style={{ position: 'relative' }} onClick={() => setIsNotificationOpen(true)}>
               <Bell size={20} />
               {unreadCount > 0 && (
                 <span className="badge" style={{ position: 'absolute', top: '8px', right: '8px', width: '8px', height: '8px', background: '#ef4444', borderRadius: '50%', border: '2px solid var(--bg-secondary)' }} />
               )}
             </button>
             
             <div style={{ width: '1px', height: '24px', background: 'var(--border-color)', margin: '0 4px' }} />

             <div className="user-profile" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div className="avatar" style={{ width: '32px', height: '32px', fontSize: '14px' }}>
                  {admin?.username?.charAt(0).toUpperCase()}
                </div>
                <div className="user-info">
                  <span className="username" style={{ fontSize: '13px' }}>{admin?.username}</span>
                </div>
                <button className="logout-btn" onClick={logout} title="Logout" style={{ padding: '6px' }}>
                  <LogOut size={18} />
                </button>
             </div>
          </div>
        </div>

        <div className="dashboard-scroll-area">
          <Routes>
            <Route index element={<Overview admin={admin} stats={stats} analytics={analyticsData} theme={theme} toggleTheme={toggleTheme} loading={loading} />} />

            <Route path="users" element={<UsersPage />} />
            <Route path="users/:id" element={<UserDetailPage />} />
            <Route path="packages" element={<PackagesPage />} />
            <Route path="packages/:id" element={<PackageDetailPage />} />
            <Route path="content" element={<ContentPage />} />
            <Route path="universities" element={<UniversitiesPage />} />
            <Route path="universities/:id" element={<UniversityDetailPage />} />
            <Route path="departments" element={<DepartmentsPage />} />
            <Route path="departments/:id" element={<DepartmentDetailPage />} />
            <Route path="fields/:id" element={<FieldDetailPage />} />
            <Route path="courses" element={<CoursesPage />} />
            <Route path="courses/:id" element={<CourseDetailPage />} />
            <Route path="transactions" element={<TransactionsPage />} />
            <Route path="bank-payments" element={<BankPaymentsPage />} />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Routes>
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;
