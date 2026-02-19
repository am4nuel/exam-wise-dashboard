import React, { useState } from 'react';
import API from '../api/axios';
import ROUTES from '../api/routes';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { 
  User, Shield, Moon, Sun, Monitor, 
  Bell, Lock, Database, Globe, Save,
  RefreshCw, Github, Wallet, CreditCard,
  ArrowDownCircle, Banknote, History, CheckCircle, Plus, Trash2, Smartphone, LifeBuoy, Key, ExternalLink, Activity, Edit2, X
} from 'lucide-react';
import BankManagement from '../components/Settings/BankManagement';
import './SettingsPage.css';

const SettingsPage = () => {
  const { admin, updateAdmin } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { addToast } = useToast();
  
  const [activeSegment, setActiveSegment] = useState(() => {
    const saved = localStorage.getItem('settingsInitialSegment');
    localStorage.removeItem('settingsInitialSegment'); // Clear it immediately
    return saved || 'profile';
  });
  const [loading, setLoading] = useState(false);
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState({});
  const [deleteLoading, setDeleteLoading] = useState(null);
  const [banks, setBanks] = useState([]);
  const [withdrawalHistory, setWithdrawalHistory] = useState([]);
  const [financeStats, setFinanceStats] = useState({ balance: 0, totalRevenue: 0, totalWithdrawals: 0 });
  const [versionsData, setVersionsData] = useState({
    androidCurrentVersion: '',
    iosCurrentVersion: '',
    playStoreUrl: '',
    appStoreUrl: ''
  });
  
  // Support Config State
  const [supportData, setSupportData] = useState({
    phoneNumber: '',
    email: '',
    facebookUrl: '',
    telegramUrl: '',
    instagramUrl: '',
    websiteUrl: ''
  });

  // Withdrawal Form State
  const [withdrawData, setWithdrawData] = useState({
    amount: '',
    accountName: '',
    accountNumber: '',
    bankCode: ''
  });
  
  // Profile State
  const [profileData, setProfileData] = useState({
    username: admin?.username || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Platform Settings State (Mock/Local for now until more backend settings added)
  const [platformSettings, setPlatformSettings] = useState({
    maintenanceMode: false,
    autoBackup: true,
    notificationsEnabled: true,
    githubSync: true
  });
  
  // Firebase Keys State
  const [firebaseKeys, setFirebaseKeys] = useState({
    id: '',
    geminiApiKey: '',
    mainApiUrl: ''
  });

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    if (profileData.newPassword && profileData.newPassword !== profileData.confirmPassword) {
      return addToast('error', 'New passwords do not match');
    }

    setLoading(true);
    try {
      const response = await API.put('/admin/profile', {
        username: profileData.username,
        currentPassword: profileData.currentPassword,
        newPassword: profileData.newPassword
      });
      
      addToast('success', response.data.message);
      if (updateAdmin) {
         updateAdmin({ ...admin, username: profileData.username });
      }
      
      setProfileData({ ...profileData, currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      console.error('Update failed:', error);
      addToast('error', error.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const togglePlatformSetting = async (key) => {
    const newVal = !platformSettings[key];
    setPlatformSettings(prev => ({ ...prev, [key]: newVal }));
    
    try {
      await API.put('/admin/platform-settings', { [key]: newVal });
      addToast('success', `${key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())} updated`);
    } catch (error) {
      console.error('Update platform setting failed:', error);
      addToast('error', 'Failed to update setting');
      // Rollback
      setPlatformSettings(prev => ({ ...prev, [key]: !newVal }));
    }
  };

  const handleUploadPathChange = async (path) => {
    setPlatformSettings(prev => ({ ...prev, bankReceiptUploadPath: path }));
    try {
      await API.put('/admin/platform-settings', { bankReceiptUploadPath: path });
      addToast('success', 'Upload path updated');
    } catch (error) {
      console.error('Update upload path failed:', error);
      addToast('error', 'Failed to update upload path');
    }
  };

  const fetchPlatformSettings = async () => {
    try {
      const response = await API.get('/admin/platform-settings');
      if (response.data) {
        setPlatformSettings(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch platform settings:', error);
    }
  };

  const fetchFinanceData = async () => {
    try {
      const [banksRes, historyRes, statsRes] = await Promise.all([
        API.get('/admin/banks'),
        API.get('/admin/withdrawals'),
        API.get('/admin/stats')
      ]);
      
      const { banks: banksData, defaultAccountName } = banksRes.data;
      setBanks(banksData || []);
      
      if (defaultAccountName) {
        setWithdrawData(prev => ({ ...prev, accountName: defaultAccountName }));
      }

      setWithdrawalHistory(historyRes.data);
      setFinanceStats({
        balance: statsRes.data.balance,
        totalRevenue: statsRes.data.revenue,
        totalWithdrawals: statsRes.data.withdrawals
      });
    } catch (error) {
      console.error('Failed to fetch finance data:', error);
    }
  };

  const fetchVersions = async () => {
    try {
      const response = await API.get('/admin/versions');
      if (response.data) {
        setVersionsData({
          androidCurrentVersion: response.data.androidCurrentVersion || '',
          iosCurrentVersion: response.data.iosCurrentVersion || '',
          playStoreUrl: response.data.playStoreUrl || '',
          appStoreUrl: response.data.appStoreUrl || ''
        });
      }
    } catch (error) {
      console.error('Failed to fetch versions:', error);
      addToast('error', 'Failed to fetch version info');
    }
  };

  const fetchFirebaseKeys = async () => {
    try {
      const response = await API.get(ROUTES.ADMIN.FIREBASE_CONFIGS);
      setFirebaseKeys(prev => ({ ...prev, ...response.data }));
    } catch (error) {
      console.error('Failed to fetch firebase keys:', error);
      addToast('error', 'Failed to fetch firebase keys');
    }
  };

  const fetchSupport = async () => {
    try {
      const response = await API.get('/admin/support');
      if (response.data) {
        setSupportData(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch support config:', error);
      addToast('error', 'Failed to fetch support info');
    }
  };

  const handleVersionsUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await API.put('/admin/versions', versionsData);
      addToast('success', 'App versions updated successfully');
    } catch (error) {
      console.error('Update versions failed:', error);
      addToast('error', 'Failed to update versions');
    } finally {
      setLoading(false);
    }
  };

  const handleSupportUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await API.put('/admin/support', supportData);
      addToast('success', 'Support settings updated successfully');
    } catch (error) {
      console.error('Update support failed:', error);
      addToast('error', 'Failed to update support settings');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (activeSegment === 'finance') {
      fetchFinanceData();
    } else if (activeSegment === 'versions') {
      fetchVersions();
    } else if (activeSegment === 'support') {
      fetchSupport();
    } else if (activeSegment === 'keys') {
      fetchFirebaseKeys();
    } else if (activeSegment === 'platform') {
      fetchPlatformSettings();
    }
  }, [activeSegment]);

  const handleWithdraw = async (e) => {
    e.preventDefault();
    if (!withdrawData.amount || !withdrawData.accountNumber || !withdrawData.bankCode) {
      return addToast('error', 'Please fill all required fields');
    }

    // Auto-format phone number for mobile providers
    let formattedAccount = withdrawData.accountNumber;
    if (formattedAccount.startsWith('251') && formattedAccount.length === 12) {
      formattedAccount = '0' + formattedAccount.slice(3);
    } else if (formattedAccount.startsWith('+251') && formattedAccount.length === 13) {
      formattedAccount = '0' + formattedAccount.slice(4);
    }

    const selectedBank = banks.find(b => b.id.toString() === withdrawData.bankCode.toString());
    const payload = {
      ...withdrawData,
      accountNumber: formattedAccount,
      bankName: selectedBank ? selectedBank.name : 'Unknown Bank'
    };

    setWithdrawLoading(true);
    try {
      const response = await API.post('/admin/withdraw', payload);
      addToast('success', response.data.message || 'Withdrawal initiated successfully!');
      setWithdrawData({ amount: '', accountName: '', accountNumber: '', bankCode: '' });
      fetchFinanceData();
    } catch (error) {
      console.error('Withdrawal failed:', error.response?.data || error.message);
      addToast('error', error.response?.data?.message || 'Withdrawal failed. Please check platform balance.');
    } finally {
      setWithdrawLoading(false);
    }
  };

  const handleDeleteWithdrawal = async (id) => {
    if (!window.confirm('Are you sure you want to delete this withdrawal record? This will also remove the associated transaction.')) {
      return;
    }

    setDeleteLoading(id);
    try {
      await API.delete(ROUTES.ADMIN.DELETE_WITHDRAWAL(id));
      
      // Remove from local state
      setWithdrawalHistory(prev => prev.filter(w => w.id !== id));
      addToast('success', 'Withdrawal record deleted');
      
      // Refresh stats as they might have changed
      fetchFinanceData();
    } catch (error) {
      console.error('Delete withdrawal error:', error);
      addToast('error', 'Failed to delete withdrawal');
    } finally {
      setDeleteLoading(null);
    }
  };

  const handleVerifyWithdrawal = async (reference) => {
    setVerifyLoading(prev => ({ ...prev, [reference]: true }));
    try {
      const response = await API.get(`/admin/withdrawals/verify/${reference}`);
      addToast('success', `Status: ${response.data.status}`);
      fetchFinanceData();
    } catch (error) {
      console.error('Verification failed:', error.response?.data || error.message);
      addToast('error', error.response?.data?.message || 'Verification failed');
    } finally {
      setVerifyLoading(prev => ({ ...prev, [reference]: false }));
    }
  };

  // Firebase Key Handlers
  const handleKeysUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await API.put(ROUTES.ADMIN.FIREBASE_CONFIGS, firebaseKeys);
      addToast('success', 'Firebase keys updated successfully');
    } catch (error) {
      console.error('Keys update failed:', error);
      addToast('error', error.response?.data?.message || 'Failed to update keys');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container settings-page">
      <header className="page-header">
        <div className="header-title">
          <h1>Settings</h1>
          <p>Manage your account and platform preferences</p>
        </div>
      </header>

      <div className="settings-grid">
        {/* Navigation Sidebar */}
        <div className="settings-nav">
          <button 
            className={`settings-nav-item ${activeSegment === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveSegment('profile')}
          >
            <User size={18} />
            <span>Profile & Security</span>
          </button>
          <button 
            className={`settings-nav-item ${activeSegment === 'platform' ? 'active' : ''}`}
            onClick={() => setActiveSegment('platform')}
          >
            <Database size={18} />
            <span>Platform Config</span>
          </button>
          <button 
            className={`settings-nav-item ${activeSegment === 'finance' ? 'active' : ''}`}
            onClick={() => setActiveSegment('finance')}
          >
            <Wallet size={18} />
            <span>Finance & Payouts</span>
          </button>
          <button 
            className={`settings-nav-item ${activeSegment === 'versions' ? 'active' : ''}`}
            onClick={() => setActiveSegment('versions')}
          >
            <Smartphone size={18} />
            <span>App Versions</span>
          </button>
          <button 
            className={`settings-nav-item ${activeSegment === 'support' ? 'active' : ''}`}
            onClick={() => setActiveSegment('support')}
          >
            <LifeBuoy size={18} />
            <span>Support & Links</span>
          </button>
          <button 
            className={`settings-nav-item ${activeSegment === 'keys' ? 'active' : ''}`}
            onClick={() => setActiveSegment('keys')}
          >
            <Key size={18} />
            <span>Key Management</span>
          </button>
          <button 
            className={`settings-nav-item ${activeSegment === 'bank' ? 'active' : ''}`}
            onClick={() => setActiveSegment('bank')}
          >
            <Banknote size={18} />
            <span>Bank Accounts</span>
          </button>
          <button 
            className={`settings-nav-item ${activeSegment === 'appearance' ? 'active' : ''}`}
            onClick={() => setActiveSegment('appearance')}
          >
            <Monitor size={18} />
            <span>Appearance</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="settings-content">
          <div className="settings-card">
            {activeSegment === 'profile' && (
              <form onSubmit={handleProfileUpdate} className="settings-section">
                <div className="settings-section-header">
                  <h3>Admin Profile</h3>
                  <p>Update your credentials and account security</p>
                </div>

                <div className="form-grid">
                  <div className="form-row">
                    <div className="form-group">
                      <label>Username</label>
                      <div className="input-with-icon">
                        <User size={16} />
                        <input 
                          type="text" 
                          value={profileData.username}
                          onChange={(e) => setProfileData({...profileData, username: e.target.value})}
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label>Current Password</label>
                      <div className="input-with-icon">
                        <Lock size={16} />
                        <input 
                          type="password" 
                          placeholder="Required to change password"
                          value={profileData.currentPassword}
                          onChange={(e) => setProfileData({...profileData, currentPassword: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="form-divider" />

                  <div className="form-row">
                    <div className="form-group">
                      <label>New Password</label>
                      <div className="input-with-icon">
                        <Lock size={16} />
                        <input 
                          type="password" 
                          placeholder="Leave blank to keep current"
                          value={profileData.newPassword}
                          onChange={(e) => setProfileData({...profileData, newPassword: e.target.value})}
                        />
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Confirm New Password</label>
                      <div className="input-with-icon">
                        <Shield size={16} />
                        <input 
                          type="password" 
                          value={profileData.confirmPassword}
                          onChange={(e) => setProfileData({...profileData, confirmPassword: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="section-footer">
                  <button type="submit" className="save-btn" disabled={loading}>
                    {loading ? <RefreshCw className="animate-spin" size={18} /> : <Save size={18} />}
                    <span>Save Profile Changes</span>
                  </button>
                </div>
              </form>
            )}

            {activeSegment === 'platform' && (
              <div className="settings-section">
                <div className="settings-section-header">
                  <h3>Platform Configuration</h3>
                  <p>Control global behaviors of the ExamBank platform</p>
                </div>

                <div className="toggle-list">
                  <div className="toggle-item">
                    <div className="toggle-info">
                      <h4>Maintenance Mode</h4>
                      <p>Stop all user access for server maintenance</p>
                    </div>
                    <label className="switch">
                      <input 
                        type="checkbox" 
                        checked={platformSettings.maintenanceMode}
                        onChange={() => togglePlatformSetting('maintenanceMode')}
                      />
                      <span className="slider round"></span>
                    </label>
                  </div>

                  <div className="toggle-item">
                    <div className="toggle-info">
                      <h4>GitHub Auto-Sync</h4>
                      <p>Automatically sync files from GitHub repositories</p>
                    </div>
                    <label className="switch">
                      <input 
                        type="checkbox" 
                        checked={platformSettings.githubSync}
                        onChange={() => togglePlatformSetting('githubSync')}
                      />
                      <span className="slider round"></span>
                    </label>
                  </div>

                  <div className="toggle-item">
                    <div className="toggle-info">
                      <h4>Database Auto-Backup</h4>
                      <p>Schedule daily database snapshots</p>
                    </div>
                    <label className="switch">
                      <input 
                        type="checkbox" 
                        checked={platformSettings.autoBackup}
                        onChange={() => togglePlatformSetting('autoBackup')}
                      />
                      <span className="slider round"></span>
                    </label>
                  </div>

                  <div className="toggle-item">
                    <div className="toggle-info">
                      <h4>Push Notifications</h4>
                      <p>Send mobile notifications for new packages</p>
                    </div>
                    <label className="switch">
                      <input 
                        type="checkbox" 
                        checked={platformSettings.notificationsEnabled}
                        onChange={() => togglePlatformSetting('notificationsEnabled')}
                      />
                      <span className="slider round"></span>
                    </label>
                  </div>

                  <div className="form-divider" />
                  
                  <div className="config-item">
                    <div className="config-info">
                      <h4>Bank Receipt Upload Path</h4>
                      <p>Choose where to store user-uploaded payment receipts</p>
                    </div>
                    <div className="path-selector">
                      <select 
                        value={platformSettings.bankReceiptUploadPath || 'server'}
                        onChange={(e) => handleUploadPathChange(e.target.value)}
                        className="settings-select"
                      >
                        <option value="server">Local Server (/uploads/receipts)</option>
                        <option value="github">GitHub Storage (am4nuel/store*)</option>
                      </select>
                    </div>
                  </div>

                  {platformSettings.bankReceiptUploadPath === 'github' && (
                    <div className="github-info-box animate-slide-down">
                       <Github size={16} />
                       <div>
                         <p>Using GitHub Repositories:</p>
                         <div className="repo-list">
                            {['am4nuel/store1', 'am4nuel/store2', 'am4nuel/store3', '...'].map(r => <span key={r} className="repo-tag">{r}</span>)}
                         </div>
                       </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeSegment === 'finance' && (
              <div className="settings-section finance-section">
                <div className="settings-section-header">
                  <h3>Finance & Payouts</h3>
                  <p>Manage your earnings and withdraw funds to your bank account</p>
                </div>

                <div className="finance-overview">
                  <div className="balance-card primary">
                    <div className="card-label">Available Balance</div>
                    <div className="card-value">ETB {financeStats.balance?.toLocaleString()}</div>
                    <div className="card-sub">Total Revenue: ETB {financeStats.totalRevenue?.toLocaleString()}</div>
                  </div>
                  <div className="balance-card secondary">
                    <div className="card-label">Total Withdrawn</div>
                    <div className="card-value">ETB {financeStats.totalWithdrawals?.toLocaleString()}</div>
                    <div className="card-sub">Completed Payouts</div>
                  </div>
                </div>

                <div className="finance-grid">
                  <form onSubmit={handleWithdraw} className="payout-form">
                    <h4>Request Withdrawal</h4>
                    <div className="form-group">
                      <label>Select Bank</label>
                      <select 
                        value={withdrawData.bankCode}
                        onChange={(e) => setWithdrawData({...withdrawData, bankCode: e.target.value})}
                      >
                        <option value="">Choose a bank...</option>
                        {banks.map(bank => (
                          <option key={bank.id} value={bank.id}>{bank.name}</option>
                        ))}
                      </select>
                    </div>

                    {withdrawData.bankCode && (
                      <div className="conditional-fields animate-slide-down">
                        <div className="form-group">
                          <label>Account Holder Name</label>
                          <input 
                            type="text" 
                            placeholder="John Doe"
                            value={withdrawData.accountName}
                            onChange={(e) => setWithdrawData({...withdrawData, accountName: e.target.value})}
                          />
                        </div>
                        <div className="form-group">
                          <label>Account Number</label>
                          <input 
                            type="text" 
                            placeholder="1000..."
                            value={withdrawData.accountNumber}
                            onChange={(e) => setWithdrawData({...withdrawData, accountNumber: e.target.value})}
                          />
                        </div>
                        <div className="form-group">
                          <label>Amount (ETB)</label>
                          <input 
                            type="number" 
                            placeholder="Min 1 ETB"
                            value={withdrawData.amount}
                            onChange={(e) => setWithdrawData({...withdrawData, amount: e.target.value})}
                          />
                        </div>
                        <button type="submit" className="withdraw-btn" disabled={withdrawLoading}>
                          {withdrawLoading ? <RefreshCw className="animate-spin" size={18} /> : <ArrowDownCircle size={18} />}
                          <span>Withdraw Funds</span>
                        </button>
                      </div>
                    )}
                  </form>

                  <div className="payout-history">
                    <div className="history-header">
                      <h4>Withdrawal History</h4>
                      <History size={16} />
                    </div>
                    <div className="history-list">
                      {withdrawalHistory.length === 0 ? (
                        <div className="empty-history">No withdrawals yet</div>
                      ) : (
                        withdrawalHistory.map(item => (
                          <div key={item.id} className="history-item">
                            <div className="item-info">
                              <div className="item-header">
                                <span className="item-amount">ETB {parseFloat(item.amount).toLocaleString()}</span>
                                <div className="status-container">
                                  <span className={`item-status ${item.status}`}>{item.status}</span>
                                  {item.status === 'pending' && (
                                    <button 
                                      className="verify-mini-btn"
                                      onClick={() => handleVerifyWithdrawal(item.reference)}
                                      disabled={verifyLoading[item.reference]}
                                    >
                                      {verifyLoading[item.reference] ? <RefreshCw className="animate-spin" size={12} /> : <CheckCircle size={12} />}
                                      <span>Verify</span>
                                    </button>
                                  )}
                                  <button 
                                    className="delete-mini-btn"
                                    onClick={() => handleDeleteWithdrawal(item.id)}
                                    disabled={deleteLoading === item.id}
                                    title="Delete Record"
                                  >
                                    {deleteLoading === item.id ? <RefreshCw className="animate-spin" size={12} /> : <Trash2 size={12} />}
                                  </button>
                                </div>
                              </div>
                              <div className="item-details">
                                <span className="item-bank">{item.bankName || 'Unknown Bank'}</span>
                                <span className="item-acc">{item.accountNumber}</span>
                              </div>
                              <div className="item-footer">
                                <span className="item-ref">{item.reference}</span>
                                <span className="item-date">{new Date(item.createdAt).toLocaleDateString()}</span>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSegment === 'versions' && (
              <form onSubmit={handleVersionsUpdate} className="settings-section">
                <div className="settings-section-header">
                  <h3>App Versions & Links</h3>
                  <p>Manage required app versions and store URLs</p>
                </div>

                <div className="form-grid">
                  <div className="form-row">
                    <div className="form-group">
                      <label>Android Version</label>
                      <div className="input-with-icon">
                        <Smartphone size={16} />
                        <input 
                          type="text" 
                          placeholder="e.g. 1.0.0"
                          value={versionsData.androidCurrentVersion}
                          onChange={(e) => setVersionsData({...versionsData, androidCurrentVersion: e.target.value})}
                        />
                      </div>
                    </div>
                    <div className="form-group">
                      <label>iOS Version</label>
                      <div className="input-with-icon">
                        <Smartphone size={16} />
                        <input 
                          type="text" 
                          placeholder="e.g. 1.0.0"
                          value={versionsData.iosCurrentVersion}
                          onChange={(e) => setVersionsData({...versionsData, iosCurrentVersion: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Play Store URL</label>
                    <div className="input-with-icon">
                      <Globe size={16} />
                      <input 
                        type="url" 
                        placeholder="https://play.google.com/..."
                        value={versionsData.playStoreUrl}
                        onChange={(e) => setVersionsData({...versionsData, playStoreUrl: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>App Store URL</label>
                    <div className="input-with-icon">
                      <Globe size={16} />
                      <input 
                        type="url" 
                        placeholder="https://apps.apple.com/..."
                        value={versionsData.appStoreUrl}
                        onChange={(e) => setVersionsData({...versionsData, appStoreUrl: e.target.value})}
                      />
                    </div>
                  </div>
                </div>

                <div className="section-footer">
                  <button type="submit" className="save-btn" disabled={loading}>
                    {loading ? <RefreshCw className="animate-spin" size={18} /> : <Save size={18} />}
                    <span>Save Version Info</span>
                  </button>
                </div>
              </form>
            )}

            {activeSegment === 'support' && (
              <form onSubmit={handleSupportUpdate} className="settings-section">
                <div className="settings-section-header">
                  <h3>Support & Social Links</h3>
                  <p>Update contact information and social media links displayed in the app</p>
                </div>

                <div className="form-grid">
                  <div className="form-group">
                     <label>Support Phone Number</label>
                     <div className="input-with-icon">
                       <Smartphone size={16} />
                       <input 
                         type="text" 
                         placeholder="+251..."
                         value={supportData.phoneNumber}
                         onChange={(e) => setSupportData({...supportData, phoneNumber: e.target.value})}
                       />
                     </div>
                  </div>
                  
                  <div className="form-group">
                     <label>Support Email</label>
                     <div className="input-with-icon">
                       <LifeBuoy size={16} />
                       <input 
                         type="email" 
                         placeholder="support@examwise.com"
                         value={supportData.email}
                         onChange={(e) => setSupportData({...supportData, email: e.target.value})}
                       />
                     </div>
                  </div>

                  <div className="form-divider" />

                  <div className="form-group">
                    <label>Facebook URL</label>
                    <div className="input-with-icon">
                      <Globe size={16} />
                      <input 
                        type="url" 
                        placeholder="https://facebook.com/..."
                        value={supportData.facebookUrl}
                        onChange={(e) => setSupportData({...supportData, facebookUrl: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Telegram URL</label>
                    <div className="input-with-icon">
                      <Globe size={16} />
                      <input 
                        type="url" 
                        placeholder="https://t.me/..."
                        value={supportData.telegramUrl}
                        onChange={(e) => setSupportData({...supportData, telegramUrl: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Instagram URL</label>
                    <div className="input-with-icon">
                      <Globe size={16} />
                      <input 
                        type="url" 
                        placeholder="https://instagram.com/..."
                        value={supportData.instagramUrl}
                        onChange={(e) => setSupportData({...supportData, instagramUrl: e.target.value})}
                      />
                    </div>
                  </div>
                  
                  <div className="form-group">
                    <label>Website URL</label>
                    <div className="input-with-icon">
                      <Globe size={16} />
                      <input 
                        type="text" 
                        placeholder="example.com"
                        value={supportData.websiteUrl}
                        onChange={(e) => setSupportData({...supportData, websiteUrl: e.target.value})}
                      />
                    </div>
                  </div>
                </div>

                <div className="section-footer">
                  <button type="submit" className="save-btn" disabled={loading}>
                    {loading ? <RefreshCw className="animate-spin" size={18} /> : <Save size={18} />}
                    <span>Save Support Info</span>
                  </button>
                </div>
              </form>
            )}

            {activeSegment === 'keys' && (
              <form onSubmit={handleKeysUpdate} className="settings-section">
                <div className="settings-section-header">
                  <h3>App & AI Key Management</h3>
                  <p>Manage your Gemini API Key and Main API URL stored in Firestore</p>
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label>Gemini API Key</label>
                    <div className="input-with-icon">
                      <Key size={16} />
                      <input 
                        type="password" 
                        placeholder="AIzaSy..."
                        value={firebaseKeys.geminiApiKey}
                        onChange={(e) => setFirebaseKeys({...firebaseKeys, geminiApiKey: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Main API URL (Ngrok or Domain)</label>
                    <div className="input-with-icon">
                      <Globe size={16} />
                      <input 
                        type="url" 
                        placeholder="https://your-api.com"
                        value={firebaseKeys.mainApiUrl}
                        onChange={(e) => setFirebaseKeys({...firebaseKeys, mainApiUrl: e.target.value})}
                      />
                    </div>
                  </div>
                </div>

                <div className="section-footer">
                  <button type="submit" className="save-btn" disabled={loading}>
                    {loading ? <RefreshCw className="animate-spin" size={18} /> : <Save size={18} />}
                    <span>Save Application Keys</span>
                  </button>
                </div>
              </form>
            )}
            {activeSegment === 'bank' && <BankManagement />}

            {activeSegment === 'appearance' && (
              <div className="settings-section">
                <div className="settings-section-header">
                  <h3>Appearance Settings</h3>
                  <p>Customize how the dashboard looks and feels</p>
                </div>

                <div className="appearance-options">
                  <div className="theme-toggle-large">
                    <button 
                      className={`theme-box ${theme === 'light' ? 'active' : ''}`}
                      onClick={() => theme !== 'light' && toggleTheme()}
                    >
                      <Sun size={32} />
                      <span>Light Mode</span>
                    </button>
                    <button 
                      className={`theme-box ${theme === 'dark' ? 'active' : ''}`}
                      onClick={() => theme !== 'dark' && toggleTheme()}
                    >
                      <Moon size={32} />
                      <span>Dark Mode</span>
                    </button>
                  </div>

                  <div className="appearance-info">
                    <div className="info-item">
                      <Monitor size={18} />
                      <span>Interface Font: <b>Inter (System Default)</b></span>
                    </div>
                    <div className="info-item">
                      <Globe size={18} />
                      <span>System Language: <b>English (US)</b></span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

    </div>

  );
};

export default SettingsPage;
