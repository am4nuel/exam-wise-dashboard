import React, { useState, useEffect } from 'react';
import API from '../api/axios';
import ROUTES from '../api/routes';
import { useToast } from '../context/ToastContext';
import { 
  Send, Users, User, Bell, 
  Search, Loader2, Info, AlertTriangle
} from 'lucide-react';
import './NotificationsPage.css';

const NotificationsPage = () => {
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState('broadcast'); // 'broadcast' or 'individual'
  
  // Form State
  const [formData, setFormData] = useState({
    title: '',
    body: '',
    userId: '',
    data: {}
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Users for individual targeting
  const [users, setUsers] = useState([]);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [isUsersLoading, setIsUsersLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    if (activeTab === 'individual' && users.length === 0) {
      fetchUsers();
    }
  }, [activeTab]);

  const fetchUsers = async (search = '') => {
    setIsUsersLoading(true);
    try {
      // Reusing the general users endpoint, but maybe with a search query
      const response = await API.get(ROUTES.ADMIN.USERS, { 
        params: { limit: 50, search: search } 
      });
      setUsers(response.data.data);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      addToast('error', 'Failed to load user list');
    } finally {
      setIsUsersLoading(false);
    }
  };

  const handleUserSearch = (e) => {
    const term = e.target.value;
    setUserSearchTerm(term);
    // Simple debounce/on-enter could be added here, but for now just filter locally or fetch
    if (term.length > 2) {
       fetchUsers(term);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.body) {
      addToast('warning', 'Please fill in both title and message');
      return;
    }

    if (activeTab === 'individual' && !formData.userId) {
      addToast('warning', 'Please select a recipient user');
      return;
    }

    setIsSubmitting(true);
    try {
      const endpoint = activeTab === 'broadcast' ? ROUTES.ADMIN.SEND_BROADCAST : ROUTES.ADMIN.SEND_PUSH;
      const payload = activeTab === 'broadcast' 
        ? { title: formData.title, body: formData.body, data: formData.data }
        : { userId: formData.userId, title: formData.title, body: formData.body, data: formData.data };

      await API.post(endpoint, payload);
      addToast('success', 'Notification sent successfully!');
      
      // Clear message but keep recipient if individual (case of wanting to send another message)
      setFormData(prev => ({ ...prev, title: '', body: '' }));
    } catch (error) {
      console.error('Push error:', error);
      addToast('error', error.response?.data?.message || 'Failed to send notification');
    } finally {
      setIsSubmitting(true); // Wait, should be false
      setIsSubmitting(false);
    }
  };

  const selectRecipient = (user) => {
    setSelectedUser(user);
    setFormData(prev => ({ ...prev, userId: user.id }));
    setUserSearchTerm('');
  };

  return (
    <div className="page-container notifications-page">
      <header className="page-header">
        <div className="header-title">
          <h1>Push Notifications</h1>
          <p>Send real-time alerts to mobile app users</p>
        </div>
      </header>

      <div className="notifications-grid">
        <div className="notification-form-card glass">
          <div className="tabs">
            <button 
              className={`tab-btn ${activeTab === 'broadcast' ? 'active' : ''}`}
              onClick={() => setActiveTab('broadcast')}
            >
              <Users size={18} />
              Broadcast to All
            </button>
            <button 
              className={`tab-btn ${activeTab === 'individual' ? 'active' : ''}`}
              onClick={() => setActiveTab('individual')}
            >
              <User size={18} />
              Target Individual
            </button>
          </div>

          <form onSubmit={handleSend} className="push-form">
            {activeTab === 'individual' && (
              <div className="form-group recipient-group">
                <label>Recipient User</label>
                {selectedUser ? (
                  <div className="selected-user-badge">
                    <div className="user-details">
                      <span className="user-name">{selectedUser.fullName}</span>
                      <span className="user-phone">{selectedUser.phoneNumber}</span>
                    </div>
                    <button type="button" onClick={() => setSelectedUser(null)} className="remove-selection">
                      Change
                    </button>
                  </div>
                ) : (
                  <div className="user-selector">
                    <div className="search-input">
                      <Search size={16} />
                      <input 
                        type="text" 
                        placeholder="Search users by name..." 
                        value={userSearchTerm}
                        onChange={handleUserSearch}
                      />
                    </div>
                    {userSearchTerm && (
                      <div className="user-dropdown">
                        {isUsersLoading ? (
                          <div className="dropdown-loading"><Loader2 className="animate-spin" size={16} /></div>
                        ) : users.length > 0 ? (
                           users.map(u => (
                             <div key={u.id} className="dropdown-item" onClick={() => selectRecipient(u)}>
                               <span className="name">{u.fullName}</span>
                               <span className="phone">{u.phoneNumber}</span>
                             </div>
                           ))
                        ) : (
                          <div className="dropdown-empty">No users found</div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="form-group">
              <label>Notification Title</label>
              <input 
                type="text" 
                placeholder="e.g., New Exam Added!" 
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                required
              />
            </div>

            <div className="form-group">
              <label>Message Body</label>
              <textarea 
                placeholder="What do you want to tell the users?"
                rows={4}
                value={formData.body}
                onChange={(e) => setFormData({...formData, body: e.target.value})}
                required
              />
            </div>

            <div className="form-info">
              <Info size={16} />
              <p>
                {activeTab === 'broadcast' 
                  ? "This message will be sent to every user with the app installed." 
                  : "This message will only be sent to the selected user's device."}
              </p>
            </div>

            <button type="submit" className="send-btn" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Sending...
                </>
              ) : (
                <>
                  <Send size={20} />
                  {activeTab === 'broadcast' ? 'Send Broadcast' : 'Send to User'}
                </>
              )}
            </button>
          </form>
        </div>

        <div className="preview-card glass">
          <div className="card-header">
            <h3>App Preview</h3>
          </div>
          <div className="phone-mockup">
            <div className="notification-bubble pulse-shadow">
              <div className="nb-header">
                <Bell size={14} fill="#4f46e5" color="#4f46e5" />
                <span>Exam Wise</span>
                <span className="time">now</span>
              </div>
              <div className="nb-content">
                <strong>{formData.title || 'Notification Title'}</strong>
                <p>{formData.body || 'This is how your message will appear on the user\'s lock screen.'}</p>
              </div>
            </div>
          </div>
          
          <div className="warning-box">
             <AlertTriangle size={20} color="#f59e0b" />
             <div>
               <h4>Important Note</h4>
               <p>Broadcasts take a few seconds to propagate. Avoid sending duplicate messages in quick succession.</p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationsPage;
