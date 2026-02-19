import React, { useEffect, useState } from 'react';
import { X, Bell, Info, CheckCircle, AlertTriangle, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios';
import './NotificationPanel.css';

const NotificationPanel = ({ isOpen, onClose, onUnreadCountChange }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await API.get('/admin/notifications');
      setNotifications(response.data.notifications);
      if (onUnreadCountChange) {
        onUnreadCountChange(response.data.unreadCount);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  // Poll for new notifications every minute
  useEffect(() => {
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleMarkAsRead = async (id, link) => {
    try {
      await API.put(`/admin/notifications/${id}/read`);
      // Update local state
      setNotifications(prev => prev.map(n => 
        n.id === id ? { ...n, isRead: true } : n
      ));
      if (onUnreadCountChange) {
        onUnreadCountChange(prev => Math.max(0, prev - 1));
      }
      if (link) {
        navigate(link);
        onClose();
      }
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await API.post('/admin/notifications/mark-all-read');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      if (onUnreadCountChange) {
        onUnreadCountChange(0);
      }
    } catch (error) {
      console.error('Failed to mark all read:', error);
    }
  };

  if (!isOpen) return null;

  const getIcon = (type) => {
    switch (type) {
      case 'success': return <CheckCircle size={16} color="#10b981" />;
      case 'warning': return <AlertTriangle size={16} color="#f59e0b" />;
      case 'error': return <AlertCircle size={16} color="#ef4444" />;
      default: return <Info size={16} color="#6366f1" />;
    }
  };

  const getBgColor = (type) => {
    switch (type) {
      case 'success': return 'rgba(16, 185, 129, 0.1)';
      case 'warning': return 'rgba(245, 158, 11, 0.1)';
      case 'error': return 'rgba(239, 68, 68, 0.1)';
      default: return 'rgba(99, 102, 241, 0.1)';
    }
  };

  // Format relative time (e.g. "2 hours ago")
  const formatTime = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = (now - date) / 1000; // seconds

    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)} mins ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
    return date.toLocaleDateString();
  };

  return (
    <>
      <div className="notification-backdrop" onClick={onClose} />
      <div className="notification-panel">
        <header className="notifications-header">
          <h3>
            <Bell size={18} /> Notifications
          </h3>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </header>

        <div className="notifications-list">
          {loading && notifications.length === 0 ? (
            <div className="empty-state">Loading...</div>
          ) : notifications.length === 0 ? (
            <div className="empty-state">No notifications yet</div>
          ) : (
            notifications.map(notif => (
              <div 
                key={notif.id} 
                className={`notification-item ${!notif.isRead ? 'unread' : ''}`}
                onClick={() => handleMarkAsRead(notif.id, notif.actionLink)}
              >
                <div className="notif-icon-wrapper" style={{ background: getBgColor(notif.type) }}>
                  {getIcon(notif.type)}
                </div>
                <div className="notif-content">
                  <div className="notif-title">{notif.title}</div>
                  <div className="notif-message">{notif.message}</div>
                  <div className="notif-time">{formatTime(notif.createdAt)}</div>
                </div>
              </div>
            ))
          )}
        </div>

        {notifications.length > 0 && (
          <footer className="notifications-footer">
            <button className="mark-read-btn" onClick={handleMarkAllRead}>
              Mark all as read
            </button>
          </footer>
        )}
      </div>
    </>
  );
};

export default NotificationPanel;
