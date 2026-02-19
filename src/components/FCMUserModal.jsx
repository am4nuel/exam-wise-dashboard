import React, { useState } from 'react';
import { X, Send, Loader2 } from 'lucide-react';
import API from '../api/axios';
import ROUTES from '../api/routes';
import { useToast } from '../context/ToastContext';

const FCMUserModal = ({ userId, userName, isOpen, onClose }) => {
  const { addToast } = useToast();
  const [isSendingPush, setIsSendingPush] = useState(false);
  const [pushData, setPushData] = useState({ title: '', body: '' });

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!pushData.title || !pushData.body) return addToast('warning', 'Please fill all fields');
    
    setIsSendingPush(true);
    try {
      await API.post(ROUTES.ADMIN.SEND_PUSH, {
        userId: userId,
        title: pushData.title,
        body: pushData.body
      });
      addToast('success', 'Notification sent!');
      onClose();
      setPushData({ title: '', body: '' });
    } catch (error) {
      addToast('error', error.response?.data?.message || 'Failed to send notification');
    } finally {
      setIsSendingPush(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content glass" style={{ maxWidth: '500px' }}>
        <div className="modal-header">
          <h2>Send Push to {userName}</h2>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="push-form">
          <div className="form-group">
            <label>Title</label>
            <input 
              type="text" 
              value={pushData.title}
              onChange={(e) => setPushData({...pushData, title: e.target.value})}
              placeholder="e.g., Update Available"
              required
            />
          </div>
          <div className="form-group">
            <label>Message</label>
            <textarea 
              value={pushData.body}
              onChange={(e) => setPushData({...pushData, body: e.target.value})}
              placeholder="Enter message for user..."
              rows={4}
              required
            />
          </div>
          <div className="modal-footer">
            <button type="button" className="cancel-btn" onClick={onClose}>Cancel</button>
            <button type="submit" className="submit-btn" disabled={isSendingPush}>
              {isSendingPush ? <Loader2 className="animate-spin" size={18} /> : <><Send size={18} /> Send Now</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FCMUserModal;
