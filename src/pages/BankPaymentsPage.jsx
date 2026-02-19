import React, { useState, useEffect } from 'react';
import { db } from '../config/firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import API from '../api/axios';
import { useToast } from '../context/ToastContext';
import { 
  CheckCircle, XCircle, Eye, Clock, 
  ExternalLink, User, Phone, Banknote, Calendar
} from 'lucide-react';
import './BankPaymentsPage.css';

const BankPaymentsPage = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [activeTab, setActiveTab] = useState('request');
  const [currentPage, setCurrentPage] = useState(1);
  const [actionLoading, setActionLoading] = useState(false);
  const itemsPerPage = 10;
  const { addToast } = useToast();

  useEffect(() => {
    const q = query(collection(db, 'bank_payment_requests'), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate()
      }));
      setRequests(data);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching requests: ", error);
      addToast('error', 'Failed to load payment requests');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [addToast]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab]);

  const filteredRequests = requests.filter(req => {
    if (activeTab === 'request') return req.status === 'pending';
    return req.status === activeTab;
  });

  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);
  const paginatedRequests = filteredRequests.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleApprove = async () => {
    if (!selectedRequest) return;
    
    setActionLoading(true);
    try {
      await API.post('/admin/bank-payments/approve', {
        requestId: selectedRequest.id,
        txRef: selectedRequest.txRef,
        userId: selectedRequest.userId,
        amount: selectedRequest.amount,
        itemType: selectedRequest.itemType,
        itemId: selectedRequest.itemId,
        packageId: selectedRequest.packageId,
        selectedItems: selectedRequest.selectedItems,
        items: selectedRequest.items
      });
      
      addToast('success', 'Payment approved successfully');
      setSelectedRequest(null);
    } catch (error) {
      console.error('Approval failed:', error);
      addToast('error', error.response?.data?.message || 'Failed to approve payment');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDecline = async () => {
    if (!selectedRequest) return;
    
    const reason = prompt("Enter reason for declining:");
    if (reason === null) return; // User cancelled prompt

    setActionLoading(true);
    try {
      await API.post('/admin/bank-payments/decline', {
        requestId: selectedRequest.id,
        userId: selectedRequest.userId,
        reason: reason
      });
      
      addToast('success', 'Payment declined');
      setSelectedRequest(null);
    } catch (error) {
      console.error('Decline failed:', error);
      addToast('error', error.response?.data?.message || 'Failed to decline payment');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved': return <span className="status-badge approved"><CheckCircle size={14}/> Approved</span>;
      case 'declined': return <span className="status-badge declined"><XCircle size={14}/> Declined</span>;
      default: return <span className="status-badge pending"><Clock size={14}/> Pending</span>;
    }
  };

  return (
    <div className="page-container bank-payments-page">
      <header className="content-header">
        <div className="header-left">
          <h1>Bank Payments</h1>
          <p>Review and verify manual bank transfer receipts</p>
        </div>
      </header>

      <div className="tabs-container">
        <button 
          className={`tab-item ${activeTab === 'request' ? 'active' : ''}`}
          onClick={() => setActiveTab('request')}
        >
          Requests
          {requests.filter(r => r.status === 'pending').length > 0 && (
            <span className="count-badge">{requests.filter(r => r.status === 'pending').length}</span>
          )}
        </button>
        <button 
          className={`tab-item ${activeTab === 'approved' ? 'active' : ''}`}
          onClick={() => setActiveTab('approved')}
        >
          Approved
        </button>
        <button 
          className={`tab-item ${activeTab === 'declined' ? 'active' : ''}`}
          onClick={() => setActiveTab('declined')}
        >
          Declined
        </button>
      </div>

      <div className="requests-table-container card">
        {loading ? (
          <div className="table-loader">Loading requests...</div>
        ) : requests.length === 0 ? (
          <div className="empty-state">No payment requests found</div>
        ) : (
          <div className="table-responsive">
            <table className="main-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>User</th>
                  <th>Amount</th>
                  <th>Bank</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedRequests.map(req => (
                  <tr key={req.id}>
                    <td>{req.createdAt?.toLocaleDateString()}</td>
                    <td>
                      <div className="user-info-cell">
                        <span className="user-name">{req.userFullName}</span>
                        <span className="user-phone">{req.userPhone}</span>
                      </div>
                    </td>
                    <td className="amount-cell">{req.amount} ETB</td>
                    <td>{req.bankName}</td>
                    <td>{getStatusBadge(req.status)}</td>
                    <td>
                      <button className="icon-btn" title="View Receipt" onClick={() => setSelectedRequest(req)}>
                        <Eye size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="pagination-container card">
          <div className="pagination-info">
            Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredRequests.length)} of {filteredRequests.length} results
          </div>
          <div className="pagination-actions">
            <button 
              className="page-btn" 
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => prev - 1)}
            >
              Previous
            </button>
            <div className="page-numbers">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button 
                  key={page}
                  className={`page-num ${currentPage === page ? 'active' : ''}`}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </button>
              ))}
            </div>
            <button 
              className="page-btn" 
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => prev + 1)}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {selectedRequest && (
        <div className="modal-overlay" onClick={() => !actionLoading && setSelectedRequest(null)}>
          <div className="review-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Verify Payment Receipt</h3>
              <button className="close-btn" onClick={() => setSelectedRequest(null)} disabled={actionLoading}><XCircle /></button>
            </div>
            
            <div className="modal-content">
              <div className="receipt-view">
                <img src={selectedRequest.receiptImageUrl.startsWith('http') ? selectedRequest.receiptImageUrl : `${API.defaults.baseURL.replace('/api', '')}${selectedRequest.receiptImageUrl}`} alt="Receipt" />
                <a href={selectedRequest.receiptImageUrl.startsWith('http') ? selectedRequest.receiptImageUrl : `${API.defaults.baseURL.replace('/api', '')}${selectedRequest.receiptImageUrl}`} target="_blank" rel="noreferrer" className="external-link">
                  Open Original <ExternalLink size={14}/>
                </a>
              </div>
              
              <div className="request-details">
                <div className="detail-section">
                  <h4><User size={16}/> User Information</h4>
                  <p><strong>Name:</strong> {selectedRequest.userFullName}</p>
                  <p><strong>Phone:</strong> {selectedRequest.userPhone}</p>
                  <p><strong>User ID:</strong> {selectedRequest.userId}</p>
                </div>
                
                <div className="detail-section">
                  <h4><Banknote size={16}/> Payment Information</h4>
                  <p><strong>Amount:</strong> {selectedRequest.amount} ETB</p>
                  <p><strong>Bank:</strong> {selectedRequest.bankName}</p>
                  <p><strong>Acc Number:</strong> {selectedRequest.accountNumber}</p>
                  <p><strong>Reference:</strong> {selectedRequest.txRef}</p>
                </div>

                <div className="detail-section">
                  <h4><Calendar size={16}/> Purchase Details</h4>
                  <p><strong>Type:</strong> {selectedRequest.itemType || (selectedRequest.packageId ? 'Package' : 'Cart')}</p>
                  {selectedRequest.itemId && <p><strong>Item ID:</strong> {selectedRequest.itemId}</p>}
                  {selectedRequest.packageId && <p><strong>Package ID:</strong> {selectedRequest.packageId}</p>}
                </div>
              </div>
            </div>

            {selectedRequest.status === 'pending' && (
              <div className="modal-footer">
                <button className="decline-btn" onClick={handleDecline} disabled={actionLoading}>
                   Decline Request
                </button>
                <button className="approve-btn" onClick={handleApprove} disabled={actionLoading}>
                   {actionLoading ? 'Processing...' : 'Approve Payment'}
                </button>
              </div>
            )}
            
            {selectedRequest.status !== 'pending' && (
              <div className="modal-footer status-info">
                 This request has already been {selectedRequest.status}.
                 {selectedRequest.declineReason && <div className="reason">Reason: {selectedRequest.declineReason}</div>}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default BankPaymentsPage;
