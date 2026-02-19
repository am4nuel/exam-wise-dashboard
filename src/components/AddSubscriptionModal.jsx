
import React, { useState, useEffect } from 'react';
import { X, Search, Check, Loader2, Package, FileText, Video, File, StickyNote, ChevronLeft, ChevronRight } from 'lucide-react';
import API from '../api/axios';
import ROUTES from '../api/routes';
import { useToast } from '../context/ToastContext';
import './AddSubscriptionModal.css';

const AddSubscriptionModal = ({ isOpen, onClose, userId, onSubscriptionAdded }) => {
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState('packages');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [submitting, setSubmitting] = useState(null);
  const [existingSubs, setExistingSubs] = useState(new Set());

  useEffect(() => {
    if (isOpen) {
      fetchExistingSubscriptions();
    }
  }, [isOpen, userId]);

  useEffect(() => {
    if (isOpen) {
      fetchItems();
    }
  }, [isOpen, activeTab, page, searchTerm, existingSubs]); // Depend on existingSubs to re-filter if needed

  const fetchExistingSubscriptions = async () => {
    try {
      // Fetch all active subscriptions for checking (limit 1000 to be safe)
      const response = await API.get(ROUTES.ADMIN.USER_SUBSCRIPTIONS(userId), { 
        params: { limit: 1000, status: 'active' } 
      });
      const subs = response.data.data || [];
      const subSet = new Set();
      
      subs.forEach(sub => {
        if (sub.packageId) subSet.add(`package_${sub.packageId}`);
        else if (sub.itemType && sub.itemId) subSet.add(`${sub.itemType === 'note' ? 'notes' : sub.itemType + 's'}_${sub.itemId}`);
      });
      
      setExistingSubs(subSet);
    } catch (error) {
      console.error('Failed to fetch existing subscriptions:', error);
    }
  };

  const fetchItems = async () => {
    setLoading(true);
    try {
      let endpoint;
      let params = { page, limit: 12, search: searchTerm };
      let typeKey = activeTab; // 'packages', 'exams', 'files', 'notes', 'videos'

      switch (activeTab) {
        case 'packages': endpoint = ROUTES.ADMIN.PACKAGES; break;
        case 'exams': endpoint = ROUTES.ADMIN.EXAMS; break;
        case 'files': endpoint = ROUTES.ADMIN.FILES; break;
        case 'notes': endpoint = ROUTES.ADMIN.SHORT_NOTES; break;
        case 'videos': endpoint = ROUTES.ADMIN.VIDEOS; break;
        default: endpoint = ROUTES.ADMIN.PACKAGES;
      }

      const response = await API.get(endpoint, { params });
      
      // Filter out existing subscriptions
      // Map tab name to item type prefix used in existingSubs set
      // packages -> package
      // exams -> exams (based on my logic above)
      // logic above: package -> package_{id}
      // item -> {itemType}s_{id} (e.g. exams_1, files_2)
      // Note: backend 'itemType' for 'notes' is 'note' or 'shortNote'. 
      // In fetchExistingSubscriptions: sub.itemType === 'note' ? 'notes' ...
      
      const allItems = response.data.data;
      const filteredItems = allItems.filter(item => {
        let key = '';
        if (activeTab === 'packages') key = `package_${item.id}`;
        else key = `${activeTab}_${item.id}`; // exams_1, files_1, notes_1, videos_1
        
        return !existingSubs.has(key);
      });

      setItems(filteredItems);
      setTotalPages(response.data.pages);
    } catch (error) {
      console.error('Failed to fetch items:', error);
      addToast('error', 'Failed to load items');
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (item) => {
    setSubmitting(item.id);
    try {
      const payload = {
        startDate: new Date(),
        endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)) // Default 1 month
      };

      if (activeTab === 'packages') {
        payload.packageId = item.id;
      } else {
        payload.itemId = item.id;
        // Map tab to itemType
        const typeMap = {
            'exams': 'exam',
            'files': 'file',
            'notes': 'shortNote', // Backend expects 'note' or 'shortNote', we handled normalize in backend
            'videos': 'video'
        };
        payload.itemType = typeMap[activeTab];
      }

      await API.post(ROUTES.ADMIN.ADD_USER_SUBSCRIPTION(userId), payload);
      
      // Update local existingSubs to hide the item immediately
      const key = activeTab === 'packages' ? `package_${item.id}` : `${activeTab}_${item.id}`;
      setExistingSubs(prev => new Set(prev).add(key));
      
      addToast('success', 'Subscription added successfully');
      if (onSubscriptionAdded) onSubscriptionAdded();
    } catch (error) {
      console.error('Failed to add subscription:', error);
      addToast('error', error.response?.data?.message || 'Failed to add subscription');
    } finally {
      setSubmitting(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay full-screen">
      <div className="modal-content full-screen-content">
        <header className="modal-header">
          <h2>Add Subscription</h2>
          <button className="close-btn" onClick={onClose}><X size={24} /></button>
        </header>
        
        <div className="modal-body">
          <div className="tabs-container">
            {[
              { id: 'packages', label: 'Packages', icon: Package },
              { id: 'exams', label: 'Exams', icon: FileText },
              { id: 'files', label: 'Files', icon: File },
              { id: 'notes', label: 'Notes', icon: StickyNote },
              { id: 'videos', label: 'Videos', icon: Video },
            ].map(tab => (
              <button
                key={tab.id}
                className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => { setActiveTab(tab.id); setPage(1); setSearchTerm(''); }}
              >
                <tab.icon size={18} /> {tab.label}
              </button>
            ))}
          </div>

          <div className="search-bar-container">
            <div className="search-input-wrapper">
              <Search size={20} />
              <input 
                type="text" 
                placeholder={`Search ${activeTab}...`} 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="items-grid-container">
            {loading ? (
              <div className="loading-state"><Loader2 className="animate-spin" size={40} /></div>
            ) : items.length === 0 ? (
                <div className="empty-state">No items found</div>
            ) : (
              <div className="items-grid">
                {items.map(item => (
                  <div key={item.id} className="item-card">
                    <div className="item-info">
                      <h3>{item.name || item.title || item.fileName}</h3>
                      <p className="item-meta">
                        {item.price > 0 ? `${item.price} ETB` : 'Free'}
                        {activeTab === 'packages' && ` • ${item.items?.length || 0} Items`}
                      </p>
                    </div>
                    <button 
                      className="add-btn" 
                      disabled={submitting === item.id}
                      onClick={() => handleSubscribe(item)}
                    >
                      {submitting === item.id ? <Loader2 className="animate-spin" size={16} /> : 'Add'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {items.length > 0 && (
            <div className="pagination-footer">
               <span>Page {page} of {totalPages}</span>
               <div className="pagination-controls">
                 <button disabled={page === 1} onClick={() => setPage(p => p - 1)}><ChevronLeft /></button>
                 <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)}><ChevronRight /></button>
               </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default AddSubscriptionModal;
