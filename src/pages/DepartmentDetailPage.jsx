import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../api/axios';
import ROUTES from '../api/routes';
import { useToast } from '../context/ToastContext';
import { 
  Building2, 
  ArrowLeft, 
  BookOpen, 
  ChevronRight, 
  Edit2, 
  Trash2, 
  Plus, 
  X,
  ChevronLeft
} from 'lucide-react';
import './DetailPage.css';

const DepartmentDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();
  
  const [department, setDepartment] = useState(null);
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(true);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const limit = 10;

  // Stats
  const [stats, setStats] = useState({ fields: 0 });

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' | 'edit'
  const [editingItem, setEditingItem] = useState(null);
  const [fieldForm, setFieldForm] = useState({ name: '', code: '', description: '' });

  useEffect(() => {
    fetchData();
  }, [id, currentPage]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch department details
      const deptResponse = await API.get(`${ROUTES.ADMIN.DEPARTMENTS}/${id}`);
      setDepartment(deptResponse.data);

      // Fetch fields under this department with pagination
      const fieldsResponse = await API.get(ROUTES.ADMIN.FIELDS, {
        params: { 
          departmentId: id, 
          page: currentPage, 
          limit 
        }
      });
      setFields(fieldsResponse.data.data || []);
      setTotalPages(fieldsResponse.data.pages || 1);
      setTotalItems(fieldsResponse.data.total || 0);

      // Update stats
      setStats({ fields: fieldsResponse.data.total });

    } catch (error) {
      addToast('error', 'Failed to fetch department details');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const openAddModal = () => {
    setModalMode('add');
    setFieldForm({ name: '', code: '', description: '' });
    setShowModal(true);
  };

  const openEditModal = (field) => {
    setModalMode('edit');
    setEditingItem(field);
    setFieldForm({
      name: field.name,
      code: field.code || '',
      description: field.description || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (fieldId) => {
    if (window.confirm('Are you sure you want to delete this field? This will also delete all courses within it.')) {
      try {
        await API.delete(`${ROUTES.ADMIN.FIELDS}/${fieldId}`);
        addToast('success', 'Field deleted successfully');
        fetchData(); // Refresh
      } catch (error) {
        addToast('error', 'Failed to delete field');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...fieldForm, departmentId: id }; // Ensure departmentId set
      
      if (modalMode === 'add') {
        await API.post(ROUTES.ADMIN.FIELDS, payload);
        addToast('success', 'Field created successfully');
      } else {
        await API.put(`${ROUTES.ADMIN.FIELDS}/${editingItem.id}`, payload);
        addToast('success', 'Field updated successfully');
      }
      setShowModal(false);
      fetchData();
    } catch (error) {
      addToast('error', 'Failed to save field');
      console.error(error);
    }
  };

  const traversePages = (start, end) => {
    const pages = [];
    for (let i = start; i <= end; i++) {
        pages.push(i);
    }
    return pages;
  };

  const getPaginationGroup = () => {
    let start = Math.floor((currentPage - 1) / 5) * 5;
    return traversePages(start + 1, Math.min(start + 5, totalPages));
  };


  if (loading && !department) {
    return <div className="loading-state">Loading department details...</div>;
  }

  if (!department) {
    return <div className="error-state">Department not found</div>;
  }

  return (
    <div className="detail-page">
      <div className="detail-nav-bar">
        <button className="back-btn" onClick={() => navigate('/dashboard/departments')}>
          <ArrowLeft size={20} />
          <span>Back to Departments</span>
        </button>
      </div>

      <div className="detail-header">
        <div className="detail-title-section">
          <div className="detail-icon">
            <Building2 size={32} />
          </div>
          <div>
            <h1>{department.name}</h1>
            <p className="detail-subtitle">{department.code}</p>
            {department.description && (
              <p className="detail-description">{department.description}</p>
            )}
          </div>
        </div>
      </div>

      <div className="detail-content">
        <div className="stats-grid" style={{ marginBottom: '32px' }}>
           <div className="stats-card">
            <div className="stat-item">
              <div className="stat-icon">
                <BookOpen size={24} />
              </div>
              <div className="stat-text">
                <span className="stat-value">{stats.fields}</span>
                <span className="stat-label">Total Fields</span>
              </div>
            </div>
           </div>
        </div>

        <div className="detail-section">
          <div className="section-header">
            <h2>Fields in this Department</h2>
            <button className="primary-btn" onClick={openAddModal}>
              <Plus size={18} />
              <span>Add Field</span>
            </button>
          </div>

          <div className="content-table-wrapper">
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
                  {fields.length === 0 ? (
                    <tr><td colSpan={4} className="empty-state">No fields found</td></tr>
                  ) : (
                    fields.map(field => (
                      <tr 
                        key={field.id} 
                        onClick={() => navigate(`/dashboard/fields/${field.id}`)}
                        style={{ cursor: 'pointer' }}
                      >
                        <td><span className="code-badge">{field.code || '-'}</span></td>
                        <td><b>{field.name}</b></td>
                        <td className="truncate-cell">{field.description || '-'}</td>
                        <td>
                          <div className="action-btns">
                            <button className="action-btn edit" onClick={(e) => { e.stopPropagation(); openEditModal(field); }} title="Edit Field">
                              <Edit2 size={16} />
                            </button>
                            <button className="action-btn delete" onClick={(e) => { e.stopPropagation(); handleDelete(field.id); }} title="Remove Field">
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
               </tbody>
             </table>
          </div>

          {/* Pagination */}
          {totalItems > 0 && (
            <div className="pagination-footer">
              <div className="pagination-info">
                Showing <span>{(currentPage - 1) * limit + 1}</span> to <span>{Math.min(currentPage * limit, totalItems)}</span> of <span>{totalItems}</span>
              </div>
              <div className="pagination-controls">
                <button 
                  className="page-btn" 
                  disabled={currentPage === 1}
                  onClick={() => handlePageChange(currentPage - 1)}
                >
                  <ChevronLeft size={18} />
                </button>
                
                 <div className="page-numbers">
                  {getPaginationGroup().map((item, index) => (
                    <button 
                      key={index}
                      className={`page-num ${currentPage === item ? 'active' : ''}`}
                      onClick={() => handlePageChange(item)}
                    >
                      {item}
                    </button>
                  ))}
                </div>

                <button 
                  className="page-btn" 
                  disabled={currentPage === totalPages}
                  onClick={() => handlePageChange(currentPage + 1)}
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>{modalMode === 'add' ? 'Add New' : 'Edit'} Field</h2>
              <button className="close-btn" onClick={() => setShowModal(false)}>
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-group">
                <label>Field Name</label>
                <input 
                  type="text" 
                  required 
                  value={fieldForm.name}
                  onChange={(e) => setFieldForm({...fieldForm, name: e.target.value})}
                  placeholder="e.g. Software Engineering"
                />
              </div>
              <div className="form-group">
                <label>Field Code</label>
                <input 
                  type="text" 
                  value={fieldForm.code}
                  onChange={(e) => setFieldForm({...fieldForm, code: e.target.value})}
                  placeholder="e.g. SE"
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea 
                  rows={3}
                  value={fieldForm.description}
                  onChange={(e) => setFieldForm({...fieldForm, description: e.target.value})}
                  placeholder="Brief description of the field..."
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="cancel-btn" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="submit-btn">{modalMode === 'add' ? 'Create' : 'Save Changes'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DepartmentDetailPage;
