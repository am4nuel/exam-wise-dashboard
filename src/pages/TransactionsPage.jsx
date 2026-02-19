import React, { useState, useEffect } from 'react';
import API from '../api/axios';
import ROUTES from '../api/routes';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { 
  Search, Filter, ChevronLeft, ChevronRight, 
  ArrowUpRight, ArrowDownLeft, RefreshCw, FileText 
} from 'lucide-react';
import './TransactionsPage.css';

const TransactionsPage = () => {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    total: 0,
    limit: 20
  });

  const [filters, setFilters] = useState({
    search: '',
    type: '',
    status: ''
  });

  // Debounce search
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(filters.search);
    }, 500);
    return () => clearTimeout(timer);
  }, [filters.search]);

  const fetchTransactions = async (page = 1) => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page,
        limit: pagination.limit,
        search: debouncedSearch,
        type: filters.type,
        status: filters.status
      });

      const response = await API.get(`${ROUTES.ADMIN.TRANSACTIONS}?${queryParams}`);
      
      setTransactions(response.data.data);
      setPagination(prev => ({
        ...prev,
        page: response.data.currentPage,
        totalPages: response.data.pages,
        total: response.data.total
      }));
    } catch (error) {
      console.error('Fetch transactions error:', error);
      addToast('error', 'Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions(1); // Reset to page 1 on filter change
  }, [debouncedSearch, filters.type, filters.status]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchTransactions(newPage);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'success';
      case 'pending': return 'warning';
      case 'failed': return 'danger';
      default: return 'default';
    }
  };

  const getTypeIcon = (type) => {
    return type === 'credit' ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />;
  };

  return (
    <div className="page-container transactions-page">
      <div className="page-header">
        <div className="header-title">
          <h2>Transactions</h2>
          <p>Manage and monitor all financial activities</p>
        </div>
        <div className="header-actions">
          <button className="refresh-btn" onClick={() => fetchTransactions(pagination.page)}>
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      <div className="filters-bar">
        <div className="search-group">
          <Search size={18} />
          <input 
            type="text" 
            placeholder="Search by Reference..." 
            value={filters.search}
            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
          />
        </div>
        
        <div className="filter-group">
          <div className="select-wrapper">
            <Filter size={16} />
            <select 
              value={filters.type} 
              onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
            >
              <option value="">All Types</option>
              <option value="credit">Deposit (Credit)</option>
              <option value="debit">Withdrawal (Debit)</option>
            </select>
          </div>

          <div className="select-wrapper">
            <select 
              value={filters.status} 
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
            >
              <option value="">All Statuses</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        </div>
      </div>

      <div className="content-table-wrapper">
        <div className="content-table-scroll">
          <table className="content-table">
            <thead>
              <tr>
                <th>Reference</th>
                <th>User</th>
                <th>Type</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Date</th>
                <th>Reason/Details</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="loading-row">
                    <td colSpan="7"><div className="skeleton-bar"></div></td>
                  </tr>
                ))
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan="7" className="empty-state">
                    <FileText size={48} />
                    <p>No transactions found matching your filters</p>
                  </td>
                </tr>
              ) : (
                transactions.map(tx => (
                  <tr key={tx.id}>
                    <td className="col-ref">
                      <span className="ref-code">{tx.txRef}</span>
                    </td>
                    <td className="col-user">
                      {tx.user ? (
                        <div className="user-info">
                          <span className="user-name">{tx.user.fullName}</span>
                          <span className="user-phone">{tx.user.phoneNumber}</span>
                        </div>
                      ) : (
                        <span className="admin-label">System/Admin</span>
                      )}
                    </td>
                    <td className={`col-type ${tx.type}`}>
                      <div className="type-badge">
                        {getTypeIcon(tx.type)}
                        <span>{tx.type === 'credit' ? 'Deposit' : 'Withdrawal'}</span>
                      </div>
                    </td>
                    <td className={`col-amount ${tx.type}`}>
                      {tx.type === 'credit' ? '+' : '-'} ETB {parseFloat(tx.amount).toLocaleString()}
                    </td>
                    <td className="col-status">
                      <span className={`status-badge ${getStatusColor(tx.status)}`}>
                        {tx.status}
                      </span>
                    </td>
                    <td className="col-date">
                      {new Date(tx.createdAt).toLocaleString()}
                    </td>
                    <td className="col-reason">
                      {tx.reason || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {pagination.total > 0 && (
          <div className="pagination-footer">
            <div className="pagination-info">
                Showing <b>{transactions.length}</b> of <b>{pagination.total}</b> results
            </div>
            <div className="pagination-controls">
              <button 
                className="page-btn"
                disabled={pagination.page === 1}
                onClick={() => handlePageChange(pagination.page - 1)}
                title="Previous Page"
              >
                <ChevronLeft size={18} />
              </button>
              <div className="page-numbers">
                <span className="page-num active">{pagination.page}</span>
                <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>of {pagination.totalPages}</span>
              </div>
              <button 
                className="page-btn"
                disabled={pagination.page === pagination.totalPages}
                onClick={() => handlePageChange(pagination.page + 1)}
                title="Next Page"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TransactionsPage;
