import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios';
import ROUTES from '../api/routes';
import { useToast } from '../context/ToastContext';
import { 
  Building2, 
  Plus, 
  Edit2, 
  Trash2, 
  X, 
  Search, 
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import './DepartmentsPage.css';

const DepartmentsPage = () => {
  const { addToast } = useToast();
  const navigate = useNavigate();
  
  // Data State
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const limit = 5;

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' | 'edit'
  const [editingItem, setEditingItem] = useState(null);
  
  // Form Data
  const [form, setForm] = useState({ name: '', code: '', description: '' });
  const [typingTimeout, setTypingTimeout] = useState(null);

  useEffect(() => {
    fetchData(1, '');
  }, []);

  const fetchData = async (pageValue = currentPage, search = searchTerm) => {
    setLoading(true);
    try {
      const response = await API.get(ROUTES.ADMIN.DEPARTMENTS, { 
        params: { page: pageValue, limit, search } 
      });
      setDepartments(response.data.data);
      setTotalPages(response.data.pages);
      setTotalItems(response.data.total);
    } catch (error) {
      addToast('error', 'Failed to fetch departments');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    const term = e.target.value;
    setSearchTerm(term);
    
    // Debounce search
    if (typingTimeout) clearTimeout(typingTimeout);
    setTypingTimeout(setTimeout(() => {
      setCurrentPage(1);
      fetchData(1, term);
    }, 500));
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return;
    setCurrentPage(newPage);
    fetchData(newPage);
  };

  // Helper to generate pagination window
  const getPaginationGroup = () => {
    let start = Math.max(1, currentPage - 2);
    let end = Math.min(totalPages, start + 4);
    
    if (end === totalPages) {
      start = Math.max(1, end - 4);
    }
    
    const pages = [];
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  };

  // --- CRUD ---

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (modalMode === 'add') {
        await API.post(ROUTES.ADMIN.DEPARTMENTS, form);
        addToast('success', 'Department created');
      } else {
        await API.put(ROUTES.ADMIN.UPDATE_DEPARTMENT(editingItem.id), form);
        addToast('success', 'Department updated');
      }
      setShowModal(false);
      fetchData(currentPage);
    } catch (error) {
      addToast('error', error.response?.data?.message || 'Operation failed');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure? This action cannot be undone.')) return;
    try {
      await API.delete(ROUTES.ADMIN.DELETE_DEPARTMENT(id));
      addToast('success', 'Deleted successfully');
      fetchData(currentPage);
    } catch (error) {
      addToast('error', error.response?.data?.message || 'Delete failed');
    }
  };

  const openAddModal = () => {
    setModalMode('add');
    setEditingItem(null);
    setForm({ name: '', code: '', description: '' });
    setShowModal(true);
  };

  const openEditModal = (item) => {
    setModalMode('edit');
    setEditingItem(item);
    setForm({ 
      name: item.name, 
      code: item.code || '', 
      description: item.description || '' 
    });
    setShowModal(true);
  };

  return (
    <div className="page-container departments-page">
       <div className="page-header">
        <div className="header-title">
          <h1>Department Management</h1>
          <p>Manage academic departments across the system</p>
        </div>
        <div className="header-actions">
           <button className="add-btn" onClick={openAddModal}>
            <Plus size={20} />
            <span>Add Department</span>
          </button>
        </div>
      </div>

      {/* Toolbar: Search + Pagination */}
      <div className="table-toolbar">
        <div className="search-container" style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
          <Search className="search-icon" size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#6b7280' }} />
          <input 
            type="text" 
            placeholder="Search Departments..."
            value={searchTerm}
            onChange={handleSearch}
            className="search-input-field"
          />
        </div>

        {/* Top Pagination */}
        {totalItems > 0 && (
          <div className="top-pagination">
             <span className="pagination-text">
              {currentPage} / {totalPages}
            </span>
            <div className="pagination-buttons">
              <button 
                className="page-btn-mini" 
                disabled={currentPage === 1}
                onClick={() => handlePageChange(currentPage - 1)}
              >
                <ChevronLeft size={16} />
              </button>
              <button 
                className="page-btn-mini" 
                disabled={currentPage === totalPages}
                onClick={() => handlePageChange(currentPage + 1)}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>


      {/* Content */}
      <div className="content-table-wrapper">
        <div className="content-table-scroll">
            <table className="content-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Name</th>
                  <th>Description</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i} className="loading-row">
                      <td colSpan="4">
                        <div className="skeleton-bar"></div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <>
                    {departments.map(item => (
                  <tr 
                    key={item.id}
                    onClick={() => navigate(`/dashboard/departments/${item.id}`)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td>
                      <span className="code-badge">{item.code || 'N/A'}</span>
                    </td>
                    <td>
                      <div className="name-cell">
                        <Building2 size={16} />
                        <span>{item.name}</span>
                      </div>
                    </td>
                    <td style={{ maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {item.description || '-'}
                    </td>
                    <td>
                      <div className="action-btns">
                        <button className="action-btn edit" onClick={(e) => { e.stopPropagation(); openEditModal(item); }} title="Edit">
                          <Edit2 size={16} />
                        </button>
                        <button className="action-btn delete" onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }} title="Delete">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                    ))}
                    {departments.length === 0 && (
                      <tr>
                        <td colSpan={4} className="empty-state">
                          No departments found
                        </td>
                      </tr>
                    )}
                  </>
                )}
              </tbody>
            </table>
        </div>
        

      </div>
      
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>{modalMode === 'add' ? 'Add New' : 'Edit'} Department</h2>
              <button className="close-btn" onClick={() => setShowModal(false)}>
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-group">
                <label>Department Name</label>
                <input 
                  type="text" 
                  required 
                  value={form.name}
                  onChange={(e) => setForm({...form, name: e.target.value})}
                  placeholder="e.g. Computer Science"
                />
              </div>
              <div className="form-group">
                <label>Department Code</label>
                <input 
                  type="text" 
                  required 
                  value={form.code}
                  onChange={(e) => setForm({...form, code: e.target.value})}
                  placeholder="e.g. COMP"
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea 
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({...form, description: e.target.value})}
                  placeholder="Brief description of the department"
                />
              </div>
              
              <div className="modal-footer">
                <button type="button" className="cancel-pill" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="save-pill">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DepartmentsPage;
