import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, User as UserIcon, Phone, Wallet, Calendar, Package, Clock, Loader2, Bell, Send, X, ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import API from '../api/axios';
import ROUTES from '../api/routes';
import AddSubscriptionModal from '../components/AddSubscriptionModal';
import FCMUserModal from '../components/FCMUserModal';
import './DetailPage.css';

const UserDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // User Data State
  const [userData, setUserData] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [isHeaderExpanded, setIsHeaderExpanded] = useState(true);

  // Tab & List State
  const [activeTab, setActiveTab] = useState('subscriptions'); // 'subscriptions' | 'transactions'
  const [listData, setListData] = useState([]);
  const [loadingList, setLoadingList] = useState(false);
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const limit = 5;

  const { addToast } = useToast();
  const [isPushModalOpen, setIsPushModalOpen] = useState(false);
  const [isAddSubModalOpen, setIsAddSubModalOpen] = useState(false);

  // ... (existing useEffects and fetchListData) ... 
  
  // Initial User Fetch
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await API.get(ROUTES.ADMIN.USER_DETAILS(id));
        setUserData(response.data);
      } catch (error) {
        console.error('Failed to fetch user details:', error);
      } finally {
        setLoadingUser(false);
      }
    };
    fetchUser();
  }, [id]);

  // Fetch List Data when Tab or Page changes
  useEffect(() => {
    fetchListData(currentPage);
  }, [activeTab, currentPage, id]);

  const fetchListData = async (page) => {
    setLoadingList(true);
    try {
      let endpoint;
      if (activeTab === 'subscriptions') {
        endpoint = ROUTES.ADMIN.USER_SUBSCRIPTIONS(id);
      } else {
        endpoint = ROUTES.ADMIN.USER_TRANSACTIONS(id);
      }

      const response = await API.get(endpoint, {
        params: { page, limit }
      });
      
      setListData(response.data.data);
      setTotalPages(response.data.pages);
      setTotalItems(response.data.total);
    } catch (error) {
      console.error(`Failed to fetch ${activeTab}:`, error);
    } finally {
      setLoadingList(false);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setCurrentPage(1); // Reset to page 1 on tab switch
    setListData([]);
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return;
    setCurrentPage(newPage);
  };

  if (loadingUser) return <div className="loading-state">Loading user...</div>;
  if (!userData) return <div className="error-state">User not found</div>;

  return (
    <div className="page-container detail-page">
      <header className="detail-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={20} /> Back
        </button>
        <div className="header-info" onClick={() => setIsHeaderExpanded(!isHeaderExpanded)} style={{cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px'}}>
          <div>
            <h1>{userData.fullName}</h1>
            <span className="subtitle">Member since {new Date(userData.createdAt).getFullYear()}</span>
          </div>
          {isHeaderExpanded ? <ChevronUp size={20} color="#6c5dd3" /> : <ChevronDown size={20} color="#6c5dd3" />}
        </div>
        <div className="header-actions">
           <button className="secondary-btn" onClick={() => setIsAddSubModalOpen(true)} style={{marginRight: '10px'}}>
             <Wallet size={18} /> Add Subscription
           </button>
           <button className="primary-btn push-btn" onClick={() => setIsPushModalOpen(true)}>
             <Bell size={18} /> Send Push
           </button>
        </div>
      </header>

      {isHeaderExpanded && (
      <div className="detail-grid">
         {/* ... (existing info cards) ... */}
         {/* Profile Card */}
        <div className="info-card">
          <h3>User Profile</h3>
          <div className="info-row">
            <span className="label"><Phone size={16} /> Phone</span>
            <span className="value">{userData.phoneNumber}</span>
          </div>
          <div className="info-row">
            <span className="label"><UserIcon size={16} /> Gender</span>
            <span className="value">{userData.gender || '-'}</span>
          </div>
          <div className="info-row">
            <span className="label"><Package size={16} /> Academic Field</span>
            <span className="value">{userData.field?.name || 'No Field Set'}</span>
          </div>
          <div className="info-row">
            <span className="label"><Wallet size={16} /> Balance</span>
            <span className="value">{userData.balance || 0} ETB</span>
          </div>
          <div className="info-row">
            <span className="label"><Clock size={16} /> Last Login</span>
            <span className="value">{userData.lastLogin ? new Date(userData.lastLogin).toLocaleDateString() : 'Never'}</span>
          </div>
        </div>

         <div className="stats-card">
          <div className="stat-item">
            <div className="stat-text">
               <span className="stat-label">Member ID: #{userData.id}</span>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* Tabs */}
      <div className="detail-tabs">
        <button 
          className={`tab-btn ${activeTab === 'subscriptions' ? 'active' : ''}`}
          onClick={() => handleTabChange('subscriptions')}
        >
          Subscriptions
        </button>
        <button 
          className={`tab-btn ${activeTab === 'transactions' ? 'active' : ''}`}
          onClick={() => handleTabChange('transactions')}
        >
          Transactions
        </button>
      </div>

      {/* Tab Content */}
      <div className="detail-section">
        {loadingList ? (
           <div className="loading-state"><Loader2 className="animate-spin" /> Loading...</div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              {activeTab === 'subscriptions' ? (
                <>
                  <thead>
                    <tr>
                      <th>Item Name</th>
                      <th>Status</th>
                      <th>Start Date</th>
                      <th>End Date</th>
                      <th>Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {listData.length === 0 ? (
                      <tr><td colSpan="5" className="empty-cell">No subscriptions found</td></tr>
                    ) : (
                      listData.map(sub => {
                        const item = sub.package || sub.exam || sub.file || sub.shortNote || sub.video;
                        const name = item?.name || item?.title || item?.fileName || 'Unknown Item';
                        const price = item?.price || 0;
                        const isPackage = !!sub.package;

                        return (
                        <tr 
                          key={sub.id} 
                          onClick={() => isPackage && navigate(`/dashboard/packages/${sub.package.id}`)} 
                          className={isPackage ? "clickable-row" : ""}
                          style={{ cursor: isPackage ? 'pointer' : 'default' }}
                        >
                          <td>
                            {name} 
                            {!isPackage && <span className="type-badge" style={{marginLeft: '8px', fontSize: '0.8em', opacity: 0.7}}>
                              {sub.exam ? '(Exam)' : sub.file ? '(File)' : sub.shortNote ? '(Note)' : sub.video ? '(Video)' : ''}
                            </span>}
                          </td>
                          <td>
                            <span className={`status-badge ${sub.status}`}>{sub.status}</span>
                          </td>
                          <td>{new Date(sub.startDate).toLocaleDateString()}</td>
                          <td>{new Date(sub.endDate).toLocaleDateString()}</td>
                          <td>{price} ETB</td>
                        </tr>
                        );
                      })
                    )}
                  </tbody>
                </>
              ) : (
                <>
                  <thead>
                    <tr>
                      <th>Reference</th>
                      <th>Type</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {listData.length === 0 ? (
                      <tr><td colSpan="5" className="empty-cell">No transactions found</td></tr>
                    ) : (
                      listData.map(txn => (
                        <tr key={txn.id}>
                          <td>{txn.txRef}</td>
                          <td className="capitalize">{txn.type}</td>
                          <td className={txn.type === 'deposit' ? 'text-green' : 'text-red'}>
                            {txn.type === 'deposit' ? '+' : '-'}{txn.amount} ETB
                          </td>
                          <td>
                            <span className={`status-badge ${txn.status}`}>{txn.status}</span>
                          </td>
                          <td>{new Date(txn.createdAt).toLocaleDateString()}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </>
              )}
            </table>
          </div>
        )}
      </div>

      {/* Pagination Controls - Outside detail-section */}
      {totalItems > 0 && (
        <div className="pagination-footer">
          <div className="pagination-info">
            Showing {(currentPage - 1) * limit + 1} to {Math.min(currentPage * limit, totalItems)} of {totalItems} entries
          </div>
          <div className="pagination-controls">
            <button 
              className="page-btn" 
              disabled={currentPage === 1}
              onClick={() => handlePageChange(currentPage - 1)}
              title="Previous Page"
            >
              <ChevronLeft size={18} />
            </button>
            <button 
              className="page-btn" 
              disabled={currentPage === totalPages}
              onClick={() => handlePageChange(currentPage + 1)}
              title="Next Page"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}

      <FCMUserModal 
        userId={id}
        userName={userData.fullName}
        isOpen={isPushModalOpen}
        onClose={() => setIsPushModalOpen(false)}
      />

      <AddSubscriptionModal
        isOpen={isAddSubModalOpen}
        onClose={() => setIsAddSubModalOpen(false)}
        userId={id}
        onSubscriptionAdded={() => {
            if (activeTab === 'subscriptions') fetchListData(1);
        }}
      />
    </div>
  );
};

export default UserDetailPage;
